# Shipment Management

A two-panel shipment management tool: a paginated, searchable, status-filtered list on the left, and a detail / edit panel on the right.

## Running locally

### Prerequisites

- Node 20.19+ or 22.12+ (required by Vite 8)
- npm

### Install

```bash
npm install
```

### Run

Start the following two processes in separate terminals:

```bash
npx json-server shipments.json   # mock API on http://localhost:3000
```

```bash
npm run dev                      # app on http://localhost:5173
```

`shipments.json` is committed, so the mock API has data immediately - you don't need to run the generator. To point the app at a different API URL, set `VITE_API_BASE_URL`.

To regenerate the sample data (optionally with a row count):

```bash
node scripts/generate-data.cjs          # 1,000 shipments (default)
node scripts/generate-data.cjs 100000   # stress the list
```

### Other scripts

- `npm run build` — typecheck + production build
- `npm run lint` — ESLint
- `npm test` — Vitest

## Tech stack

- **React 19 + TypeScript + Vite**, with **React Compiler** handling memoization (hence almost no manual `useMemo` / `useCallback`).
- **react-router-dom** — routing and URL-driven selection.
- **axios** — one shared instance with a request timeout and a response interceptor that normalizes timeout, 404, and 5xx errors into one friendly `Error` each.
- **react-leaflet / Leaflet** — the detail-panel map.
- **lodash `debounce`** — the search input.
- **CSS Modules** — no UI component library.
- **No data-fetching library** and **no form library**; see Assumptions.

## Architecture

```
lib/http  →  services/*  →  hooks  →  container components  →  FormFields/* (presentational)
```

- `ShipmentExplorer` owns the create-dialog flag (local state) and the selected shipment id (query params); `useShipments` owns the list query, also in the query string. `ShipmentList` and `ShipmentDetails` receive everything they need as props.
- `ShipmentDetails` fetches the selected shipment by id independently — it never reads a row out of the loaded list page, so list and detail stay decoupled.
- `useForm<T>` is a minimal values / dirty / submit container shared by the edit and create forms.
- Domain rules (transitions, assignment resolution, the `_where` builder) live in `src/utils/`, not in components.
- Layout / theme tokens live in `index.css`; every other component owns its own CSS module.

## Features

**Core**

- Two-panel list / detail layout
- List rows: client, label, arrival date; click to open the detail panel
- Status filter + debounced search on label / client name
- Server-side pagination (50 per page) — no client-side filtering, sized for the "100k+ shipments" requirement
- Detail panel shows every spec'd field; edits `delivery_by_date`, `lat`, `lng`; saves via `PUT`

**Stretch**

- Status transitions with valid-target enforcement and an assignment picker for `OPEN → IN_TRANSIT`
- Leaflet map with the shipment's location pin
- Create (modal dialog) and delete (detail panel, `confirm()`-guarded)

## Performance

Production build, served locally, against the committed 1,000-shipment fixture:

|                    |                                                         |
| ------------------ | ------------------------------------------------------- |
| LCP                | **~650 ms** with shipment selected, **~360 ms** without |
| Bundle, total      | **488 KB** / 156 KB gzipped                             |
| — main chunk       | 313 KB / 103 KB gz                                      |
| — map chunk (lazy) | 153 KB / 45 KB gz                                       |
| — CSS              | 22 KB / 8 KB gz                                         |

The map is nearly a third of the bundle and is `React.lazy`'d. Paging, filtering, and search are all `_where` clauses handled server-side, so the client holds one page whether the collection is 1k rows or the 100k+ the brief describes (`node scripts/generate-data.cjs 100000` to check).

## Assumptions

Where the spec is ambiguous, a reasonable call was made and recorded here.

