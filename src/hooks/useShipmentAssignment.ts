import { useEffect, useRef, useState } from "react";
import { fetchAssignmentById, fetchOpenAssignments } from "../services/assignments";
import type { Assignment, Shipment } from "../types";

export const useShipmentAssignment = (shipment: Shipment) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignmentsError, setAssignmentsError] = useState<string | null>(
    null,
  );
  const [assignmentLabel, setAssignmentLabel] = useState<string | null>(null);
  const assignmentsAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => assignmentsAbortRef.current?.abort();
  }, []);

  useEffect(() => {
    setAssignmentLabel(null);
    if (!shipment.assignment_id) return;

    const controller = new AbortController();
    fetchAssignmentById(shipment.assignment_id, controller.signal)
      .then((assignment) => setAssignmentLabel(assignment.label))
      .catch(() => {
        // Fall back to the raw id in the caller's render - a lookup
        // failure shouldn't block viewing the rest of the shipment.
      });

    return () => controller.abort();
  }, [shipment.assignment_id]);

  const fetchOpenAssignmentsOnce = () => {
    if (
      shipment.status !== "OPEN" ||
      assignments.length > 0 ||
      assignmentsLoading
    ) {
      return;
    }

    setAssignmentsLoading(true);
    setAssignmentsError(null);
    const controller = new AbortController();
    assignmentsAbortRef.current = controller;
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
  };

  return {
    assignments,
    assignmentsLoading,
    assignmentsError,
    assignmentLabel,
    fetchOpenAssignmentsOnce,
  };
};
