import React, { useState, useEffect } from "react";
import supabase from "../utils/supabase";

const EditForm = ({ reg: initialReg }) => {
  const [trainings, setTrainings] = useState([]);
  const [reg, setReg] = useState({
    company: "",
    submission_date: "",
    first_name: "",
    last_name: "",
    email: "",
    position: "",
    designation: "",
    country: "",
    trainings: [],
    total_cost: "",
    payment_options: "",
    payment_status: "",
  });

  useEffect(() => {
    fetchTrainings();
    if (initialReg) {
      setReg(initialReg);
    }
  }, [initialReg]);

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

  async function fetchTrainings() {
    const { data } = await supabase
      .from("trainings")
      .select("*")
      .order("id", { ascending: true });
    setTrainings(data);
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

    if (initialReg) {
      // 1. Update the registration fields (excluding `trainings` if you're handling it relationally)
      const { error: updateError } = await supabase
        .from("registrations")
        .update({
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
        })
        .eq("id", initialReg.id);

      if (updateError) {
        console.error("Update error:", updateError);
        return;
      }

      // 2. Delete old training references
      await supabase
        .from("training_references")
        .delete()
        .eq("registration_id", initialReg.id);

      // 3. Re-insert new ones
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
              registration_id: initialReg.id,
            },
          ]);
        }
      }
    } else {
      // INSERT CASE
      const { data: insertedRegistration, error: insertError } = await supabase
        .from("registrations")
        .insert({
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
        })

        .select()
        .single(); // get the inserted row including its ID

      if (insertError) {
        console.error("Insert error:", insertError);
        return;
      }

      const newRegistrationId = insertedRegistration.id;

      // Add training references
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
              registration_id: newRegistrationId,
            },
          ]);
        }
      }
    }
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
            placeholder="Enter Full company"
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
              placeholder="Enter Full first_name"
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
              placeholder="Enter Full last_name"
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
            placeholder="Enter Full email"
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
            placeholder="Enter Full position"
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
            placeholder="Enter Full designation"
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
            placeholder="Enter Full country"
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
            {trainings.map((training, i) => {
              const trainingString = `${training.date}: ${training.name} ($${training.price})`;

              return (
                <React.Fragment key={training.id}>
                  <input
                    type="checkbox"
                    className="btn-check"
                    id={`btn-check-${i}`}
                    autoComplete="off"
                    checked={reg.trainings.includes(trainingString)}
                    value={trainingString}
                    onChange={handleChange}
                  />
                  <label
                    className="btn btn-outline-success m-1"
                    htmlFor={`btn-check-${i}`}
                  >
                    {training.name} - ${training.price}
                  </label>
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
            placeholder="Enter Full total_cost"
            aria-describedby="total_cost"
            readOnly
            onChange={handleChange}
            value={reg.total_cost}
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
            placeholder="Enter Full payment_options"
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

        <div className="mt-3">
          <button type="submit" className="btn btn-primary w-100">
            Submit
          </button>
        </div>
      </form>
    </>
  );
};

export default EditForm;
