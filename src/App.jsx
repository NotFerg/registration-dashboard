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
        const data = XLSX.utils.sheet_to_json(worksheet);
        // console.log(data);
        // console.log(data[1]);

        const normalizedData = normalizeExcelData(data);
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

  function normalizeExcelData(data) {
    const normalized = [];

    data.forEach((row) => {
      const regType = row["SELECT YOUR REGISTRATION TYPE"]?.trim();
      const isGroup = regType === "Someone Else / Group";
      const attendeeCount =
        parseInt(row["HOW MANY ATTENDEES ARE YOU REGISTERING FOR?"], 10) || 0;

      const base = {
        "Submission Date": row["Submission Date"],
        "Registration Type": regType,
        "Admin First Name": row["First Name"],
        "Admin Last Name": row["Last Name"],
        "Admin Email": row["ADMIN EMAIL ADDRESS"],
        "Company / Institution":
          row["COMPANY / INSTITUTION"] || row["Company / Institution"],
        "Total Cost": row["TOTAL COST (GROUP)"] || "",
        "Payment Option": row["Please select one payment option."] || "",
      };

      if (isGroup && attendeeCount > 0) {
        const keys = Object.keys(row);
        const startIndex =
          keys.indexOf("HOW MANY ATTENDEES ARE YOU REGISTERING FOR?") + 1;

        const attendees = [];

        for (let i = 0; i < attendeeCount; i++) {
          const offset = i * 8;

          const fieldKeys = {
            firstName: keys[startIndex + offset + 1],
            lastName: keys[startIndex + offset + 2],
            email: keys[startIndex + offset + 3],
            jobPosition: keys[startIndex + offset + 4],
            designation: keys[startIndex + offset + 5],
            country: keys[startIndex + offset + 6],
            trainings: keys[startIndex + offset + 7],
            subtotal: keys[startIndex + offset + 8],
          };

          const attendee = {
            "First Name": row[fieldKeys.firstName],
            "Last Name": row[fieldKeys.lastName],
            Email: row[fieldKeys.email],
            "Job Position": row[fieldKeys.jobPosition],
            Designation: row[fieldKeys.designation],
            Country: row[fieldKeys.country],
            Trainings: row[fieldKeys.trainings],
            Subtotal: row[fieldKeys.subtotal],
          };

          attendees.push(attendee);
        }

        normalized.push({ ...base, Attendees: attendees });
      } else {
        // Individual
        const attendee = {
          "First Name": row["First Name"],
          "Last Name": row["Last Name"],
          Email: row["EMAIL"],
          "Job Position": row["JOB POSITION"],
          Designation: row["DESIGNATION"],
          Country: row["COUNTRY"],
          Trainings: row["TRAININGS (Individual Attendee)"],
          Subtotal: row["TOTAL (Individual Attendee)"],
        };

        normalized.push({ ...base, Attendees: [attendee] });
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
                  <th>Admin Email Address</th>
                  <th>Admin First Name</th>
                  <th>Admin Last Name</th>
                  <th>Email</th>
                  <th>Company / Insitution</th>
                  <th>Job Position</th>
                  <th>Deisgnation</th>
                  <th>Country</th>
                  <th>Trainings</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {excelData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Object.values(row).map((value, cellIndex) => (
                      <td key={`cell-${rowIndex}-${cellIndex}`}>{value}</td>
                    ))}
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
