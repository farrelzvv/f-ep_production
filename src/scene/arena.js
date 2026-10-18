import * as THREE from 'three';

// 6 Game Locations according to GDD & DECISIONS.md
export const BASES = [
  { id: 1, name: 'Base 1 (Player Squad)', x: 0, z: 70, color: 0x3b82f6 },
  { id: 2, name: 'Base 2 (AI Alpha)', x: -70, z: 20, color: 0x8b5cf6 },
  { id: 3, name: 'Base 3 (AI Bravo)', x: -50, z: -60, color: 0xec4899 },
  { id: 4, name: 'Base 4 (AI Charlie)', x: 50, z: -60, color: 0xf97316 },
  { id: 5, name: 'Base 5 (AI Delta)', x: 70, z: 20, color: 0x14b8a6 },
];

export const WAR_ACTION_POINT = { x: 0, z: 0, radius: 25, name: 'War Action Point' };

export class Arena {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.createGround();
    this.createPerimeterWalls();
    this.createBasePlatforms();
    this.createWarActionPoint();
    this.createCoverObstacles();
  }

  createGround() {
    // Soft green grass
    const groundGeo = new THREE.PlaneGeometry(240, 240);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x8fbf6f,
      roughness: 0.9,
      metalness: 0.0,
      flatShading: true
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Subtle path grid – light grey with cream tones
    const grid = new THREE.GridHelper(240, 48, 0xc8c0a8, 0xd4cdb4);
    grid.position.y = 0.02;
    grid.material.opacity = 0.3;
    grid.material.transparent = true;
    this.scene.add(grid);
  }

  createPerimeterWalls() {
    // 4 outer boundary walls – salmon / terracotta pastel
    const wallHeight = 6;
    const wallThickness = 2;
    const size = 240;
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xd4a08a,
      roughness: 0.8,
      flatShading: true
    });

    const configs = [
      { x: 0, z: -size / 2, w: size, d: wallThickness },
      { x: 0, z: size / 2, w: size, d: wallThickness },
      { x: -size / 2, z: 0, w: wallThickness, d: size },
      { x: size / 2, z: 0, w: wallThickness, d: size }
    ];

    for (const c of configs) {
      const wallGeo = new THREE.BoxGeometry(c.w, wallHeight, c.d);
      const wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(c.x, wallHeight / 2, c.z);
      wall.receiveShadow = true;
      wall.castShadow = true;
      this.scene.add(wall);
      this.colliders.push(wall);
    }
  }

  createBasePlatforms() {
    for (const base of BASES) {
      // Cylindrical platform – cream / beige
      const platGeo = new THREE.CylinderGeometry(12, 13, 0.4, 32);
      const platMat = new THREE.MeshStandardMaterial({
        color: 0xe8dcc8,
        roughness: 0.7,
        flatShading: true
      });
      const platform = new THREE.Mesh(platGeo, platMat);
      platform.position.set(base.x, 0.2, base.z);
      platform.receiveShadow = true;
      this.scene.add(platform);

      // Base border ring (keep team color)
      const ringGeo = new THREE.RingGeometry(11.5, 12.2, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: base.color,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(base.x, 0.41, base.z);
      this.scene.add(ring);

      // Simple supply boxes in base
      this.createSupplyCrate(base.x - 4, base.z - 3);
      this.createSupplyCrate(base.x - 3, base.z - 4);
    }
  }

  createSupplyCrate(x, z) {
    const crateGeo = new THREE.BoxGeometry(1.4, 1.2, 1.4);
    const crateMat = new THREE.MeshStandardMaterial({
      color: 0xc4b896,
      roughness: 0.6,
      flatShading: true
    });
    const crate = new THREE.Mesh(crateGeo, crateMat);
    crate.position.set(x, 0.6, z);
    crate.castShadow = true;
    crate.receiveShadow = true;
    this.scene.add(crate);
    this.colliders.push(crate);
  }

  createWarActionPoint() {
    // Central circular arena zone – light stone grey
    const centerGeo = new THREE.CylinderGeometry(
      WAR_ACTION_POINT.radius,
      WAR_ACTION_POINT.radius + 1,
      0.3,
      48
    );
    const centerMat = new THREE.MeshStandardMaterial({
      color: 0xd9d0c0,
      roughness: 0.6,
      flatShading: true
    });
    const centerMesh = new THREE.Mesh(centerGeo, centerMat);
    centerMesh.position.set(0, 0.15, 0);
    centerMesh.receiveShadow = true;
    this.scene.add(centerMesh);

    // Glowing boundary ring (keep red for gameplay clarity)
    const ringGeo = new THREE.RingGeometry(
      WAR_ACTION_POINT.radius - 0.5,
      WAR_ACTION_POINT.radius,
      48
    );
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.32, 0);
    this.scene.add(ring);

    // Central Pillar / Beacon monument – mint green
    const pillarGeo = new THREE.BoxGeometry(3, 14, 3);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0xa8d8b9,
      roughness: 0.4,
      metalness: 0.1,
      flatShading: true
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(0, 7, 0);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    this.scene.add(pillar);
    this.colliders.push(pillar);

    // Light beacon atop the pillar (softer warm glow)
    const lightBeacon = new THREE.PointLight(0xffe0a0, 1.5, 40);
    lightBeacon.position.set(0, 15, 0);
    this.scene.add(lightBeacon);
  }

  createCoverObstacles() {
    // Tactical barriers – pastel building tones
    const obstacleLocations = [
      { x: 0, z: 35, w: 6, h: 2.2, d: 1.5, rot: 0 },
      { x: -35, z: 10, w: 1.5, h: 2.2, d: 6, rot: 0.4 },
      { x: -25, z: -30, w: 5, h: 2.2, d: 1.5, rot: -0.6 },
      { x: 25, z: -30, w: 5, h: 2.2, d: 1.5, rot: 0.6 },
      { x: 35, z: 10, w: 1.5, h: 2.2, d: 6, rot: -0.4 },
      // Midfield cover near center
      { x: -12, z: 12, w: 3, h: 2, d: 3, rot: 0 },
      { x: 12, z: 12, w: 3, h: 2, d: 3, rot: 0 },
      { x: -12, z: -12, w: 3, h: 2, d: 3, rot: 0 },
      { x: 12, z: -12, w: 3, h: 2, d: 3, rot: 0 }
    ];

    // Alternate salmon and krem colours for variety
    const obsMats = [
      new THREE.MeshStandardMaterial({ color: 0xe8a090, roughness: 0.7, flatShading: true }),  // salmon
      new THREE.MeshStandardMaterial({ color: 0xddd8c4, roughness: 0.7, flatShading: true }),  // cream
      new THREE.MeshStandardMaterial({ color: 0xa8d8b9, roughness: 0.7, flatShading: true })   // mint green
    ];

    for (let i = 0; i < obstacleLocations.length; i++) {
      const loc = obstacleLocations[i];
      const geo = new THREE.BoxGeometry(loc.w, loc.h, loc.d);
      const mesh = new THREE.Mesh(geo, obsMats[i % obsMats.length]);
      mesh.position.set(loc.x, loc.h / 2, loc.z);
      mesh.rotation.y = loc.rot;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.colliders.push(mesh);
    }
  }
}
