import type { ShipmentStatus } from "../types";

// Business rules straight from the spec: OPEN -> IN_TRANSIT (needs an
// assignment_id), IN_TRANSIT -> DELIVERED, IN_TRANSIT -> OPEN (clears
// assignment_id). DELIVERED is terminal - no valid transitions out of it.
const VALID_TARGET_STATUSES: Record<ShipmentStatus, ShipmentStatus[]> = {
  OPEN: ["IN_TRANSIT"],
  IN_TRANSIT: ["DELIVERED", "OPEN"],
  DELIVERED: [],
};

// The dropdown must always include the current status too - it's the
// select's initial value, and "no change" is itself a valid choice.
export const getStatusDropdownOptions = (
  current: ShipmentStatus,
): ShipmentStatus[] => [current, ...VALID_TARGET_STATUSES[current]];
