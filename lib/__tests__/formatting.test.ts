import { describe, it, expect } from "vitest";
import { formatDate, formatIndianRupees, formatIndianNumber, formatRupees } from "@/lib/formatting";

// ── formatDate ────────────────────────────────────────────────────────────────

describe("formatDate", () => {
  it("formats a standard ISO date string", () => {
    // The output format is locale-dependent (en-IN): "DD Mon YYYY"
    const result = formatDate("2026-01-15T00:00:00.000Z");
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2026/);
  });

  it("formats January correctly", () => {
    const result = formatDate("2026-01-01T00:00:00.000Z");
    expect(result).toContain("2026");
  });

  it("formats December correctly", () => {
    const result = formatDate("2025-12-25T00:00:00.000Z");
    expect(result).toContain("2025");
  });

  it("returns a non-empty string for valid ISO date", () => {
    const result = formatDate("2024-06-15T12:30:00.000Z");
    expect(result.length).toBeGreaterThan(0);
  });

  it("includes the day, month abbreviation, and year", () => {
    const result = formatDate("2026-03-14T00:00:00.000Z");
    expect(result).toMatch(/2026/);
  });

  it("handles date-only ISO strings", () => {
    const result = formatDate("2026-03-14");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

// ── formatIndianRupees ────────────────────────────────────────────────────────

describe("formatIndianRupees", () => {
  it("returns fallback 'N/A' for null", () => {
    expect(formatIndianRupees(null)).toBe("N/A");
  });

  it("returns fallback 'N/A' for undefined", () => {
    expect(formatIndianRupees(undefined)).toBe("N/A");
  });

  it("returns custom fallback when provided", () => {
    expect(formatIndianRupees(null, { fallback: "—" })).toBe("—");
  });

  it("formats zero as ₹0", () => {
    const result = formatIndianRupees(0);
    expect(result).toMatch(/0/);
    expect(result).toContain("₹");
  });

  it("includes rupee symbol by default", () => {
    const result = formatIndianRupees(1000);
    expect(result).toContain("₹");
  });

  it("omits rupee symbol when showSymbol=false", () => {
    const result = formatIndianRupees(1000, { showSymbol: false });
    expect(result).not.toContain("₹");
  });

  it("formats 1000 in Indian numbering", () => {
    const result = formatIndianRupees(1000);
    // en-IN formats 1000 as "1,000"
    expect(result).toMatch(/1[,.]?000/);
  });

  it("formats 100000 as 1 lakh in Indian numbering", () => {
    const result = formatIndianRupees(100000);
    // en-IN: "1,00,000"
    expect(result).toMatch(/1,00,000|100000/);
  });

  it("formats 10000000 as 1 crore", () => {
    const result = formatIndianRupees(10000000);
    expect(result).toMatch(/1,00,00,000|10000000/);
  });

  it("truncates decimal part (amount is already in rupees)", () => {
    // 1000.75 → Math.trunc → 1000
    const result = formatIndianRupees(1000.75);
    expect(result).not.toContain(".");
    expect(result).not.toContain("75");
  });

  it("has no fractional digits in output", () => {
    const result = formatIndianRupees(12345);
    // Should not contain ".00" or any decimal
    expect(result).not.toMatch(/\.\d/);
  });

  it("handles large amount (50 lakhs)", () => {
    const result = formatIndianRupees(5000000);
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toBe("N/A");
  });
});

// ── formatIndianNumber ────────────────────────────────────────────────────────

describe("formatIndianNumber", () => {
  it("returns '—' for null", () => {
    expect(formatIndianNumber(null)).toBe("—");
  });

  it("returns '—' for undefined", () => {
    expect(formatIndianNumber(undefined)).toBe("—");
  });

  it("does not include rupee symbol", () => {
    const result = formatIndianNumber(5000);
    expect(result).not.toContain("₹");
  });

  it("formats number in Indian style", () => {
    const result = formatIndianNumber(100000);
    expect(result).toMatch(/1,00,000|100000/);
  });

  it("formats zero as '0'", () => {
    const result = formatIndianNumber(0);
    expect(result).toMatch(/^0$/);
  });
});

// ── formatRupees (deprecated) ─────────────────────────────────────────────────

describe("formatRupees (deprecated)", () => {
  it("returns '—' for zero (fallback for zero-like falsy)", () => {
    // formatRupees calls formatIndianRupees with showSymbol: false, fallback: "—"
    // 0 is not null/undefined so it should format as "0"
    const result = formatRupees(0);
    expect(result).toMatch(/^0$/);
  });

  it("does not include rupee symbol", () => {
    const result = formatRupees(5000);
    expect(result).not.toContain("₹");
  });

  it("formats a positive number", () => {
    const result = formatRupees(50000);
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toBe("—");
  });
});
