import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GRID_COLS, GRID_ROWS, CELL_SIZE, GRID_ORIGIN_X, GRID_ORIGIN_Y } from '../config/constants';
import { PLANTS, PLANT_ORDER, PlantConfig } from '../config/plants';
import { LEVELS, LevelConfig } from '../config/levels';
import { Grid, worldToCell } from '../game/Grid';
import { Plant } from '../game/Plant';
import { Enemy } from '../game/Enemy';
import { Bullet } from '../game/Bullet';
import { WaveManager } from '../game/WaveManager';
import { SunSystem } from '../game/SunSystem';
import { AudioManager } from '../game/AudioManager';

type GameState = 'playing' | 'won' | 'lost' | 'paused';

export class GameScene extends Phaser.Scene {
  private level!: LevelConfig;
  private grid!: Grid;
  private waveManager!: WaveManager;
  private sunSystem!: SunSystem;
  private bullets: Bullet[] = [];
  private state: GameState = 'playing';

  private selectedPlant: string | null = null;
  private placeholderSprite: Phaser.GameObjects.Rectangle | null = null;
  private audio!: AudioManager;

  // UI
  private sunText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private countdownText!: Phaser.GameObjects.Text;
  private muteBtn!: Phaser.GameObjects.Text;
  private cardHighlights: Phaser.GameObjects.Rectangle[] = [];
  private selectedCardIndex = -1;
  private lastCountdown = -1;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { levelId: number }): void {
    this.level = LEVELS.find(l => l.id === data.levelId) ?? LEVELS[0];
    this.selectedPlant = null;
    this.bullets = [];
    this.state = 'playing';
    this.selectedCardIndex = -1;
  }

  create(): void {
    this.audio = this.game.registry.get('audio') as AudioManager;
    // Unlock Web Audio on first pointer interaction
    // Web Audio unlocks on first user gesture automatically via Phaser

    this.drawBackground();
    this.grid = new Grid(this);
    this.sunSystem = new SunSystem(this, this.level.startingSun, this.level.sunInterval, (n) => {
      this.sunText?.setText(`⊙ ${n}`);
    });
    this.waveManager = new WaveManager(this, this.level, (waveNum, total) => {
      this.waveText?.setText(`第 ${waveNum} 波 / 共 ${total} 波`);
      this.countdownText?.setText('');
      this.showWaveBanner(waveNum, total);
    });

    this.buildUI();
    this.setupInput();
  }

  private drawBackground(): void {
    // Sky
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x2e4a1e).setDepth(0);

    // Grid tiles — use real tile texture if loaded, else color bands
    const hasTile = this.textures.exists('tile_base');
    const tileScale = CELL_SIZE / 256;
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const cx = GRID_ORIGIN_X + col * CELL_SIZE + CELL_SIZE / 2;
        const cy = GRID_ORIGIN_Y + row * CELL_SIZE + CELL_SIZE / 2;
        if (hasTile) {
          const tile = this.add.image(cx, cy, 'tile_base');
          tile.setScale(tileScale).setDepth(1);
          // Path hint on active lane rows
          if (row < this.level.activeLanes) {
            const hint = this.add.image(cx, cy, 'tile_path_hint');
            hint.setScale(tileScale).setDepth(2).setAlpha(0.5);
          }
        } else {
          const color = row % 2 === 0 ? 0x1b3a11 : 0x234d16;
          this.add.rectangle(cx, cy, CELL_SIZE, CELL_SIZE, color, 0.5).setDepth(1);
        }
      }
    }

    // Level name — compact, sits above wave counter
    this.add.text(GAME_WIDTH / 2, 12, this.level.name, {
      fontSize: '15px', color: '#81c784',
    }).setOrigin(0.5).setDepth(30);
  }

  private buildUI(): void {
    const uiY = GRID_ORIGIN_Y + GRID_ROWS * CELL_SIZE + 10;

    // Sun display
    this.add.rectangle(70, uiY + 40, 120, 56, 0x1a3a0a, 1).setDepth(30).setStrokeStyle(1, 0x4caf50);
    this.sunText = this.add.text(70, uiY + 40, `⊙ ${this.level.startingSun}`, {
      fontSize: '22px', color: '#fdd835', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(31);

    // Wave counter — top center, prominent
    this.waveText = this.add.text(GAME_WIDTH / 2, 36, `第 0 波 / 共 ${this.level.waves.length} 波`, {
      fontSize: '22px', color: '#a5d6a7', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(31);

    // Countdown text (between waves)
    this.countdownText = this.add.text(GAME_WIDTH / 2, 62, '', {
      fontSize: '18px', color: '#ffcc02', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(31);

    // Plant card strip
    const cardStartX = 164;
    const cardSpacing = 122;
    const cardWidth = 112;
    const cardHeight = 64;
    PLANT_ORDER.forEach((plantId, i) => {
      const cfg = PLANTS[plantId];
      const cx = cardStartX + i * cardSpacing;
      const cy = uiY + 40;

      // Card art badge (keep source square; never squash premium portraits into a wide strip)
      const cardKey = `ui_card_${plantId}`;
      const hasArt = this.textures.exists(cardKey);
      const bg = this.add.rectangle(cx, cy, cardWidth, cardHeight, hasArt ? 0x071708 : 0x1b3a11)
        .setInteractive()
        .setDepth(30)
        .setStrokeStyle(2, 0x4caf50);
      if (hasArt) bg.setFillStyle(0x071708, 0.88);

      this.add.rectangle(cx - 30, cy, 54, 54, 0x10220c, 0.95)
        .setDepth(31)
        .setStrokeStyle(1, 0xf5d76a, hasArt ? 0.8 : 0.25);

      if (hasArt) {
        this.add.image(cx - 30, cy, cardKey).setDisplaySize(50, 50).setDepth(32);
      } else {
        // Idle sprite thumbnail as fallback
        const idleKey = `${plantId}_idle_00`;
        if (this.textures.exists(idleKey)) {
          this.add.image(cx - 30, cy, idleKey).setDisplaySize(48, 48).setDepth(32).setAlpha(0.75);
        }
      }

      const highlight = this.add.rectangle(cx, cy, cardWidth, cardHeight, 0xffffff, 0)
        .setDepth(33);
      this.cardHighlights.push(highlight);

      this.add.text(cx + 24, cy - 12, cfg.name, {
        fontSize: '12px', color: '#e7f6d7', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(34);

      this.add.text(cx + 24, cy + 12, `⊙ ${cfg.cost}`, {
        fontSize: '14px', color: '#fdd835', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(34);

      bg.on('pointerover', () => {
        if (!this.sunSystem.canAfford(cfg.cost)) return;
        bg.setFillStyle(hasArt ? 0x224400 : 0x2e5a1a, hasArt ? 0.5 : 1);
      });
      bg.on('pointerout', () => {
        if (this.selectedPlant !== plantId)
          bg.setFillStyle(hasArt ? 0x000000 : 0x1b3a11, hasArt ? 0.2 : 1);
      });
      bg.on('pointerdown', () => this.selectPlant(plantId, i, cfg));
    });

    // Mute toggle
    this.muteBtn = this.add.text(GAME_WIDTH - 110, 10, '🔊', {
      fontSize: '20px',
    }).setOrigin(1, 0).setDepth(40).setInteractive();
    this.muteBtn.on('pointerdown', () => {
      const muted = this.audio?.toggleMute();
      this.muteBtn.setText(muted ? '🔇' : '🔊');
    });

    // Pause / back button
    const backBtn = this.add.text(GAME_WIDTH - 20, 10, '✕ 退出', {
      fontSize: '16px', color: '#ef9a9a',
    }).setOrigin(1, 0).setDepth(40).setInteractive();
    backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
  }

  private selectPlant(plantId: string, cardIndex: number, cfg: PlantConfig): void {
    if (!this.sunSystem.canAfford(cfg.cost)) return;

    this.selectedPlant = plantId;
    this.cardHighlights.forEach((h, i) => {
      h.setFillStyle(i === cardIndex ? 0xffffff : 0xffffff);
      h.setAlpha(i === cardIndex ? 0.15 : 0);
    });
    this.selectedCardIndex = cardIndex;
    this.input.setDefaultCursor('crosshair');
  }

  private deselect(): void {
    this.selectedPlant = null;
    this.selectedCardIndex = -1;
    this.cardHighlights.forEach(h => h.setAlpha(0));
    this.input.setDefaultCursor('default');
    this.placeholderSprite?.destroy();
    this.placeholderSprite = null;
  }

  private setupInput(): void {
    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (!this.selectedPlant) return;
      const cell = worldToCell(ptr.x, ptr.y);
      if (cell && !this.grid.isOccupied(cell.col, cell.row)) {
        const cfg = PLANTS[this.selectedPlant];
        const wx = GRID_ORIGIN_X + cell.col * CELL_SIZE + CELL_SIZE / 2;
        const wy = GRID_ORIGIN_Y + cell.row * CELL_SIZE + CELL_SIZE / 2;
        if (!this.placeholderSprite) {
          this.placeholderSprite = this.add.rectangle(wx, wy, 72, 72, cfg.color, 0.45).setDepth(50);
        } else {
          this.placeholderSprite.setPosition(wx, wy);
        }
      } else {
        this.placeholderSprite?.destroy();
        this.placeholderSprite = null;
      }
    });

    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (!this.selectedPlant || this.state !== 'playing') return;
      const cell = worldToCell(ptr.x, ptr.y);
      if (!cell) {
        // Don't deselect when clicking the card strip below the grid
        if (ptr.y < GRID_ORIGIN_Y + GRID_ROWS * CELL_SIZE) this.deselect();
        return;
      }
      if (this.grid.isOccupied(cell.col, cell.row)) return;

      const cfg = PLANTS[this.selectedPlant];
      if (!this.sunSystem.spend(cfg.cost)) return;

      const plant = new Plant(this, cell.col, cell.row, cfg);
      this.grid.placePlant(cell.col, cell.row, plant);
      this.deselect();
    });

    this.input.keyboard?.on('keydown-ESC', () => this.deselect());
  }

  update(_time: number, delta: number): void {
    if (this.state !== 'playing') return;

    this.sunSystem.update(delta);
    this.waveManager.update(delta);
    this.updateCountdownUI();

    this.updatePlants(delta);
    this.updateEnemies(delta);
    this.updateBullets(delta);
    this.checkCollisions();
    this.checkWinLose();
  }

  private updateCountdownUI(): void {
    const secs = this.waveManager.getNextWaveCountdown();
    if (secs === null) {
      if (this.lastCountdown !== -1) {
        this.countdownText.setText('');
        this.lastCountdown = -1;
      }
      return;
    }
    if (secs !== this.lastCountdown) {
      this.lastCountdown = secs;
      this.countdownText.setText(secs > 0 ? `下一波: ${secs}…` : '');
    }
  }

  private updatePlants(delta: number): void {
    const plants = this.grid.getAllPlants();
    for (const plant of plants) {
      if (plant.dead) {
        this.grid.removePlant(plant.col, plant.row);
        continue;
      }
      const enemies = this.waveManager.getEnemiesInLane(plant.row);
      const hasEnemy = enemies.some(e => e.x > GRID_ORIGIN_X && !e.dead);
      plant.update(delta, this.bullets, hasEnemy);
    }
  }

  private updateEnemies(delta: number): void {
    const allPlants = this.grid.getAllPlants();
    for (const enemy of this.waveManager.enemies) {
      if (enemy.dead) continue;

      // Find plant to attack — rightmost plant in same lane
      if (!enemy.targetPlant || enemy.targetPlant.dead) {
        enemy.targetPlant = null;
        const rowPlants = allPlants.filter(p => p.row === enemy.lane && !p.dead);
        // Enemy collides with plant when within range
        const inRange = rowPlants.filter(p => Math.abs(p.x - enemy.x) < CELL_SIZE * 0.7);
        if (inRange.length > 0) {
          // Attack rightmost plant in path
          enemy.targetPlant = inRange.reduce((a, b) => (a.x > b.x ? a : b));
        }
      }
      enemy.update(delta);
    }
  }

  private updateBullets(delta: number): void {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      if (!bullet.scene) {
        this.bullets.splice(i, 1);
        continue;
      }
      bullet.update(delta);
      if (bullet.x > GAME_WIDTH + 50) {
        bullet.destroy();
        this.bullets.splice(i, 1);
      }
    }
  }

  private checkCollisions(): void {
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      const bullet = this.bullets[bi];
      if (!bullet.scene) continue;

      if (bullet.isAoe) {
        // AOE: hit all enemies within radius
        for (const enemy of this.waveManager.enemies) {
          if (enemy.dead) continue;
          const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y);
          if (dist <= bullet.aoeRadius) {
            enemy.takeDamage(bullet.damage);
          }
        }
        bullet.destroy();
        this.bullets.splice(bi, 1);
        this.showExplosion(bullet.x, bullet.y);
        continue;
      }

      // Single target: check enemies in bullet's row
      let hit = false;
      for (const enemy of this.waveManager.enemies) {
        if (enemy.dead) continue;
        const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y);
        if (dist < 28) {
          enemy.takeDamage(bullet.damage);
          hit = true;
          break;
        }
      }
      if (hit) {
        bullet.destroy();
        this.bullets.splice(bi, 1);
      }
    }
  }

  private showExplosion(x: number, y: number): void {
    if (this.textures.exists('fx_explosion_00') && this.anims.exists('fx_explosion')) {
      const sprite = this.add.sprite(x, y, 'fx_explosion_00').setDepth(30).setScale(2.0);
      sprite.play('fx_explosion').once('animationcomplete', () => sprite.destroy());
    } else {
      const circle = this.add.arc(x, y, 10, 0, 360, false, 0xff7043, 0.9).setDepth(30);
      this.tweens.add({
        targets: circle,
        radius: 130,
        alpha: 0,
        duration: 400,
        onComplete: () => circle.destroy(),
      });
    }
  }

  private showWaveBanner(waveNum: number, total: number): void {
    const banner = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, `第 ${waveNum} 波 / 共 ${total} 波`, {
      fontSize: '36px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(100).setAlpha(0);

    this.tweens.add({
      targets: banner,
      alpha: 1,
      y: GAME_HEIGHT / 2 - 100,
      duration: 500,
      hold: 1000,
      yoyo: false,
      onComplete: () => {
        this.tweens.add({
          targets: banner,
          alpha: 0,
          duration: 400,
          onComplete: () => banner.destroy(),
        });
      },
    });
  }

  private checkWinLose(): void {
    // Lose: any enemy reached base
    const reachedBase = this.waveManager.enemies.some(e => e.reachedBase);
    if (reachedBase) {
      this.triggerEnd('lost');
      return;
    }

    // Win: all waves done and no enemies remain
    if (this.waveManager.allWavesDone && this.waveManager.enemies.length === 0) {
      this.triggerEnd('won');
    }
  }

  private triggerEnd(result: 'won' | 'lost'): void {
    if (this.state !== 'playing') return;
    this.state = result;
    this.time.delayedCall(600, () => {
      this.scene.start('ResultScene', { result, levelId: this.level.id });
    });
  }
}
