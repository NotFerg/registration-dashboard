import React, { useState, useEffect } from "react";
import supabase from "../utils/supabase";
import TrainingSelector from "./TrainingSelector";

const EditFormGroup = ({
  reg: initialReg,
  onSave = () => {},
  onSubmitGroup = () => {},
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
    total_cost: "",
  });

  useEffect(() => {
    fetchTrainings();
    if (initialReg) {
      console.log("Loading initialReg:", initialReg);

      // Parse the trainings string from database into an array
      let parsedTrainings = [];

      if (initialReg.trainings) {
        if (typeof initialReg.trainings === "string") {
          // Split by \r\n and clean up whitespace
          parsedTrainings = initialReg.trainings
            .split(/\r?\n/)
            .map((training) => training.trim())
            .filter((training) => training.length > 0);
        } else if (Array.isArray(initialReg.trainings)) {
          // Handle array case - check if it's array with one string containing \r\n
          if (
            initialReg.trainings.length === 1 &&
            typeof initialReg.trainings[0] === "string" &&
            initialReg.trainings[0].includes("\r\n")
          ) {
            // Split the single string element
            parsedTrainings = initialReg.trainings[0]
              .split(/\r?\n/)
              .map((training) => training.trim())
              .filter((training) => training.length > 0);
          } else {
            parsedTrainings = initialReg.trainings;
          }
        }
      }

      console.log("Parsed trainings:", parsedTrainings);

      // Calculate the correct total cost from parsed trainings
      const calculatedTotal = calculateTotalCost(parsedTrainings);
      console.log("Calculated total cost:", calculatedTotal);

      const updatedReg = {
        ...initialReg,
        trainings: parsedTrainings,
        total_cost: calculatedTotal,
      };

      console.log("Setting reg to:", updatedReg);
      setReg(updatedReg);
    }
  }, [initialReg]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setReg((prevFormData) => ({
      ...prevFormData,
      [id]: value,
    }));
  };

  // Same string shape the attendee `trainings` column is persisted in, so
  // parseTrainingLine / calculateTotalCost keep working unchanged.
  const getTrainingString = (training) =>
    `${training.date}: ${training.name} ($${training.price})`;

  const handleTrainingToggle = (training, checked) => {
    const trainingString = getTrainingString(training);
    setReg((prev) => {
      const current = Array.isArray(prev.trainings) ? prev.trainings : [];
      const updatedTrainings = checked
        ? [...current, trainingString]
        : current.filter((t) => t !== trainingString);

      return {
        ...prev,
        trainings: updatedTrainings,
        total_cost: calculateTotalCost(updatedTrainings),
      };
    });
  };

  const handleSave = () => {
    onSave(reg);
  };

  function calculateTotalCost(trainingStrings) {
    return trainingStrings.reduce((total, str) => {
      const match = str.match(/\(\$(\d+(?:\.\d{1,2})?)\)/);
      return match ? total + parseFloat(match[1]) : total;
    }, 0);
  }

  function parseTrainingLine(line) {
    if (!line || typeof line !== "string") return null;
    const regex = /^(.+?)\s*:\s*(.+?)\s*\(\$(\d+(?:\.\d{1,2})?)\)$/;
    const match = line.trim().match(regex);
    if (!match) return null;
    return {
      date: match[1].trim(),
      name: match[2].trim(),
      price: parseFloat(match[3]),
    };
  }

  async function upsertTrainingByNameDatePrice(name, date, price) {
    const { data: existing } = await supabase
      .from("trainings")
      .select("id")
      .eq("name", name)
      .eq("date", date)
      .eq("price", price)
      .maybeSingle();

    if (existing) return existing.id;

    const { data: inserted, error } = await supabase
      .from("trainings")
      .insert([{ name, date, price }])
      .select("id")
      .single();

    if (error) {
      console.error("Error upserting training:", error);
      return null;
    }
    return inserted.id;
  }

  async function fetchTrainings() {
    const { data } = await supabase
      .from("trainings")
      .select("*")
      .order("id", { ascending: true });
    setTrainings(data || []);
  }


  const handleSubmitGroup = async (e) => {
    e.preventDefault();

    if (initialReg) {
      // 1. Update REGISTRATION-level fields
      await supabase
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
        })
        .eq("id", initialReg.id);

      // 2. Update or Insert the ATTENDEE (by reg.id)
      if (reg.id) {
        const { error: attendeeUpdateError } = await supabase
          .from("attendees")
          .update({
            first_name: reg.first_name,
            last_name: reg.last_name,
            email: reg.email,
            position: reg.position,
            designation: reg.designation,
            country: reg.country,
            trainings: reg.trainings.join("\r\n"),
            subtotal: reg.total_cost,
          })
          .eq("id", reg.id);

        if (attendeeUpdateError) {
          console.error("Attendee update error:", attendeeUpdateError);
          return;
        }
      } else {
        const { error: insertError } = await supabase
          .from("attendees")
          .insert([
            {
              first_name: reg.first_name,
              last_name: reg.last_name,
              email: reg.email,
              position: reg.position,
              designation: reg.designation,
              country: reg.country,
              trainings: reg.trainings.join("\r\n"),
              subtotal: reg.total_cost,
              registration_id: initialReg.id,
            },
          ])
          .select()
          .single();

        if (insertError) {
          console.error("Attendee insert error:", insertError);
          return;
        }
      }

      // 3. Insert new training_references
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
              attendee_id: reg.id || null,
            },
          ]);
        }
      }
    }

    onSubmitGroup();
  };

  return (
    <form onSubmit={handleSubmitGroup}>
      <div className='mb-3'>
        <label htmlFor='company' className='form-label'>
          Company <span style={{ color: "red" }}> * </span>
        </label>
        <input
          type='text'
          className='form-control'
          id='company'
          value={reg.company || ""}
          onChange={handleChange}
          required
        />
      </div>

      <div className='d-flex flex-row justify-content-between'>
        <div className='mb-3 flex-fill pe-3'>
          <label htmlFor='first_name' className='form-label'>
            First Name <span style={{ color: "red" }}> * </span>
          </label>
          <input
            type='text'
            className='form-control'
            id='first_name'
            name='first_name'
            placeholder='Enter First Name'
            onChange={handleChange}
            value={reg.first_name || ""}
            required
          />
        </div>

        <div className='mb-3 flex-fill'>
          <label htmlFor='last_name' className='form-label'>
            Last Name <span style={{ color: "red" }}> * </span>
          </label>
          <input
            type='text'
            className='form-control'
            id='last_name'
            name='last_name'
            placeholder='Enter Last Name'
            onChange={handleChange}
            value={reg.last_name || ""}
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
            type='email'
            className='form-control'
            id='email'
            name='email'
            placeholder='Enter Email'
            onChange={handleChange}
            value={reg.email || ""}
            required
          />
        </div>

        <div className='mb-3 flex-fill'>
          <label htmlFor='position' className='form-label'>
            Position <span style={{ color: "red" }}> * </span>
          </label>
          <input
            type='text'
            className='form-control'
            id='position'
            name='position'
            placeholder='Enter Position'
            onChange={handleChange}
            value={reg.position || ""}
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
            type='text'
            className='form-control'
            id='designation'
            name='designation'
            placeholder='Enter Designation'
            onChange={handleChange}
            value={reg.designation || ""}
            required
          />
        </div>

        <div className='mb-3 flex-fill'>
          <label htmlFor='country' className='form-label'>
            Country <span style={{ color: "red" }}> * </span>
          </label>
          <input
            type='text'
            className='form-control'
            id='country'
            name='country'
            placeholder='Enter Full country'
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
          (reg.trainings || []).includes(getTrainingString(training))
        }
        onToggle={handleTrainingToggle}
      />

      <div className='mb-3'>
        <label htmlFor='total_cost' className='form-label'>
          Total Cost <span style={{ color: "red" }}> * </span>
        </label>
        <input
          type='number'
          className='form-control'
          id='total_cost'
          name='total_cost'
          value={reg.total_cost || ""}
          onChange={handleChange}
          required
        />
      </div>

      <div className='text-center mt-4 mb-4'>
        <button
          type='button'
          className='btn btn-outline-primary btn-sm'
          onClick={() => {
            handleSave();
            prev();
          }}
          disabled={isFirst}
        >
          <i className='bi bi-caret-left'></i>
        </button>
        <small className='mx-3 text-muted'>
          Attendee {attendees.length === 0 ? 0 : step + 1} of{" "}
          {attendees.length}
        </small>
        <button
          type='button'
          className='btn btn-outline-primary btn-sm'
          onClick={() => {
            handleSave();
            next();
          }}
          disabled={isLast}
        >
          <i className='bi bi-caret-right'></i>
        </button>
      </div>

      <hr />

      <div className='vstack gap-2'>
        <div className='d-flex'>
          <div className='px-1 w-100'>
            <button
              type='button'
              className='btn btn-success w-100'
              onClick={handleSave}
            >
              <i className='bi bi-person-fill'></i> Save Attendee
            </button>
          </div>
          <div className='px-1 w-100'>
            <button type='submit' className='btn btn-primary w-100'>
              <i className='bi bi-people-fill'></i> Save Group
            </button>
          </div>
        </div>
        <div className='px-1 w-100'>
          <button type='button' className='btn btn-outline-secondary w-100'>
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};

export default EditFormGroup;