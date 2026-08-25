# Crit 4 Content Source — Echo Garden

## Product concept

Echo Garden is a one-screen browser instrument in which the player creates
sound by touching, clicking, dragging, or typing.

Each gesture creates a glowing bloom that corresponds to a live synthesised
voice. Horizontal position controls pitch, vertical position controls tone,
movement affects intensity, and gesture duration controls note length.

The instrument should feel inviting before it is understood. It must not
require the player to learn music theory, read a manual, keep time, or achieve
a score. The sound system should harmonise whatever the player does.

Core design principle:

> Instead of asking the player to learn the instrument, the instrument
> harmonises whatever the player does.

## Experience goal

A stranger opening the page should:

1. Notice that the dark surface invites touch.
2. make their first sound within a few seconds;
3. understand that different positions produce different sounds;
4. begin dragging, holding, typing, or using multiple fingers without being
   told to do so;
5. produce something musically coherent even through exploratory input.

The first interaction must simultaneously unlock the AudioContext and play a
note. Do not place a separate “Start audio” button in front of the instrument.

## Opening screen

Use a full-viewport dark field with subtle ambient movement.

Opening copy:

> Touch the dark  
> or press any letter

The primary sentence should be prominent. The secondary keyboard hint may be
smaller and should be hidden on touch-first mobile layouts if it adds clutter.

A few dim, slowly breathing particles may suggest that the surface is alive,
but they must not produce sound before a user gesture.

On the first valid pointer or keyboard interaction:

- create or resume the shared AudioContext;
- produce the requested note immediately;
- create visual feedback at the corresponding position;
- gently fade or reduce the opening copy;
- do not interrupt the first gesture with a modal, tutorial, or loading screen.

## Primary interaction model

### Pointer and touch

Use Pointer Events so mouse, pen, and touch share one implementation.

#### Pointer down

- Resume or initialise audio if necessary.
- Start one synthesised voice.
- Create one visual bloom at the pointer position.
- Capture the pointer so the note continues if it moves outside its starting
  location.
- Store the active voice by `pointerId`.

#### Pointer move while held

- Update the current voice rather than creating an unlimited number of voices.
- Horizontal movement changes pitch.
- Vertical movement changes filter brightness or timbre.
- Movement speed may increase brightness and visual energy.
- Smooth audio parameter changes to prevent clicks and unstable pitch jumps.
- Add visual trail points at a controlled rate.

#### Pointer up or cancel

- Release the voice through a short musical fade.
- Do not stop an oscillator abruptly.
- Release pointer capture and remove the active pointer record.
- Allow its bloom and trail to fade independently.

Multiple active pointer IDs should create multiple voices, allowing chords on
touchscreens.

### Keyboard

Keyboard interaction must be genuinely playable, not only a fallback that
always triggers the same sound.

Use the home-row letter keys:

`A S D F G H J K L`

Map them to ascending notes from the same scale used by pointer input.

- `keydown` starts a note.
- Ignore repeated `keydown` events while the key is already held.
- `keyup` releases that note.
- Several held keys create a chord.
- Do not hijack browser shortcuts involving Ctrl, Cmd, or Alt.
- Position keyboard-created blooms across the screen according to note pitch.

The opening copy may say “press any letter,” but unsupported alphabet keys may
be deterministically folded onto the available scale rather than doing
nothing. This makes exploratory keyboard input rewarding.

## Musical mapping

Use a consonant pentatonic pitch set so arbitrary gestures remain musical.

Suggested pitch classes:

`C, D, E, G, A`

Suggested playable range:

`C3` to `A5`

### Horizontal position

Map the normalised x-coordinate to discrete notes across the selected
pentatonic range.

Do not map x continuously to arbitrary frequencies for the primary design.
Quantisation is what makes untrained gestures remain harmonious.

Changing horizontal pitch during a drag should use a brief glide rather than
an instantaneous frequency jump.

### Vertical position

Use vertical position for timbre, not volume:

- near the top: brighter sound, higher filter cutoff, slightly more harmonic
  content;
- near the bottom: darker, rounder sound, lower filter cutoff.

The mapping should still sound intentional at both extremes.

### Gesture speed

Estimate velocity from recent pointer samples.

Faster motion may produce:

- a moderately brighter filter;
- a slightly stronger visual bloom;
- a small increase in loudness;
- a denser visual trail.

Clamp and smooth the value. Fast motion must not create a dangerous volume
spike.

### Gesture duration

Holding keeps the voice alive. Releasing applies a smooth tail.

