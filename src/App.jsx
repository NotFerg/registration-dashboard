import React, { useState, useEffect } from "react";
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

    console.log("DATA", registrations);
    setExcelData(registrations);
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
            total_cost:
              parseFloat(
                (regData["Total Cost"] || "").toString().replace(/[$,]/g, "")
              ) || 0,
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
            parseFloat((a["Subtotal"] || "").toString().replace(/[$,]/g, "")) ||
            0,
        }));

        const { error: attErr } = await supabase
          .from("attendees")
          .insert(mapped);
        if (attErr) console.error("Attendee insert error:", attErr);
      }
    }
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
        "First Name": isGroup ? row[2] : row[5],
        "Last Name": isGroup ? row[3] : row[6],
        Email: isGroup ? row[4] : row[7],
        "Company / Institution": isGroup ? row[15] : row[8],
        "Total Cost":
          rowObj["TOTAL COST (GROUP)"] || rowObj["TOTAL (Individual Attendee)"],
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
            Subtotal: row[startIndex + offset + 8],
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

  function formatCurrency(amount) {
    const num = parseFloat(amount);
    if (isNaN(num)) return "$0.00";

    return num.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  }

  return (
    <>
      <div className='container text-center my-5'>
        <label htmlFor='myFile'>Select a file:</label>
        <input
          id='myFile'
          type='file'
          accept='.xlsx, .xls'
          onChange={handleFileUpload}
        />
      </div>

      <div className='container mt-4'>
        {excelData.length > 0 && (
          <div className='table-responsive'>
            <table className='table table-bordered table-striped table-hover'>
              <thead className='table-dark'>
                <tr>
                  <th>Company / Institution</th>
                  <th>Submission Date</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Email</th>
                  <th>Position</th>
                  <th>Designation</th>
                  <th>Country</th>
                  <th>Trainings</th>
                  <th>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {excelData.map((reg, i) => (
                  <React.Fragment key={i}>
                    {/* Main registration row - only for group registrations */}
                    {reg.registration_type === "Someone Else / Group" && (
                      <tr className='table-info fw-bold'>
                        <td>{reg.company}</td>
                        <td>{reg.submission_date}</td>
                        <td>{reg.first_name}</td>
                        <td>{reg.last_name}</td>
                        <td>{reg.email}</td>
                        <td colSpan='4' className='text-muted fst-italic'>
                          Group Registration - {reg.attendees?.length || 0}{" "}
                          attendees
                        </td>
                        <td>{formatCurrency(reg.total_cost)}</td>
                      </tr>
                    )}

                    {/* Attendees rows */}
                    {reg.attendees &&
                      reg.attendees.map((attendee, j) => (
                        <tr key={`${i}-${j}`} className='table-light'>
                          <td className='ps-4'>
                            <span className='text-muted'>└─</span>
                          </td>
                          <td></td>
                          <td>{attendee.first_name}</td>
                          <td>{attendee.last_name}</td>
                          <td>{attendee.email}</td>
                          <td>{attendee.position}</td>
                          <td>{attendee.designation}</td>
                          <td>{attendee.country}</td>
                          <td className='small'>{attendee.trainings}</td>
                          <td>{formatCurrency(attendee.subtotal)}</td>
                        </tr>
                      ))}

                    {/* Individual registration row - for non-group registrations */}
                    {reg.registration_type !== "Someone Else / Group" && (
                      <tr>
                        <td>{reg.company}</td>
                        <td>{reg.submission_date}</td>
                        <td>{reg.first_name}</td>
                        <td>{reg.last_name}</td>
                        <td>{reg.email}</td>
                        <td>{reg.position}</td>
                        <td>{reg.designation}</td>
                        <td>{reg.country}</td>
                        <td className='small'>{reg.trainings}</td>
                        <td>{formatCurrency(reg.total_cost)}</td>
                      </tr>
                    )}
                  </React.Fragment>
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
