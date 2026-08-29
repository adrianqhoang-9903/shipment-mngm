import { describe, expect, it } from "vitest";
import { buildWhere } from "./shipments";

// json-server v1's `_where` has two behaviours that fail silently rather than
// erroring - they return zero rows, which looks like "no results" instead of
// like a bug. Both were verified against a running server, and both are the
// reason this function exists rather than the query being built inline.
describe("buildWhere", () => {
  it("filters by status with an explicit eq operator", () => {
    // The bare-value shorthand ({ status: "OPEN" }) silently matches nothing
    // once combined with other keys, so the operator form is not optional.
    expect(buildWhere("OPEN", "")).toEqual({ status: { eq: "OPEN" } });
  });

  it("omits `or` entirely when there is no search term", () => {
    const where = buildWhere("OPEN", "");

    // An empty `or: []` matches nothing at all - it is not the same as "no
    // filter". The key has to be absent, not present-and-empty.
    expect(where).not.toHaveProperty("or");
    expect(Object.keys(where)).toEqual(["status"]);
  });

  it("omits `or` for a whitespace-only search term", () => {
    expect(buildWhere("OPEN", "   ")).not.toHaveProperty("or");
  });

  it("searches client_name OR label when there is a term", () => {
    expect(buildWhere("IN_TRANSIT", "sony")).toEqual({
      status: { eq: "IN_TRANSIT" },
      or: [
        { client_name: { contains: "sony" } },
        { label: { contains: "sony" } },
      ],
    });
  });

  it("trims the search term", () => {
    expect(buildWhere("OPEN", "  sony  ")).toEqual({
      status: { eq: "OPEN" },
      or: [
        { client_name: { contains: "sony" } },
        { label: { contains: "sony" } },
      ],
    });
  });

  // The status filter and the search are AND-ed (implicitly, by both being
  // top-level keys) - a search must not widen the results past the status.
  it("keeps the status filter alongside the search", () => {
    expect(buildWhere("DELIVERED", "sony").status).toEqual({ eq: "DELIVERED" });
  });
});
