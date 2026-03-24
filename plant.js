import Particle from "./particle.js";

export default class Plant {
  constructor(x, canvasHeight) {
    this.x = x;
    this.canvasHeight = canvasHeight;
    this.baseHeight = 8;
    this.height = this.baseHeight;
    this.maxHeight = 110 + Math.random() * 20;
    this.minHeight = 2;
    this.width = 8;
    this.growthRate = 1.2;
    this.health = 100;
    this.alive = true;
    this.color = "#22C55E";
    this.maxGrowthReached = false;
    this.particleEmitCounter = 0;
  }

  get y() {
    // Top of the cylinder
    return this.canvasHeight - this.height;
  }

  update(plantArray, particles, time) {
    if (!this.alive) return;

    // Growth mechanics - random fluctuation
    const randomGrowth =
      (Math.sin(time * 2 + this.x) * 0.5 + 0.5) * this.growthRate;

    if (this.height < this.maxHeight) {
      this.height += randomGrowth;
      if (this.height >= this.maxHeight) {
        this.height = this.maxHeight;
        this.maxGrowthReached = true;
      }
    }

    // Produce oxygen particles when at max growth
    if (this.maxGrowthReached) {
      this.particleEmitCounter++;
      if (this.particleEmitCounter > 300) {
        this.emitOxygenParticles(particles);
        this.particleEmitCounter = 0;
      }
    } else {
      // Shrink over time if not at max growth (simulating nutrient depletion)
      this.height -= 0.05;
      this.health -= 0.2;
    }

    // Death condition
    if (this.height <= this.minHeight) {
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
    const speed = 0.1 + Math.random() * 0.4;
    const vx = Math.cos(angle) * speed;
    const vy = -Math.sin(angle) * speed - 0.3; // Gentle upward bias

    particles.push(
      new Particle(this.x, this.y, vx, vy, 10 + Math.random() * 2),
    );
  }

  draw(ctx) {
    if (!this.alive) return;

    const stemWidth = this.width * 0.4;
    const topX = this.x - this.width / 2;
    const topY = this.y;

    // Draw main cylinder
    ctx.fillStyle = this.color;
    ctx.fillRect(topX, topY, this.width, this.height);

    // Draw darker edges for depth
    ctx.strokeStyle = "#16A34A";
    ctx.lineWidth = 1;
    ctx.strokeRect(topX, topY, this.width, this.height);

    // Glow effect at max growth
    if (this.maxGrowthReached) {
      ctx.strokeStyle = "rgba(34, 197, 94, 0.5)";
      ctx.lineWidth = 2;
      ctx.strokeRect(topX - 2, topY - 2, this.width + 4, this.height + 4);
    }
  }
}
