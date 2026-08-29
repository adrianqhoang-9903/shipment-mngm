import type { ChangeEvent } from "react";
import { STATUS_LABELS } from "../../../constants";
import type { ShipmentStatus } from "../../../types";
import styles from "./ShipmentFilters.module.css";

const STATUSES = Object.keys(STATUS_LABELS) as ShipmentStatus[];

interface ShipmentFiltersProps {
  value: ShipmentStatus;
  onChange: (status: ShipmentStatus) => void;
}

const ShipmentFilters = ({ value, onChange }: ShipmentFiltersProps) => {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value as ShipmentStatus);
  };

  return (
    <div className={styles.filters}>
      <label htmlFor="status-filter">Status</label>
      <select id="status-filter" value={value} onChange={handleChange}>
        {STATUSES.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ShipmentFilters;
