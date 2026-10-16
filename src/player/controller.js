import * as THREE from 'three';
import { playerState } from './playerState.js';

export class PlayerController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Movement state
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false
    };

    // Camera angles
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.isLocked = false;

    // Position and collision
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.arenaBounds = 115; // half-width boundary limit
    this.onShootCallback = null;

    this.setupInputs();
  }

  setupInputs() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      // If typing in input box, ignore WASD game inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

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
      }
    });

    window.addEventListener('keyup', (e) => {
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

      this.euler.setFromQuaternion(this.camera.quaternion);
      this.euler.y -= movementX * 0.0022;
      this.euler.x -= movementY * 0.0022;

      // Clamp vertical look angle
      const PI_2 = Math.PI / 2;
      this.euler.x = Math.max(-PI_2 + 0.05, Math.min(PI_2 - 0.05, this.euler.x));

      this.camera.quaternion.setFromEuler(this.euler);
    });
  }

  onShoot(callback) {
    this.onShootCallback = callback;
  }

  update(delta) {
    // Determine movement direction
    this.direction.z = Number(this.keys.forward) - Number(this.keys.backward);
    this.direction.x = Number(this.keys.right) - Number(this.keys.left);
    this.direction.normalize();

    const speed = playerState.speed * (this.keys.sprint ? playerState.sprintMultiplier : 1.0);

    // Compute forward & right vectors based on camera horizontal yaw
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
      moveVector.normalize().multiplyScalar(speed * delta);
      this.camera.position.add(moveVector);
    }

    // Keep camera grounded at player eye height
    this.camera.position.y = 1.8;

    // Arena boundary clamp
    this.camera.position.x = Math.max(-this.arenaBounds, Math.min(this.arenaBounds, this.camera.position.x));
    this.camera.position.z = Math.max(-this.arenaBounds, Math.min(this.arenaBounds, this.camera.position.z));
  }
}
