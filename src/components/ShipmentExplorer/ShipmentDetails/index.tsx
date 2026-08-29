import { lazy, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchShipmentById } from "../../../services/shipments";
import EditShipmentForm from "./EditShipmentForm";
import type { Shipment } from "../../../types";
import styles from "./index.module.css";

const ShipmentLocationMap = lazy(() => import("../../LocationMap/ShipmentLocationMap"));

interface ShipmentDetailsProps {
  selectedId: string | undefined;
  patchShipment: (updates: Shipment) => void;
  refetchList: () => void;
}

const ShipmentDetails = ({
  selectedId,
  patchShipment,
  refetchList,
}: ShipmentDetailsProps) => {
  const navigate = useNavigate();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onShipmentSaved = (savedShipment: Shipment) => {
    const statusChanged = shipment?.status !== savedShipment.status;
    setShipment(savedShipment);

    if (statusChanged) {
      // possibly stale list
      refetchList();
    } else {
      patchShipment(savedShipment);
    }
  };

  const onShipmentDeleted = () => {
    navigate("/shipments");
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

  if (error || !shipment) {
    return (
      <div className={styles.shipmentDetails}>
        <p className={styles.error}>{error ?? "Shipment not found."}</p>
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
