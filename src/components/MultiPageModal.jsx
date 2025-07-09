import React, { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import EditFormGroup from "./EditFormGroup";

const MultiPageModal = ({ show, onHide, initialReg }) => {
  const [step, setStep] = useState(0);
  const attendees = Array.isArray(initialReg?.attendees)
    ? initialReg.attendees
    : [];

  const isFirst = step === 0;
  const isLast = step === attendees.length;

  const next = () => setStep((prev) => Math.min(prev + 1, attendees.length));
  const prev = () => setStep((prev) => Math.max(prev - 1, 0));

  const renderAttendeeForm = () => {
    if (step === 0) return <p>Select an attendee to edit.</p>;
    const attendee = attendees[step - 1];
    if (!attendee) return <p>No attendee data.</p>;
    const combinedReg = {
      ...initialReg,
      ...attendee,
      trainings: (attendee.training_references || []).map(
        (tr) =>
          `${tr.trainings.name}: ${tr.trainings.date} ($${tr.trainings.price})`
      ),
      total_cost: attendee.subtotal,
      id: initialReg.id,
    };
    return <EditFormGroup reg={combinedReg} />;
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
          <h4 style={{ marginBottom: 20 }}>Admin Information</h4>
          <p>
            <strong>Company:</strong> {initialReg.company}
          </p>
          <p>
            <strong>Name:</strong> {initialReg.first_name}{" "}
            {initialReg.last_name}
          </p>
          <p>
            <strong>Email:</strong> {initialReg.email}
          </p>
          <p>
            <strong>Total Cost:</strong> ${initialReg.total_cost}
          </p>
        </section>
        <hr />
        <h4 style={{ marginBottom: 20 }}>Attendees Information</h4>
        {renderAttendeeForm()}
      </Modal.Body>
      <Modal.Footer>
        <div className="w-100 d-flex justify-content-between">
          <Button variant="secondary" onClick={prev} disabled={isFirst}>
            Previous
          </Button>
          <small>
            Attendee {step} of {attendees.length}
          </small>
          <Button variant="primary" onClick={next} disabled={isLast}>
            Next
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default MultiPageModal;
