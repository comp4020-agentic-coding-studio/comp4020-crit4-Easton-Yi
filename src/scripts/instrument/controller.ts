// Maps raw input into musical values and forwards them to the audio engine
// and renderer. CONTENT_SOURCE.md "Primary interaction model": pointer down
// starts a voice and captures the pointer; keyboard keydown/keyup start and
// release a note per key, ignoring repeats and browser-shortcut modifiers.
import type { AudioEngine } from "../audio/engine";
import {
  frequencyForPosition,
  hueForFrequency,
  keyboardPositionForKey,
} from "../audio/scale";
import type { GardenRenderer } from "../visuals/renderer";

// A player has (at most) ten fingers — cap concurrently held keyboard notes
// there so a forearm on the keys or a stuck key doesn't pile up voices
// forever. Pointers/touches are already bounded by the AudioEngine's own
// voice cap, keyed independently by pointerId.
const MAX_CONCURRENT_KEYS = 10;

export class InstrumentController {
  private readonly surface: HTMLElement;
  private readonly audio: AudioEngine;
  private readonly renderer: GardenRenderer;
  private readonly heldKeys = new Set<string>();
  private readonly heldKeyOrder: string[] = [];
  private onFirstSound: (() => void) | undefined;
  private firstSoundFired = false;

  constructor(surface: HTMLElement, audio: AudioEngine, renderer: GardenRenderer) {
    this.surface = surface;
    this.audio = audio;
    this.renderer = renderer;
    this.bindPointer();
    this.bindKeyboard();
  }

  /** Fires once, on the very first note produced by any input source. */
  notifyFirstSound(callback: () => void): void {
    this.onFirstSound = callback;
  }

  private fireFirstSound(): void {
    if (this.firstSoundFired) return;
    this.firstSoundFired = true;
    this.onFirstSound?.();
  }

  private bindPointer(): void {
    this.surface.addEventListener("pointerdown", (event) => {
      const id = `pointer-${event.pointerId}`;
      const x = event.clientX / window.innerWidth;
      const y = event.clientY / window.innerHeight;
      const frequency = frequencyForPosition(x);

      try {
        this.surface.setPointerCapture(event.pointerId);
      } catch {
        // Capture can fail (e.g. a pointer id the browser no longer
        // considers active) — the note must still play; capture only keeps
        // events flowing if the finger later drags off the surface.
      }
      this.audio.noteOn(id, frequency);
      this.renderer.addBloom(id, x, y, hueForFrequency(frequency));
      this.fireFirstSound();
    });

    const release = (event: PointerEvent) => {
      const id = `pointer-${event.pointerId}`;
      this.audio.noteOff(id);
      this.renderer.releaseBloom(id);
      if (this.surface.hasPointerCapture(event.pointerId)) {
        this.surface.releasePointerCapture(event.pointerId);
      }
    };

    this.surface.addEventListener("pointerup", release);
    this.surface.addEventListener("pointercancel", release);
  }

  private bindKeyboard(): void {
    window.addEventListener("keydown", (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.repeat) return;

      const position = keyboardPositionForKey(event.key);
      if (!position) return;

      const id = `key-${event.key.toLowerCase()}`;
      if (this.heldKeys.has(id)) return;

      if (this.heldKeyOrder.length >= MAX_CONCURRENT_KEYS) {
        this.releaseKey(this.heldKeyOrder[0]);
      }

      this.heldKeys.add(id);
      this.heldKeyOrder.push(id);

      const frequency = frequencyForPosition(position.x);
      this.audio.noteOn(id, frequency);
      this.renderer.addBloom(id, position.x, position.y, hueForFrequency(frequency));
      this.fireFirstSound();
    });

    window.addEventListener("keyup", (event) => {
      this.releaseKey(`key-${event.key.toLowerCase()}`);
    });

    // A key can lose its keyup if focus moves elsewhere first — release
    // anything still held rather than leaving a hanging note.
    window.addEventListener("blur", () => {
      for (const id of [...this.heldKeyOrder]) this.releaseKey(id);
    });
  }

  private releaseKey(id: string): void {
    if (!this.heldKeys.has(id)) return;
    this.heldKeys.delete(id);
    const orderIndex = this.heldKeyOrder.indexOf(id);
    if (orderIndex !== -1) this.heldKeyOrder.splice(orderIndex, 1);
    this.audio.noteOff(id);
    this.renderer.releaseBloom(id);
  }
}
