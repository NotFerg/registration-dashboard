import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import EditFormGroup from "./EditFormGroup";
import supabase from "../utils/supabase";

const MultiPageModal = ({ stepProp, show, onHide, initialReg }) => {
  // Step is attendee index (0-based)
  const [step, setStep] = useState(0);
  const [attendees, setAttendees] = useState([]);
  const [reg, setReg] = useState({
    first_name: "",
    last_name: "",
    email: "",
    company: "",
    total_cost: 0,
    payment_options: "",
    payment_status: "",
  });

  // Load initial data when modal opens or initialReg changes
  useEffect(() => {
    if (initialReg) {
      setReg({
        first_name: initialReg.first_name,
        last_name: initialReg.last_name,
        email: initialReg.email,
        company: initialReg.company,
        total_cost: initialReg.total_cost,
        payment_options: initialReg.payment_options,
        payment_status: initialReg.payment_status,
      });
      setAttendees(
        Array.isArray(initialReg.attendees)
          ? initialReg.attendees.map((att) => ({
              ...att,
              trainings: Array.isArray(att.trainings)
                ? att.trainings
                : typeof att.trainings === "string"
                ? att.trainings.split(",").map((t) => t.trim())
                : [],
            }))
          : []
      );
      setStep(stepProp || 0);
    }
  }, [initialReg, show]);

  // Navigation
  const isFirst = step === 0;
  const isLast = step === attendees.length - 1;

  const next = () => {
    if (step < attendees.length - 1) setStep(step + 1);
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  // Save changes for current attendee
  function handleAttendeeSave(updatedAttendee) {
    setAttendees((prev) => {
      const copy = [...prev];
      copy[step] = updatedAttendee;
      // Update total cost for reg
      const totalCost = copy.reduce((acc, att) => {
        const cost = (att.trainings || []).reduce((sum, t) => {
          const match = t.match(/\(\$(\d+(?:\.\d{1,2})?)\)/);
          return sum + (match ? parseFloat(match[1]) : 0);
        }, 0);
        return acc + cost;
      }, 0);
      setReg((r) => ({ ...r, total_cost: totalCost }));
      return copy;
    });
  }

  // Save all changes to backend
  async function handleSubmitGroup(e) {
    e.preventDefault();
    try {
      // Update registration info
      const { error: regError } = await supabase
        .from("registrations")
        .update({
          first_name: reg.first_name,
          last_name: reg.last_name,
          email: reg.email,
          company: reg.company,
          total_cost: reg.total_cost,
          payment_options: reg.payment_options,
          payment_status: reg.payment_status,
        })
        .eq("id", initialReg.id);

      if (regError) throw regError;

      // Update each attendee
      for (const attendee of attendees) {
        const trainingsText = Array.isArray(attendee.trainings)
          ? attendee.trainings.join(", ")
          : attendee.trainings;

        const subtotal = (attendee.trainings || []).reduce((acc, t) => {
          const match = t.match(/\(\$(\d+(?:\.\d{1,2})?)\)/);
          return acc + (match ? parseFloat(match[1]) : 0);
        }, 0);

        const { error: attError } = await supabase
          .from("attendees")
          .update({
            first_name: attendee.first_name,
            last_name: attendee.last_name,
            email: attendee.email,
            position: attendee.position,
            designation: attendee.designation,
            country: attendee.country,
            trainings: trainingsText,
            subtotal,
          })
          .eq("id", attendee.id);

        if (attError) console.error("Attendee update failed:", attError);
      }

      console.log("✅ Group updated successfully");
      onHide();
    } catch (err) {
      console.error("❌ Error updating group:", err);
      alert("There was an error updating the group. Please try again.");
    }
  }

  // Render attendee form for current step
  const renderAttendeeForm = () => {
    if (attendees.length === 0) return <p>No attendee data.</p>;
    const attendee = attendees[step];
    if (!attendee) return <p>No attendee data.</p>;
    return (
      <EditFormGroup
        reg={{
          ...initialReg,
          ...attendee,
          trainings: Array.isArray(attendee.trainings)
            ? attendee.trainings
            : typeof attendee.trainings === "string"
            ? attendee.trainings.split(",").map((t) => t.trim())
            : [],
          total_cost: attendee.subtotal,
        }}
        onSave={handleAttendeeSave}
      />
    );
  };

  if (!initialReg) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <h3>Registration Details</h3>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Admin overview (read-only) */}
        <section className="mb-4">
          {/* Admin overview (read-only) */}
          <h4 style={{ marginBottom: 12 }}>Admin Information</h4>
          <div className="card w-100">
            <div className="card-body">
              <div className="d-flex flex-row">
                <div className="flex-fill">
                  <h3 className="card-title">
                    <i class="bi bi-building"></i>
                  </h3>
                  <h6 className="card-title">
                    <strong>Company</strong>
                  </h6>
                  <p className="card-text">{initialReg.company}</p>
                </div>
                <div className="vr mx-3"></div>
                <div className="flex-fill">
                  <h3 className="card-title">
                    <i class="bi bi-person-circle"></i>
                  </h3>
                  <h6 className="card-title">
                    <strong>Name</strong>
                  </h6>
                  <p className="card-text">
                    {initialReg.first_name} {initialReg.last_name}
                  </p>
                </div>
                <div className="vr mx-3"></div>
                <div className="flex-fill">
                  <h3 className="card-title">
                    <i class="bi bi-envelope-at-fill"></i>
                  </h3>
                  <h6 className="card-title">
                    <strong>E-Mail</strong>
                  </h6>
                  <p className="card-text">{initialReg.email}</p>
                </div>
                <div className="vr mx-3"></div>
                <div className="flex-fill">
                  <h3 className="card-title">
                    <i class="bi bi-cash"></i>
                  </h3>
                  <h6 className="card-title">
                    <strong>Total Cost</strong>
                  </h6>
                  <p className="card-text">${initialReg.total_cost}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <hr />
        <h4 style={{ marginBottom: 12 }}>Attendees Information</h4>
        {renderAttendeeForm()}
        <div className="text-center my-3">
          <Button
            variant="outline-primary"
            onClick={prev}
            disabled={isFirst}
            style={{ width: "100px" }}
          >
            Previous
          </Button>
          <small className="mx-3 text-muted">
            Attendee {attendees.length === 0 ? 0 : step + 1} of{" "}
            {attendees.length}
          </small>
          <Button
            variant="outline-primary"
            onClick={next}
            disabled={isLast}
            style={{ width: "100px" }}
          >
            Next
          </Button>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="w-100 d-flex justify-content-end">
          <Button variant="success" onClick={handleSubmitGroup}>
            Save Group
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default MultiPageModal;
