import React, { useState } from "react";
import { Modal, Button, Form, OverlayTrigger, Tooltip } from "react-bootstrap";
import Swal from "sweetalert2";
import supabase from "../utils/supabase";

const InvoiceModal = (attendee = {}) => {
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const onSuccess = attendee.onSuccess || (() => {});

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  async function uploadFile(file) {
    if (!file) return;

    setIsUploading(true);
    try {
      const { data: storageData, error: storageError } = await supabase.storage
        .from("Invoices")
        .upload(file.name, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (storageError || !storageData) {
        throw storageError || new Error("Upload failed. Please try again.");
      }

      const { data: fileData } = supabase.storage
        .from("Invoices")
        .getPublicUrl(storageData.path);
      const publicUrl = fileData.publicUrl;

      const { error: updateError } = await supabase
        .from("registrations")
        .update({ invoice_storage_url: publicUrl })
        .eq("id", attendee.attendee.id);

      if (updateError) throw updateError;

      Swal.fire({
        title: "Success!",
        text: "Invoice uploaded successfully.",
        icon: "success",
        confirmButtonText: "Close",
      }).then((result) => {
        if (result.isConfirmed) {
          closeModal();
          onSuccess();
        }
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      // No reload here - keep the modal open so the user can retry.
      Swal.fire({
        title: "Error!",
        text: error.message,
        icon: "error",
        confirmButtonText: "Close",
      });
    } finally {
      setIsUploading(false);
    }
  }

  const tooltipId = `invoice-tooltip-${attendee?.id ?? "na"}`;

  return (
    <React.Fragment>
      <button className="btn">
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip id={tooltipId}>Invoices</Tooltip>}
        >
          <i
            className="bi bi-file-earmark-bar-graph-fill text-primary"
            onClick={openModal}
          />
        </OverlayTrigger>
      </button>

      <Modal show={showModal} onHide={closeModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <h1
              className="modal-title fs-5"
              id="editModalLabel"
              style={{ fontWeight: 700 }}
            >
              Invoice Details
            </h1>
          </Modal.Title>
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
          <label
            className={`btn btn-success w-100 ${isUploading ? "disabled" : ""}`}
            aria-disabled={isUploading}
          >
            {isUploading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
            <input
              type="file"
              className="d-none"
              accept="application/pdf"
              disabled={isUploading}
              onChange={async (e) => {
                const input = e.target;
                await uploadFile(input.files[0]);
                input.value = null; // Allow re-picking the same file
              }}
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
