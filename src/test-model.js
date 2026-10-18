import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// DOM Elements
const canvas = document.getElementById('model-canvas');
const loadStatus = document.getElementById('load-status');
const modelSelect = document.getElementById('model-select');
const modelFileName = document.getElementById('model-file-name');
const heightEl = document.getElementById('model-height');
const dimEl = document.getElementById('model-dimensions');
const triEl = document.getElementById('model-triangles');
const vertEl = document.getElementById('model-vertices');
const clipsContainer = document.getElementById('clips-container');
const animButtonsGroup = document.getElementById('anim-buttons-group');
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
camera.position.set(0, 1.3, 2.6);

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
controls.target.set(0, 0.9, 0);
controls.maxPolarAngle = Math.PI / 2 + 0.1;
controls.minDistance = 0.5;
controls.maxDistance = 10;

// 3. Lighting & Environment
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
keyLight.position.set(3, 5, 4);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.bias = -0.0001;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.1);
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

// Active model state
let currentModelGroup = null;
let mixer = null;
let actions = {};
let currentAction = null;
let currentActionName = 'idle';
const clock = new THREE.Clock();

function clearCurrentModel() {
  if (currentModelGroup) {
    scene.remove(currentModelGroup);
    currentModelGroup = null;
  }
  if (mixer) {
    mixer.stopAllAction();
    mixer.uncacheRoot(mixer.getRoot());
    mixer = null;
  }
  actions = {};
  currentAction = null;
}

function fadeToAction(name, duration = 0.25) {
  if (!actions[name] || currentActionName === name) return;

  const prevAction = currentAction;
  const nextAction = actions[name];
  currentAction = nextAction;
  currentActionName = name;

  if (prevAction) {
    prevAction.fadeOut(duration);
  }

  nextAction
    .reset()
    .setEffectiveTimeScale(1)
    .setEffectiveWeight(1)
    .fadeIn(duration)
    .play();

  playbackStatus.textContent = `Memutar animasi: "${name}" (${nextAction.getClip().duration.toFixed(2)}s)`;
  statusIndicator.classList.remove('idle');

  // Update button active styles
  document.querySelectorAll('.btn-anim').forEach((btn) => {
    if (btn.dataset.anim === name) {
      btn.style.background = '#3b82f6';
    } else {
      btn.style.background = '#334155';
    }
  });
}

// Bind Animation Buttons
document.querySelectorAll('.btn-anim').forEach((btn) => {
  btn.addEventListener('click', () => {
    const anim = btn.dataset.anim;
    fadeToAction(anim);
  });
});

// 4A. Load Hinaly FBX (Animated)
async function loadFbxModel() {
  clearCurrentModel();
  animButtonsGroup.style.display = 'block';
  modelFileName.textContent = 'public/models/Hinaly_Idle.fbx (+ Walking, Running, Jump)';

  loadStatus.textContent = 'Loading FBX...';
  loadStatus.style.background = 'rgba(245, 158, 11, 0.2)';
  loadStatus.style.color = '#f59e0b';
  statusIndicator.classList.add('idle');

  try {
    const fbxLoader = new FBXLoader();
    const textureLoader = new THREE.TextureLoader();

    const [idleFbx, walkFbx, runFbx, jumpFbx] = await Promise.all([
      fbxLoader.loadAsync('/models/Hinaly_Idle.fbx'),
      fbxLoader.loadAsync('/models/Hinaly_Walking.fbx'),
      fbxLoader.loadAsync('/models/Hinaly_Running.fbx'),
      fbxLoader.loadAsync('/models/Hinaly_Jump.fbx')
    ]);

    // Load texture
    const texturePath = '/models/textures/Hinaly_basecolor.png';
    const baseColorMap = await new Promise((resolve) => {
      textureLoader.load(
        texturePath,
        (t) => resolve(t),
        undefined,
        () => {
          textureLoader.load('/models/textures/Hinaly_basecolor.JPEG', resolve, undefined, () => resolve(null));
        }
      );
    });

    if (baseColorMap) {
      baseColorMap.colorSpace = THREE.SRGBColorSpace;
      baseColorMap.flipY = false;
    }

    idleFbx.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (baseColorMap && child.material) {
          child.material.map = baseColorMap;
          child.material.color.setHex(0xffffff);
          child.material.needsUpdate = true;
        }
      }
    });

    // Auto-scale to 1.8m
    const box = new THREE.Box3().setFromObject(idleFbx);
    const rawHeight = box.max.y - box.min.y;
    const targetHeight = 1.8;
    const scale = rawHeight > 0 ? targetHeight / rawHeight : 1.8;
    idleFbx.scale.setScalar(scale);

    // Center and feet on ground
    const scaledBox = new THREE.Box3().setFromObject(idleFbx);
    idleFbx.position.y = -scaledBox.min.y;
    idleFbx.position.x = -(scaledBox.min.x + scaledBox.max.x) / 2;
    idleFbx.position.z = -(scaledBox.min.z + scaledBox.max.z) / 2;

    const group = new THREE.Group();
    group.add(idleFbx);
    scene.add(group);
    currentModelGroup = group;

    // Animation Mixer Setup
    mixer = new THREE.AnimationMixer(idleFbx);

    const clipsData = [
      { name: 'idle', fbx: idleFbx },
      { name: 'walk', fbx: walkFbx },
      { name: 'run', fbx: runFbx },
      { name: 'jump', fbx: jumpFbx }
    ];

    let listHtml = '<ul class="clip-list">';
    clipsData.forEach((item, idx) => {
      if (item.fbx.animations && item.fbx.animations.length > 0) {
        const clip = item.fbx.animations[0].clone();
        clip.name = item.name;
        const action = mixer.clipAction(clip);
        if (item.name === 'jump') {
          action.setLoop(THREE.LoopOnce);
          action.clampWhenFinished = true;
        }
        actions[item.name] = action;
        listHtml += `
          <li class="clip-item">
            <span class="clip-name">${idx + 1}. ${item.name} (${item.fbx.animations[0].name})</span>
            <span class="clip-duration">${clip.duration.toFixed(2)}s</span>
          </li>
        `;
      }
    });
    listHtml += '</ul>';
    clipsContainer.innerHTML = listHtml;

    // Count Triangles and Vertices
    let totalTriangles = 0;
    let totalVertices = 0;
    idleFbx.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const geo = child.geometry;
        if (geo.index) totalTriangles += geo.index.count / 3;
        else if (geo.attributes.position) totalTriangles += geo.attributes.position.count / 3;
        if (geo.attributes.position) totalVertices += geo.attributes.position.count;
      }
    });

    const finalBox = new THREE.Box3().setFromObject(group);
    const size = new THREE.Vector3();
    finalBox.getSize(size);

    heightEl.textContent = `${size.y.toFixed(3)} m (auto-scaled ${scale.toFixed(2)}×)`;
    dimEl.textContent = `Bounding: ${size.x.toFixed(3)}m × ${size.y.toFixed(3)}m × ${size.z.toFixed(3)}m`;
    triEl.textContent = `${totalTriangles.toLocaleString('id-ID')} segitiga`;
    vertEl.textContent = `Vertices: ${totalVertices.toLocaleString('id-ID')}`;

    loadStatus.textContent = 'FBX Active';
    loadStatus.style.background = 'rgba(16, 185, 129, 0.2)';
    loadStatus.style.color = '#10b981';

    // Play default Idle
    if (actions.idle) {
      actions.idle.play();
      currentAction = actions.idle;
      currentActionName = 'idle';
      playbackStatus.textContent = `Memutar clip pertama: "idle" (${actions.idle.getClip().duration.toFixed(2)}s)`;
      statusIndicator.classList.remove('idle');
    }

    controls.target.set(0, size.y * 0.55, 0);
    camera.position.set(0, size.y * 0.65, size.y * 2.2);
    controls.update();
  } catch (err) {
    console.error('Error loading FBX model:', err);
    loadStatus.textContent = 'FBX Error';
    loadStatus.style.background = 'rgba(239, 68, 68, 0.2)';
    loadStatus.style.color = '#ef4444';
    playbackStatus.textContent = `Gagal memuat FBX: ${err.message}`;
  }
}

