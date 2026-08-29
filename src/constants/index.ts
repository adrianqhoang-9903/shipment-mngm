import type { ShipmentListQuery, ShipmentStatus } from "../types";

export const DEFAULT_PAGE_SIZE = 25;
export const REQUEST_TIMEOUT_MS = 8000;
export const SEARCH_DEBOUNCE_MS = 500;

// Client-side display mapping only - the server still speaks the raw
// SCREAMING_CASE values, this is purely presentational.
export const STATUS_LABELS: Record<ShipmentStatus, string> = {
  OPEN: "Open",
  IN_TRANSIT: "In transit",
  DELIVERED: "Delivered",
};

export const DEFAULT_SHIPMENT_LIST_QUERY: ShipmentListQuery = {
  status: "OPEN",
  query: "",
  page: 1,
  perPage: DEFAULT_PAGE_SIZE,
};
