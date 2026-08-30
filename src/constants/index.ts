import type { ShipmentListQuery, ShipmentStatus } from "../types";

const DEFAULT_PAGE_SIZE = 50;
export const REQUEST_TIMEOUT_MS = 8000;
export const SEARCH_DEBOUNCE_MS = 500;

export const STATUS_LABELS: Record<ShipmentStatus, string> = {
  OPEN: "Open",
  IN_TRANSIT: "In transit",
  DELIVERED: "Delivered",
};

export const URL_PARAMS = {
  selected: "selected",
  status: "status",
  query: "q",
  page: "page",
} as const;

export const DEFAULT_SHIPMENT_LIST_PATH = "/shipments?status=OPEN&page=1";

export const DEFAULT_SHIPMENT_LIST_QUERY: ShipmentListQuery = {
  status: "OPEN",
  query: "",
  page: 1,
  perPage: DEFAULT_PAGE_SIZE,
};