// 4B. Load Hinaly GLB (Static Mesh)
async function loadGlbModel() {
  clearCurrentModel();
  animButtonsGroup.style.display = 'none';
  modelFileName.textContent = 'public/models/hinaly.glb';

  loadStatus.textContent = 'Loading GLB...';
  loadStatus.style.background = 'rgba(245, 158, 11, 0.2)';
  loadStatus.style.color = '#f59e0b';
  statusIndicator.classList.add('idle');

  try {
    const gltfLoader = new GLTFLoader();
    const gltf = await gltfLoader.loadAsync('/models/hinaly.glb');
    const model = gltf.scene;

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    model.position.x -= center.x;
    model.position.y -= box.min.y;
    model.position.z -= center.z;

    scene.add(model);
    currentModelGroup = model;

    let totalTriangles = 0;
    let totalVertices = 0;
    model.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const geo = child.geometry;
        if (geo.index) totalTriangles += geo.index.count / 3;
        else if (geo.attributes.position) totalTriangles += geo.attributes.position.count / 3;
        if (geo.attributes.position) totalVertices += geo.attributes.position.count;
      }
    });

    heightEl.textContent = `${size.y.toFixed(3)} m (~${(size.y * 100).toFixed(1)} cm)`;
    dimEl.textContent = `Size: ${size.x.toFixed(3)}m × ${size.y.toFixed(3)}m × ${size.z.toFixed(3)}m`;
    triEl.textContent = `${totalTriangles.toLocaleString('id-ID')} segitiga`;
    vertEl.textContent = `Vertices: ${totalVertices.toLocaleString('id-ID')}`;

    loadStatus.textContent = 'GLB Active';
    loadStatus.style.background = 'rgba(16, 185, 129, 0.2)';
    loadStatus.style.color = '#10b981';

    clipsContainer.innerHTML = `
      <div class="empty-notice">
        ⚠️ Tidak ada animation clip di file (0 clips terdeteksi). Model merupakan static mesh (Tripo 2.0).
      </div>
    `;
    playbackStatus.textContent = 'Tidak ada clip untuk diputar (0 animasi di GLB).';

    controls.target.set(0, size.y * 0.5, 0);
    camera.position.set(0, size.y * 0.6, size.y * 2.2);
    controls.update();
  } catch (err) {
    console.error('Error loading GLB:', err);
    loadStatus.textContent = 'GLB Error';
    loadStatus.style.background = 'rgba(239, 68, 68, 0.2)';
    loadStatus.style.color = '#ef4444';
    playbackStatus.textContent = `Gagal memuat GLB: ${err.message}`;
  }
}

// Model Selector Event
modelSelect.addEventListener('change', (e) => {
  if (e.target.value === 'fbx') {
    loadFbxModel();
  } else {
    loadGlbModel();
  }
});

// Load FBX by default
loadFbxModel();

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
