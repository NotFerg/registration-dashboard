import React, { useEffect, useMemo, useState } from "react";
import EditForm from "../EditForm";
import Swal from "sweetalert2";
import supabase from "../../utils/supabase";

const All = ({ filteredUsers = [] }) => {
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
  function formatDate(date) {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

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

  useEffect(() => {
    fetchDataFromSupabase();
  }, []);

  const destructureFilteredUsers = (users) =>
    users.flatMap((user) =>
      user.attendees && user.attendees.length > 0
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
            trainings: attendee.training_references,
            payment_status: user.payment_status,
            total_cost: attendee.subtotal,
            submission_date: user.submission_date,
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
              trainings: user.training_references,
              payment_status: user.payment_status,
              total_cost: user.total_cost,
              submission_date: user.submission_date,
            },
          ]
    );

  const normalize = (s) => (s || "").toString().trim().toLowerCase();

  const extractTrainingNamesFromUser = (user) => {
    const names = [];

    if (user.training_references && user.training_references.length > 0) {
      user.training_references.forEach((tr) => {
        if (tr && tr.trainings && tr.trainings.name) {
          names.push(tr.trainings.name);
        }
      });
    }

    if (Array.isArray(user.attendees) && user.attendees.length > 0) {
      user.attendees.forEach((attendee) => {
        (attendee.training_references || []).forEach((tr) => {
          if (tr && tr.trainings && tr.trainings.name) {
            names.push(tr.trainings.name);
          }
        });
      });
    }

    return Array.from(new Set(names.map(normalize)));
  };

  const filteredRegistrations = filteredUsers.filter((user) => {
    const paymentStatusMatches =
      !activePaymentStatus || user.payment_status === activePaymentStatus;
    const countryMatches = !activeCountry || user.country === activeCountry;

    const activeNormalized = (activeTraining || []).map(normalize);

    if (activeNormalized.length === 0) {
      return paymentStatusMatches && countryMatches;
    }

    const userTrainingNames = extractTrainingNamesFromUser(user);

    const trainingMatches = activeNormalized.some((sel) =>
      userTrainingNames.includes(sel)
    );

    return paymentStatusMatches && trainingMatches && countryMatches;
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
          training_references: attendee.training_references || [],
          payment_status: user.payment_status,
          total_cost:
            attendee.total_cost ?? attendee.subtotal ?? user.total_cost,
          submission_date: user.submission_date,
          trainings: attendee.trainings,
          trainings: user.trainings,
          payment_options: user.payment_options,
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
            training_references: user.training_references || [],
            payment_status: user.payment_status,
            total_cost: user.total_cost,
            submission_date: user.submission_date,
            trainings: user.trainings,
            payment_options: user.payment_options,
          },
        ]
  );

  const clearFilters = () => {
    setActivePaymentStatus("");
    setActiveTraining([]);
    setActiveCompany("");
    setActiveCountry("");
    setSortBy("");
    setSortDirection("asc");
  };

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

  const handleSort = (property) => {
    if (sortBy === property) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(property);
      setSortDirection("asc");
    }
  };

  const displayedUsers = useMemo(() => {
    const arr = (usersToDisplay || []).slice();
    if (!sortBy) return arr;

    arr.sort((a, b) => {
      const aVal =
        sortBy === "company"
          ? normalize(a.company)
          : sortBy === "first_name"
          ? normalize(a.first_name)
          : normalize(a.last_name);
      const bVal =
        sortBy === "company"
          ? normalize(b.company)
          : sortBy === "first_name"
          ? normalize(b.first_name)
          : normalize(b.last_name);

      const cmp = aVal.localeCompare(bVal || "");
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return arr;
  }, [usersToDisplay, sortBy, sortDirection]);

  const totalRecords = displayedUsers.length;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center my-3">
        <div className="d-flex flex-column flex-md-row flex-wrap gap-2 align-items-start align-items-center">
          <div className="dropdown" style={{ zIndex: "100" }}>
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
                  {sortDirection === "asc" ? (
                    <i className="bi bi-arrow-up-short" />
                  ) : (
                    <i className="bi bi-arrow-down-short" />
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
          <div
            className="dropdown ps-2"
            id="countryDropdown"
            style={{ zIndex: "100" }}
          >
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
                  (country) =>
                    country !== null &&
                    country.trim() !== "" &&
                    country !== undefined
                )
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
          <div
            className="dropdown ps-2"
            id="trainingDropdown"
            style={{ zIndex: "100" }}
          >
            <button
              className="btn btn-outline-dark dropdown-toggle border 
            "
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              data-bs-auto-close="outside"
            >
              <i className="bi bi-funnel-fill"></i> Training:{" "}
              {activeTraining && activeTraining.length != 0 ? (
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
                .map((training) => training.name)
                .filter((name, index, self) => self.indexOf(name) === index)
                .sort((a, b) => a.localeCompare(b))
                .map((name, index) => (
                  <li key={index}>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        value={name}
                        id={`training-${index}`}
                        checked={activeTraining.includes(name)}
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
                        htmlFor={`training-${index}`}
                      >
                        {name}
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
          <div
            className="dropdown ps-2"
            id="paymentStatusDropdown"
            style={{ zIndex: "100" }}
          >
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
      <div
        style={{ maxHeight: "75vh", overflowY: "auto", scrollbarWidth: "thin" }}
      >
        <div className="table">
          <div>
            <table className="table table-bordered table-hover">
              <thead
                className="table-dark"
                style={{ position: "sticky", top: 0, zIndex: 99 }}
              >
                <tr className="small">
                  <th
                    className="text-nowrap"
                    style={{
                      position: "sticky",
                      left: 0,
                      zIndex: 5,
                      minWidth: "150px",
                    }}
                  >
                    Company
                  </th>
                  <th className="text-nowrap">Date Submitted</th>
                  <th className="text-nowrap">Full Name</th>
                  <th className="text-nowrap">Email</th>
                  <th className="text-nowrap">Position</th>
                  {/* <th className="text-nowrap">Designation</th> */}
                  <th className="text-nowrap">Country</th>
                  <th className="text-nowrap">Trainings</th>
                  <th className="text-nowrap">Total Cost</th>
                  <th className="text-nowrap">Payment Status</th>
                  <th className="text-nowrap text-center" colSpan={2}>
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
                    return (
                      <tr key={i}>
                        <td
                          className="small sticky-col text-wrap"
                          style={{
                            position: "sticky",
                            left: 0,
                            background: "#fff",
                            zIndex: 4,
                            minWidth: "150px",
                          }}
                        >
                          {reg.company}
                        </td>
                        <td className="small">
                          {formatDate(reg.submission_date)}
                        </td>
                        <td className="small text-wrap">
                          {reg.first_name} {reg.last_name}
                        </td>
                        <td
                          className="small text-wrap"
                          style={{ maxWidth: "150px" }}
                        >
                          {reg.email}
                        </td>
                        <td className="small text-wrap">{reg.position}</td>
                        {/* <td className="small text-wrap">{reg.designation}</td> */}
                        <td className="small text-wrap">{reg.country}</td>
                        <td className="small text-wrap">
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
                        <td className="small text-wrap">
                          {formatCurrency(reg.total_cost)}
                        </td>
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
        </div>
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

export default All;
