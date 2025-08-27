import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import supabase from "../utils/supabase.js";
import Sidebar from "../components/Sidebar.jsx";
import "../App.css";
import { useNavigate } from "react-router-dom";

function Trainings() {
  const [isLoading, setIsLoading] = useState(false);
  const [trainingData, setTrainingData] = useState([]);
  const [activeTraining, setActiveTraining] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getSession();
    fetchDataFromSupabase();
  }, []);

  async function getSession() {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate("/trainings");
      } else {
        navigate("/login");
      }
    } catch (error) {
      console.error("Error fetching session:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDataFromSupabase() {
    setIsLoading(true);
    const { data: trainings, error } = await supabase
      .from("trainings")
      .select(`*`);

    if (error) {
      console.error("Error fetching data:", error);
      setIsLoading(false);
      return;
    }
    setTrainingData(trainings);
    setIsLoading(false);
  }

  async function handleDelete(trainingId) {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this training?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    const { error } = await supabase
      .from("trainings")
      .delete()
      .eq("id", trainingId);
    if (error) {
      console.error("Error deleting training:", error);
      Swal.fire({
        text: "There was a problem deleting the training.",
        icon: "error",
      });
      return;
    }

    Swal.fire({
      text: "Training deleted successfully",
      icon: "success",
      confirmButtonText: "OK",
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.reload();
      }
    });
  }

  const handleChange = (e) => {
    const { id, value } = e.target;
    setActiveTraining((prevFormData) => ({
      ...prevFormData,
      [id]: value,
    }));
  };

  async function handleUpdate(e) {
    e.preventDefault();
    const { error } = await supabase
      .from("trainings")
      .update({
        name: activeTraining.name,
        date: activeTraining.date,
        price: activeTraining.price,
      })
      .eq("id", activeTraining.id);
    if (error) {
      console.error("Error updating training:", error);
      return;
    }
    Swal.fire({
      text: "Training updated successfully",
      icon: "success",
      confirmButtonText: "OK",
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.reload();
      }
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const { name, date, price } = e.target;
    supabase
      .from("trainings")
      .insert([
        {
          name: name.value,
          date: date.value,
          price: price.value,
        },
      ])
      .then(({ error }) => {
        if (error) {
          console.error("Error adding training:", error);
          Swal.fire({
            text: "There was a problem adding the training.",
            icon: "error",
          });
        } else {
          Swal.fire({
            text: "Training added successfully",
            icon: "success",
            confirmButtonText: "OK",
          }).then(() => window.location.reload());
        }
      });
  }

  return (
    <>
      {isLoading ? (
        <div
          className="container-fluid d-flex justify-content-center align-items-center vh-100"
          style={{ backgroundColor: "#202030", color: "white" }}
        >
          <div
            className="spinner-border text-primary"
            role="status"
            style={{ width: "3rem", height: "3rem" }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden">
          <div className="row min-vh-100">
            <div className="col-md-2">
              <Sidebar />
            </div>
            <div className="col-md-10 p-3">
              <div className="container-fluid mt-3">
                <div className="d-flex justify-content-between mb-3">
                  <h2>Trainings</h2>
                  <button
                    type="button"
                    className="btn btn-primary fw-bold ms-2"
                    data-bs-toggle="modal"
                    data-bs-target="#addModal"
                  >
                    Add Training
                  </button>
                </div>

                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Name</th>
                      <th>Date</th>
                      <th>Price</th>
                      <th
                        scope="col"
                        colSpan={2}
                        className="sticky-col text-center"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainingData.map((training) => (
                      <tr key={training.id}>
                        <td>{training.name}</td>
                        <td>{training.date}</td>
                        <td>${training.price}</td>
                        <td colSpan={2} className="sticky-col text-center">
                          <div className="btn-group">
                            <button
                              className="btn"
                              data-bs-toggle="modal"
                              data-bs-target={"#editModal"}
                              onClick={() => setActiveTraining(training)}
                            >
                              <i className="bi bi-pencil-square" />
                            </button>
                            <button
                              className="btn"
                              onClick={() => handleDelete(training.id)}
                            >
                              <i className="bi bi-trash-fill" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div
                  className="modal fade"
                  id="addModal"
                  tabIndex="-1"
                  aria-labelledby="addModalLabel"
                  aria-hidden="true"
                >
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title" id="addModalLabel">
                          Add Training
                        </h5>
                        <button
                          type="button"
                          className="btn-close"
                          data-bs-dismiss="modal"
                          aria-label="Close"
                          onClick={() => setActiveTraining(null)}
                        ></button>
                      </div>
                      <div className="modal-body">
                        <form onSubmit={(e) => handleSubmit(e)}>
                          <div className="mb-3">
                            <label className="form-label">Name</label>
                            <input
                              type="text"
                              className="form-control"
                              name="name"
                              required
                            />
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Date/s</label>
                            <input
                              type="text"
                              className="form-control"
                              name="date"
                              required
                            />
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Price</label>
                            <input
                              type="number"
                              className="form-control"
                              name="price"
                              required
                            />
                          </div>
                          <div className="mt-3">
                            <button
                              type="submit"
                              className="btn btn-primary w-100"
                            >
                              Add Training
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="modal fade"
                  id="editModal"
                  tabIndex="-1"
                  aria-labelledby="editModalLabel"
                  aria-hidden="true"
                >
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title" id="editModalLabel">
                          Edit Training
                        </h5>
                        <button
                          type="button"
                          className="btn-close"
                          data-bs-dismiss="modal"
                          aria-label="Close"
                          onClick={() => setActiveTraining(null)}
                        ></button>
                      </div>
                      <div className="modal-body">
                        <form onSubmit={(e) => handleUpdate(e)}>
                          <div className="mb-3">
                            <label className="form-label">Name</label>
                            <input
                              id="name"
                              type="text"
                              className="form-control"
                              defaultValue={activeTraining?.name}
                              onChange={(e) => handleChange(e)}
                            />
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Date/s</label>
                            <input
                              id="date"
                              type="text"
                              className="form-control"
                              defaultValue={activeTraining?.date}
                              onChange={(e) => handleChange(e)}
                            />
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Price</label>
                            <input
                              id="price"
                              type="number"
                              className="form-control"
                              defaultValue={activeTraining?.price}
                              onChange={(e) => handleChange(e)}
                            />
                          </div>
                          <div className="mt-3">
                            <button
                              type="submit"
                              className="btn btn-primary w-100"
                            >
                              Submit
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Trainings;
