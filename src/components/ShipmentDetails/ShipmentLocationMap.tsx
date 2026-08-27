import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Shipment } from "../../types";
import styles from "./ShipmentLocationMap.module.css";

interface ShipmentLocationMapProps {
  shipment: Shipment;
}

// MapContainer's `center` prop only initializes the view once - unlike
// Marker's `position`, it doesn't reactively re-center on later prop
// changes, since the underlying Leaflet map is an imperative object React
// doesn't otherwise own. Synchronizing it with the current coordinates on
// every change is exactly what useEffect is for here (an external, non-React
// system needs to be told about a state change) - not the same category
// as the fetch-in-effect cases avoided elsewhere in this app.
const RecenterOnChange = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lng]);
  }, [map, lat, lng]);

  return null;
};

const ShipmentLocationMap = ({ shipment }: ShipmentLocationMapProps) => {
  const { lat, lng } = shipment;
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={13}
      scrollWheelZoom={false}
      className={styles.shipmentLocationMap}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]}></Marker>
      <RecenterOnChange lat={lat} lng={lng} />
    </MapContainer>
  );
};

export default ShipmentLocationMap;
