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

export interface StatusOption {
  id: ShipmentStatus;
}

// Mirrors json-server v1's pagination envelope as-is; interpretation
// (hasNextPage, etc.) is left to the caller rather than reshaped here.
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
