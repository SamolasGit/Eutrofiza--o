export default class Particle {
  constructor(x, y, vx, vy, size) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.alpha = 1;
    this.fadeRate = 0.0033; // 5 seconds fade at 60fps
    this.alive = true;
    this.color = "#87CEEB"; // Sky blue for oxygen
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    // Apply slight upward float instead of gravity
    this.vy -= 0.02;

    // Fade out
    this.alpha -= this.fadeRate;

    if (this.alpha <= 0) {
      this.alive = false;
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
