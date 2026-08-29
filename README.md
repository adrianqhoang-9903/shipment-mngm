# Shipment Management UI

A two-panel shipment management tool: a paginated, searchable, status-filtered list
on the left; a detail / edit panel on the right. Built for the Jitsu frontend
exercise (Core + Stretch).

## Running locally

### Prerequisites

- Node 20.19+ or 22.12+ (required by Vite 8)
- npm

### Install

```bash
npm install
```

### Run

Two processes, in separate terminals:

```bash
npx json-server shipments.json   # mock API on http://localhost:3000
```

```bash
npm run dev                      # app on http://localhost:5173
```

`shipments.json` is committed, so the mock API has data immediately — you don't need
to run the generator. To point the app at a different API URL, set
`VITE_API_BASE_URL`.

> The exercise PDF shows `json-server --watch shipments.json --port 3001`. This
> project pins json-server v1, whose CLI dropped `--watch` (watching is the default)
> and serves on port 3000 — which is the app's default API URL.

To regenerate the sample data (random each run — counts, coordinates, and assignment
links all change):

```bash
node scripts/generate-data.cjs
```

### Other scripts

- `npm run build` — typecheck + production build
- `npm run lint` — ESLint
- `npm test` — Vitest

## Tech stack

- **React 19 + TypeScript + Vite**, with the **React Compiler** babel plugin handling
  memoization (hence almost no manual `useMemo` / `useCallback`).
- **react-router-dom** — routing and URL-driven selection.
- **axios** — one shared instance with a request timeout and a response
  interceptor that normalizes timeout, 404, and 5xx errors into one friendly
  `Error` each.
- **react-leaflet / Leaflet** — the detail-panel map.
- **lodash `debounce`** — the search input.
- **CSS Modules** — no UI component library.
- **No data-fetching library** and **no form library** — both hand-rolled; see
  Assumptions.

## Architecture

```
lib/http  →  services/*  →  hooks  →  container components  →  FormFields/* (presentational)
```

- `ShipmentExplorer` owns the list query state (`useShipments`), the create-dialog
  flag, and reads the selected shipment id from the route. `ShipmentList` and
  `ShipmentDetails` are handed everything they need as props.
- `ShipmentDetails` fetches the selected shipment by id independently — it never
  reads a row out of the loaded list page, so list and detail stay decoupled (the
  list query could later be trimmed to fewer fields without breaking the detail
  view).
- `useForm<T>` is a minimal values / dirty / submit container shared by the edit and
  create forms.
- Layout/theme tokens live in `index.css`; every other component owns its own CSS
  module. There's no app-level stylesheet beyond that.

## Features

**Core**

- Two-panel list / detail layout
- List rows: client, label, arrival date; click to open the detail panel
- Status filter + debounced search on label / client name
- Server-side pagination (25 per page) — no client-side filtering, sized for the
  "100k+ shipments" requirement
- Detail panel shows every spec'd field; edits `delivery_by_date`, `lat`, `lng`;
  saves via `PUT`

**Stretch**

- Status transitions with valid-target enforcement and an assignment picker for
  `OPEN → IN_TRANSIT`
- Leaflet map with the shipment's location pin
- Create (modal dialog) and delete (detail panel, `confirm()`-guarded)

## Assumptions & trade-offs

Where the spec is ambiguous, a reasonable assumption was made and is recorded here.

### Data & domain

- **Built for Core and Stretch; shaped so Extra Credit is additive, not a rewrite.**
  Extra Credit isn't implemented — guessing at requirements no one asked for is
  how you end up with abstractions that fit an imagined problem instead of a real
  one. But the spec does describe that tier concretely, so where a decision had two
  reasonable answers and one of them extended more cleanly, that's the one taken:
  generic where the type genuinely varies, entity-agnostic where the component
  genuinely doesn't care, and nothing built speculatively on top of that. What that
  actually amounted to is listed under **Extra Credit seams** below.
