import { describe, expect, test } from "bun:test";
import { msUntil } from "../utils/schedule.js";

const H = 60 * 60 * 1000;
const at = (s) => new Date(s);

describe("msUntil", () => {
	test("daily: later today", () => {
		expect(msUntil(at("2026-11-22T00:30:00"), 1)).toBe(0.5 * H);
	});
	test("daily: already past, so tomorrow", () => {
		expect(msUntil(at("2026-11-22T01:00:00"), 1)).toBe(24 * H);
		expect(msUntil(at("2026-11-22T13:00:00"), 1)).toBe(12 * H);
	});
	test("weekly: next Saturday 03:00", () => {
		// 2026-11-22 is a Sunday.
		expect(msUntil(at("2026-11-22T10:00:00"), 3, 6)).toBe((6 * 24 - 7) * H);
	});
	test("weekly: same day but past, so a week later", () => {
		expect(msUntil(at("2026-11-28T04:00:00"), 3, 6)).toBe((7 * 24 - 1) * H);
	});
	test("weekly: same day, still ahead", () => {
		expect(msUntil(at("2026-11-28T02:00:00"), 3, 6)).toBe(1 * H);
	});
});
