export type ShipmentStatus = "OPEN" | "IN_TRANSIT" | "DELIVERED";

export interface Shipment {
  id: string;
  client_name: string;
  label: string;
  status: ShipmentStatus;
  arrival_date: string;
  delivery_by_date: string;
  eta: string;
  warehouse_id: string;
  assignment_id?: string | null;
  lat: number;
  lng: number;
}

// The assignment-relevant slice of a shipment, structural so the rules that
// use it work on both a Shipment and a form's own values without either
// having to know about the other.
export interface AssignmentState {
  status: ShipmentStatus;
  assignment_id?: string | null;
}

// The only two status changes that touch the assignment at all.
export type TransitionKind = "assigning" | "unassigning" | "none";

type AssignmentStatus = "OPEN" | "COMPLETED";

export interface Assignment {
  id: string;
  label: string;
  status: AssignmentStatus;
  clients: string[];
  shipment_count: number;
}

export interface PaginatedResponse<T> {
  first: number;
  prev: number | null;
  next: number | null;
  last: number;
  pages: number;
  items: number;
  data: T[];
}

export interface ShipmentListQuery {
  status: ShipmentStatus;
  query: string;
  page: number;
  perPage: number;
}

// The part of the list query that lives in the URL. perPage is a constant -
// nothing in the UI changes it, so it has no business in the query string.
export type ShipmentListUrlQuery = Omit<ShipmentListQuery, "perPage">;
