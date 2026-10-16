import * as THREE from 'three';

export class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.updateCallbacks = [];
    this.lastTime = performance.now();

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a202c);
    this.scene.fog = new THREE.FogExp2(0x1a202c, 0.008);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 1.8, 70); // Eye level at Base 1

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.setupLights();
    this.setupResize();
    this.startLoop();
  }

  setupLights() {
    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    // Directional Light (Sun)
    const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
    sunLight.position.set(40, 80, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 250;
    const shadowD = 100;
    sunLight.shadow.camera.left = -shadowD;
    sunLight.shadow.camera.right = shadowD;
    sunLight.shadow.camera.top = shadowD;
    sunLight.shadow.camera.bottom = -shadowD;
    this.scene.add(sunLight);
  }

  setupResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  onUpdate(callback) {
    this.updateCallbacks.push(callback);
  }

  startLoop() {
    const loop = (time) => {
      requestAnimationFrame(loop);
      const delta = Math.min((time - this.lastTime) / 1000, 0.1);
      this.lastTime = time;

      for (const cb of this.updateCallbacks) {
        cb(delta, time);
      }

      this.renderer.render(this.scene, this.camera);
    };
    requestAnimationFrame(loop);
  }
}
