import * as THREE from 'three';

// 3 Teammates according to SPEC_ADDENDUM.md
export const TEAMMATE_DEFS = [
  {
    role: 'Support',
    name: 'Riley (Support)',
    color: 0x10b981, // Emerald green
    offset: { x: -3.5, z: -2.5 },
    roleDescription: 'Supplies ammunition and tactical medkits.'
  },
  {
    role: 'Scout',
    name: 'Kai (Scout)',
    color: 0x06b6d4, // Cyan
    offset: { x: 0, z: -4.5 },
    roleDescription: 'Monitors safe zones and scouts optimal rotation paths.'
  },
  {
    role: 'Assault',
    name: 'Jax (Assault)',
    color: 0xf97316, // Orange
    offset: { x: 3.5, z: -2.5 },
    roleDescription: 'Coordinates fireteam combat readiness and defense.'
  }
];

export class TeammateManager {
  constructor(scene) {
    this.scene = scene;
    this.teammates = [];
    this.spawnTeammatesAtBase(0, 70); // Base 1 coordinates
  }

  spawnTeammatesAtBase(baseX, baseZ) {
    for (const def of TEAMMATE_DEFS) {
      const group = new THREE.Group();
      const x = baseX + def.offset.x;
      const z = baseZ + def.offset.z;
      group.position.set(x, 0, z);

      // Body (Capsule primitive)
      const bodyGeo = new THREE.CapsuleGeometry(0.5, 1.0, 8, 16);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: def.color,
        roughness: 0.4
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 1.0;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Head visor/helmet (Box primitive)
      const visorGeo = new THREE.BoxGeometry(0.6, 0.25, 0.4);
      const visorMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        roughness: 0.2
      });
      const visor = new THREE.Mesh(visorGeo, visorMat);
      visor.position.set(0, 1.5, 0.35);
      group.add(visor);

      // Role badge on top (Small diamond / beacon)
      const badgeGeo = new THREE.OctahedronGeometry(0.25);
      const badgeMat = new THREE.MeshBasicMaterial({ color: def.color });
      const badge = new THREE.Mesh(badgeGeo, badgeMat);
      badge.position.y = 2.1;
      group.add(badge);

      this.scene.add(group);

      this.teammates.push({
        ...def,
        group,
        badge,
        mesh: body,
        hasInteracted: false,
        position: new THREE.Vector3(x, 1.0, z)
      });
    }
  }

  getNearestTeammate(playerPos, maxDistance = 5.0) {
    let nearest = null;
    let minDist = maxDistance;

    for (const tm of this.teammates) {
      const dist = playerPos.distanceTo(tm.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = tm;
      }
    }
    return nearest;
  }

  update(time, playerPos) {
    // Gentle bobbing and rotate towards player when close
    for (const tm of this.teammates) {
      tm.badge.rotation.y = time * 0.002;
      tm.badge.position.y = 2.1 + Math.sin(time * 0.003 + tm.offset.x) * 0.08;

      if (playerPos) {
        const dist = playerPos.distanceTo(tm.position);
        if (dist < 8) {
          // Face the player
          const lookTarget = new THREE.Vector3(playerPos.x, tm.group.position.y, playerPos.z);
          tm.group.lookAt(lookTarget);
        }
      }
    }
  }
}
