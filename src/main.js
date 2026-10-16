import { World } from './scene/world.js';
import { Arena } from './scene/arena.js';
import { PlayerController } from './player/controller.js';
import { TeammateManager } from './npc/teammate.js';
import { EnemyAiManager } from './npc/enemyAi.js';
import { Hud } from './ui/hud.js';
import { FeedbackPanel } from './ui/feedbackPanel.js';
import { PhaseManager } from './phases/phaseManager.js';

// Bootstrap M1 - M4: Arena, Controller, Comm, Prep & Rotation Mechanics
const canvas = document.getElementById('game-canvas');
const uiLayer = document.getElementById('ui-layer');

const world = new World(canvas);
const arena = new Arena(world.scene);
const controller = new PlayerController(world.camera, world.canvas);
const teammateManager = new TeammateManager(world.scene);
const enemyAiManager = new EnemyAiManager(world.scene);
const hud = new Hud(uiLayer);

const commSlot = document.getElementById('hud-comm-slot');
const feedbackPanel = new FeedbackPanel(commSlot, teammateManager);

// Initialize Phase Manager and Start Match Setup
const phaseManager = new PhaseManager({
  scene: world.scene,
  camera: world.camera,
  teammateManager,
  enemyAiManager,
  hud,
  feedbackPanel
});

phaseManager.startMatchSequence();

// Main Game Loop Update
world.onUpdate((delta, time) => {
  controller.update(delta);
  teammateManager.update(time, controller.camera.position);
  enemyAiManager.update(delta, time);
  phaseManager.update(delta);

  // Proximity check to teammates
  const nearestTeammate = teammateManager.getNearestTeammate(controller.camera.position, 5.0);
  feedbackPanel.setTargetTeammate(nearestTeammate);

  if (nearestTeammate) {
    hud.showInteractionPrompt(`Near ${nearestTeammate.name} — [${nearestTeammate.role}] | Speak or type tactical command`);
  } else {
    hud.hideInteractionPrompt();
  }
});

console.log('FEP Client initialized: M4 Rotation Phase & Zone Mechanics Ready');
