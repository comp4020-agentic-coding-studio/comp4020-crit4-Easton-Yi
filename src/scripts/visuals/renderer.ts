// Bloom renderer for stage 1: each note fires a small firework burst from the
// gesture's position, coloured by its pitch (CONTENT_SOURCE.md "Visual
// system": colour tied to the note). A held note keeps sparking gently; a
// release sends up one last finale burst before the sparks fall dark. Trails
// and idle particles remain stage 3.
const GRAVITY = 260; // px/s^2, pulls sparks down like real fireworks
const DRAG = 0.988; // per-frame velocity decay
const CORE_RADIUS = 10;
const RELEASE_MS = 800; // matches the audio release tail in audio/voice.ts
const BURST_COUNT = 22;
const FINALE_COUNT = 14;
const TRICKLE_INTERVAL_MS = 140;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 1 → 0
  maxLifeMs: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

interface Bloom {
  x: number;
  y: number;
  hue: number;
  coreAlpha: number;
  releasing: boolean;
  releaseStarted: number;
  finaleFired: boolean;
  lastEmit: number;
  particles: Particle[];
}

function spawnParticle(x: number, y: number, speedMin: number, speedMax: number): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = speedMin + Math.random() * (speedMax - speedMin);
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 1,
    maxLifeMs: 500 + Math.random() * 500,
    size: 2.5 + Math.random() * 3,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 6,
  };
}

function drawSparkle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  alpha: number,
  hue: number,
  rotation: number,
  glow: boolean,
): void {
  const spikes = 4;
  const outerRadius = size;
  const innerRadius = size * 0.35;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (Math.PI / spikes) * i;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = `hsla(${hue}, 90%, 78%, ${alpha})`;
  if (glow) {
    ctx.shadowColor = `hsla(${hue}, 100%, 70%, ${alpha * 0.8})`;
    ctx.shadowBlur = 10;
  }
  ctx.fill();
  ctx.restore();
}

export class GardenRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly blooms = new Map<string, Bloom>();
  private readonly reducedMotion: boolean;
  private frame: number | undefined;
  private lastFrameTime: number | undefined;

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

  /** Fires a firework burst at a normalised (0–1, 0–1) position for an
   * active voice, coloured by the hue of the note it plays. */
  addBloom(id: string, normalisedX: number, normalisedY: number, hue = 200): void {
    const x = normalisedX * window.innerWidth;
    const y = normalisedY * window.innerHeight;
    const particles = this.reducedMotion
      ? []
      : Array.from({ length: BURST_COUNT }, () => spawnParticle(x, y, 60, 260));

    this.blooms.set(id, {
      x,
      y,
      hue,
      coreAlpha: 0.9,
      releasing: false,
      releaseStarted: 0,
      finaleFired: false,
      lastEmit: performance.now(),
      particles,
    });
  }

  /** Moves an already-active bloom, e.g. while a pointer drags. */
  moveBloom(id: string, normalisedX: number, normalisedY: number): void {
    const bloom = this.blooms.get(id);
    if (!bloom || bloom.releasing) return;
    bloom.x = normalisedX * window.innerWidth;
    bloom.y = normalisedY * window.innerHeight;
  }

  /** Starts a bloom's release: one finale burst, then the sparks fall dark. */
  releaseBloom(id: string): void {
    const bloom = this.blooms.get(id);
    if (!bloom) return;
    bloom.releasing = true;
    bloom.releaseStarted = performance.now();
  }

  private loop = (now?: number): void => {
    const time = now ?? performance.now();
    const dt = this.lastFrameTime === undefined
      ? 0
      : Math.min(0.05, (time - this.lastFrameTime) / 1000);
    this.lastFrameTime = time;

    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const [id, bloom] of this.blooms) {
      if (bloom.releasing) {
        const elapsed = time - bloom.releaseStarted;
        const progress = this.reducedMotion ? 1 : Math.min(1, elapsed / RELEASE_MS);
        bloom.coreAlpha = 0.9 * (1 - progress);

        if (!bloom.finaleFired && !this.reducedMotion) {
          bloom.finaleFired = true;
          for (let i = 0; i < FINALE_COUNT; i++) {
            bloom.particles.push(spawnParticle(bloom.x, bloom.y, 100, 320));
          }
        }
      } else if (!this.reducedMotion && time - bloom.lastEmit > TRICKLE_INTERVAL_MS) {
        bloom.lastEmit = time;
        bloom.particles.push(spawnParticle(bloom.x, bloom.y, 20, 70));
      }

      for (const particle of bloom.particles) {
        particle.vy += GRAVITY * dt;
        particle.vx *= DRAG;
        particle.vy *= DRAG;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.rotation += particle.rotationSpeed * dt;
        particle.life -= (dt * 1000) / particle.maxLifeMs;
      }
      bloom.particles = bloom.particles.filter((particle) => particle.life > 0);

      for (const particle of bloom.particles) {
        drawSparkle(
          ctx,
          particle.x,
          particle.y,
          particle.size * (0.4 + particle.life * 0.6),
          particle.life,
          bloom.hue,
          particle.rotation,
          true,
        );
      }

      if (bloom.coreAlpha > 0) {
        ctx.beginPath();
        ctx.fillStyle = `hsla(${bloom.hue}, 90%, 78%, ${bloom.coreAlpha})`;
        ctx.shadowColor = `hsla(${bloom.hue}, 100%, 70%, ${bloom.coreAlpha * 0.7})`;
        ctx.shadowBlur = this.reducedMotion ? 0 : 16;
        ctx.arc(bloom.x, bloom.y, CORE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }

      if (bloom.releasing && bloom.coreAlpha <= 0 && bloom.particles.length === 0) {
        this.blooms.delete(id);
      }
    }

    this.frame = requestAnimationFrame(this.loop);
  };

  destroy(): void {
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
  }
}