- **"Grouped by status" is a single-status filter** — a dropdown, not three columns or a merged list, so each view is one paginated query.
- **Dates are edited at day granularity**.
- **The assignment picker offers only `OPEN` assignments**. Assumption: `COMPLETED` assignments means that the assignment has been done (i.e. delivery finished for all related routes)
- **An assignment's `clients` describes who is on the route, not who may join it.** The spec calls it "a list of associated clients" — descriptive, not restrictive — so it's a projection of the shipments pointing at that assignment, alongside `shipment_count`. The picker doesn't filter on it.
- **Create collects 7 of ~10 fields.** `status` is defaulted to `OPEN` and `assignment_id` to `null`, while `eta` defaults to `delivery_by_date`.
- **The map shows the last saved coordinates, not in-progress edits.**
- **The sample data was extended, to account for assignments.**

## Trade-offs and decisions

- **No Extra Credit.** Core and Stretch are built. Where a design choice had two sound answers and one extended more cleanly toward the assignment page, that one was taken (see **Extra Credit seams**).
- **All view states in one query string, on one route.** `/shipments?selected=…&status=…&q=…&page=…`. Considering that all the states can be stored on a URL, there's no need for a Context or a global state management store. This also tracks for the Assignment page. `status` and `page` are always written, even at their defaults (`?status=OPEN&page=1`, not a bare `/shipments`) — you're always looking at exactly one status and one page, so the URL should say which. `q` is the exception: an empty search means nothing's applied, so the key is dropped rather than written as `q=`.
- **`GET /statuses` unused despite being spec'd.** It returns an unlabeled mirror of the `ShipmentStatus` enum — which I am hard-coding on client already (the transition rules require it to be hardcoded).
- **No data-fetching library (TanStack Query et al.), and no response caching.** A query library's core value is a shared cache that many views read from and that gets reconciled after each mutation. This app doesn't have that shape, and the caching itself would mostly be wrong here:
  - **Nothing shares a cache.** The detail panel fetches by id and never reads from the list, so there is no list↔detail copy to keep in sync.
  - **The list and picker must stay live.** Given the shape of the spec and the domain (a continuous stream of shipments might be created throughout the day), data should not be stale. Shipments list and assignment list are fetched fresh every time.
  - **Serving a stale detail would be a lost-update risk.** The edit form seeds from the detail fetch; a fresh read each time is what guarantees you can't Save over a concurrent edit with an old base.
  - **The rest is already handled or small.** Cancellation is an `AbortController` per effect; the four fetch sites don't overlap, so there's nothing to dedup; the loading / error scaffolding is tiny.
- **Hand-rolled form state — no Formik, React Hook Form, or Zod.**
  - **Forms are small.** Five editable fields in Edit, seven in Create. `useForm` is `values` / `isDirty` / `handleSubmit` in ~40 lines.
  - **The browser validates inline and on submit.** Native constraint validation plus per-field `setCustomValidity()` messages block a bad submit. Save / Create disables only while a request is in flight.
  - `lat`/`lng` are handled using `text` fields and parsed afterwards, as `number` fields would parse value mid-input (e.g. (`-`, `.`) as `""`, and `Number("")` as `0`), causing issues. The same coercion-to-`0` risk exists for whitespace (`Number(" ")` is also `0`, not `NaN`) and `required` alone doesn't catch it (it only rejects `""`) — `validateNumberInRange` treats a non-empty-but-blank value as invalid rather than deferring to `required`.
  - The `OPEN → IN_TRANSIT` assignment picker stays enabled (not `disabled`) while its options are loading — a `disabled` control is exempt from constraint validation entirely, so disabling it during the fetch would let a same-instant Save through with `required` silently unenforced and no assignment ever chosen.
- **No list-patching.** No editable fields are ever shown on the shipments list, therefore I decided to forgo patching. Only status change / delete would refetch the list (because these actions alter the list itself instead of modifying a shipment). If the list shows editable fields like Delivery Date, however, optimistic patching should be implemented.
- **`clients` / `shipment_count` are read, never written.** They're server-derived aggregates over an assignment's shipments (see Assumptions).

