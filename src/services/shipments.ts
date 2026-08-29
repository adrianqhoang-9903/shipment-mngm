import { httpClient } from "../lib/http";
import type {
  PaginatedResponse,
  Shipment,
  ShipmentListQuery,
  ShipmentStatus,
} from "../types";

const buildWhere = (status: ShipmentStatus, query: string) => {
  const where: Record<string, unknown> = { status: { eq: status } };
  const trimmed = query.trim();
  if (trimmed) {
    where.or = [
      { client_name: { contains: trimmed } },
      { label: { contains: trimmed } },
    ];
  }

  return where;
};

export const fetchShipments = async (
  { status, query, page, perPage }: ShipmentListQuery,
  signal?: AbortSignal,
): Promise<PaginatedResponse<Shipment>> => {
  const { data } = await httpClient.get<PaginatedResponse<Shipment>>(
    "/shipments",
    {
      params: {
        _where: JSON.stringify(buildWhere(status, query)),
        _page: page,
        _per_page: perPage,
      },
      signal,
    },
  );
  return data;
};

export const fetchShipmentById = async (
  id: string,
  signal?: AbortSignal,
): Promise<Shipment> => {
  const { data } = await httpClient.get<Shipment>(`/shipments/${id}`, {
    signal,
  });
  return data;
};

export const saveShipment = async (shipment: Shipment): Promise<Shipment> => {
  const { data } = await httpClient.put<Shipment>(
    `/shipments/${shipment.id}`,
    shipment,
  );
  return data;
};

export const createShipment = async (
  shipment: Omit<Shipment, "id">,
): Promise<Shipment> => {
  const { data } = await httpClient.post<Shipment>("/shipments", shipment);
  return data;
};

export const deleteShipment = async (id: string): Promise<void> => {
  await httpClient.delete(`/shipments/${id}`);
};
