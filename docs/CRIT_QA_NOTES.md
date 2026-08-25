# Crit 4 QA Notes — Echo Garden

This file tracks implementation evidence, manual play testing, and unresolved
risks. It is not a substitute for the official contract in `CRIT_BRIEF.md`.

## Current status

- Stage: 1 (first playable vertical slice) complete. Stages 2–5 not started.
  Within Stage 1, the keyboard mapping was reworked so each letter key sits at
  its real QWERTY screen position and shares the pointer's pitch function
  (`frequencyForPosition`), and a 10-key concurrency cap with oldest-key
  eviction was added (`MAX_CONCURRENT_KEYS` in `controller.ts`).
- Build: `pnpm build` succeeds; `dist/` contains only `index.html`, one bundled
  script, and `card.png` — no audio assets.
- Full checks: `pnpm check` green (`astro check`: 0 errors; build succeeds;
  `vitest run`: 29/29 passing across 4 files).
- Desktop manual test: pass (Playwright Chromium at 1920×1080 — see below).
- Mobile manual test: pass on the Chrome DevTools 390×844 preset via
  Playwright with `hasTouch: true`; **not yet tested on a physical phone**.
- Deployed URL: not deployed yet (instructed to stop before deploy/reflection).
- Last deployment verification: n/a.
- Known blockers: none for Stage 1. See "Known issues and decisions" for
  Stage-1 scope choices carried forward as Stage 2+ work.

## Contract traceability

| Requirement | Implementation evidence | Verification | Status |
| --- | --- | --- | --- |
| Deployed and live | Not yet shipped — Stage 1 is local-only per instruction | n/a until deployment stage | Not tested |
| Live browser synthesis | `AudioEngine`/`Voice` build `AudioContext` + oscillator/gain/filter graph; no `<audio>`/`<video>`/media assets in `dist/` | `spec/crit-4.test.ts`; manual inspection of `dist/` | Pass |
| Expressive | Stage 1 only quantises pointer-down x-position and per-key pitch; no live drag/vertical/velocity mapping yet | Deferred — this is Stage 2 scope | Not tested |
| Stranger can play uninstructed | Opening copy "Touch the dark / or press any letter"; first pointer/keydown resumes audio and sounds a note with no button | Playwright: first `pointerdown`/`keydown` triggers a note and fades the opening copy | Pass (automated proxy only — no live cold-play test performed yet) |
| Mouse, keyboard and touch | Pointer Events cover mouse/touch; keydown/keyup cover keyboard | `spec/crit-4.test.ts`; Playwright exercised both paths | Pass |
| No wrong way to play | Pentatonic quantisation on both inputs; no score/fail UI in markup | Manual inspection | Pass |
| Starter invariants pass | `spec/invariants.test.ts` untouched; page still has lang, title, description, og:image, viewport, nav, one h1, alt text (n/a, no images) | `pnpm check` | Pass |
| Process evidence exists | Not yet written — instructed to update `PROCESS.md`/reflection separately, after this slice | `pnpm check:evidence` | Not tested |
| Work can be accounted for | Decisions recorded below and in this file | Prepare live explanation | In progress |

Use only these status labels:

- `Not tested`
- `In progress`
- `Pass`
- `Needs work`
- `Blocked`

## Automated verification

Record the exact command and result after each meaningful stage.

### Latest run

- Date: 2026-08-25
- Commit: working tree (not yet committed)
- Command: `pnpm check` (runs `astro check`, `astro build`, `vitest run`)
- Result: pass — `astro check`: 0 errors/warnings/hints; build: 1 page built;
  vitest: 4 files, 29 tests, all passing (added `spec/crit-4-scale.test.ts`
  for the QWERTY keyboard-position mapping)
- Relevant output: `dist/` contains `index.html`, one bundled JS file, and
  `card.png` only — no audio assets
- Follow-up: run `pnpm check:evidence` once `PROCESS.md` and
  `reflections/crit-4.md` are written (deferred per instruction)

