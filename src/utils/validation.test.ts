import { describe, expect, it } from "vitest";
import {
  LATITUDE_RANGE,
  LONGITUDE_RANGE,
  validateNumberInRange,
} from "./validation";

const VALID = "";

describe("validateNumberInRange", () => {
  it("accepts a plain number inside the range", () => {
    expect(validateNumberInRange("32.8", LATITUDE_RANGE)).toBe(VALID);
  });

  it("treats only the true empty string as valid, deferring to required", () => {
    expect(validateNumberInRange("", LATITUDE_RANGE)).toBe(VALID);
  });

  it.each([" ", "   ", "\t", "\n"])(
    "rejects the whitespace-only value %o rather than coercing it to 0",
    (blank) => {
      expect(validateNumberInRange(blank, LATITUDE_RANGE)).toBe(
        "Please enter a valid number.",
      );
    },
  );

  it("accepts the exact bounds, at both ends", () => {
    expect(validateNumberInRange("-90", LATITUDE_RANGE)).toBe(VALID);
    expect(validateNumberInRange("90", LATITUDE_RANGE)).toBe(VALID);
    expect(validateNumberInRange("-180", LONGITUDE_RANGE)).toBe(VALID);
    expect(validateNumberInRange("180", LONGITUDE_RANGE)).toBe(VALID);
  });

  it("rejects values just outside the bounds", () => {
    expect(validateNumberInRange("90.1", LATITUDE_RANGE)).toBe(
      "Value must be between -90 and 90.",
    );
    expect(validateNumberInRange("-180.1", LONGITUDE_RANGE)).toBe(
      "Value must be between -180 and 180.",
    );
  });

  it("does not accept a valid longitude as a latitude", () => {
    expect(validateNumberInRange("-96.9", LONGITUDE_RANGE)).toBe(VALID);
    expect(validateNumberInRange("-96.9", LATITUDE_RANGE)).not.toBe(VALID);
  });

  it("rejects text that isn't a number", () => {
    expect(validateNumberInRange("abc", LATITUDE_RANGE)).toBe(
      "Please enter a valid number.",
    );
  });

  it.each(["-", ".", "-.", "1e"])(
    "rejects the partial input %o instead of coercing it to 0",
    (partial) => {
      expect(validateNumberInRange(partial, LATITUDE_RANGE)).toBe(
        "Please enter a valid number.",
      );
    },
  );

  it("ignores surrounding whitespace on an otherwise valid value", () => {
    expect(validateNumberInRange("  32.8  ", LATITUDE_RANGE)).toBe(VALID);
  });
});
