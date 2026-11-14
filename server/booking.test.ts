import { describe, expect, it } from "vitest";
import {
  DEFAULT_HOURS,
  availableSlots,
  coveredSlots,
  endTime,
  isISODate,
  isTime,
  madridNow,
  type BookingRules,
} from "../shared/booking";

const rules: BookingRules = {
  hours: DEFAULT_HOURS,
  slotMinutes: 30,
  minLeadMinutes: 120,
  maxDaysAhead: 60,
};

// Saturday 14 Nov 2026, 11:00 in Madrid (CET).
const saturdayMorning = new Date("2026-11-14T10:00:00Z");

describe("date and time validation", () => {
  it("accepts real ISO dates and rejects impossible ones", () => {
    expect(isISODate("2026-11-16")).toBe(true);
    expect(isISODate("2028-02-29")).toBe(true);
    expect(isISODate("2026-02-29")).toBe(false);
    expect(isISODate("2026-13-01")).toBe(false);
    expect(isISODate("16/11/2026")).toBe(false);
  });

  it("accepts only 24-hour HH:MM times", () => {
    expect(isTime("09:05")).toBe(true);
    expect(isTime("21:00")).toBe(true);
    expect(isTime("24:00")).toBe(false);
    expect(isTime("9:05")).toBe(false);
  });
});

describe("coveredSlots", () => {
  it("blocks every half-hour slot touched by a 45-minute service", () => {
    expect(coveredSlots("10:00", 45, 30)).toEqual(["10:00", "10:30"]);
  });

  it("does not add an extra slot when the service ends exactly on a boundary", () => {
    expect(coveredSlots("10:00", 60, 30)).toEqual(["10:00", "10:30"]);
  });
});

describe("availableSlots", () => {
  it("returns the opening-day grid without Sunday", () => {
    const monday = availableSlots({
      date: "2026-11-16",
      durationMin: 30,
      rules,
      occupied: [],
      blocked: [],
      now: saturdayMorning,
    });
    expect(monday[0]).toBe("10:00");
    expect(monday.at(-1)).toBe("20:30");
    expect(monday).toHaveLength(22);

    const sunday = availableSlots({
      date: "2026-11-15",
      durationMin: 30,
      rules,
      occupied: [],
      blocked: [],
      now: saturdayMorning,
    });
    expect(sunday).toEqual([]);
  });

  it("excludes a 45-minute booking and the slot it overlaps", () => {
    const slots = availableSlots({
      date: "2026-11-16",
      durationMin: 45,
      rules,
      occupied: ["10:00", "10:30"],
      blocked: [],
      now: saturdayMorning,
    });
    expect(slots).not.toContain("10:00");
    expect(slots).not.toContain("10:30");
    expect(slots).toContain("11:00");
  });

  it("respects a one-hour block and a full-day block", () => {
    const partial = availableSlots({
      date: "2026-11-16",
      durationMin: 30,
      rules,
      occupied: [],
      blocked: ["12:00"],
      now: saturdayMorning,
    });
    expect(partial).not.toContain("12:00");
    expect(partial).not.toContain("12:30");
    expect(partial).toContain("13:00");

    const longService = availableSlots({
      date: "2026-11-16",
      durationMin: 60,
      rules,
      occupied: [],
      blocked: ["14:00"],
      now: saturdayMorning,
    });
    expect(longService).not.toContain("14:00");
    expect(longService).not.toContain("14:30");
    expect(longService).toContain("15:00");

    const full = availableSlots({
      date: "2026-11-16",
      durationMin: 30,
      rules,
      occupied: [],
      blocked: ["ALL"],
      now: saturdayMorning,
    });
    expect(full).toEqual([]);
  });

  it("applies the lead time on the same day", () => {
    // 10:00 in Madrid on Saturday; with 120 minutes of lead time, 12:00 is the first slot.
    const today = availableSlots({
      date: "2026-11-14",
      durationMin: 30,
      rules,
      occupied: [],
      blocked: [],
      now: new Date("2026-11-14T09:00:00Z"),
    });
    expect(today).not.toContain("10:00");
    expect(today).not.toContain("11:30");
    expect(today[0]).toBe("12:00");
  });

  it("does not offer dates beyond the booking horizon or in the past", () => {
    const tooFar = availableSlots({
      date: "2027-02-01",
      durationMin: 30,
      rules,
      occupied: [],
      blocked: [],
      now: saturdayMorning,
    });
    expect(tooFar).toEqual([]);

    const past = availableSlots({
      date: "2026-11-13",
      durationMin: 30,
      rules,
      occupied: [],
      blocked: [],
      now: saturdayMorning,
    });
    expect(past).toEqual([]);
  });

  it("does not return slots that would end after closing", () => {
    const slots = availableSlots({
      date: "2026-11-16",
      durationMin: 60,
      rules,
      occupied: [],
      blocked: [],
      now: saturdayMorning,
    });
    expect(slots.at(-1)).toBe("20:00");
    expect(endTime("20:00", 60)).toBe("21:00");
  });
});

describe("madridNow", () => {
  it("uses the Madrid wall clock independently of the server timezone", () => {
    expect(madridNow(new Date("2026-11-14T23:30:00Z"))).toMatchObject({
      date: "2026-11-15",
      minutes: 30,
      weekday: 0,
    });
  });
});
