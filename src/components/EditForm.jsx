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
    trainings: "",
    total_cost: "",
    payment_status: "",
  });

  useEffect(() => {
    fetchTrainings();
    if (initialReg) {
      setReg(initialReg);
    }
  }, [initialReg]);

  const handleSubmit = () => {
    console.log("AA");
  };

  const handleChange = (e) => {
    setReg((prevFormData) => {
      return {
        ...prevFormData,
        [e.target.id]: e.target.value,
      };
    });
  };

  async function fetchTrainings() {
    const { data } = await supabase
      .from("trainings")
      .select("*")
      .order("id", { ascending: true });
    console.log("Data edit form", data);
    setTrainings(data);
    console.log("Trainings", trainings);
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
            name='company'
            placeholder='Enter Full company'
            aria-describedby='company'
            onChange={handleChange}
            value={reg.company}
            required
          />
        </div>

        <div className='mb-3'>
          <label htmlFor='submission_date' className='form-label'>
            submission_date <span style={{ color: "red" }}> * </span>
          </label>
          <input
            type='datetime-local'
            className='form-control'
            id='submission_date'
            name='submission_date'
            placeholder='Enter Full submission_date'
            aria-describedby='submission_date'
            onChange={handleChange}
            value={reg.submission_date}
            required
          />
        </div>

        <div className='mb-3'>
          <label htmlFor='first_name' className='form-label'>
            first_name <span style={{ color: "red" }}> * </span>
          </label>
          <input
            type='text'
            className='form-control'
            id='first_name'
            name='first_name'
            placeholder='Enter Full first_name'
            aria-describedby='first_name'
            onChange={handleChange}
            value={reg.first_name}
            required
          />
        </div>

        <div className='mb-3'>
          <label htmlFor='last_name' className='form-label'>
            last_name <span style={{ color: "red" }}> * </span>
          </label>
          <input
            type='text'
            className='form-control'
            id='last_name'
            name='last_name'
            placeholder='Enter Full last_name'
            aria-describedby='last_name'
            onChange={handleChange}
            value={reg.last_name}
            required
          />
        </div>

        <div className='mb-3'>
          <label htmlFor='email' className='form-label'>
            email <span style={{ color: "red" }}> * </span>
          </label>
          <input
            type='email'
            className='form-control'
            id='email'
            name='email'
            placeholder='Enter Full email'
            aria-describedby='email'
            onChange={handleChange}
            value={reg.email}
            required
          />
        </div>

        <div className='mb-3'>
          <label htmlFor='position' className='form-label'>
            position <span style={{ color: "red" }}> * </span>
          </label>
          <input
            type='text'
            className='form-control'
            id='position'
            name='position'
            placeholder='Enter Full position'
            aria-describedby='position'
            onChange={handleChange}
            value={reg.position}
            required
          />
        </div>

        <div className='mb-3'>
          <label htmlFor='designation' className='form-label'>
            designation <span style={{ color: "red" }}> * </span>
          </label>
          <input
            type='text'
            className='form-control'
            id='designation'
            name='designation'
            placeholder='Enter Full designation'
            aria-describedby='designation'
            onChange={handleChange}
            value={reg.designation}
            required
          />
        </div>

        <div className='mb-3'>
          <label htmlFor='country' className='form-label'>
            country <span style={{ color: "red" }}> * </span>
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

        <div className='mb-3'>
          {trainings.map((trainings, i) => (
            <div key={trainings.id}>
              <input
                type='checkbox'
                class='btn-check'
                id={`btn-check-${i}`}
                autocomplete='off'
                checked={reg.trainings.includes(trainings.name)}
              />
              <label class='btn' for={`btn-check-${i}`}>
                {`${trainings.name}`}
              </label>
            </div>
          ))}
        </div>

        <div className='mb-3'>
          <label htmlFor='total_cost' className='form-label'>
            total_cost <span style={{ color: "red" }}> * </span>
          </label>
          <input
            type='number'
            className='form-control'
            id='total_cost'
            name='total_cost'
            placeholder='Enter Full total_cost'
            aria-describedby='total_cost'
            onChange={handleChange}
            value={reg.total_cost}
            required
          />
        </div>

        <div className='mb-3'>
          <label htmlFor='payment_status' className='form-label'>
            payment_status <span style={{ color: "red" }}> * </span>
          </label>
          <input
            type='text'
            className='form-control'
            id='payment_status'
            name='payment_status'
            placeholder='Enter Full payment_status'
            aria-describedby='payment_status'
            onChange={handleChange}
            value={reg.payment_status}
            required
          />
        </div>

        <button type='submit' className='btn btn-primary'>
          Submit
        </button>
      </form>
    </>
  );
};

export default EditForm;
