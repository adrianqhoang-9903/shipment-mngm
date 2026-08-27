import { httpClient } from "../lib/http";
import type { Assignment } from "../types";

// Only OPEN assignments can accept a newly-assigned shipment - a COMPLETED
// assignment's route has already finished. Not stated explicitly in the
// spec; documented as an assumption in the README.
export const fetchOpenAssignments = async (
  signal?: AbortSignal,
): Promise<Assignment[]> => {
  const { data } = await httpClient.get<Assignment[]>("/assignments", {
    params: { status: "OPEN" },
    signal,
  });
  return data;
};

// json-server auto-generates this route from the `assignments` top-level
// key, same as /shipments/:id - no server-side change needed.
export const fetchAssignmentById = async (
  id: string,
  signal?: AbortSignal,
): Promise<Assignment> => {
  const { data } = await httpClient.get<Assignment>(`/assignments/${id}`, {
    signal,
  });
  return data;
};
