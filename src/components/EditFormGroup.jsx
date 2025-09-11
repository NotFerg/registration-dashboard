import React, { useState, useEffect } from "react";
import supabase from "../utils/supabase";

const EditFormGroup = ({
  reg: initialReg,
  onSave = () => {},
  handleSubmit = () => {},
  isFirst,
  isLast,
  next,
  prev,
  attendees,
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
      setReg(initialReg);
    }
  }, [initialReg]);

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;

    if (type === "checkbox") {
      const trainingName = value;
      setReg((prev) => {
        const updatedTrainings = checked
          ? [...prev.trainings, trainingName]
          : prev.trainings.filter((t) => t !== trainingName);

        // console.log(reg);
        return {
          ...prev,
          trainings: updatedTrainings,
          total_cost: calculateTotalCost(updatedTrainings),
        };
      });
    } else {
      setReg((prevFormData) => ({
        ...prevFormData,
        [id]: value,
      }));
      // console.log(reg);
    }
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
    console.log("INSIDE HANDLE SUBMIT");
    e.preventDefault();

    if (initialReg) {
      console.log("INSIDE STEP 1");
      // 1. Update REGISTRATION-level fields (if needed)
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

      console.log("REG", reg);
      console.log("INITIAL REG", initialReg);

      let currentAttendeeId = reg.id; // For existing attendees

      // 2. Update the ATTENDEE (by reg.id)
      if (reg.id) {
        console.log("INSIDE STEP 2 - UPDATING EXISTING ATTENDEE");
        const { error: attendeeUpdateError } = await supabase
          .from("attendees")
          .update({
            first_name: reg.first_name,
            last_name: reg.last_name,
            email: reg.email,
            position: reg.position,
            designation: reg.designation,
            country: reg.country,
            trainings: reg.trainings.join(", "),
            subtotal: reg.total_cost,
          })
          .eq("id", reg.registration_id);

        if (attendeeUpdateError) {
          console.error("Attendee update error:", attendeeUpdateError);
          return;
        }

        // 3. Delete old training_references for this existing attendee
        await supabase
          .from("training_references")
          .delete()
          .eq("registration_id", reg.registration_id)
          .eq("attendee_id", reg.id);
      } else {
        console.log("INSIDE STEP 3 - INSERTING NEW ATTENDEE");

        // Insert new attendee and get the generated ID
        const { data: inserted, error: insertError } = await supabase
          .from("attendees")
          .insert([
            {
              first_name: reg.first_name,
              last_name: reg.last_name,
              email: reg.email,
              position: reg.position,
              designation: reg.designation,
              country: reg.country,
              trainings: reg.trainings.join(", "),
              subtotal: reg.total_cost,
              registration_id: reg.registration_id,
            },
          ])
          .select()
          .single();

        if (insertError) {
          console.error("Attendee insert error:", insertError);
          return;
        }

        // Use the newly inserted attendee's ID
        currentAttendeeId = inserted.id;
        console.log("New attendee ID:", currentAttendeeId);
      }

      // 4. Insert new training_references (works for both existing and new attendees)
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
              registration_id: reg.registration_id,
              attendee_id: currentAttendeeId, // Use the correct attendee ID
            },
          ]);
        }
      }
    }

    // Reload the page after successful save
    window.location.reload();
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className='mb-3'>
          <label htmlFor='company' className='form-label'>
            Company <span style={{ color: "red" }}> * </span>
          </label>
          <input
            type='text'
            className='form-control'
            id='company'
            value={reg.company}
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
              aria-describedby='first_name'
              onChange={handleChange}
              value={reg.first_name}
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
              aria-describedby='last_name'
              onChange={handleChange}
              value={reg.last_name}
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
              aria-describedby='email'
              onChange={handleChange}
              value={reg.email}
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
              aria-describedby='position'
              onChange={handleChange}
              value={reg.position}
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
              aria-describedby='designation'
              onChange={handleChange}
              value={reg.designation}
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
              aria-describedby='country'
              onChange={handleChange}
              value={reg.country}
              required
            />
          </div>
        </div>

        <div className='mb-3'>
          <label htmlFor='trainings' className='form-label'>
            Trainings <span style={{ color: "red" }}> * </span>
          </label>
          <br />
          <div className='border rounded p-2'>
            <span className='text-muted ps-2'>Early Bird Price</span>
            <br />
            {trainings.map((training, i) => {
              const trainingString = `${training.date}: ${training.name} ($${training.price})`;

              return (
                <React.Fragment key={training.id}>
                  <input
                    type='checkbox'
                    className='btn-check'
                    id={`btn-check-${i}`}
                    autoComplete='off'
                    checked={reg.trainings.includes(trainingString)}
                    value={trainingString}
                    onChange={handleChange}
                  />
                  <label
                    className='btn btn-outline-success m-1'
                    htmlFor={`btn-check-${i}`}
                  >
                    {reg.trainings.includes(trainingString) && (
                      <i className='bi bi-check-lg'></i>
                    )}{" "}
                    {training.name} ${training.price}
                  </label>
                  {i == 4 && <hr />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* <div className="d-flex flex-row justify-content-between"> */}
        <div className='mb-3'>
          <label htmlFor='total_cost' className='form-label'>
            Total Cost <span style={{ color: "red" }}> * </span>
          </label>
          <input
            type='number'
            className='form-control'
            id='total_cost'
            name='total_cost'
            value={reg.total_cost}
            aria-describedby='total_cost'
            onChange={handleChange}
            required
          />
        </div>

        {/* <div className="mb-3 flex-fill">
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
          </div> */}
        {/* </div> */}
        <div className='text-center mt-4 mb-4'>
          <button
            className='btn btn-outline-primary btn-sm'
            onClick={prev}
            disabled={isFirst}
          >
            <i className='bi bi-caret-left'></i>
          </button>
          <small className='mx-3 text-muted'>
            Attendee {attendees.length === 0 ? 0 : step + 1} of{" "}
            {attendees.length}
          </small>
          <button
            className='btn btn-outline-primary btn-sm'
            onClick={next}
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
                onClick={() => onSave && onSave(reg)}
              >
                <i className='bi bi-person-fill'></i> Save Attendee
              </button>
            </div>
            <div className='px-1 w-100'>
              <button className='btn btn-primary w-100' onClick={handleSubmit}>
                <i className='bi bi-people-fill'></i> Save Group
              </button>
            </div>
          </div>
          <div className='px-1 w-100'>
            <button className='btn btn-outline-secondary w-100'>Cancel</button>
          </div>
        </div>
      </form>
    </>
  );
};

export default EditFormGroup;
