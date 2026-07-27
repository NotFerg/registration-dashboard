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

  // Update form state AND propagate to parent on every input change
  const handleChange = (e) => {
    const { id, value } = e.target;
    const updatedForm = {
      ...form,
      [id]: value,
    };
    setForm(updatedForm);

    if (onSave) {
      onSave(updatedForm);
    }
  };

  const getTrainingString = (training) => {
    return `${training.date ? training.date + ": " : ""}${training.name} ($${training.price})`;
  };

  const isTrainingSelected = (training) => {
    if (!form.trainings || !Array.isArray(form.trainings)) return false;
    const targetString = getTrainingString(training);

    return form.trainings.some((t) => {
      if (typeof t === "object" && t !== null) {
        return t.id === training.id;
      }
      return t === targetString;
    });
  };

  const handleTrainingToggle = (training, checked) => {
    const trainingString = getTrainingString(training);
    const prevTrainings = Array.isArray(form.trainings) ? [...form.trainings] : [];

    let updatedTrainings;
    if (checked) {
      updatedTrainings = [...prevTrainings, trainingString];
    } else {
      updatedTrainings = prevTrainings.filter((t) => {
        if (typeof t === "object" && t !== null) {
          return t.id !== training.id;
        }
        return t !== trainingString;
      });
    }

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

    if (onSave) {
      onSave(updatedForm);
    }
  };

  // Auto-save before changing steps
  const onNavigatePrev = () => {
    if (onSave) onSave(form);
    handlePrev();
  };

  const onNavigateNext = () => {
    if (onSave) onSave(form);
    handleNext();
  };

  return (
    <>
      <div>
        <div className="d-flex flex-row justify-content-between">
          <div className="mb-3 flex-fill pe-3">
            <label htmlFor="first_name" className="form-label">
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
              const trainingString = getTrainingString(training);
              const isChecked = isTrainingSelected(training);
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

        {/* Navigation Controls */}
        <div className="d-flex justify-content-between align-items-center mt-4 mb-3">
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={onNavigatePrev}
            disabled={step === 0}
          >
            <i className="bi bi-caret-left me-1"></i> Previous Attendee
          </button>
          
          <small className="text-muted fw-bold">
            Attendee {step + 1} of {attendees.length || 1}
          </small>

          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={onNavigateNext}
          >
            + Add / Next Attendee <i className="bi bi-caret-right ms-1"></i>
          </button>
        </div>

        <hr />

        {/* Single Primary Action */}
        <div className="vstack gap-2">
          <button
            type="button"
            className="btn btn-primary btn-lg w-100"
            onClick={handleSaveGroup}
          >
            <i className="bi bi-people-fill me-2"></i> Save Group Registration
          </button>
        </div>
      </div>
    </>
  );
};

export default AddAttendees;