import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Shipment } from "../../../types";
import styles from "./ShipmentLocationMap.module.css";

interface ShipmentLocationMapProps {
  shipment: Shipment;
}

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
