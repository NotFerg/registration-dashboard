import React, { useState, useEffect } from "react";
import supabase from "../utils/supabase";

const EditFormGroup = ({ reg: initialReg, onSave = () => {} }) => {
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
    setTrainings(data || []);
  }

  return (
    <>
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
        <div className='mb-3 me-2 flex-fill'>
          <label htmlFor='first_name' className='form-label'>
            First Name *
          </label>
          <input
            type='text'
            className='form-control'
            id='first_name'
            value={reg.first_name}
            onChange={handleChange}
            required
          />
        </div>
        <div className='mb-3 flex-fill'>
          <label htmlFor='last_name' className='form-label'>
            Last Name *
          </label>
          <input
            type='text'
            className='form-control'
            id='last_name'
            value={reg.last_name}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className='mb-3'>
        <label htmlFor='email' className='form-label'>
          Email *
        </label>
        <input
          type='email'
          className='form-control'
          id='email'
          value={reg.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className='mb-3'>
        <label htmlFor='position' className='form-label'>
          Position *
        </label>
        <input
          type='text'
          className='form-control'
          id='position'
          value={reg.position}
          onChange={handleChange}
          required
        />
      </div>

      <div className='mb-3'>
        <label htmlFor='designation' className='form-label'>
          Designation *
        </label>
        <input
          type='text'
          className='form-control'
          id='designation'
          value={reg.designation}
          onChange={handleChange}
          required
        />
      </div>

      <div className='mb-3'>
        <label htmlFor='country' className='form-label'>
          Country *
        </label>
        <input
          type='text'
          className='form-control'
          id='country'
          value={reg.country}
          onChange={handleChange}
          required
        />
      </div>

      <div className='mb-3'>
        <label htmlFor='trainings' className='form-label'>
          Trainings *
        </label>
        <div className='border rounded p-2'>
          {trainings.map((training, i) => {
            const trainingStr = `${training.date}: ${training.name} ($${training.price})`;
            return (
              <React.Fragment key={training.id}>
                <input
                  type='checkbox'
                  className='btn-check'
                  id={`btn-check-${i}`}
                  autoComplete='off'
                  checked={reg.trainings.includes(trainingStr)}
                  value={trainingStr}
                  onChange={handleChange}
                />
                <label
                  className='btn btn-outline-success m-1'
                  htmlFor={`btn-check-${i}`}
                >
                  {training.name}
                </label>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className='mb-3'>
        <label htmlFor='total_cost' className='form-label'>
          Total Cost
        </label>
        <input
          type='number'
          className='form-control'
          id='total_cost'
          value={reg.total_cost}
          onChange={handleChange}
          readOnly
        />
      </div>

      <div className='text-end'>
        <button type='button' className='btn btn-primary' onClick={handleSave}>
          Save Attendee
        </button>
      </div>
    </>
  );
};

export default EditFormGroup;
