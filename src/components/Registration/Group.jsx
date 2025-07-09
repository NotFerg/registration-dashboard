import React, { useState } from "react";
import MultiPageModal from "../MultiPageModal"; // import the multi-page modal component

const Group = ({ filteredUsers = [] }) => {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [editRegistration, setEditRegistration] = useState(null);
  const [showModal, setShowModal] = useState(false); // control MultiPageModal visibility

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
                const formattedDate = dateObj.toLocaleString("en-US", options);

                return (
                  <React.Fragment key={idx}>
                    <tr
                      onClick={() => toggleRow(idx)}
                      style={{ cursor: "pointer" }}
                      className={expandedRows.has(idx) ? "table-secondary" : ""}
                    >
                      <td>{reg.company}</td>
                      <td>{formattedDate}</td>
                      <td>{reg.first_name}</td>
                      <td>{reg.last_name}</td>
                      <td>{reg.email}</td>
                      <td colSpan="4">
                        Group Registration - {reg.attendees?.length || 0}{" "}
                        attendees
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
                        <td colSpan="12" className="p-0">
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
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {reg.attendees?.map((att, j) => (
                                  <tr key={j} className="table-light">
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
                                          onClick={() => {
                                            setEditRegistration(reg);
                                            setShowModal(true);
                                          }}
                                        >
                                          <i className="bi bi-pencil-square" />
                                        </button>
                                        <button className="btn">
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

      <MultiPageModal
        show={showModal}
        onHide={() => setShowModal(false)}
        initialReg={editRegistration}
      />
    </>
  );
};

export default Group;
