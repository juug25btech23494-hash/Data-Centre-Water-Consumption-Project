/**
 * waterFlowParticles.js
 * High-Performance Particle Engine for Flow, Evaporation, Air Currents & Immersion Bubbles
 */
import * as THREE from 'three';

export class WaterFlowParticleEngine {
  constructor(sceneManager) {
    this.sm = sceneManager && sceneManager.scene ? sceneManager : null;
    this.scene = sceneManager && sceneManager.scene ? sceneManager.scene : sceneManager;
    this.particleGroups = [];

    this.flowSpeed = 1.0;
    this.activeCoolingTech = 'evaporative';

    this.initPipeFlowParticles();
    this.initCoolingTowerPlume();
    this.initThermalHotAisleParticles();
    this.initColdAisleAirflow();
    this.initImmersionBubbles();

    if (this.sm && this.sm.addRenderCallback) {
      this.sm.addRenderCallback(this.update.bind(this));
    }
  }

  /**
   * Helper to create an animated particle stream along a 3D spline curve
   */
  createSplineParticleStream(points, count, color, size, loopId) {
    const curve = new THREE.CatmullRomCurve3(points);
    curve.curveType = 'catmullrom';
    curve.tension = 0.1;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const progress = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const u = i / count;
      progress[i] = u;
      const pt = curve.getPointAt(u);
      positions[i * 3] = pt.x;
      positions[i * 3 + 1] = pt.y;
      positions[i * 3 + 2] = pt.z;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: color,
      size: size,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const pointsMesh = new THREE.Points(geometry, material);
    this.scene.add(pointsMesh);

    const streamObj = {
      id: loopId,
      curve: curve,
      geometry: geometry,
      positions: positions,
      progress: progress,
      count: count,
      mesh: pointsMesh,
      active: true,
      update: (delta, speedMultiplier) => {
        if (!streamObj.active || !streamObj.mesh.visible) return;
        const posAttr = geometry.attributes.position;
        const step = 0.18 * delta * speedMultiplier;

        for (let i = 0; i < count; i++) {
          progress[i] += step;
          if (progress[i] > 1.0) progress[i] -= 1.0;
          if (progress[i] < 0.0) progress[i] += 1.0;

          const pt = curve.getPointAt(progress[i]);
          posAttr.setXYZ(i, pt.x, pt.y, pt.z);
        }
        posAttr.needsUpdate = true;
      }
    };

    this.particleGroups.push(streamObj);
    return streamObj;
  }

  initPipeFlowParticles() {
    // 1. Chilled Water Supply (Chiller -> Server CRAHs)
    this.chwSupplyStream = this.createSplineParticleStream([
      new THREE.Vector3(13, 0.4, 6),
      new THREE.Vector3(7.5, 0.4, 12),
      new THREE.Vector3(-4, 0.4, 12),
      new THREE.Vector3(-38, 0.4, 12)
    ], 50, 0x00f0ff, 0.45, 'loop-chw-supply');

    // 2. Chilled Water Return (CRAHs -> Chiller)
    this.chwReturnStream = this.createSplineParticleStream([
      new THREE.Vector3(-38, 0.4, -12),
      new THREE.Vector3(-4, 0.4, -12),
      new THREE.Vector3(7.5, 0.4, -6),
      new THREE.Vector3(13, 0.4, 2)
    ], 50, 0x38bdf8, 0.45, 'loop-chw-return');

    // 3. Condenser Water Return (Chiller -> Cooling Tower: Warm Amber)
    this.cwReturnStream = this.createSplineParticleStream([
      new THREE.Vector3(13, 2.2, 6),
      new THREE.Vector3(22, 2.2, 6),
      new THREE.Vector3(26, 7.8, 6),
      new THREE.Vector3(32, 7.8, 7)
    ], 45, 0xf59e0b, 0.5, 'loop-cw-return');

    // 4. Condenser Water Supply (Cooling Tower -> Chiller: Green)
    this.cwSupplyStream = this.createSplineParticleStream([
      new THREE.Vector3(32, 2.2, 7),
      new THREE.Vector3(26, 2.2, 9),
      new THREE.Vector3(18.5, 2.2, 12),
      new THREE.Vector3(13, 2.2, 9)
    ], 45, 0x10b981, 0.5, 'loop-cw-supply');

    // 5. Make-up Water (Storage Tank -> Tower Basin)
    this.makeupStream = this.createSplineParticleStream([
      new THREE.Vector3(13, 1.2, -14),
      new THREE.Vector3(24, 1.2, -14),
      new THREE.Vector3(28, 1.2, 3),
      new THREE.Vector3(32, 1.8, 4)
    ], 30, 0x2563eb, 0.38, 'loop-makeup');

    // 6. Blowdown Stream (Tower Basin -> Drain: Red/Rust)
    this.blowdownStream = this.createSplineParticleStream([
      new THREE.Vector3(32, 1.6, 10.5),
      new THREE.Vector3(35, 1.6, 12),
      new THREE.Vector3(42, 0.2, 12)
    ], 25, 0xef4444, 0.38, 'loop-blowdown');

    // 7. Liquid Cooling Stream (CDU -> Immersion Tanks & Dry Cooler)
    this.liquidStream = this.createSplineParticleStream([
      new THREE.Vector3(13, 3.2, 1),
      new THREE.Vector3(18.5, 3.2, 0),
      new THREE.Vector3(24, 3.2, -4),
      new THREE.Vector3(32, 4.0, -7)
    ], 40, 0xc084fc, 0.42, 'loop-liquid');
    this.liquidStream.mesh.visible = false;
  }

