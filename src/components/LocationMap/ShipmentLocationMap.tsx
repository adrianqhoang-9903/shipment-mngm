import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./ShipmentLocationMap.module.css";

interface ShipmentLocationMapProps {
  lat: number;
  lng: number;
  height?: string;
  width?: string;
}

const RecenterOnChange = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lng]);
  }, [map, lat, lng]);

  return null;
};

const ShipmentLocationMap = ({
  lat,
  lng,
  height = "400px",
  width = "100%",
}: ShipmentLocationMapProps) => {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={13}
      scrollWheelZoom={false}
      className={styles.shipmentLocationMap}
      style={{ height, width }}
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
