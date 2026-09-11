import React, { useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import EditFormGroup from "./EditFormGroup";
import supabase from "../utils/supabase";
import Swal from "sweetalert2";

const createBlankAttendee = () => ({
  id: null,
  first_name: "",
  last_name: "",
  email: "",
  position: "",
  designation: "",
  country: "",
  trainings: [],
  training_ids: [],
  subtotal: 0,
});

const MultiPageModal = ({
  stepProp,
  show,
  onHide,
  initialReg,
  onSuccess = () => {},
}) => {
  const [step, setStep] = useState(0);
  const [attendees, setAttendees] = useState([]);
  const [newAttendee, setNewAttendee] = useState(null);
  const newAttendeeSaveRef = useRef(null);
  const [reg, setReg] = useState({
    first_name: "",
    last_name: "",
    email: "",
    company: "",
    total_cost: 0,
    payment_options: "",
    payment_status: "",
  });

  useEffect(() => {
    if (!initialReg) return;

    const baseAttendees = Array.isArray(initialReg.attendees)
      ? initialReg.attendees.map((att) => {
          const references = Array.isArray(att.training_references)
            ? att.training_references
            : [];

          const trainingIds = references
            .map((tr) => tr?.training_id ?? tr?.trainings?.id)
            .filter((id) => id !== null && id !== undefined);

          const trainingStrings = references
            .map((tr) =>
              tr?.trainings
                ? `${tr.trainings.date}: ${tr.trainings.name} ($${tr.trainings.price})`
                : null,
            )
            .filter(Boolean);

          return {
            ...att,
            trainings: trainingStrings,
            training_ids: [...new Set(trainingIds.map(Number))],
          };
        })
      : [];

    const desiredStep = typeof stepProp === "number" ? stepProp : 0;
    const isAdding = desiredStep >= baseAttendees.length;

    setAttendees(baseAttendees);
    setNewAttendee(isAdding ? createBlankAttendee() : null);
    setReg({
      first_name: initialReg.first_name,
      last_name: initialReg.last_name,
      email: initialReg.email,
      company: initialReg.company,
      total_cost: initialReg.total_cost,
      payment_options: initialReg.payment_options,
      payment_status: initialReg.payment_status,
    });
    setStep(Math.min(desiredStep, baseAttendees.length));
  }, [initialReg, show, stepProp]);

  const isNewAttendee = step >= attendees.length;
  const activeAttendee = isNewAttendee ? newAttendee : attendees[step];
  const isFirst = step === 0;
  const isLast = isNewAttendee;

  const next = () => {
    if (isNewAttendee) return;

    if (step < attendees.length - 1) {
      setStep((value) => value + 1);
      return;
    }

    // Move to a draft without adding a blank attendee to the persisted list.
    setNewAttendee(createBlankAttendee());
    setStep(attendees.length);
  };

  const prev = () => {
    if (isNewAttendee) {
      if (attendees.length > 0) {
        setNewAttendee(null);
        setStep(attendees.length - 1);
      }
      return;
    }

    if (step > 0) setStep((value) => value - 1);
  };

  function calculateAttendeeSubtotal(attendee) {
    return (attendee?.trainings || []).reduce((sum, training) => {
      if (typeof training !== "string") return sum;
      const match = training.match(/\(\$(\d+(?:\.\d{1,2})?)\)/);
      return sum + (match ? parseFloat(match[1]) : 0);
    }, 0);
  }

  function calculateTotalCost(attendeesToCalculate) {
    return attendeesToCalculate.reduce(
      (total, attendee) => total + calculateAttendeeSubtotal(attendee),
      0,
    );
  }

  async function syncAttendeeTrainingReferences(attendee, attendeeId) {
    const desiredTrainingIds = [
      ...new Set(
        (attendee.training_ids || [])
          .filter((id) => id !== null && id !== undefined && id !== "")
          .map(Number)
          .filter((id) => !Number.isNaN(id)),
      ),
    ];

    const { data: existingReferences, error: referencesError } = await supabase
      .from("training_references")
      .select("id, training_id")
      .eq("registration_id", initialReg.id)
      .eq("attendee_id", attendeeId);

    if (referencesError) throw referencesError;

    const existingIds = new Set(
      (existingReferences || [])
        .map((reference) => Number(reference.training_id))
        .filter((id) => !Number.isNaN(id)),
    );
    const desiredIds = new Set(desiredTrainingIds);

    const referencesToDelete = (existingReferences || []).filter(
      (reference) => !desiredIds.has(Number(reference.training_id)),
    );

    if (referencesToDelete.length > 0) {
      const { error } = await supabase
        .from("training_references")
        .delete()
        .in(
          "id",
          referencesToDelete.map((reference) => reference.id),
        );

      if (error) throw error;
    }

    const trainingIdsToAdd = desiredTrainingIds.filter(
      (trainingId) => !existingIds.has(trainingId),
    );

    if (trainingIdsToAdd.length > 0) {
      const { error } = await supabase.from("training_references").insert(
        trainingIdsToAdd.map((trainingId) => ({
          training_id: trainingId,
          registration_id: initialReg.id,
          attendee_id: attendeeId,
        })),
      );

      if (error) throw error;
    }
  }

  async function saveAttendeeToDB(attendee, totalCost) {
    if (!attendee?.first_name?.trim() || !attendee?.last_name?.trim()) {
      return attendee;
    }

    const subtotal = calculateAttendeeSubtotal(attendee);
    const trainingsText = Array.isArray(attendee.trainings)
      ? attendee.trainings.join("\r\n")
      : attendee.trainings || "";

    let attendeeId = attendee.id;

    if (attendeeId) {
      const { error: attendeeError } = await supabase
        .from("attendees")
        .update({
          first_name: attendee.first_name,
          last_name: attendee.last_name,
          email: attendee.email,
          position: attendee.position,
          designation: attendee.designation,
          country: attendee.country,
          trainings: trainingsText,
          subtotal,
        })
        .eq("id", attendeeId);

      if (attendeeError) throw attendeeError;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("attendees")
        .insert([
          {
            first_name: attendee.first_name,
            last_name: attendee.last_name,
            email: attendee.email,
            position: attendee.position,
            designation: attendee.designation,
            country: attendee.country,
            trainings: trainingsText,
            subtotal,
            registration_id: initialReg.id,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;
      attendeeId = inserted.id;
    }

    // Never create records in `trainings` here. Existing training IDs are
    // linked/unlinked through training_references only.
    await syncAttendeeTrainingReferences(attendee, attendeeId);

    const { error: registrationError } = await supabase
      .from("registrations")
      .update({ total_cost: totalCost })
      .eq("id", initialReg.id);

    if (registrationError) throw registrationError;

    return {
      ...attendee,
      id: attendeeId,
      subtotal,
      total_cost: subtotal,
      training_ids: [...(attendee.training_ids || [])],
    };
  }

  async function handleAttendeeSave(updatedAttendee) {
    const totalCostWithDraft = calculateTotalCost(
      isNewAttendee ? [...attendees, updatedAttendee] : attendees,
    );

    if (isNewAttendee) {
      // Prevent two debounced autosaves of the new draft from inserting
      // two attendee rows before the first insert has returned its ID.
      if (newAttendeeSaveRef.current) {
        const existingSaved = await newAttendeeSaveRef.current;

        if (existingSaved?.id) {
          const updatedExisting = await saveAttendeeToDB(
            { ...updatedAttendee, id: existingSaved.id },
            totalCostWithDraft,
          );
          setAttendees((current) => {
            const withoutDuplicate = current.filter(
              (attendee) => attendee.id !== updatedExisting.id,
            );
            return [...withoutDuplicate, updatedExisting];
          });
          setNewAttendee(null);
          setStep(attendees.length);
          setReg((current) => ({ ...current, total_cost: totalCostWithDraft }));
          return updatedExisting;
        }
      }

      const savePromise = saveAttendeeToDB(
        { ...updatedAttendee },
        totalCostWithDraft,
      );
      newAttendeeSaveRef.current = savePromise;

      try {
        const savedAttendee = await savePromise;

        if (!savedAttendee?.id) {
          setNewAttendee(updatedAttendee);
          return savedAttendee;
        }

        setAttendees((current) => [...current, savedAttendee]);
        setNewAttendee(null);
        setStep(attendees.length);
        setReg((current) => ({ ...current, total_cost: totalCostWithDraft }));
        return savedAttendee;
      } finally {
        if (newAttendeeSaveRef.current === savePromise) {
          newAttendeeSaveRef.current = null;
        }
      }
    }

    const copy = [...attendees];
    copy[step] = { ...updatedAttendee };

    const totalCost = calculateTotalCost(copy);
    setAttendees(copy);
    setReg((current) => ({ ...current, total_cost: totalCost }));

    const savedAttendee = await saveAttendeeToDB(copy[step], totalCost);

    if (savedAttendee?.id) {
      copy[step] = savedAttendee;
      setAttendees([...copy]);
    }

    return savedAttendee;
  }

  async function saveAllAttendeesToDB(attendeesToSave, totalCost) {
    const { error: registrationError } = await supabase
      .from("registrations")
      .update({
        first_name: reg.first_name,
        last_name: reg.last_name,
        email: reg.email,
        company: reg.company,
        total_cost: totalCost,
        payment_options: reg.payment_options,
        payment_status: reg.payment_status,
      })
      .eq("id", initialReg.id);

    if (registrationError) throw registrationError;

    for (const attendee of attendeesToSave) {
      if (!attendee.first_name?.trim() || !attendee.last_name?.trim()) continue;

      const saved = await saveAttendeeToDB(attendee, totalCost);
      attendee.id = saved.id;
    }
  }

  async function handleSubmitGroup(currentAttendeeData) {
    try {
      let workingAttendees = [...attendees];

      if (isNewAttendee && currentAttendeeData?.first_name?.trim() && currentAttendeeData?.last_name?.trim()) {
        const existingDraft = currentAttendeeData.id
          ? workingAttendees.find((attendee) => attendee.id === currentAttendeeData.id)
          : null;

        if (!existingDraft) {
          const draftSaved = await saveAttendeeToDB(
            { ...currentAttendeeData },
            calculateTotalCost([...workingAttendees, currentAttendeeData]),
          );
          workingAttendees = [...workingAttendees, draftSaved];
        }
      } else if (!isNewAttendee && currentAttendeeData) {
        workingAttendees[step] = { ...currentAttendeeData };
      }

      const totalCost = calculateTotalCost(workingAttendees);
      await saveAllAttendeesToDB(workingAttendees, totalCost);

      setAttendees(workingAttendees);
      setNewAttendee(null);
      setStep(Math.min(step, Math.max(workingAttendees.length - 1, 0)));
      setReg((current) => ({ ...current, total_cost: totalCost }));

      Swal.fire({
        title: "Saved!",
        text: "Group registration updated successfully.",
        icon: "success",
        confirmButtonText: "OK",
      }).then((result) => {
        if (result.isConfirmed) {
          onHide();
          onSuccess();
        }
      });
    } catch (error) {
      console.error("Error updating group:", error);
      Swal.fire({
        title: "Error!",
        text: "There was an error updating the group. Please try again.",
        icon: "error",
        confirmButtonText: "Close",
      });
    }
  }

  const renderAttendeeForm = () => {
    if (!activeAttendee) return <p>No attendee data.</p>;

    return (
      <EditFormGroup
        reg={{
          ...initialReg,
          ...activeAttendee,
          registration_id: initialReg.id,
          trainings: Array.isArray(activeAttendee.trainings)
            ? activeAttendee.trainings
            : [],
          training_ids: Array.isArray(activeAttendee.training_ids)
            ? activeAttendee.training_ids
            : [],
          total_cost: activeAttendee.subtotal,
        }}
        {...{ isFirst, isLast, next, prev, attendees, step }}
        onSave={handleAttendeeSave}
        onSubmitGroup={handleSubmitGroup}
        onHide={onHide}
      />
    );
  };

  if (!initialReg) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" style={{ zIndex: 11000 }}>
      <Modal.Header closeButton>
        <Modal.Title>
          <h1 className="modal-title fs-5" style={{ fontWeight: 700 }}>
            Edit Group Registration
          </h1>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <section className="mb-4">
          <h4 style={{ marginBottom: 12 }} className="fs-5">
            Admin Information
          </h4>
          <div className="card w-100">
            <div className="card-body">
              <div className="d-flex flex-row">
                <div className="flex-fill">
                  <h3 className="card-title"><i className="bi bi-building"></i></h3>
                  <h6 className="card-title"><strong>Company</strong></h6>
                  <p className="card-text">{initialReg.company}</p>
                </div>
                <div className="vr mx-3"></div>
                <div className="flex-fill">
                  <h3 className="card-title"><i className="bi bi-person-circle"></i></h3>
                  <h6 className="card-title"><strong>Name</strong></h6>
                  <p className="card-text">{initialReg.first_name} {initialReg.last_name}</p>
                </div>
                <div className="vr mx-3"></div>
                <div className="flex-fill">
                  <h3 className="card-title"><i className="bi bi-envelope-at-fill"></i></h3>
                  <h6 className="card-title"><strong>E-Mail</strong></h6>
                  <p className="card-text">{initialReg.email}</p>
                </div>
                <div className="vr mx-3"></div>
                <div className="flex-fill">
                  <h3 className="card-title"><i className="bi bi-cash"></i></h3>
                  <h6 className="card-title"><strong>Total Cost</strong></h6>
                  <p className="card-text">${initialReg.total_cost}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <hr />
        <h4 style={{ marginBottom: 12 }} className="fs-5">
          Attendees Information
        </h4>
        {renderAttendeeForm()}
      </Modal.Body>
    </Modal>
  );
};

export default MultiPageModal;
