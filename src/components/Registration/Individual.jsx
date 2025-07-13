import React, { useState } from "react";
import EditForm from "../EditForm";
import Swal from "sweetalert2";
import supabase from "../../utils/supabase";

const Individual = ({ filteredUsers = [] }) => {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [editRegistration, setEditRegistration] = useState(null);
  const [activePaymentStatus, setActivePaymentStatus] = useState(null);
  const [activeTraining, setActiveTraining] = useState(null);

  function formatCurrency(amount) {
    const num = parseFloat(amount);
    if (isNaN(num)) return "$0.00";

    return num.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  }

  const addedFilteredUsers = filteredUsers.filter((user) => {
    const paymentStatusMatches =
      !activePaymentStatus || user.payment_status === activePaymentStatus;
    const trainingMatches =
      !activeTraining || user.trainings.includes(activeTraining);
    return paymentStatusMatches && trainingMatches;
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

      if (regError || trainRefError || attendeeError) {
        Swal.fire(
          "Error!",
          "There was a problem deleting the registration.",
          "error"
        );
      } else {
        Swal.fire("Deleted!", "The guest has been deleted.", "success");
      }
    }
  }

  return (
    <>
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
                <th className="text-center">
                  <div className="dropdown w-100">
                    <button
                      className="dropdown-toggle"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      style={{
                        backgroundColor: "transparent",
                        height: "55px",
                        border: "none",
                      }}
                    >
                      Trainings
                    </button>
                    <ul className="dropdown-menu dropdown-menu-dark">
                      {[
                        "Annual Pacific Region Investment Conference",
                        "Applied Responsible Investment for Fiduciaries",
                        // …
                      ].map((training, index) => (
                        <li key={training + index}>
                          <a
                            className="dropdown-item"
                            onClick={() => setActiveTraining(training)}
                          >
                            {training}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </th>
                <th>Total Cost</th>
                <th className="text-center">
                  <div className="dropdown w-100">
                    <button
                      className="dropdown-toggle"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      style={{
                        backgroundColor: "transparent",
                        height: "55px",
                        border: "none",
                      }}
                    >
                      Payment Status
                    </button>
                    <ul className="dropdown-menu dropdown-menu-dark">
                      {["Unpaid", "Paid", "No Filter"].map((status, i) => (
                        <li key={status + i}>
                          <a
                            className="dropdown-item"
                            onClick={() =>
                              setActivePaymentStatus(
                                status === "No Filter" ? "" : status
                              )
                            }
                          >
                            {status}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </th>
                <th className="text-center " colSpan={2}>
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
