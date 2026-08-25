# Process overview

## Deployed url

https://comp4020-agentic-coding-studio.github.io/comp4020-crit4-Easton-Yi/

## What I built

Echo Garden: a browser instrument with no manual. The first tap, click, or
letter key resumes one shared `AudioContext` and immediately sings a
live-synthesised, pentatonic-quantised note, with a firework of small sparks
bursting from that spot, coloured by the note's pitch. Every input source —
mouse, touch, keyboard — shares the same pitch mapping, so a key's screen
position and a touch at that position always sound the same note, and
multiple fingers or keys sound independent, simultaneous voices.

## The moments that mattered

Stress-testing multi-touch with two simultaneous synthetic pointers surfaced
a real bug: `setPointerCapture` can throw `NotFoundError`, and that call ran
*before* `noteOn`/`addBloom` in the pointer handler, so a capture failure
silently killed the note — no sound, no visual, for a gesture the player
made correctly. The obvious fix would have been to keep testing until it
"passed," but the actual defect was ordering: capture is a convenience for
drags off the surface, not a precondition for sound, so I wrapped it in
`try/catch` instead of chasing why the synthetic event wasn't "active enough"
([`66149f2`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-Easton-Yi/commit/66149f2)).
Re-running the same two-pointer test afterwards, with zero console errors and
two independent bursts on screen, is what told me it had actually landed, not
just gone quiet.

The keyboard mapping was the other judgement call: the first design
([`838b43a`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-Easton-Yi/commit/838b43a))
mapped a key to a pitch by character code, arbitrary and disconnected from
the screen. I replaced it so `frequencyForKey` derives its note from the
exact same
`frequencyForPosition` a pointer touch would use at that key's real QWERTY
screen position, so the two input paths can never drift apart
([`66149f2`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-Easton-Yi/commit/66149f2)).
