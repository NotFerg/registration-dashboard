import React, { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import AddAttendees from "./addAttendees";
import supabase from "../utils/supabase";
import Swal from "sweetalert2";
const AddMultiPageModal = ({ show, onHide }) => {
  const attendeeTemplate = {
    first_name: "",
    last_name: "",
    email: "",
    position: "",
    designation: "",
    country: "",
    trainings: [],
  };
  const [step, setStep] = useState(0);
  const [attendees, setAttendees] = useState([{ ...attendeeTemplate }]);
  const [reg, setReg] = useState({
    first_name: "",
    last_name: "",
    email: "",
    company: "",
    total_cost: 0,
    payment_options: "",
    registration_type: "Someone Else / Group",
    payment_status: "",
  });

  function handleChange(e) {
    const { id, value } = e.target;
    setReg((prev) => ({ ...prev, [id]: value }));
  }

  function handleAttendeeSave(attendeeData) {
    setAttendees((prev) => {
      const updated = [...prev];
      updated[step] = attendeeData;
      // Calculate total cost for all attendees
      const totalCost = updated.reduce((acc, att) => {
        if (att && Array.isArray(att.trainings)) {
          return (
            acc +
            att.trainings.reduce((sum, training) => {
              const match = training.match(/\(\$(\d+(?:\.\d{1,2})?)\)/);
              const price = match ? parseFloat(match[1]) : 0;
              return sum + price;
            }, 0)
          );
        }
        return acc;
      }, 0);

      setReg((prev) => ({
        ...prev,
        total_cost: totalCost,
      }));

      return updated;
    });

    // console.log("Attendee Data", attendeeData);
  }

  function handleNext() {
    if (step < attendees.length - 1) {
      setStep(step + 1);
    } else {
      // Add a new attendee slot with template
      setAttendees([...attendees, { ...attendeeTemplate }]);
      setStep(step + 1);
    }
  }

  function handlePrev() {
    setStep(Math.max(step - 1, 0));
  }

  async function handleSaveGroup(e) {
    e.preventDefault();
    console.log("Full Group Registration:", { ...reg, attendees });

    try {
      // 1. Insert into registrations table
      const { data: registration, error: regError } = await supabase
        .from("registrations")
        .insert([
          {
            first_name: reg.first_name,
            last_name: reg.last_name,
            email: reg.email,
            company: reg.company,
            total_cost: reg.total_cost,
            payment_options: reg.payment_options,
            registration_type: reg.registration_type,
            payment_status: reg.payment_status,
          },
        ])
        .select()
        .single();

      if (regError) throw regError;

      const registrationId = registration.id;

      // 2. Insert attendees with foreign key
      const attendeesWithSubtotal = attendees.map((att) => {
        const trainingsArray = Array.isArray(att.trainings)
          ? att.trainings
          : [];

        const subtotal = trainingsArray.reduce((acc, training) => {
          const match = training.match(/\(\$(\d+(?:\.\d{1,2})?)\)/);
          const price = match ? parseFloat(match[1]) : 0;
          return acc + price;
        }, 0);

        return {
          registration_id: registrationId,
          first_name: att.first_name,
          last_name: att.last_name,
          email: att.email,
          position: att.position,
          designation: att.designation,
          country: att.country,
          trainings: att.trainings.join(", "), // or keep as array if using text[]
          subtotal: subtotal,
        };
      });

      const { error: attendeeError } = await supabase
        .from("attendees")
        .insert(attendeesWithSubtotal);

      if (attendeeError) throw attendeeError;

      Swal.fire({
        title: "Group registration successfully saved!",
        icon: "success",
        confirmButtonText: "OK",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.reload();
        }
      });
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: "There was an error saving the registration. Please try again.",
        icon: "error",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.reload();
        }
      });
    }
  }

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <h3>Add Group Registration</h3>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          <label htmlFor="company" className="form-label">
            Company <span style={{ color: "red" }}> * </span>
          </label>
          <input
            type="text"
            className="form-control"
            id="company"
            name="company"
            placeholder="Enter Company Name"
            aria-describedby="company"
            onChange={handleChange}
            value={reg.company}
            required
          />
        </div>

        <div className="d-flex flex-row justify-content-between">
          <div className="mb-3">
            <label htmlFor="first_name" className="form-label">
              First Name <span style={{ color: "red" }}> * </span>
            </label>
            <input
              type="text"
              className="form-control"
              id="first_name"
              name="first_name"
              placeholder="Enter First Name"
              aria-describedby="first_name"
              onChange={handleChange}
              value={reg.first_name}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="last_name" className="form-label">
              Last Name <span style={{ color: "red" }}> * </span>
            </label>
            <input
              type="text"
              className="form-control"
              id="last_name"
              name="last_name"
              placeholder="Enter Last Name"
              aria-describedby="last_name"
              onChange={handleChange}
              value={reg.last_name}
              required
            />
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            Email <span style={{ color: "red" }}> * </span>
          </label>
          <input
            type="email"
            className="form-control"
            id="email"
            name="email"
            placeholder="Enter Email"
            aria-describedby="email"
            onChange={handleChange}
            value={reg.email}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="total_cost" className="form-label">
            Total Cost <span style={{ color: "red" }}> * </span>
          </label>
          <input
            type="number"
            className="form-control"
            id="total_cost"
            name="total_cost"
            placeholder="Enter Total Cost"
            aria-describedby="total_cost"
            onChange={handleChange}
            value={reg.total_cost}
            readOnly
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="payment_options" className="form-label">
            Payment Options <span style={{ color: "red" }}> * </span>
          </label>
          <input
            type="text"
            className="form-control"
            id="payment_options"
            name="payment_options"
            placeholder="Enter Full Payment Options"
            aria-describedby="payment_options"
            onChange={handleChange}
            value={reg.payment_options}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="payment_status" className="form-label">
            Payment Status <span style={{ color: "red" }}> * </span>
          </label>
          <select
            className="form-select"
            id="payment_status"
            name="payment_status"
            aria-describedby="payment_status"
            onChange={handleChange}
            value={reg.payment_status}
            required
          >
            <option value="">Select Payment Status</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>
        <hr />
        <h4 style={{ marginBottom: 20 }}>Attendees Information</h4>
        <AddAttendees
          attendee={attendees[step] || {}}
          onSave={handleAttendeeSave}
        />
      </Modal.Body>
      <Modal.Footer>
        <div className="w-100 d-flex justify-content-between">
          <Button
            variant="secondary"
            onClick={handlePrev}
            disabled={step === 0}
          >
            Previous
          </Button>
          <small>
            {/* Attendee {attendees.length || 1} of {step + 1} */}
            Attendee {step + 1} of {attendees.length || 1}
          </small>
          <Button variant="primary" onClick={handleNext}>
            Next
          </Button>
          <Button variant="success" onClick={handleSaveGroup}>
            Save Group Registration
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default AddMultiPageModal;