- **"Grouped by status" is read as a single-status filter.** The spec doesn't
  prescribe a UI. Filtering to one status at a time (a dropdown) keeps each view to
  one paginated query; three columns or a merged list would each need their own
  pagination.
- **Selection lives in the URL** (`/shipments/:id`), not component state — shareable,
  survives refresh, and is the natural key for the detail fetch. An unmatched path
  redirects to `/shipments` rather than rendering a dedicated 404 page: with only one
  real section, a typo'd or stale link almost certainly meant the list, and there's
  nowhere else a 404 could usefully send someone.
- **The sample data has no assignments** and the generator never sets
  `assignment_id`. `scripts/generate-data.cjs` was extended to create ~40
  assignments and link realistic `assignment_id`s onto `IN_TRANSIT` / `DELIVERED`
  shipments, so the `OPEN → IN_TRANSIT` flow has something real to pick.
- **`GET /statuses` is not used** even though it's spec'd. It returns an unlabeled
  1:1 mirror of the `ShipmentStatus` enum — no labels, no transition rules — all of
  which the client hardcodes anyway (`STATUS_LABELS`, the transition table).
  `ShipmentFilters` iterates `Object.keys(STATUS_LABELS)` directly. In a real system
  the transition rules belong server-side (ideally per-resource, e.g.
  `shipment.allowed_transitions`), with the client keeping a mirror for instant
  feedback.
  - **Two business rules narrow the assignment picker, neither of them spec'd.** It
  offers only `OPEN` assignments (a `COMPLETED` route has already finished) whose
  `clients` include this shipment's `client_name` (an assignment serves a specific
  client set). The client match is filtered in memory — json-server's `contains` is
  string substring matching, not array membership — and the list is small and
  fetched whole anyway. It's fetched only when a shipment is actually moved toward
  `IN_TRANSIT`, and re-fetched on each such transition rather than cached, since an
  assignment could close in between.


### Dates

- **`delivery_by_date` is treated as a day-granular deadline.** It's stored as a
  full ISO datetime, but the spec frames it as a deadline and provides a separate
  `eta` for the estimated time. It's edited as a date; on save the time is
  normalized to `T00:00:00.000Z`, so an existing record's original time-of-day is
  lost on the first edit. `eta` is never shown or edited.
- **`delivery_by_date` must be on or after `arrival_date`** — enforced with a
  dynamic `min` on the date input; the same day is allowed.

### Forms & validation

- **Hand-rolled form state, no Formik / React Hook Form.** The editable surface is
  small (5 fields in Edit, 7 in Create) and every decision needs to be explainable
  in the follow-up. `useForm` holds `values`, `isDirty`, and a `handleSubmit`
  wrapper.
- **`lat` / `lng` are `type="text"` + `inputMode="decimal"`, not `type="number"`.**
  A native number input's `.value` getter collapses an unparseable in-progress
  keystroke (a lone `-`, a trailing `.`) to `""` before any JS runs; combined with
  `Number("") === 0` that would silently rewrite the field to `0` mid-type — common
  when entering a negative coordinate (verified in a browser). Instead the draft
  stores the raw string, a range check feeds `setCustomValidity()` in place of
  native `min` / `max`, and the string is parsed to a number only when building the
  request body. A form library wouldn't have helped — `valueAsNumber` /
  `setValueAs` sit on top of the same broken `.value`.
- **Validity is the browser's job; Save and Create are never pre-disabled for it.**
  The buttons disable only while a request is in flight. The browser's pre-submit
  constraint validation blocks a bad save using the per-field `setCustomValidity()`
  messages, so no form-level `isValid` is mirrored into JS.

### List ↔ detail consistency

- **Only a status change touches the list; no other save updates it at all.** A
  status change can move a row out of the current single-status filter and shifts
  `totalItems` / `totalPages`, so it re-fetches. A delete re-fetches for the same
  reason, then navigates back to `/shipments`. Everything else editable
  (`delivery_by_date`, `lat`, `lng`, `assignment_id`) is absent from the row, so
  there is nothing for the list to re-render.
