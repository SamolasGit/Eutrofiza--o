import Algae from "./algae.js";
import Plant from "./plant.js";

// Dark mode toggle
const darkModeToggle = document.getElementById("darkModeToggle");
const modeIcon = document.getElementById("modeIcon");
darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  modeIcon.src = document.body.classList.contains("dark-mode")
    ? "sun.svg"
    : "moon.svg";
});

const canvas = document.querySelector("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d");

const algaeArray = [];
const plantArray = [];
const particles = [];

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  algaeArray.push(
    new Algae(
      x,
      y,
      15 + Math.random() * 2,
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

  plantArray.push(new Plant(x, canvas.height));
});
// Animation loop
function animate() {
  const time = performance.now() * 0.002;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  algaeArray.forEach((algae) => {
    algae.update(algaeArray, time);
    algae.draw(ctx);
  });

  plantArray.forEach((plant) => {
    plant.update(plantArray, particles, time);
    plant.draw(ctx);
  });

  particles.forEach((particle) => {
    particle.update();
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

  requestAnimationFrame(animate);
}

animate();
