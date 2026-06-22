import { describe, it, expect } from "vitest";
import { cn, formatCurrency, formatPercent } from "./utils";

describe("formatCurrency", () => {
  it("formats whole-dollar USD", () => {
    expect(formatCurrency(170000)).toBe("$170,000");
  });
  it("formats negatives", () => {
    expect(formatCurrency(-10000)).toBe("-$10,000");
  });
  it("renders a dash for null/undefined/NaN", () => {
    expect(formatCurrency(null)).toBe("—");
    expect(formatCurrency(undefined)).toBe("—");
    expect(formatCurrency(NaN)).toBe("—");
  });
});

describe("formatPercent", () => {
  it("formats to one decimal", () => {
    expect(formatPercent(37.43)).toBe("37.4%");
  });
  it("renders a dash for null", () => {
    expect(formatPercent(null)).toBe("—");
  });
});

describe("cn", () => {
  it("merges and dedupes tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm", false && "hidden", "font-bold")).toBe(
      "text-sm font-bold"
    );
  });
});
