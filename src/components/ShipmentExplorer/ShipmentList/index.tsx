import { useState } from "react";
import { useStatuses } from "../../../hooks/useStatuses";
import type { UseShipmentsResult } from "../../../hooks/useShipments";
import ShipmentSearch from "./ShipmentSearch";
import ShipmentFilters from "./ShipmentFilters";
import ShipmentTable from "./ShipmentTable";
import Pagination from "./Pagination";
import CreateShipmentDialog from "../CreateShipment/CreateShipmentDialog";
import type { Shipment, ShipmentStatus } from "../../../types";
import styles from "./index.module.css";

interface ShipmentListProps extends Omit<UseShipmentsResult, "patchShipment"> {
  selectedId: string | undefined;
  onSelectShipment: (id: string) => void;
}

const ShipmentList = ({
  selectedId,
  shipments,
  params,
  updateParams,
  isLoading,
  error,
  totalPages,
  totalItems,
  hasNextPage,
  refetch,
  onSelectShipment,
}: ShipmentListProps) => {
  const { statuses, isLoading: statusesLoading } = useStatuses();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleSearch = (query: string) => {
    updateParams({ query, page: 1 });
  };

  const handleStatusChange = (status: ShipmentStatus) => {
    updateParams({ status, page: 1 });
  };

  const handlePageChange = (page: number) => {
    updateParams({ page });
  };

  const handleCreated = (_created: Shipment) => {
    // A new shipment always starts OPEN - only worth refetching if that's
    // the status currently being viewed, otherwise it wouldn't show up in
    // this filtered list anyway.
    if (params.status === "OPEN") {
      refetch();
    }
  };

  return (
    <div className={styles.shipmentList}>
      <div className={styles.controls}>
        <ShipmentSearch onSearch={handleSearch} />
        <ShipmentFilters
          statuses={statuses}
          value={params.status}
          onChange={handleStatusChange}
          disabled={statusesLoading}
        />
        <button type="button" onClick={() => setIsCreateOpen(true)}>
          Create
        </button>
      </div>
      <CreateShipmentDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleCreated}
      />
      {error && (
        <div className={styles.errorBanner}>
          <p className={styles.error}>{error}</p>
          <button onClick={refetch}>Retry</button>
        </div>
      )}
      {!error && (
        <>
          <ShipmentTable
            selectedId={selectedId}
            shipments={shipments}
            isLoading={isLoading}
            onSelectShipment={onSelectShipment}
          />
          <Pagination
            page={params.page}
            totalPages={totalPages}
            totalItems={totalItems}
            hasNextPage={hasNextPage}
            isLoading={isLoading}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default ShipmentList;
