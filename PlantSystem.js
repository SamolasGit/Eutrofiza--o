export default class PlantSystem {
  constructor(bounds, plantCount = 50) {
    this.bounds = bounds;
    this.plantCount = plantCount;
    this.deathAfterSeconds = 10;
    this.growthPerSecond = 0.35; // how fast maxHeight grows when lit
    this.shrinkPerSecond = 0.02; // how fast maxHeight shrinks when dark
    this.minHeight = 200; // never disappear entirely until fully dead
    this.baseMaxHeight = 200; // starting / reference max height
    this.absoluteMaxHeight = 400; // growth ceiling
    this.recoveryPerSecond = 0.6; // health recovery speed
    this.plants = [];
    this.createPlants();
  }

  createPlants() {
    this.plants = [];
    const { left, right, bottom } = this.bounds;
    const width = Math.max(0, right - left);

    for (let i = 0; i < this.plantCount; i++) {
      const xRatio = Math.random();
      const x = left + xRatio * width;

      this.plants.push({
        xRatio,
        x,
        baseY: bottom - 8,
        maxHeight: this.baseMaxHeight * (0.5 + Math.random() * 0.5),
        bend: (Math.random() - 0.5) * 14,
        health: 1,
        noLightSeconds: 0,
        dead: false,
      });
    }
  }

  resize() {
    const { left, right, bottom } = this.bounds;
    const width = Math.max(0, right - left);

    if (this.plants.length !== this.plantCount) {
      this.createPlants();
      return;
    }

    for (let i = 0; i < this.plants.length; i++) {
      this.plants[i].x = left + this.plants[i].xRatio * width;
      this.plants[i].baseY = bottom - 8;
    }
  }

  getLightForPlant(lightSystem, plant) {
    // Find the ray whose bottom-point is closest to the plant's x position
    // and return its light value. This avoids the tight pixel-spread gap
    // that causes most plants to register as unlit.
    if (
      typeof lightSystem.getRaySegment !== "function" ||
      !lightSystem.lightMap
    ) {
      // Fallback to built-in methods
      if (typeof lightSystem.isRayContact === "function") {
        return lightSystem.isRayContact(plant.x, 0.01, plant.baseY) ? 1 : 0;
      }
      if (typeof lightSystem.getLightAt === "function") {
        return lightSystem.getLightAt(plant.x, plant.baseY);
      }
      return 0;
    }

    let bestLight = 0;
    let bestDist = Infinity;

    for (let i = 0; i < lightSystem.rayCount; i++) {
      const ray = lightSystem.getRaySegment(i);
      // Where does this ray cross the plant's baseY?
      const dy = ray.y2 - ray.y1;
      if (Math.abs(dy) < 1e-6) continue;
      const t = (plant.baseY - ray.y1) / dy;
      if (t < 0 || t > 1) continue;
      const rayX = ray.x1 + (ray.x2 - ray.x1) * t;
      const dist = Math.abs(plant.x - rayX);
      if (dist < bestDist) {
        bestDist = dist;
        bestLight = lightSystem.lightMap[i] ?? 0;
      }
    }

    // A plant is "hit" if the nearest ray passes within half a ray-spacing width
    const raySpacing =
      (lightSystem.bounds.right - lightSystem.bounds.left) /
      lightSystem.rayCount;
    return bestDist < raySpacing * 0.6 ? bestLight : 0;
  }

  update(lightSystem, deltaSeconds) {
    for (const plant of this.plants) {
      const lightValue = this.getLightForPlant(lightSystem, plant);
      const isHitByRay = lightValue > 0.05;

      if (isHitByRay) {
        // Receiving light: reset dark timer, recover health, grow taller
        plant.noLightSeconds = 0;
        plant.health = Math.min(
          1,
          plant.health + this.recoveryPerSecond * deltaSeconds,
        );
        plant.maxHeight = Math.min(
          this.absoluteMaxHeight,
          plant.maxHeight +
            this.growthPerSecond * this.absoluteMaxHeight * deltaSeconds,
        );
      } else {
        // No light: accumulate dark time, lose health, shrink
        plant.noLightSeconds += deltaSeconds;
        const decayPerSecond = 1 / this.deathAfterSeconds;
        plant.health = Math.max(
          0,
          plant.health - decayPerSecond * deltaSeconds,
        );
        plant.maxHeight = Math.max(
          this.minHeight,
          plant.maxHeight -
            this.shrinkPerSecond * this.absoluteMaxHeight * deltaSeconds,
        );
      }

      plant.dead = plant.health <= 0.02;
    }
  }

  draw(ctx) {
    for (const plant of this.plants) {
      const life = plant.health;
      const visibleLife = Math.max(life, 0.05);
      const height = plant.maxHeight * visibleLife;
      const topY = plant.baseY - height;
      const deadness = 1 - life;

      // cor base da alga
      const baseR = 46;
      const baseG = 139;
      const baseB = 87;

      // quando morre, vai puxando pra marrom/amarelado
      const deadR = 140;
      const deadG = 110;
      const deadB = 50;

      const r = Math.round(baseR + (deadR - baseR) * deadness);
      const g = Math.round(baseG + (deadG - baseG) * deadness);
      const b = Math.round(baseB + (deadB - baseB) * deadness);

      const color = `rgb(${r},${g},${b})`;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(plant.x, plant.baseY);
      ctx.quadraticCurveTo(
        plant.x + plant.bend * (0.35 + life * 0.65),
        plant.baseY - height * 0.5,
        plant.x,
        topY,
      );
      ctx.stroke();

      if (life > 0.12) {
        ctx.fillStyle = `rgba(${r},${g},${b},0.85)`;
        const leafSize = 1 + life * 4;
        ctx.beginPath();
        ctx.ellipse(
          plant.x + plant.bend * 0.2,
          topY + height * 0.25,
          leafSize,
          Math.max(0.8, leafSize * 0.7),
          0.4,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
  }
}
