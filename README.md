# Shipment Management UI

A two-panel shipment management tool: a paginated, searchable, status-filtered list
on the left, and a detail / edit panel on the right.

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

`shipments.json` is committed, so the mock API has data immediately - you don't need
to run the generator. To point the app at a different API URL, set
`VITE_API_BASE_URL`.

To regenerate the sample data:

```bash
node scripts/generate-data.cjs
```

### Other scripts

- `npm run build` — typecheck + production build
- `npm run lint` — ESLint
- `npm test` — Vitest

## Tech stack

- **React 19 + TypeScript + Vite**, with **React Compiler** handling memoization (hence almost no manual `useMemo` / `useCallback`).
- **react-router-dom** — routing and URL-driven selection.
- **axios** — one shared instance with a request timeout and a response
  interceptor that normalizes timeout, 404, and 5xx errors into one friendly
  `Error` each.
- **react-leaflet / Leaflet** — the detail-panel map.
- **lodash `debounce`** — the search input.
- **CSS Modules** — no UI component library.
- **No data-fetching library** and **no form library**; see
  Assumptions.

## Architecture

```
lib/http  →  services/*  →  hooks  →  container components  →  FormFields/* (presentational)
```

- `ShipmentExplorer` owns the create-dialog flag and the selected shipment id (a
  query param); `useShipments` owns the list query, also in the query string. `ShipmentList` and
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

## Performance

Measured on the production build (`npm run build`) served locally, against the
1,000-shipment fixture:

| | |
|---|---|
| LCP | **778 ms** |
| Bundle, total | **476 KB** (151 KB gzipped) |
| — main chunk | 305 KB (99 KB gz) |
| — map chunk, lazy | 150 KB (43 KB gz) |
| — CSS | 21 KB (8 KB gz) |

The map is a third of the bundle and is `React.lazy`'d, so the list view never pays
for it — it loads on first shipment selection. Nothing else is code-split; at this
size there's nothing else worth splitting.

The list stays flat as the dataset grows because paging is server-side (25 per row
page) and filtering and search are `_where` clauses, not client-side passes — the
browser never holds more than one page regardless of whether the collection is 1,000
rows or the 100k+ the brief describes. That is the main reason these numbers aren't
really a function of dataset size.

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
- **The whole view is URL state, in one query string:**
  `/shipments?selected=shp_042&status=IN_TRANSIT&q=sony&page=2`. Status filter,
  search text, page, and the open shipment are all query params on a single
  `/shipments` route, so a link restores exactly what the sender was looking at, and
  a refresh doesn't reset anything.
- **The selected shipment is a query param, not `/shipments/:id`.** That was the
  first design, and path params are usually right for a resource — but they imply
  the detail is a *page*, and here it isn't. It's a panel in a two-panel view that
  never unmounts the list; you don't navigate *to* a shipment, you highlight one
  inside the list view. Under that reading `selected` is view state of the same kind
  as `status` and `q`, and giving it a different mechanism was the inconsistency.
  Keeping one uniform scheme also removes a whole class of bug: with the path/query
  split, every `navigate()` had to manually carry the filter query string forward or
  silently drop the user's filters. Now a single merge-into-current write makes that
  structural rather than something to remember. It also collapses `/shipments` and
  `/shipments/:id` into one route, and extends cleanly to Extra Credit's assignment
  page, which is *also* multi-panel (`?assignment=…&shipment=…`) rather than a
  genuine page hierarchy.
- **Defaults are stripped from the query string**, so an untouched view stays a bare
  `/shipments` rather than `?status=OPEN&page=1`. A param appears only once it
  carries information. `perPage` is never in the URL at all — nothing in the UI
  changes it.
- **Reads are defensive, because the URL is user-editable.** An unknown `status` or a
  non-positive `page` falls back to the default instead of being trusted into a typed
  field; the junk param is left in place rather than rewritten, and gets overwritten
  the moment the user touches that control.
- **Writes use `replace` where a Back press shouldn't undo one step at a time** — each
  debounced keystroke, and the page-clamp correcting itself. Selecting a shipment and
  changing status push normally, so Back deselects or restores the previous filter.
- **An unmatched path** redirects to `/shipments` rather than rendering a dedicated
  404 page: with only one real section, a typo'd or stale link almost certainly meant
  the list, and there's nowhere else a 404 could usefully send someone.
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
- **One business rule narrows the assignment picker, and it isn't spec'd:** only
  `OPEN` assignments are offered, since a `COMPLETED` route has already finished and
  shouldn't accept new work. It's fetched only when a shipment is actually moved
  toward `IN_TRANSIT`, and re-fetched on each such transition rather than cached,
  since an assignment could close in between.
- **`clients` is read as a record of who's on a route, not a whitelist of who may
  join — reversed from an earlier reading.** An earlier version also filtered the
  picker to assignments whose `clients` already contained the shipment's
  `client_name`, on the assumption that an assignment serves a fixed client set.
  That was an invented constraint, and two things contradict it. The spec calls the
  field "a list of associated clients" — descriptive, not restrictive; it never says
  *eligible*. And the sample data disagrees outright: 74% of its linked shipments had
  a `client_name` absent from their own assignment's `clients`, which would make the
  majority of the fixture invalid under the restrictive reading. The likelier
  semantic is that assigning a shipment from a new client adds that client to the
  list. The filter is gone, and `scripts/generate-data.cjs` now derives `clients`
  from the shipments actually linked to each assignment — the same back-fill it
  already did for `shipment_count` — so the fixture is self-consistent with the
  reading rather than randomly populated.
