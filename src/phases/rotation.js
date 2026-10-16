import * as THREE from 'three';
import { gameState } from '../state/gameState.js';
import { playerState } from '../player/playerState.js';
import { WAR_ACTION_POINT } from '../scene/arena.js';

export class RotationPhase {
  constructor(scene, camera, teammateManager, onCompletePhase) {
    this.scene = scene;
    this.camera = camera;
    this.teammateManager = teammateManager;
    this.onCompletePhase = onCompletePhase;

    // Safe Zone parameters
    this.zoneCenter = new THREE.Vector3(WAR_ACTION_POINT.x, 0, WAR_ACTION_POINT.z);
    this.initialRadius = 110;
    this.targetRadius = 26;
    this.currentRadius = this.initialRadius;
    this.shrinkDuration = 45; // 45 seconds rotation timer
    this.elapsedTime = 0;
    this.isActive = false;

    // Visual Mesh for Zone Barrier
    this.zoneMesh = null;
    this.waypointMesh = null;
    this.hasOptimalRoute = false;

    this.createZoneVisual();
  }

  createZoneVisual() {
    // Translucent cylindrical energy barrier
    const zoneGeo = new THREE.CylinderGeometry(
      this.initialRadius,
      this.initialRadius,
      30,
      48,
      1,
      true
    );
    const zoneMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
    });
    this.zoneMesh = new THREE.Mesh(zoneGeo, zoneMat);
    this.zoneMesh.position.set(this.zoneCenter.x, 15, this.zoneCenter.z);
    this.scene.add(this.zoneMesh);
    this.zoneMesh.visible = false;

    // Waypoint beacon for optimal route from Scout
    const wpGeo = new THREE.CylinderGeometry(0.5, 0.5, 40, 16);
    const wpMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      transparent: true,
      opacity: 0.6
    });
    this.waypointMesh = new THREE.Mesh(wpGeo, wpMat);
    this.waypointMesh.position.set(0, 20, 0);
    this.scene.add(this.waypointMesh);
    this.waypointMesh.visible = false;
  }

  start() {
    this.isActive = true;
    this.elapsedTime = 0;
    this.currentRadius = this.initialRadius;
    this.zoneMesh.visible = true;

    gameState.setPhase('ROTATION');
    gameState.activeObjective = 'Rotate towards War Action Point (Center). Consult Scout for optimal route!';
    gameState.notify();
  }

  onInteraction(intentResult, targetTeammate) {
    if (!this.isActive) return;

    if (intentResult.intent === 'ASK_SAFE_ZONE_ROUTE') {
      this.hasOptimalRoute = true;
      this.waypointMesh.visible = true;
      gameState.addReadiness(15);
      gameState.activeObjective = 'Optimal route marked! Move quickly to the green beacon at center.';
      gameState.notify();
    }
  }

  update(delta) {
    if (!this.isActive) return;

    this.elapsedTime += delta;
    const progress = Math.min(1.0, this.elapsedTime / this.shrinkDuration);

    // Linear radius shrink
    this.currentRadius = THREE.MathUtils.lerp(this.initialRadius, this.targetRadius, progress);

    // Update zone 3D geometry scale
    const scale = this.currentRadius / this.initialRadius;
    this.zoneMesh.scale.set(scale, 1, scale);

    // Update zone color (from blue to orange/red as it tightens)
    if (progress > 0.7) {
      this.zoneMesh.material.color.setHex(0xef4444);
      this.zoneMesh.material.opacity = 0.35;
    }

    // Distance of player to zone center
    const playerPos = new THREE.Vector2(this.camera.position.x, this.camera.position.z);
    const zonePos2D = new THREE.Vector2(this.zoneCenter.x, this.zoneCenter.z);
    const distToCenter = playerPos.distanceTo(zonePos2D);

    // Out of zone damage & warning
    if (distToCenter > this.currentRadius) {
      playerState.takeDamage(4 * delta);
      gameState.activeObjective = '⚠️ OUTSIDE SAFE ZONE! Take cover inside the perimeter!';
    } else if (distToCenter <= WAR_ACTION_POINT.radius + 2 && progress >= 0.5) {
      gameState.activeObjective = 'Inside War Action Point! Squad regrouping for final combat.';
    }

    // Move teammates towards center during rotation
    this.moveTeammatesTowardsCenter(delta);

    // Completion condition: time up or player inside target radius after shrink
    if (progress >= 1.0 || (distToCenter <= this.targetRadius && progress >= 0.8)) {
      this.finishRotation();
    }
  }

  moveTeammatesTowardsCenter(delta) {
    for (const tm of this.teammateManager.teammates) {
      const dir = new THREE.Vector3()
        .subVectors(new THREE.Vector3(0, 0, 0), tm.group.position)
        .normalize();

      const dist = tm.group.position.distanceTo(new THREE.Vector3(0, 0, 0));
      if (dist > 8) {
        // Run towards center
        tm.group.position.addScaledVector(dir, 5.5 * delta);
        tm.position.copy(tm.group.position);
      }
    }
  }

  finishRotation() {
    if (!this.isActive) return;
    this.isActive = false;
    this.zoneMesh.visible = false;
    this.waypointMesh.visible = false;

    if (this.onCompletePhase) {
      this.onCompletePhase();
    }
  }
}
