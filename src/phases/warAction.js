import * as THREE from 'three';
import { gameState } from '../state/gameState.js';
import { playerState } from '../player/playerState.js';

export class WarActionPhase {
  constructor(scene, camera, enemyAiManager, teammateManager, onCompleteMatch) {
    this.scene = scene;
    this.camera = camera;
    this.enemyAiManager = enemyAiManager;
    this.teammateManager = teammateManager;
    this.onCompleteMatch = onCompleteMatch;

    this.isActive = false;
    this.raycaster = new THREE.Raycaster();
    this.tracerLines = [];
  }

  start() {
    this.isActive = true;
    gameState.setPhase('WAR_ACTION');
    this.updateObjective();
  }

  updateObjective() {
    const aliveEnemies = this.enemyAiManager.getAliveEnemies().length;
    const remainingSquads = this.enemyAiManager.getRemainingSquadCount();
    gameState.activeObjective = `⚔️ WAR ACTION: Eliminate enemies! Hostiles alive: ${aliveEnemies} | Squads: ${remainingSquads}`;
    gameState.notify();
  }

  // Hitscan player shooting (Additional Requirement 3)
  shoot() {
    if (!this.isActive) return;

    if (!playerState.consumeAmmo(1)) {
      // Out of ammo feedback
      gameState.activeObjective = '⚠️ OUT OF AMMO! Need to reload or request from Riley (Support)!';
      gameState.notify();
      return;
    }

    // Hitscan raycast from camera center
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

    const enemyMeshes = this.enemyAiManager.getAliveEnemies().map((e) => e.mesh);
    const intersects = this.raycaster.intersectObjects(enemyMeshes, false);

    let hitPoint = new THREE.Vector3();

    if (intersects.length > 0) {
      const hit = intersects[0];
      hitPoint.copy(hit.point);
      const enemy = hit.object.userData.enemy;

      if (enemy) {
        const killed = this.enemyAiManager.applyDamage(enemy, 35);
        gameState.matchStats.damageDealt += 35;
        if (killed) {
          gameState.matchStats.kills++;
        }
      }
    } else {
      // Ray goes into distance
      hitPoint = this.camera.position
        .clone()
        .add(this.camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(80));
    }

    // Visual bullet tracer
    this.createTracer(hitPoint);
    this.updateObjective();
  }

  createTracer(targetPos) {
    // Tracer starts slightly below camera to mimic gun barrel
    const startPos = this.camera.position.clone().add(new THREE.Vector3(0.2, -0.2, -0.4));
    const points = [startPos, targetPos];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0xfef08a, linewidth: 2 });
    const tracer = new THREE.Line(geo, mat);

    this.scene.add(tracer);

    setTimeout(() => {
      this.scene.remove(tracer);
      geo.dispose();
      mat.dispose();
    }, 60);
  }

  update(delta, time) {
    if (!this.isActive) return;

    // Run combat state machine
    this.enemyAiManager.updateCombat(
      delta,
      time,
      this.camera.position,
      this.teammateManager.teammates,
      (damage) => {
        playerState.takeDamage(damage);
        // Vignette warning if damaged
        this.flashDamageOverlay();
      }
    );

    this.updateObjective();

    // Check Win/Loss conditions
    if (!gameState.player.isAlive) {
      gameState.matchStats.rank = Math.max(2, this.enemyAiManager.getRemainingSquadCount());
      this.finishWarAction();
      return;
    }

    if (this.enemyAiManager.getAliveEnemies().length === 0) {
      gameState.matchStats.rank = 1; // VICTORY!
      this.finishWarAction();
      return;
    }
  }

  flashDamageOverlay() {
    const flashEl = document.getElementById('damage-flash');
    if (flashEl) {
      flashEl.style.opacity = '0.5';
      setTimeout(() => {
        flashEl.style.opacity = '0';
      }, 150);
    }
  }

  finishWarAction() {
    if (!this.isActive) return;
    this.isActive = false;
    gameState.setPhase('RESULT');
    gameState.matchStats.endTime = Date.now();

    if (this.onCompleteMatch) {
      this.onCompleteMatch();
    }
  }
}
