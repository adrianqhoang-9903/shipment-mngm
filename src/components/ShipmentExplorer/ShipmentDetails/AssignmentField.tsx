import { useEffect, useState } from "react";
import { fetchAssignmentById, fetchOpenAssignments } from "../../../services/assignments";
import SelectField from "../../FormFields/SelectField";
import StaticField from "../../FormFields/StaticField";
import type { Assignment, Shipment, ShipmentStatus } from "../../../types";
import { getTransitionKind } from "../../../utils/shipments";
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

  const transition = getTransitionKind(shipment.status, status);
  const isAssigning = transition === "assigning";
  const isUnassigning = transition === "unassigning";

  useEffect(() => {
    setAssignmentLabel(null);
    const currentAssignmentId = shipment.assignment_id;
    if (!currentAssignmentId) return;

    const controller = new AbortController();

    const load = async () => {
      try {
        const assignment = await fetchAssignmentById(
          currentAssignmentId,
          controller.signal,
        );
        setAssignmentLabel(assignment.label);
      } catch {
        if (controller.signal.aborted) return;
        setAssignmentLabel(currentAssignmentId);
      }
    };

    load();

    return () => controller.abort();
  }, [shipment.assignment_id]);

  useEffect(() => {
    if (!isAssigning) return;

    const controller = new AbortController();
    setAssignmentsLoading(true);
    setAssignmentsError(null);

    const load = async () => {
      try {
        const fetched = await fetchOpenAssignments(controller.signal);
        setAssignments(fetched);
      } catch (err) {
        if (controller.signal.aborted) return;
        setAssignmentsError(
          err instanceof Error ? err.message : "Failed to load assignments",
        );
      } finally {
        if (!controller.signal.aborted) setAssignmentsLoading(false);
      }
    };

    load();

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
          // Not disabled while assignmentsLoading, even though there's
          // nothing to pick yet - a disabled control is exempt from native
          // constraint validation entirely (unlike hidden), so disabling it
          // during the fetch would let Enter/Save through with `required`
          // silently unenforced and no assignment ever chosen. Staying
          // enabled-but-empty keeps this field inside the same validation
          // every other required field already relies on; the "Loading
          // assignments..." placeholder already communicates the state.
          disabled={!isAssigning}
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
