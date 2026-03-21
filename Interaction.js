export function handleInteractions(system) {
  const particles = system.particles;

  // Algae-to-algae collision (equal mass elastic response).
  for (let i = 0; i < particles.length; i++) {
    const a = particles[i];
    if (a.type !== "algae") continue;

    for (let j = i + 1; j < particles.length; j++) {
      const b = particles[j];
      if (b.type !== "algae") continue;

      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let dist = Math.hypot(dx, dy);
      const minDist = a.size + b.size;

      // Prevent divide-by-zero when particles overlap at the same point.
      if (dist === 0) {
        dx = (Math.random() - 0.5) * 0.01;
        dy = (Math.random() - 0.5) * 0.01;
        dist = Math.hypot(dx, dy);
      }

      if (dist < minDist) {
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDist - dist;

        // Separate particles so they no longer overlap.
        a.x -= nx * (overlap / 2);
        a.y -= ny * (overlap / 2);
        b.x += nx * (overlap / 2);
        b.y += ny * (overlap / 2);

        // Bounce by exchanging normal velocity with an elastic impulse.
        const rvx = b.vx - a.vx;
        const rvy = b.vy - a.vy;
        const velAlongNormal = rvx * nx + rvy * ny;

        if (velAlongNormal < 0) {
          const restitution = 1;
          const impulse = (-(1 + restitution) * velAlongNormal) / 2;
          const ix = impulse * nx;
          const iy = impulse * ny;

          a.vx -= ix;
          a.vy -= iy;
          b.vx += ix;
          b.vy += iy;
        }
      }
    }
  }

  for (let i = 0; i < particles.length; i++) {
    const a = particles[i];

    if (a.type !== "algae") continue;

    for (let j = particles.length - 1; j >= 0; j--) {
      const b = particles[j];

      if (b.type !== "nutrient") continue;

      let dx = a.x - b.x;
      let dy = a.y - b.y;
      let dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < a.size + b.size && a.cooldown === 0) {
        // reproduction chance
        if (Math.random() < 0.9) {
          system.add(a.x, a.y, "algae", Math.floor(Math.random() * 2) + 1);
        }

        // remove nutrient safely
        particles.splice(j, 1);

        a.cooldown = 30;
      }
    }
  }
}
