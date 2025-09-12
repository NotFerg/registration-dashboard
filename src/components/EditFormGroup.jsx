import React, { useState, useEffect } from "react";
import supabase from "../utils/supabase";

const EditFormGroup = ({
  reg: initialReg,
  onSave = () => {},
  onSubmitGroup = () => {},
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
        total_cost: calculatedTotal, // Use calculated total instead of initialReg.total_cost
      };

      console.log("Setting reg to:", updatedReg);
      setReg(updatedReg);
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

  const handleSubmitGroup = (e) => {
    e.preventDefault();
    // Pass current form data directly to group submission
    onSubmitGroup(reg);
  };

  return (
    <>
      <form onSubmit={handleSubmitGroup}>
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
            type='button'
            className='btn btn-outline-primary btn-sm'
            onClick={() => {
              handleSave(); // Save current attendee before navigating
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
              handleSave(); // Save current attendee before navigating
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
    </>
  );
};

export default EditFormGroup;
