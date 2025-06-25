import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import supabase from "./utils/supabase";
import "./App.css";

function App() {
  const [excelData, setExcelData] = useState([]);

  useEffect(() => {
    fetchDataFromSupabase();
  }, []);

  async function fetchDataFromSupabase() {
    const { data: registrations, error } = await supabase
      .from("registrations")
      .select("*, attendees(*)");

    if (error) {
      console.error("Error fetching data:", error);
      return;
    }

    // Flatten registrations for display
    const flattened = registrations.flatMap((reg) => {
      const base = {
        "Submission Date": reg.submission_date,
        "Registration Type": reg.registration_type,
        "First Name": reg.first_name,
        "Last Name": reg.last_name,
        Email: reg.email,
        "Company / Institution": reg.company,
        "Total Cost": reg.total_cost,
        "Payment Option": reg.payment_options,
      };

      if (reg.attendees.length > 0) {
        return reg.attendees.map((att) => ({
          ...base,
          ...{
            "Attendee First Name": att.first_name,
            "Attendee Last Name": att.last_name,
            "Attendee Email": att.email,
            "Job Position": att.position,
            Designation: att.designation,
            Country: att.country,
            Trainings: att.trainings,
            Subtotal: att.subtotal,
          },
        }));
      } else {
        return [
          {
            ...base,
            "Attendee First Name": reg.first_name,
            "Attendee Last Name": reg.last_name,
            "Attendee Email": reg.email,
            "Job Position": reg.position,
            Designation: reg.designation,
            Country: reg.country,
            Trainings: reg.trainings,
            Subtotal: reg.total_cost,
          },
        ];
      }
    });

    setExcelData(flattened);
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    if (!file || !validTypes.includes(file.type)) {
      Swal.fire({
        title: "Error!",
        text: "Invalid or missing file.",
        icon: "error",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const arrayBuffer = evt.target.result;
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        const normalized = normalizeExcelDataFromArray(data);

        await purgeSupabaseData();
        await uploadToSupabase(normalized);
        await fetchDataFromSupabase();

        Swal.fire("Success!", "Data uploaded to Supabase.", "success");
      } catch (err) {
        console.error(err);
        Swal.fire("Error!", "Failed to process Excel file.", "error");
      }
    };

    reader.readAsArrayBuffer(file);
  }

  async function purgeSupabaseData() {
    await supabase.from("attendees").delete().neq("id", 0);
    await supabase.from("registrations").delete().neq("id", 0);
  }

  async function uploadToSupabase(data) {
    for (const row of data) {
      const { Attendees = [], ...regData } = row;
      const { data: reg, error } = await supabase
        .from("registrations")
        .insert([
          {
            submission_date: regData["Submission Date"],
            registration_type: regData["Registration Type"],
            first_name: regData["First Name"],
            last_name: regData["Last Name"],
            email: regData["Email"],
            company: regData["Company / Institution"],
            position: regData["Job Position"],
            designation: regData["Designation"],
            country: regData["Country"],
            trainings: regData["Trainings"],
            total_cost: regData["Total Cost"],
            payment_options: regData["Payment Option"],
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Insert error:", error);
        continue;
      }

      if (Attendees.length > 0) {
        const mapped = Attendees.map((a) => ({
          registration_id: reg.id,
          first_name: a["First Name"],
          last_name: a["Last Name"],
          email: a["Email"],
          position: a["Job Position"],
          designation: a["Designation"],
          country: a["Country"],
          trainings: a["Trainings"],
          subtotal:
            parseFloat(
              (a["Subtotal"] || "").toString().replace(/[^0-9.]/g, "")
            ) || 0,
        }));

        const { error: attErr } = await supabase
          .from("attendees")
          .insert(mapped);
        if (attErr) console.error("Attendee insert error:", attErr);
      }
    }
  }

  function parseCurrency(value) {
    if (typeof value === "string") {
      const cleaned = value.replace(/[^0-9.-]+/g, ""); // removes $, commas, etc.
      const number = parseFloat(cleaned);
      return isNaN(number) ? null : number;
    }
    return value;
  }

  function normalizeExcelDataFromArray(data) {
    const [headers, ...rows] = data;
    const normalized = [];

    rows.forEach((row) => {
      const rowObj = Object.fromEntries(headers.map((key, i) => [key, row[i]]));
      const regType = rowObj["SELECT YOUR REGISTRATION TYPE"]?.trim();
      const isGroup = regType === "Someone Else / Group";
      const attendeeCount =
        parseInt(rowObj["HOW MANY ATTENDEES ARE YOU REGISTERING FOR?"], 10) ||
        0;

      const base = {
        "Submission Date": row[0],
        "Registration Type": regType,
        "First Name": row[2],
        "Last Name": row[3],
        Email: row[4],
        "Company / Institution": isGroup ? row[15] : row[8],
        "Total Cost":
          parseCurrency(rowObj["TOTAL COST (GROUP)"]) ||
          parseCurrency(rowObj["TOTAL (Individual Attendee)"]),
        "Payment Option": rowObj["Please select one payment option."] || "",
        "Job Position": row[9],
        Designation: row[10],
        Country: row[11],
        Trainings: rowObj["TRAININGS (Individual Attendee)"],
      };

      if (isGroup && attendeeCount > 0) {
        const attendees = [];
        let startIndex =
          headers.indexOf("HOW MANY ATTENDEES ARE YOU REGISTERING FOR?") + 1;
        for (let i = 0; i < attendeeCount; i++) {
          const offset = i * 8;
          const a = {
            "First Name": row[startIndex + offset + 1],
            "Last Name": row[startIndex + offset + 2],
            Email: row[startIndex + offset + 3],
            "Job Position": row[startIndex + offset + 4],
            Designation: row[startIndex + offset + 5],
            Country: row[startIndex + offset + 6],
            Trainings: row[startIndex + offset + 7],
            Subtotal: parseCurrency(row[startIndex + offset + 8]),
          };
          attendees.push(a);
        }

        normalized.push({ ...base, Attendees: attendees });
      } else {
        normalized.push(base);
      }
    });

    return normalized;
  }

  return (
    <>
      <div className='container text-center my-5'>
        <form
          className='container text-center my-5'
          onSubmit={(e) => e.preventDefault()} // prevent full page reload
        >
          <label htmlFor='myFile' className='form-label'>
            Upload Excel File:
          </label>
          <input
            id='myFile'
            name='file'
            type='file'
            accept='.xlsx, .xls'
            className='form-control mb-3 mx-auto'
            onChange={handleFileUpload}
            required
            style={{ maxWidth: "400px" }}
          />
        </form>
      </div>

      <div className='container mt-4'>
        {excelData.length > 0 && (
          <div className='table-responsive'>
            <table className='table table-bordered table-striped table-hover'>
              <thead className='table-dark'>
                <tr>
                  <th>Submission Date</th>
                  <th>Registration Type</th>
                  <th>Admin First Name</th>
                  <th>Admin Last Name</th>
                  <th>Admin Email</th>
                  <th>Attendee First Name</th>
                  <th>Attendee Last Name</th>
                  <th>Attendee Email</th>
                  <th>Company / Institution</th>
                  <th>Job Position</th>
                  <th>Designation</th>
                  <th>Country</th>
                  <th>Trainings</th>
                  <th>Subtotal</th>
                  <th>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {excelData.map((row, i) => (
                  <tr key={i}>
                    <td>{row["Submission Date"]}</td>
                    <td>{row["Registration Type"]}</td>
                    <td>{row["First Name"]}</td>
                    <td>{row["Last Name"]}</td>
                    <td>{row["Email"]}</td>
                    <td>{row["Attendee First Name"]}</td>
                    <td>{row["Attendee Last Name"]}</td>
                    <td>{row["Attendee Email"]}</td>
                    <td>{row["Company / Institution"]}</td>
                    <td>{row["Job Position"]}</td>
                    <td>{row["Designation"]}</td>
                    <td>{row["Country"]}</td>
                    <td>{row["Trainings"]}</td>
                    <td>{row["Subtotal"]}</td>
                    <td>{row["Total Cost"]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