### Multi-input verification (Playwright, 1920×1080)

Prompted by "is it possible to make multi-key/mouse touch at the same time?".
Confirmed the existing per-id voice/bloom architecture already supports
concurrent independent inputs; found and fixed one real bug along the way.

- Three keys held simultaneously (`q`, `p`, `g`): three independent blooms
  rendered at the correct QWERTY-mapped screen positions (q top-left, p
  top-right, g centre/home-row) — screenshot inspected, matches expectation.
- Two simultaneous touches (synthetic `PointerEvent`s with distinct
  `pointerId`s dispatched on `#instrument-surface`): **initially failed** —
  `surface.setPointerCapture(event.pointerId)` threw
  `NotFoundError: Failed to execute 'setPointerCapture' on 'Element': No
  active pointer with the given id is found.`, and because that call ran
  before `noteOn`/`addBloom` in `bindPointer()`, the thrown error skipped both
  — no sound, no bloom, for a pointer id the browser didn't consider "active"
  when capture was requested. Fixed by wrapping the capture call in
  `try/catch` in `src/scripts/instrument/controller.ts` (capture is a
  best-effort convenience for drags off the surface, not required for the
  note to fire). Re-ran after the fix: zero console/page errors, both touches
  produced independent blooms at their respective x/y positions — screenshot
  confirms two separate blooms, one per synthetic pointer id.
- Twelve keys held (exceeding `MAX_CONCURRENT_KEYS = 10`): no crash; the
  screenshot shows more than 10 blooms visible at once, which is correct, not
  a bug — the 10-key cap evicts the *oldest held key's note*, but eviction
  triggers the same 800ms release fade as a normal key-up, so an evicted
  key's bloom is still visibly fading out at the moment of the screenshot
  rather than vanishing instantly.