- **No response caching.** Re-selecting a shipment you just viewed refetches it, and
  the assignment-label lookup repeats per detail view. Two things would address this
  in a real system, and they are not the same thing. Most of it belongs to the
  backend: `Cache-Control` / `ETag` / `Last-Modified` on single-resource GETs would
  eliminate the repeated reads for free, with no client code at all — json-server
  sends none of the three (verified against the running server). What HTTP caching
  can't do is mutation invalidation, in-flight request dedup, or
  stale-while-revalidate rendering; those need a client cache, and TanStack Query is
  the obvious way to get all three rather than hand-rolling them. The paginated list
  endpoint wouldn't be safely cacheable at the HTTP layer regardless, since creates,
  deletes, and status changes reshuffle it — so a client cache is the only thing that
  would help there.


### Dates

- **Dates are edited at day granularity, not as datetimes.** Both fields are stored
  as full ISO datetimes, but the time component in the sample data is a generator
  artifact rather than information: `generate-data.cjs` derives every record from a
  single `baseDate` by subtracting whole days, so *every* shipment carries the same
  wall-clock time — the moment the script happened to run. Surfacing that in a
  `datetime-local` input would present the script's start time as though it were a
  fact about each shipment. `eta` is the field that genuinely varies by time
  (`arrival + random(0–48h)`), and the spec deliberately keeps it separate from the
  `delivery_by_date` deadline; it's never shown or edited here.
- **A deadline is normalized to the end of its day, an arrival to the start.**
  `toEndOfDay` / `toStartOfDay` rather than one shared helper, because the two fields
  don't mean the same shape of thing. "Deliver by the 26th" means the end of the
  26th — normalizing it to `T00:00:00.000Z`, as an earlier version did, silently
  moved every edited deadline nearly a day earlier than the value the API already
  held. Nothing in the app computes lateness, so it was inert here, but it was wrong
  data going over the wire.
- **`delivery_by_date` must be on or after `arrival_date`** — enforced with a
  dynamic `min` on the date input; the same day is allowed. Same-day now also holds
  at the timestamp level (`T00:00:00.000Z` < `T23:59:59.999Z`), where the old
  midnight-for-both rule made the two identical.

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

- **Tests cover the business rules, and stop there.** 69 tests across the pure
  functions in `src/utils/` plus `buildWhere` — status-transition legality,
  coordinate range validation, date normalization, URL-param read/write, and the
  `_where` query builder. Nothing renders a component: the spec asks for none of
  this, so the budget went to the logic where a silent wrong answer is plausible
  rather than to the parts a reviewer can see working in ten seconds.
- **What the tests are actually for** is the class of bug that fails quietly. Two
  json-server behaviours return *zero rows* rather than an error — a bare
  `{status: "OPEN"}` instead of `{status: {eq: "OPEN"}}`, and an empty `or: []`
  instead of omitting the key — and both look like "no results" in the UI, not like
  a bug. Same for the URL-merge rule: the list filters and the selected shipment
  share one query string with two different writers, so a regression there silently
  drops someone's filters. Those invariants are pinned explicitly, with the
  reasoning in the test names.
- **Domain rules live in `src/utils/`, not in components.** `resolveAssignmentId`
  (what a save sends for `assignment_id`) and `getTransitionKind` (which status
  changes touch the assignment at all) started life inside `EditShipmentForm` and
  `AssignmentField` — the latter duplicated in both, which is how the two would
  eventually disagree about what "assigning" means. Both now sit in
  `utils/shipments.ts` beside `getStatusDropdownOptions`, and both are tested.
  `resolveAssignmentId` takes two structural `{ status, assignment_id }` objects
  rather than a `Shipment` and the form's local `FormValues`, so a domain rule
  doesn't drag either the API shape or a component's private type along with it.

### Extra Credit seams

None of these cost anything today; each is a choice made where the extending option
was free.

- **`react-router-dom`, for one real route.** The whole view could have been
  component state — it's a single page — but Extra Credit's `/assignments` page needs
  real routing, and putting view state in the URL now means that page is a route to
  add rather than a state model to redesign. It's also the right call on its own
  merits (shareable, refresh-safe), which is why it's here and not filed under
  speculative.
- **`ShipmentDetails` takes `selectedId` as a prop and never reads the URL itself.**
  Extra Credit's panel 3 is this same shipment detail, reached from an assignment
  rather than the list. Reading the id in `ShipmentExplorer` and passing it down —
  along with `clearSelection` for the post-delete case — keeps the panel reusable
  wherever a shipment id comes from, without it knowing which param carries it.
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
- **A second route, and possibly nesting.** There's one real route today
  (`/shipments`), which is all a single-view app needs — the detail panel is a query
  param, not a page. Extra Credit's `/assignments` would be the first genuine second
  route. Whether its three-panel drill-down wants nested routes with `<Outlet>` or
  just more query params is an open question: the panels are all on screen at once,
  which argues for query params by the same reasoning used here, while a distinct URL
  per assignment argues for a path segment. Worth deciding deliberately rather than
  by default.
