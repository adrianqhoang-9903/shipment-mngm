import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchShipmentById } from "../../services/shipments";
import ShipmentEditForm from "./ShipmentEditForm";
import type { Shipment } from "../../types";
import styles from "./index.module.css";
import ShipmentLocationMap from "./ShipmentLocationMap";

interface ShipmentDetailsProps {
  patchShipment: (updates: Shipment) => void;
  refetchList: () => void;
}

const ShipmentDetails = ({ patchShipment, refetchList }: ShipmentDetailsProps) => {
  const { id } = useParams();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onShipmentSaved = (savedShipment: Shipment) => {
    const statusChanged = shipment?.status !== savedShipment.status;
    setShipment(savedShipment);

    if (statusChanged) { // possibly stale list
      refetchList();
    } else {
      patchShipment(savedShipment);
    }
  };

  useEffect(() => {
    setShipment(null);
    setError(null);

    if (!id) return;

    const controller = new AbortController();
    setIsLoading(true);

    fetchShipmentById(id, controller.signal)
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
  }, [id]);

  if (!id) {
    return (
      <div className={styles.shipmentDetails}>
        <p className={styles.placeholder}>Select a shipment to view details.</p>
      </div>
    );
  }

  if (isLoading) {
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
      <ShipmentEditForm
        key={shipment.id}
        shipment={shipment}
        onSaved={onShipmentSaved}
      />
      <ShipmentLocationMap shipment={shipment} />
    </div>
  );
};

export default ShipmentDetails;
