import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import EditFormGroup from "./EditFormGroup";

const MultiPageModal = ({ show, onHide, initialReg }) => {
  const [step, setStep] = useState(0);
  const attendees = Array.isArray(initialReg?.attendees)
    ? initialReg.attendees
    : [];

  const handleSelect = (e) => {
    const value = parseInt(e.target.value, 10);
    setStep(value);
  };

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
    console.log(combinedReg);
    return <EditFormGroup reg={combinedReg} />;
  };

  console.log(initialReg);

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
        <h4 style={{ marginBottom: 12 }}>Admin Information</h4>
        <div className="d-flex flex-row justify-content-between mb-2">
          <div className="card">
            <div className="card-body">
              <h3 className="card-title">
                <i class="bi bi-building"></i>
              </h3>
              <h6 className="card-title">
                <strong>Company</strong>
              </h6>
              <p className="card-text">{initialReg.company}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
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
          </div>
          <div className="card">
            <div className="card-body">
              <h3 className="card-title">
                <i class="bi bi-envelope-at-fill"></i>
              </h3>
              <h6 className="card-title">
                <strong>E-Mail</strong>
              </h6>
              <p className="card-text">{initialReg.email}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
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
        {/* <section className="mb-4">
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
        </section> */}
        <hr />
        <h4 style={{ marginBottom: 12 }}>Select Attendee:</h4>
        <Form.Group controlId="attendeeSelect" className="mb-3">
          <Form.Label>Attendee Name: </Form.Label>
          <Form.Select value={step} onChange={handleSelect} className="mb-3">
            <option value={0}>-- Select an attendee --</option>
            {attendees.map((att, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {att.first_name} {att.last_name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <hr />
        <h4 style={{ marginBottom: 12 }}>Attendees Information</h4>
        {renderAttendeeForm()}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MultiPageModal;
