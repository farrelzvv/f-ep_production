import * as THREE from 'three';
import { BASES, WAR_ACTION_POINT } from '../scene/arena.js';
import { gameState } from '../state/gameState.js';

export const ENEMY_SQUAD_DEFS = [
  { id: 2, name: 'Squad Alpha', base: BASES[1], color: 0x8b5cf6 },
  { id: 3, name: 'Squad Bravo', base: BASES[2], color: 0xec4899 },
  { id: 4, name: 'Squad Charlie', base: BASES[3], color: 0xf97316 },
  { id: 5, name: 'Squad Delta', base: BASES[4], color: 0x14b8a6 }
];

export class EnemyAiManager {
  constructor(scene) {
    this.scene = scene;
    this.enemies = [];
    this.livingSquads = new Set([1, 2, 3, 4, 5]); // Squad 1 is player's squad
    this.spawnAllEnemySquads();
  }

  spawnAllEnemySquads() {
    for (const squad of ENEMY_SQUAD_DEFS) {
      const offsets = [
        { x: -2, z: -2 },
        { x: 2, z: -2 },
        { x: -2, z: 2 },
        { x: 2, z: 2 }
      ];

      for (let i = 0; i < 4; i++) {
        const off = offsets[i];
        const x = squad.base.x + off.x;
        const z = squad.base.z + off.z;

        const group = new THREE.Group();
        group.position.set(x, 0, z);

        // Body primitive
        const bodyGeo = new THREE.CapsuleGeometry(0.5, 1.0, 6, 12);
        const bodyMat = new THREE.MeshStandardMaterial({
          color: squad.color,
          roughness: 0.5
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.0;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        // Head visor
        const visorGeo = new THREE.BoxGeometry(0.5, 0.2, 0.4);
        const visorMat = new THREE.MeshStandardMaterial({ color: 0x1f2937 });
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(0, 1.45, 0.3);
        group.add(visor);

        this.scene.add(group);

        const enemyObj = {
          id: `enemy_${squad.id}_${i}`,
          squadId: squad.id,
          squadName: squad.name,
          color: squad.color,
          group,
          mesh: body,
          hp: 75,
          maxHp: 75,
          isAlive: true,
          position: new THREE.Vector3(x, 1.0, z),
          state: 'IDLE', // IDLE | MOVE_TO_WAR | ENGAGE | DEAD
          lastAttackTime: Math.random() * 2000
        };

        // Store reference on mesh for hitscan raycasting
        body.userData = { enemy: enemyObj };
        this.enemies.push(enemyObj);
      }
    }
  }

  // Hitscan damage dealt by player shooting
  applyDamage(enemy, amount) {
    if (!enemy.isAlive) return false;

    enemy.hp -= amount;

    // Flash white on hit
    const originalColor = enemy.color;
    enemy.mesh.material.color.setHex(0xffffff);
    setTimeout(() => {
      if (enemy.isAlive) {
        enemy.mesh.material.color.setHex(originalColor);
      }
    }, 100);

    if (enemy.hp <= 0) {
      enemy.hp = 0;
      enemy.isAlive = false;
      enemy.state = 'DEAD';
      enemy.mesh.material.color.setHex(0x4b5563); // gray out
      enemy.group.rotation.x = Math.PI / 2; // knocked down
      enemy.group.position.y = 0.3;

      this.checkSquadEliminations();
      return true; // Enemy was eliminated
    }
    return false;
  }

  checkSquadEliminations() {
    for (const squad of ENEMY_SQUAD_DEFS) {
      if (!this.livingSquads.has(squad.id)) continue;
      const aliveMembers = this.enemies.filter((e) => e.squadId === squad.id && e.isAlive);
      if (aliveMembers.length === 0) {
        this.livingSquads.delete(squad.id);
        console.log(`Squad ${squad.name} has been eliminated!`);
      }
    }
  }

  getAliveEnemies() {
    return this.enemies.filter((e) => e.isAlive);
  }

  getRemainingSquadCount() {
    return this.livingSquads.size;
  }

  // Combat FSM update during War Action
  updateCombat(delta, time, playerPos, teammates, onDamagePlayer) {
    const aliveEnemies = this.getAliveEnemies();
    const readinessBuff = gameState.squadReadiness / 100; // 0.2 to 1.0

    for (const enemy of aliveEnemies) {
      // 1. Advance to center War Action Point if too far
      const distToCenter = enemy.position.distanceTo(new THREE.Vector3(0, 0, 0));
      if (distToCenter > 18) {
        const dir = new THREE.Vector3(0, 0, 0).sub(enemy.position).normalize();
        enemy.group.position.addScaledVector(dir, 5.0 * delta);
        enemy.position.copy(enemy.group.position);
        continue;
      }

      // 2. Look at nearest threat (player or teammate)
      const distToPlayer = enemy.position.distanceTo(playerPos);
      enemy.group.lookAt(playerPos.x, enemy.group.position.y, playerPos.z);

      // 3. Attack interval (MOCK: Simple state machine combat modified by squad readiness)
      // High player readiness causes enemy attacks to be less frequent or less accurate
      const attackInterval = 2200 + (readinessBuff * 1200); // 2.4s to 3.4s
      if (time - enemy.lastAttackTime > attackInterval && distToPlayer < 28) {
        enemy.lastAttackTime = time;

        // Damage calculation: reduced by Squad Readiness
        const baseDmg = 8;
        const finalDmg = Math.max(3, Math.round(baseDmg * (1.2 - readinessBuff * 0.5)));

        if (onDamagePlayer) {
          onDamagePlayer(finalDmg);
        }
      }

      // 4. Teammate auto-defense: teammates also shoot back at enemies
      if (Math.random() < 0.01 + (readinessBuff * 0.02)) {
        const tmDmg = 15 + (readinessBuff * 20);
        this.applyDamage(enemy, tmDmg);
      }
    }
  }

  update(delta, time) {
    // Basic idle breathing
    for (const enemy of this.enemies) {
      if (!enemy.isAlive) continue;
      if (enemy.state === 'IDLE') {
        enemy.group.position.y = Math.sin(time * 0.002 + enemy.position.x) * 0.04;
      }
    }
  }
}
