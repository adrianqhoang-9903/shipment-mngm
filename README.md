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

- **"Grouped by status" is read as a single-status filter.** The spec doesn't
  prescribe a UI. Filtering to one status at a time (a dropdown) keeps each view to
  one paginated query; three columns or a merged list would each need their own
  pagination.
- **Selection lives in the URL** (`/shipments/:id`), not component state — shareable,
  survives refresh, and is the natural key for the detail fetch.
- **Search matches `label` OR `client_name`** by case-insensitive substring.
  json-server v1 removed the `q=` param, so the query is built as a `_where` clause
  using `contains`; with no search term it carries just the status filter.
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
  small (3 fields in Edit, 7 in Create) and every decision needs to be explainable
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
  messages. No form-level `isValid` is mirrored into JS — an earlier attempt to do
  that for a disabled-button effect read stale (`checkValidity()` inside the same
  event that flips a field's `required` sees the pre-commit DOM) and was removed
  rather than patched.
- **A pristine (unchanged) Edit save is a guarded no-op** — the submit handler
  returns early, skipping a redundant `PUT`.
- **`:user-invalid`, not `:invalid`, for the red-border style.** `:invalid` flags an
  empty required field on mount — fine for Edit (fields start populated), a wall of
  red for Create (fields start blank). `:user-invalid` matches the same validity but
  only after the user has changed-and-blurred a field or attempted a submit (which
  counts as interaction for every field), so a pristine form shows no red and a
  blocked submit lights up every wrong field at once.
- **The native validation bubble is suppressed** — `TextField` / `SelectField` call
  `preventDefault()` on the `invalid` event and render `validationMessage` in their
  own `<span>` for consistent styling. Constraint validation and the submit block
  are unaffected; the browser's auto-focus of the first invalid field is likely
  suppressed as a side effect of the same cancel.

### Status transitions & assignments

- **The status dropdown lists only the current status plus its valid targets**
  (`OPEN → IN_TRANSIT`, `IN_TRANSIT → DELIVERED`, `IN_TRANSIT → OPEN`). `DELIVERED`
  is terminal — its dropdown is a single disabled option. `IN_TRANSIT → OPEN` clears
  `assignment_id` on save, with an inline note so it isn't a silent loss.
- **`OPEN → IN_TRANSIT` requires an assignment.** Two inferred rules, not spec'd: the
  picker lists only `OPEN` assignments (a `COMPLETED` route has finished), and only
  those whose `clients` include the shipment's `client_name` (an assignment serves a
  specific client set). The client filter runs in memory — json-server's `contains`
  does string substring matching, not array membership (verified) — and the
  assignments list is small and fetched whole anyway.
- **Assignment options are fetched lazily and re-fetched each time.** An effect keyed
  on the `OPEN → IN_TRANSIT` transition fires the request (not on every OPEN detail
  view), aborting if the user navigates away first. Toggling the transition off and
  on re-fetches rather than caching — rare in practice, and arguably more correct
  since an assignment could close between toggles.
- **The Assignment field is one slot.** `IN_TRANSIT` / `DELIVERED`: plain read-only
  text (nothing in this app reassigns a non-OPEN shipment). `OPEN`: a single
  `<select>`, enabled and `required` only while transitioning to `IN_TRANSIT`,
  rather than a separate conditionally-shown "Assign to" field. It shows the
  assignment's label (resolved via `GET /assignments/:id`), not the raw `as_0xx` id.
- **`AssignmentField` is its own component** (state + fetch + JSX), taking
  `{ shipment, status, assignmentId, onAssignmentIdChange }`. The cross-field
  coupling is kept explicit rather than hidden: `status` is passed in as a prop, and
  clearing `assignment_id` when the Status dropdown leaves `IN_TRANSIT` lives in the
  parent form's `handleStatusChange`, not the field.

### List ↔ detail consistency

- **No optimistic list update.** The list's copy of a shipment is patched once,
  after a save succeeds, with the server's response. An earlier
  optimistic-patch-and-rollback was removed — none of the editable fields
  (`delivery_by_date`, `lat`, `lng`) appear in the list row, so it was patching
  something nothing displayed.
- **A status-changing save re-fetches the whole list; other saves patch in place.**
  A status change can move a row out of the current filter and changes `totalItems`
  / `totalPages` — a local patch handles neither. Field edits can't move a row
  between groups.
