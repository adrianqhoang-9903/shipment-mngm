import { describe, expect, it } from "vitest";
import { mergeListParams, readListParams, withParam } from "./queryParams";

const params = (init: string) => new URLSearchParams(init);

describe("withParam", () => {
  it("sets a value that isn't the default", () => {
    expect(withParam(params(""), "status", "IN_TRANSIT").get("status")).toBe(
      "IN_TRANSIT",
    );
  });

  it("deletes on null", () => {
    expect(withParam(params("selected=shp_1"), "selected", null).has("selected")).toBe(
      false,
    );
  });

  it("deletes rather than writes a value equal to the default", () => {
    const next = withParam(params("status=IN_TRANSIT"), "status", "OPEN", "OPEN");

    expect(next.has("status")).toBe(false);
  });

  it("treats empty string as the default, so a cleared search drops the key", () => {
    expect(withParam(params("q=sony"), "q", "").has("q")).toBe(false);
  });

  it("leaves every other param untouched", () => {
    const next = withParam(params("selected=shp_1&q=sony"), "page", "3");

    expect(next.get("selected")).toBe("shp_1");
    expect(next.get("q")).toBe("sony");
    expect(next.get("page")).toBe("3");
  });

  it("does not mutate the params it was given", () => {
    const current = params("q=sony");
    withParam(current, "q", "dhl");

    expect(current.get("q")).toBe("sony");
  });
});

describe("readListParams", () => {
  it("falls back to defaults on an empty query string", () => {
    expect(readListParams(params(""))).toEqual({
      status: "OPEN",
      query: "",
      page: 1,
      perPage: 25,
    });
  });

  it("reads a fully specified query string", () => {
    expect(readListParams(params("status=IN_TRANSIT&q=sony&page=3"))).toEqual({
      status: "IN_TRANSIT",
      query: "sony",
      page: 3,
      perPage: 25,
    });
  });

  it("falls back on a status that isn't a real ShipmentStatus", () => {
    expect(readListParams(params("status=BOGUS")).status).toBe("OPEN");
    expect(readListParams(params("status=open")).status).toBe("OPEN");
  });

  it.each(["0", "-5", "abc", "1.5", ""])(
    "falls back to page 1 for the invalid page %o",
    (page) => {
      expect(readListParams(params(`page=${page}`)).page).toBe(1);
    },
  );

  it("ignores params it doesn't own", () => {
    expect(readListParams(params("selected=shp_1&q=sony")).query).toBe("sony");
  });
});

describe("mergeListParams", () => {
  it("only touches the keys it was given", () => {
    const next = mergeListParams(params("status=IN_TRANSIT&q=sony"), { page: 2 });

    expect(next.get("status")).toBe("IN_TRANSIT");
    expect(next.get("q")).toBe("sony");
    expect(next.get("page")).toBe("2");
  });

  it("preserves the selected shipment across a filter change", () => {
    const next = mergeListParams(params("selected=shp_42"), {
      status: "IN_TRANSIT",
      page: 1,
    });

    expect(next.get("selected")).toBe("shp_42");
  });

  it("strips defaults instead of writing them", () => {
    const next = mergeListParams(params("status=IN_TRANSIT&page=4"), {
      status: "OPEN",
      page: 1,
    });

    expect(next.toString()).toBe("");
  });

  it("trims the query before it reaches the URL", () => {
    expect(mergeListParams(params(""), { query: "  sony  " }).get("q")).toBe("sony");
  });

  it("drops the query key when the search is only whitespace", () => {
    expect(mergeListParams(params("q=sony"), { query: "   " }).has("q")).toBe(false);
  });

  it("does not mutate the params it was given", () => {
    const current = params("page=2");
    mergeListParams(current, { page: 5 });

    expect(current.get("page")).toBe("2");
  });
});
