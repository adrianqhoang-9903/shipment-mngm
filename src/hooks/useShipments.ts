import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchShipments } from "../services/shipments";
import { mergeListParams, readListParams } from "../utils/queryParams";
import type { Shipment, ShipmentListUrlQuery } from "../types";

export const useShipments = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  // setSearchParams is recreated with every change in navigation, but we don't want it to be stale
  // nor for it to trigger API calls. This is better solved by using react-router's Data mode
  const setSearchParamsRef = useRef(setSearchParams);
  useEffect(() => {
    setSearchParamsRef.current = setSearchParams;
  }, [setSearchParams]);

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

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

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchShipments(
          { status, query, page, perPage },
          controller.signal,
        );

        // json-server clamps an out-of-range page to the last real one
        // server-side (verified directly: _page=999 returns the exact same
        // rows/pages/items as the actual last page)
        setShipments(response.data);
        setTotalPages(response.pages);
        setTotalItems(response.items);

        if (response.pages > 0 && page > response.pages) {
          setSearchParamsRef.current(
            (current) => mergeListParams(current, { page: response.pages }),
            { replace: true },
          );
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error ? err.message : "Failed to load shipments",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    load();

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
  };
};

export type UseShipmentsResult = ReturnType<typeof useShipments>;
