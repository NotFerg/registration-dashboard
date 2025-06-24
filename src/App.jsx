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
        console.log(data);

        setExcelData(data);
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

      <div className='container'>
        {excelData.length > 0 && (
          <table border='1' cellPadding='8'>
            <thead>
              <tr>
                {Object.keys(excelData[0]).map((key, i) => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {excelData.map((row, index) => (
                <tr key={index}>
                  {Object.values(row).map((val, i) => (
                    <td key={i}>{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default App;