- **This went through two rounds of removal, both for the same reason.** First an
  optimistic patch-and-rollback (patched on submit, reverted on failure), then the
  post-save `patchShipment` that replaced it — each was keeping the list's copy of a
  shipment in sync with fields the list has never displayed. The detail panel fetches
  by id independently, so nothing else read that patched copy either. The strongest
  case for keeping it was Extra Credit, whose panel-2 lists an assignment's shipments
  beside a panel-3 detail, with a map plotting every shipment's coordinates — the one
  place an edited `lat` / `lng` would show up in a sibling view. It still doesn't
  apply: that list is an assignment's shipments, a different query in a different
  hook, so it would need its own sync path and would never have called this one.
  Keeping a function for a future feature that wouldn't use it is worse than the
  stale-row risk of deleting it.
- **The current page is clamped if it stops existing.** After any result-shrinking
  action, the list fetch detects `page > totalPages` in its response and re-requests
  the new last page.

### Create & delete

- **Create is a native `<dialog>`, not a reworked detail panel.** The detail panel's
  markup is shaped around Edit concerns (status / assignment machinery, read-only
  server fields). The dialog is conditionally mounted, so each open starts from a
  fresh blank form.
- **Create collects 7 of the ~10 fields** (`label`, `client_name`, `warehouse_id`,
  `arrival_date`, `delivery_by_date`, `lat`, `lng`). `status` (`OPEN`) and
  `assignment_id` (`null`) are true-by-construction, not fields. `eta` is defaulted
  to `delivery_by_date` — the generator sets it to `arrival + random hours` with no
  reproducible rule, and it's never surfaced here. The two dates default to today;
  everything else starts blank. `warehouse_id` in particular isn't pre-filled to
  `"581"` — every sample sharing that value is a generator artifact, not a fact
  about where new shipments arrive.
- **POST server-generates the `id`** — new shipments don't get the `shp_0xx` shape.
- **Delete lives on the detail panel, behind `window.confirm()`** — a list row shows
  too little context to delete safely from.

### UI

- **The detail panel is the only scroll container; the form inside it isn't.** The
  form and the panel briefly shared a CSS class, so the form inherited `flex: 1` +
  `overflow-y: auto` and became a nested scroll region — competing for height with
  the map's fixed 400px and pushing Save/Delete below a scrollbar the user had to
  find. The form now has its own class with no flex/overflow rules, the map declares
  `flex-shrink: 0` so a taller sibling can't squeeze it, and the whole column scrolls
  as one unit. The form stays above the map deliberately: reversing them would put
  Save/Delete ~400px lower and clip them again on a 900px-tall viewport.
- **The map shows the last saved coordinates, not in-progress edits** — editing
  `lat` / `lng` doesn't move the pin until the save lands. Either reading is
  defensible; this keeps the map a view of persisted state.
- **Save / Create / Delete outcomes are confirmed with a small toast**, `Toast`, built
  on the native Popover API (`popover="manual"`, `showPopover()`/`hidePopover()`),
  rendered in the top layer so Create's confirmation is visible after its dialog
  closes. It's `"manual"` rather than `"auto"`, since a timed toast shouldn't
  light-dismiss on an unrelated click.
- **The toast is triggered by a plain `notify(text, variant?)` function, not a prop
  or Context.** It began as `ShipmentExplorer` state passed down as a prop, but
  `EditShipmentForm` is `key`'d by shipment id and unmounts on every shipment
  switch: a save or delete that resolved after the user had navigated away was
  calling `setState` on a dead component, so the outcome vanished silently — no
  confirmation and no error. `src/components/Toast/toastStore.ts` is a ~20-line
  external store (`useSyncExternalStore`, the primitive Zustand and friends use to
  hook non-React state into React); `notify()` is a module function, so it still
  works from a component that's already gone. Exactly one component (`Toast`,
  mounted once in `App`) subscribes. Prop-drilling would have worked but made
  `ShipmentDetails` forward something it never uses, and wouldn't reach a future
  Extra Credit route tree that shares no ancestor with this one.
