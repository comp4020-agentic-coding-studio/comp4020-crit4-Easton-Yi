// Maps raw input into musical values and forwards them to the audio engine
// and renderer. CONTENT_SOURCE.md "Primary interaction model": pointer down
// starts a voice and captures the pointer; keyboard keydown/keyup start and
// release a note per key, ignoring repeats and browser-shortcut modifiers.
import type { AudioEngine } from "../audio/engine";
import { frequencyForKey, frequencyForPosition, positionForKey } from "../audio/scale";
import type { GardenRenderer } from "../visuals/renderer";

const CENTER_Y = 0.5; // vertical (timbre) mapping is stage 2

export class InstrumentController {
  private readonly surface: HTMLElement;
  private readonly audio: AudioEngine;
  private readonly renderer: GardenRenderer;
  private readonly heldKeys = new Set<string>();
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

      this.surface.setPointerCapture(event.pointerId);
      this.audio.noteOn(id, frequency);
      this.renderer.addBloom(id, x, y);
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

      const frequency = frequencyForKey(event.key);
      const position = positionForKey(event.key);
      if (frequency === undefined || position === undefined) return;

      const id = `key-${event.key.toLowerCase()}`;
      if (this.heldKeys.has(id)) return;
      this.heldKeys.add(id);

      this.audio.noteOn(id, frequency);
      this.renderer.addBloom(id, position, CENTER_Y);
      this.fireFirstSound();
    });

    window.addEventListener("keyup", (event) => {
      const id = `key-${event.key.toLowerCase()}`;
      if (!this.heldKeys.has(id)) return;
      this.heldKeys.delete(id);
      this.audio.noteOff(id);
      this.renderer.releaseBloom(id);
    });

    // A key can lose its keyup if focus moves elsewhere first — release
    // anything still held rather than leaving a hanging note.
    window.addEventListener("blur", () => {
      for (const id of this.heldKeys) {
        this.audio.noteOff(id);
        this.renderer.releaseBloom(id);
      }
      this.heldKeys.clear();
    });
  }
}
