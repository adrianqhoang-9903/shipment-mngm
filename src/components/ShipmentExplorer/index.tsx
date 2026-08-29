import { useSearchParams } from "react-router-dom";
import { useShipments } from "../../hooks/useShipments";
import { URL_PARAMS } from "../../constants";
import { withParam } from "../../utils/shipmentListParams";
import ShipmentList from "./ShipmentList";
import ShipmentDetails from "./ShipmentDetails";
import styles from "./index.module.css";
import CreateShipmentDialog from "./CreateShipment/CreateShipmentDialog";
import { notify } from "../Toast/toastStore";
import { useState } from "react";
import type { Shipment } from "../../types";

const ShipmentExplorer = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get(URL_PARAMS.selected) ?? undefined;
  const {
    shipments,
    params,
    updateParams,
    isLoading,
    error,
    totalPages,
    totalItems,
    refetch,
  } = useShipments();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const setSelectedShipment = (id: string | null) => {
    setSearchParams((current) => withParam(current, URL_PARAMS.selected, id), {
      replace: id === null,
    });
  };

  const handleSelectShipment = (id: string) => {
    setSelectedShipment(id);
  };

  const handleCreated = (created: Shipment) => {
    setSelectedShipment(created.id);
    if (params.status === "OPEN") {
      refetch();
    }
    notify("Shipment created.");
  };

  const openCreateShipment = () => {
    setIsCreateOpen(true);
  };

  return (
    <div className={styles.explorer}>
      <ShipmentList
        selectedId={selectedId}
        shipments={shipments}
        params={params}
        updateParams={updateParams}
        isLoading={isLoading}
        error={error}
        totalPages={totalPages}
        totalItems={totalItems}
        refetch={refetch}
        onSelectShipment={handleSelectShipment}
        openCreateShipment={openCreateShipment}
      />
      <ShipmentDetails
        selectedId={selectedId}
        refetchList={refetch}
        clearSelection={() => setSelectedShipment(null)}
      />
      {isCreateOpen && (
        <CreateShipmentDialog
          closeCreateShipment={() => setIsCreateOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
};

export default ShipmentExplorer;