- **Timeouts, 404s, and 5xxs are normalized in one place** — the `httpClient`
  response interceptor turns each into a readable `Error`, so no call site needed
  changing. A network failure with no response at all (server not running) is left
  as axios's own message.
- **Fetch failures render inline, in the region that failed; action failures toast.**
  A failed assignment-list fetch folds into the picker's own placeholder text, and
  the list and detail panels render their fetch errors in place (the list with a
  Retry). Those describe a region that couldn't load, so they belong in it and
  should persist. Save / create / delete failures are consequences of something the
  user just did, can outlive the component that started them, and go through
  `notify(..., "error")` instead.
- **Fixed light theme** — no dark mode or theme switching.

### Testing

- **No test suite.** Not required at any tier. Vitest is configured; the pure
  business-rule functions (`buildWhere`, `validateNumberInRange`,
  `getStatusDropdownOptions`, `toApiDateTime`) would be the first to cover with more
  time.

### Extra Credit seams

None of these cost anything today; each is a choice made where the extending option
was free.

- **`react-router-dom`, for two routes.** Selection could have been component state
  — it's one panel — but Extra Credit's `/assignments` page needs real routing, and
  its three-panel drill-down is a nested-route problem. Putting selection in the URL
  now means that page is a route to add, not a state model to redesign. It's also
  the right call on its own merits (shareable, refresh-safe), which is why it's here
  and not filed under speculative.
- **`ShipmentDetails` takes `selectedId` as a prop and never calls `useParams`.**
  Extra Credit's panel 3 is the same shipment detail, reached through a different
  URL shape (`/assignments/:assignmentId/shipments/:shipmentId`). Reading the param
  in `ShipmentExplorer` and passing it down keeps the panel reusable under any route
  that supplies an id.
- **`FormFields/` knows nothing about shipments.** `TextField`, `SelectField`, and
  `StaticField` take `name` / `label` / `value` / `onChange` and no domain type, so
  an assignment form is composition, not new components. `useForm<T>` is generic for
  the same reason and is already shared by two forms.
- **The map lives in `components/LocationMap/`, not inside the detail panel**, and
  takes `lat` / `lng` rather than a `Shipment`. Extra Credit's multi-pin,
  polyline-connected map is a props change to one component instead of a second map
  implementation.
- **`Assignment` is fully typed and `services/assignments.ts` already exists.**
  Modelling the whole resource (`status`, `clients`, `shipment_count`) rather than
  the two fields the picker needs cost nothing, and `scripts/generate-data.cjs`
  generates assignments with real back-filled `shipment_count`s — so an assignment
  list page has correct data to render the day it's written.
- **`PaginatedResponse<T>` is generic**, and the pagination envelope's quirks
  (`_where` overriding other params, the clamp behaviour) are solved once in
  `useShipments`. A paginated assignment list reuses the type and the `Pagination`
  component directly.

What was deliberately *not* done: no `useResourceList<T>` abstraction over
`useShipments` with one caller, no assignment components, no routes for pages that
don't exist. Those are cheap to add against real requirements and expensive to
unpick when built against imagined ones.

### With more time

- **A data-fetching library (TanStack Query).** There's now a real amount of
  hand-rolled fetch / abort / loading / error code (`useShipments`, the detail
  fetch, the two assignment fetches) that it would mostly remove, along with the
  assignment re-fetch friction. Declined for now: every line has to be explainable
  live, and swapping it in would touch every fetch site under time pressure.
- **Nested routes.** Selection is already URL-driven, but the routing is two flat
  routes both rendering `ShipmentExplorer`. Nested routes with `<Outlet>` would be
  cleaner and would extend to the Extra Credit assignment page's drill-down.
