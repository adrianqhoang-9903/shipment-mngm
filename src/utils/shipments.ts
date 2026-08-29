import type {
  AssignmentState,
  ShipmentStatus,
  TransitionKind,
} from "../types";

const VALID_TARGET_STATUSES: Record<ShipmentStatus, ShipmentStatus[]> = {
  OPEN: ["IN_TRANSIT"],
  IN_TRANSIT: ["DELIVERED", "OPEN"],
  DELIVERED: [],
};

export const getStatusDropdownOptions = (
  current: ShipmentStatus,
): ShipmentStatus[] => [current, ...VALID_TARGET_STATUSES[current]];

export const getTransitionKind = (
  from: ShipmentStatus,
  to: ShipmentStatus,
): TransitionKind => {
  if (from === "OPEN" && to === "IN_TRANSIT") return "assigning";
  if (from === "IN_TRANSIT" && to === "OPEN") return "unassigning";
  return "none";
};

export const resolveAssignmentId = (
  current: AssignmentState,
  next: AssignmentState,
): string | null => {
  switch (getTransitionKind(current.status, next.status)) {
    case "assigning":
      // An empty string is the picker's "nothing selected" value, not an id.
      return next.assignment_id || null;
    case "unassigning":
      return null;
    case "none":
      return current.assignment_id ?? null;
  }
};
