import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ShipmentExplorer from "./index";
import { httpClient } from "../../lib/http";
import type { PaginatedResponse, Shipment } from "../../types";

vi.mock("../../lib/http", () => ({
  httpClient: { get: vi.fn(), put: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

// The map needs browser APIs jsdom doesn't implement (ResizeObserver,
// real layout) and isn't what either test is about.
vi.mock("../LocationMap/ShipmentLocationMap", () => ({
  default: () => null,
}));

const shipment = (overrides: Partial<Shipment>): Shipment => ({
  id: "shp_x",
  client_name: "Sony",
  label: "LAX-000",
  status: "OPEN",
  arrival_date: "2026-08-01T00:00:00.000Z",
  delivery_by_date: "2026-08-10T23:59:59.999Z",
  eta: "2026-08-10T23:59:59.999Z",
  warehouse_id: "581",
  assignment_id: null,
  lat: 10,
  lng: 20,
  ...overrides,
});

const OPEN_SHIPMENTS = [
  shipment({ id: "shp_1", client_name: "Sony", label: "LAX-001" }),
  shipment({ id: "shp_2", client_name: "DHL", label: "LAX-002" }),
  shipment({ id: "shp_3", client_name: "Oceanic", label: "LAX-003" }),
];
const IN_TRANSIT_SHIPMENTS = [
  shipment({
    id: "shp_9",
    client_name: "CargoTrans",
    label: "SEA-009",
    status: "IN_TRANSIT",
  }),
];

const PAGE_SIZE = 2;

const paginate = <T,>(items: T[], page: number): PaginatedResponse<T> => {
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  return {
    first: 1,
    prev: page > 1 ? page - 1 : null,
    next: page < pages ? page + 1 : null,
    last: pages,
    pages,
    items: items.length,
    data: items.slice(start, start + PAGE_SIZE),
  };
};

const byStatus = (status: string) =>
  status === "OPEN"
    ? OPEN_SHIPMENTS
    : status === "IN_TRANSIT"
      ? IN_TRANSIT_SHIPMENTS
      : [];

const createdShipments: Shipment[] = [];

const mockListAndDetailGets = () => {
  createdShipments.length = 0;
  vi.mocked(httpClient.get).mockReset();
  vi.mocked(httpClient.get).mockImplementation(async (url, config) => {
    const params = config?.params as Record<string, unknown> | undefined;

    if (url === "/shipments") {
      const where = JSON.parse(String(params?._where)) as {
        status: { eq: string };
        or?: { client_name: { contains: string } }[];
      };
      let pool = byStatus(where.status.eq);
      const term = where.or?.[0]?.client_name.contains.toLowerCase();
      if (term) {
        pool = pool.filter(
          (s) =>
            s.client_name.toLowerCase().includes(term) ||
            s.label.toLowerCase().includes(term),
        );
      }
      return { data: paginate(pool, Number(params?._page)) };
    }

    const match = url.match(/^\/shipments\/(.+)$/);
    if (match) {
      const found = [
        ...OPEN_SHIPMENTS,
        ...IN_TRANSIT_SHIPMENTS,
        ...createdShipments,
      ].find((s) => s.id === match[1]);
      if (found) return { data: found };
    }

    throw new Error(`Unhandled GET ${url}`);
  });
};

const renderExplorer = (initialPath = "/shipments?status=OPEN&page=1") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/shipments" element={<ShipmentExplorer />} />
      </Routes>
    </MemoryRouter>,
  );

describe("ShipmentExplorer", () => {
  beforeEach(() => {
    mockListAndDetailGets();
  });

  it("supports searching, changing status, paging, and selecting a shipment", async () => {
    const user = userEvent.setup();
    renderExplorer();

    expect(await screen.findByText("LAX-001")).toBeInTheDocument();
    expect(screen.getByText("LAX-002")).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Search by client or label"),
      "DHL",
    );
    await waitFor(() =>
      expect(screen.queryByText("LAX-001")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("LAX-002")).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("Search by client or label"));
    await waitFor(() =>
      expect(screen.getByText("LAX-001")).toBeInTheDocument(),
    );

    await user.selectOptions(screen.getByLabelText("Status"), "In transit");
    expect(await screen.findByText("SEA-009")).toBeInTheDocument();
    expect(screen.queryByText("LAX-001")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Status"), "Open");
    await screen.findByText("LAX-001");

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByText("LAX-003")).toBeInTheDocument();
    expect(screen.queryByText("LAX-001")).not.toBeInTheDocument();

    await user.click(screen.getByText("LAX-003"));
    await waitFor(() =>
      expect(httpClient.get).toHaveBeenCalledWith(
        "/shipments/shp_3",
        expect.anything(),
      ),
    );
    expect(
      await screen.findByRole("heading", { name: "LAX-003" }),
    ).toBeInTheDocument();
  });

  it("creates a shipment and navigates to it", async () => {
    const user = userEvent.setup();

    HTMLDialogElement.prototype.showModal = vi.fn(function (
      this: HTMLDialogElement,
    ) {
      this.setAttribute("open", "");
    });
    HTMLDialogElement.prototype.close = vi.fn(function (
      this: HTMLDialogElement,
    ) {
      this.removeAttribute("open");
    });

    const created = shipment({
      id: "shp_new",
      client_name: "Logix",
      label: "JFK-NEW",
    });
    vi.mocked(httpClient.post).mockResolvedValue({ data: created });
    createdShipments.push(created);

    renderExplorer();
    await screen.findByText("LAX-001");

    await user.click(screen.getByRole("button", { name: "Create" }));
    const dialog = await screen.findByRole("dialog");

    await user.type(within(dialog).getByLabelText("Label"), "JFK-NEW");
    await user.type(within(dialog).getByLabelText("Client"), "Logix");
    await user.type(within(dialog).getByLabelText("Warehouse ID"), "581");
    await user.type(within(dialog).getByLabelText("Latitude"), "12.5");
    await user.type(within(dialog).getByLabelText("Longitude"), "34.5");

    await user.click(within(dialog).getByRole("button", { name: "Create" }));

    await waitFor(() =>
      expect(httpClient.post).toHaveBeenCalledWith(
        "/shipments",
        expect.objectContaining({ client_name: "Logix", label: "JFK-NEW" }),
      ),
    );

    // The dialog closes and the app navigates to the new shipment's detail.
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(
      await screen.findByRole("heading", { name: "JFK-NEW" }),
    ).toBeInTheDocument();
  });
});
