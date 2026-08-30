const fs = require("fs");

// Row count from the first CLI arg, e.g. `node scripts/generate-data.cjs 100000`.
const SHIPMENT_COUNT = Number(process.argv[2]) || 1000;

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

// Assignments aren't in the spec's own generator, but the Stretch status
// transition (OPEN -> IN_TRANSIT) requires picking one, so there needs to
// be real data for that dropdown instead of an empty list.
const ASSIGNMENT_COUNT = 40;
const assignments = [];
for (let i = 1; i <= ASSIGNMENT_COUNT; i++) {
  const status = Math.random() < 0.6 ? "OPEN" : "COMPLETED";
  assignments.push({
    id: `as_${String(i).padStart(3, "0")}`,
    label: `TX-${100 + i}`,
    status,
    // Both back-filled below, once shipments exist and their links are
    // settled - neither is meaningful to invent up front.
    clients: [],
    shipment_count: 0,
  });
}
const openAssignments = assignments.filter((a) => a.status === "OPEN");

const shipments = [];

for (let i = 1; i <= SHIPMENT_COUNT; i++) {
  const arrival = new Date(baseDate);
  arrival.setDate(arrival.getDate() - Math.floor(Math.random() * 10));
  const eta = new Date(arrival);
  eta.setHours(eta.getHours() + Math.floor(Math.random() * 48));
  const status = statusList[i % statusList.length];

  // OPEN shipments have no assignment yet. IN_TRANSIT only draws from OPEN
  // assignments (an active route). DELIVERED can draw from either - the
  // assignment itself may or may not have wrapped up since.
  let assignment_id = null;
  if (status === "IN_TRANSIT" && openAssignments.length > 0) {
    assignment_id =
      openAssignments[Math.floor(Math.random() * openAssignments.length)].id;
  } else if (status === "DELIVERED" && assignments.length > 0) {
    assignment_id =
      assignments[Math.floor(Math.random() * assignments.length)].id;
  }

  shipments.push({
    id: `shp_${String(i).padStart(3, "0")}`,
    client_name: clients[i % clients.length],
    label: `${warehouses[i % warehouses.length]}-581-2505${20 + (i % 10)}-${i}`,
    status,
    arrival_date: arrival.toISOString(),
    delivery_by_date: new Date(arrival.getTime() + 2 * 86400000).toISOString(),
    eta: eta.toISOString(),
    warehouse_id: "581",
    assignment_id,
    lat: Math.random() * (maxLat - minLat) + minLat,
    lng: Math.random() * (maxLng - minLng) + minLng,
  });
}

// Now that every shipment's assignment_id is settled, back-fill the real
// per-assignment shipment_count and clients instead of leaving them
// fabricated. `clients` is the set of clients that actually have shipments on
// the route - the spec calls it "a list of associated clients", i.e. a record
// of who's on it, not a whitelist of who may join. Deriving it keeps the
// sample data self-consistent with that reading.
const countsByAssignment = {};
for (const shipment of shipments) {
  if (!shipment.assignment_id) continue;
  countsByAssignment[shipment.assignment_id] =
    (countsByAssignment[shipment.assignment_id] ?? 0) + 1;
}
const clientsByAssignment = {};
for (const shipment of shipments) {
  if (!shipment.assignment_id) continue;
  (clientsByAssignment[shipment.assignment_id] ??= new Set()).add(
    shipment.client_name,
  );
}
for (const assignment of assignments) {
  assignment.shipment_count = countsByAssignment[assignment.id] ?? 0;
  assignment.clients = [...(clientsByAssignment[assignment.id] ?? [])];
}

const result = { statuses, assignments, shipments };
fs.writeFileSync("shipments.json", JSON.stringify(result, null, 2));
console.log("shipment data generated");
