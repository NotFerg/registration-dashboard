import React, { useState, useEffect } from "react";
import supabase from "../../utils/supabase";
import Swal from "sweetalert2";
import TrainingSelector from "../TrainingSelector";

const Form = () => {
  const [trainings, setTrainings] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [reg, setReg] = useState({
    company: "",
    submission_date: new Date().toISOString().slice(0, 19).replace("T", " "),
    first_name: "",
    last_name: "",
    email: "",
    position: "",
    designation: "",
    country: "",
    total_cost: 0,
    payment_options: "",
    registration_type: "Myself",
    payment_status: "",
  });

  useEffect(() => {
    fetchTrainings().then((data) => setTrainings(data || []));
  }, []);

  async function fetchTrainings() {
    const { data, error } = await supabase
      .from("trainings")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching trainings:", error);
      return [];
    }
    return data;
  }

  // Handle Checkbox Toggles
  const handleCheckboxChange = (id) => {
    let nextSelected;
    if (selectedIds.includes(id)) {
      nextSelected = selectedIds.filter((item) => item !== id);
    } else {
      nextSelected = [...selectedIds, id];
    }

    setSelectedIds(nextSelected);

    // Calculate total cost dynamically based on selected items
    const totalCost = trainings
      .filter((item) => nextSelected.includes(item.id))
      .reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

    setReg((prev) => ({
      ...prev,
      total_cost: totalCost,
    }));
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setReg((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (selectedIds.length === 0) {
      Swal.fire("Warning", "Please select at least one training.", "warning");
      return;
    }

    // Prepare human-readable summary string for the 'trainings' column
    const selectedTrainingObjects = trainings.filter((t) =>
      selectedIds.includes(t.id),
    );
    const trainingSummary = selectedTrainingObjects
      .map((t) => `${t.name} (${t.date}) - $${t.price}`)
      .join(", ");

    // 1. Insert new registration record
    const { data: newReg, error: insertError } = await supabase
      .from("registrations")
      .insert([
        {
          submission_date: reg.submission_date,
          first_name: reg.first_name,
          last_name: reg.last_name,
          email: reg.email,
          position: reg.position,
          designation: reg.designation,
          country: reg.country,
          total_cost: reg.total_cost,
          payment_options: reg.payment_options,
          payment_status: reg.payment_status,
          trainings: trainingSummary,
          company: reg.company,
          registration_type: reg.registration_type,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      Swal.fire("Error", "Failed to add registration", "error");
      return;
    }

    // 2. Insert foreign key references into training_references join table
    const joinRows = selectedIds.map((trainingId) => ({
      training_id: trainingId,
      registration_id: newReg.id,
    }));

    const { error: refError } = await supabase
      .from("training_references")
      .insert(joinRows);

    if (refError) {
      console.error("Training references insert error:", refError);
    }

    Swal.fire({
      text: "Registration added successfully",
      icon: "success",
      confirmButtonText: "OK",
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.reload();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label htmlFor="company" className="form-label">
          Company <span style={{ color: "red" }}> * </span>
        </label>
        <input
          type="text"
          className="form-control"
          id="company"
          placeholder="Enter Company Name"
          onChange={handleChange}
          value={reg.company}
          required
        />
      </div>

      <div className="d-flex flex-row justify-content-between gap-2">
        <div className="mb-3 w-100">
          <label htmlFor="first_name" className="form-label">
            First Name <span style={{ color: "red" }}> * </span>
          </label>
          <input
            type="text"
            className="form-control"
            id="first_name"
            placeholder="Enter First Name"
            onChange={handleChange}
            value={reg.first_name}
            required
          />
        </div>

        <div className="mb-3 w-100">
          <label htmlFor="last_name" className="form-label">
            Last Name <span style={{ color: "red" }}> * </span>
          </label>
          <input
            type="text"
            className="form-control"
            id="last_name"
            placeholder="Enter Last Name"
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
          placeholder="Enter Email"
          onChange={handleChange}
          value={reg.email}
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="position" className="form-label">
          Position <span style={{ color: "red" }}> * </span>
        </label>
        <input
          type="text"
          className="form-control"
          id="position"
          placeholder="Enter Position"
          onChange={handleChange}
          value={reg.position}
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="designation" className="form-label">
          Designation <span style={{ color: "red" }}> * </span>
        </label>
        <input
          type="text"
          className="form-control"
          id="designation"
          placeholder="Enter Designation"
          onChange={handleChange}
          value={reg.designation}
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="country" className="form-label">
          Country <span style={{ color: "red" }}> * </span>
        </label>
        <input
          type="text"
          className="form-control"
          id="country"
          placeholder="Enter Country"
          onChange={handleChange}
          value={reg.country}
          required
        />
      </div>

      {/* MULTI-SELECT CHECKBOXES */}
      <TrainingSelector
        trainings={trainings}
        idPrefix="add-registration"
        caption="Select options for this registration"
        isSelected={(training) => selectedIds.includes(training.id)}
        onToggle={(training) => handleCheckboxChange(training.id)}
      />

      <div className="mb-3">
        <label htmlFor="total_cost" className="form-label">
          Total Cost ($)
        </label>
        <input
          type="number"
          className="form-control"
          id="total_cost"
          value={reg.total_cost}
          readOnly
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
          placeholder="Enter Full Payment Options"
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
          onChange={handleChange}
          value={reg.payment_status}
          required
        >
          <option value="">Select Payment Status</option>
          <option value="Paid">Paid</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Partial Payment">Partial Payment</option>
        </select>
      </div>

      <div className="mt-3">
        <button type="submit" className="btn btn-primary w-100">
          Submit
        </button>
      </div>
    </form>
  );
};

export default Form;