  initCoolingTowerPlume() {
    const plumeCount = 180;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(plumeCount * 3);
    const velocities = new Float32Array(plumeCount * 3);
    const lifetimes = new Float32Array(plumeCount);

    const baseOrigin = new THREE.Vector3(32, 9.5, 7);

    for (let i = 0; i < plumeCount; i++) {
      positions[i * 3] = baseOrigin.x + (Math.random() - 0.5) * 2.0;
      positions[i * 3 + 1] = baseOrigin.y + Math.random() * 8.0;
      positions[i * 3 + 2] = baseOrigin.z + (Math.random() - 0.5) * 2.0;

      velocities[i * 3] = (Math.random() - 0.5) * 0.4;
      velocities[i * 3 + 1] = 1.2 + Math.random() * 1.5;
      velocities[i * 3 + 2] = 0.3 + Math.random() * 0.6; // gentle wind drift
      lifetimes[i] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xe0f2fe,
      size: 1.4,
      transparent: true,
      opacity: 0.45,
      blending: THREE.NormalBlending,
      depthWrite: false
    });

    this.towerPlumeMesh = new THREE.Points(geometry, material);
    this.scene.add(this.towerPlumeMesh);

    this.towerPlumeObj = {
      geometry: geometry,
      positions: positions,
      velocities: velocities,
      lifetimes: lifetimes,
      baseOrigin: baseOrigin,
      count: plumeCount,
      update: (delta) => {
        if (!this.towerPlumeMesh.visible) return;
        const posAttr = geometry.attributes.position;
        for (let i = 0; i < plumeCount; i++) {
          lifetimes[i] += delta * 0.4;
          if (lifetimes[i] > 1.0) {
            lifetimes[i] = 0;
            positions[i * 3] = baseOrigin.x + (Math.random() - 0.5) * 1.6;
            positions[i * 3 + 1] = baseOrigin.y;
            positions[i * 3 + 2] = baseOrigin.z + (Math.random() - 0.5) * 1.6;
          } else {
            positions[i * 3] += velocities[i * 3] * delta;
            positions[i * 3 + 1] += velocities[i * 3 + 1] * delta;
            positions[i * 3 + 2] += velocities[i * 3 + 2] * delta;
          }
          posAttr.setXYZ(i, positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
        }
        posAttr.needsUpdate = true;
      }
    };
  }

