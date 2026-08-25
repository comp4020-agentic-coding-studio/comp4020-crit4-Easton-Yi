// One sounding note. CONTENT_SOURCE.md "Voice construction" / "Envelope":
// triangle + a quieter octave-up sine, one filter, scheduled gain automation
// rather than abrupt value changes so starts and releases don't click.

const ATTACK_SECONDS = 0.03;
const SUSTAIN_LEVEL = 0.22;
const RELEASE_SECONDS = 0.8;
const OCTAVE_GAIN = 0.25;
const FILTER_FREQUENCY = 2200; // fixed for stage 1 — vertical mapping comes later

export class Voice {
  private readonly context: AudioContext;
  private readonly fundamental: OscillatorNode;
  private readonly octave: OscillatorNode;
  private readonly filter: BiquadFilterNode;
  private readonly amplitude: GainNode;
  private released = false;

  constructor(context: AudioContext, destination: AudioNode, frequency: number) {
    this.context = context;
    const now = context.currentTime;

    this.fundamental = context.createOscillator();
    this.fundamental.type = "triangle";
    this.fundamental.frequency.setValueAtTime(frequency, now);

    this.octave = context.createOscillator();
    this.octave.type = "sine";
    this.octave.frequency.setValueAtTime(frequency * 2, now);
    const octaveGain = context.createGain();
    octaveGain.gain.value = OCTAVE_GAIN;

    this.filter = context.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.setValueAtTime(FILTER_FREQUENCY, now);

    this.amplitude = context.createGain();
    this.amplitude.gain.setValueAtTime(0, now);
    this.amplitude.gain.linearRampToValueAtTime(SUSTAIN_LEVEL, now + ATTACK_SECONDS);

    this.fundamental.connect(this.filter);
    this.octave.connect(octaveGain).connect(this.filter);
    this.filter.connect(this.amplitude).connect(destination);

    this.fundamental.start(now);
    this.octave.start(now);
  }

  /** Smooth fade rather than an abrupt stop, then disconnects everything once
   * the tail finishes. Safe to call more than once. */
  release(): void {
    if (this.released) return;
    this.released = true;

    const now = this.context.currentTime;
    const gain = this.amplitude.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(0, now + RELEASE_SECONDS);

    const stopAt = now + RELEASE_SECONDS + 0.05;
    this.fundamental.stop(stopAt);
    this.octave.stop(stopAt);
    this.fundamental.addEventListener("ended", () => this.disconnect());
  }

  private disconnect(): void {
    this.fundamental.disconnect();
    this.octave.disconnect();
    this.filter.disconnect();
    this.amplitude.disconnect();
  }
}
