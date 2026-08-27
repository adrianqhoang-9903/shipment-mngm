import { useNavigate } from "react-router-dom";
import { useShipments } from "../../hooks/useShipments";
import ShipmentList from "../ShipmentList";
import ShipmentDetails from "../ShipmentDetails";
import styles from "./index.module.css";

const ShipmentExplorer = () => {
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
      <ShipmentDetails patchShipment={patchShipment} />
    </div>
  );
};

export default ShipmentExplorer;
