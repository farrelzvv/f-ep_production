import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// DOM Elements
const canvas = document.getElementById('model-canvas');
const loadStatus = document.getElementById('load-status');
const heightEl = document.getElementById('model-height');
const dimEl = document.getElementById('model-dimensions');
const triEl = document.getElementById('model-triangles');
const vertEl = document.getElementById('model-vertices');
const clipsContainer = document.getElementById('clips-container');
const playbackStatus = document.getElementById('playback-status');
const statusIndicator = document.getElementById('status-indicator');

// 1. Scene, Camera, Renderer Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f172a);
scene.fog = new THREE.FogExp2(0x0f172a, 0.05);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 1.2, 2.5);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// 2. Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0.5, 0);
controls.maxPolarAngle = Math.PI / 2 + 0.1; // Don't dip below floor too much
controls.minDistance = 0.5;
controls.maxDistance = 10;

// 3. Lighting & Environment
const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
keyLight.position.set(3, 5, 4);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.bias = -0.0001;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
fillLight.position.set(-3, 3, -2);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xa855f7, 0.8);
rimLight.position.set(0, 4, -4);
scene.add(rimLight);

// Floor Grid & Platform
const grid = new THREE.GridHelper(10, 20, 0x38bdf8, 0x1e293b);
grid.position.y = 0;
scene.add(grid);

const platGeo = new THREE.CylinderGeometry(1.2, 1.3, 0.08, 32);
const platMat = new THREE.MeshStandardMaterial({
  color: 0x1e293b,
  roughness: 0.6
});
const platform = new THREE.Mesh(platGeo, platMat);
platform.position.y = -0.04;
platform.receiveShadow = true;
scene.add(platform);

// 4. Load Model with GLTFLoader
const loader = new GLTFLoader();
let mixer = null;
const clock = new THREE.Clock();

console.log('Loading /models/hinaly.glb...');

loader.load(
  '/models/hinaly.glb',
  (gltf) => {
    console.log('GLTF Loaded successfully:', gltf);
    const model = gltf.scene;

    // Enable shadows on meshes
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Compute Bounding Box & Dimensions
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Align feet to y=0 and center on XZ
    model.position.x -= center.x;
    model.position.y -= box.min.y;
    model.position.z -= center.z;

    scene.add(model);

    // Update camera target to center of character
    controls.target.set(0, size.y * 0.5, 0);
    camera.position.set(0, size.y * 0.6, size.y * 2.2);
    controls.update();

    // Calculate Triangle & Vertex Count
    let totalTriangles = 0;
    let totalVertices = 0;

    model.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const geo = child.geometry;
        if (geo.index) {
          totalTriangles += geo.index.count / 3;
        } else if (geo.attributes.position) {
          totalTriangles += geo.attributes.position.count / 3;
        }
        if (geo.attributes.position) {
          totalVertices += geo.attributes.position.count;
        }
      }
    });

    // Update UI Elements
    loadStatus.textContent = 'Loaded';
    loadStatus.style.background = 'rgba(16, 185, 129, 0.2)';
    loadStatus.style.color = '#10b981';

    heightEl.textContent = `${size.y.toFixed(3)} m (~${(size.y * 100).toFixed(1)} cm)`;
    dimEl.textContent = `Size: ${size.x.toFixed(3)}m × ${size.y.toFixed(3)}m × ${size.z.toFixed(3)}m`;

    triEl.textContent = `${totalTriangles.toLocaleString('id-ID')} segitiga`;
    vertEl.textContent = `Vertices: ${totalVertices.toLocaleString('id-ID')}`;

    // Animation Clips & Playback
    const animations = gltf.animations || [];
    console.log(`Animations found: ${animations.length}`);

    if (animations.length > 0) {
      // List all animation clips with duration
      let listHtml = '<ul class="clip-list">';
      animations.forEach((clip, index) => {
        listHtml += `
          <li class="clip-item">
            <span class="clip-name">${index + 1}. ${clip.name || 'Unnamed Clip'}</span>
            <span class="clip-duration">${clip.duration.toFixed(2)}s</span>
          </li>
        `;
      });
      listHtml += '</ul>';
      clipsContainer.innerHTML = listHtml;

      // Play first clip
      mixer = new THREE.AnimationMixer(model);
      const firstAction = mixer.clipAction(animations[0]);
      firstAction.play();

      playbackStatus.textContent = `Memutar clip pertama: "${animations[0].name || 'Clip 1'}" (${animations[0].duration.toFixed(2)}s)`;
      statusIndicator.classList.remove('idle');
    } else {
      clipsContainer.innerHTML = `
        <div class="empty-notice">
          ⚠️ Tidak ada animation clip di file (0 clips terdeteksi). Model merupakan static mesh (Tripo 2.0).
        </div>
      `;
      playbackStatus.textContent = 'Tidak ada clip untuk diputar (0 animasi di GLB).';
      statusIndicator.classList.add('idle');
    }
  },
  (progress) => {
    if (progress.total > 0) {
      const pct = Math.round((progress.loaded / progress.total) * 100);
      loadStatus.textContent = `Loading ${pct}%`;
    }
  },
  (error) => {
    console.error('Error loading GLTF model:', error);
    loadStatus.textContent = 'Error';
    loadStatus.style.background = 'rgba(239, 68, 68, 0.2)';
    loadStatus.style.color = '#ef4444';
    clipsContainer.innerHTML = `<div class="empty-notice" style="color: #ef4444;">Gagal memuat model: ${error.message}</div>`;
    playbackStatus.textContent = 'Gagal memuat model.';
  }
);

// 5. Window Resize Handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 6. Animation Loop
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  if (mixer) {
    mixer.update(delta);
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();
