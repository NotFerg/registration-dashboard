import React, { useState } from "react";
import EditForm from "../EditForm";
import Swal from "sweetalert2";
import supabase from "../../utils/supabase";

const Individual = ({ filteredUsers = [] }) => {
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

  const clearFilters = () => {
    setActivePaymentStatus("");
    setActiveTraining("");
    setActiveCompany("");
    setActiveCountry("");
  };

  const addedFilteredUsers = filteredUsers.filter((user) => {
    const paymentStatusMatches =
      !activePaymentStatus || user.payment_status === activePaymentStatus;
    const trainingMatches =
      !activeTraining || user.trainings.includes(activeTraining);
    const companyMatches = !activeCompany || user.company === activeCompany;
    const countryMatches = !activeCountry || user.country === activeCountry;

    return (
      paymentStatusMatches &&
      trainingMatches &&
      companyMatches &&
      countryMatches
    );
  });

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
        <div className="dropdown ms-2" id="companyDropdown">
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
              .filter((company, index, self) => self.indexOf(company) === index)
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

        <div className="dropdown ms-2" id="countryDropdown">
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
              .filter((country, index, self) => self.indexOf(country) === index)
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

        <div className="dropdown" id="trainingDropdown">
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

        <div className="dropdown" id="paymentStatusDropdown">
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

        <button className="btn btn-dark" onClick={clearFilters}>
          Clear Filters
        </button>
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
              {addedFilteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center">
                    <h1 className="m-5"> No records satisfy the filter</h1>
                  </td>
                </tr>
              ) : (
                addedFilteredUsers.map((reg, i) => {
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
                        <ul className=" mb-0">
                          {(reg.training_references || [])
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

export default Individual;
