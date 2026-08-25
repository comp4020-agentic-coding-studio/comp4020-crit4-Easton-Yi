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

/** Maps a note's position in the scale to a hue (low notes cyan, high notes
 * magenta), so the visual colour of a bloom corresponds to its pitch. */
export function hueForFrequency(
  frequency: number,
  frequencies: readonly number[] = SCALE,
): number {
  const index = frequencies.indexOf(frequency);
  const clampedIndex = index === -1 ? 0 : index;
  const span = frequencies.length - 1;
  const t = span <= 0 ? 0 : clampedIndex / span;
  return 180 + t * 180;
}

// Keyboard-to-screen mapping: every letter key sits at the normalised (x, y)
// position it physically occupies on a QWERTY keyboard, so pressing a key
// plays the note a pointer touching that same screen position would play.
// Row offsets approximate real keyboard stagger (each row shifts right
// slightly going down), so left-to-right order within a row matches
// left-to-right order on the physical keys.
const KEYBOARD_ROWS = [
  { keys: "qwertyuiop", offset: 0 },
  { keys: "asdfghjkl", offset: 0.5 },
  { keys: "zxcvbnm", offset: 1 },
];

interface KeyPosition {
  x: number;
  y: number;
}

function buildKeyPositions(): Map<string, KeyPosition> {
  const rawExtent = Math.max(
    ...KEYBOARD_ROWS.map((row) => row.offset + row.keys.length - 1),
  );
  const positions = new Map<string, KeyPosition>();

  KEYBOARD_ROWS.forEach((row, rowIndex) => {
    const y = (rowIndex + 0.5) / KEYBOARD_ROWS.length;
    [...row.keys].forEach((key, columnIndex) => {
      const x = (columnIndex + row.offset) / rawExtent;
      positions.set(key, { x, y });
    });
  });

  return positions;
}

const KEY_POSITIONS = buildKeyPositions();

/** The normalised screen position a letter key physically occupies on a
 * QWERTY keyboard, or undefined for a key outside the three letter rows. */
export function keyboardPositionForKey(key: string): KeyPosition | undefined {
  const lower = key.toLowerCase();
  if (lower.length !== 1) return undefined;
  return KEY_POSITIONS.get(lower);
}

/** The note a key plays: whatever note a pointer touching that key's mapped
 * screen position would play, so keyboard and pointer input share one
 * mapping (docs/CONTENT_SOURCE.md: "the same scale used by pointer input"). */
export function frequencyForKey(
  key: string,
  frequencies: readonly number[] = SCALE,
): number | undefined {
  const position = keyboardPositionForKey(key);
  if (!position) return undefined;
  return frequencyForPosition(position.x, frequencies);
}
