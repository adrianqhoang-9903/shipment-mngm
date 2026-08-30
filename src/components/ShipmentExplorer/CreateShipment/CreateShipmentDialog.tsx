import { useEffect, useRef, useState } from "react";
import { useForm } from "../../../hooks/useForm";
import { createShipment } from "../../../services/shipments";
import { toEndOfDay, toISODate, toStartOfDay } from "../../../utils/date";
import {
  LATITUDE_RANGE,
  LONGITUDE_RANGE,
  validateNumberInRange,
  validateRequiredText,
} from "../../../utils/validation";
import TextField from "../../FormFields/TextField";
import { notify } from "../../Toast/toastStore";
import type { Shipment } from "../../../types";
import styles from "./CreateShipmentDialog.module.css";

interface CreateFormValues {
  client_name: string;
  label: string;
  warehouse_id: string;
  arrival_date: string;
  delivery_by_date: string;
  lat: string;
  lng: string;
}

const today = () => toISODate(new Date().toISOString());

const buildInitialValues = (): CreateFormValues => ({
  client_name: "",
  label: "",
  warehouse_id: "",
  arrival_date: today(),
  delivery_by_date: today(),
  lat: "",
  lng: "",
});

interface CreateShipmentDialogProps {
  closeCreateShipment: () => void;
  onCreated: (created: Shipment) => void;
}

const CreateShipmentDialog = ({
  closeCreateShipment,
  onCreated,
}: CreateShipmentDialogProps) => {
  const { values, setField, handleSubmit } =
    useForm<CreateFormValues>(buildInitialValues);
  const [isCreating, setIsCreating] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => dialogRef.current?.showModal(), []);

  const onValid = async (formValues: CreateFormValues) => {
    setIsCreating(true);

    try {
      const deliveryBy = toEndOfDay(formValues.delivery_by_date);
      const created = await createShipment({
        client_name: formValues.client_name.trim(),
        label: formValues.label.trim(),
        status: "OPEN",
        arrival_date: toStartOfDay(formValues.arrival_date),
        delivery_by_date: deliveryBy,
        eta: deliveryBy,
        warehouse_id: formValues.warehouse_id.trim(),
        assignment_id: null,
        lat: Number(formValues.lat),
        lng: Number(formValues.lng),
      });
      onCreated(created);
      closeCreateShipment();
    } catch (err) {
      notify(
        err instanceof Error ? err.message : "Failed to create shipment",
        "error",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleFieldChange =
    <K extends keyof CreateFormValues>(key: K) =>
    (value: string) => {
      setField(key, value);
    };

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClose={closeCreateShipment}
    >
      <form onSubmit={handleSubmit(onValid)}>
        <h2 className={styles.title}>Create shipment</h2>
        <div className={styles.fields}>
          <TextField
            name="label"
            label="Label"
            type="text"
            value={values.label}
            onChange={handleFieldChange("label")}
            validate={validateRequiredText}
            required
          />
          <TextField
            name="client_name"
            label="Client"
            type="text"
            value={values.client_name}
            onChange={handleFieldChange("client_name")}
            validate={validateRequiredText}
            required
          />
          <TextField
            name="warehouse_id"
            label="Warehouse ID"
            type="text"
            value={values.warehouse_id}
            onChange={handleFieldChange("warehouse_id")}
            validate={validateRequiredText}
            required
          />
          <TextField
            name="arrival_date"
            label="Arrival Date"
            type="date"
            value={values.arrival_date}
            onChange={handleFieldChange("arrival_date")}
            max={today()}
            required
          />
          <TextField
            name="delivery_by_date"
            label="Delivery By"
            type="date"
            value={values.delivery_by_date}
            onChange={handleFieldChange("delivery_by_date")}
            min={values.arrival_date}
            required
          />
          <TextField
            name="lat"
            label="Latitude"
            type="text"
            inputMode="decimal"
            value={values.lat}
            onChange={handleFieldChange("lat")}
            placeholder="Between -90 and 90"
            validate={(value) => validateNumberInRange(value, LATITUDE_RANGE)}
            required
          />
          <TextField
            name="lng"
            label="Longitude"
            type="text"
            inputMode="decimal"
            value={values.lng}
            onChange={handleFieldChange("lng")}
            placeholder="Between -180 and 180"
            validate={(value) => validateNumberInRange(value, LONGITUDE_RANGE)}
            required
          />
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={closeCreateShipment}
            disabled={isCreating}
          >
            Cancel
          </button>
          <button type="submit" disabled={isCreating}>
            {isCreating ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </dialog>
  );
};

export default CreateShipmentDialog;
