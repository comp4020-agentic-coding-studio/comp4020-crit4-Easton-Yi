# Crit 4 — "An instrument"

Source: <https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/crits/04-instrument/>
(week 5). Fetched from the live course API on 2026-08-25; this file is a
snapshot — re-check the page before relying on it near the cutoff.

> Turn the browser into a musical instrument — something a stranger can pick
> up and play.

## The brief

Interpret *instrument* as broadly as you like: a theremin driven by the mouse,
a drum machine, a step sequencer, wind chimes that never repeat, a keyboard
that plays chords — if a person acts and the page sounds, it counts. The
[Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
does the synthesis, it's all client-side, and the whole thing ships straight
to GitHub Pages.

The building blocks are few: an
[`OscillatorNode`](https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode)
or an
[`AudioBufferSourceNode`](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode)
through a
[`GainNode`](https://developer.mozilla.org/en-US/docs/Web/API/GainNode), all
hung off one
[`AudioContext`](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext)
and driven by
[pointer](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) or
[keyboard](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)
events. The context starts **suspended** until a user gesture resumes it (the
[autoplay policy](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)),
so nothing should sound before the player's first tap. MDN's
[simple synth](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Simple_synth)
is a worked example.

## The spec (mechanically-and-judgementally checkable contract)

These are the exact lines the course API publishes for this crit — the fixed
contract markers judge against:

1. **Deployed and live** at its public GitHub Pages URL by the cutoff.
2. **The browser is the instrument** — sound is made live in the page by the
   player, not played back (no pre-rendered audio file standing in for
   synthesis).
3. **It is expressive**: the player's choices shape what they hear, and two
   players sound different.
4. **A stranger can play it uninstructed** — the opening screen invites the
   first sound (no manual required).
5. **Playable with whatever is at hand** — mouse, keyboard, or touch.
6. **There is no way to play it wrong** — no score, no fail state.
7. **The starter's invariant checks pass** (`spec/invariants.test.ts` via
   `pnpm check`).
8. **The repo shows the process** — commits that grew with the work, a
   process overview in `PROCESS.md`, and the week's reflection in
   `reflections/crit-4.md`.
9. **You can account for how you directed, grounded and corrected the work**
   (asked live, in the crit).

## What "good" looks like, per the brief

- The bar is **playability**, not sound design polish: the player's choices
  shape what they hear, two people at the same page sound different, and
  there's no way to get it wrong.
- Latency, feel, and whether a gesture is expressive or exhausting don't show
  up in a test suite or a Lighthouse score — that judgement is for the crit,
  not `pnpm check`.
- This week's crit opens cold: the pod plays the instrument before anyone
  explains it, then discusses the sound and interaction, then the author can
  talk.

## What you submit (course-wide, from `topics/assessment`)

Every crit repo holds:

- **The prototype** — source that builds and deploys to the live GitHub Pages
  URL (`comp4020-agentic-coding-studio.github.io/<repo>/` up to crit 7).
- **The checks** (`spec/`) — the starter's always-on invariants plus your own
  tests turning this week's checkable spec lines into assertions. Green
  checks at the sweep are worth half of the week's shipped mark.
- **Your reflection** (`reflections/crit-4.md`) — answers to the two standing
  prompts (*what was the breakthrough that moved the work forward?* and *what
  did this change about who I want to be as a developer?*), **150–300
  words**, must exist by the cutoff for the shipped mark.
- **Your process overview** (`PROCESS.md`) — one paragraph on what you built,
  then the moments that mattered, each citing a commit hash/range linked to
  its GitHub commit or compare URL. **150–300 words** for a crit week's
  `PROCESS.md`, one or two moments. `pnpm check:evidence` verifies the
  bundle.
- **Your `CLAUDE.md`** — the harness, carried forward and grown.
- **Your commit history** — should show incremental growth, not one dump.

## Marking environment

Assessed live in **the latest stable Chrome**, at two viewports — both must
work cleanly:

- **1920×1080** (desktop)
- **390×844** (phone — the iPhone preset in Chrome DevTools' device toolbar)

## How the crit mark works (2% total, two independent halves)

- **Shipped mark (1 point)** — scored by an automated sweep starting 15
  minutes after the cutoff: pushed to the repo, live at the derived URL, that
  week's `reflections/` entry present.
  - **1** — all three, and checks were green at sweep time.
  - **0.5** — all three, but checks red/still-running/absent.
  - **0** — any of the three missing.
- **Contribution mark (1 point)** — set by the tutor from the session, not
  the repo: presented the prototype (or gave a frank account if nothing
  shipped), gave real critique, worked the riff, could account for how the
  agent produced the work.
  - **1** full participation; **0.5** present but none of that; **0** absent
    (which zeroes the whole crit, both halves).
- **Cutoff** is two hours before the session: reflection due, repo goes
  public, building stops.
- **Nothing live is not zero on everything** — say so at the pod; the shipped
  mark is 0 but the contribution mark stays fully open.

## Restrictions / non-negotiables

- **No late submissions** — the sweep runs from what's pushed by the cutoff
  plus the crit's own timing; there is no grace mechanism beyond the 15-minute
  sweep-start delay baked into the sweep timing itself.
- **The deployed artefact is what's marked**, not a local build — "works on
  my machine" doesn't count.
- **No pre-rendered/playback audio** substituting for live synthesis — sound
  must be generated in the browser in response to the player.
- **No score, no fail state** — anything gamifying "winning" the instrument
  is off-brief for this week (contrast with crit 5, "a game").
- Custom domains are not supported as the submission URL — the derived
  GitHub Pages URL is the URL of record.

## Related pages

- [Studio crit model](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/studio-crit-model/) — full mechanics of the session and marking.
- [Assessment](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/) — what you submit, marking environment, word counts.
- [Week 4 lecture](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/lectures/week-4/) — related lecture content.
