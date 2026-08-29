import type { UseShipmentsResult } from "../../../hooks/useShipments";
import ShipmentSearch from "./ShipmentSearch";
import ShipmentFilters from "./ShipmentFilters";
import ShipmentTable from "./ShipmentTable";
import Pagination from "./Pagination";
import type { ShipmentStatus } from "../../../types";
import styles from "./index.module.css";

interface ShipmentListProps extends Omit<UseShipmentsResult, "patchShipment"> {
  selectedId: string | undefined;
  onSelectShipment: (id: string) => void;
  openCreateShipment: () => void;
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
  refetch,
  onSelectShipment,
  openCreateShipment
}: ShipmentListProps) => {
  const handleSearch = (query: string) => {
    updateParams({ query, page: 1 });
  };

  const handleStatusChange = (status: ShipmentStatus) => {
    updateParams({ status, page: 1 });
  };

  const handlePageChange = (page: number) => {
    updateParams({ page });
  };

  return (
    <div className={styles.shipmentList}>
      <div className={styles.controls}>
        <ShipmentSearch onSearch={handleSearch} />
        <ShipmentFilters value={params.status} onChange={handleStatusChange} />
        <button type="button" onClick={openCreateShipment}>
          Create
        </button>
      </div>

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
            isLoading={isLoading}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default ShipmentList;
