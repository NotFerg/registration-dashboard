import React from "react";
import * as XLSX from "xlsx";

const ExportExcel = ({ excelData }) => {
  function exportToExcel(excelData) {
    // Always use the full excelData, not filteredUsers
    // Prepare group registrations (flattened attendees)
    const groupRows = [];
    excelData.forEach((reg) => {
      if (
        reg.registration_type === "Someone Else / Group" &&
        reg.attendees?.length
      ) {
        reg.attendees.forEach((att) => {
          groupRows.push({
            "Company / Institution": reg.company,
            "Submission Date": reg.submission_date,
            "First Name": att.first_name,
            "Last Name": att.last_name,
            Email: att.email,
            Position: att.position,
            Designation: att.designation,
            Country: att.country,
            Trainings: (att.training_references || [])
              .map((tr) =>
                tr.trainings
                  ? `${tr.trainings.name} (${tr.trainings.date})`
                  : ""
              )
              .filter(Boolean)
              .join(", "),
            Subtotal: att.subtotal,
            "Total Cost": reg.total_cost,
            "Payment Status": reg.payment_status,
            "Registration Type": reg.registration_type,
          });
        });
      }
    });

    // Prepare individual registrations
    const individualRows = excelData
      .filter((reg) => reg.registration_type === "Myself")
      .map((reg) => ({
        "Company / Institution": reg.company,
        "Submission Date": reg.submission_date,
        "First Name": reg.first_name,
        "Last Name": reg.last_name,
        Email: reg.email,
        Position: reg.position,
        Designation: reg.designation,
        Country: reg.country,
        Trainings: (reg.training_references || [])
          .map((tr) =>
            tr.trainings ? `${tr.trainings.name} (${tr.trainings.date})` : ""
          )
          .filter(Boolean)
          .join(", "),
        "Total Cost": reg.total_cost,
        "Payment Status": reg.payment_status,
        "Registration Type": reg.registration_type,
      }));

    // Create workbook and sheets
    const wb = XLSX.utils.book_new();
    const wsGroup = XLSX.utils.json_to_sheet(groupRows);
    const wsIndividual = XLSX.utils.json_to_sheet(individualRows);

    XLSX.utils.book_append_sheet(wb, wsGroup, "Group Registrations");
    XLSX.utils.book_append_sheet(wb, wsIndividual, "Individual Registrations");

    XLSX.writeFile(wb, "registrations.xlsx");
  }

  return (
    <>
      <button
        className='btn btn-primary fw-bold ms-2'
        onClick={() => exportToExcel(excelData)}
      >
        <i className='bi bi-download'></i> Export Data
      </button>
    </>
  );
};

export default ExportExcel;
