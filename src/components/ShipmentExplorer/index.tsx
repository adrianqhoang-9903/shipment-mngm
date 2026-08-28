import { useNavigate, useParams } from "react-router-dom";
import { useShipments } from "../../hooks/useShipments";
import ShipmentList from "./ShipmentList";
import ShipmentDetails from "./ShipmentDetails";
import styles from "./index.module.css";
import CreateShipmentDialog from "./CreateShipment/CreateShipmentDialog";
import SuccessToast from "../SuccessToast/SuccessToast";
import { useState } from "react";
import type { Shipment } from "../../types";

const ShipmentExplorer = () => {
  const { id: selectedId } = useParams();
  const navigate = useNavigate();
  const {
    shipments,
    params,
    updateParams,
    isLoading,
    error,
    totalPages,
    totalItems,
    hasNextPage,
    refetch,
    patchShipment,
  } = useShipments();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSelectShipment = (id: string) => {
    navigate(`/shipments/${id}`);
  };

  const handleCreated = (created: Shipment) => {
    navigate(`/shipments/${created.id}`);
    if (params.status === "OPEN") {
      refetch();
    }
    setSuccessMessage("Shipment created.");
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
        hasNextPage={hasNextPage}
        refetch={refetch}
        onSelectShipment={handleSelectShipment}
        openCreateShipment={openCreateShipment}
      />
      <ShipmentDetails
        selectedId={selectedId}
        patchShipment={patchShipment}
        refetchList={refetch}
      />
      {isCreateOpen && (
        <CreateShipmentDialog
          isOpen={isCreateOpen}
          closeCreateShipment={() => setIsCreateOpen(false)}
          onCreated={handleCreated}
        />
      )}
      <SuccessToast
        message={successMessage}
        onDismiss={() => setSuccessMessage(null)}
      />
    </div>
  );
};

export default ShipmentExplorer;
