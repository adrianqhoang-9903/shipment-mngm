import { httpClient } from "../lib/http";
import type { Assignment } from "../types";

export const fetchOpenAssignments = async (
  signal?: AbortSignal,
): Promise<Assignment[]> => {
  const { data } = await httpClient.get<Assignment[]>("/assignments", {
    params: { status: "OPEN" },
    signal,
  });
  return data;
};

export const fetchAssignmentById = async (
  id: string,
  signal?: AbortSignal,
): Promise<Assignment> => {
  const { data } = await httpClient.get<Assignment>(`/assignments/${id}`, {
    signal,
  });
  return data;
};
