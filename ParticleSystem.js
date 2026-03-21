import Particle from "./Particle.js";

export default class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  add(x, y, type, amount = 1) {
    for (let i = 0; i < amount; i++) {
      this.particles.push(new Particle(x, y, type));
    }
  }

  update(canvas) {
    this.particles.forEach((p) => p.update(canvas));
  }

  draw(ctx) {
    this.particles.forEach((p) => p.draw(ctx));
  }
}
