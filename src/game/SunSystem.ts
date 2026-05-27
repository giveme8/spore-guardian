import Phaser from 'phaser';
import { SUN_FALL_SPEED, SUN_VALUE, SUN_LIFETIME, GRID_ORIGIN_X, GRID_ORIGIN_Y, GRID_COLS, GRID_ROWS, CELL_SIZE } from '../config/constants';
import { AudioManager } from './AudioManager';

interface SunDrop {
  circle: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
  targetY: number;
  lifetime: number;
  collected: boolean;
}

export class SunSystem {
  private scene: Phaser.Scene;
  private drops: SunDrop[] = [];
  private dropTimer = 0;
  private dropInterval: number;
  sun: number;
  private onSunChange: (amount: number) => void;

  constructor(scene: Phaser.Scene, startingSun: number, interval: number, onSunChange: (n: number) => void) {
    this.scene = scene;
    this.sun = startingSun;
    this.dropInterval = interval;
    this.onSunChange = onSunChange;
  }

  update(delta: number): void {
    this.dropTimer += delta;
    if (this.dropTimer >= this.dropInterval) {
      this.dropTimer = 0;
      this.spawnDrop();
    }

    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      if (drop.collected) {
        this.drops.splice(i, 1);
        continue;
      }

      drop.lifetime += delta;
      if (drop.lifetime >= SUN_LIFETIME) {
        drop.circle.destroy();
        drop.label.destroy();
        this.drops.splice(i, 1);
        continue;
      }

      if (drop.circle.y < drop.targetY) {
        const dy = (SUN_FALL_SPEED * delta) / 1000;
        drop.circle.y += dy;
        drop.label.y += dy;
      }

      // Fade out near end of lifetime
      if (drop.lifetime > SUN_LIFETIME * 0.75) {
        const alpha = 1 - (drop.lifetime - SUN_LIFETIME * 0.75) / (SUN_LIFETIME * 0.25);
        drop.circle.setAlpha(alpha);
        drop.label.setAlpha(alpha);
      }
    }
  }

  private spawnDrop(): void {
    const x = GRID_ORIGIN_X + Math.random() * (GRID_COLS * CELL_SIZE);
    // Start just above the grid top edge (≥ GRID_ORIGIN_Y) to stay clear of top UI buttons
    const startY = GRID_ORIGIN_Y;
    const maxRow = Math.floor(Math.random() * GRID_ROWS);
    const targetY = GRID_ORIGIN_Y + maxRow * CELL_SIZE + CELL_SIZE / 2;

    const circle = this.scene.add.arc(x, startY, 18, 0, 360, false, 0xfdd835);
    circle.setDepth(25);
    circle.setStrokeStyle(2, 0xf9a825);

    const label = this.scene.add.text(x, startY, '☀', { fontSize: '20px' });
    label.setOrigin(0.5);
    label.setDepth(26);

    const drop: SunDrop = { circle, label, targetY, lifetime: 0, collected: false };

    circle.setInteractive(new Phaser.Geom.Circle(0, 0, 18), Phaser.Geom.Circle.Contains);
    circle.on('pointerdown', () => this.collect(drop));
    label.setInteractive(new Phaser.Geom.Rectangle(-14, -14, 28, 28), Phaser.Geom.Rectangle.Contains);
    label.on('pointerdown', () => this.collect(drop));

    this.drops.push(drop);
  }

  collect(drop: SunDrop): void {
    if (drop.collected) return;
    drop.collected = true;
    drop.circle.destroy();
    drop.label.destroy();
    this.sun += SUN_VALUE;
    this.onSunChange(this.sun);
    (this.scene.game.registry.get('audio') as AudioManager | undefined)?.playCollect();
  }

  spend(amount: number): boolean {
    if (this.sun < amount) return false;
    this.sun -= amount;
    this.onSunChange(this.sun);
    return true;
  }

  canAfford(amount: number): boolean {
    return this.sun >= amount;
  }
}
