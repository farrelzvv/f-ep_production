import { World } from './scene/world.js';
import { Arena } from './scene/arena.js';
import { PlayerController } from './player/controller.js';
import { TeammateManager } from './npc/teammate.js';
import { EnemyAiManager } from './npc/enemyAi.js';
import { Hud } from './ui/hud.js';

// Bootstrap M1: 3D Greybox Arena & Player Controller
const canvas = document.getElementById('game-canvas');
const uiLayer = document.getElementById('ui-layer');

const world = new World(canvas);
const arena = new Arena(world.scene);
const controller = new PlayerController(world.camera, world.canvas);
const teammateManager = new TeammateManager(world.scene);
const enemyAiManager = new EnemyAiManager(world.scene);
const hud = new Hud(uiLayer);

// Main Game Loop Update
world.onUpdate((delta, time) => {
  controller.update(delta);
  teammateManager.update(time, controller.camera.position);
  enemyAiManager.update(delta, time);

  // Proximity check to teammates
  const nearestTeammate = teammateManager.getNearestTeammate(controller.camera.position, 5.0);
  if (nearestTeammate) {
    hud.showInteractionPrompt(`Near ${nearestTeammate.name} — [${nearestTeammate.role}]`);
  } else {
    hud.hideInteractionPrompt();
  }
});

console.log('FEP Client initialized: M1 Core Greybox Arena Ready');
