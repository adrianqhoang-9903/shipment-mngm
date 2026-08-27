import { useEffect, useRef, useState } from "react";
import { useForm } from "../../hooks/useForm";
import {
  fetchAssignmentById,
  fetchOpenAssignments,
} from "../../services/assignments";
import { saveShipment } from "../../services/shipments";
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
import type { Assignment, Shipment, ShipmentStatus } from "../../types";
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
}

const ShipmentEditForm = ({ shipment, onSaved }: ShipmentEditFormProps) => {
  const { values, setField, isDirty, isValid, formProps, handleSubmit, reset } =
    useForm<FormValues>(toFormValues(shipment));
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [assignmentLabel, setAssignmentLabel] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const assignmentsAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => assignmentsAbortRef.current?.abort();
  }, []);

  const isAssigning =
    shipment.status === "OPEN" && values.status === "IN_TRANSIT";
  const isUnassigning =
    shipment.status === "IN_TRANSIT" && values.status === "OPEN";

  useEffect(() => {
    setAssignmentLabel(null);
    if (!shipment.assignment_id) return;

    const controller = new AbortController();
    fetchAssignmentById(shipment.assignment_id, controller.signal)
      .then((assignment) => setAssignmentLabel(assignment.label))
      .catch(() => {
        // Fall back to the raw id in the render below - a lookup failure
        // shouldn't block viewing the rest of the shipment.
      });

    return () => controller.abort();
  }, [shipment.assignment_id]);

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

  const handleStatusChange = (value: string) => {
    const status = value as ShipmentStatus;
    setField("status", status);

    if (status !== "IN_TRANSIT") {
      setField("assignment_id", "");
      return;
    }

    if (
      shipment.status === "OPEN" &&
      assignments.length === 0 &&
      !assignmentsLoading
    ) {
      setAssignmentsLoading(true);
      const controller = new AbortController();
      assignmentsAbortRef.current = controller;
      fetchOpenAssignments(controller.signal)
        .then(setAssignments)
        .catch(() => {
          if (controller.signal.aborted) return;
          // Leave the list empty - the select just shows no options rather
          // than blocking the rest of the form.
        })
        .finally(() => {
          if (!controller.signal.aborted) setAssignmentsLoading(false);
        });
    }
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

  const assignmentOptions = assignments.map((assignment) => ({
    value: assignment.id,
    label: `${assignment.label} (${assignment.clients.join(", ")})`,
  }));

  return (
    <form
      {...formProps}
      className={styles.shipmentDetails}
      onSubmit={handleSubmit(onValid)}
    >
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
      {shipment.status === "OPEN" && isAssigning ? (
        <SelectField
          name="assignment_id"
          label="Assignment"
          value={values.assignment_id}
          options={assignmentOptions}
          onChange={handleAssignmentChange}
          placeholder={
            assignmentsLoading
              ? "Loading assignments..."
              : "Select an assignment..."
          }
          disabled={assignmentsLoading}
          required
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
      <button type="submit" disabled={!isDirty || isSaving || !isValid}>
        {isSaving ? "Saving..." : "Save"}
      </button>
      {saveError && <p className={styles.error}>{saveError}</p>}
    </form>
  );
};

export default ShipmentEditForm;
