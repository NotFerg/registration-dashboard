import React, { useState } from "react";
import EditForm from "../EditForm";

const Individual = ({ filteredUsers = [] }) => {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [editRegistration, setEditRegistration] = useState(null);

  function formatCurrency(amount) {
    const num = parseFloat(amount);
    if (isNaN(num)) return "$0.00";

    return num.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  }
  function toggleRow(idx) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
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

                const formattedDate = dateObj.toLocaleString("en-US", options);
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
                    <td className="small">{formatCurrency(reg.total_cost)}</td>
                    <td className="small">{reg.payment_status}</td>
                    <td colSpan={2} className="sticky-col">
                      <div className="btn-group">
                        <button
                          className="btn"
                          data-bs-toggle="modal"
                          data-bs-target="#editModal"
                          onClick={() => setEditRegistration(reg)}
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
