import { useNavigate, useParams } from "react-router-dom";
import { useShipments } from "../../hooks/useShipments";
import ShipmentList from "../ShipmentList";
import ShipmentDetails from "../ShipmentDetails";
import styles from "./index.module.css";

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

  const handleSelectShipment = (id: string) => {
    navigate(`/shipments/${id}`);
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
      />
      <ShipmentDetails
        selectedId={selectedId}
        patchShipment={patchShipment}
        refetchList={refetch}
      />
    </div>
  );
};

export default ShipmentExplorer;
