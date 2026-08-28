import type { Shipment } from "../../types";
import ShipmentItem from "./ShipmentItem";
import styles from "./ShipmentTable.module.css";

interface ShipmentTableProps {
  selectedId: string | undefined;
  shipments: Shipment[];
  isLoading: boolean;
  onSelectShipment: (id: string) => void;
}

const ShipmentTable = ({
  selectedId,
  shipments,
  isLoading,
  onSelectShipment,
}: ShipmentTableProps) => {

  if (isLoading) {
    return (
      <div className={styles.tableContainer}>
        <p className={styles.status}>Loading shipments...</p>
      </div>
    );
  }

  if (shipments.length === 0) {
    return (
      <div className={styles.tableContainer}>
        <p className={styles.status}>No shipments found.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <colgroup>
          <col className={styles.colClient} />
          <col className={styles.colLabel} />
          <col className={styles.colDate} />
        </colgroup>
        <thead>
          <tr>
            <th>Client</th>
            <th>Label</th>
            <th>Arrival Date</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((shipment) => (
            <ShipmentItem
              key={shipment.id}
              shipment={shipment}
              isSelected={shipment.id === selectedId}
              onSelect={onSelectShipment}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ShipmentTable;
