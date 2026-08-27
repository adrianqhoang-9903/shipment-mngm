const fs = require("fs");
const statusList = ["OPEN", "IN_TRANSIT", "DELIVERED"];
const statuses = statusList.map((status) => ({ id: status }));
const clients = [
  "Sony", "Samsung", "DHL", "CargoTrans", "ShipCo", "Logix",
  "Oceanic",
];
const warehouses = ["EWR", "LAX", "JFK", "SFO", "SEA"];
const baseDate = new Date();
const minLat = 32.55, maxLat = 33.05;
const minLng = -97.40, maxLng = -96.50;
const shipments = [];

for (let i = 1; i <= 1000; i++) {
  const arrival = new Date(baseDate);
  arrival.setDate(arrival.getDate() - Math.floor(Math.random() * 10));
  const eta = new Date(arrival);
  eta.setHours(eta.getHours() + Math.floor(Math.random() * 48));
  shipments.push({
    id: `shp_${String(i).padStart(3, "0")}`,
    client_name: clients[i % clients.length],
    label: `${warehouses[i % warehouses.length]}-581-2505${20 + (i % 10)}-${i}`,
    status: statusList[i % statusList.length],
    arrival_date: arrival.toISOString(),
    delivery_by_date: new Date(arrival.getTime() + 2 * 86400000).toISOString(),
    eta: eta.toISOString(),
    warehouse_id: "581",
    lat: Math.random() * (maxLat - minLat) + minLat,
    lng: Math.random() * (maxLng - minLng) + minLng,
  });
}

const result = { statuses, shipments };
fs.writeFileSync("shipments.json", JSON.stringify(result, null, 2));
console.log("shipment data generated");
