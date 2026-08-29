import { lazy, useEffect, useState } from "react";
import { fetchShipmentById } from "../../../services/shipments";
import EditShipmentForm from "./EditShipmentForm";
import type { Shipment } from "../../../types";
import styles from "./index.module.css";

const ShipmentLocationMap = lazy(() => import("../../LocationMap/ShipmentLocationMap"));

interface ShipmentDetailsProps {
  selectedId: string | undefined;
  refetchList: () => void;
  clearSelection: () => void;
}

const ShipmentDetails = ({
  selectedId,
  refetchList,
  clearSelection,
}: ShipmentDetailsProps) => {
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onShipmentSaved = (savedShipment: Shipment) => {
    const statusChanged = shipment?.status !== savedShipment.status;
    setShipment(savedShipment);

    if (statusChanged) {
      refetchList();
    }
  };

  const onShipmentDeleted = () => {
    // The panel can't keep showing a shipment that no longer exists.
    clearSelection();
    refetchList();
  };

  useEffect(() => {
    setShipment(null);
    setError(null);

    if (!selectedId) return;

    const controller = new AbortController();
    setIsLoading(true);

    fetchShipmentById(selectedId, controller.signal)
      .then(setShipment)
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error ? err.message : "Failed to load shipment",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [selectedId]);

  if (!selectedId) {
    return (
      <div className={styles.shipmentDetails}>
        <p className={styles.placeholder}>Select a shipment to view details.</p>
      </div>
    );
  }

  if (isLoading || (!error && shipment?.id !== selectedId)) {
    return (
      <div className={styles.shipmentDetails}>
        <p className={styles.placeholder}>Loading...</p>
      </div>
    );
  }

  if (error || !shipment) { // !shipment is unreachable. Only kept so that TypeScript can narrow down its type below.
    return (
      <div className={styles.shipmentDetails}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.shipmentDetails}>
      <EditShipmentForm
        key={shipment.id}
        shipment={shipment}
        onSaved={onShipmentSaved}
        onDeleted={onShipmentDeleted}
      />
      <ShipmentLocationMap lat={shipment.lat} lng={shipment.lng} />
    </div>
  );
};

export default ShipmentDetails;
