import React from "react";
import { groupTrainingsByPrice, formatTrainingLabel } from "../utils/trainings";

// Presentational only: the caller owns selection state and cost calculation.
// This lets the ID-based individual forms and the string-based group forms
// share one picker without changing how either of them persists trainings.
const TrainingSelector = ({
  trainings = [],
  isSelected,
  onToggle,
  idPrefix,
  caption = "Select options for this attendee",
  required = true,
}) => {
  const groups = groupTrainingsByPrice(trainings);

  return (
    <div className="mb-3">
      <label className="form-label fw-bold">
        Trainings {required && <span style={{ color: "red" }}> * </span>}
      </label>
      <div className="border rounded p-2 bg-light">
        <span className="text-muted ps-2 small">{caption}</span>
        {groups.map((group, groupIndex) => (
          <div
            key={group.label}
            className={groupIndex > 0 ? "mt-2 pt-2 border-top" : "mt-1"}
          >
            <div className="text-muted small fw-bold ps-2">{group.label}</div>
            <div className="d-flex flex-wrap">
              {group.items.map((training, index) => {
                const checked = isSelected(training);
                const inputId = `${idPrefix}-training-${training.id ?? index}`;

                return (
                  <div className="form-check form-check-inline" key={training.id ?? index}>
                    <input
                      type="checkbox"
                      className="btn-check"
                      id={inputId}
                      name="trainings"
                      autoComplete="off"
                      checked={checked}
                      onChange={(e) => onToggle(training, e.target.checked)}
                    />
                    <label
                      className={`form-check-label btn btn-sm m-1 ${
                        checked ? "btn-success" : "btn-outline-secondary"
                      }`}
                      htmlFor={inputId}
                    >
                      {checked && <i className="bi bi-check-lg me-1"></i>}
                      {formatTrainingLabel(training)}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrainingSelector;
