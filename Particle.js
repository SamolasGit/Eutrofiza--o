export default class Particle {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;

    this.size = type === "algae" ? 5 : 3;
    this.cooldown = 0;

    this.vx = (Math.random() - 0.5) * 1;
    this.vy = (Math.random() - 0.5) * 1;
  }

  update(canvas) {
    const top = 200;
    const bottom = 300;
    const left = 0;
    const right = canvas.width;

    this.x += this.vx;
    this.y += this.vy;

    // LEFT
    if (this.x < left + this.size) {
      this.x = left + this.size;
      this.vx *= -1;
    }

    // RIGHT
    if (this.x > right - this.size) {
      this.x = right - this.size;
      this.vx *= -1;
    }

    // TOP (IMPORTANT FIX)
    if (this.y < top + this.size) {
      this.y = top + this.size;
      this.vy *= -1;
    }

    // BOTTOM
    if (this.y > bottom - this.size) {
      this.y = bottom - this.size;
      this.vy *= -1;
    }

    if (this.cooldown > 0) this.cooldown--;
  }

  draw(ctx) {
    if (this.type === "algae") ctx.fillStyle = "#2E8B57";
    else ctx.fillStyle = "yellow";

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}
