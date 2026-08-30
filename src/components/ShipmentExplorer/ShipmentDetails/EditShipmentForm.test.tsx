import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditShipmentForm from "./EditShipmentForm";
import { httpClient } from "../../../lib/http";
import type { Assignment, Shipment } from "../../../types";

vi.mock("../../../lib/http", () => ({
  httpClient: { get: vi.fn(), put: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

const startingShipment: Shipment = {
  id: "shp_42",
  client_name: "Sony",
  label: "SEA-042",
  status: "IN_TRANSIT",
  arrival_date: "2026-08-01T00:00:00.000Z",
  delivery_by_date: "2026-08-10T23:59:59.999Z",
  eta: "2026-08-10T23:59:59.999Z",
  warehouse_id: "581",
  assignment_id: "as_001",
  lat: 10,
  lng: 20,
};

const ASSIGNMENTS: Assignment[] = [
  { id: "as_001", label: "TX-101", status: "OPEN", clients: ["Sony"], shipment_count: 1 },
  { id: "as_002", label: "TX-102", status: "OPEN", clients: ["Sony"], shipment_count: 0 },
];

const Harness = ({ onDeleted }: { onDeleted: () => void }) => {
  const [shipment, setShipment] = useState(startingShipment);
  return (
    <EditShipmentForm
      key={shipment.id}
      shipment={shipment}
      onSaved={setShipment}
      onDeleted={onDeleted}
    />
  );
};

describe("EditShipmentForm - edit through every transition, then delete", () => {
  let assignmentsResponse: Promise<Assignment[]>;

  beforeEach(() => {
    assignmentsResponse = Promise.resolve(ASSIGNMENTS);

    vi.mocked(httpClient.get).mockReset();
    vi.mocked(httpClient.get).mockImplementation(async (url: string) => {
      if (url === "/assignments") return { data: await assignmentsResponse };

      const match = url.match(/^\/assignments\/(.+)$/);
      if (match) {
        const found = ASSIGNMENTS.find((a) => a.id === match[1]);
        if (found) return { data: found };
      }
      throw new Error(`Unhandled GET ${url}`);
    });

    vi.mocked(httpClient.put).mockReset();
    vi.mocked(httpClient.put).mockImplementation(async (_url, body) => ({
      data: body,
    }));

    vi.mocked(httpClient.delete).mockReset();
    vi.mocked(httpClient.delete).mockResolvedValue({ data: undefined });

    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("carries every field through IN_TRANSIT→OPEN→IN_TRANSIT→DELIVERED, blocks an invalid save, then deletes", async () => {
    const user = userEvent.setup();
    const onDeleted = vi.fn();
    render(<Harness onDeleted={onDeleted} />);

    expect(await screen.findByText("TX-101")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toHaveValue("IN_TRANSIT");

    await user.selectOptions(screen.getByLabelText("Status"), "OPEN");
    expect(
      screen.getByText(/Reverting to Open will clear/),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Delivery By"), {
      target: { value: "2026-08-15" },
    });
    fireEvent.change(screen.getByLabelText("Latitude"), {
      target: { value: "12.5" },
    });
    fireEvent.change(screen.getByLabelText("Longitude"), {
      target: { value: "34.5" },
    });

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(httpClient.put).toHaveBeenCalledTimes(1));
    expect(httpClient.put).toHaveBeenNthCalledWith(
      1,
      "/shipments/shp_42",
      expect.objectContaining({
        status: "OPEN",
        assignment_id: null,
        delivery_by_date: "2026-08-15T23:59:59.999Z",
        lat: 12.5,
        lng: 34.5,
      }),
    );

    expect(
      screen.queryByText(/Reverting to Open will clear/),
    ).not.toBeInTheDocument();

    let resolveAssignments!: (value: Assignment[]) => void;
    assignmentsResponse = new Promise((resolve) => {
      resolveAssignments = resolve;
    });

    await user.selectOptions(screen.getByLabelText("Status"), "IN_TRANSIT");

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(httpClient.put).toHaveBeenCalledTimes(1);

    resolveAssignments(ASSIGNMENTS);
    await screen.findByRole("option", { name: /TX-102/ });

    await user.selectOptions(screen.getByLabelText("Assignment"), "as_002");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(httpClient.put).toHaveBeenCalledTimes(2));
    expect(httpClient.put).toHaveBeenNthCalledWith(
      2,
      "/shipments/shp_42",
      expect.objectContaining({ status: "IN_TRANSIT", assignment_id: "as_002" }),
    );

    await user.selectOptions(screen.getByLabelText("Status"), "DELIVERED");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(httpClient.put).toHaveBeenCalledTimes(3));
    expect(httpClient.put).toHaveBeenNthCalledWith(
      3,
      "/shipments/shp_42",
      expect.objectContaining({ status: "DELIVERED", assignment_id: "as_002" }),
    );

    expect(screen.getByLabelText("Status")).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Latitude"), {
      target: { value: "999" },
    });
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(httpClient.put).toHaveBeenCalledTimes(3);

    fireEvent.change(screen.getByLabelText("Latitude"), {
      target: { value: "12.5" },
    });

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(window.confirm).toHaveBeenCalledWith(
      "Delete shipment SEA-042? This cannot be undone.",
    );
    await waitFor(() =>
      expect(httpClient.delete).toHaveBeenCalledWith("/shipments/shp_42"),
    );
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });
});
