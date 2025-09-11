import React, { useState, useEffect } from "react";
import supabase from "../../utils/supabase";
import Swal from "sweetalert2";

const Form = ({}) => {
  const [trainings, setTrainings] = useState([]);
  const [reg, setReg] = useState({
    company: "",
    submission_date: new Date().toISOString().slice(0, 19).replace("T", " "),
    first_name: "",
    last_name: "",
    email: "",
    position: "",
    designation: "",
    country: "",
    trainings: [],
    total_cost: 0,
    payment_options: "",
    registration_type: "Myself",
    payment_status: "",
  });

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;

    if (type === "checkbox") {
      const trainingName = value;
      setReg((prev) => {
        const prevTrainings = Array.isArray(prev.trainings)
          ? prev.trainings
          : [];
        const updatedTrainings = checked
          ? [...prevTrainings, trainingName]
          : prevTrainings.filter((t) => t !== trainingName);

        const totalCost = updatedTrainings.reduce((acc, training) => {
          const match = training.match(/\(\$(\d+(?:\.\d{1,2})?)\)/);
          const price = match ? parseFloat(match[1]) : 0;
          return acc + price;
        }, 0);

        return {
          ...prev,
          trainings: updatedTrainings,
          total_cost: totalCost,
        };
      });
    } else {
      setReg((prevFormData) => ({
        ...prevFormData,
        [id]: value,
      }));
    }
  };

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

  function parseTrainingLine(line) {
    const match = line.match(/^(.+?):\s*(.+?)\s*\(\$(\d+(?:\.\d{1,2})?)\)$/);
    if (!match) return null;
    return {
      date: match[1].trim(),
      name: match[2].trim(),
      price: parseFloat(match[3]),
    };
  }

  async function upsertTrainingByNameDatePrice(name, date, price) {
    const { data: existing, error: fetchError } = await supabase
      .from("trainings")
      .select("id")
      .eq("name", name)
      .eq("date", date)
      .eq("price", price)
      .maybeSingle();

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return null;
    }

    if (existing) {
      return existing.id;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("trainings")
      .insert([{ name, date, price }])
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return null;
    }

    return inserted.id;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Insert new registration
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
          trainings: reg.trainings.join(", "),
          company: reg.company,
          registration_type: reg.registration_type,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return;
    }

    // Insert new training references
    for (const line of reg.trainings) {
      const parsed = parseTrainingLine(line);
      if (!parsed) continue;

      const trainingId = await upsertTrainingByNameDatePrice(
        parsed.name,
        parsed.date,
        parsed.price
      );

      if (trainingId) {
        await supabase.from("training_references").insert([
          {
            training_id: trainingId,
            registration_id: newReg.id,
          },
        ]);
      }
    }

    Swal.fire({
      text: "Registration added successfully",
      icon: "success",
      confirmButtonText: "OK",
      target: document.getElementById("addRegistrationModal"),
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.reload();
      }
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
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
            name="designation"
            placeholder="Enter Designation"
            aria-describedby="designation"
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
            name="country"
            placeholder="Enter Country"
            aria-describedby="country"
            onChange={handleChange}
            value={reg.country}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="trainings" className="form-label">
            Trainings <span style={{ color: "red" }}> * </span>
          </label>
          <br />
          <div className="border rounded p-2">
            <span className="text-muted ps-2 pb-2">Early Bird Price</span>
            {trainings.map((training, i) => {
              const trainingString = `${training.date}: ${training.name} ($${training.price})`;
              const isChecked = reg.trainings.includes(trainingString);

              return (
                <React.Fragment key={training.id || i}>
                  <input
                    type="checkbox"
                    className="btn-check"
                    id={`btn-check-${training.id || i}`}
                    name="trainings"
                    value={trainingString}
                    checked={isChecked}
                    onChange={(e) => {
                      handleChange(e);
                    }}
                  />
                  <label
                    className="btn btn-outline-success m-1"
                    htmlFor={`btn-check-${training.id || i}`}
                  >
                    {training.name} - ${training.price}
                  </label>
                  {i == 4 && <hr />}
                </React.Fragment>
              );
            })}
          </div>
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
            <option value="Partial Payment">Partial Payment</option>
          </select>
        </div>

        <div className="mt-3">
          <button type="submit" className="btn btn-primary w-100">
            Submit
          </button>
        </div>
      </form>
    </>
  );
};

export default Form;
