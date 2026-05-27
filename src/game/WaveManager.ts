import { LevelConfig, Wave } from '../config/levels';
import { ENEMIES } from '../config/enemies';
import { ENEMY_START_X } from '../config/constants';
import { Enemy } from './Enemy';
import Phaser from 'phaser';

export class WaveManager {
  private scene: Phaser.Scene;
  private level: LevelConfig;
  private waveIndex = 0;
  private waveTimer = 0;
  private spawnQueue: { enemyId: string; lane: number; delay: number }[] = [];
  private spawnTimer = 0;
  private waveActive = false;
  private waveDelay = 0;
  private betweenWaves = true;
  enemies: Enemy[] = [];
  allWavesDone = false;
  private onWaveStart?: (waveNum: number, total: number) => void;

  constructor(scene: Phaser.Scene, level: LevelConfig, onWaveStart?: (n: number, t: number) => void) {
    this.scene = scene;
    this.level = level;
    this.onWaveStart = onWaveStart;
    this.waveDelay = 3000; // initial grace period
  }

  update(delta: number): void {
    // Clean dead/base-reached enemies
    this.enemies = this.enemies.filter(e => !e.dead && !e.reachedBase);

    if (this.spawnQueue.length > 0) {
      this.spawnTimer += delta;
      while (this.spawnQueue.length > 0 && this.spawnTimer >= this.spawnQueue[0].delay) {
        const next = this.spawnQueue.shift()!;
        this.spawnTimer -= next.delay;
        this.spawnEnemy(next.enemyId, next.lane);
      }
      return;
    }

    if (this.betweenWaves) {
      this.waveTimer += delta;
      if (this.waveTimer >= this.waveDelay) {
        this.waveTimer = 0;
        this.startNextWave();
      }
      return;
    }

    // Wait for all enemies in current wave to be gone before next wave
    if (this.enemies.length === 0) {
      this.betweenWaves = true;
      this.waveTimer = 0;
      if (this.waveIndex >= this.level.waves.length) {
        this.allWavesDone = true;
      }
    }
  }

  private startNextWave(): void {
    if (this.waveIndex >= this.level.waves.length) {
      this.allWavesDone = true;
      return;
    }

    const wave: Wave = this.level.waves[this.waveIndex];
    this.waveDelay = wave.delay || 3000;
    this.onWaveStart?.(this.waveIndex + 1, this.level.waves.length);
    this.waveIndex++;
    this.betweenWaves = false;

    // Build spawn queue
    const activeLanes = Array.from({ length: this.level.activeLanes }, (_, i) => i);
    let cumDelay = 0;
    for (const spawn of wave.spawns) {
      for (let i = 0; i < spawn.count; i++) {
        const lane = spawn.lane !== undefined
          ? spawn.lane
          : activeLanes[Math.floor(Math.random() * activeLanes.length)];
        this.spawnQueue.push({ enemyId: spawn.enemyId, lane, delay: cumDelay });
        cumDelay += spawn.interval;
      }
    }
    this.spawnTimer = 0;
  }

  private spawnEnemy(enemyId: string, lane: number): void {
    const config = ENEMIES[enemyId];
    if (!config) return;
    const enemy = new Enemy(this.scene, ENEMY_START_X, lane, config);
    this.enemies.push(enemy);
  }

  getEnemiesInLane(lane: number): Enemy[] {
    return this.enemies.filter(e => e.lane === lane && !e.dead);
  }

  // Returns remaining seconds before next wave, or null when not applicable
  getNextWaveCountdown(): number | null {
    if (!this.betweenWaves || this.allWavesDone || this.waveIndex >= this.level.waves.length) return null;
    return Math.max(0, Math.ceil((this.waveDelay - this.waveTimer) / 1000));
  }

  get currentWave(): number {
    return this.waveIndex;
  }
}
