import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

// Crit-4 ("An instrument") published spec:
// https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/crits/04-instrument/
//
// Mechanically checkable lines get tests here. The rest are judged by a
// person at the crit, not by a test, and are named rather than faked:
//   - "it is expressive: the player's choices shape what they hear, and two
//     players sound different"
//   - "a stranger can play it uninstructed — the opening screen invites the
//     first sound"
//   - "there is no way to play it wrong — no score, no fail state"
// These start red — there's no instrument yet.

const DIST = resolve("dist");

function files(dir: string = DIST): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

const shipped = files();
const scripts = shipped
  .filter((path) => path.endsWith(".js"))
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");

const home = new JSDOM(readFileSync(join(DIST, "index.html"), "utf8")).window
  .document;

describe("crit-4: sound is made live, not played back", () => {
  it("constructs a Web Audio context rather than only playing a static file", () => {
    expect(
      scripts,
      "the brief requires sound synthesised live by the Web Audio API, not a recording",
    ).toMatch(/AudioContext/);
  });

  it("does not rely on <audio>/<video> elements as the sound source", () => {
    const mediaEls = [
      ...home.querySelectorAll("audio[src], video[src]"),
    ];
    expect(
      mediaEls,
      "a static <audio>/<video> src is playback, not an instrument the player shapes",
    ).toHaveLength(0);
  });
});

describe("crit-4: playable with whatever is at hand", () => {
  it("wires up keyboard interaction", () => {
    expect(scripts).toMatch(/key(down|up|press)/i);
  });

  it("wires up pointer or touch interaction", () => {
    expect(scripts).toMatch(/pointer(down|up|move)|mouse(down|up|move)|touch(start|end|move)/i);
  });
});
