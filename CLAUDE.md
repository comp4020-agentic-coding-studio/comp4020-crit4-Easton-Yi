# COMP4020 prototype

Your starter repo for a COMP4020 prototype: a static site in HTML/CSS/TypeScript
that builds to plain HTML/CSS/JS and deploys to GitHub Pages. The deployed site
is what gets marked, not this repo.

The
[course website](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/)
publishes this deliverable's brief and spec, and this repo's name tells you
which deliverable applies. Read both before you plan or build.

## How to work in here

- Keep the dev server running (`pnpm dev`) so you see changes as you make them.
- Run `pnpm check` before you push.
- Open the page in a browser and look at it. The rendered page is the truth;
  your mental model of it isn't.
- When a check fails, read its output before you change anything.
- Never commit a red state.

## The link-preview card

`public/card.png` (1200x630) is the image a shared link shows; `index.html`'s
head points at it. Replace it and the `description` meta, and copy the head
block into any new page. The card URL resolves against the page that names it,
like any link --- `./card.png` is wrong one directory down, and nothing in CI
checks it, so look at the deployed head when you add pages.

## The checks

`pnpm check` runs them (`pnpm check:evidence` is the extra gate before you
ship); CI runs the same plus links, secrets and the deploy. Read the failure.

`spec/README.md`, `PROCESS.md` and `reflections/README.md` are in this repo and
say what they are for.

## This file is yours

A starting point, not a rulebook. As you learn what your prototype needs --- a
convention the work has to hold to, a sensor that keeps catching you out (a
linter, say), a fact about the stack that is easy to get wrong --- write it down
here and wire it into `check`. Growing this file is the work.

## Carried forward from prior prototypes

These are general working conventions that held up across earlier weeks
(carried forward from `comp4020-ass1-Easton-Yi`), not specific to any one
prototype's content:

- **Direct orders.** A prompt phrased as a direct, short imperative
  ("change X to Y") should be executed exactly as stated, without further
  unrequested changes or redesign.
- **A claim of success needs more than a green check.** `pnpm check` passing
  is necessary but not sufficient --- for anything the visitor experiences
  (visual, audio, interaction), back the claim with direct inspection: open
  it in a browser (or Playwright's Chromium, `npx playwright install
  chromium`, when a live browser tool isn't reachable) and actually look at
  or listen to it before saying it works. A value that looks plausible on
  paper (a stroke-width in the wrong units, a gain node at the wrong scale)
  can silently produce nothing while every automated check still passes.
- **Both marking viewports, every time.** Any visual/behavioural check is
  done at both **1920×1080** (desktop) and **390×844** (phone) --- a broken
  phone layout is not a partial pass. Watch for horizontal overflow at
  either (`document.documentElement.scrollWidth <= clientWidth`).
- **Keyboard reachability.** Every interactive state should be reachable
  without a mouse (tab order, keyboard equivalents for pointer gestures),
  and `prefers-reduced-motion: reduce` should drop non-essential motion
  without removing any discrete state or content.
- **Base path.** The production build must work from this repo's GitHub
  Pages base path, not an absolute `/`-rooted asset path --- this bit
  Assignment 1 when a generator needed `base` set explicitly.
