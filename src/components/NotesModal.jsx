import { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import supabase from "../utils/supabase";
import Swal from "sweetalert2";

const NotesModal = ({ registration, show = false, onHide = () => {} }) => {
  const [note, setNote] = useState(registration?.notes ?? "");

  const handleChange = (e) => {
    setNote(e.target.value);
  };

  const handleSubmit = async () => {
    try {
      const { error } = await supabase
        .from("registrations")
        .update({ notes: note })
        .eq("id", registration.id);
      if (error) throw error;
      Swal.fire({
        title: "Success!",
        text: "Note updated successfully!",
        icon: "success",
        confirmButtonText: "Close",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.reload();
        }
      });
    } catch (error) {
      console.error("Error updating note:", error);
      Swal.fire({
        title: "Error!",
        text: error.message,
        icon: "error",
        confirmButtonText: "Close",
      });
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <h1 className="modal-title fs-5" style={{ fontWeight: 700 }}>
            Edit Note
          </h1>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <textarea
          className="form-control"
          id="floatingTextarea2"
          style={{ height: "100px" }}
          onChange={handleChange}
          value={note}
          placeholder="Enter your Notes here"
        ></textarea>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="primary" onClick={handleSubmit}>
          Save Note
        </Button>
        <Button variant="danger" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NotesModal;

