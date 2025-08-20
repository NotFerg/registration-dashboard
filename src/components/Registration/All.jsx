import React, { use, useEffect, useState } from "react";
import EditForm from "../EditForm";
import Swal from "sweetalert2";
import supabase from "../../utils/supabase";

const All = ({ filteredUsers = [] }) => {
  const [editRegistration, setEditRegistration] = useState(null);
  const [activePaymentStatus, setActivePaymentStatus] = useState("");
  const [activeTraining, setActiveTraining] = useState([]);
  const [activeCompany, setActiveCompany] = useState("");
  const [activeCountry, setActiveCountry] = useState("");

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
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  const destructureFilteredUsers = (users) =>
    users.flatMap((user) =>
      user.attendees.length > 0
        ? user.attendees.map((attendee) => ({
            id: attendee.id,
            first_name: attendee.first_name,
            last_name: attendee.last_name,
            email: attendee.email,
            position: attendee.position,
            designation:
              attendee.designation.length > 0
                ? attendee.designation
                : "No Current Designation",
            company: user.company,
            country: attendee.country,
            trainings: attendee.training_references,
            payment_status: user.payment_status,
            total_cost: attendee.subtotal,
            submission_date: user.submission_date
          }))
        : [
            {
              id: user.id,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              position: user.position,
              designation:
                user.designation.length > 0
                  ? user.designation
                  : "No Current Designation",
              company: user.company,
              country: user.country,
              trainings: user.training_references,
              payment_status: user.payment_status,
              total_cost: user.total_cost,
              submission_date: user.submission_date
            },
          ]
    );

  console.log("filteredUsers", filteredUsers);
  console.log(destructureFilteredUsers(filteredUsers));

  const usersToDisplay = filteredUsers
    .filter((user) => {
      const paymentStatusMatches =
        !activePaymentStatus || user.payment_status === activePaymentStatus;
      const trainingMatches =
        !activeTraining.length ||
        user.attendees.some((attendee) =>
          attendee.training_references.some((tr) =>
            activeTraining.includes(tr.trainings?.id)
          )
        );
      const companyMatches = !activeCompany || user.company === activeCompany;
      const countryMatches = !activeCountry || user.country === activeCountry;

      return (
        paymentStatusMatches &&
        trainingMatches &&
        companyMatches &&
        countryMatches
      );
    })
    .flatMap((user) =>
      user.attendees.length > 0
        ? user.attendees.map((attendee) => ({
            id: attendee.id,
            first_name: attendee.first_name,
            last_name: attendee.last_name,
            email: attendee.email,
            position: attendee.position,
            designation:
              attendee.designation.length > 0
                ? attendee.designation
                : "No Current Designation",
            company: user.company,
            country: attendee.country,
            trainings: attendee.training_references,
            payment_status: user.payment_status,
            total_cost: attendee.total_cost,
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
                user.designation.length > 0
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

  const clearFilters = () => {
    setActivePaymentStatus("");
    setActiveTraining([]);
    setActiveCompany("");
    setActiveCountry("");
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

  return (
    <>
      <div className="d-flex justify-content-between align-items-center my-3">
        <div className="d-flex flex-column flex-md-row flex-wrap gap-2 align-items-start align-items-center">
          <div className="dropdown" id="companyDropdown">
            <button
              className="btn btn-outline-dark dropdown-toggle border 
            "
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              data-bs-auto-close="outside"
            >
              <i class="bi bi-building-fill" /> Company:{" "}
              <span className="fw-bold">{activeCompany}</span>
            </button>
            <ul
              className="dropdown-menu"
              style={{ maxHeight: "300px", overflowY: "scroll" }}
            >
              {filteredUsers
                .map((user) => user.company)
                .filter(
                  (company, index, self) => self.indexOf(company) === index
                )
                .map((company, index) => (
                  <li key={index}>
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
          <div className="dropdown ps-2" id="countryDropdown">
            <button
              className="btn btn-outline-dark dropdown-toggle border 
            "
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              data-bs-auto-close="outside"
            >
              <i class="bi bi-globe-americas-fill" /> Country:{" "}
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
          <div className="dropdown ps-2" id="trainingDropdown">
            <button
              className="btn btn-outline-dark dropdown-toggle border 
            "
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              data-bs-auto-close="outside"
            >
              <i class="bi bi-funnel-fill"></i> Training:{" "}
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
              {[
                "Annual Pacific Region Investment Conference",
                "Applied Responsible Investment for Fiduciaries",
                "Accredited Investment Fiduciary Training",
                "Responsible Investment Essentials",
                "Investment Governance Essentials",
              ].map((training, index) => (
                <li key={index}>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      value={training}
                      id={`training-${index}`}
                      checked={activeTraining.includes(training)}
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
                      {training}
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
              <i class="bi bi-wallet-fill"></i> Payment Status:{" "}
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
          <i class="bi bi-x-circle"></i> Clear Filters
        </button>
      </div>
      <div className="pb-2">
        <h5>
          <b>Total Count: {usersToDisplay.length}</b>
        </h5>
      </div>

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
                <th className="text-center" colSpan={2}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {usersToDisplay.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center">
                    <h1 className="m-5"> No records satisfy the filter</h1>
                  </td>
                </tr>
              ) : (
                usersToDisplay.map((reg, i) => {
                  return (
                    <tr key={i}>
                      <td className="small">{reg.company}</td>
                      <td className="small">
                        {formatDate(reg.submission_date)}
                      </td>
                      <td className="small">{reg.first_name}</td>
                      <td className="small">{reg.last_name}</td>
                      <td className="small">{reg.email}</td>
                      <td className="small">{reg.position}</td>
                      <td className="small">{reg.designation}</td>
                      <td className="small">{reg.country}</td>
                      <td className="small">
                        <ul className=" mb-0">
                          {(reg.trainings || [])
                            .map((tr) =>
                              tr.trainings ? (
                                <li key={tr.trainings.id}>
                                  {tr.trainings.name}
                                </li>
                              ) : null
                            )
                            .filter(Boolean)}
                        </ul>
                      </td>
                      <td className="small">
                        {formatCurrency(reg.total_cost)}
                      </td>
                      <td className="small">{reg.payment_status}</td>
                      <td colSpan={2} className="sticky-col">
                        <div className="btn-group">
                          <button
                            className="btn"
                            data-bs-toggle="modal"
                            data-bs-target="#editModal"
                            onClick={() => setEditRegistration(reg)}
                          >
                            <i className="bi bi-pencil-square" />
                          </button>
                          <button
                            className="btn"
                            onClick={() => handleDelete(reg.id)}
                          >
                            <i className="bi bi-trash-fill" />
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

      {/* Edit Modal */}
      <div>
        <div
          className="modal fade"
          id="editModal"
          tabIndex="-1"
          aria-labelledby="editModalLabel"
          aria-hidden="true"
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
