import React, { useEffect, useMemo, useState, useRef } from "react";
import EditForm from "../EditForm";
import Swal from "sweetalert2";
import supabase from "../../utils/supabase";
import InvoiceModal from "../InvoiceModal";

const Individual = ({ filteredUsers = [] }) => {
  const [editRegistration, setEditRegistration] = useState(null);
  const [activePaymentStatus, setActivePaymentStatus] = useState("");
  const [activeTraining, setActiveTraining] = useState([]);
  const [activeCompany, setActiveCompany] = useState("");
  const [activeCountry, setActiveCountry] = useState("");
  const [trainingData, setTrainingData] = useState([]);

  const [sortBy, setSortBy] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  function formatCurrency(amount) {
    const num = parseFloat(amount);
    if (isNaN(num)) return "$0.00";

    return num.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  }

  async function fetchDataFromSupabase() {
    const { data: trainings, error } = await supabase
      .from("trainings")
      .select(`*`);

    if (error) {
      console.error("Error fetching data:", error);
      return;
    }
    setTrainingData(trainings);
  }

  useEffect(() => {
    fetchDataFromSupabase();
  }, []);

  const clearFilters = () => {
    setActivePaymentStatus("");
    setActiveTraining([]);
    setActiveCompany("");
    setActiveCountry("");
    setSortBy("");
    setSortDirection("asc");
  };

  const normalize = (s) => (s || "").toString().trim().toLowerCase();

  const addedFilteredUsers = filteredUsers.filter((user) => {
    const paymentStatusMatches =
      !activePaymentStatus || user.payment_status === activePaymentStatus;
    const userTrainings = (user.training_references || [])
      .map((tr) => tr?.trainings?.name)
      .filter(Boolean)
      .map(normalize);
    const activeNormalized = (activeTraining || []).map(normalize);

    const trainingMatches =
      activeNormalized.length === 0 ||
      activeNormalized.some((sel) => userTrainings.includes(sel));

    const countryMatches = !activeCountry || user.country === activeCountry;

    return paymentStatusMatches && trainingMatches && countryMatches;
  });

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  const displayedUsers = useMemo(() => {
    const arr = (addedFilteredUsers || []).slice();
    if (!sortBy) return arr;

    arr.sort((a, b) => {
      const aVal = normalize(
        sortBy === "company"
          ? a.company
          : sortBy === "first_name"
          ? a.first_name
          : a.last_name
      );
      const bVal = normalize(
        sortBy === "company"
          ? b.company
          : sortBy === "first_name"
          ? b.first_name
          : b.last_name
      );

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return arr;
  }, [addedFilteredUsers, sortBy, sortDirection]);

  const totalRecords = displayedUsers.length;

  async function handleDelete(id) {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this registration?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      const { error: trainRefError } = await supabase
        .from("training_references")
        .delete()
        .eq("registration_id", id);

      const { error: regError } = await supabase
        .from("registrations")
        .delete()
        .eq("id", id);

      if (regError || trainRefError) {
        Swal.fire(
          "Error!",
          "There was a problem deleting the registration.",
          "error"
        );
      } else {
        Swal.fire({
          text: "Registration deleted successfully",
          icon: "success",
          confirmButtonText: "OK",
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.reload();
          }
        });
      }
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center my-3">
        <div className="d-flex flex-column flex-md-row flex-wrap gap-2 align-items-start align-items-center">
          <div className="dropdown">
            <button
              className="btn btn-outline-dark dropdown-toggle border"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i className="bi bi-sort-alpha-down"></i> Sort:{" "}
              <span className="fw-bold">
                {sortBy
                  ? sortBy === "company"
                    ? "Company"
                    : sortBy === "first_name"
                    ? "First Name"
                    : "Last Name"
                  : "None"}
              </span>
              {sortBy && (
                <span className="ms-2">
                  (
                  {sortDirection ? (
                    <i className="bi bi-arrow-up-short"></i>
                  ) : (
                    <i className="bi bi-arrow-down-short"></i>
                  )}
                  )
                </span>
              )}
            </button>
            <ul className="dropdown-menu p-2" style={{ minWidth: "200px" }}>
              <li className="dropdown-header">Property</li>
              <li
                className="dropdown-item"
                onClick={() => handleSort("company")}
              >
                Company
              </li>
              <li
                className="dropdown-item"
                onClick={() => handleSort("first_name")}
              >
                First Name
              </li>
              <li
                className="dropdown-item"
                onClick={() => handleSort("last_name")}
              >
                Last Name
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li className="dropdown-header">Direction</li>
              <li
                className={
                  "dropdown-item " + (sortDirection === "asc" ? "active" : "")
                }
                onClick={() => setSortDirection("asc")}
              >
                Ascending
              </li>
              <li
                className={
                  "dropdown-item " + (sortDirection === "desc" ? "active" : "")
                }
                onClick={() => setSortDirection("desc")}
              >
                Descending
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li
                className="dropdown-item text-center fw-bold"
                onClick={() => {
                  setSortBy("");
                  setSortDirection("asc");
                }}
              >
                Clear Sort
              </li>
            </ul>
          </div>
          <div className="dropdown" id="countryDropdown">
            <button
              className="btn btn-outline-dark dropdown-toggle border 
            "
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
                .map((user) => user.country)
                .filter(
                  (country, index, self) => self.indexOf(country) === index
                )
                .map((country, index) => (
                  <li key={index}>
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
          <div className="dropdown ps-2" id="trainingDropdown">
            <button
              className="btn btn-outline-dark dropdown-toggle border"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              data-bs-auto-close="outside"
            >
              <i className="bi bi-funnel-fill"></i> Training:{" "}
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
                        id={`training-${training.id ?? index}`}
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
                        htmlFor={`training-${training.id ?? index}`}
                      >
                        {training.name}
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
          <div className="dropdown ps-2" id="paymentStatusDropdown">
            <button
              className="btn btn-outline-dark dropdown-toggle border 
            "
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              data-bs-auto-close="outside"
            >
              <i className="bi bi-wallet-fill"></i> Payment Status:{" "}
              <span className="fw-bold">{activePaymentStatus}</span>
            </button>
            <ul
              className="dropdown-menu"
              style={{ maxHeight: "300px", overflowY: "scroll" }}
            >
              {["Paid", "Unpaid"].map((payment_status, index) => (
                <li key={index}>
                  <div
                    className="dropdown-item"
                    onClick={() => setActivePaymentStatus(payment_status)}
                  >
                    {payment_status}
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
          <i className="bi bi-x-circle"></i> Clear Filters
        </button>
      </div>

      <div className="pb-2 d-flex justify-content-between align-items-center">
        <h6>
          <b>Total Count: {totalRecords}</b>
        </h6>
      </div>
      <div className="table-responsive" data-mdb-perfect-scrollbar="true">
        <table className="table table-bordered table-hover">
          <thead className="table-dark sticky-top">
            <tr className="small">
              <th className="text-nowrap">Company</th>
              <th className="text-nowrap">Date Submitted</th>
              <th className="text-nowrap">Full Name</th>
              <th className="text-nowrap">Email</th>
              <th className="text-nowrap">Position</th>
              {/* <th className="text-nowrap">Designation</th> */}
              <th className="text-nowrap">Country</th>
              <th className="text-nowrap">Trainings</th>
              <th className="text-nowrap">Total Cost</th>
              <th className="text-nowrap">Payment Status</th>
              <th className="text-center" colSpan={2}>
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {displayedUsers.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center">
                  <h1 className="m-5"> No records satisfy the filter</h1>
                </td>
              </tr>
            ) : (
              displayedUsers.map((reg, i) => {
                const dateObj = new Date(reg.submission_date);

                const options = {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                };

                const formattedDate = dateObj.toLocaleDateString(
                  "en-US",
                  options
                );
                return (
                  <tr key={reg.id ?? i}>
                    <td
                      className="small sticky-col"
                      style={{
                        minWidth: "120px",
                      }}
                    >
                      {reg.company}
                    </td>
                    <td className="small">{formattedDate}</td>
                    <td className="small">
                      {reg.first_name} {reg.last_name}
                    </td>
                    <td
                      className="small text-wrap"
                      style={{ maxWidth: "125px" }}
                    >
                      {reg.email}
                    </td>
                    <td className="small">{reg.position}</td>
                    {/* <td className="small">{reg.designation}</td> */}
                    <td className="small">{reg.country}</td>
                    <td className="small">
                      <ul className="mb-0">
                        {(reg.training_references || [])
                          .map((tr) =>
                            tr.trainings ? (
                              <li className="mb-2" key={tr.trainings.id}>
                                {tr.trainings.name}
                              </li>
                            ) : null
                          )
                          .filter(Boolean)}
                      </ul>
                    </td>
                    <td className="small">{formatCurrency(reg.total_cost)}</td>
                    <td className="small">
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
                    <td colSpan={2} className="sticky-col">
                      <div className="btn-group">
                        <button
                          className="btn"
                          data-bs-toggle="modal"
                          data-bs-target="#editModal"
                          onClick={() => setEditRegistration(reg)}
                        >
                          <i className="bi bi-pencil-square text-success" />
                        </button>
                        <InvoiceModal attendee={reg} />
                        <button
                          className="btn"
                          onClick={() => handleDelete(reg.id)}
                        >
                          <i className="bi bi-trash-fill text-danger" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      <div>
        <div
          className="modal fade"
          id="editModal"
          tabIndex="-1"
          aria-labelledby="editModalLabel"
          aria-hidden="true"
          style={{ zIndex: 11000 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h1
                  className="modal-title fs-5"
                  id="editModalLabel"
                  style={{ fontWeight: 700 }}
                >
                  Edit Registration
                </h1>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                  onClick={() => setEditRegistration(null)}
                ></button>
              </div>
              <div className="modal-body">
                <EditForm reg={editRegistration} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Individual;
