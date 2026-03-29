export default class Algae {
  constructor(x, y, radius, waterSurfaceY, speed, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.waterSurfaceY = waterSurfaceY;
    this.speed = speed;
    this.color = color;
    this.alive = true;
    this.buoyancy = 0.5; // Adjust as needed for floating behavior
    this.floatPhase = Math.random() * Math.PI * 2;
    this.floatSpeed = 1 + Math.random() * 0.5;
    this.floatAmplitude = 3 + Math.random() * 2;
    this.atSurface = false; // Flag to prevent jittering at max height
  }

  update(deltaTime) {
    const frameScale = 1; // Fixed for consistent movement

    // Check if at surface
    if (this.y <= this.waterSurfaceY + this.radius) {
      this.atSurface = true;
    }

    // Stop movement once at surface
    if (this.atSurface) {
      this.y = this.waterSurfaceY + this.radius;
      return;
    }

    if (this.y - this.radius > this.waterSurfaceY) {
      // In water, float up until near surface
      if (this.y > this.waterSurfaceY + this.radius + 1) {
        this.y -= this.speed * frameScale;
      }
    } else {
      // Above water, fall down
      this.y += this.speed * frameScale;
    }
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}
