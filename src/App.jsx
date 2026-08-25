import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import supabase from "./utils/supabase";
import Sidebar from "./components/Sidebar.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import Dashboard from "./components/Dashboard.jsx";
import ExportExcel from "./components/ExportExcel.jsx";
import Form from "./components/Registration/Form.jsx";
import Group from "./components/Registration/Group.jsx";
import Individual from "./components/Registration/Individual.jsx";
import All from "./components/Registration/All.jsx";
import AddMultiPageModal from "./components/AddMultiPageModal.jsx";
import { useNavigate } from "react-router-dom";
import TopNavbar from "./components/Navbar.jsx";

function App() {
  const [excelData, setExcelData] = useState([]);
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem("registrationsActiveTab") || "individual",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [individualRegistration, setIndividualRegistration] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const closeAddRegModalRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("registrationsActiveTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    fetchDataFromSupabase();
    getSession();
  }, []);

  async function getSession() {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // Option to remain on current dashboard route if authenticated
      } else {
        navigate("/login");
      }
    } catch (error) {
      console.error("Error fetching session:", error);
    } finally {
      setLoading(false);
    }
  }

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

    setExcelData(registrations || []);
    setIsLoading(false);
  }

  // Called after Form successfully adds a registration: refetch and close
  // the Add Registration modal without a full page reload.
  function handleAddRegistrationSuccess() {
    fetchDataFromSupabase();
    closeAddRegModalRef.current?.click();
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
      e.target.value = null; // Allow re-picking the same file
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      console.error("File read error:", reader.error);
      Swal.fire("Error!", "Could not read the selected file.", "error");
      setIsUploading(false);
      setIsLoading(false);
      e.target.value = null;
    };
    reader.onload = async (evt) => {
      try {
        setIsLoading(true);
        const arrayBuffer = evt.target.result;
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        const normalized = normalizeExcelDataFromArray(data);

        await uploadToSupabase(normalized);
        await fetchDataFromSupabase();

        Swal.fire("Success!", "Data uploaded successfully.", "success");
      } catch (err) {
        console.error("File upload error:", err);
        Swal.fire("Error!", "Failed to process Excel file.", "error");
      } finally {
        setIsLoading(false);
        setIsUploading(false);
        e.target.value = null; // Clear input
      }
    };

    setIsUploading(true);
    reader.readAsArrayBuffer(file);
  }

  async function upsertTrainingsBatch(uniqueTrainingsMap) {
    const trainingMap = new Map();
    const trainingItems = Array.from(uniqueTrainingsMap.values());

    for (const item of trainingItems) {
      const id = await upsertTrainingByNameDatePrice(
        item.name,
        item.date,
        item.price,
      );
      if (id) {
        const key = `${item.name}|${item.date}|${item.price}`;
        trainingMap.set(key, id);
      }
    }
    return trainingMap;
  }

  async function uploadToSupabase(data) {
    if (!data || data.length === 0) return;

    // 1. Collect unique trainings
    const uniqueTrainings = new Map();
    data.forEach((row) => {
      const { Attendees = [] } = row;
      const trainingSources = [row["Trainings"]];
      Attendees.forEach((a) => trainingSources.push(a["Trainings"]));

      trainingSources.forEach((raw) => {
        splitTrainingLines(raw).forEach((line) => {
          const parsed = parseTrainingLine(line);
          if (parsed) {
            const key = `${parsed.name}|${parsed.date}|${parsed.price}`;
            uniqueTrainings.set(key, parsed);
          }
        });
      });
    });

    const trainingMap = await upsertTrainingsBatch(uniqueTrainings);

    // 2. Insert Registrations Batch
    const registrationInserts = data.map((row) => ({
      submission_date: excelDateToISOString(row["Submission Date"]),
      registration_type: row["Registration Type"],
      first_name: row["First Name"],
      last_name: row["Last Name"],
      email: row["Email"],
      company: row["Company / Institution"],
      position: row["Job Position"],
      designation: row["Designation"],
      country: row["Country"],
      trainings: row["Trainings"],
      total_cost:
        parseFloat((row["Total Cost"] || "").toString().replace(/[$,]/g, "")) ||
        0,
      payment_options: row["Payment Option"],
    }));

    const { data: insertedRegistrations, error: regError } = await supabase
      .from("registrations")
      .insert(registrationInserts)
      .select();

    if (regError || !insertedRegistrations) {
      console.error("Registration batch insert error:", regError);
      return;
    }

    // 3. Prepare Attendees & direct Training References
    const attendeeInserts = [];
    const attendeeRefTracker = [];
    const directTrainingRefs = [];

    data.forEach((row, rowIndex) => {
      const dbRegistration = insertedRegistrations[rowIndex];
      if (!dbRegistration) return;

      const { Attendees = [] } = row;

      if (Attendees.length > 0) {
        Attendees.forEach((att) => {
          attendeeInserts.push({
            registration_id: dbRegistration.id,
            first_name: att["First Name"],
            last_name: att["Last Name"],
            email: att["Email"],
            position: att["Job Position"],
            designation: att["Designation"],
            country: att["Country"],
            trainings: att["Trainings"],
            subtotal:
              parseFloat(
                (att["Subtotal"] || "").toString().replace(/[$,]/g, ""),
              ) || 0,
          });

          attendeeRefTracker.push({
            rawTrainings: att["Trainings"],
            registrationId: dbRegistration.id,
          });
        });
      } else if (row["Trainings"]) {
        splitTrainingLines(row["Trainings"]).forEach((line) => {
          const parsed = parseTrainingLine(line);
          if (parsed) {
            const key = `${parsed.name}|${parsed.date}|${parsed.price}`;
            const trainingId = trainingMap.get(key);
            if (trainingId) {
              directTrainingRefs.push({
                registration_id: dbRegistration.id,
                training_id: trainingId,
              });
            }
          }
        });
      }
    });

    // 4. Batch Insert Attendees & build their Training References
    const finalTrainingRefs = [...directTrainingRefs];

    if (attendeeInserts.length > 0) {
      const { data: insertedAttendees, error: attError } = await supabase
        .from("attendees")
        .insert(attendeeInserts)
        .select();

      if (attError) {
        console.error("Attendees batch insert error:", attError);
        return;
      }

      insertedAttendees.forEach((attDb, idx) => {
        const tracker = attendeeRefTracker[idx];
        if (tracker && tracker.rawTrainings) {
          splitTrainingLines(tracker.rawTrainings).forEach((line) => {
            const parsed = parseTrainingLine(line);
            if (parsed) {
              const key = `${parsed.name}|${parsed.date}|${parsed.price}`;
              const trainingId = trainingMap.get(key);
              if (trainingId) {
                finalTrainingRefs.push({
                  attendee_id: attDb.id,
                  registration_id: tracker.registrationId,
                  training_id: trainingId,
                });
              }
            }
          });
        }
      });
    }

    // 5. Insert Final Training References
    if (finalTrainingRefs.length > 0) {
      const { error: refError } = await supabase
        .from("training_references")
        .insert(finalTrainingRefs);

      if (refError) {
        console.error("Training references batch insert error:", refError);
      }
    }
  }

  function excelDateToISOString(val) {
    if (!val) return null;

    if (typeof val === "string" || val instanceof Date) {
      const parsedDate = new Date(val);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString();
      }
    }

    const serial = Number(val);
    if (!isNaN(serial) && serial > 0) {
      const utc_days = Math.floor(serial - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      return isNaN(date_info.getTime()) ? null : date_info.toISOString();
    }

    return null;
  }

  function normalizeExcelDataFromArray(data) {
    const [headers, ...rows] = data;
    if (!headers || !rows.length) return [];

    const normalized = [];

    // Clean header string lookup
    const getHeaderKey = (rowObject, keyName) => {
      const match = Object.keys(rowObject).find(
        (k) =>
          String(k).trim().toLowerCase() ===
          String(keyName).trim().toLowerCase(),
      );
      return match ? rowObject[match] : "";
    };

    rows.forEach((row) => {
      if (
        !row ||
        row.every((cell) => cell === "" || cell === null || cell === undefined)
      )
        return;

      const rowObj = Object.fromEntries(headers.map((key, i) => [key, row[i]]));
      const regType = (rowObj["SELECT YOUR REGISTRATION TYPE"] || "").trim();

      if (!regType) return;

      const isGroup = regType === "Someone Else / Group";
      const attendeeCount =
        parseInt(rowObj["HOW MANY ATTENDEES ARE YOU REGISTERING FOR?"], 10) ||
        0;

      // Extract Admin Name / Email vs Individual Name / Email safely via exact headers
      const adminFirstName = rowObj["First Name"] || row[2] || "";
      const adminLastName = rowObj["Last Name"] || row[3] || "";
      const adminEmail = rowObj["Email"] || row[4] || "";

      // For individual, fallback indices directly match our target schema output columns
      const indivFirstName = row[5] || "";
      const indivLastName = row[6] || "";
      const indivEmail = row[7] || "";

      const base = {
        "Submission Date": rowObj["Submission Date"] || row[0],
        "Registration Type": regType,
        "First Name": isGroup ? adminFirstName : indivFirstName,
        "Last Name": isGroup ? adminLastName : indivLastName,
        Email: isGroup ? adminEmail : indivEmail,
        "Company / Institution":
          rowObj["Company / Institution"] || row[8] || "",
        "Total Cost":
          rowObj["TOTAL COST (GROUP)"] ||
          rowObj["TOTAL (Individual Attendee)"] ||
          "",
        "Payment Option": rowObj["Please select one payment option."] || "",
        "Job Position": isGroup ? "" : row[9] || "",
        Designation: isGroup ? "" : row[10] || "",
        Country: isGroup ? "" : row[11] || "",
        Trainings: rowObj["TRAININGS (Individual Attendee)"] || "",
      };

      if (isGroup && attendeeCount > 0) {
        const attendees = [];
        // Find exact start index for Attendees in the array headers
        let startIndex = headers.indexOf("TOTAL COST (GROUP)");

        if (startIndex !== -1) {
          startIndex += 1;

          for (let i = 0; i < attendeeCount; i++) {
            const offset = i * 8;
            const attendeeFirstName = row[startIndex + offset];
            if (!attendeeFirstName) continue;

            attendees.push({
              "First Name": attendeeFirstName,
              "Last Name": row[startIndex + offset + 1] || "",
              Email: row[startIndex + offset + 2] || "",
              "Job Position": row[startIndex + offset + 3] || "",
              Designation: row[startIndex + offset + 4] || "",
              Country: row[startIndex + offset + 5] || "",
              Trainings: row[startIndex + offset + 6] || "",
              Subtotal: row[startIndex + offset + 7] || "",
            });
          }
        }
        normalized.push({ ...base, Attendees: attendees });
      } else {
        normalized.push(base);
      }
    });

    return normalized;
  }
  const handleInputChange = (event) => {
    setSearchTerm(event.target.value);
  };
  const nameSearchFields = (first_name, last_name) => {
    const first = (first_name || "").trim().toLowerCase();
    const last = (last_name || "").trim().toLowerCase();
    return [first, last, `${first} ${last}`.trim()];
  };

  const filteredUsers = excelData.filter(
    ({ registration_type, first_name, last_name, company, attendees }) => {
      const searchFields = [
        ...nameSearchFields(first_name, last_name),
        (company || "").toLowerCase(),
      ];

      if (activeTab === "all") {
        (attendees || []).forEach((attendee) => {
          searchFields.push(
            ...nameSearchFields(attendee.first_name, attendee.last_name),
          );
        });
      }

      const term = searchTerm.trim().toLowerCase();

      return (
        (activeTab === "individual" ? registration_type === "Myself" : true) &&
        (activeTab === "group"
          ? registration_type === "Someone Else / Group"
          : true) &&
        (term === "" || searchFields.some((field) => field.includes(term)))
      );
    },
  );

  function splitTrainingLines(cell) {
    if (!cell || typeof cell !== "string") return [];

    // Matches items ending with " - $Price" (e.g., " - $2050" or " - $2,050.00")
    const chunks = cell.match(/.*?\s*-\s*\$\d+(?:,\d{3})*(?:\.\d{1,2})?/g);

    if (!chunks) return [];

    return chunks.map((chunk) => chunk.replace(/^,\s*/, "").trim());
  }

  function parseTrainingLine(line) {
    if (!line || typeof line !== "string") return null;

    // Expects format: "Name (Date) - $Price"
    const regex =
      /^(.+?)\s*\(([^)]+)\)\s*-\s*\$(\d+(?:,\d{3})*(?:\.\d{1,2})?)$/;
    const match = line.trim().match(regex);

    if (!match) {
      console.warn("Failed to parse training line:", line);
      return null;
    }

    return {
      name: match[1].trim(),
      date: match[2].trim(),
      price: parseFloat(match[3].replace(/,/g, "")),
    };
  }

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

  return (
    <>
      <div className="overflow-hidden">
        <div className="min-vh-100">
          <TopNavbar />
          <div className="container-fluid px-5 mt-3">
            <div className="d-flex justify-content-between mb-3">
              <h2>Registrations</h2>
              <div>
                <label
                  htmlFor="myFile"
                  className={`btn btn-success fw-bold ${
                    isUploading ? "disabled" : ""
                  }`}
                  aria-disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-upload" /> Upload File
                    </>
                  )}
                </label>
                <input
                  id="myFile"
                  className="d-none"
                  type="file"
                  accept=".xlsx, .xls"
                  disabled={isUploading}
                  onChange={handleFileUpload}
                />
                <ExportExcel excelData={excelData} />
              </div>
            </div>
          </div>

          <div className="container-fluid px-5 my-3">
            <Dashboard excelData={excelData} />
            <div className="card">
              <div className="card-body">
                <div className="d-flex justify-content-end">
                  <button
                    className="btn btn-primary text-white fw-bold mx-3"
                    data-bs-toggle="modal"
                    data-bs-target="#addRegistrationModal"
                  >
                    <i className="bi bi-person-plus-fill" />
                    <span className="ms-2">Add Registration</span>
                  </button>
                  <button
                    className="btn btn-primary text-white fw-bold"
                    onClick={() => setShowAddGroupModal(true)}
                  >
                    <i className="bi bi-person-lines-fill" />
                    <span className="ms-2">Add Group Registration</span>
                  </button>
                </div>
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
                  <li className="nav-item">
                    <a
                      className={`nav-link ${
                        activeTab === "all"
                          ? "active bg-primary text-white fw-bold"
                          : "text-black"
                      }`}
                      style={{ cursor: "pointer" }}
                      onClick={() => setActiveTab("all")}
                    >
                      All
                    </a>
                  </li>
                </ul>
                <input
                  type="text"
                  className="form-control"
                  id="guestSearch"
                  placeholder="Search participants..."
                  onChange={handleInputChange}
                  style={{ marginTop: 12, marginBottom: 1 }}
                />
                {activeTab === "group" ? (
                  <Group
                    filteredUsers={filteredUsers}
                    onRefresh={fetchDataFromSupabase}
                  />
                ) : activeTab === "individual" ? (
                  <Individual
                    filteredUsers={filteredUsers}
                    onRefresh={fetchDataFromSupabase}
                  />
                ) : (
                  <All
                    filteredUsers={filteredUsers}
                    searchTerm={searchTerm}
                    onRefresh={fetchDataFromSupabase}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Insert Modal */}
      <div
        className="modal fade"
        id="addRegistrationModal"
        tabIndex="-1"
        aria-labelledby="addModalLabel"
        aria-hidden="true"
        style={{ zIndex: 1200 }}
      >
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h1
                className="modal-title fs-5"
                id="editModalLabel"
                style={{ fontWeight: 700 }}
              >
                Add Registration
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                ref={closeAddRegModalRef}
              />
            </div>
            <div className="modal-body">
              <Form onSuccess={handleAddRegistrationSuccess} />
            </div>
          </div>
        </div>
      </div>

      <AddMultiPageModal
        show={showAddGroupModal}
        onHide={() => setShowAddGroupModal(false)}
        onSuccess={fetchDataFromSupabase}
      />
    </>
  );
}

export default App;