The player should be able to make:

- short plucked notes through taps;
- sustained tones through holding;
- melodies through horizontal dragging;
- timbral expressions through vertical movement;
- chords through multitouch or multiple keyboard keys.

## Synthesis design

All sound must be generated live through the Web Audio API. Do not include
MP3, WAV, prerecorded samples, or rendered music.

Use one shared AudioContext for the entire application.

Suggested signal path for each voice:

`Oscillators → voice gain → low-pass filter → shared effects/master`

Suggested shared path:

`voices → dry master + subtle delay → compressor → master gain → destination`

### Voice construction

A voice may contain:

- a triangle oscillator at the selected fundamental frequency;
- a quieter sine oscillator one octave above;
- individual oscillator gain balancing;
- one BiquadFilterNode;
- one GainNode implementing the amplitude envelope.

The second oscillator is optional if it makes the instrument too bright or
muddy. Sound quality matters more than node count.

### Envelope

Use scheduled gain automation rather than abrupt value changes.

Starting shape:

- short attack, approximately 20–40 ms;
- gentle sustain level;
- release approximately 500–1200 ms.

Begin new gains close to zero. Cancel or safely replace scheduled parameter
changes before applying new ones.

### Effects

A subtle live delay may be created using DelayNode and feedback GainNode.

It should add space without turning every gesture into a dense wash. Feedback
must remain safely below self-oscillation.

Reverb is optional. Do not add fetched impulse-response audio because the
instrument must remain self-contained and because prerecorded assets are
unnecessary.

### Output safety

- Use a master DynamicsCompressorNode.
- Keep the master gain conservative.
- Limit the number of simultaneous or releasing voices.
- When the voice limit is reached, gracefully release the oldest voice.
- Do not let repeated pointer movement create a new oscillator per event.
- Stop and disconnect oscillators after their release envelope completes.
- Handle pointer cancellation and page visibility changes.
- Avoid audio clicks and sudden gain changes.

A practical maximum is approximately 12 simultaneous active/releasing voices,
subject to tuning.

## Visual system

The visual language should communicate the relationship between gesture and
sound.

### Bloom

Each active voice has a bloom positioned at its current input location.

A bloom should visually respond to:

- pitch through hue or colour family;
- timbre through sharpness, glow, or saturation;
- amplitude through size;
- release through shrinking and fading.

Do not encode crucial information through colour alone.

### Trail

Dragging creates a fading trail that makes melodic movement visible.

The trail must:

- follow the gesture smoothly;
- use a bounded number of points or particles;
- fade without accumulating indefinitely;
- avoid causing frame drops on mobile;
- preserve the immediate link between gesture and current sound.

Canvas is preferred if many particles are used. DOM elements are acceptable
if the total count is strictly controlled.

### Idle state

Before the first interaction, subtle non-interactive particles may breathe or
drift. They are an invitation, not an automated performance.

There must be no sound in the idle state.

### Visual restraint

The instrument is the interaction surface. Avoid:

- navigation bars;
- cards covering the play area;
- complex settings panels;
- long explanatory copy;
- visible scores or achievements;
- decorative controls that imply the player needs configuration before play.

## Responsive behaviour

The application must work at:

- 1920 × 1080 desktop;
- 390 × 844 phone.

Use dynamic viewport units where supported and provide a safe fallback.

The play surface should:

- occupy the available viewport;
- prevent accidental page scrolling while actively playing;
- respect safe-area insets;
- avoid hover-only instructions;
- remain usable in portrait orientation;
- not require landscape mode;
- keep opening copy readable without covering most of the phone screen.

Use `touch-action: none` only on the actual instrument surface, not
indiscriminately on unrelated content.

## Accessibility and alternate input

- Keyboard play must work from initial page load.
- Keep a visible focus treatment where focusable controls exist.
- Do not require fine pointer precision.
- Do not use flashing effects.
- Respect `prefers-reduced-motion` by simplifying particles and trails while
  preserving immediate note feedback.
- Provide an accessible name or short hidden description identifying the page
  as an interactive browser instrument.
- Opening instructions should remain understandable without relying on colour.
- Audio cannot be made fully accessible to all users through visuals alone,
  but every sound-producing gesture should have synchronised visual feedback.

## Error and edge-case behaviour

The player should not encounter a fail state.

Handle these cases gracefully:

