import { useEffect, useState } from "react";
import { fetchStatuses } from "../services/shipments";
import type { ShipmentStatus } from "../types";

export const useStatuses = () => {
  const [statuses, setStatuses] = useState<ShipmentStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    setIsLoading(true);
    setError(null);

    fetchStatuses(controller.signal)
      .then((data) => setStatuses(data.map((option) => option.id)))
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load statuses");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  return { statuses, isLoading, error };
};
