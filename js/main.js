import Algae from "./algae.js";
import Plant from "./plant.js";

// Dark mode toggle
const darkModeToggle = document.getElementById("darkModeToggle");
const modeIcon = document.getElementById("modeIcon");
darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  modeIcon.src = document.body.classList.contains("dark-mode")
    ? "../public/sun.svg"
    : "../public/moon.svg";
});

const manualButton = document.getElementById("manualButton");
const manualPanel = document.getElementById("manualPanel");
const closeManual = document.getElementById("closeManual");
const sunrayToggle = document.getElementById("sunrayToggle");
const resetButton = document.getElementById("resetButton");
const oxygenMeter = document.getElementById("oxygenMeter");
const oxygenMeterFill = document.getElementById("oxygenMeterFill");
let sunRaysVisible = true;

function setManualOpen(isOpen) {
  document.body.classList.toggle("manual-open", isOpen);
  if (manualButton) {
    manualButton.setAttribute("aria-expanded", String(isOpen));
  }
  if (manualPanel) {
    manualPanel.setAttribute("aria-hidden", String(!isOpen));
  }
}
setManualOpen(false);

if (manualButton && manualPanel) {
  manualButton.addEventListener("click", () => {
    const isOpen = document.body.classList.contains("manual-open");
    setManualOpen(!isOpen);
  });
}

if (closeManual) {
  closeManual.addEventListener("click", () => {
    setManualOpen(false);
  });
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setManualOpen(false);
  }
});

if (sunrayToggle) {
  sunrayToggle.addEventListener("click", () => {
    sunRaysVisible = !sunRaysVisible;
    sunrayToggle.setAttribute("aria-pressed", String(sunRaysVisible));
  });
}

function resetSimulation() {
  algaeArray.length = 0;
  plantArray.length = 0;
  particles.length = 0;

  sunRaysVisible = true;
  if (sunrayToggle) {
    sunrayToggle.setAttribute("aria-pressed", "true");
  }

  setManualOpen(false);
  updateOxygenMeter();
}

if (resetButton) {
  resetButton.addEventListener("click", resetSimulation);
}

const canvas = document.querySelector("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d");

const algaeArray = [];
const plantArray = [];
const particles = [];
const sunRays = [];
const SUN_RAY_COUNT = 1;
const MAX_ALGAE_COUNT = 220;
const WATER_SURFACE_RATIO = 0.27;
const SAND_HEIGHT = 78;
const SAND_BOTTOM_OFFSET = -24; // Keep in sync with `body::before` in sea.css.
const OXYGEN_FULL_COUNT = 100;

function getPlantBaseY() {
  return canvas.height - SAND_HEIGHT - SAND_BOTTOM_OFFSET;
}

function updateOxygenMeter() {
  if (!oxygenMeter || !oxygenMeterFill) return;

  const oxygenCount = particles.length;
  const oxygenRatio = Math.max(0, Math.min(1, oxygenCount / OXYGEN_FULL_COUNT));

  oxygenMeterFill.style.height = `${oxygenRatio * 100}%`;
  oxygenMeter.setAttribute(
    "aria-valuenow",
    String(Math.min(oxygenCount, OXYGEN_FULL_COUNT)),
  );
  oxygenMeter.setAttribute("aria-valuetext", `${oxygenCount} oxygen bubbles`);
}

function createSunRay(index, total) {
  return {
    baseX: canvas.width * 0.5,
    phase: 0,
    swaySpeed: 0,
    swayAmplitude: 0,
    uniformWidth: canvas.width + 4,
    alpha: 0.5,
  };
}

function rebuildSunRays() {
  sunRays.length = 0;
  for (let i = 0; i < SUN_RAY_COUNT; i++) {
    sunRays.push(createSunRay(i, SUN_RAY_COUNT));
  }
}

function getSunRayState(ray, time) {
  const centerX = ray.baseX;
  const width = ray.uniformWidth;

  return {
    startY: 0,
    // Must reach the seabed so short bottom plants can still receive light
    endY: canvas.height + 10,
    topX: centerX,
    bottomX: centerX,
    topWidth: width,
    bottomWidth: width,
    alpha: ray.alpha,
  };
}

