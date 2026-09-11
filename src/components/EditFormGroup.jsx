import React, { useEffect, useRef, useState } from "react";
import supabase from "../utils/supabase";
import TrainingSelector from "./TrainingSelector";

const EditFormGroup = ({
  reg: initialReg,
  onSave = () => {},
  onSubmitGroup = () => {},
  onHide = () => {},
  isFirst,
  isLast,
  next,
  prev,
  attendees = [],
  step,
}) => {
  const [trainings, setTrainings] = useState([]);
  const [reg, setReg] = useState({
    company: "",
    first_name: "",
    last_name: "",
    email: "",
    position: "",
    designation: "",
    country: "",
    trainings: [],
    training_ids: [],
    total_cost: "",
  });

  const [saveStatus, setSaveStatus] = useState("saved");
  const autoSaveTimer = useRef(null);
  const latestReg = useRef(reg);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    fetchTrainings();

    if (!initialReg) return;

    const parsedTrainings = Array.isArray(initialReg.trainings)
      ? initialReg.trainings
      : typeof initialReg.trainings === "string"
        ? initialReg.trainings
            .split(/\r?\n|,\s*(?=\d{1,2}\/)/)
            .map((training) => training.trim())
            .filter(Boolean)
        : [];

    const updatedReg = {
      ...initialReg,
      trainings: parsedTrainings,
      training_ids: Array.isArray(initialReg.training_ids)
        ? initialReg.training_ids
        : [],
    };

    setReg(updatedReg);
    latestReg.current = updatedReg;
    setSaveStatus("saved");
  }, [initialReg]);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  const scheduleAutoSave = (updatedReg) => {
    latestReg.current = updatedReg;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

    if (!updatedReg.first_name?.trim() || !updatedReg.last_name?.trim()) {
      setSaveStatus("draft");
      return;
    }

    setSaveStatus("saving");

    autoSaveTimer.current = setTimeout(async () => {
      try {
        await onSaveRef.current(updatedReg);
        setSaveStatus("saved");
      } catch (error) {
        console.error("Auto-save attendee failed:", error);
        setSaveStatus("error");
      } finally {
        autoSaveTimer.current = null;
      }
    }, 700);
  };

  const flushAutoSave = async () => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = null;
    }

    const currentReg = latestReg.current;
    if (!currentReg.first_name?.trim() || !currentReg.last_name?.trim()) {
      return;
    }

    setSaveStatus("saving");

    try {
      await onSaveRef.current(currentReg);
      setSaveStatus("saved");
    } catch (error) {
      console.error("Attendee save failed:", error);
      setSaveStatus("error");
      throw error;
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    const updatedReg = {
      ...latestReg.current,
      [id]: value,
    };

    setReg(updatedReg);
    scheduleAutoSave(updatedReg);
  };

  const getTrainingString = (training) =>
    `${training.date}: ${training.name} ($${training.price})`;

  const handleTrainingToggle = (training, checked) => {
    const trainingString = getTrainingString(training);
    const trainingId = Number(training.id);
    const currentTrainings = Array.isArray(latestReg.current.trainings)
      ? latestReg.current.trainings
      : [];
    const currentTrainingIds = Array.isArray(latestReg.current.training_ids)
      ? latestReg.current.training_ids
      : [];

    const updatedTrainings = checked
      ? currentTrainings.includes(trainingString)
        ? currentTrainings
        : [...currentTrainings, trainingString]
      : currentTrainings.filter((value) => value !== trainingString);

    const updatedTrainingIds = checked
      ? currentTrainingIds.includes(trainingId)
        ? currentTrainingIds
        : [...currentTrainingIds, trainingId]
      : currentTrainingIds.filter((id) => id !== trainingId);

    const updatedReg = {
      ...latestReg.current,
      trainings: updatedTrainings,
      training_ids: updatedTrainingIds,
      total_cost: calculateTotalCost(updatedTrainings),
    };

    setReg(updatedReg);
    scheduleAutoSave(updatedReg);
  };

  const handleSave = () => flushAutoSave();

  function calculateTotalCost(trainingStrings) {
    return (trainingStrings || []).reduce((total, str) => {
      if (typeof str !== "string") return total;
      const match = str.match(/\(\$(\d+(?:\.\d{1,2})?)\)/);
      return match ? total + parseFloat(match[1]) : total;
    }, 0);
  }

  async function fetchTrainings() {
    const { data, error } = await supabase
      .from("trainings")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching trainings:", error);
      return;
    }

    setTrainings(data || []);
  }

  const handleSubmitGroup = async (e) => {
    e.preventDefault();
    await flushAutoSave();
    await onSubmitGroup(latestReg.current);
  };

  return (
    <form onSubmit={handleSubmitGroup}>
      <div className="mb-3">
        <label htmlFor="company" className="form-label">
          Company <span style={{ color: "red" }}> * </span>
        </label>
        <input
          type="text"
          className="form-control"
          id="company"
          value={reg.company || ""}
          onChange={handleChange}
          required
        />
      </div>

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
            value={reg.first_name || ""}
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
            onChange={handleChange}
            value={reg.last_name || ""}
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
            onChange={handleChange}
            value={reg.email || ""}
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
            onChange={handleChange}
            value={reg.position || ""}
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
            onChange={handleChange}
            value={reg.designation || ""}
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
            placeholder="Enter Full country"
            onChange={handleChange}
            value={reg.country || ""}
            required
          />
        </div>
      </div>

      <TrainingSelector
        trainings={trainings}
        idPrefix={`edit-group-step${step}`}
        isSelected={(training) =>
          (reg.training_ids || []).map(Number).includes(Number(training.id))
        }
        onToggle={handleTrainingToggle}
      />

      <div className="mb-3">
        <label htmlFor="total_cost" className="form-label">
          Total Cost <span style={{ color: "red" }}> * </span>
        </label>
        <input
          type="number"
          className="form-control"
          id="total_cost"
          name="total_cost"
          value={reg.total_cost || ""}
          onChange={handleChange}
          required
        />
      </div>

      <div className="d-flex justify-content-center align-items-center mt-4 mb-4">
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={async () => {
            await handleSave();
            prev();
          }}
          disabled={isFirst}
        >
          <i className="bi bi-caret-left"></i>
        </button>

        <small className="mx-3 text-muted">
          Attendee {attendees.length === 0 ? 0 : step + 1} of {attendees.length}
        </small>

        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={async () => {
            await handleSave();
            next();
          }}
          disabled={isLast}
        >
          <i className="bi bi-caret-right"></i>
        </button>
      </div>

      <div className="text-center mb-3" aria-live="polite">
        {saveStatus === "saving" && (
          <small className="text-muted">
            <span className="spinner-border spinner-border-sm me-1" role="status" />
            Saving changes…
          </small>
        )}
        {saveStatus === "saved" && (
          <small className="text-success">
            <i className="bi bi-check-circle-fill me-1" />
            Changes saved
          </small>
        )}
        {saveStatus === "draft" && (
          <small className="text-muted">Enter a first and last name to save this attendee.</small>
        )}
        {saveStatus === "error" && (
          <small className="text-danger">
            <i className="bi bi-exclamation-circle-fill me-1" />
            Could not save changes. Please try again.
          </small>
        )}
      </div>

      <hr />

      <div className="vstack gap-2">
        <button type="submit" className="btn btn-primary w-100">
          <i className="bi bi-people-fill"></i> Save Group
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary w-100"
          onClick={onHide}
        >
          Close
        </button>
      </div>
    </form>
  );
};

export default EditFormGroup;
