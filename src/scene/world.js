import * as THREE from 'three';

// Graphics quality presets per GDD 7.2
const GFX_PRESETS = {
  low:    { shadows: false, shadowMapSize: 0,    fog: false },
  medium: { shadows: true,  shadowMapSize: 1024, fog: true  },
  high:   { shadows: true,  shadowMapSize: 2048, fog: true  }
};

export class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.updateCallbacks = [];
    this.lastTime = performance.now();
    this.playerRef = null; // set by main.js after controller created

    // Scene
    this.scene = new THREE.Scene();

    // Sky gradient background (blue -> white-yellowish at horizon)
    this.scene.background = this._createSkyGradient();

    // Fog – horizon colour so far objects fade smoothly
    this.fog = new THREE.Fog(0xdce8c0, 80, 260);
    this.scene.fog = this.fog;

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
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.setupLights();
    this.setupResize();
    this.startLoop();

    // Apply default quality (high)
    this.setGraphicsQuality('high');
  }

  /* ---- Sky gradient via CanvasTexture ---- */
  _createSkyGradient() {
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 512;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0.0, '#5b9bd5');  // zenith – medium blue
    g.addColorStop(0.5, '#9ecae1');  // mid sky – light blue
    g.addColorStop(0.85, '#f5f0d0'); // near horizon – warm cream
    g.addColorStop(1.0, '#dce8c0');  // horizon – pale yellowish green
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1, 512);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /* ---- Lights ---- */
  setupLights() {
    // HemisphereLight: sky blue above, yellowish-green ground
    this.hemiLight = new THREE.HemisphereLight(0x87ceeb, 0xb5c457, 0.6);
    this.scene.add(this.hemiLight);

    // DirectionalLight – warm afternoon sun, ~45° angle
    this.sunLight = new THREE.DirectionalLight(0xffeabc, 1.4);
    this.sunLight.position.set(60, 80, 40);
    this.sunLight.castShadow = true;

    // Shadow camera follows player in limited area (40 unit box) for performance
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 200;
    const sd = 40;
    this.sunLight.shadow.camera.left = -sd;
    this.sunLight.shadow.camera.right = sd;
    this.sunLight.shadow.camera.top = sd;
    this.sunLight.shadow.camera.bottom = -sd;
    this.sunLight.shadow.bias = -0.0005;

    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);
  }

  /* ---- Graphics quality ---- */
  setGraphicsQuality(level) {
    const preset = GFX_PRESETS[level] || GFX_PRESETS.high;
    this.currentQuality = level;

    // Shadows
    this.renderer.shadowMap.enabled = preset.shadows;
    if (preset.shadows) {
      this.sunLight.shadow.mapSize.width = preset.shadowMapSize;
      this.sunLight.shadow.mapSize.height = preset.shadowMapSize;
      this.sunLight.castShadow = true;
      // Force shadow map re-creation
      if (this.sunLight.shadow.map) {
        this.sunLight.shadow.map.dispose();
        this.sunLight.shadow.map = null;
      }
    } else {
      this.sunLight.castShadow = false;
    }

    // Fog
    this.scene.fog = preset.fog ? this.fog : null;

    this.renderer.shadowMap.needsUpdate = true;
  }

  /* ---- Resize ---- */
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

  /* ---- Game Loop ---- */
  startLoop() {
    const sunOffset = new THREE.Vector3(60, 80, 40);

    const loop = (time) => {
      requestAnimationFrame(loop);
      const delta = Math.min((time - this.lastTime) / 1000, 0.1);
      this.lastTime = time;

      // Shadow camera follows player position
      if (this.playerRef) {
        const pp = this.playerRef();
        if (pp) {
          this.sunLight.position.copy(pp).add(sunOffset);
          this.sunLight.target.position.copy(pp);
          this.sunLight.target.updateMatrixWorld();
        }
      }

      for (const cb of this.updateCallbacks) {
        cb(delta, time);
      }

      this.renderer.render(this.scene, this.camera);
    };
    requestAnimationFrame(loop);
  }
}
