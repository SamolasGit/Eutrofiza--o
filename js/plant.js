import Particle from "./Particle.js";

export default class Plant {
  constructor(x, canvasHeight) {
    this.x = x;
    this.canvasHeight = canvasHeight;
    this.baseHeight = 8;
    this.height = this.baseHeight;
    this.maxHeight = 200 + Math.random() * 20;
    this.minHeight = 2;
    this.width = 16;
    this.growthRate = 60;
    this.shrinkRate = 14;
    this.noLightGracePeriod = 20;
    this.noLightTimer = 0;
    this.health = 100;
    this.alive = true;
    this.color = "#22C55E";
    this.maxGrowthReached = false;
    this.particleEmitTimer = 0;
    this.lightContact = false;
    this.swayPhase = Math.random() * Math.PI * 4;
    this.swaySpeed = 0.9 + Math.random() * 0.7;
    this.swayAmplitude = 4.2 + Math.random() * 2.2;
  }

  get y() {
    // Top of the cylinder
    return this.canvasHeight - this.height;
  }

  update(
    plantArray,
    particles,
    time,
    deltaTime,
    hasLight,
    isNightMode = false,
  ) {
    if (!this.alive) return;

    this.lightContact = hasLight;

    if (hasLight) {
      this.noLightTimer = 0;

      const growthPulse = 0.8 + 0.2 * (Math.sin(time * 3 + this.x * 0.03) + 1);
      if (this.height < this.maxHeight) {
        this.height += this.growthRate * growthPulse * deltaTime;
        if (this.height >= this.maxHeight) {
          this.height = this.maxHeight;
          this.maxGrowthReached = true;
        }
      }
    } else {
      if (isNightMode) {
        // Night pauses starvation; plants should not shrink/die from lack of light.
        this.noLightTimer = 0;
      } else {
        this.noLightTimer += deltaTime;

        if (this.noLightTimer >= this.noLightGracePeriod) {
          this.height -= this.shrinkRate * deltaTime;
          this.health -= 10 * deltaTime;
          this.maxGrowthReached = false;
        }
      }
    }

    // Produce oxygen particles when at max growth and illuminated
    if (this.maxGrowthReached && hasLight) {
      this.particleEmitTimer += deltaTime;
      if (this.particleEmitTimer >= 2) {
        this.emitOxygenParticles(particles);
        this.particleEmitTimer = 0;
      }
    } else {
      this.particleEmitTimer = 0;
    }

    // Death condition
    if (this.height <= this.minHeight) {
      this.height = this.minHeight;
      this.alive = false;
    }

    // Collision with other plants
    for (let other of plantArray) {
      if (other === this || !other.alive) continue;

      const dx = other.x - this.x;
      const minDist = this.width + other.width;

      if (Math.abs(dx) < minDist) {
        // Push plants apart horizontally
        const pushX = dx > 0 ? minDist / 2 - dx / 2 : -minDist / 2 + dx / 2;
        this.x -= pushX;
        other.x += pushX;
      }
    }
  }

  emitOxygenParticles(particles) {
    // Emit 1 oxygen particle from the top
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.32 + Math.random() * 0.64;
    const vx = Math.cos(angle) * speed;
    const vy = -Math.sin(angle) * speed - 0.34; // Slightly stronger upward bias

    particles.push(
      new Particle(this.x, this.y, vx, vy, 10 + Math.random() * 2),
    );
  }

  drawWavyStemPath(ctx, baseX, baseY, topY, halfWidth, midX, topX) {
    const midY = topY + (baseY - topY) * 0.55;
    const topRound = halfWidth * 0.85;

    ctx.beginPath();
    ctx.moveTo(baseX - halfWidth, baseY);
    ctx.quadraticCurveTo(
      midX - halfWidth * 1.15,
      midY,
      topX - halfWidth * 0.92,
      topY,
    );
    ctx.quadraticCurveTo(topX, topY - topRound, topX + halfWidth * 0.92, topY);
    ctx.quadraticCurveTo(
      midX + halfWidth * 1.15,
      midY,
      baseX + halfWidth,
      baseY,
    );
    ctx.closePath();
  }

  draw(ctx, time = 0) {
    if (!this.alive) return;

    const topX = this.x;
    const topY = this.y;
    const baseY = this.canvasHeight;
    const halfWidth = this.width * 0.5;
    const swayTop =
      Math.sin(time * this.swaySpeed + this.swayPhase) * this.swayAmplitude;
    const swayMid =
      Math.sin(time * this.swaySpeed * 1.45 + this.swayPhase + 1.1) *
      this.swayAmplitude *
      0.6;
    const topCenterX = this.x + swayTop;
    const midCenterX = this.x + swayMid;

    // Minimal wavy stem
    this.drawWavyStemPath(
      ctx,
      this.x,
      baseY,
      topY,
      halfWidth,
      midCenterX,
      topCenterX,
    );
    ctx.fillStyle = "#22C55E";
    ctx.fill();

    // Subtle edge
    this.drawWavyStemPath(
      ctx,
      this.x,
      baseY,
      topY,
      halfWidth,
      midCenterX,
      topCenterX,
    );
    ctx.strokeStyle = "rgba(21, 128, 61, 0.7)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Tiny top highlight
    ctx.beginPath();
    ctx.arc(topCenterX, topY + 2, this.width * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(220, 252, 231, 0.5)";
    ctx.fill();

    // Soft glow while receiving sunlight
    if (this.lightContact) {
      const glowPadding = 2.3;
      this.drawWavyStemPath(
        ctx,
        this.x,
        baseY + glowPadding,
        topY - glowPadding,
        halfWidth + glowPadding,
        midCenterX,
        topCenterX,
      );
      ctx.strokeStyle = "rgba(187, 247, 208, 0.55)";
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }
  }
}
