import React, { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import AddAttendees from "./addAttendees";
const AddMultiPageModal = ({ show, onHide }) => {
  const [step, setStep] = useState(0);
  const [attendees, setAttendees] = useState([]);
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
      return updated;
    });
    // Optionally, update total cost here
  }

  function handleNext() {
    if (step < attendees.length) {
      setStep(step + 1);
    } else {
      // Add a new attendee slot
      setAttendees([...attendees, {}]);
      setStep(step + 1);
    }
  }

  function handlePrev() {
    setStep(Math.max(step - 1, 0));
  }

  function handleSaveGroup(e) {
    e.preventDefault();
    console.log("Registration Info:", reg);
    console.log("Attendees:", attendees);
    console.log("Full Group Registration:", { ...reg, attendees });
    onHide();
  }

  return (
    <Modal show={show} onHide={onHide} size='lg'>
      <Modal.Header closeButton>
        <Modal.Title>
          <h3>Add Group Registration</h3>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className='mb-3'>
          <label htmlFor='company' className='form-label'>
            Company <span style={{ color: "red" }}> * </span>
          </label>
          <input
            type='text'
            className='form-control'
            id='company'
            name='company'
            placeholder='Enter Company Name'
            aria-describedby='company'
            onChange={handleChange}
            value={reg.company}
            required
          />
        </div>

        <div className='d-flex flex-row justify-content-between'>
          <div className='mb-3'>
            <label htmlFor='first_name' className='form-label'>
              First Name <span style={{ color: "red" }}> * </span>
            </label>
            <input
              type='text'
              className='form-control'
              id='first_name'
              name='first_name'
              placeholder='Enter First Name'
              aria-describedby='first_name'
              onChange={handleChange}
              value={reg.first_name}
              required
            />
          </div>

          <div className='mb-3'>
            <label htmlFor='last_name' className='form-label'>
              Last Name <span style={{ color: "red" }}> * </span>
            </label>
            <input
              type='text'
              className='form-control'
              id='last_name'
              name='last_name'
              placeholder='Enter Last Name'
              aria-describedby='last_name'
              onChange={handleChange}
              value={reg.last_name}
              required
            />
          </div>
        </div>

        <div className='mb-3'>
          <label htmlFor='email' className='form-label'>
            Email <span style={{ color: "red" }}> * </span>
          </label>
          <input
            type='email'
            className='form-control'
            id='email'
            name='email'
            placeholder='Enter Email'
            aria-describedby='email'
            onChange={handleChange}
            value={reg.email}
            required
          />
        </div>

        <div className='mb-3'>
          <label htmlFor='total_cost' className='form-label'>
            Total Cost <span style={{ color: "red" }}> * </span>
          </label>
          <input
            type='number'
            className='form-control'
            id='total_cost'
            name='total_cost'
            placeholder='Enter Total Cost'
            aria-describedby='total_cost'
            onChange={handleChange}
            value={reg.total_cost}
            readOnly
            required
          />
        </div>

        <div className='mb-3'>
          <label htmlFor='payment_options' className='form-label'>
            Payment Options <span style={{ color: "red" }}> * </span>
          </label>
          <input
            type='text'
            className='form-control'
            id='payment_options'
            name='payment_options'
            placeholder='Enter Full Payment Options'
            aria-describedby='payment_options'
            onChange={handleChange}
            value={reg.payment_options}
            required
          />
        </div>
        <hr />
        <h4 style={{ marginBottom: 20 }}>Attendees Information</h4>
        <AddAttendees
          attendee={attendees[step] || {}}
          onSave={handleAttendeeSave}
        />
      </Modal.Body>
      <Modal.Footer>
        <div className='w-100 d-flex justify-content-between'>
          <Button
            variant='secondary'
            onClick={handlePrev}
            disabled={step === 0}
          >
            Previous
          </Button>
          <small>
            Attendee {attendees.length || 1} of {step + 1}
          </small>
          <Button variant='primary' onClick={handleNext}>
            Next
          </Button>
          <Button variant='success' onClick={handleSaveGroup}>
            Save Group Registration
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default AddMultiPageModal;
