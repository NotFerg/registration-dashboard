import React, { useState, useEffect } from "react";
import supabase from "../utils/supabase";

const AddFormGroup = () => {
  const [trainings, setTrainings] = useState([]);
  const [reg, setReg] = useState({
    first_name: "",
    last_name: "",
    email: "",
    company: "",
    total_cost: 0,
    payment_options: "",
    registration_type: "Someone Else / Group",
    payment_status: "",
    attendees: {
      first_name: "",
      last_name: "",
      email: "",
      position: "",
      designation: "",
      country: "",
      trainings: [],
      subtotal: 0,
    },
  });

  useEffect(() => {
    fetchTrainings().then((data) => setTrainings(data));
  }, []);

  async function fetchTrainings() {
    const { data } = await supabase
      .from("trainings")
      .select("*")
      .order("id", { ascending: true });
    return data;
  }

  function handleChange(e) {
    const { id, value } = e.target;
    setReg((prev) => ({ ...prev, [id]: value }));
  }

  function handleSubmit(e) {
    console.log(e);
    e.preventDefault();
  }

  return (
    <>
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
          placeholder="Enter Payment Options"
          aria-describedby="payment_options"
          onChange={handleChange}
          value={reg.payment_options}
          required
        />
      </div>
    </>
  );
};

export default AddFormGroup;
