// Pure musical mapping — no AudioContext dependency, so it's testable without
// starting audio. CONTENT_SOURCE.md: "consonant pentatonic pitch set... C3 to
// A5" and "quantisation is what makes untrained gestures remain harmonious."

const A4_FREQUENCY = 440;
const A4_MIDI = 69;
const LOW_MIDI = 48; // C3
const HIGH_MIDI = 81; // A5
const PENTATONIC_SEMITONES = new Set([0, 2, 4, 7, 9]); // C D E G A

function midiToFrequency(midi: number): number {
  return A4_FREQUENCY * 2 ** ((midi - A4_MIDI) / 12);
}

/** Ascending frequencies of the C-major pentatonic scale from C3 to A5. */
export function buildPentatonicScale(
  lowMidi = LOW_MIDI,
  highMidi = HIGH_MIDI,
): number[] {
  const frequencies: number[] = [];
  for (let midi = lowMidi; midi <= highMidi; midi++) {
    if (PENTATONIC_SEMITONES.has(((midi % 12) + 12) % 12)) {
      frequencies.push(midiToFrequency(midi));
    }
  }
  return frequencies;
}

const SCALE = buildPentatonicScale();

/** The shared scale every input source quantises onto. */
export function scaleFrequencies(): readonly number[] {
  return SCALE;
}

/** Quantises a normalised horizontal position (0–1, clamped) onto the scale. */
export function frequencyForPosition(
  normalisedX: number,
  frequencies: readonly number[] = SCALE,
): number {
  const clamped = Math.min(1, Math.max(0, normalisedX));
  const index = Math.min(
    frequencies.length - 1,
    Math.floor(clamped * frequencies.length),
  );
  return frequencies[index];
}

/** Folds any single a-z key deterministically onto the scale, so exploratory
 * typing is always rewarded rather than silent for unmapped letters. */
export function frequencyForKey(
  key: string,
  frequencies: readonly number[] = SCALE,
): number | undefined {
  const lower = key.toLowerCase();
  if (lower.length !== 1 || lower < "a" || lower > "z") return undefined;
  const index = (lower.charCodeAt(0) - "a".charCodeAt(0)) % frequencies.length;
  return frequencies[index];
}

/** Normalised (0–1) position for a key, for placing keyboard-triggered
 * blooms across the screen by pitch — same axis pointer input uses. */
export function positionForKey(
  key: string,
  frequencies: readonly number[] = SCALE,
): number | undefined {
  const lower = key.toLowerCase();
  if (lower.length !== 1 || lower < "a" || lower > "z") return undefined;
  const index = (lower.charCodeAt(0) - "a".charCodeAt(0)) % frequencies.length;
  return frequencies.length <= 1 ? 0 : index / (frequencies.length - 1);
}
