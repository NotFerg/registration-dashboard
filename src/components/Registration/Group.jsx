import React, { useState, useEffect } from "react";
import MultiPageModal from "../MultiPageModal";
import InvoiceModal from "../InvoiceModal";
import Swal from "sweetalert2";
import supabase from "../../utils/supabase";
import NotesModal from "../NotesModal";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

const Group = ({ filteredUsers = [] }) => {
  // tracks expanded registration ids (use ids instead of indexes so pagination doesn't break it)
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [editRegistration, setEditRegistration] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesModalContent, setNotesModalContent] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // limit 10 records per page

  const [activePaymentStatus, setActivePaymentStatus] = useState("");
  const [activeTraining, setActiveTraining] = useState([]);
  const [activeCompany, setActiveCompany] = useState("");
  const [activeCountry, setActiveCountry] = useState("");
  const [trainingData, setTrainingData] = useState([]);

  function formatCurrency(amount) {
    const num = parseFloat(amount);
    if (isNaN(num)) return "$0.00";
    return num.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  }

  function toggleRow(id) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  useEffect(() => {
    async function fetchDataFromSupabase() {
      try {
        const { data: trainings, error } = await supabase
          .from("trainings")
          .select("*");
        if (error) {
          console.error("Error fetching trainings:", error);
          return;
        }
        setTrainingData(trainings || []);
      } catch (err) {
        console.error("Unexpected error fetching trainings:", err);
      }
    }
    fetchDataFromSupabase();
  }, []);

  const normalize = (s) => (s || "").toString().trim().toLowerCase();

  const extractTrainingNamesFromRegistration = (reg) => {
    const names = [];

    (reg.training_references || []).forEach((tr) => {
      if (tr && tr.trainings && tr.trainings.name)
        names.push(tr.trainings.name);
    });

    (reg.attendees || []).forEach((att) => {
      (att.training_references || []).forEach((tr) => {
        if (tr && tr.trainings && tr.trainings.name)
          names.push(tr.trainings.name);
      });
    });

    return Array.from(new Set(names.map(normalize)));
  };

  const filteredRegistrations = filteredUsers.filter((reg) => {
    const paymentStatusMatches =
      !activePaymentStatus || reg.payment_status === activePaymentStatus;
    const companyMatches = !activeCompany || reg.company === activeCompany;
    const countryMatches = !activeCountry || reg.country === activeCountry;

    const activeNormalized = (activeTraining || []).map(normalize);
    if (activeNormalized.length === 0) {
      return paymentStatusMatches && companyMatches && countryMatches;
    }

    const regTrainingNames = extractTrainingNamesFromRegistration(reg);
    const trainingMatches = activeNormalized.some((sel) =>
      regTrainingNames.includes(sel)
    );

    return (
      paymentStatusMatches &&
      companyMatches &&
      countryMatches &&
      trainingMatches
    );
  });

  const usersToDisplay = filteredRegistrations.flatMap((user) =>
    (user.attendees || []).length > 0
      ? user.attendees.map((attendee) => ({
          id: attendee.id,
          first_name: attendee.first_name,
          last_name: attendee.last_name,
          email: attendee.email,
          position: attendee.position,
          designation:
            attendee.designation && attendee.designation.length > 0
              ? attendee.designation
              : "No Current Designation",
          company: user.company,
          country: attendee.country,
          trainings: attendee.training_references || [],
          payment_status: user.payment_status,
          total_cost:
            attendee.total_cost ?? attendee.subtotal ?? user.total_cost,
          submission_date: user.submission_date,
          registration_id: user.id,
          fullRegistration: user,
        }))
      : [
          {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            position: user.position,
            designation:
              user.designation && user.designation.length > 0
                ? user.designation
                : "No Current Designation",
            company: user.company,
            country: user.country,
            trainings: user.training_references || [],
            payment_status: user.payment_status,
            total_cost: user.total_cost,
            submission_date: user.submission_date,
            registration_id: user.id,
            fullRegistration: user,
          },
        ]
  );

  const clearFilters = () => {
    setActivePaymentStatus("");
    setActiveTraining([]);
    setActiveCompany("");
    setActiveCountry("");
  };

  async function handleDeleteAttendee(attendeeId, registrationId) {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this attendee?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete",
    });

    if (!result.isConfirmed) return;

    try {
      const { error: trainRefError } = await supabase
        .from("training_references")
        .delete()
        .eq("registration_id", registrationId)
        .eq("attendee_id", attendeeId);

      if (trainRefError) {
        console.error("Error deleting training references:", trainRefError);
        return Swal.fire({
          title: "Error!",
          text: `Could not delete training references: ${trainRefError.message}`,
          icon: "error",
        });
      }

      const { error: attendeeDeleteError } = await supabase
        .from("attendees")
        .delete()
        .eq("id", attendeeId);

      if (attendeeDeleteError) {
        console.error("Error deleting attendee:", attendeeDeleteError);
        return Swal.fire({
          title: "Error!",
          text: `Could not delete attendee: ${attendeeDeleteError.message}`,
          icon: "error",
        });
      }

      Swal.fire({
        icon: "success",
        text: "Attendee deleted successfully.",
      }).then(() => window.location.reload());
    } catch (err) {
      console.error("Unexpected error during deletion:", err);
      Swal.fire({
        title: "Unexpected Error!",
        text: "Something went wrong while deleting the attendee.",
        icon: "error",
      });
    }
  }

  async function handleRegDelete(id) {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { data: attendees } = await supabase
          .from("attendees")
          .select("id")
          .match({ registration_id: id });
        if (attendees && attendees.length > 0) {
          await supabase
            .from("attendees")
            .delete()
            .in(
              "id",
              attendees.map((a) => a.id)
            );
        }
        supabase
          .from("registrations")
          .delete()
          .match({ id })
          .then((data) => {
            if (data.error) {
              Swal.fire({
                title: "Error",
                text: data.error.message,
                icon: "error",
              });
            } else {
              Swal.fire(
                "Deleted!",
                "Group Attendee has been deleted.",
                "success"
              );
              window.location.reload();
            }
          })
          .catch((error) => {
            Swal.fire({
              title: "Error",
              text: error.message,
              icon: "error",
            });
          });
      }
    });
  }

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    activePaymentStatus,
    JSON.stringify(activeTraining),
    activeCompany,
    activeCountry,
  ]);

  // pagination calculations
  const totalRecords = filteredRegistrations.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const paginatedRegistrations = filteredRegistrations.slice(
    (currentPage - 1) * pageSize,
    (currentPage - 1) * pageSize + pageSize
  );

  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  return (
    <>
      {/* Filters */}
      <div className="d-flex justify-content-between align-items-center my-3">
        <div className="d-flex flex-column flex-md-row flex-wrap gap-2 align-items-start align-items-center">
          {/* Company */}
          <div className="dropdown" id="companyDropdown">
            <button
              className="btn btn-outline-dark dropdown-toggle border"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              data-bs-auto-close="outside"
            >
              <i className="bi bi-building-fill" /> Company:{" "}
              <span className="fw-bold">{activeCompany}</span>
            </button>
            <ul
              className="dropdown-menu"
              style={{ maxHeight: "300px", overflowY: "scroll" }}
            >
              {filteredUsers
                .map((u) => u.company)
                .filter((c, i, self) => self.indexOf(c) === i)
                .map((company, idx) => (
                  <li key={idx}>
                    <div
                      className="dropdown-item"
                      onClick={() => setActiveCompany(company)}
                    >
                      {company}
                    </div>
                    <hr className="dropdown-divider" />
                  </li>
                ))}
              <li
                className="dropdown-item text-center fw-bold"
                onClick={() => setActiveCompany("")}
              >
                Clear Filter
              </li>
            </ul>
          </div>

          {/* Country */}
          <div className="dropdown ps-2" id="countryDropdown">
            <button
              className="btn btn-outline-dark dropdown-toggle border"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              data-bs-auto-close="outside"
            >
              <i className="bi bi-globe-americas-fill" /> Country:{" "}
              <span className="fw-bold">{activeCountry}</span>
            </button>
            <ul
              className="dropdown-menu"
              style={{ maxHeight: "300px", overflowY: "scroll" }}
            >
              {filteredUsers
                .map((u) => u.country)
                .filter(
                  (country) =>
                    country !== null &&
                    country !== undefined &&
                    country.toString().trim() !== ""
                )
                .filter((c, i, self) => self.indexOf(c) === i)
                .map((country, idx) => (
                  <li key={idx}>
                    <div
                      className="dropdown-item"
                      onClick={() => setActiveCountry(country)}
                    >
                      {country}
                    </div>
                    <hr className="dropdown-divider" />
                  </li>
                ))}
              <li
                className="dropdown-item text-center fw-bold"
                onClick={() => setActiveCountry("")}
              >
                Clear Filter
              </li>
            </ul>
          </div>

          {/* Training (driven by trainingData.name) */}
          <div className="dropdown ps-2" id="trainingDropdown">
            <button
              className="btn btn-outline-dark dropdown-toggle border"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              data-bs-auto-close="outside"
            >
              <i className="bi bi-funnel-fill" /> Training:{" "}
              {activeTraining && activeTraining.length !== 0 ? (
                <span className="badge bg-success ms-2">
                  {activeTraining.length}
                </span>
              ) : (
                ""
              )}
            </button>
            <ul
              className="dropdown-menu p-2"
              style={{ maxHeight: "300px", overflowY: "scroll" }}
            >
              {(trainingData || [])
                .slice()
                .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                .map((training, index) => (
                  <li key={training.id ?? index}>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        value={training.name}
                        id={`group-training-${training.id ?? index}`}
                        checked={activeTraining.includes(training.name)}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          if (e.target.checked) {
                            setActiveTraining((prev) => [...prev, newValue]);
                          } else {
                            setActiveTraining((prev) =>
                              prev.filter((item) => item !== newValue)
                            );
                          }
                        }}
                      />
                      <label
                        className="form-check-label"
                        htmlFor={`group-training-${training.id ?? index}`}
                      >
                        {training.name}
                        {training.date ? ` — ${training.date}` : ""}
                        {typeof training.price !== "undefined"
                          ? ` (${formatCurrency(training.price)})`
                          : ""}
                      </label>
                    </div>
                    <hr className="dropdown-divider" />
                  </li>
                ))}
              <li
                className="dropdown-item text-center fw-bold"
                onClick={() => setActiveTraining([])}
              >
                Clear Filter
              </li>
            </ul>
          </div>

          {/* Payment Status */}
          <div className="dropdown ps-2" id="paymentStatusDropdown">
            <button
              className="btn btn-outline-dark dropdown-toggle border"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              data-bs-auto-close="outside"
            >
              <i className="bi bi-wallet-fill" /> Payment Status:{" "}
              <span className="fw-bold">{activePaymentStatus}</span>
            </button>
            <ul
              className="dropdown-menu"
              style={{ maxHeight: "300px", overflowY: "scroll" }}
            >
              {["Paid", "Unpaid"].map((status, idx) => (
                <li key={idx}>
                  <div
                    className="dropdown-item"
                    onClick={() => setActivePaymentStatus(status)}
                  >
                    {status}
                  </div>
                  <hr className="dropdown-divider" />
                </li>
              ))}
              <li
                className="dropdown-item text-center fw-bold"
                onClick={() => setActivePaymentStatus("")}
              >
                Clear Filter
              </li>
            </ul>
          </div>
        </div>

        <button className="btn btn-outline-danger" onClick={clearFilters}>
          <i className="bi bi-x-circle" /> Clear Filters
        </button>
      </div>

      <div className="pb-2 d-flex justify-content-between align-items-center">
        <h5>
          <b>Total Count: {totalRecords}</b>
        </h5>
        <h6>
          <b>
            <small>
              Showing {startRecord}-{endRecord} of {totalRecords}
            </small>
          </b>
        </h6>
      </div>

      <div className="d-flex">
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-dark">
              <tr>
                <th className="text-nowrap">Company / Institution</th>
                <th className="text-nowrap">Submission Date</th>
                <th className="text-nowrap">Admin First Name</th>
                <th className="text-nowrap">Admin Last Name</th>
                <th className="text-nowrap">Email</th>
                <th className="text-nowrap" colSpan="3">
                  Attendees
                </th>
                <th className="text-nowrap">Total Cost</th>
                <th className="text-nowrap">Payment Status</th>
                <th className="text-nowrap">Notes</th>
                <th className="text-nowrap" colSpan={2}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRegistrations.map((reg, idx) => {
                const dateObj = new Date(reg.submission_date);
                const options = {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                };
                const formattedDate = dateObj.toLocaleString("en-US", options);

                return (
                  <React.Fragment key={reg.id ?? idx}>
                    <tr
                      onClick={() => toggleRow(reg.id)}
                      style={{ cursor: "pointer" }}
                      className={
                        expandedRows.has(reg.id) ? "table-secondary" : ""
                      }
                    >
                      <td>{reg.company}</td>
                      <td>{formattedDate}</td>
                      <td>{reg.first_name}</td>
                      <td>{reg.last_name}</td>
                      <td>{reg.email}</td>
                      <td colSpan="3">
                        Group Registration - {reg.attendees?.length || 0}{" "}
                        attendees
                      </td>
                      <td>{formatCurrency(reg.total_cost)}</td>
                      <td>
                        <span
                          className={`badge ${
                            reg.payment_status === "Paid"
                              ? "text-bg-success"
                              : reg.payment_status === "Unpaid"
                              ? "text-bg-warning"
                              : "text-bg-secondary"
                          }`}
                        >
                          {reg.payment_status}
                        </span>
                      </td>
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Edit Notes for this Group</Tooltip>}
                      >
                        <td
                          style={{
                            cursor: "pointer",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setNotesModalContent(reg.notes);
                            setShowNotesModal(true);
                          }}
                        >
                          <span style={{ opacity: reg.notes ? 1 : 0.5 }}>
                            {reg.notes ? reg.notes : "N/A"}
                          </span>
                          <i className="bi bi-sticky-fill text-warning text-opacity-75"></i>
                        </td>
                      </OverlayTrigger>

                      <td className="text-center">
                        <div className="btn-group">
                          <InvoiceModal attendee={reg} />
                          <button
                            className="btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRegDelete(reg.id);
                            }}
                          >
                            <i className="bi bi-trash-fill text-danger" />
                          </button>
                        </div>
                      </td>
                      <td>
                        {expandedRows.has(reg.id) ? (
                          <i className="bi bi-caret-up-fill" />
                        ) : (
                          <i className="bi bi-caret-down-fill" />
                        )}
                      </td>
                    </tr>

                    {expandedRows.has(reg.id) && (
                      <tr>
                        <td colSpan="13" className="p-0">
                          <div className="table-responsive">
                            <table className="table table-bordered mb-0 table-hover">
                              <thead className="ps-4">
                                <tr className="table-primary small">
                                  <th>First Name</th>
                                  <th>Last Name</th>
                                  <th>Email</th>
                                  <th>Position</th>
                                  <th>Designation</th>
                                  <th>Country</th>
                                  <th>Trainings</th>
                                  <th>Subtotal</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(reg.attendees || []).map((att, j) => (
                                  <tr key={att.id ?? j} className="table-light">
                                    <td className="small">{att.first_name}</td>
                                    <td className="small">{att.last_name}</td>
                                    <td className="small">{att.email}</td>
                                    <td className="small">{att.position}</td>
                                    <td className="small">{att.designation}</td>
                                    <td className="small">{att.country}</td>
                                    <td className="small">
                                      {(att.training_references || [])
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
                                    <td className="sticky-col">
                                      <div className="btn-group">
                                        <button
                                          className="btn"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveStep(
                                              reg.attendees.indexOf(att)
                                            );
                                            setEditRegistration(reg);
                                            setShowModal(true);
                                          }}
                                        >
                                          <i className="bi bi-pencil-square" />
                                        </button>
                                        <button
                                          className="btn"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteAttendee(
                                              att.id,
                                              reg.id
                                            );
                                          }}
                                        >
                                          <i className="bi bi-trash-fill" />
                                        </button>
                                      </div>
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

      <div className="d-flex justify-content-center align-items-center mt-3">
        <div>
          <nav aria-label="Page navigation">
            <ul className="pagination mb-0">
              <li
                className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  &laquo;
                </button>
              </li>
              <li
                className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
              </li>

              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <li
                    key={pageNum}
                    className={`page-item ${
                      currentPage === pageNum ? "active" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  </li>
                );
              })}

              <li
                className={`page-item ${
                  currentPage === totalPages ? "disabled" : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </li>
              <li
                className={`page-item ${
                  currentPage === totalPages ? "disabled" : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  &raquo;
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {showNotesModal && (
        <NotesModal
          notes={notesModalContent}
          show={showNotesModal}
          onHide={() => setShowNotesModal(false)}
        />
      )}

      <MultiPageModal
        stepProp={activeStep}
        show={showModal}
        onHide={() => setShowModal(false)}
        initialReg={editRegistration}
      />
    </>
  );
};

export default Group;