- **A delete re-fetches the list** for the same reason, then navigates back to
  `/shipments`.
- **The current page is clamped if it stops existing.** After any result-shrinking
  action, the list fetch detects `page > totalPages` in its response and re-requests
  the new last page.

### Create & delete

- **Create is a native `<dialog>`, not a reworked detail panel.** The detail panel's
  markup is shaped around Edit concerns (status / assignment machinery, read-only
  server fields). The dialog is conditionally mounted, so each open starts from a
  fresh blank form; `showModal()` is called imperatively (native `<dialog>` gives
  focus trapping, Escape-to-close, and backdrop rendering for free).
- **Create collects 7 of the ~10 fields** (`label`, `client_name`, `warehouse_id`,
  `arrival_date`, `delivery_by_date`, `lat`, `lng`). `status` (`OPEN`) and
  `assignment_id` (`null`) are true-by-construction, not fields. `eta` is defaulted
  to `delivery_by_date` — the generator sets it to `arrival + random hours` with no
  reproducible rule, and it's never surfaced here.
- **`arrival_date` and `delivery_by_date` default to today; everything else starts
  blank.** `warehouse_id`, `label`, and `client_name` are plain required text with
  no pre-fill: `warehouse_id: "581"` and the `LAX-581-250521-6` label shape are
  generator artifacts, not spec formats (the domain implies multiple warehouses). A
  client dropdown (like the assignment picker) would beat free text, but there's no
  client collection to query.
- **POST server-generates the `id`** — new shipments don't get the `shp_0xx` shape.
- **Delete lives on the detail panel, behind `window.confirm()`.** Not a per-row
  action — a row shows too little context to delete safely from, and deleting the
  shipment you're currently viewing would strand the panel (from the detail view,
  the app navigates away itself).
- **Creating a shipment re-fetches the list only when the filter is `OPEN`** — a new
  shipment is always `OPEN`, so it can't appear in an `IN_TRANSIT` / `DELIVERED`
  view.

### UI

- **The map shows the last saved coordinates, not in-progress edits** — editing
  `lat` / `lng` doesn't move the pin until the save lands. Either reading is
  defensible; this keeps the map a view of persisted state.
- **Save / Create success is confirmed with a small toast** built on the native
  Popover API (`popover="manual"`, `showPopover()`/`hidePopover()`), rendered in the
  top layer so Create's confirmation is visible after its dialog closes. `"manual"`,
  not `"auto"` — `"auto"` light-dismisses on any outside click, including the very
  Save button that re-triggers it, which closed the toast via the browser before the
  next `setSuccessMessage` call could reopen it (same string in, no state change, no
  re-run). It's a local presentational component, not app-wide toast infrastructure.
- **404 and 5xx responses are normalized centrally**, in the same `httpClient`
  response interceptor that already turns a timed-out request into a friendly
  `Error`. Every call site already does `err instanceof Error ? err.message : "..."`,
  so this needed no call-site changes — a deleted-elsewhere shipment or a server
  error now surfaces a readable message everywhere for free. A network failure with
  no response at all (server not running, CORS, DNS) isn't normalized the same way —
  axios's own message for that case is reasonably clear already, and it wasn't what
  was asked for.
- **A failed assignment-list fetch is shown inline** (folded into the picker's
  placeholder text), consistent with the list's inline fetch-error and the form's
  save-error — deliberately not a toast / notification system.
- **Fixed light theme** — no dark mode or theme switching.

### Testing

- **No test suite.** Not required at any tier. Vitest is configured; the pure
  business-rule functions (`buildWhere`, `validateNumberInRange`,
  `getStatusDropdownOptions`, `toApiDateTime`) would be the first to cover with more
  time.

### With more time

- **A data-fetching library (TanStack Query).** There's now a real amount of
  hand-rolled fetch / abort / loading / error code (`useShipments`, the detail
  fetch, the two assignment fetches) that it would mostly remove, along with the
  assignment re-fetch friction. Declined for now: every line has to be explainable
  live, and swapping it in would touch every fetch site under time pressure.
- **Nested routes.** Selection is already URL-driven, but the routing is two flat
  routes both rendering `ShipmentExplorer`. Nested routes with `<Outlet>` would be
  cleaner and would extend to the Extra Credit assignment page's drill-down.
