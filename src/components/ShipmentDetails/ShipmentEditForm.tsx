import { useState } from "react";
import { useForm } from "../../hooks/useForm";
import { saveShipment } from "../../services/shipments";
import { toISODate, toDisplayDate } from "../../utils/date";
import {
  LATITUDE_RANGE,
  LONGITUDE_RANGE,
  validateNumberInRange,
} from "../../utils/validation";
import { STATUS_LABELS } from "../../constants";
import StaticField from "./StaticField";
import EditableField from "./EditableField";
import type { Shipment } from "../../types";
import styles from "./index.module.css";

interface FormValues {
  delivery_by_date: string;
  lat: string;
  lng: string;
}

const toFormValues = (shipment: Shipment): FormValues => ({
  delivery_by_date: toISODate(shipment.delivery_by_date),
  lat: String(shipment.lat),
  lng: String(shipment.lng),
});

const toApiPayload = (shipment: Shipment, values: FormValues): Shipment => ({
  ...shipment,
  delivery_by_date: `${values.delivery_by_date}T00:00:00.000Z`,
  lat: Number(values.lat),
  lng: Number(values.lng),
});

interface ShipmentEditFormProps {
  shipment: Shipment;
  onSaved: (updates: Shipment) => void;
}

const ShipmentEditForm = ({
  shipment,
  onSaved,
}: ShipmentEditFormProps) => {
  const { values, setField, isDirty, isValid, formProps, handleSubmit, reset } =
    useForm<FormValues>(toFormValues(shipment));
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const onValid = async (formValues: FormValues) => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const saved = await saveShipment(toApiPayload(shipment, formValues));
      // Patch the list with the server's authoritative response, once
      // it's confirmed - no pre-emptive optimistic patch or rollback (see
      // README Assumptions for why).
      onSaved(saved);
      reset(toFormValues(saved));
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save shipment",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeliveryByDateChange = (value: string) => {
    setField("delivery_by_date", value);
  };

  const handleLatChange = (value: string) => {
    setField("lat", value);
  };

  const handleLngChange = (value: string) => {
    setField("lng", value);
  };

  return (
    <form
      {...formProps}
      className={styles.shipmentDetails}
      onSubmit={handleSubmit(onValid)}
    >
      <h2 className={styles.title}>{shipment.label}</h2>
      <StaticField label="Client" value={shipment.client_name} />
      <StaticField label="Status" value={STATUS_LABELS[shipment.status]} />
      <StaticField
        label="Arrival Date"
        value={toDisplayDate(shipment.arrival_date)}
      />
      <EditableField
        name="delivery_by_date"
        label="Delivery By"
        type="date"
        value={values.delivery_by_date}
        onChange={handleDeliveryByDateChange}
        min={toISODate(shipment.arrival_date)}
        required
      />
      <StaticField label="Warehouse" value={shipment.warehouse_id} />
      <StaticField label="Assignment" value={shipment.assignment_id ?? "—"} />
      <EditableField
        name="lat"
        label="Latitude"
        type="text"
        inputMode="decimal"
        value={values.lat}
        onChange={handleLatChange}
        validate={(value) => validateNumberInRange(value, LATITUDE_RANGE)}
        required
      />
      <EditableField
        name="lng"
        label="Longitude"
        type="text"
        inputMode="decimal"
        value={values.lng}
        onChange={handleLngChange}
        validate={(value) => validateNumberInRange(value, LONGITUDE_RANGE)}
        required
      />
      <button type="submit" disabled={!isDirty || isSaving || !isValid}>
        {isSaving ? "Saving..." : "Save"}
      </button>
      {saveError && <p className={styles.error}>{saveError}</p>}
    </form>
  );
};

export default ShipmentEditForm;
