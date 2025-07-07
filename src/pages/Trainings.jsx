import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import supabase from "../utils/supabase.js";
import Sidebar from "../components/sidebar.jsx";
import "../App.css";

function Trainings() {
  const [isLoading, setIsLoading] = useState(false);
  const [trainingData, setTrainingData] = useState([]);

  useEffect(() => {
    fetchDataFromSupabase();
  }, []);

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

  return (
    <div className="overflow-hidden">
      <div className="row min-vh-100">
        <div className="col-md-2">
          <Sidebar />
        </div>
        <div className="col-md-10 p-3">
          <div className="container mt-3">
            <div className="d-flex justify-content-between mb-3">
              {" "}
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
                    <td className="sticky-col text-center">
                      <div className="btn-group">
                        <button
                          className="btn btn-success text-nowrap btn-sm"
                          data-bs-toggle="modal"
                          data-bs-target="#editModal"
                        >
                          Edit{" "}
                          <span>
                            <i class="bi bi-pencil-square"></i>
                          </span>
                        </button>
                        <button className="btn btn-danger text-nowrap btn-sm">
                          Delete{" "}
                          <span>
                            <i class="bi bi-trash-fill"></i>
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Trainings;
