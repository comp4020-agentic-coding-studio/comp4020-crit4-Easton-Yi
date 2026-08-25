// Minimal bloom renderer for stage 1: one glowing circle per active voice,
// positioned to match the gesture that made the sound. Trails, pitch-linked
// colour and idle particles are stage 3 (CONTENT_SOURCE.md "Visual system").
const ACTIVE_RADIUS = 46;
const RELEASE_MS = 800; // matches the audio release tail in audio/voice.ts

interface Bloom {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  releasing: boolean;
  releaseStarted: number;
}

export class GardenRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly blooms = new Map<string, Bloom>();
  private readonly reducedMotion: boolean;
  private frame: number | undefined;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("2D canvas context unavailable");
    this.ctx = context;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;

    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.loop();
  }

  private resize(): void {
    const ratio = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * ratio;
    this.canvas.height = window.innerHeight * ratio;
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  /** Places a bloom at a normalised (0–1, 0–1) position for an active voice. */
  addBloom(id: string, normalisedX: number, normalisedY: number): void {
    this.blooms.set(id, {
      x: normalisedX * window.innerWidth,
      y: normalisedY * window.innerHeight,
      radius: ACTIVE_RADIUS,
      alpha: 0.85,
      releasing: false,
      releaseStarted: 0,
    });
  }

  /** Moves an already-active bloom, e.g. while a pointer drags. */
  moveBloom(id: string, normalisedX: number, normalisedY: number): void {
    const bloom = this.blooms.get(id);
    if (!bloom || bloom.releasing) return;
    bloom.x = normalisedX * window.innerWidth;
    bloom.y = normalisedY * window.innerHeight;
  }

  /** Starts a bloom's fade so it dies alongside its voice's release tail. */
  releaseBloom(id: string): void {
    const bloom = this.blooms.get(id);
    if (!bloom) return;
    bloom.releasing = true;
    bloom.releaseStarted = performance.now();
  }

  private loop = (): void => {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const [id, bloom] of this.blooms) {
      if (bloom.releasing) {
        const elapsed = performance.now() - bloom.releaseStarted;
        const progress = this.reducedMotion ? 1 : Math.min(1, elapsed / RELEASE_MS);
        bloom.alpha = 0.85 * (1 - progress);
        bloom.radius = ACTIVE_RADIUS * (1 - progress * 0.5);
        if (progress >= 1) this.blooms.delete(id);
      }

      if (bloom.alpha <= 0) continue;
      ctx.beginPath();
      ctx.fillStyle = `rgba(140, 210, 255, ${bloom.alpha})`;
      ctx.shadowColor = "rgba(140, 210, 255, 0.6)";
      ctx.shadowBlur = this.reducedMotion ? 0 : 24;
      ctx.arc(bloom.x, bloom.y, bloom.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    this.frame = requestAnimationFrame(this.loop);
  };

  destroy(): void {
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
  }
}