  initThermalHotAisleParticles() {
    const heatCount = 120;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(heatCount * 3);
    const origins = [];

    for (let i = 0; i < heatCount; i++) {
      const x = -30 + Math.random() * 22;
      const y = 1.2 + Math.random() * 4.5;
      const z = (Math.random() - 0.5) * 3.5;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      origins.push({ x, y, z });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xff5500,
      size: 0.55,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.hotAisleMesh = new THREE.Points(geometry, material);
    this.scene.add(this.hotAisleMesh);

    this.hotAisleObj = {
      geometry: geometry,
      positions: positions,
      count: heatCount,
      update: (delta) => {
        if (!this.hotAisleMesh.visible) return;
        const posAttr = geometry.attributes.position;
        for (let i = 0; i < heatCount; i++) {
          positions[i * 3 + 1] += 1.8 * delta;
          if (positions[i * 3 + 1] > 6.2) {
            positions[i * 3 + 1] = 1.2;
          }
          posAttr.setXYZ(i, positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
        }
        posAttr.needsUpdate = true;
      }
    };
  }

  initColdAisleAirflow() {
    const coldCount = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(coldCount * 3);

    for (let i = 0; i < coldCount; i++) {
      const isAisle1 = Math.random() > 0.5;
      const z = isAisle1 ? 6.5 + (Math.random() - 0.5) * 2 : -6.5 + (Math.random() - 0.5) * 2;
      const x = -30 + Math.random() * 22;
      const y = 0.9 + Math.random() * 4.0;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.45,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.coldAisleMesh = new THREE.Points(geometry, material);
    this.scene.add(this.coldAisleMesh);

    this.coldAisleObj = {
      geometry: geometry,
      positions: positions,
      count: coldCount,
      update: (delta) => {
        if (!this.coldAisleMesh.visible) return;
        const posAttr = geometry.attributes.position;
        for (let i = 0; i < coldCount; i++) {
          positions[i * 3 + 1] += 0.9 * delta;
          if (positions[i * 3 + 1] > 5.5) {
            positions[i * 3 + 1] = 0.9;
          }
          posAttr.setXYZ(i, positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
        }
        posAttr.needsUpdate = true;
      }
    };
  }

  initImmersionBubbles() {
    const bubbleCount = 60;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(bubbleCount * 3);

    for (let i = 0; i < bubbleCount; i++) {
      positions[i * 3] = 18.5 + (Math.random() - 0.5) * 1.5;
      positions[i * 3 + 1] = 0.6 + Math.random() * 1.6;
      positions[i * 3 + 2] = (Math.random() > 0.5 ? -2.5 : 3.0) + (Math.random() - 0.5) * 2.8;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xe0e7ff,
      size: 0.35,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.immersionBubblesMesh = new THREE.Points(geometry, material);
    this.immersionBubblesMesh.visible = false;
    this.scene.add(this.immersionBubblesMesh);

    this.immersionBubblesObj = {
      geometry: geometry,
      positions: positions,
      count: bubbleCount,
      update: (delta) => {
        if (!this.immersionBubblesMesh.visible) return;
        const posAttr = geometry.attributes.position;
        for (let i = 0; i < bubbleCount; i++) {
          positions[i * 3 + 1] += 0.6 * delta;
          if (positions[i * 3 + 1] > 2.3) {
            positions[i * 3 + 1] = 0.6;
          }
          posAttr.setXYZ(i, positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
        }
        posAttr.needsUpdate = true;
      }
    };
  }

  setFlowSpeed(speed) {
    this.flowSpeed = speed;
  }

  setCoolingTechnology(tech) {
    this.activeCoolingTech = tech;
    if (tech === 'evaporative') {
      this.cwSupplyStream.mesh.visible = true;
      this.cwReturnStream.mesh.visible = true;
      this.makeupStream.mesh.visible = true;
      this.blowdownStream.mesh.visible = true;
      this.towerPlumeMesh.visible = true;
      this.liquidStream.mesh.visible = false;
      this.immersionBubblesMesh.visible = false;
    } else if (tech === 'air') {
      this.cwSupplyStream.mesh.visible = false;
      this.cwReturnStream.mesh.visible = false;
      this.makeupStream.mesh.visible = false;
      this.blowdownStream.mesh.visible = false;
      this.towerPlumeMesh.visible = false;
      this.liquidStream.mesh.visible = false;
      this.immersionBubblesMesh.visible = false;
    } else if (tech === 'liquid') {
      this.cwSupplyStream.mesh.visible = false;
      this.cwReturnStream.mesh.visible = false;
      this.makeupStream.mesh.visible = false;
      this.blowdownStream.mesh.visible = false;
      this.towerPlumeMesh.visible = false;
      this.liquidStream.mesh.visible = true;
      this.immersionBubblesMesh.visible = true;
    }
  }

  setCoolingMode(techId) {
    if (techId === 'air_cooled' || techId === 'air') {
      this.setCoolingTechnology('air');
    } else if (techId === 'liquid_immersion' || techId === 'liquid') {
      this.setCoolingTechnology('liquid');
    } else {
      this.setCoolingTechnology('evaporative');
    }
  }

  setStageVisibility(stageNum) {
    this.setStageHighlight(stageNum);
  }

  setStageHighlight(stageNum) {
    // Dim or highlight streams based on active water journey stage (1-7)
    // 1: Intake (Makeup)
    // 2: Storage (Tank level)
    // 3: Pumping (Pumps & supply lines)
    // 4: Heat Exchange (CRAH / Racks)
    // 5: Heat Rejection (Tower / Dry Cooler)
    // 6: Return & Recirculation
    // 7: Water Loss (Plume & Blowdown)
    const resetOpacity = () => {
      this.particleGroups.forEach(g => {
        g.mesh.material.opacity = 0.85;
      });
      if (this.towerPlumeMesh) this.towerPlumeMesh.material.opacity = 0.45;
    };

    resetOpacity();

    if (stageNum === 1) {
      this.makeupStream.mesh.material.opacity = 1.0;
    } else if (stageNum === 5 || stageNum === 7) {
      if (this.towerPlumeMesh) this.towerPlumeMesh.material.opacity = 0.85;
      this.blowdownStream.mesh.material.opacity = 1.0;
    }
  }

  update(delta) {
    // Update pipe streams
    for (let i = 0; i < this.particleGroups.length; i++) {
      this.particleGroups[i].update(delta, this.flowSpeed);
    }

    // Update plume
    if (this.towerPlumeObj) this.towerPlumeObj.update(delta);
    // Update thermal currents
    if (this.hotAisleObj) this.hotAisleObj.update(delta);
    if (this.coldAisleObj) this.coldAisleObj.update(delta);
    if (this.immersionBubblesObj) this.immersionBubblesObj.update(delta);
  }
}

export { WaterFlowParticleEngine as WaterFlowParticles };
