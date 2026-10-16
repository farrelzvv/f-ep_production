// Player State for Hinaly (Protagonist)
import { gameState } from '../state/gameState.js';

export class PlayerState {
  constructor() {
    this.name = 'Hinaly';
    this.speed = 10;
    this.sprintMultiplier = 1.6;
    this.interactionRange = 4.5;
    this.nearestNpc = null;
  }

  get hp() {
    return gameState.player.hp;
  }

  get ammo() {
    return gameState.player.ammo;
  }

  takeDamage(amount) {
    gameState.player.hp = Math.max(0, gameState.player.hp - amount);
    if (gameState.player.hp === 0) {
      gameState.player.isAlive = false;
    }
    gameState.notify();
  }

  heal(amount) {
    gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + amount);
    gameState.notify();
  }

  addAmmo(amount) {
    gameState.player.ammo = Math.min(gameState.player.maxAmmo, gameState.player.ammo + amount);
    gameState.notify();
  }

  consumeAmmo(amount = 1) {
    if (gameState.player.ammo >= amount) {
      gameState.player.ammo -= amount;
      gameState.notify();
      return true;
    }
    return false;
  }
}

export const playerState = new PlayerState();
