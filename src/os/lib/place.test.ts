import { describe, expect, it } from "vitest";
import { parsePlace } from "./place";

describe("parsePlace", () => {
  it("parses copied coordinates", () => {
    expect(parsePlace({ name: " Constantine ", coordinates: "36.365, 6.6147" })).toEqual({ name: "Constantine", lat: 36.365, lng: 6.6147 });
    expect(parsePlace({ coordinates: "-33.86,151.2" })).toEqual({ lat: -33.86, lng: 151.2, name: undefined });
  });

  it("rejects missing or invalid input", () => {
    expect(parsePlace(undefined)).toBeUndefined();
    expect(parsePlace({ name: "Nowhere" })).toBeUndefined();
    expect(parsePlace({ coordinates: "north, east" })).toBeUndefined();
    expect(parsePlace({ coordinates: "95, 10" })).toBeUndefined();
    expect(parsePlace({ coordinates: "1, 2, 3" })).toBeUndefined();
  });
});
