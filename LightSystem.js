export default class LightSystem {
  constructor(bounds, rayCount = 20, rayWidth = 6) {
    this.bounds = bounds;
    this.rayCount = rayCount;
    this.rayWidth = rayWidth;
    this.spreadDegrees = 140;
    this.spreadMultiplier = 1.2;
    this.blockStrength = 0.32;
    this.lightMap = new Array(rayCount).fill(1);
  }

  getSource() {
    const { left, right, top } = this.bounds;
    return {
      x: (left + right) * 0.5,
      y: top + 4,
    };
  }

  getRayAngle(index) {
    if (this.rayCount <= 1) return Math.PI * 0.5;

    const spreadRadians = (this.spreadDegrees * Math.PI) / 180;
    const start = Math.PI * 0.5 - spreadRadians * 0.5;
    const step = spreadRadians / (this.rayCount - 1);
    return start + index * step;
  }

  getRaySegment(index) {
    const { top, bottom, left, right } = this.bounds;
    const source = this.getSource();
    const angle = this.getRayAngle(index);
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const candidates = [];

    if (dx > 0) candidates.push((right - source.x) / dx);
    if (dx < 0) candidates.push((left - source.x) / dx);
    if (dy > 0) candidates.push((bottom - source.y) / dy);
    if (dy < 0) candidates.push((top - source.y) / dy);

    let t = Infinity;
    for (const value of candidates) {
      if (value > 0 && value < t) t = value;
    }

    if (!Number.isFinite(t)) t = 0;

    return {
      x1: source.x,
      y1: source.y,
      x2: source.x + dx * t,
      y2: source.y + dy * t,
    };
  }

  pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const vx = x2 - x1;
    const vy = y2 - y1;
    const lenSq = vx * vx + vy * vy;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1);

    let t = ((px - x1) * vx + (py - y1) * vy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const cx = x1 + t * vx;
    const cy = y1 + t * vy;
    return Math.hypot(px - cx, py - cy);
  }

  rayXAtY(segment, y) {
    const dy = segment.y2 - segment.y1;
    if (Math.abs(dy) < 1e-6) return null;

    const t = (y - segment.y1) / dy;
    if (t < 0 || t > 1) return null;
    return segment.x1 + (segment.x2 - segment.x1) * t;
  }

  update(particles) {
    if (this.lightMap.length !== this.rayCount) {
      this.lightMap = new Array(this.rayCount).fill(1);
    }

    for (let i = 0; i < this.rayCount; i++) {
      const ray = this.getRaySegment(i);
      let light = 1;

      for (const p of particles) {
        if (p.type !== "algae") continue;

        const dist = this.pointToSegmentDistance(
          p.x,
          p.y,
          ray.x1,
          ray.y1,
          ray.x2,
          ray.y2,
        );

        if (dist < p.size + this.rayWidth * 0.5) {
          light -= this.blockStrength;
        }
      }

      this.lightMap[i] = Math.max(0, light);
    }
  }

  getLightAt(x, y = this.bounds.bottom - 8) {
    const spreadRadius = this.rayWidth * 0.5 * this.spreadMultiplier;
    let best = 0;

    for (let i = 0; i < this.rayCount; i++) {
      const ray = this.getRaySegment(i);
      const rayX = this.rayXAtY(ray, y);
      if (rayX === null) continue;

      const dist = Math.abs(x - rayX);
      if (dist > spreadRadius) continue;

      best = Math.max(best, this.lightMap[i] ?? 0);
    }

    return best;
  }

  isRayContact(x, minLight = 0.12, y = this.bounds.bottom - 8) {
    return this.getLightAt(x, y) > minLight;
  }

  draw(ctx) {
    ctx.lineCap = "butt";

    for (let i = 0; i < this.rayCount; i++) {
      const ray = this.getRaySegment(i);
      const light = this.lightMap[i] ?? 0;
      const glowAlpha = light * 0.02;
      const coreAlpha = light * 0.42;

      // Soft wide cone stroke.
      ctx.lineWidth = this.rayWidth * this.spreadMultiplier;
      ctx.strokeStyle = `rgba(255,255,120,${glowAlpha})`;
      ctx.beginPath();
      ctx.moveTo(ray.x1, ray.y1);
      ctx.lineTo(ray.x2, ray.y2);
      ctx.stroke();

      // Brighter center ray.
      ctx.lineWidth = this.rayWidth;
      ctx.strokeStyle = `rgba(255,255,180,${coreAlpha})`;
      ctx.beginPath();
      ctx.moveTo(ray.x1, ray.y1);
      ctx.lineTo(ray.x2, ray.y2);
      ctx.stroke();
    }

    // Bright source point in the middle.
    const source = this.getSource();
    ctx.fillStyle = "rgba(255,255,170,0.45)";
    ctx.beginPath();
    ctx.arc(source.x, source.y, this.rayWidth * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
