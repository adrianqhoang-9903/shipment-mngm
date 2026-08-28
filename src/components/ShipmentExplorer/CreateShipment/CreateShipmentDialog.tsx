import { useEffect, useRef, useState } from "react";
import { useForm } from "../../../hooks/useForm";
import { createShipment } from "../../../services/shipments";
import { toApiDateTime, toISODate } from "../../../utils/date";
import {
  LATITUDE_RANGE,
  LONGITUDE_RANGE,
  validateNumberInRange,
} from "../../../utils/validation";
import TextField from "../../FormFields/TextField";
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

const toCreatePayload = (values: CreateFormValues): Omit<Shipment, "id"> => {
  const deliveryBy = toApiDateTime(values.delivery_by_date);

  return {
    client_name: values.client_name.trim(),
    label: values.label.trim(),
    status: "OPEN",
    arrival_date: toApiDateTime(values.arrival_date),
    delivery_by_date: deliveryBy,
    eta: deliveryBy,
    warehouse_id: values.warehouse_id.trim(),
    assignment_id: null,
    lat: Number(values.lat),
    lng: Number(values.lng),
  };
};

interface CreateShipmentDialogProps {
  isOpen: boolean;
  closeCreateShipment: () => void;
  onCreated: (created: Shipment) => void;
}

const CreateShipmentDialog = ({
  isOpen,
  closeCreateShipment,
  onCreated,
}: CreateShipmentDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { values, setField, handleSubmit, formProps, reset } =
    useForm<CreateFormValues>(buildInitialValues());
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      setFormError(null);
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen, reset]);

  const onValid = async (formValues: CreateFormValues) => {
    setIsCreating(true);
    setFormError(null);

    try {
      const created = await createShipment(toCreatePayload(formValues));
      onCreated(created);
      closeCreateShipment();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create shipment",
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
    <>
      <dialog ref={dialogRef} className={styles.dialog} onClose={closeCreateShipment}>
        <form {...formProps} onSubmit={handleSubmit(onValid)}>
          <h2 className={styles.title}>Create shipment</h2>
          <div className={styles.fields}>
            <TextField
              name="label"
              label="Label"
              type="text"
              value={values.label}
              onChange={handleFieldChange("label")}
              required
            />
            <TextField
              name="client_name"
              label="Client"
              type="text"
              value={values.client_name}
              onChange={handleFieldChange("client_name")}
              required
            />
            {/* No default, same as client_name/label - "581" being the
                  only value every sample shipment has is far more likely a
                  generator-script shortcut than a real fact about where a
                  new shipment arrives (the domain clearly implies multiple
                  warehouses, given the multi-airport-code labels). Not
                  actually true-by-construction the way status/assignment_id
                  are, so it doesn't get treated like they do. */}
            <TextField
              name="warehouse_id"
              label="Warehouse ID"
              type="text"
              value={values.warehouse_id}
              onChange={handleFieldChange("warehouse_id")}
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
              validate={(value) =>
                validateNumberInRange(value, LONGITUDE_RANGE)
              }
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
          {formError && <p className={styles.error}>{formError}</p>}
        </form>
      </dialog>
    </>
  );
};

export default CreateShipmentDialog;
