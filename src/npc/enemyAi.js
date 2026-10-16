import * as THREE from 'three';
import { BASES, WAR_ACTION_POINT } from '../scene/arena.js';

// Enemy squads positioned at Bases 2 to 5
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
        const z = squad.base.z + off.y || squad.base.z + off.z;

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

        this.enemies.push({
          id: `enemy_${squad.id}_${i}`,
          squadId: squad.id,
          squadName: squad.name,
          color: squad.color,
          group,
          mesh: body,
          hp: 80,
          maxHp: 80,
          isAlive: true,
          position: new THREE.Vector3(x, 1.0, z),
          state: 'IDLE', // IDLE | MOVE_TO_WAR | ENGAGE | DEAD
          lastAttackTime: 0
        });
      }
    }
  }

  update(delta, time) {
    // Idle animations for M1
    for (const enemy of this.enemies) {
      if (!enemy.isAlive) continue;
      // Slight breathing animation
      enemy.group.position.y = Math.sin(time * 0.002 + enemy.position.x) * 0.05;
    }
  }
}
