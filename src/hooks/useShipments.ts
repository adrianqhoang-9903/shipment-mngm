import { useEffect, useState } from "react";
import { fetchShipments } from "../services/shipments";
import { DEFAULT_SHIPMENT_LIST_QUERY } from "../constants";
import type { Shipment, ShipmentListQuery } from "../types";

export const useShipments = () => {
  const [params, setParams] = useState<ShipmentListQuery>(
    DEFAULT_SHIPMENT_LIST_QUERY,
  );
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const { status, query, page, perPage } = params;

  const updateParams = (partial: Partial<ShipmentListQuery>) => {
    setParams((prev) => ({ ...prev, ...partial }));
  };

  const refetch = () => {
    setRefreshKey((key) => key + 1);
  };

  const patchShipment = (updates: Shipment) => {
    setShipments((prev) =>
      prev.map((shipment) =>
        shipment.id === updates.id
          ? { ...shipment, ...updates }
          : shipment,
      ),
    );
  };

  useEffect(() => {
    const controller = new AbortController();

    setIsLoading(true);
    setError(null);

    fetchShipments({ status, query, page, perPage }, controller.signal)
      .then((response) => {
        // fetch again to clamp in case page has nothing, e.g. status transition & delete
        if (response.pages > 0 && page > response.pages) {
          setParams((prev) => ({ ...prev, page: response.pages }));
          return;
        }

        setShipments(response.data);
        setTotalPages(response.pages);
        setTotalItems(response.items);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error ? err.message : "Failed to load shipments",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [status, query, page, perPage, refreshKey]);

  return {
    shipments,
    params,
    updateParams,
    isLoading,
    error,
    totalPages,
    totalItems,
    refetch,
    patchShipment,
  };
};

export type UseShipmentsResult = ReturnType<typeof useShipments>;
