import { useEffect, useState } from "react";
import { fetchAssignmentById, fetchOpenAssignments } from "../../../services/assignments";
import SelectField from "../../FormFields/SelectField";
import StaticField from "../../FormFields/StaticField";
import type { Assignment, Shipment, ShipmentStatus } from "../../../types";
import styles from "./AssignmentField.module.css";

interface AssignmentFieldProps {
  shipment: Shipment;
  status: ShipmentStatus;
  assignmentId: string;
  onAssignmentIdChange: (value: string) => void;
}

interface AssignmentPlaceholderState {
  isAssigning: boolean;
  isLoading: boolean;
  hasError: boolean;
  optionCount: number;
}

const assignmentPlaceholder = ({
  isAssigning,
  isLoading,
  hasError,
  optionCount,
}: AssignmentPlaceholderState) => {
  if (!isAssigning) return "—";
  if (isLoading) return "Loading assignments...";
  if (hasError) return "Failed to load assignments";
  if (optionCount === 0) return "No open assignments available";
  return "Select an assignment...";
};

const AssignmentField = ({
  shipment,
  status,
  assignmentId,
  onAssignmentIdChange,
}: AssignmentFieldProps) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignmentsError, setAssignmentsError] = useState<string | null>(
    null,
  );
  const [assignmentLabel, setAssignmentLabel] = useState<string | null>(null);

  const isAssigning = shipment.status === "OPEN" && status === "IN_TRANSIT";
  const isUnassigning =
    shipment.status === "IN_TRANSIT" && status === "OPEN";

  useEffect(() => {
    setAssignmentLabel(null);
    const assignmentId = shipment.assignment_id;
    if (!assignmentId) return;

    const controller = new AbortController();
    fetchAssignmentById(assignmentId, controller.signal)
      .then((assignment) => setAssignmentLabel(assignment.label))
      .catch(() => {
        if (controller.signal.aborted) return;
        setAssignmentLabel(assignmentId);
      });

    return () => controller.abort();
  }, [shipment.assignment_id]);

  useEffect(() => {
    if (!isAssigning) return;

    const controller = new AbortController();
    setAssignmentsLoading(true);
    setAssignmentsError(null);
    fetchOpenAssignments(controller.signal)
      .then(setAssignments)
      .catch((err) => {
        if (controller.signal.aborted) return;
        setAssignmentsError(
          err instanceof Error ? err.message : "Failed to load assignments",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setAssignmentsLoading(false);
      });

    return () => controller.abort();
  }, [isAssigning]);

  const assignmentOptions = assignments.map((assignment) => ({
    value: assignment.id,
    label: `${assignment.label} (${[...assignment.clients].sort().join(", ")})`,
  }));

  const placeholder = assignmentPlaceholder({
    isAssigning,
    isLoading: assignmentsLoading,
    hasError: assignmentsError !== null,
    optionCount: assignmentOptions.length,
  });


  return (
    <div className={styles.hintWrapper}>
      {shipment.status === "OPEN" ? (
        <SelectField
          name="assignment_id"
          label="Assignment"
          value={assignmentId}
          options={assignmentOptions}
          onChange={onAssignmentIdChange}
          placeholder={placeholder}
          disabled={assignmentsLoading || !isAssigning}
          required={isAssigning}
        />
      ) : (
        <StaticField
          label="Assignment"
          value={
            shipment.assignment_id ? (assignmentLabel ?? "Loading...") : "—"
          }
        />
      )}
      {isUnassigning && (
        <p className={styles.hint}>
          Reverting to Open will clear this shipment&rsquo;s assignment.
        </p>
      )}
    </div>
  );
};

export default AssignmentField;
