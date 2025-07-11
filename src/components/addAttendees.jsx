import React, { useState, useEffect } from "react";
import supabase from "../../utils/supabase";

const addAttendees = ({ attendee }) => {
  const [attendee, setAttendee] = useState({
    first_name: "",
    last_name: "",
    email: "",
    position: "",
    designation: "",
    country: "",
    trainings: [],
    subtotal: 0,
  });

  function handleSubmit(e) {
    e.preventDefault();
  }
  return (
    <>
      <form action=''>
        <div className='d-flex flex-row justify-content-between'>
          <div className='mb-3'>
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
              value={attendee.first_name}
              required
            />
          </div>

          <div className='mb-3'>
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
              value={attendee.last_name}
              required
            />
          </div>
        </div>

        <div className='mb-3'>
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
            value={attendee.email}
            required
          />
        </div>

        <div className='mb-3'>
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
            value={attendee.position}
            required
          />
        </div>

        <div className='mb-3'>
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
            value={attendee.designation}
            required
          />
        </div>

        <div className='mb-3'>
          <label htmlFor='country' className='form-label'>
            Country <span style={{ color: "red" }}> * </span>
          </label>
          <input
            type='text'
            className='form-control'
            id='country'
            name='country'
            placeholder='Enter Country'
            aria-describedby='country'
            onChange={handleChange}
            value={attendee.country}
            required
          />
        </div>

        <div className='mb-3'>
          <label htmlFor='trainings' className='form-label'>
            Trainings <span style={{ color: "red" }}> * </span>
          </label>
          <br />
          <div className='border rounded p-2'>
            {trainings.map((training, i) => {
              const trainingString = `${training.date}: ${training.name} ($${training.price})`;
              const isChecked = attendee.trainings.includes(trainingString);

              return (
                <React.Fragment key={training.id || i}>
                  <input
                    type='checkbox'
                    className='btn-check'
                    id={`btn-check-${training.id || i}`}
                    name='trainings'
                    value={trainingString}
                    checked={isChecked}
                    onChange={(e) => {
                      handleChange(e);
                    }}
                  />
                  <label
                    className='btn btn-outline-success m-1'
                    htmlFor={`btn-check-${training.id || i}`}
                  >
                    {training.name} - ${training.price}
                  </label>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </form>
    </>
  );
};

export default addAttendees;
