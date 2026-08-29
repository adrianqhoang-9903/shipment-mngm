import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchShipments } from "../services/shipments";
import { mergeListParams, readListParams } from "../utils/queryParams";
import type { Shipment, ShipmentListUrlQuery } from "../types";

export const useShipments = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [clampToPage, setClampToPage] = useState<number | null>(null);

  const params = readListParams(searchParams);
  const { status, query, page, perPage } = params;

  const updateParams = (
    partial: Partial<ShipmentListUrlQuery>,
    { replace = false }: { replace?: boolean } = {},
  ) => {
    setSearchParams((current) => mergeListParams(current, partial), {
      replace,
    });
  };

  const refetch = () => {
    setRefreshKey((key) => key + 1);
  };

  useEffect(() => {
    const controller = new AbortController();

    setIsLoading(true);
    setError(null);

    fetchShipments({ status, query, page, perPage }, controller.signal)
      .then((response) => {
        if (response.pages > 0 && page > response.pages) {
          setClampToPage(response.pages);
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

  useEffect(() => {
    if (clampToPage === null) return;

    setClampToPage(null);
    setSearchParams((current) => mergeListParams(current, { page: clampToPage }), {
      replace: true,
    });
  }, [clampToPage, setSearchParams]);

  return {
    shipments,
    params,
    updateParams,
    isLoading,
    error,
    totalPages,
    totalItems,
    refetch,
  };
};

export type UseShipmentsResult = ReturnType<typeof useShipments>;
