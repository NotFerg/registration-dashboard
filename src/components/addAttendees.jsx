import React, { useState, useEffect } from "react";
import supabase from "../utils/supabase";

const AddAttendees = ({
  attendee = {},
  onSave,
  handleSaveGroup,
  handleNext,
  handlePrev,
  attendees = [],
  step = 0,
}) => {
  const [form, setForm] = useState(attendee);
  const [trainings, setTrainings] = useState([]);

  useEffect(() => {
    setForm(attendee);
  }, [attendee]);

  useEffect(() => {
    async function fetchTrainings() {
      const { data } = await supabase.from("trainings").select("*");
      setTrainings(data || []);
    }
    fetchTrainings();
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prevFormData) => ({
      ...prevFormData,
      [id]: value,
    }));
  };

  // Check if a specific training option is selected for this attendee
  const isTrainingSelected = (training) => {
    if (!form.trainings || !Array.isArray(form.trainings)) return false;
    const trainingString = `${training.date}: ${training.name} ($${training.price})`;

    return form.trainings.some(
      (t) =>
        t === trainingString ||
        (typeof t === "string" && t.toLowerCase().includes(training.name.toLowerCase()))
    );
  };

  // Dynamic toggle for adding/removing trainings and auto-updating subtotal
  const handleTrainingToggle = (training, checked) => {
    const trainingString = `${training.date}: ${training.name} ($${training.price})`;
    const prevTrainings = Array.isArray(form.trainings) ? [...form.trainings] : [];

    let updatedTrainings;
    if (checked) {
      updatedTrainings = [...prevTrainings, trainingString];
    } else {
      updatedTrainings = prevTrainings.filter(
        (t) =>
          t !== trainingString &&
          !(typeof t === "string" && t.toLowerCase().includes(training.name.toLowerCase()))
      );
    }

    // Recalculate subtotal for this attendee based on selected trainings
    const priceDelta = parseFloat(training.price) || 0;
    const currentSubtotal = parseFloat(form.subtotal || form.total_cost) || 0;
    const updatedSubtotal = checked
      ? currentSubtotal + priceDelta
      : Math.max(0, currentSubtotal - priceDelta);

    const updatedForm = {
      ...form,
      trainings: updatedTrainings,
      subtotal: updatedSubtotal,
      total_cost: updatedSubtotal,
    };

    setForm(updatedForm);

    // Save attendee state back to parent container instantly
    if (onSave) {
      onSave(updatedForm);
    }
  };

  function handleSubmit(e) {
    e.preventDefault();
    if (onSave) {
      onSave(form);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className='d-flex flex-row justify-content-between'>
          <div className='mb-3 flex-fill pe-3'>
            <label htmlFor='first_name' className='form-label'>
              First Name <span style={{ color: "red" }}> * </span>
            </label>
            <input
              type="text"
              className="form-control"
              id="first_name"
              name="first_name"
              placeholder="Enter First Name"
              onChange={handleChange}
              value={form.first_name || ""}
              required
            />
          </div>

          <div className='mb-3 flex-fill'>
            <label htmlFor='last_name' className='form-label'>
              Last Name <span style={{ color: "red" }}> * </span>
            </label>
            <input
              type="text"
              className="form-control"
              id="last_name"
              name="last_name"
              placeholder="Enter Last Name"
              onChange={handleChange}
              value={form.last_name || ""}
              required
            />
          </div>
        </div>

        <div className='d-flex flex-row justify-content-between'>
          <div className='mb-3 flex-fill pe-3'>
            <label htmlFor='email' className='form-label'>
              Email <span style={{ color: "red" }}> * </span>
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              name="email"
              placeholder="Enter Email"
              onChange={handleChange}
              value={form.email || ""}
              required
            />
          </div>

          <div className='mb-3 flex-fill'>
            <label htmlFor='position' className='form-label'>
              Position <span style={{ color: "red" }}> * </span>
            </label>
            <input
              type="text"
              className="form-control"
              id="position"
              name="position"
              placeholder="Enter Position"
              onChange={handleChange}
              value={form.position || ""}
              required
            />
          </div>
        </div>

        <div className='d-flex flex-row justify-content-between'>
          <div className='mb-3 flex-fill pe-3'>
            <label htmlFor='designation' className='form-label'>
              Designation <span style={{ color: "red" }}> * </span>
            </label>
            <input
              type="text"
              className="form-control"
              id="designation"
              name="designation"
              placeholder="Enter Designation"
              onChange={handleChange}
              value={form.designation || ""}
              required
            />
          </div>

          <div className='mb-3 flex-fill'>
            <label htmlFor='country' className='form-label'>
              Country <span style={{ color: "red" }}> * </span>
            </label>
            <input
              type="text"
              className="form-control"
              id="country"
              name="country"
              placeholder="Enter Country"
              onChange={handleChange}
              value={form.country || ""}
              required
            />
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="trainings" className="form-label fw-bold">
            Trainings <span style={{ color: "red" }}> * </span>
          </label>
          <br />
          <div className="border rounded p-2 bg-light">
            <span className="text-muted ps-2 small">Select options for this attendee</span> <br />
            {trainings.map((training, i) => {
              const trainingString = `${training.date}: ${training.name} ($${training.price})`;
              const isChecked = isTrainingSelected(training);
              
              // Key Fix: Combine attendee step + training ID for globally unique HTML IDs
              const checkboxId = `add-step${step}-training-${training.id || i}`;

              return (
                <React.Fragment key={training.id || i}>
                  <div className="form-check form-check-inline">
                    <input
                      type='checkbox'
                      className='btn-check'
                      id={checkboxId}
                      name='trainings'
                      value={trainingString}
                      checked={isChecked}
                      onChange={(e) => handleTrainingToggle(training, e.target.checked)}
                    />
                    <label
                      className={`form-check-label btn btn-sm m-1 ${
                        isChecked ? "btn-success" : "btn-outline-secondary"
                      }`}
                      htmlFor={checkboxId}
                    >
                      {isChecked && <i className="bi bi-check-lg me-1"></i>}
                      {training.name} - ${training.price}
                    </label>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Navigation Controls */}
        <div className="text-center mt-4 mb-4">
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={handlePrev}
            disabled={step === 0}
          >
            <i className='bi bi-caret-left'></i>
          </button>
          <small className="mx-3 text-muted">
            Attendee {step + 1} of {attendees.length || 1}
          </small>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={handleNext}
          >
            <i className='bi bi-caret-right'></i>
          </button>
        </div>

        <hr />

        {/* Save Controls */}
        <div className="vstack gap-2">
          <button type="submit" className="btn btn-success w-100">
            <i className="bi bi-person-fill"></i> Save Attendee
          </button>
          <button
            type="button"
            className="btn btn-primary w-100"
            onClick={handleSaveGroup}
          >
            <i className="bi bi-people-fill"></i> Save Group Registration
          </button>
        </div>
      </form>
    </>
  );
};

export default AddAttendees;