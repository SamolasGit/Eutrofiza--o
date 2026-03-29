export default class Particle {
  constructor(x, y, vx, vy, size) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.mass = Math.max(1, this.size * this.size * 0.02);
    this.alpha = 0.95;
    this.alive = true;
    this.ageSeconds = 0;
    this.maxLifetimeSeconds = 60;
    this.color = "#87CEEB"; // Sky blue for oxygen
  }

  update(canvasWidth, floorY, waterTopY, deltaTime) {
    if (!this.alive) return;

    this.ageSeconds += deltaTime;
    if (this.ageSeconds >= this.maxLifetimeSeconds) {
      this.alive = false;
      return;
    }

    // Keep existing velocity units while staying frame-rate independent.
    const frameScale = Math.min(3, deltaTime * 60);
    this.x += this.vx * frameScale;
    this.y += this.vy * frameScale;

    // Always bounce inside the water volume (surface -> sand top).
    if (this.x - this.size <= 0) {
      this.x = this.size;
      this.vx = Math.abs(this.vx); // elastic wall bounce
    } else if (this.x + this.size >= canvasWidth) {
      this.x = canvasWidth - this.size;
      this.vx = -Math.abs(this.vx); // elastic wall bounce
    }

    if (this.y - this.size <= waterTopY) {
      this.y = waterTopY + this.size;
      this.vy = Math.abs(this.vy); // elastic wall bounce
    } else if (this.y + this.size >= floorY) {
      this.y = floorY - this.size;
      this.vy = -Math.abs(this.vy); // elastic wall bounce
    }
  }

  draw(ctx) {
    if (!this.alive) return;

    // Draw bubble
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    const rgbaColor = `rgba(135, 206, 235, ${this.alpha})`;
    ctx.fillStyle = rgbaColor;
    ctx.fill();
    ctx.closePath();

    // Draw O2 text
    ctx.fillStyle = `rgba(34, 197, 94, ${this.alpha * 0.8})`;
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("O2", this.x, this.y);
  }
}
