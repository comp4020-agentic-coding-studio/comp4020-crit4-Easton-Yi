import { describe, expect, it } from "vitest";
import {
  frequencyForKey,
  frequencyForPosition,
  keyboardPositionForKey,
  scaleFrequencies,
} from "../src/scripts/audio/scale";

// Pure mapping functions — testable without an AudioContext, per
// docs/CRIT_BRIEF.md "keep mapping functions pure where practical."

describe("keyboardPositionForKey", () => {
  it("covers every letter of the alphabet across the three QWERTY rows", () => {
    for (const letter of "abcdefghijklmnopqrstuvwxyz") {
      expect(keyboardPositionForKey(letter), letter).toBeTruthy();
    }
  });

  it("is case-insensitive", () => {
    expect(keyboardPositionForKey("A")).toEqual(keyboardPositionForKey("a"));
  });

  it("returns undefined for keys outside the letter rows", () => {
    expect(keyboardPositionForKey("1")).toBeUndefined();
    expect(keyboardPositionForKey(" ")).toBeUndefined();
    expect(keyboardPositionForKey("Enter")).toBeUndefined();
    expect(keyboardPositionForKey("Shift")).toBeUndefined();
  });

  it("orders keys left-to-right within a row to match the physical keyboard", () => {
    const q = keyboardPositionForKey("q")!;
    const w = keyboardPositionForKey("w")!;
    const p = keyboardPositionForKey("p")!;
    expect(q.x).toBeLessThan(w.x);
    expect(w.x).toBeLessThan(p.x);
  });

  it("orders rows top-to-bottom to match the physical keyboard", () => {
    const top = keyboardPositionForKey("t")!;
    const home = keyboardPositionForKey("g")!;
    const bottom = keyboardPositionForKey("b")!;
    expect(top.y).toBeLessThan(home.y);
    expect(home.y).toBeLessThan(bottom.y);
  });

  it("keeps every position within the normalised 0–1 range", () => {
    for (const letter of "abcdefghijklmnopqrstuvwxyz") {
      const position = keyboardPositionForKey(letter)!;
      expect(position.x).toBeGreaterThanOrEqual(0);
      expect(position.x).toBeLessThanOrEqual(1);
      expect(position.y).toBeGreaterThanOrEqual(0);
      expect(position.y).toBeLessThanOrEqual(1);
    }
  });
});

describe("frequencyForKey", () => {
  it("plays the same note a pointer at that key's screen position would play", () => {
    for (const letter of "qwertyuiopasdfghjklzxcvbnm") {
      const position = keyboardPositionForKey(letter)!;
      expect(frequencyForKey(letter)).toBe(frequencyForPosition(position.x));
    }
  });

  it("only ever returns a frequency from the shared scale", () => {
    const scale = scaleFrequencies();
    for (const letter of "qwertyuiopasdfghjklzxcvbnm") {
      expect(scale).toContain(frequencyForKey(letter));
    }
  });
});