function drawSunRays(ctx, rayStates) {
  for (const ray of rayStates) {
    const beamX = ray.topX - ray.topWidth / 2;
    const beamHeight = ray.endY - ray.startY;
    const gradient = ctx.createLinearGradient(0, ray.startY, 0, ray.endY);
    gradient.addColorStop(0, `rgba(255, 247, 181, ${ray.alpha})`);
    gradient.addColorStop(0.65, `rgba(255, 247, 181, ${ray.alpha * 0.78})`);
    gradient.addColorStop(1, `rgba(255, 247, 181, ${ray.alpha * 0.45})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(beamX, ray.startY, ray.topWidth, beamHeight);
  }
}

function algaeIntersectsRay(ray, algae, sampleY) {
  if (sampleY < ray.startY || sampleY > ray.endY) return false;
  const raySlice = rayCenterAndWidthAtY(ray, sampleY);

  return (
    Math.abs(algae.x - raySlice.centerX) <=
    raySlice.width / 2 + algae.radius + 2
  );
}

function drawAlgaeRayOcclusion(ctx, rayStates, algaeArray) {
  if (rayStates.length === 0 || algaeArray.length === 0) return;

  ctx.save();
  ctx.globalCompositeOperation = "destination-out";

  for (const ray of rayStates) {
    for (const algae of algaeArray) {
      const startY = algae.y + algae.radius * 0.4;
      if (startY >= ray.endY) continue;
      if (!algaeIntersectsRay(ray, algae, algae.y)) continue;

      const shadowHeight = ray.endY - startY;
      const coreHalfWidth = Math.max(6, algae.radius * 0.95);
      const softHalfWidth = coreHalfWidth * 1.8;

      // Vertical penumbra (light comes from top only).
      const softGradient = ctx.createLinearGradient(
        algae.x - softHalfWidth,
        0,
        algae.x + softHalfWidth,
        0,
      );
      softGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      softGradient.addColorStop(0.3, "rgba(0, 0, 0, 0.24)");
      softGradient.addColorStop(0.7, "rgba(0, 0, 0, 0.24)");
      softGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = softGradient;
      ctx.fillRect(
        algae.x - softHalfWidth,
        startY,
        softHalfWidth * 2,
        shadowHeight,
      );

      // Vertical umbra core.
      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
      ctx.fillRect(
        algae.x - coreHalfWidth,
        startY,
        coreHalfWidth * 2,
        shadowHeight,
      );
    }
  }

  ctx.restore();
}

function plantTouchesSunRayAtY(plant, ray, sampleY) {
  if (sampleY < ray.startY || sampleY > ray.endY) return false;

  const progress = (sampleY - ray.startY) / (ray.endY - ray.startY);
  const centerX = ray.topX + (ray.bottomX - ray.topX) * progress;
  const rayWidth = ray.topWidth + (ray.bottomWidth - ray.topWidth) * progress;
  const touchPadding = 10;

  return (
    Math.abs(plant.x - centerX) <= rayWidth / 2 + plant.width / 2 + touchPadding
  );
}

function rayCenterAndWidthAtY(ray, y) {
  const progress = (y - ray.startY) / (ray.endY - ray.startY);
  return {
    centerX: ray.topX + (ray.bottomX - ray.topX) * progress,
    width: ray.topWidth + (ray.bottomWidth - ray.topWidth) * progress,
  };
}

function algaeBlocksRayBeforeY(ray, algae, sampleX, sampleY) {
  const algaeTop = algae.y - algae.radius;
  const algaeBottom = algae.y + algae.radius;

  if (algaeBottom < ray.startY || algaeTop > sampleY) return false;

  const yStart = Math.max(ray.startY, algae.y + algae.radius * 0.4);
  if (sampleY <= yStart) return false;
  if (!algaeIntersectsRay(ray, algae, algae.y)) return false;

  const shadowHalfWidth = algae.radius * 1.05;
  return Math.abs(sampleX - algae.x) <= shadowHalfWidth;
}

function isLightBlockedByAlgae(ray, sampleX, sampleY, algaeArray) {
  for (const algae of algaeArray) {
    if (algaeBlocksRayBeforeY(ray, algae, sampleX, sampleY)) {
      return true;
    }
  }

  return false;
}

function isPlantInSunlight(plant, rayStates, algaeArray) {
  for (const ray of rayStates) {
    // Sample the full plant body (top -> base) for robust contact detection.
    const sampleCount = 6;
    for (let i = 0; i < sampleCount; i++) {
      const t = i / (sampleCount - 1);
      const sampleY = plant.y + plant.height * t;
      const touchesRay = plantTouchesSunRayAtY(plant, ray, sampleY);
      const blockedByAlgae = isLightBlockedByAlgae(
        ray,
        plant.x,
        sampleY,
        algaeArray,
      );

      if (touchesRay && !blockedByAlgae) {
        return true;
      }
    }
  }

  return false;
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const plantBaseY = getPlantBaseY();
  for (const plant of plantArray) {
    plant.canvasHeight = plantBaseY;
  }

  rebuildSunRays();
}

function spawnChildAlgae(parentAlgae) {
  if (algaeArray.length >= MAX_ALGAE_COUNT) return;

  const radius = 11 + Math.random() * 6;
  const angle = Math.random() * Math.PI * 2;
  const distance = parentAlgae.radius + radius + 6;
  const x = Math.min(
    canvas.width - radius,
    Math.max(radius, parentAlgae.x + Math.cos(angle) * distance),
  );
  const y = Math.min(
    canvas.height * 0.55,
    Math.max(0, parentAlgae.y + Math.sin(angle) * distance),
  );

  algaeArray.push(
    new Algae(
      x,
      y,
      radius,
      canvas.height * 0.27,
      2 + Math.random() * 3,
      "#10B981",
    ),
  );
}

function resolveNightParticleAlgaeInteractions() {
  for (const particle of particles) {
    if (!particle.alive) continue;

    for (const algae of algaeArray) {
      const dx = particle.x - algae.x;
      const dy = particle.y - algae.y;
      const touchDist = algae.radius + particle.size * 0.7;

      if (dx * dx + dy * dy <= touchDist * touchDist) {
        particle.alive = false;

        // 50% chance to multiply algae on oxygen contact at night.
        if (Math.random() < 0.5) {
          spawnChildAlgae(algae);
        }

        break;
      }
    }
  }
}

function resolveParticleElasticCollisions(particles) {
  const restitution = 1; // perfectly elastic

  for (let i = 0; i < particles.length; i++) {
    const a = particles[i];
    if (!a.alive) continue;

    for (let j = i + 1; j < particles.length; j++) {
      const b = particles[j];
      if (!b.alive) continue;

      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let distSq = dx * dx + dy * dy;
      const minDist = a.size + b.size;

      if (distSq >= minDist * minDist) continue;

      if (distSq < 0.0001) {
        dx = 0.001;
        dy = 0;
        distSq = dx * dx + dy * dy;
      }

      const dist = Math.sqrt(distSq);
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = minDist - dist;
      const totalMass = a.mass + b.mass;

      // Position correction to avoid particles getting stuck.
      a.x -= nx * overlap * (b.mass / totalMass);
      a.y -= ny * overlap * (b.mass / totalMass);
      b.x += nx * overlap * (a.mass / totalMass);
      b.y += ny * overlap * (a.mass / totalMass);

      // Impulse-based elastic collision.
      const rvx = b.vx - a.vx;
      const rvy = b.vy - a.vy;
      const velAlongNormal = rvx * nx + rvy * ny;

      if (velAlongNormal > 0) continue;

      const impulse =
        (-(1 + restitution) * velAlongNormal) / (1 / a.mass + 1 / b.mass);
      const impulseX = impulse * nx;
      const impulseY = impulse * ny;

      a.vx -= impulseX / a.mass;
      a.vy -= impulseY / a.mass;
      b.vx += impulseX / b.mass;
      b.vy += impulseY / b.mass;
    }
  }
}

window.addEventListener("resize", resizeCanvas);
rebuildSunRays();
updateOxygenMeter();

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const sandTopY = getPlantBaseY();
  const radius = 8 + Math.random() * 13;
  const y = Math.min(event.clientY - rect.top, sandTopY - radius);

  algaeArray.push(
    new Algae(
      x,
      y,
      radius,
      canvas.height * 0.27,
      3 + Math.random() * 2,
      "#10B981 ",
    ),
  );
});

// Right-click to plant
canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;

  plantArray.push(new Plant(x, getPlantBaseY()));
});

let lastFrameTime = performance.now();
// Animation loop
function animate(frameTime) {
  const time = frameTime * 0.002;
  const deltaTime = Math.min((frameTime - lastFrameTime) / 1000, 0.05);
  lastFrameTime = frameTime;
  const isNightMode = document.body.classList.contains("dark-mode");
  const waterTopY = canvas.height * WATER_SURFACE_RATIO;
  const sandTopY = getPlantBaseY();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const rayStates = isNightMode
    ? []
    : sunRays.map((ray) => getSunRayState(ray, time));

  algaeArray.forEach((algae) => {
    algae.update(algaeArray, time);
    // Sand collision: algae cannot go inside the sand.
    const maxAlgaeY = sandTopY - algae.radius;
    if (algae.y > maxAlgaeY) {
      algae.y = maxAlgaeY;
    }
  });

  if (!isNightMode && sunRaysVisible) {
    drawSunRays(ctx, rayStates);
    drawAlgaeRayOcclusion(ctx, rayStates, algaeArray);
  }

  algaeArray.forEach((algae) => {
    algae.draw(ctx);
  });

  plantArray.forEach((plant) => {
    const inSunlight = isNightMode
      ? false
      : isPlantInSunlight(plant, rayStates, algaeArray);
    plant.update(
      plantArray,
      particles,
      time,
      deltaTime,
      inSunlight,
      isNightMode,
    );
    plant.draw(ctx, time);
  });

  particles.forEach((particle) => {
    particle.update(canvas.width, sandTopY, waterTopY, deltaTime);
  });
  resolveParticleElasticCollisions(particles);

  if (isNightMode) {
    resolveNightParticleAlgaeInteractions();
  }

  particles.forEach((particle) => {
    particle.draw(ctx);
  });

  // Remove dead plants and particles
  for (let i = plantArray.length - 1; i >= 0; i--) {
    if (!plantArray[i].alive) {
      plantArray.splice(i, 1);
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    if (!particles[i].alive) {
      particles.splice(i, 1);
    }
  }

  updateOxygenMeter();

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
