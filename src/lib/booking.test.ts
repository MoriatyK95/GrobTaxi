import test from "node:test";
import assert from "node:assert/strict";
import {
  createBookingReference,
  formatPrice,
  getFare,
  isVehicleSuitable,
  validateJourney,
  vehicles,
  type JourneyInput,
} from "./booking.ts";

// Use the same explicit local clock across every test, independent of run date.
const now = new Date(2030, 9, 12, 10, 0);
const journey: JourneyInput = {
  locationId: "marina-bay",
  terminal: "1",
  date: "2030-10-13",
  time: "09:00",
  passengers: 2,
  bags: 2,
  direction: "to-airport",
};

test("quotes are fixed, depend on route and vehicle, and reject unsupported IDs", () => {
  assert.equal(getFare("comfort", "marina-bay"), 38);
  assert.equal(getFare("premium", "marina-bay"), 54);
  assert.equal(getFare("xl", "sentosa"), 62);
  assert.equal(
    getFare("comfort", "marina-bay"),
    getFare("comfort", "marina-bay"),
  );
  assert.throws(() => getFare("unknown", "marina-bay"));
  assert.throws(() => getFare("comfort", "unknown"));
  assert.match(formatPrice(38), /\$38$/);
  assert.match(formatPrice(38.5), /\$38\.5(?:0)?$/);
});

test("both directions and numeric or string terminal values are supported", () => {
  assert.equal(validateJourney(journey, now), null);
  assert.equal(
    validateJourney(
      { ...journey, direction: "from-airport", terminal: 4 },
      now,
    ),
    null,
  );
  assert.equal(
    validateJourney({ ...journey, passengers: 6, bags: 6 }, now),
    null,
  );
  assert.equal(validateJourney({ ...journey, bags: 0 }, now), null);
});

test("validates actual calendar dates, clock values, and strict input formats", () => {
  for (const date of [
    "",
    "2030-02-30",
    "2030-13-01",
    "2030-00-10",
    "2030-10-00",
    "2030-2-01",
  ]) {
    assert.match(validateJourney({ ...journey, date }, now)!, /valid pickup/);
  }
  for (const time of ["", "24:00", "09:60", "9:00", "09:00:00"]) {
    assert.match(validateJourney({ ...journey, time }, now)!, /valid pickup/);
  }
  assert.equal(validateJourney({ ...journey, date: "2032-02-29" }, now), null);
  assert.match(
    validateJourney({ ...journey, date: "2031-02-29" }, now)!,
    /valid pickup/,
  );
});

test("pickup must be in the future in local time", () => {
  assert.match(
    validateJourney({ ...journey, date: "2030-10-12", time: "09:59" }, now)!,
    /future/,
  );
  assert.match(
    validateJourney({ ...journey, date: "2030-10-12", time: "10:00" }, now)!,
    /future/,
  );
  assert.equal(
    validateJourney({ ...journey, date: "2030-10-12", time: "10:01" }, now),
    null,
  );
});

test("rejects unknown route locations and terminals", () => {
  assert.match(
    validateJourney({ ...journey, locationId: "unknown" }, now)!,
    /location/,
  );
  for (const terminal of ["", "0", "5", "01", "1.0", "T1", 1.5]) {
    assert.match(validateJourney({ ...journey, terminal }, now)!, /terminal/);
  }
});

test("rejects invalid passenger and bag counts instead of silently rounding", () => {
  for (const passengers of [
    0,
    -1,
    7,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ]) {
    assert.match(
      validateJourney({ ...journey, passengers }, now)!,
      /passengers/,
    );
  }
  for (const bags of [-1, 7, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.match(validateJourney({ ...journey, bags }, now)!, /bags/);
  }
});

test("vehicle suitability accounts for both people and luggage", () => {
  const comfort = vehicles.find((vehicle) => vehicle.id === "comfort")!;
  const xl = vehicles.find((vehicle) => vehicle.id === "xl")!;
  assert.equal(isVehicleSuitable(comfort, 4, 2), true);
  assert.equal(isVehicleSuitable(comfort, 4, 3), false);
  assert.equal(isVehicleSuitable(comfort, 5, 1), false);
  assert.equal(isVehicleSuitable(comfort, 0, 0), false);
  assert.equal(isVehicleSuitable(comfort, 2, -1), false);
  assert.equal(isVehicleSuitable(comfort, 1.5, 0), false);
  assert.equal(isVehicleSuitable(xl, 6, 6), true);
});

test("mock confirmation references have a readable prefix and unique values", () => {
  const references = Array.from({ length: 20 }, createBookingReference);
  assert.equal(new Set(references).size, references.length);
  for (const reference of references)
    assert.match(reference, /^GROB-[0-9A-F]{8}$/);
});
