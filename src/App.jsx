import React, { useState, useEffect } from "react";
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
  const [activeTab, setActiveTab] = useState("individual");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [individualRegistration, setIndividualRegistration] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDataFromSupabase();
    getSession();
  }, []);

  async function getSession() {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate("/");
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

        // await purgeSupabaseData();
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
    let finalTrainingReferences = [];
    console.log("Starting optimized batch upload for", data.length, "rows");
    console.log("Sample data structure:", JSON.stringify(data[0], null, 2));

    // Step 1: Batch insert all registrations
    const registrationInserts = data.map((row) => {
      const { Attendees = [], ...regData } = row;
      console.log(`Row has ${Attendees.length} attendees:`, Attendees);
      return {
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
      };
    });

    console.log("Batch inserting", registrationInserts.length, "registrations");
    const { data: registrations, error: regError } = await supabase
      .from("registrations")
      .insert(registrationInserts)
      .select();

    if (regError) {
      console.error("Registration batch insert error:", regError);
      return;
    }
    console.log("Successfully inserted registrations");

    // Step 2: Collect all unique trainings first to minimize duplicates
    const uniqueTrainings = new Map();
    data.forEach((row, rowIndex) => {
      const { Attendees = [] } = row;

      // Collect trainings from attendees (group registrations)
      Attendees.forEach((attendee) => {
        const attTrainingLines = splitTrainingLines(attendee["Trainings"]);
        attTrainingLines.forEach((line) => {
          const parsed = parseTrainingLine(line);
          if (parsed) {
            const key = `${parsed.name}|${parsed.date}|${parsed.price}`;
            uniqueTrainings.set(key, parsed);
          }
        });
      });

      // Also collect trainings from individual registrations
      if (row["Trainings"] && Attendees.length === 0) {
        const indTrainingLines = splitTrainingLines(row["Trainings"]);
        indTrainingLines.forEach((line) => {
          const parsed = parseTrainingLine(line);
          if (parsed) {
            const key = `${parsed.name}|${parsed.date}|${parsed.price}`;
            uniqueTrainings.set(key, parsed);
          }
        });
      }
    });

    console.log("Found", uniqueTrainings.size, "unique training combinations");

    // Step 3: Batch upsert trainings
    const trainingMap = new Map();
    if (uniqueTrainings.size > 0) {
      // Get existing trainings
      const trainingArray = Array.from(uniqueTrainings.values());
      const { data: existingTrainings } = await supabase
        .from("trainings")
        .select("*");

      console.log(
        "Found",
        existingTrainings?.length || 0,
        "existing trainings"
      );

      // Map existing trainings
      if (existingTrainings) {
        existingTrainings.forEach((training) => {
          const key = `${training.name}|${training.date}|${training.price}`;
          trainingMap.set(key, training.id);
        });
      }

      // Insert new trainings
      const newTrainings = trainingArray.filter((training) => {
        const key = `${training.name}|${training.date}|${training.price}`;
        return !trainingMap.has(key);
      });

      if (newTrainings.length > 0) {
        console.log("Batch inserting", newTrainings.length, "new trainings");
        const { data: insertedTrainings } = await supabase
          .from("trainings")
          .insert(newTrainings)
          .select();

        if (insertedTrainings) {
          insertedTrainings.forEach((training) => {
            const key = `${training.name}|${training.date}|${training.price}`;
            trainingMap.set(key, training.id);
          });
        }
      }
    }

    // Step 4: Batch insert attendees and training references
    const attendeeInserts = [];
    const trainingReferences = [];

    data.forEach((row, rowIndex) => {
      const { Attendees = [] } = row;
      const registration = registrations[rowIndex];

      console.log(
        `Processing row ${rowIndex}: Found ${Attendees.length} attendees`
      );
      if (Attendees.length > 0) {
        console.log("First attendee:", Attendees[0]);
      }

      Attendees.forEach((attendee, attendeeIndex) => {
        const attendeeId = `temp_${rowIndex}_${attendeeIndex}`;

        attendeeInserts.push({
          registration_id: registration.id,
          first_name: attendee["First Name"],
          last_name: attendee["Last Name"],
          email: attendee["Email"],
          position: attendee["Job Position"],
          designation: attendee["Designation"],
          country: attendee["Country"],
          trainings: attendee["Trainings"],
          subtotal:
            parseFloat(
              (attendee["Subtotal"] || "").toString().replace(/[$,]/g, "")
            ) || 0,
        });

        // Prepare training references for this attendee
        const attTrainingLines = splitTrainingLines(attendee["Trainings"]);
        attTrainingLines.forEach((line) => {
          const parsed = parseTrainingLine(line);
          if (parsed) {
            const key = `${parsed.name}|${parsed.date}|${parsed.price}`;
            const trainingId = trainingMap.get(key);
            if (trainingId) {
              trainingReferences.push({
                training_id: trainingId,
                attendee_temp_id: attendeeId,
                registration_id: registration.id, // Include registration ID for group attendees
              });
            }
          }
        });
      });

      // Handle individual registration training references (no attendees)
      if (Attendees.length === 0 && row["Trainings"]) {
        console.log(
          `Processing individual registration trainings for row ${rowIndex}`
        );
        const indTrainingLines = splitTrainingLines(row["Trainings"]);
        indTrainingLines.forEach((line) => {
          const parsed = parseTrainingLine(line);
          if (parsed) {
            const key = `${parsed.name}|${parsed.date}|${parsed.price}`;
            const trainingId = trainingMap.get(key);
            if (trainingId) {
              trainingReferences.push({
                training_id: trainingId,
                registration_id: registration.id, // Direct link to registration for individual
                attendee_id: null, // No attendee for individual registrations
              });
            }
          }
        });
      }
    });

    // Insert attendees
    if (attendeeInserts.length > 0) {
      console.log("Batch inserting", attendeeInserts.length, "attendees");
      const { data: insertedAttendees, error: attendeeError } = await supabase
        .from("attendees")
        .insert(attendeeInserts)
        .select();

      if (attendeeError) {
        console.error("Attendee batch insert error:", attendeeError);
        return;
      }

      // Update training references with actual attendee IDs
      trainingReferences.forEach((ref, index) => {
        if (ref.attendee_temp_id) {
          // This is an attendee-based reference (group registration)
          const attendeeIndex = parseInt(ref.attendee_temp_id.split("_")[2]);
          const rowIndex = parseInt(ref.attendee_temp_id.split("_")[1]);
          const attendeeDbIndex =
            data
              .slice(0, rowIndex)
              .reduce((sum, row) => sum + (row.Attendees?.length || 0), 0) +
            attendeeIndex;

          if (insertedAttendees[attendeeDbIndex]) {
            finalTrainingReferences.push({
              training_id: ref.training_id,
              attendee_id: insertedAttendees[attendeeDbIndex].id,
              registration_id: ref.registration_id,
            });
          }
        } else {
          // This is a direct registration reference (individual registration)
          finalTrainingReferences.push({
            training_id: ref.training_id,
            registration_id: ref.registration_id,
            attendee_id: null,
          });
        }
      });
    } else {
      // No attendees to insert, but we still need to process individual registration training references
      const finalTrainingReferences = trainingReferences.filter(
        (ref) => !ref.attendee_temp_id
      );

      if (finalTrainingReferences.length > 0) {
        console.log(
          "Batch inserting",
          finalTrainingReferences.length,
          "individual training references"
        );
        const { error: refError } = await supabase
          .from("training_references")
          .insert(finalTrainingReferences);

        if (refError) {
          console.error(
            "Individual training references batch insert error:",
            refError
          );
        }
      }
      return; // Exit early since no attendees to process
    }

    // Insert all training references (both attendee-based and individual)
    if (finalTrainingReferences.length > 0) {
      console.log(
        "Batch inserting",
        finalTrainingReferences.length,
        "training references"
      );
      const { error: refError } = await supabase
        .from("training_references")
        .insert(finalTrainingReferences);

      if (refError) {
        console.error("Training references batch insert error:", refError);
      }
    }

    console.log("Optimized batch upload completed successfully");
  }

  function excelDateToISOString(serial) {
    if (!serial || isNaN(serial)) return "";
    console.log("SERIAL", serial);
    // Excel's day 1 is 1900-01-01, but JS Date's month is 0-based
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400; // seconds
    const date_info = new Date(utc_value * 1000);
    // Return ISO string (e.g., "2025-08-28T00:00:00.000Z")
    console.log("DATE INFO", date_info);
    return date_info.toISOString();
  }

  function normalizeExcelDataFromArray(data) {
    const [headers, ...rows] = data;
    const normalized = [];

    rows.forEach((row) => {
      // Skip empty rows
      if (
        !row ||
        row.length === 0 ||
        !row.some((cell) => cell && cell.toString().trim())
      ) {
        return;
      }

      const rowObj = Object.fromEntries(headers.map((key, i) => [key, row[i]]));
      const regType = rowObj["SELECT YOUR REGISTRATION TYPE"]?.trim();

      // Skip rows without registration type
      if (!regType) {
        return;
      }

      const isGroup = regType === "Someone Else / Group";
      const attendeeCount =
        parseInt(rowObj["HOW MANY ATTENDEES ARE YOU REGISTERING FOR?"], 10) ||
        0;

      const base = {
        "Submission Date": row[0] ? excelDateToISOString(row[0]) : "",
        "Registration Type": regType,
        "First Name": isGroup ? row[2] : row[5], // Group admin name vs individual name
        "Last Name": isGroup ? row[3] : row[6],
        Email: isGroup ? row[4] : row[7], // Admin email vs individual email
        "Company / Institution": isGroup ? row[15] : row[8], // Group company vs individual company
        "Total Cost":
          rowObj["TOTAL COST (GROUP)"] ||
          rowObj["TOTAL (Individual Attendee)"] ||
          "",
        "Payment Option": rowObj["Please select one payment option."] || "",
        "Job Position": isGroup ? "" : row[9], // Individual job position
        Designation: isGroup ? "" : row[10], // Individual designation
        Country: isGroup ? "" : row[11], // Individual country
        Trainings: rowObj["TRAININGS (Individual Attendee)"] || "",
      };

      console.log("BASE", base);

      if (isGroup && attendeeCount > 0) {
        const attendees = [];

        // Use direct column indices based on CSV structure
        // Starting from column 16 (after group company), each attendee takes 8 columns
        for (let i = 0; i < attendeeCount; i++) {
          const baseIndex = 16 + i * 8; // Column 16 is first attendee's First Name

          const attendeeData = {
            "First Name": row[baseIndex] || "",
            "Last Name": row[baseIndex + 1] || "",
            Email: row[baseIndex + 2] || "",
            "Job Position": row[baseIndex + 3] || "",
            Designation: row[baseIndex + 4] || "",
            Country: row[baseIndex + 5] || "",
            Trainings: row[baseIndex + 6] || "",
            Subtotal: row[baseIndex + 7] || "",
          };

          // Only add attendee if they have at least a name
          if (attendeeData["First Name"] && attendeeData["Last Name"]) {
            console.log(`Adding attendee ${i + 1}:`, attendeeData);
            attendees.push(attendeeData);
          }
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

  const filteredUsers = excelData.filter(
    ({ registration_type, first_name, last_name, company }) =>
      (activeTab === "individual" ? registration_type === "Myself" : true) &&
      (activeTab === "group"
        ? registration_type === "Someone Else / Group"
        : true) &&
      (searchTerm === "" ||
        [
          first_name.toLowerCase(),
          last_name.toLowerCase(),
          company.toLowerCase(),
        ].some((field) => field.includes(searchTerm.toLowerCase())))
  );

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

  // Function removed - now using batch operations in uploadToSupabase

  const handleAddRegistration = () => {
    setIndividualRegistration(!individualRegistration);
  };

  return (
    <>
      <div className='overflow-hidden'>
        <div className='min-vh-100'>
          <TopNavbar />
          <div className='container-fluid px-5 mt-3'>
            <div className='d-flex justify-content-between mb-3'>
              {" "}
              <h2>Registrations</h2>
              <div>
                <label htmlFor='myFile' className='btn btn-success fw-bold'>
                  <i className='bi bi-upload' /> Upload File
                </label>
                <input
                  id='myFile'
                  className='d-none'
                  type='file'
                  accept='.xlsx, .xls'
                  onChange={handleFileUpload}
                />
                <ExportExcel excelData={excelData} />
              </div>
            </div>
          </div>

          <div className='container-fluid px-5 my-3'>
            <Dashboard excelData={excelData} />
            <div className='card'>
              <div className='card-body'>
                {" "}
                <div className='d-flex justify-content-end'>
                  <button
                    className='btn btn-primary text-white fw-bold mx-3'
                    data-bs-toggle='modal'
                    data-bs-target='#addRegistrationModal'
                  >
                    <i className='bi bi-person-plus-fill' />
                    <span className='ms-2'>Add Registration</span>
                  </button>
                  <button
                    className='btn btn-primary text-white fw-bold'
                    onClick={() => setShowAddGroupModal(true)}
                  >
                    <i className='bi bi-person-lines-fill' />
                    <span className='ms-2'>Add Group Registration</span>
                  </button>
                </div>
                <ul className='nav nav-tabs'>
                  <li className='nav-item'>
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
                  <li className='nav-item'>
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
                  <li className='nav-item'>
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
                  type='text'
                  className='form-control'
                  id='guestSearch'
                  placeholder='Search participants...'
                  onChange={handleInputChange}
                  style={{ marginTop: 12, marginBottom: 1 }}
                />
                {activeTab === "group" ? (
                  <Group filteredUsers={filteredUsers} />
                ) : activeTab === "individual" ? (
                  <Individual filteredUsers={filteredUsers} />
                ) : (
                  <All filteredUsers={filteredUsers} />
                )}
              </div>
            </div>
          </div>
          {/* </div> */}
        </div>
      </div>

      {/* Insert Modal */}
      <div>
        <div
          className='modal fade'
          id='addRegistrationModal'
          tabIndex='-1'
          aria-labelledby='addModalLabel'
          aria-hidden='true'
          style={{ zIndex: 1200 }}
        >
          <div className='modal-dialog modal-dialog-centered modal-dialog-scrollable'>
            <div className='modal-content'>
              <div className='modal-header'>
                <h1
                  className='modal-title fs-5'
                  id='editModalLabel'
                  style={{ fontWeight: 700 }}
                >
                  Add Registration
                </h1>
                <button
                  type='button'
                  className='btn-close'
                  data-bs-dismiss='modal'
                  aria-label='Close'
                ></button>
              </div>
              <div className='modal-body'>
                <Form />
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddMultiPageModal
        show={showAddGroupModal}
        onHide={() => setShowAddGroupModal(false)}
        initialReg={undefined}
      />
    </>
  );
}

export default App;
