import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import Swal from "sweetalert2";
import supabase from "../utils/supabase";

const InvoiceModal = (attendee = {}) => {
  const [showModal, setShowModal] = useState(false);

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  async function uploadFile(file) {
    try {
      const { data: storageData } = await supabase.storage
        .from("Invoices")
        .upload(file.name, file, {
          cacheControl: "3600",
          upsert: true,
        });

      const { data: fileData } = await supabase.storage
        .from("Invoices")
        .getPublicUrl(storageData.path);
      const publicUrl = fileData.publicUrl;

      const { data: updateData } = await supabase
        .from("registrations")
        .update({ invoice_storage_url: publicUrl })
        .eq("id", attendee.attendee.id);
      Swal.fire({
        title: "Success!",
        text: "Invoice uploaded successfully.",
        icon: "success",
        confirmButtonText: "Close",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.reload();
        }
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      Swal.fire({
        title: "Error!",
        text: error.message,
        icon: "error",
        confirmButtonText: "Close",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.reload();
        }
      });
    }
  }

  return (
    <React.Fragment>
      <button className="btn">
        <i className="bi bi-file-earmark-bar-graph-fill" onClick={openModal} />
      </button>

      <Modal show={showModal} onHide={closeModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Invoice Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Button
            variant={
              attendee.attendee.invoice_storage_url !== "NULL"
                ? "primary"
                : "outline-primary"
            }
            onClick={() =>
              window.open(attendee.attendee.invoice_storage_url, "_blank")
            }
            className="w-100 mb-2"
            disabled={
              attendee.attendee.invoice_storage_url === "NULL" ? true : false
            }
            cursor="not-allowed"
          >
            {attendee.attendee.invoice_storage_url !== "NULL"
              ? "View"
              : "No Invoice Uploaded"}
          </Button>
          <label class="btn btn-success w-100">
            Upload{" "}
            <input
              type="file"
              className="d-none"
              accept="application/pdf"
              onChange={(e) => uploadFile(e.target.files[0])}
            />
          </label>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={closeModal}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

export default InvoiceModal;
