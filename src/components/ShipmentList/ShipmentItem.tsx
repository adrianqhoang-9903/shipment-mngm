import type { KeyboardEvent } from "react";
import type { Shipment } from "../../types";
import { toDisplayDate } from "../../utils/date";
import styles from "./ShipmentItem.module.css";

interface ShipmentItemProps {
  shipment: Shipment;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const ShipmentItem = ({ shipment, isSelected, onSelect }: ShipmentItemProps) => {
  const handleSelect = () => {
    onSelect(shipment.id);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSelect();
    }
  };

  return (
    <tr
      className={isSelected ? styles.selected : undefined}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-selected={isSelected}
    >
      <td>{shipment.client_name}</td>
      <td>{shipment.label}</td>
      <td>{toDisplayDate(shipment.arrival_date)}</td>
    </tr>
  );
};

export default ShipmentItem;
