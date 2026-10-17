import * as THREE from 'three';
import { playerState } from './playerState.js';

export class PlayerController {
  constructor(camera, domElement, scene = null, colliders = []) {
    this.camera = camera;
    this.domElement = domElement;
    this.scene = scene;
    this.colliders = colliders;

    // Movement state
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      jump: false
    };

    // Camera mode: 'third_person' | 'first_person'
    this.cameraMode = 'third_person';

    // Camera angles & raycaster for collision
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.isLocked = false;
    this.camRaycaster = new THREE.Raycaster();

    // Player character world position & physics
    this.position = new THREE.Vector3(0, 0, 70); // Base 1 start coordinates
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.arenaBounds = 115; // half-width boundary limit
    this.onShootCallback = null;

    // Gravity and jump physics
    this.gravity = -26;
    this.jumpForce = 8.5;
    this.isGrounded = true;
    this.groundY = 0;
    this.eyeHeight = 1.8;

    // Third-person camera settings
    this.camDistance = 3.8;
    this.camHeightOffset = 0.4;

    this.characterMesh = null;
    if (this.scene) {
      this.createCharacterMesh();
    }

    this.setupInputs();
    this.updateCamera();
  }

  createCharacterMesh() {
    this.characterMesh = new THREE.Group();

    // Body (Capsule geometry)
    const bodyGeo = new THREE.CapsuleGeometry(0.45, 0.9, 8, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb, // Tactical Blue (Protagonist Hinaly)
      roughness: 0.5,
      metalness: 0.2
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.95;
    body.castShadow = true;
    body.receiveShadow = true;
    this.characterMesh.add(body);

    // Tactical Chest Vest / Armor
    const vestGeo = new THREE.BoxGeometry(0.68, 0.55, 0.48);
    const vestMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6
    });
    const vest = new THREE.Mesh(vestGeo, vestMat);
    vest.position.set(0, 1.05, 0);
    vest.castShadow = true;
    this.characterMesh.add(vest);

    // Helmet / Head
    const headGeo = new THREE.BoxGeometry(0.46, 0.42, 0.44);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.4
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.58, 0);
    head.castShadow = true;
    this.characterMesh.add(head);

    // Visor (Facing forward towards +Z)
    const visorGeo = new THREE.BoxGeometry(0.48, 0.18, 0.22);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.8
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 1.6, 0.16);
    this.characterMesh.add(visor);

    // Shoulder Pads / Accents
    const shoulderGeo = new THREE.BoxGeometry(0.2, 0.18, 0.25);
    const shoulderMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
    const leftShoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
    leftShoulder.position.set(-0.35, 1.3, 0);
    const rightShoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
    rightShoulder.position.set(0.35, 1.3, 0);
    this.characterMesh.add(leftShoulder);
    this.characterMesh.add(rightShoulder);

    // Weapon / Rifle held in hands pointing towards +Z
    const gunGeo = new THREE.BoxGeometry(0.12, 0.16, 0.65);
    const gunMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.3,
      metalness: 0.7
    });
    const gun = new THREE.Mesh(gunGeo, gunMat);
    gun.position.set(0.32, 1.15, 0.35);
    gun.castShadow = true;
    this.characterMesh.add(gun);

    // Weapon barrel tip
    const barrelGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.25, 8);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9 });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0.32, 1.15, 0.75);
    this.characterMesh.add(barrel);

    // Role beacon on top
    const beaconGeo = new THREE.OctahedronGeometry(0.18);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 2.05;
    this.characterMesh.add(beacon);

    this.characterMesh.position.copy(this.position);
    this.characterMesh.visible = (this.cameraMode === 'third_person');

    this.scene.add(this.characterMesh);
  }

  isInputFocused() {
    const active = document.activeElement;
    return !!(active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA'));
  }

  resetMovementKeys() {
    this.keys.forward = false;
    this.keys.backward = false;
    this.keys.left = false;
    this.keys.right = false;
    this.keys.sprint = false;
    this.keys.jump = false;
  }

  toggleCameraMode() {
    this.cameraMode = this.cameraMode === 'third_person' ? 'first_person' : 'third_person';
    if (this.characterMesh) {
      this.characterMesh.visible = (this.cameraMode === 'third_person');
    }
    // Clamp pitch for mode
    if (this.cameraMode === 'third_person') {
      this.euler.x = Math.max(-0.85, Math.min(0.85, this.euler.x));
    }
    this.updateCamera();
  }

  setupInputs() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      // If typing in input box, ignore Space, WASD, and other game inputs
      if (this.isInputFocused() || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.sprint = true;
          break;
        case 'Space':
          e.preventDefault();
          this.keys.jump = true;
          break;
        case 'KeyV':
          this.toggleCameraMode();
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.isInputFocused() || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        this.resetMovementKeys();
        return;
      }

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.sprint = false;
          break;
        case 'Space':
          this.keys.jump = false;
          break;
      }
    });

    // Pointer Lock
    this.domElement.addEventListener('click', (e) => {
      // Don't lock if clicking inside interactive UI elements
      if (e.target.closest('#hud-text-input-container') || e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') {
        return;
      }
      if (!this.isLocked) {
        this.domElement.requestPointerLock();
      } else if (e.button === 0 && this.onShootCallback) {
        this.onShootCallback();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement;
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isLocked) return;

      const movementX = e.movementX || 0;
      const movementY = e.movementY || 0;

      this.euler.y -= movementX * 0.0022;
      this.euler.x -= movementY * 0.0022;

      // Clamp vertical look angle (pitch)
      if (this.cameraMode === 'third_person') {
        this.euler.x = Math.max(-0.85, Math.min(0.85, this.euler.x));
      } else {
        const PI_2 = Math.PI / 2;
        this.euler.x = Math.max(-PI_2 + 0.05, Math.min(PI_2 - 0.05, this.euler.x));
      }

      this.updateCamera();
    });
  }

  onShoot(callback) {
    this.onShootCallback = callback;
  }

  onPlayerShoot() {
    // When shooting in third-person, character faces camera aim direction
    if (this.characterMesh && this.cameraMode === 'third_person') {
      this.characterMesh.rotation.y = this.euler.y;
    }
  }

  getMuzzlePosition() {
    if (this.cameraMode === 'first_person') {
      const offset = new THREE.Vector3(0.2, -0.2, -0.4).applyQuaternion(this.camera.quaternion);
      return this.camera.position.clone().add(offset);
    }
    // Weapon tip position on character model
    const localMuzzle = new THREE.Vector3(0.32, 1.15, 0.88);
    localMuzzle.applyEuler(new THREE.Euler(0, this.characterMesh ? this.characterMesh.rotation.y : this.euler.y, 0));
    return this.position.clone().add(localMuzzle);
  }

  getPlayerPosition() {
    return this.position;
  }

  updateCamera() {
    if (this.cameraMode === 'first_person') {
      this.camera.position.set(
        this.position.x,
        this.position.y + this.eyeHeight,
        this.position.z
      );
      this.camera.quaternion.setFromEuler(this.euler);
      return;
    }

    // Third-person camera positioning
    const camQuat = new THREE.Quaternion().setFromEuler(this.euler);
    this.camera.quaternion.copy(camQuat);

    // Pivot around player upper body
    const pivot = new THREE.Vector3(
      this.position.x,
      this.position.y + 1.45,
      this.position.z
    );

    const upwardOffset = new THREE.Vector3(0, this.camHeightOffset, 0);
    const rayOrigin = pivot.clone().add(upwardOffset);

    // Direction pointing backwards from pivot towards camera
    const backwardDir = new THREE.Vector3(0, 0, 1).applyQuaternion(camQuat);

    let actualDistance = this.camDistance;

    // Camera obstacle collision: prevent camera from penetrating walls or barricades
    if (this.colliders && this.colliders.length > 0) {
      this.camRaycaster.set(rayOrigin, backwardDir);
      this.camRaycaster.far = this.camDistance;
      const hits = this.camRaycaster.intersectObjects(this.colliders, false);

      if (hits.length > 0) {
        // Keep camera 0.25m in front of wall surface
        actualDistance = Math.max(0.4, hits[0].distance - 0.25);
      }
    }

    this.camera.position.copy(rayOrigin).addScaledVector(backwardDir, actualDistance);

    // Ground clearance
    if (this.camera.position.y < 0.35) {
      this.camera.position.y = 0.35;
    }

    // Arena boundary clamp on camera
    const maxBound = this.arenaBounds - 0.5;
    this.camera.position.x = Math.max(-maxBound, Math.min(maxBound, this.camera.position.x));
    this.camera.position.z = Math.max(-maxBound, Math.min(maxBound, this.camera.position.z));
  }

  update(delta) {
    // If input is focused, reset movement keys so character doesn't slide
    if (this.isInputFocused()) {
      this.resetMovementKeys();
    }

    // Determine movement direction
    this.direction.z = Number(this.keys.forward) - Number(this.keys.backward);
    this.direction.x = Number(this.keys.right) - Number(this.keys.left);
    this.direction.normalize();

    const speed = playerState.speed * (this.keys.sprint ? playerState.sprintMultiplier : 1.0);

    // Compute forward & right vectors based on camera horizontal yaw (WASD moves relative to camera)
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      this.euler.y
    );
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      this.euler.y
    );

    const moveVector = new THREE.Vector3();
    if (this.direction.z !== 0) moveVector.addScaledVector(forward, this.direction.z);
    if (this.direction.x !== 0) moveVector.addScaledVector(right, this.direction.x);

    if (moveVector.lengthSq() > 0) {
      moveVector.normalize();
      this.position.addScaledVector(moveVector, speed * delta);

      // Character body faces the direction of movement
      if (this.characterMesh) {
        const targetYaw = Math.atan2(moveVector.x, moveVector.z);
        let diff = targetYaw - this.characterMesh.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.characterMesh.rotation.y += diff * Math.min(1.0, 16 * delta);
      }
    }

    // Jump trigger (only allowed if grounded and not typing)
    if (this.keys.jump && this.isGrounded && !this.isInputFocused()) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
      this.keys.jump = false;
    }

    // Apply gravity and vertical movement
    if (!this.isGrounded) {
      this.velocity.y += this.gravity * delta;
      this.position.y += this.velocity.y * delta;

      if (this.position.y <= this.groundY) {
        this.position.y = this.groundY;
        this.velocity.y = 0;
        this.isGrounded = true;
      }
    } else {
      this.position.y = this.groundY;
      this.velocity.y = 0;
    }

    // Arena boundary clamp
    this.position.x = Math.max(-this.arenaBounds, Math.min(this.arenaBounds, this.position.x));
    this.position.z = Math.max(-this.arenaBounds, Math.min(this.arenaBounds, this.position.z));

    // Update character mesh position and visibility
    if (this.characterMesh) {
      this.characterMesh.position.copy(this.position);
      this.characterMesh.visible = (this.cameraMode === 'third_person');
    }

    // Update camera position to follow character with collision avoidance
    this.updateCamera();
  }
}