- Caveat: synthetic `PointerEvent` dispatch (via `page.evaluate` +
  `dispatchEvent`) is not identical to a real OS-originated touch event —
  Chromium's native multi-touch input pipeline was not exercised here. This
  found a real code path issue (the capture bug above), which is reassuring,
  but a physical multi-touch device still has not been tested (see "Known
  issues and decisions").

### Required checks

- [x] Dependencies install from the committed lockfile (pre-existing
      `node_modules`; no dependency changes made this stage).
- [x] `pnpm check` passes.
- [x] Starter invariant tests have not been weakened or deleted
      (`spec/invariants.test.ts` untouched).
- [x] Additional Crit 4 tests pass (`spec/crit-4.test.ts`, pre-existing,
      now green now that an instrument exists).
- [x] Production build succeeds.
- [ ] Internal links and assets work under the repository base path — not
      yet checked against a deployed build (only `astro dev`/`astro build`
      + local Playwright so far, both served under
      `/comp4020-crit4-Easton-Yi/`; the deployed GitHub Pages URL itself is
      unverified since Stage 1 does not deploy).
- [ ] `pnpm check:evidence` passes — not run; `PROCESS.md`/reflection are
      deliberately not written yet for this stage.
- [x] No audio files are included as substitutes for synthesis (`dist/`
      inspected; no `.mp3`/`.wav`/`.ogg`, no `<audio>`/`<video>` elements).

Note: `spec/starter.test.ts` was deleted, not preserved — this is the
template's documented worked example (`spec/README.md`: "yours to replace...
when you replace the starter page"), not one of the always-on invariants, and
its target (`[data-testid="intro"]`) no longer exists now that `index.astro`
is the instrument page.

## First-sound test

Test from a fresh page load with the console closed.

- [x] No sound occurs before user input (`AudioEngine` only constructs the
      `AudioContext` lazily inside `noteOn`, which only fires from a pointer
      or keyboard handler).
- [x] First pointer down resumes audio and produces sound.
- [x] First keyboard press resumes audio and produces sound.
- [x] The first gesture is not lost while AudioContext resumes — the voice's
      oscillators are scheduled at `context.currentTime` synchronously in the
      same tick as `resume()` is called, before the resume promise settles.
- [x] No separate start modal is required — there is no start button/modal
      in the markup at all.
- [x] Visual feedback appears with the first sound (bloom `addBloom` is
      called in the same handler as `audio.noteOn`).
- [ ] No obvious audio click occurs on note start or release — verified
      structurally (linear gain ramps in `Voice`, no `setValueAtTime` jumps
      at the release boundary) but **not confirmed by ear**; this needs a
      human listening pass, which this run could not do (headless browser,
      no audio device).

Notes: Verified via Playwright (Chromium, headless) at both 1920×1080 and
390×844: `[data-opening]` gains the `.played` class immediately after the
first `pointerdown` and, on a fresh reload, after the first `keydown`
(`j` key), with zero console/page errors in either case. This confirms the
wiring end-to-end but is a proxy for "sound happened," not a substitute for
listening — record a real listening pass before the crit.

## Expressiveness test

Perform intentionally contrasting gestures.

### Gesture A — slow horizontal drag

Expected:

- a clearly changing melody;
- smooth pitch transitions;
- relatively calm brightness;
- a visible continuous trail.

Observed:

### Gesture B — fast diagonal sweep

Expected:

- a different pitch contour;
- brighter or more energetic timbre;
- stronger visual energy;
- no unsafe volume jump.

Observed:

### Gesture C — long stationary hold

Expected:

- sustained sound;
- stable tone;
- release tail after lifting;
- bloom remains connected to the voice.

Observed:

### Gesture D — several taps

Expected:

- short musical notes;
- no lag buildup;
- old voices clean up;
- no visual object leak.

Observed:

### Gesture E — multitouch chord

Expected:

- simultaneous independent voices;
- each finger controls its own bloom;
- release of one finger does not stop the others;
- master output remains controlled.

Observed: Verified via Playwright with two synthetic simultaneous pointers
(see "Multi-input verification" above) — independent blooms, independent
voice ids (`pointer-<id>`), releasing one leaves the other sounding (each
`pointerup` only calls `noteOff`/`releaseBloom` for its own id). **Not yet
verified on real multi-touch hardware.**

### Keyboard phrase

Expected:

- multiple mapped keys produce different pitches;
- held keys sustain;
- multiple keys form a chord;
- browser shortcuts remain available;
- lost focus does not leave hanging notes.

Observed: Holding `q`, `p`, `g` together produced three distinct, sustained
pitches at their QWERTY-mapped positions with no interruption of one another.
Holding 12 keys at once exercised the new 10-key cap: the oldest held key is
evicted (faded and stopped) once an 11th key is pressed, so the total never
exceeds 10 concurrently *sounding* notes, though a just-evicted key's bloom
remains visible for its ~0.8s release fade. `blur` handling (tab/window
losing focus) was built in Stage 1 and not re-tested this round.

## Cold-play test

Ask a person who has not seen the project to open the page. Do not explain it
until after they have played.

Record:

- Date:
- Device:
- Time until first sound:
- First action attempted:
- Did they discover dragging?
- Did they discover holding?
- Did they try more than one finger or multiple keys?
- What did they think controlled pitch?
- What confused them?
- What did they enjoy?
- Correction made afterward:

Success is not merely that they eventually produced sound. The opening screen
should cause the correct first action without spoken instruction.

## Desktop QA — 1920 × 1080 Chrome

- [x] Full viewport is used cleanly (screenshot: canvas + centred opening
      copy fill the frame, no letterboxing).
- [x] Opening invitation is immediately visible.
- [x] Mouse down and release work (drag/rapid-movement mapping is Stage 2 —
      Stage 1 quantises position at pointer-down only).
- [x] Keyboard mapping works without clicking a hidden control first (no
      control exists to click).
- [ ] Focus indication and browser shortcuts remain sensible — not checked
      this stage (no focusable controls yet beyond the sr-only Home link).
- [x] Text does not become excessively large or sparse (`clamp()` sizing).
- [ ] Particles and trails stay smooth — n/a to Stage 1 (trails are Stage 3).
- [ ] Resizing does not break coordinate mapping — canvas resize handler
      exists (`GardenRenderer.resize`) but not manually exercised.
- [x] No console errors occur during play (Playwright `pageerror`/console
      listeners recorded none across pointer + keyboard runs).
- [ ] No hanging voices remain after focus or visibility changes — `blur`
      releases held keys; page-visibility handling is not implemented yet
      (see Known issues).

Notes: Automated via Playwright/Chromium headless, not a human desktop
session with real speakers — feel/latency judgement is deferred to the crit.

## Mobile QA — 390 × 844 Chrome preset

- [x] Layout fits without horizontal overflow (`scrollWidth <= clientWidth`
      asserted via Playwright at 390×844).
- [x] First touch produces sound (simulated via `hasTouch: true` context +
      pointer events; see caveat below).
- [x] One-finger drag does not scroll the page (`touch-action: none` is
      scoped to `#instrument-surface`, which covers the full viewport).
- [ ] Multitouch works — not exercised; Stage 1's per-`pointerId` voice map
      supports it in principle but has not been tested with two simultaneous
      pointers.
- [x] Browser gestures are not unnecessarily blocked outside the instrument
      (`touch-action: none` only on the canvas, not `body`).
- [x] Opening copy does not dominate the viewport (screenshot: copy sits in
      the upper-middle third at 390×844).
- [ ] Safe-area insets are respected — CSS `env(safe-area-inset-*)` padding
      is in place on `.opening` but not confirmed on a notched device.
- [ ] Trails remain smooth under rapid input — n/a to Stage 1.
- [ ] Orientation or resize does not corrupt the canvas — resize handler
      exists, not manually exercised for orientation change.
- [x] No hover state is required to understand the page.

Notes:

The Chrome preset (and Playwright's touch emulation) is useful for layout but
does not prove real touch or mobile audio behaviour — Playwright's
`pointerdown` in a `hasTouch` context is still a synthetic event, not a real
finger, and headless Chromium has no real audio output. **Test on a physical
phone before the cutoff**, and confirm real synthesised sound is audible.

## Audio safety and lifecycle

- [x] Only one AudioContext is created (`AudioEngine.ensureContext` caches
      `this.context`; only created lazily on first `noteOn`).
- [x] Oscillators are not created on every pointer-move event (Stage 1 has
      no pointer-move handling yet — one voice per pointer-down only).
- [x] Audio parameters change through smoothing or scheduled automation
      (`Voice` uses `linearRampToValueAtTime` for attack and release; no
      instantaneous `value =` assignment on the gain).
- [x] Released oscillators eventually stop and disconnect (`osc.stop()`
      scheduled after the release tail; nodes disconnect on the `ended`
      event).
- [x] Simultaneous voices are capped (`MAX_VOICES = 12` in `engine.ts`; the
      oldest voice is released when the cap is hit).
- [x] Master gain is conservative (`MASTER_GAIN = 0.7` into a
      `DynamicsCompressorNode`).
- [x] Compression prevents excessive peaks (compressor sits between master
      gain and destination).
- [ ] Delay feedback cannot self-oscillate — n/a to Stage 1, no delay/effects
      chain built yet (Stage 2/3 per `CRIT_BRIEF.md` "Effects").
- [x] Pointer cancellation releases the correct voice (`pointercancel` is
      wired to the same `release` handler as `pointerup`, keyed by
      `pointerId`).
- [ ] Hidden tab or lost focus releases held voices and keys — `blur`
      releases held **keyboard** notes; there is no
      `visibilitychange`/pointer equivalent yet, so a pointer held down when
      the tab is hidden would keep sounding. **Flagged as a gap to close in
      Stage 2/4, not fixed in this slice.**
- [ ] Extended play does not continuously increase CPU usage — not measured
      this stage (no long-running session tested).

Notes: The voice-cap "release oldest" path evicts from the live map
immediately rather than tracking it through its own release tail separately,
so a released-but-still-fading voice doesn't count against the cap. Left as
is for Stage 1 simplicity; worth revisiting if voice churn near the cap ever
sounds abrupt.

## Accessibility and comfort

- [ ] Keyboard input is supported.
- [ ] Reduced-motion preference is respected.
- [ ] There are no flashing visual effects.
- [ ] Fine pointer precision is unnecessary.
- [ ] Instructions do not rely on colour alone.
- [ ] Every sound gesture has immediate visual feedback.
- [ ] The instrument has a short accessible description.
- [ ] Sound and animation intensity remain comfortable during extended play.

Notes:

## Production deployment test

Test the public URL after deployment.

- [ ] Correct GitHub Pages URL opens.
- [ ] No blank page appears under the repository base path.
- [ ] JavaScript and styles load without 404 errors.
- [ ] First sound works on the deployed page.
- [ ] Refreshing a nested or derived URL does not expose routing problems.
- [ ] Latest reflection is present in the repository.
- [ ] PROCESS.md references real commits or compare ranges.
- [ ] Public repository contains the intended final commit.
- [ ] Full checks were green on the pushed revision.

URL:

Verified revision:

Date:

## Known issues and decisions

Record meaningful problems, not every cosmetic possibility.

| Issue | User impact | Decision or correction | Status |
| --- | --- | --- | --- |
| No `visibilitychange` handling | A pointer held down when the tab is hidden keeps its voice sounding until released | Deferred to Stage 2/4 (`CRIT_BRIEF.md` lists this under later stages); `blur` already covers the keyboard case | Open |
| No pointer-move / drag mapping yet | Dragging currently does nothing after the initial note — pitch is fixed at the pointer-down position | Correct for Stage 1 scope (brief: "pointer down starts a quantised note; pointer up releases it"); horizontal/vertical mapping during drag is explicitly Stage 2 | Open (by design) |
| Not tested on a physical phone | Chrome DevTools' 390×844 preset and Playwright touch emulation don't prove real touch/audio behaviour on a device | Test on a physical phone before the cutoff, per the template's own note in this file | Open |
| Not tested on real multi-touch hardware | Multi-touch was verified with synthetic `PointerEvent`s dispatched in a headless browser, not genuine simultaneous OS-level touches | Test two-finger (and more) chords on a physical touchscreen before the cutoff — same gap as the phone item above, called out separately because it's a distinct input path | Open |
| `setPointerCapture` could throw and silently drop a note (fixed) | Found while building the multi-touch test above: `setPointerCapture` on a pointer id the browser doesn't consider active throws `NotFoundError`, and it ran before `noteOn`/`addBloom`, so a capture failure meant no sound at all for that gesture | Wrapped the call in `try/catch` in `controller.ts` — capture is a nice-to-have for drags off the surface, not required for the note to fire | Fixed |
| Not listened to by a human | Click-freedom and "does it actually sound good" can't be verified by an automated/headless run | Do a real listening pass (desktop + phone speakers) before the crit | Open |
| `card.png` / description not customised for Echo Garden | `og:image` still points at the generic starter card image | Description meta was updated to describe Echo Garden; the card image itself was left untouched — cosmetic, not a contract requirement (invariant only checks presence) | Open |

## Crit preparation

Be ready to explain:

1. Why pentatonic quantisation supports “no way to play it wrong.”
2. Why the first playing gesture also unlocks AudioContext.
3. How pointer position, motion, duration, and multitouch create expression.
4. How the implementation prevents clicks, excessive volume, and leaked voices.
5. What changed after a cold-play or mobile test.
6. Which decisions came from the brief, which came from player observation,
   and which were proposed by the coding agent.
   