import React, { useState } from "react";
import MultiPageModal from "../MultiPageModal"; // import the multi-page modal component
import Swal from "sweetalert2";
import supabase from "../../utils/supabase";

const Group = ({ filteredUsers = [] }) => {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [editRegistration, setEditRegistration] = useState(null);
  const [showModal, setShowModal] = useState(false); // control MultiPageModal visibility
  const [activeStep, setActiveStep] = useState(0);

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
        if (attendees.length > 0) {
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

  return (
    <>
      <div className='d-flex'>
        <div className='table-responsive'>
          <table className='table table-bordered table-hover'>
            <thead className='table-dark'>
              <tr>
                <th>Company / Institution</th>
                <th>Submission Date</th>
                <th>Admin First Name</th>
                <th>Admin Last Name</th>
                <th>Email</th>
                <th colSpan='3'>Attendees</th>
                <th>Total Cost</th>
                <th>Payment Status</th>
                <th colSpan={2}>Actions</th>
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
                      <td colSpan='3'>
                        Group Registration - {reg.attendees?.length || 0}{" "}
                        attendees
                      </td>
                      <td>{formatCurrency(reg.total_cost)}</td>
                      <td>{reg.payment_status}</td>
                      <td className='text-center'>
                        <button
                          className='btn'
                          onClick={() => handleRegDelete(reg.id)}
                        >
                          <i className='bi bi-trash-fill' />
                        </button>
                      </td>
                      <td>
                        {expandedRows.has(idx) ? (
                          <i className='bi bi-caret-up-fill' />
                        ) : (
                          <i className='bi bi-caret-down-fill' />
                        )}
                      </td>
                    </tr>

                    {expandedRows.has(idx) && (
                      <tr>
                        <td colSpan='12' className='p-0'>
                          <div className='table-responsive'>
                            <table className='table table-bordered mb-0 table-hover'>
                              <thead className='ps-4'>
                                <tr className=' table-primary small'>
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
                                  <tr key={j} className='table-light'>
                                    <td className='small'>{att.first_name}</td>
                                    <td className='small'>{att.last_name}</td>
                                    <td className='small'>{att.email}</td>
                                    <td className='small'>{att.position}</td>
                                    <td className='small'>{att.designation}</td>
                                    <td className='small'>{att.country}</td>
                                    <td className='small'>
                                      {(att.training_references || [])
                                        .map((tr) =>
                                          tr.trainings
                                            ? `${tr.trainings.name} (${tr.trainings.date})`
                                            : null
                                        )
                                        .filter(Boolean)
                                        .join(", ")}
                                    </td>
                                    <td className='small'>
                                      {formatCurrency(att.subtotal)}
                                    </td>
                                    <td className='sticky-col'>
                                      <div className='btn-group'>
                                        <button
                                          className='btn'
                                          onClick={() => {
                                            setActiveStep(
                                              reg.attendees.indexOf(att)
                                            );
                                            setEditRegistration(reg);
                                            setShowModal(true);
                                          }}
                                        >
                                          <i className='bi bi-pencil-square' />
                                        </button>
                                        <button
                                          className='btn'
                                          onClick={() => handleDelete(att.id)}
                                        >
                                          <i className='bi bi-trash-fill' />
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
        stepProp={activeStep}
        show={showModal}
        onHide={() => setShowModal(false)}
        initialReg={editRegistration}
      />
    </>
  );
};

export default Group;
