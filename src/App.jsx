import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import supabase from "./utils/supabase";
import Sidebar from "./components/sidebar.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import Dashboard from "./components/Dashboard.jsx";

function App() {
  const [excelData, setExcelData] = useState([]);
  const [activeTab, setActiveTab] = useState("individual");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchDataFromSupabase();
  }, []);

  async function fetchDataFromSupabase() {
    setIsLoading(true);
    const { data: registrations, error } = await supabase.from("registrations")
      .select(`
    *,
    attendees (
      *,
      training_references (
        training_id,
        trainings ( name, date, price )
      )
    ),
    training_references (
      training_id,
      trainings ( name, date, price )
    )
  `);

    if (error) {
      console.error("Error fetching data:", error);
      setIsLoading(false);
      return;
    }

    console.log("DATA", registrations);
    setExcelData(registrations);
    setIsLoading(false);
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

      // Insert main registration
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

      // // --- Handle trainings for registration ---
      // const trainingLines = splitTrainingLines(regData["Trainings"]);
      // for (const line of trainingLines) {
      //   const parsed = parseTrainingLine(line);
      //   if (!parsed) continue;

      //   const trainingId = await upsertTrainingByNameDatePrice(
      //     parsed.name,
      //     parsed.date,
      //     parsed.price
      //   );

      //   if (trainingId) {
      //     await supabase
      //       .from("registration_trainings")
      //       .insert([{ registration_id: reg.id, training_id: trainingId }]);
      //   }
      // }

      // // Link trainings to registration
      // const trainingLines = splitTrainingLines(regData["Trainings"]);
      // for (const line of trainingLines) {
      //   const parsed = parseTrainingLine(line);
      //   if (!parsed) continue;

      //   const trainingId = await upsertTrainingByNameDatePrice(
      //     parsed.name,
      //     parsed.date,
      //     parsed.price
      //   );
      //   if (trainingId) {
      //     await supabase.from("training_references").insert([
      //       {
      //         training_id: trainingId,
      //         registration_id: reg.id,
      //       },
      //     ]);
      //   }
      // }

      // Handle attendees
      for (const a of Attendees) {
        const { data: attendee, error: attErr } = await supabase
          .from("attendees")
          .insert([
            {
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
                  (a["Subtotal"] || "").toString().replace(/[$,]/g, "")
                ) || 0,
            },
          ])
          .select()
          .single();

        if (attErr || !attendee) {
          console.error("Attendee insert error:", attErr);
          continue;
        }

        const attTrainingLines = splitTrainingLines(a["Trainings"]);
        for (const line of attTrainingLines) {
          const parsed = parseTrainingLine(line);
          if (!parsed) continue;

          const trainingId = await upsertTrainingByNameDatePrice(
            parsed.name,
            parsed.date,
            parsed.price
          );
          if (trainingId) {
            await supabase.from("training_references").insert([
              {
                training_id: trainingId,
                attendee_id: attendee.id,
              },
            ]);
          }
        }
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

  // Search for participants
  const handleInputChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredUsers = excelData.filter((user) => {
    if (activeTab === "individual" && user.registration_type !== "Myself") {
      return false;
    }
    if (
      activeTab === "group" &&
      user.registration_type !== "Someone Else / Group"
    ) {
      return false;
    }
    if (
      searchTerm !== "" &&
      !user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !user.company.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Split string into training lines
  function splitTrainingLines(cell) {
    return (cell || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  // Parse "Nov 18-19: Training Name ($1234)" into { date, name, price }
  function parseTrainingLine(line) {
    const match = line.match(/^(.+?):\s*(.+?)\s*\(\$(\d+(?:\.\d{1,2})?)\)$/);
    if (!match) return null;
    return {
      date: match[1].trim(),
      name: match[2].trim(),
      price: parseFloat(match[3]),
    };
  }

  // Upsert into trainings table
  async function upsertTrainingByNameDatePrice(name, date, price) {
    const { data: existing, error: fetchError } = await supabase
      .from("trainings")
      .select("id")
      .eq("name", name)
      .eq("date", date)
      .eq("price", price)
      .maybeSingle();

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return null;
    }

    if (existing) {
      return existing.id;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("trainings")
      .insert([{ name, date, price }])
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return null;
    }

    return inserted.id;
  }

  function toggleRow(idx) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function exportToExcel() {
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
      <div className="row">
        <div className="col-md-2">
          <Sidebar />
        </div>

        <div className="col-md-10 p-3">
          <div className="container mt-3">
            <div className="d-flex justify-content-between mb-3">
              {" "}
              <h2>Registrations</h2>
              <div>
                <label htmlFor="myFile" className="btn btn-success fw-bold">
                  <i className="bi bi-upload"></i> Upload File
                </label>
                <input
                  id="myFile"
                  className="d-none"
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                />

                <button
                  className="btn btn-primary fw-bold ms-2"
                  onClick={exportToExcel}
                >
                  <i className="bi bi-download"></i> Export Data
                </button>
              </div>
            </div>
          </div>

          <div className="container-xxl mt-3">
            <Dashboard />
            <div className="card">
              <div className="card-body">
                {" "}
                <ul className="nav nav-tabs">
                  <li className="nav-item">
                    <a
                      className={`nav-link ${
                        activeTab === "individual"
                          ? "active bg-primary text-white fw-bold"
                          : "text-black"
                      }`}
                      style={{ cursor: "pointer" }}
                      onClick={() => setActiveTab("individual")}
                    >
                      Individual
                    </a>
                  </li>
                  <li className="nav-item">
                    <a
                      className={`nav-link ${
                        activeTab === "group"
                          ? "active bg-primary text-white fw-bold"
                          : "text-black"
                      }`}
                      style={{ cursor: "pointer" }}
                      onClick={() => setActiveTab("group")}
                    >
                      Group
                    </a>
                  </li>
                </ul>
                <input
                  type="text"
                  class="form-control"
                  id="guestSearch"
                  placeholder="Search participants..."
                  onChange={handleInputChange}
                />
                {activeTab === "group" ? (
                  <div className="d-flex">
                    <div className="table-responsive">
                      <table className="table table-bordered table-hover">
                        <thead className="table-dark">
                          <tr>
                            <th>Company / Institution</th>
                            <th>Submission Date</th>
                            <th>Admin First Name</th>
                            <th>Admin Last Name</th>
                            <th>Email</th>
                            <th colSpan="4">Attendees</th>
                            <th>Total Cost</th>
                            <th>Payment Status</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((reg, idx) => {
                            const dateObj = new Date(reg.submission_date);

                            const options = {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            };

                            const formattedDate = dateObj.toLocaleString(
                              "en-US",
                              options
                            );
                            return (
                              <React.Fragment key={idx}>
                                <tr
                                  onClick={() => toggleRow(idx)}
                                  style={{ cursor: "pointer" }}
                                  className={
                                    expandedRows.has(idx)
                                      ? "table-secondary"
                                      : ""
                                  }
                                >
                                  <td>{reg.company}</td>
                                  <td>{formattedDate}</td>
                                  <td>{reg.first_name}</td>
                                  <td>{reg.last_name}</td>
                                  <td>{reg.email}</td>
                                  <td colSpan="4">
                                    Group Registration -{" "}
                                    {reg.attendees?.length || 0} attendees
                                  </td>
                                  <td>{formatCurrency(reg.total_cost)}</td>
                                  <td>{reg.payment_status}</td>
                                  <td>
                                    {expandedRows.has(idx) ? (
                                      <i className="bi bi-caret-up-fill" />
                                    ) : (
                                      <i className="bi bi-caret-down-fill" />
                                    )}
                                  </td>
                                </tr>
                                {expandedRows.has(idx) && (
                                  <tr>
                                    <td colSpan="11" className="p-0">
                                      <div className="table-responsive">
                                        <table className="table table-bordered mb-0 table-hover">
                                          <thead className="ps-4">
                                            <tr className=" table-primary small">
                                              <th>First Name</th>
                                              <th>Last Name</th>
                                              <th>Email</th>
                                              <th>Position</th>
                                              <th>Designation</th>
                                              <th>Country</th>
                                              <th>Trainings</th>
                                              <th>Subtotal</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {reg.attendees?.map((att, j) => (
                                              <tr
                                                key={j}
                                                className="table-light"
                                              >
                                                <td className="small">
                                                  {att.first_name}
                                                </td>
                                                <td className="small">
                                                  {att.last_name}
                                                </td>
                                                <td className="small">
                                                  {att.email}
                                                </td>
                                                <td className="small">
                                                  {att.position}
                                                </td>
                                                <td className="small">
                                                  {att.designation}
                                                </td>
                                                <td className="small">
                                                  {att.country}
                                                </td>
                                                <td className="small">
                                                  {(
                                                    att.training_references ||
                                                    []
                                                  )
                                                    .map((tr) =>
                                                      tr.trainings
                                                        ? `${tr.trainings.name} (${tr.trainings.date})`
                                                        : null
                                                    )
                                                    .filter(Boolean)
                                                    .join(", ")}
                                                </td>
                                                <td className="small">
                                                  {formatCurrency(att.subtotal)}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* existing individual table markup */
                  <div className="table-responsive">
                    <div style={{ overflowX: "auto" }}>
                      <table className="table table-bordered table-hover">
                        <thead className="table-dark">
                          <tr>
                            <th>Company</th>
                            <th>Submission Date</th>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Email</th>
                            <th>Position</th>
                            <th>Designation</th>
                            <th>Country</th>
                            <th>Trainings</th>
                            <th>Total Cost</th>
                            <th>Payment Status</th>
                            <th className="text-center " colSpan={2}>
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((reg, i) => {
                            const dateObj = new Date(reg.submission_date);

                            const options = {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            };

                            const formattedDate = dateObj.toLocaleString(
                              "en-US",
                              options
                            );
                            return (
                              <tr key={i}>
                                <td className="small">{reg.company}</td>
                                <td className="small">{formattedDate}</td>
                                <td className="small">{reg.first_name}</td>
                                <td className="small">{reg.last_name}</td>
                                <td className="small">{reg.email}</td>
                                <td className="small">{reg.position}</td>
                                <td className="small">{reg.designation}</td>
                                <td className="small">{reg.country}</td>
                                <td className="small">
                                  {(reg.training_references || [])
                                    .map((tr) =>
                                      tr.trainings
                                        ? `${tr.trainings.name} (${tr.trainings.date})`
                                        : null
                                    )
                                    .filter(Boolean)
                                    .join(", ")}
                                </td>
                                <td className="small">
                                  {formatCurrency(reg.total_cost)}
                                </td>
                                <td>{reg.payment_status}</td>
                                <td colSpan={2} className="sticky-col">
                                  <div className="btn-group">
                                    <button
                                      className="btn"
                                      // onClick={() => setEditingGuest(guest)}
                                    >
                                      <i class="bi bi-pencil-square" />
                                    </button>
                                    <button
                                      className="btn"
                                      // onClick={() => deleteGuest(guest.id)}
                                    >
                                      <i class="bi bi-trash-fill" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
