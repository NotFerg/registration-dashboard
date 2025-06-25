import { useState } from "react";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import "./App.css";

function App() {
  const [excelData, setExcelData] = useState([]);

  function handleFileUpload(e) {
    const file = e.target.files[0];
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
    ];

    if (!file) {
      Swal.fire({
        title: "Error!",
        text: "No File Uploaded",
        icon: "error",
        // confirmButtonText: 'Cool'
      });
    }

    if (!validTypes.includes(file.type)) {
      Swal.fire({
        title: "Error!",
        text: "Invalid File Type",
        icon: "error",
        // confirmButtonText: 'Cool'
      });
    }

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const arrayBuffer = evt.target.result;
        const workbook = XLSX.read(arrayBuffer, { type: "array" });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
        });
        // console.log(data);
        // console.log(data[1]);

        const normalizedData = normalizeExcelDataFromArray(data);
        setExcelData(normalizedData);
      } catch (error) {
        console.error("Error reading Excel file:", error);
        Swal.fire({
          title: "Error!",
          text: "Failed to read Excel File please make sure it is valid",
          icon: "error",
          // confirmButtonText: 'Cool'
        });
      }
    };

    reader.readAsArrayBuffer(file);
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
        "Total Cost": rowObj["TOTAL COST (GROUP)"] || "",
        "Payment Option": rowObj["Please select one payment option."] || "",
      };

      if (isGroup && attendeeCount > 0) {
        const attendees = [];
        let startIndex =
          headers.indexOf("HOW MANY ATTENDEES ARE YOU REGISTERING FOR?") + 1;

        for (let i = 0; i < attendeeCount; i++) {
          const offset = i * 8;

          const attendee = {
            "First Name": row[startIndex + offset + 1],
            "Last Name": row[startIndex + offset + 2],
            Email: row[startIndex + offset + 3],
            "Job Position": row[startIndex + offset + 4],
            Designation: row[startIndex + offset + 5],
            Country: row[startIndex + offset + 6],
            Trainings: row[startIndex + offset + 7],
            Subtotal: row[startIndex + offset + 8],
          };

          attendees.push(attendee);
        }

        normalized.push({ ...base, Attendees: attendees });
      } else {
        // Individual
        normalized.push({
          "Submission Date": rowObj["Submission Date"],
          "Registration Type": rowObj["SELECT YOUR REGISTRATION TYPE"],
          "First Name": row[5],
          "Last Name": row[6],
          Email: row[7],
          "Company / Institution": row[8],
          "Job Position": row[9],
          Designation: row[10],
          Country: row[11],
          Trainings: rowObj["TRAININGS (Individual Attendee)"],
          Subtotal: rowObj["TOTAL (Individual Attendee)"],
          "Payment Option": rowObj["Please select one payment option."] || "",
        });
      }
    });

    console.log(normalized);
    return normalized;
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
                  <th>Submission Date</th>
                  <th>Registration Type</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Email</th>
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
                {excelData.map((row, rowIndex) => {
                  const attendees = row.Attendees || [{}]; // if no Attendees, use single blank object
                  return attendees.map((attendee, i) => (
                    <tr key={`${rowIndex}-${i}`}>
                      <td>{row["Submission Date"]}</td>
                      <td>{row["Registration Type"]}</td>
                      <td>{attendee["First Name"] || row["First Name"]}</td>
                      <td>{attendee["Last Name"] || row["Last Name"]}</td>
                      <td>{attendee["Email"] || row["Email"]}</td>
                      <td>{row["Company / Institution"]}</td>
                      <td>{attendee["Job Position"] || row["Job Position"]}</td>
                      <td>{attendee["Designation"] || row["Designation"]}</td>
                      <td>{attendee["Country"] || row["Country"]}</td>
                      <td>{attendee["Trainings"] || row["Trainings"]}</td>
                      <td>{attendee["Subtotal"] || row["Subtotal"]}</td>
                      <td>{row["Total Cost"] || row["Subtotal"]}</td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
