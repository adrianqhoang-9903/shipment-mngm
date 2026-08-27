# Shipment Management UI

## Run the project locally

### Prerequisites

### Installation & Setup

### Tech Stack & Architecture

### Features

### Assumptions

- **Status grouping**: the spec doesn't prescribe a UI treatment for "grouped by status," so shipments are filtered to one status at a time via a dropdown rather than three columns or one merged list - keeps pagination scoped to a single status per view instead of three independently-paginated lists.
- `delivery_by_date` is treated as a day-granular deadline. The field stores a full ISO datetime, but the spec describes it as a delivery deadline and provides a separate eta field for the estimated delivery time. The detail panel edits it as a date only; on save the time component is normalized to T00:00:00.000Z. An existing record's original time-of-day is not preserved once the date is edited. eta is not shown or edited — it isn't in the spec's detail-panel field list.
- `delivery_by_date` must be on or after `arrival_date` (a shipment can't be scheduled for delivery before it's reached the warehouse). Enforced via a dynamic `min` on the date input, not custom comparison logic. "After" is read as inclusive of the same day, not strictly the next day or later.
- **Hand-rolled form state instead of Formik/React Hook Form.** The editable-field surface is small (3 fields in Core's detail form; Stretch's create-shipment form is expected to be similarly small given it calls for "sensible defaults"), and every design decision needs to be explainable live, so form values, dirty-tracking, and validation are hand-rolled behind a small generic `useForm` hook rather than adopting a form library. This also surfaced a concrete reason the library wouldn't have helped here specifically: neither Formik's nor React Hook Form's own numeric-input handling (`valueAsNumber`/`setValueAs`) fixes native `<input type="number">`'s browser-level value sanitization (see next point) - both would still need the same custom parsing step, just relocated into their own APIs.
- **Latitude/longitude use `type="text"` + `inputMode="decimal"`, not `type="number"`.** Verified directly in a browser (not assumed) that a native number input's own `.value` getter collapses any unparseable intermediate keystroke - a bare `-`, a trailing `.`, `1e` before the exponent digit - to an empty string at the DOM level, before any JS runs. Combined with `Number("") === 0` in JavaScript, a naive `Number(event.target.value)` in the change handler would silently corrupt the field to `0` while the user is still typing a negative coordinate (a normal, frequent case for this domain, not an edge case). The fix keeps using the browser's native Constraint Validation API (`:invalid` styling, `validationMessage`, `checkValidity()`-gated Save button) rather than building a parallel one: a custom range-check function calls `element.setCustomValidity()` in place of native `min`/`max`, and the draft stores the raw typed string, converting to a real number only at the point of building the API payload.

- **No optimistic update / rollback for the list after saving a shipment.** An earlier version patched the list's copy of the shipment immediately on submit and rolled it back if the save failed. Removed: none of the editable fields (`delivery_by_date`, `lat`, `lng`) are shown in the list row, so the pre-emptive patch never had any observable effect - it added a rollback branch and a captured "previous values" snapshot for a UI state nothing ever displayed. The list is now patched once, after the save succeeds, with the server's response.

### Implementation Decisions & Trade-offs

### Additions & Considerations
