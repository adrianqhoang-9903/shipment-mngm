import { useState } from "react";
import { useForm } from "../../../hooks/useForm";
import { deleteShipment, saveShipment } from "../../../services/shipments";
import { toISODate, toDisplayDate, toApiDateTime } from "../../../utils/date";
import {
  LATITUDE_RANGE,
  LONGITUDE_RANGE,
  validateNumberInRange,
} from "../../../utils/validation";
import { getStatusDropdownOptions } from "../../../utils/statusTransitions";
import { STATUS_LABELS } from "../../../constants";
import StaticField from "../../FormFields/StaticField";
import TextField from "../../FormFields/TextField";
import SelectField from "../../FormFields/SelectField";
import AssignmentField from "./AssignmentField";
import { notify } from "../../Toast/toastStore";
import type { Shipment, ShipmentStatus } from "../../../types";
import styles from "./index.module.css";

interface FormValues {
  delivery_by_date: string;
  lat: string;
  lng: string;
  status: ShipmentStatus;
  assignment_id: string;
}

const toFormValues = (shipment: Shipment): FormValues => ({
  delivery_by_date: toISODate(shipment.delivery_by_date),
  lat: String(shipment.lat),
  lng: String(shipment.lng),
  status: shipment.status,
  assignment_id: shipment.assignment_id ?? "",
});

interface EditShipmentFormProps {
  shipment: Shipment;
  onSaved: (updates: Shipment) => void;
  onDeleted: () => void;
}

const EditShipmentForm = ({
  shipment,
  onSaved,
  onDeleted,
}: EditShipmentFormProps) => {
  const { values, setField, isDirty, handleSubmit, reset } =
    useForm<FormValues>(() => toFormValues(shipment));
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const onValid = async (formValues: FormValues) => {
    if (!isDirty) {
      // Nothing changed - skip the redundant PUT, but still confirm the
      // click did something, rather than silently doing nothing.
      notify("Shipment saved.");
      return;
    }

    setIsSaving(true);

    try {
      const isAssigning =
        shipment.status === "OPEN" && formValues.status === "IN_TRANSIT";
      const isUnassigning =
        shipment.status === "IN_TRANSIT" && formValues.status === "OPEN";

      const saved = await saveShipment({
        ...shipment,
        delivery_by_date: toApiDateTime(formValues.delivery_by_date),
        lat: Number(formValues.lat),
        lng: Number(formValues.lng),
        status: formValues.status,
        assignment_id: isAssigning
          ? formValues.assignment_id || null
          : isUnassigning
            ? null
            : shipment.assignment_id,
      });
      onSaved(saved);
      reset(toFormValues(saved));
      notify("Shipment saved.");
    } catch (err) {
      notify(
        err instanceof Error ? err.message : "Failed to save shipment",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Delete shipment ${shipment.label}? This cannot be undone.`,
      )
    ) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteShipment(shipment.id);
      onDeleted();
    } catch (err) {
      notify(
        err instanceof Error ? err.message : "Failed to delete shipment",
        "error",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFieldChange =
    <K extends Exclude<keyof FormValues, "status">>(key: K) =>
    (value: string) => {
      setField(key, value);
    };

  const handleStatusChange = (value: string) => {
    const status = value as ShipmentStatus;
    setField("status", status);

    if (status !== "IN_TRANSIT") {
      setField("assignment_id", "");
    }
  };

  const statusOptions = getStatusDropdownOptions(shipment.status).map(
    (status) => ({
      value: status,
      label: STATUS_LABELS[status],
    }),
  );

  return (
    <form className={styles.editForm} onSubmit={handleSubmit(onValid)}>
      <h2 className={styles.title}>{shipment.label}</h2>
      <StaticField label="Client" value={shipment.client_name} />
      <SelectField
        name="status"
        label="Status"
        value={values.status}
        options={statusOptions}
        onChange={handleStatusChange}
        disabled={statusOptions.length <= 1}
      />
      <StaticField
        label="Arrival Date"
        value={toDisplayDate(shipment.arrival_date)}
      />
      <TextField
        name="delivery_by_date"
        label="Delivery By"
        type="date"
        value={values.delivery_by_date}
        onChange={handleFieldChange("delivery_by_date")}
        min={toISODate(shipment.arrival_date)}
        required
      />
      <StaticField label="Warehouse ID" value={shipment.warehouse_id} />
      <AssignmentField
        shipment={shipment}
        status={values.status}
        assignmentId={values.assignment_id}
        onAssignmentIdChange={handleFieldChange("assignment_id")}
      />
      <TextField
        name="lat"
        label="Latitude"
        type="text"
        inputMode="decimal"
        value={values.lat}
        onChange={handleFieldChange("lat")}
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
        validate={(value) => validateNumberInRange(value, LONGITUDE_RANGE)}
        required
      />
      <div className={styles.actions}>
        <button type="submit" disabled={isSaving || isDeleting}>
          {isSaving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          className={styles.deleteButton}
          disabled={isSaving || isDeleting}
          onClick={handleDelete}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </form>
  );
};

export default EditShipmentForm;
