import ParticleSystem from "./ParticleSystem.js";
import { handleInteractions } from "./Interaction.js";
import LightSystem from "./LightSystem.js";
import PlantSystem from "./PlantSystem.js";

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
let plantSystem;

const bounds = {
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  bounds.right = canvas.width;
  bounds.bottom = canvas.height;

  if (plantSystem) {
    plantSystem.resize();
  }
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const lightSystem = new LightSystem(bounds, 100, 3);
plantSystem = new PlantSystem(bounds, 80);

const system = new ParticleSystem();

// Initial algae.
for (let i = 0; i < 20; i++) {
  system.add(
    Math.random() * canvas.width,
    Math.random() * canvas.height,
    "algae",
  );
}

// Click = nutrients.
canvas.addEventListener("click", (e) => {
  system.add(e.clientX, e.clientY, "nutrient", 10);
});

let lastFrameTime = performance.now();

function animate(now = performance.now()) {
  const deltaSeconds = Math.min(0.05, (now - lastFrameTime) / 1000);
  lastFrameTime = now;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  system.update(canvas);
  handleInteractions(system);

  lightSystem.update(system.particles);
  plantSystem.update(lightSystem, deltaSeconds);

  lightSystem.draw(ctx);
  plantSystem.draw(ctx);
  system.draw(ctx);

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
