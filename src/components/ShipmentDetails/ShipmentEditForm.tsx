import { useState } from "react";
import { useForm } from "../../hooks/useForm";
import { useShipmentAssignment } from "../../hooks/useShipmentAssignment";
import { deleteShipment, saveShipment } from "../../services/shipments";
import { toISODate, toDisplayDate } from "../../utils/date";
import {
  LATITUDE_RANGE,
  LONGITUDE_RANGE,
  validateNumberInRange,
} from "../../utils/validation";
import { getStatusDropdownOptions } from "../../utils/statusTransitions";
import { STATUS_LABELS } from "../../constants";
import StaticField from "../FormFields/StaticField";
import TextField from "../FormFields/TextField";
import SelectField from "../FormFields/SelectField";
import type { Shipment, ShipmentStatus } from "../../types";
import styles from "./index.module.css";
import fieldStyles from "../FormFields/FormFields.module.css";

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

const toApiPayload = (shipment: Shipment, values: FormValues): Shipment => {
  const isAssigning =
    shipment.status === "OPEN" && values.status === "IN_TRANSIT";
  const isUnassigning =
    shipment.status === "IN_TRANSIT" && values.status === "OPEN";

  return {
    ...shipment,
    delivery_by_date: `${values.delivery_by_date}T00:00:00.000Z`,
    lat: Number(values.lat),
    lng: Number(values.lng),
    status: values.status,
    assignment_id: isAssigning
      ? values.assignment_id || null
      : isUnassigning
        ? null
        : shipment.assignment_id,
  };
};

interface ShipmentEditFormProps {
  shipment: Shipment;
  onSaved: (updates: Shipment) => void;
  onDeleted: () => void;
}

const ShipmentEditForm = ({ shipment, onSaved, onDeleted }: ShipmentEditFormProps) => {
  const { values, setField, isDirty, handleSubmit, reset } =
    useForm<FormValues>(toFormValues(shipment));
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    assignments,
    assignmentsLoading,
    assignmentsError,
    assignmentLabel,
    fetchOpenAssignmentsOnce,
  } = useShipmentAssignment(shipment);

  const isAssigning =
    shipment.status === "OPEN" && values.status === "IN_TRANSIT";
  const isUnassigning =
    shipment.status === "IN_TRANSIT" && values.status === "OPEN";

  const onValid = async (formValues: FormValues) => {
    if (!isDirty) return;

    setIsSaving(true);
    setFormError(null);

    try {
      const saved = await saveShipment(toApiPayload(shipment, formValues));
      // Patch the list with the server's authoritative response, once
      // it's confirmed - no pre-emptive optimistic patch or rollback (see
      // README Assumptions for why).
      onSaved(saved);
      reset(toFormValues(saved));
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to save shipment",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete shipment ${shipment.label}? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    setFormError(null);

    try {
      await deleteShipment(shipment.id);
      onDeleted();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to delete shipment",
      );
    } finally {
      setIsDeleting(false);
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

  const handleStatusChange = (value: string) => {
    const status = value as ShipmentStatus;
    setField("status", status);

    if (status !== "IN_TRANSIT") {
      setField("assignment_id", "");
      return;
    }

    fetchOpenAssignmentsOnce();
  };

  const handleAssignmentChange = (value: string) => {
    setField("assignment_id", value);
  };

  const statusOptions = getStatusDropdownOptions(shipment.status).map(
    (status) => ({
      value: status,
      label: STATUS_LABELS[status],
    }),
  );

  const assignmentOptions = assignments
    .filter((assignment) => assignment.clients.includes(shipment.client_name))
    .map((assignment) => ({
      value: assignment.id,
      label: `${assignment.label} (${assignment.clients.join(", ")})`,
    }));

  return (
    <form className={styles.shipmentDetails} onSubmit={handleSubmit(onValid)}>
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
        onChange={handleDeliveryByDateChange}
        min={toISODate(shipment.arrival_date)}
        required
      />
      <StaticField label="Warehouse" value={shipment.warehouse_id} />
      {shipment.status === "OPEN" ? (
        <SelectField
          name="assignment_id"
          label="Assignment"
          value={values.assignment_id}
          options={assignmentOptions}
          onChange={handleAssignmentChange}
          placeholder={
            !isAssigning
              ? "—"
              : assignmentsLoading
                ? "Loading assignments..."
                : assignmentsError
                  ? "Failed to load assignments"
                  : assignmentOptions.length === 0
                    ? "No assignments for this client"
                    : "Select an assignment..."
          }
          disabled={assignmentsLoading || !isAssigning}
          required={isAssigning}
        />
      ) : (
        <StaticField
          label="Assignment"
          value={
            shipment.assignment_id ? (assignmentLabel ?? "Loading...") : "—"
          }
        />
      )}
      {isUnassigning && (
        <p className={fieldStyles.hint}>
          Reverting to Open will clear this shipment&rsquo;s assignment.
        </p>
      )}
      <TextField
        name="lat"
        label="Latitude"
        type="text"
        inputMode="decimal"
        value={values.lat}
        onChange={handleLatChange}
        validate={(value) => validateNumberInRange(value, LATITUDE_RANGE)}
        required
      />
      <TextField
        name="lng"
        label="Longitude"
        type="text"
        inputMode="decimal"
        value={values.lng}
        onChange={handleLngChange}
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
      {formError && <p className={styles.error}>{formError}</p>}
    </form>
  );
};

export default ShipmentEditForm;