- AudioContext is initially suspended.
- The first interaction is a keyboard event.
- Several fingers touch simultaneously.
- A pointer leaves the viewport.
- Pointer cancellation occurs.
- A key loses its `keyup` event when focus changes.
- The tab becomes hidden while notes are held.
- The player rapidly taps many times.
- The browser does not support one optional visual or audio feature.
- Reduced-motion mode is enabled.

If audio cannot be initialised, show a small non-judgemental retry message.
Do not present it as the player making a mistake.

## Technical structure

Adapt this structure to the existing starter rather than replacing working
project conventions unnecessarily.

Suggested responsibilities:

- `AudioEngine`
  - owns the single AudioContext;
  - owns shared effects and master nodes;
  - resumes audio from a gesture;
  - creates, updates, and releases voices;
  - enforces the voice limit;
  - performs cleanup.

- `Voice`
  - owns its oscillators, filter, and gain nodes;
  - updates frequency and timbre smoothly;
  - schedules release;
  - disconnects itself after completion.

- `InstrumentController`
  - handles Pointer Events and keyboard events;
  - maps input into pitch, timbre, velocity, and duration;
  - tracks pointer IDs and held keys;
  - sends musical values to AudioEngine;
  - sends visual state to the renderer.

- `GardenRenderer`
  - renders blooms, trails, and idle particles;
  - uses the same normalised interaction values as the audio mapping;
  - bounds and cleans visual objects;
  - respects reduced-motion preferences.

Keep mapping functions pure where practical so they can be tested without
starting an AudioContext.

## Implementation stages

### Stage 1 — First playable vertical slice

Build the smallest complete interaction:

- full-screen surface;
- opening invitation;
- one shared AudioContext;
- pointer down starts a quantised note;
- pointer up releases it;
- one matching visual bloom;
- keyboard can play at least the primary mapped keys;
- no audio files;
- existing checks remain green.

The purpose is to validate latency and feel before adding visual complexity.

### Stage 2 — Expressive mapping

Add:

- horizontal pitch mapping;
- vertical timbre mapping;
- smooth parameter automation;
- held-note keyboard tracking;
- pointer capture;
- multitouch voice tracking;
- safe output chain and voice cleanup.

Manually test whether contrasting gestures sound recognisably different.

### Stage 3 — Visual language

Add:

- pitch-linked bloom appearance;
- gesture-linked trails;
- release animation;
- restrained idle invitation;
- particle limits;
- reduced-motion behaviour.

Visual work must not delay or interfere with sound response.

### Stage 4 — Responsive and resilient behaviour

Test and correct:

- desktop viewport;
- phone viewport;
- touch scrolling;
- pointer cancellation;
- focus/visibility loss;
- rapid input;
- safe-area insets;
- resize and orientation changes;
- audio cleanup.

### Stage 5 — Evidence and deployment readiness

- Add relevant checkable tests without modifying away starter invariants.
- Run the full required check command.
- Perform the manual QA recorded in `CRIT_QA_NOTES.md`.
- Verify the production build under the repository base path.
- Verify the deployed GitHub Pages URL, not only localhost.
- Update PROCESS.md and the reflection separately from implementation.
- Preserve incremental commit history.

## Testing targets

Automated tests should verify stable, inspectable behaviour where possible:

- the page exposes an obvious opening invitation;
- the implementation contains no prerecorded audio elements or audio assets;
- one instrument surface supports pointer interaction;
- keyboard handlers exist;
- AudioContext creation is centralised;
- notes are mapped to a bounded musical scale;
- starter invariants remain untouched and passing;
- production output uses the expected GitHub Pages base path.

Do not pretend automated DOM tests can judge musical feel, latency, or whether
two players sound different. Record those findings through manual QA.

## Non-goals

Do not turn this into:

- a conventional piano keyboard;
- a professional synthesiser control panel;
- a step sequencer requiring instruction;
- a rhythm game;
- a scored experience;
- a generative song that plays without player input;
- a prerecorded soundtrack with visual reactions;
- a tutorial flow the player must complete;
- a large multi-page website.

## Definition of done

Echo Garden is ready when:

1. its first pointer or keyboard action immediately creates live sound;
2. a stranger can discover more than one expressive gesture without a manual;
3. position, movement, duration, and simultaneous input meaningfully affect
   the result;
4. arbitrary input remains musically coherent;
5. no sound occurs before user input;
6. mouse, keyboard, and touch all work;
7. audio and visual objects are bounded and cleaned up;
8. desktop and phone target viewports work cleanly;
9. all required checks pass;
10. the deployed GitHub Pages version has been played and verified.
