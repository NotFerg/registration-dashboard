import React, { useState } from "react";
import { Modal, Button, Form, OverlayTrigger, Tooltip } from "react-bootstrap";
import Swal from "sweetalert2";
import supabase from "../utils/supabase";

const EditAdminModal = (adminProp) => {

  const [showModal, setShowModal] = useState(false);
  const { admin } = adminProp;
  const [adminData, setAdminData] = useState(admin);
  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const handleChange = (e) => {
    setAdminData({
      ...adminData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(adminData);
    try {
      const { error } = await supabase
        .from("registrations")
        .update({
          company: adminData.company,
          first_name: adminData.first_name,
          last_name: adminData.last_name,
          payment_status: adminData.payment_status,
        })
        .eq("id", admin.id);
      if (error) throw error;
      Swal.fire({
        title: "Success!",
        text: "Admin updated successfully!",
        icon: "success",
        confirmButtonText: "Close",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.reload();
        }
      });
    } catch (error) {
      console.error("Error updating admin:", error);
      Swal.fire({
        title: "Error!",
        text: error.message,
        icon: "error",
        confirmButtonText: "Close",
      });
    }
  };

  return (
    <React.Fragment>
      <button className="btn">
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip>Edit Admin</Tooltip>}
        >
          <i className="bi bi-pencil-square text-success" onClick={openModal} />
        </OverlayTrigger>
      </button>


      <Modal show={showModal} onHide={closeModal} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            <h1
              className="modal-title fs-5"
              id="editModalLabel"
              style={{ fontWeight: 700 }}
            >
              Edit Admin Details
            </h1>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" id="company">
              <Form.Label>Company</Form.Label>
              <Form.Control
                type="text"
                placeholder="Company"
                value={adminData.company}
                onChange={(e) => handleChange({ target: { id: "company", value: e.target.value } })}
              />
            </Form.Group>

            <Form.Group className="mb-3" id="first_name">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="First Name"
                value={adminData.first_name}
                onChange={(e) => handleChange({ target: { id: "first_name", value: e.target.value } })}
              />
            </Form.Group>

            <Form.Group className="mb-3" id="last_name">
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Last Name"
                value={adminData.last_name}
                onChange={(e) => handleChange({ target: { id: "last_name", value: e.target.value } })}
              />
            </Form.Group>

            <Form.Group className="mb-3" id="payment_status">
              <Form.Label>Payment Status</Form.Label>
              <Form.Select
                value={adminData.payment_status}
                onChange={(e) => handleChange({ target: { id: "payment_status", value: e.target.value } })}
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial Payment</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={closeModal}>
            Cancel
          </Button>
          <Button variant="success" type="submit" onClick={handleSubmit}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

export default EditAdminModal;



