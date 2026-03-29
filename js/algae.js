export default class Algae {
  constructor(x, y, radius, targetY, speed, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.targetY = targetY;
    this.baseY = targetY;
    this.speed = speed;
    this.color = color || "#10B981";
    this.reached = false;
    this.restX = x;

    this.jitterPhase = Math.random() * Math.PI * 2;

    this.jitterSpeed = 0.04 + Math.random() * 0.05;

    this.jitterAmpX = 0 + Math.random() * 0.8;

    this.jitterAmpY = 0.8 + Math.random() * 1.2;
  }
  update(algaeArray, time) {
    this.jitterPhase += this.jitterSpeed;

    const jitterX = Math.sin(this.jitterPhase) * this.jitterAmpX;

    const jitterY = Math.cos(this.jitterPhase * 1.3) * this.jitterAmpY;

    // Move toward targetY and original X position
    const targetDX = this.restX + jitterX - this.x;
    const targetDY = this.targetY + jitterY - this.y;
    this.x += targetDX * 0.05;
    this.y += targetDY * 0.05;

    // Collision (mantido original)
    for (let other of algaeArray) {
      if (other === this) continue;

      const dx = other.x - this.x;

      const dy = other.y - this.y;

      const dist = Math.sqrt(dx * dx + dy * dy);

      const minDist = this.radius + other.radius;
      if (dist < minDist) {
        const angle = Math.atan2(dy, dx);

        const overlap = minDist - dist;

        const pushX = (Math.cos(angle) * overlap) / 2;

        const pushY = (Math.sin(angle) * overlap) / 2;

        this.x -= pushX;

        this.y -= pushY;

        other.x += pushX;

        other.y += pushY;
      }
    }
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }
}
