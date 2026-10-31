/**
 * scene.js
 * High-performance Three.js Scene, Camera, Lighting & Rendering Engine
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class SceneManager {
  constructor(canvasContainerId) {
    let elem = typeof canvasContainerId === 'string' ? document.getElementById(canvasContainerId) : canvasContainerId;
    if (!elem) elem = document.getElementById('webgl-canvas') || document.body;

    if (elem instanceof HTMLCanvasElement) {
      this.canvas = elem;
      this.container = elem.parentElement || document.body;
    } else {
      this.container = elem;
      this.canvas = elem.querySelector('canvas') || null;
    }

    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // Interactive clickable meshes pool
    this.interactiveObjects = [];
    this.hoveredObject = null;
    this.selectedObject = null;

    // Animation / Tweening
    this.cameraTween = null;
    this.renderCallbacks = [];
    this.clock = new THREE.Clock();

    this.init();
  }

  init() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060a12);
    this.scene.fog = new THREE.FogExp2(0x060a12, 0.008);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.5, 500);
    this.camera.position.set(45, 30, 48);

    // 3. Renderer
    const rendererOpts = {
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
      logarithmicDepthBuffer: true
    };
    if (this.canvas) {
      rendererOpts.canvas = this.canvas;
    }
    this.renderer = new THREE.WebGLRenderer(rendererOpts);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    if (!this.canvas) {
      this.container.appendChild(this.renderer.domElement);
    }

    // 4. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Don't go below floor
    this.controls.minDistance = 5;
    this.controls.maxDistance = 180;
    this.controls.target.set(0, 4, 0);

    // 5. Lighting
    this.setupLighting();

    // 6. Event listeners
    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove.bind(this));
    this.renderer.domElement.addEventListener('click', this.onClick.bind(this));

    // 7. Start Render Loop
    this.animate();
  }

  setupLighting() {
    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xd8e8ff, 0.85);
    this.scene.add(ambientLight);

    // Hemisphere Light (Sky vs Ground reflection)
    const hemiLight = new THREE.HemisphereLight(0x4488cc, 0x111622, 0.6);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

    // Directional Sunlight (Outdoor yard & shadows)
    const sunLight = new THREE.DirectionalLight(0xfff8ee, 1.8);
    sunLight.position.set(40, 60, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 160;
    const shadowDist = 45;
    sunLight.shadow.camera.left = -shadowDist;
    sunLight.shadow.camera.right = shadowDist;
    sunLight.shadow.camera.top = shadowDist;
    sunLight.shadow.camera.bottom = -shadowDist;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);

    // Interior Accent Spotlights (Server hall cool cyan light)
    const serverHallLight = new THREE.PointLight(0x00f0ff, 2.0, 35, 1.2);
    serverHallLight.position.set(-10, 10, 0);
    this.scene.add(serverHallLight);

    // Hot aisle warm indicator light
    const hotAisleLight = new THREE.PointLight(0xff6622, 2.2, 30, 1.2);
    hotAisleLight.position.set(-10, 8, -4);
    this.scene.add(hotAisleLight);

    // Equipment Room Industrial Light
    const mechRoomLight = new THREE.PointLight(0x38bdf8, 2.5, 35, 1.2);
    mechRoomLight.position.set(12, 10, 0);
    this.scene.add(mechRoomLight);

    // Cooling Tower Light
    const towerLight = new THREE.PointLight(0x10b981, 2.0, 30, 1.2);
    towerLight.position.set(28, 12, 0);
    this.scene.add(towerLight);
  }

  onWindowResize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  onPointerMove(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / this.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / this.height) * 2 + 1;

    // Raycast for hover
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

    const tooltip = document.getElementById('hover-tooltip');

    if (intersects.length > 0) {
      // Find top parent that has componentData
      let targetObj = intersects[0].object;
      while (targetObj && !targetObj.userData.componentData && targetObj.parent) {
        targetObj = targetObj.parent;
      }

      if (targetObj && targetObj.userData.componentData) {
        this.renderer.domElement.style.cursor = 'pointer';
        this.hoveredObject = targetObj;

        if (tooltip) {
          tooltip.style.display = 'block';
          tooltip.style.left = `${event.clientX}px`;
          tooltip.style.top = `${event.clientY}px`;
          tooltip.innerHTML = `<span>${targetObj.userData.componentData.name}</span>`;
        }
        return;
      }
    }

    this.renderer.domElement.style.cursor = 'default';
    this.hoveredObject = null;
    if (tooltip) tooltip.style.display = 'none';
  }

  onClick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / this.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / this.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

    if (intersects.length > 0) {
      let targetObj = intersects[0].object;
      while (targetObj && !targetObj.userData.componentData && targetObj.parent) {
        targetObj = targetObj.parent;
      }

      if (targetObj && targetObj.userData.componentData) {
        this.selectObject(targetObj);
      }
    }
  }

  selectObject(obj) {
    this.selectedObject = obj;
    // Dispatch custom event to window
    const event = new CustomEvent('component-selected', {
      detail: obj.userData.componentData
    });
    window.dispatchEvent(event);
  }

  registerInteractiveObject(object3d) {
    this.interactiveObjects.push(object3d);
  }

  addRenderCallback(cb) {
    this.renderCallbacks.push(cb);
  }

  onUpdate(cb) {
    this.addRenderCallback(cb);
  }

  resetView() {
    this.animateCamera({ x: 32, y: 22, z: 32 }, { x: 0, y: 3, z: 0 }, 1400);
  }

  animateCamera(pos, target, durationMs = 1400) {
    const p = pos instanceof THREE.Vector3 ? pos : new THREE.Vector3(pos.x, pos.y, pos.z);
    const t = target instanceof THREE.Vector3 ? target : new THREE.Vector3(target.x, target.y, target.z);
    this.animateCameraTo(p, t, durationMs / 1000);
  }

  /**
   * Smoothly interpolate camera position and lookAt target
   */
  animateCameraTo(targetPos, targetLookAt, duration = 1.6) {
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const startTime = performance.now();

    this.cameraTween = {
      update: (currentTime) => {
        const elapsed = (currentTime - startTime) / 1000;
        const progress = Math.min(elapsed / duration, 1.0);
        
        // Smooth ease-in-out curve
        const ease = progress < 0.5 
          ? 4 * progress * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        this.camera.position.lerpVectors(startPos, targetPos, ease);
        this.controls.target.lerpVectors(startTarget, targetLookAt, ease);

        if (progress >= 1.0) {
          this.cameraTween = null;
        }
      }
    };
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    // Update active camera tween
    if (this.cameraTween) {
      this.cameraTween.update(performance.now());
    }

    this.controls.update();

    // Call external animations (particles, fans, water level)
    for (let i = 0; i < this.renderCallbacks.length; i++) {
      this.renderCallbacks[i](delta, time);
    }

    this.renderer.render(this.scene, this.camera);
  }
}
