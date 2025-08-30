import React from "react";
import { Modal, Button } from "react-bootstrap";

const NotesModal = ({ notes = "", show = false, onHide = () => {} }) => {
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
          value={notes}
          placeholder="Enter your Notes here"
        ></textarea>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="primary">Save Note</Button>
        <Button variant="danger" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NotesModal;
