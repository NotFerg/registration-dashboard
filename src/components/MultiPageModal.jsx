import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import EditFormGroup from "./EditFormGroup";
import supabase from "../utils/supabase";

const MultiPageModal = ({ stepProp, show, onHide, initialReg }) => {
  // Step is attendee index (0-based)
  const [step, setStep] = useState(0);
  const [attendees, setAttendees] = useState([]);
  const [reg, setReg] = useState({
    first_name: "",
    last_name: "",
    email: "",
    company: "",
    total_cost: 0,
    payment_options: "",
    payment_status: "",
  });

  // Load initial data when modal opens or initialReg changes
  useEffect(() => {
    if (!initialReg) return;

    const baseAttendees = Array.isArray(initialReg.attendees)
      ? initialReg.attendees.map((att) => ({
          ...att,
          trainings: Array.isArray(att.training_references)
            ? att.training_references
                .map((tr) =>
                  tr.trainings
                    ? `${tr.trainings.date}: ${tr.trainings.name} ($${tr.trainings.price})`
                    : null
                )
                .filter(Boolean)
            : [],
        }))
      : [];

    const desiredStep = typeof stepProp === "number" ? stepProp : 0;

    const attendeesWithPlaceholders = [...baseAttendees];
    if (desiredStep >= attendeesWithPlaceholders.length) {
      for (let i = attendeesWithPlaceholders.length; i <= desiredStep; i++) {
        attendeesWithPlaceholders.push({
          id: null,
          first_name: "",
          last_name: "",
          email: "",
          position: "",
          designation: "",
          country: "",
          trainings: [],
          subtotal: 0,
        });
      }
    }

    setAttendees(attendeesWithPlaceholders);

    setReg({
      first_name: initialReg.first_name,
      last_name: initialReg.last_name,
      email: initialReg.email,
      company: initialReg.company,
      total_cost: initialReg.total_cost,
      payment_options: initialReg.payment_options,
      payment_status: initialReg.payment_status,
    });

    setStep(desiredStep);
  }, [initialReg, show, stepProp]);

  // Navigation
  const isFirst = step === 0;
  const isLast = step === attendees.length - 1;

  const next = () => {
    if (step < attendees.length - 1) {
      // The current attendee will be saved by EditFormGroup's onSave call
      setStep(step + 1);
    }
  };

  const prev = () => {
    if (step > 0) {
      // The current attendee will be saved by EditFormGroup's onSave call
      setStep(step - 1);
    }
  };

  // Save changes for current attendee
  function handleAttendeeSave(updatedAttendee) {
    setAttendees((prev) => {
      const copy = [...prev];
      copy[step] = updatedAttendee;
      // Update total cost for reg
      const totalCost = copy.reduce((acc, att) => {
        const cost = (att.trainings || []).reduce((sum, t) => {
          const match = t.match(/\(\$(\d+(?:\.\d{1,2})?)\)/);
          return sum + (match ? parseFloat(match[1]) : 0);
        }, 0);
        return acc + cost;
      }, 0);
      setReg((r) => ({ ...r, total_cost: totalCost }));
      return copy;
    });
  }

  // Save all changes to backend
  async function handleSubmitGroup(currentAttendeeData) {
    try {
      // If currentAttendeeData is provided, save it first
      if (currentAttendeeData) {
        const copy = [...attendees];
        copy[step] = currentAttendeeData;

        // Update total cost for reg
        const totalCost = copy.reduce((acc, att) => {
          const cost = (att.trainings || []).reduce((sum, t) => {
            const match = t.match(/\(\$(\d+(?:\.\d{1,2})?)\)/);
            return sum + (match ? parseFloat(match[1]) : 0);
          }, 0);
          return acc + cost;
        }, 0);

        // Use the updated attendees array for saving
        await saveAllAttendeesToDB(copy, totalCost);
      } else {
        // Use current attendees state
        await saveAllAttendeesToDB(attendees, reg.total_cost);
      }

      onHide();
      // Refresh the page to show updated data
      window.location.reload();
    } catch (err) {
      console.error("Error updating group:", err);
      alert("There was an error updating the group. Please try again.");
    }
  }

  // Helper function to save all attendees to database
  async function saveAllAttendeesToDB(attendeesToSave, totalCost) {
    // 1. Update registration
    const { error: regError } = await supabase
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

    if (regError) throw regError;

    // 2. Update each attendee and their trainings
    for (const attendee of attendeesToSave) {
      // Skip attendees that don't have required data
      if (!attendee.first_name || !attendee.last_name) continue;

      const trainingsText = Array.isArray(attendee.trainings)
        ? attendee.trainings.join(", ")
        : attendee.trainings;

      const subtotal = (attendee.trainings || []).reduce((acc, t) => {
        const match = t.match(/\(\$(\d+(?:\.\d{1,2})?)\)/);
        return acc + (match ? parseFloat(match[1]) : 0);
      }, 0);

      // Handle both existing and new attendees
      if (attendee.id) {
        // Update existing attendee
        const { error: attError } = await supabase
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
          .eq("id", attendee.id);

        if (attError) {
          console.error("Attendee update failed:", attError);
          continue;
        }

        // Delete old training_references
        await supabase
          .from("training_references")
          .delete()
          .eq("registration_id", initialReg.id)
          .eq("attendee_id", attendee.id);
      } else {
        // Insert new attendee
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

        if (insertError) {
          console.error("Attendee insert failed:", insertError);
          continue;
        }

        // Update attendee object with new ID for training references
        attendee.id = inserted.id;
      }

      // Insert new training_references
      for (const line of attendee.trainings || []) {
        const parsed = parseTrainingLine(line);
        if (!parsed) continue;

        const trainingId = await upsertTrainingByNameDatePrice(
          parsed.name,
          parsed.date,
          parsed.price
        );

        if (!trainingId) continue;

        await supabase.from("training_references").insert([
          {
            training_id: trainingId,
            registration_id: initialReg.id,
            attendee_id: attendee.id,
          },
        ]);
      }
    }
  }

  function parseTrainingLine(line) {
    const match = line.match(/^(.+?):\s*(.+?)\s*\(\$(\d+(?:\.\d{1,2})?)\)$/);
    if (!match) return null;
    return {
      date: match[1].trim(),
      name: match[2].trim(),
      price: parseFloat(match[3]),
    };
  }

  async function upsertTrainingByNameDatePrice(name, date, price) {
    const { data: existing } = await supabase
      .from("trainings")
      .select("id")
      .eq("name", name)
      .eq("date", date)
      .eq("price", price)
      .maybeSingle();

    if (existing) return existing.id;

    const { data: inserted } = await supabase
      .from("trainings")
      .insert([{ name, date, price }])
      .select()
      .single();

    return inserted?.id;
  }

  // Render attendee form for current step
  const renderAttendeeForm = () => {
    if (attendees.length === 0) return <p>No attendee data.</p>;
    const attendee = attendees[step];
    if (!attendee) return <p>No attendee data.</p>;

    return (
      <EditFormGroup
        reg={{
          ...initialReg,
          ...attendee,
          registration_id: initialReg.id,
          trainings: Array.isArray(attendee.trainings)
            ? attendee.trainings
            : typeof attendee.trainings === "string"
            ? attendee.trainings.split(",").map((t) => t.trim())
            : [],
          total_cost: attendee.subtotal,
        }}
        {...{ isFirst, isLast, next, prev, attendees, step }}
        onSave={handleAttendeeSave}
        onSubmitGroup={handleSubmitGroup}
      />
    );
  };

  if (!initialReg) return null;

  return (
    <Modal show={show} onHide={onHide} size='lg' style={{ zIndex: 11000 }}>
      <Modal.Header closeButton>
        <Modal.Title>
          <h1
            className='modal-title fs-5'
            id='editModalLabel'
            style={{ fontWeight: 700 }}
          >
            Edit Group Registration
          </h1>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Admin overview (read-only) */}
        <section className='mb-4'>
          {/* Admin overview (read-only) */}
          <h4 style={{ marginBottom: 12 }} className='fs-5'>
            Admin Information
          </h4>
          <div className='card w-100'>
            <div className='card-body'>
              <div className='d-flex flex-row'>
                <div className='flex-fill'>
                  <h3 className='card-title'>
                    <i className='bi bi-building'></i>
                  </h3>
                  <h6 className='card-title'>
                    <strong>Company</strong>
                  </h6>
                  <p className='card-text'>{initialReg.company}</p>
                </div>
                <div className='vr mx-3'></div>
                <div className='flex-fill'>
                  <h3 className='card-title'>
                    <i className='bi bi-person-circle'></i>
                  </h3>
                  <h6 className='card-title'>
                    <strong>Name</strong>
                  </h6>
                  <p className='card-text'>
                    {initialReg.first_name} {initialReg.last_name}
                  </p>
                </div>
                <div className='vr mx-3'></div>
                <div className='flex-fill'>
                  <h3 className='card-title'>
                    <i className='bi bi-envelope-at-fill'></i>
                  </h3>
                  <h6 className='card-title'>
                    <strong>E-Mail</strong>
                  </h6>
                  <p className='card-text'>{initialReg.email}</p>
                </div>
                <div className='vr mx-3'></div>
                <div className='flex-fill'>
                  <h3 className='card-title'>
                    <i className='bi bi-cash'></i>
                  </h3>
                  <h6 className='card-title'>
                    <strong>Total Cost</strong>
                  </h6>
                  <p className='card-text'>${initialReg.total_cost}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <hr />
        <h4 style={{ marginBottom: 12 }} className='fs-5'>
          Attendees Information
        </h4>
        {renderAttendeeForm()}
      </Modal.Body>
    </Modal>
  );
};

export default MultiPageModal;
