import React from "react";
import * as XLSX from "xlsx";

const TRAINING_NAMES = [
  "Foundations of Responsible Investment",
  "Investment Steward Essentials",
  "Responsible Investment Masterclass",
  "Investment Steward Masterclass",
  "24th Annual Pacific Region Investment Conference",
];

const normalizeTrainingName = (name) =>
  String(name || "").trim().replace(/\s+/g, " ").toLowerCase();

const findTrainingColumn = (trainingName) => {
  const normalizedName = normalizeTrainingName(trainingName);

  if (normalizedName.startsWith("24th annual pacific region investment")) {
    return "24th Annual Pacific Region Investment Conference";
  }

  return TRAINING_NAMES.find(
    (name) => normalizeTrainingName(name) === normalizedName,
  );
};

const trainingColumns = (trainingReferences = []) => {
  const columns = Object.fromEntries(
    TRAINING_NAMES.map((name) => [name, []]),
  );

  trainingReferences.forEach((reference) => {
    const training = reference?.trainings;
    const columnName = findTrainingColumn(training?.name);
    if (!columnName) return;

    const label = training.date
      ? `${training.name} (${training.date})`
      : training.name;

    if (!columns[columnName].includes(label)) {
      columns[columnName].push(label);
    }
  });

  return Object.fromEntries(
    Object.entries(columns).map(([name, labels]) => [name, labels.join(" | ")]),
  );
};

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
            ...trainingColumns(att.training_references),
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
        ...trainingColumns(reg.training_references),
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
