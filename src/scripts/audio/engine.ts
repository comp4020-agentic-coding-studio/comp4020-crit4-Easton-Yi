// Owns the single shared AudioContext. CONTENT_SOURCE.md "Synthesis design":
// one shared AudioContext, a conservative master chain, and a voice cap so
// exploratory input can't produce a dangerous or runaway result.
import { Voice } from "./voice";

const MASTER_GAIN = 0.7;
const MAX_VOICES = 12;

type AudioContextConstructor = typeof AudioContext;

function resolveAudioContextConstructor(): AudioContextConstructor | undefined {
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextConstructor })
      .webkitAudioContext
  );
}

export class AudioEngine {
  private context: AudioContext | undefined;
  private master: GainNode | undefined;
  private readonly voices = new Map<string, Voice>();
  private readonly voiceOrder: string[] = [];
  private unavailable = false;

  /** Whether audio failed to initialise (unsupported browser, blocked, etc). */
  isUnavailable(): boolean {
    return this.unavailable;
  }

  private ensureContext(): AudioContext | undefined {
    if (this.context) return this.context;

    const Ctor = resolveAudioContextConstructor();
    if (!Ctor) {
      this.unavailable = true;
      return undefined;
    }

    try {
      this.context = new Ctor();
      const compressor = this.context.createDynamicsCompressor();
      this.master = this.context.createGain();
      this.master.gain.value = MASTER_GAIN;
      this.master.connect(compressor).connect(this.context.destination);
    } catch {
      this.unavailable = true;
      this.context = undefined;
    }
    return this.context;
  }

  /** Called from a user gesture handler. Resuming is async, but the
   * oscillator below is still scheduled at `currentTime` synchronously, so
   * the first gesture's note is never lost while the promise settles. */
  private resume(context: AudioContext): void {
    if (context.state === "suspended") {
      void context.resume();
    }
  }

  /** Starts a quantised note for `id` (a pointerId or key), replacing any
   * existing voice under the same id. */
  noteOn(id: string, frequency: number): void {
    const context = this.ensureContext();
    if (!context || !this.master) return;
    this.resume(context);

    this.noteOff(id);

    if (this.voiceOrder.length >= MAX_VOICES) {
      const oldestId = this.voiceOrder.shift();
      if (oldestId) this.voices.get(oldestId)?.release();
      if (oldestId) this.voices.delete(oldestId);
    }

    this.voices.set(id, new Voice(context, this.master, frequency));
    this.voiceOrder.push(id);
  }

  /** Releases the note for `id` through its fade tail. Safe if none exists. */
  noteOff(id: string): void {
    const voice = this.voices.get(id);
    if (!voice) return;
    voice.release();
    this.voices.delete(id);
    const orderIndex = this.voiceOrder.indexOf(id);
    if (orderIndex !== -1) this.voiceOrder.splice(orderIndex, 1);
  }
}