## Testing

- **43 unit tests on the pure logic**: the `_where` query builder, URL-param read / write / merge, coordinate-range validation, status-transition rules. These are the spots where a wrong answer is silent (zero rows that read as "no results", a filter quietly dropped, whitespace saved as coordinate `0`), not a visible break.
- **3 component tests, RTL + a mocked `httpClient`:**
  - **List**: search (debounced), status filter, pagination, and selecting a row — against `ShipmentExplorer` end to end.
  - **Edit**: one shipment driven through `IN_TRANSIT → OPEN → IN_TRANSIT → DELIVERED`, editing `delivery_by_date` / `lat` / `lng` alongside the status changes, then deleted. Asserts the exact `PUT` body at each step (assignment cleared on `unassigning`, set on `assigning`, carried forward on a plain status change), and that Save is a no-op both while the assignment picker is still loading and with an out-of-range coordinate — the two validation-bypass fixes from this session, pinned so they can't regress silently.
  - **Create**: fills the dialog, submits, and confirms the app navigates to the new shipment's own detail view.

## Extra Credit seams 

Extra Credit was not implemented, but these keep it simple enough if I do.

- **`react-router-dom` for one route.** View state could have been component state, but Extra Credit's `/assignments` needs real routing — putting state in the URL now makes that page a route to add, not a model to redesign.
- **`ShipmentDetails` takes `selectedId` as a prop, never reads the URL.** EC's panel 3 is this same detail, reached from an assignment. Reading the id in `ShipmentExplorer` and passing it down — with `clearSelection` for the post-delete case — keeps the panel reusable wherever an id comes from.
- **`FormFields/` knows nothing about shipments.** `TextField` / `SelectField` / `StaticField` take `name` / `label` / `value` / `onChange` and no domain type, so an assignment form is composition, not new components. `useForm<T>` is generic for the same reason.
- **The map is in `components/LocationMap/`, taking `lat` / `lng`, not a `Shipment`.** EC's multi-pin, polyline-connected map is a props change, not a second implementation.
- **`PaginatedResponse<T>` is generic**. A paginated assignment list reuses the type and the `Pagination` component directly.

## As the feature set grows

In a longer-lived or larger app, these become worth doing:

- **Optimistic list patches:** first thing to add when a list row starts showing an editable field (panel 2's shipments in the assignment page, a status badge on the main list) or the API gets slow enough that refetch-on-save feels laggy.
- **Server-state management library (e.g. `TanStack Query`):** adds server-state cache, mutations, and observations, and standardizes behavior among API queries.
- **Component and integration tests:** Tests user-flows and integrations with other features.
- **Form and validation library (e.g.RHF + Zod):** past ~10 create fields, or once cross-field rules multiply, or when a validation schema needs sharing with the backend. At 5–7 fields with native validation it's overhead.
- **Server-owned rules:** transitions and the assignment-required rule sit in a client table only because the mock backend has no validation layer. In production, they should be server-enforced, with the client holding a copy for instant feedback. Same for `clients` / `shipment_count`. Same for uniqueness — nothing stops two shipments sharing a label and client today; that's a server constraint, and enforcing it on the client would mean pulling the whole collection, which the pagination model exists to avoid.
- **HTTP caching:** a real backend sending `ETag` / `Last-Modified` lets single-resource GETs come back as `304 Not Modified` when nothing's changed.

## Improvements

Some workarounds / imperfections / missing features that could have been improved given better judgement / ample time:

- **Data-router mode (`createBrowserRouter` + `loader`s / `action`s).** Currently `setSearchParams` needs to be put in a `ref` because it is re-created every time navigation happens. A route `loader` ties a fetch to a navigation and supersedes a stale one for free.
- Keyboard handlers for the list (e.g. up/down for navigation between rows, enter to select shipment).
- Focus on the first error field on Save / Create