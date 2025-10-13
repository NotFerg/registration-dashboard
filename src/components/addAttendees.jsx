import React, { useState, useEffect } from "react";
import supabase from "../utils/supabase";

const AddAttendees = ({
  attendee = {},
  onSave,
  handleSaveGroup,
  handleNext,
  handlePrev,
  attendees,
  step,
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

  const handleTrainingChange = (trainingString, checked) => {
    setForm((prev) => {
      const prevTrainings = Array.isArray(prev.trainings) ? prev.trainings : [];
      const updatedTrainings = checked
        ? [...prevTrainings, trainingString]
        : prevTrainings.filter((t) => t !== trainingString);

      return {
        ...prev,
        trainings: updatedTrainings,
      };
    });
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
              aria-describedby="first_name"
              onChange={handleChange}
              value={form.first_name || ""}
              required
            />
          </div>

          <div className="mb-3 flex-fill">
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
              value={form.last_name || ""}
              required
            />
          </div>
        </div>

        <div className="d-flex flex-row justify-content-between">
          <div className="mb-3 flex-fill pe-3">
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
              value={form.email || ""}
              required
            />
          </div>

          <div className="mb-3 flex-fill">
            <label htmlFor="position" className="form-label">
              Position <span style={{ color: "red" }}> * </span>
            </label>
            <input
              type="text"
              className="form-control"
              id="position"
              name="position"
              placeholder="Enter Position"
              aria-describedby="position"
              onChange={handleChange}
              value={form.position || ""}
              required
            />
          </div>
        </div>

        <div className="d-flex flex-row justify-content-between">
          <div className="mb-3 flex-fill pe-3">
            <label htmlFor="designation" className="form-label">
              Designation <span style={{ color: "red" }}> * </span>
            </label>
            <input
              type="text"
              className="form-control"
              id="designation"
              name="designation"
              placeholder="Enter Designation"
              aria-describedby="designation"
              onChange={handleChange}
              value={form.designation || ""}
              required
            />
          </div>

          <div className="mb-3 flex-fill">
            <label htmlFor="country" className="form-label">
              Country <span style={{ color: "red" }}> * </span>
            </label>
            <input
              type="text"
              className="form-control"
              id="country"
              name="country"
              placeholder="Enter Country"
              aria-describedby="country"
              onChange={handleChange}
              value={form.country || ""}
              required
            />
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="trainings" className="form-label">
            Trainings <span style={{ color: "red" }}> * </span>
          </label>
          <br />
          <div className="border rounded p-2">
            <span className="text-muted ps-2">Early Bird Price</span> <br/>
            {trainings.map((training, i) => {
              const trainingString = `${training.date}: ${training.name} ($${training.price})`;
              const isChecked = form.trainings?.includes(trainingString);
              const checkboxId = `training-${training.id || i}`;

              return (
                <>
                  <div
                    key={training.id || i}
                    className="form-check form-check-inline"
                  >
                    <input
                      type="checkbox"
                      className="btn-check"
                      id={checkboxId}
                      name="trainings"
                      value={trainingString}
                      checked={isChecked}
                      onChange={(e) => {
                        handleTrainingChange(trainingString, e.target.checked);
                      }}
                    />
                    <label
                      className="form-check-label btn btn-outline-success m-1"
                      htmlFor={checkboxId}
                    >
                      {training.name} - ${training.price}
                    </label>
                  </div>
                  {i == 4 && <hr className="w-100" />}
                </>
              );
            })}
          </div>
        </div>
        <div className="text-center mt-4 mb-4">
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={() => handlePrev(form)}
            disabled={step === 0}
          >
            <i className="bi bi-caret-left"></i>
          </button>
          <small className="mx-3 text-muted">
            {/* Attendee {attendees.length || 1} of {step + 1} */}
            Attendee {step + 1} of {attendees.length || 1}
          </small>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={() => handleNext(form)}
          >
            <i className="bi bi-caret-right"></i>
          </button>
        </div>

        <hr />

        <div className="vstack gap-2">
          <div className="d-flex"></div>
          <button type="submit" className="btn btn-success w-100">
            <i className="bi bi-people-fill"></i> Save Attendee
          </button>
          <button className="btn btn-primary w-100" onClick={handleSaveGroup}>
            <i className="bi bi-people-fill"></i> Save Group Registration
          </button>
        </div>
      </form>
    </>
  );
};

export default AddAttendees;
