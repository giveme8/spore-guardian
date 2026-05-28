import Phaser from 'phaser';
import { EnemyConfig } from '../config/enemies';
import { GRID_ORIGIN_Y, CELL_SIZE } from '../config/constants';
import { AudioManager } from './AudioManager';

const SPRITE_SCALE = (CELL_SIZE - 8) / 256;
const FEET_OFFSET = (232 - 128) * SPRITE_SCALE;

export class Enemy extends Phaser.GameObjects.Container {
  config: EnemyConfig;
  lane: number;
  hp: number;
  maxHp: number;
  hasArmor: boolean;
  armorBroken = false;
  speed: number;
  private attackTimer = 0;
  private hpBar: Phaser.GameObjects.Rectangle;
  private sprite: Phaser.GameObjects.Sprite | null = null;
  private armorOverlaySprite: Phaser.GameObjects.Image | null = null;
  dead = false;
  reachedBase = false;
  targetPlant: import('./Plant').Plant | null = null;

  constructor(scene: Phaser.Scene, x: number, lane: number, config: EnemyConfig) {
    const y = GRID_ORIGIN_Y + lane * CELL_SIZE + CELL_SIZE / 2;
    super(scene, x, y);

    this.config = config;
    this.lane = lane;
    this.hp = config.hp;
    this.maxHp = config.hp;
    this.hasArmor = config.hasArmor;
    this.speed = config.speed;

    const walkKey = `${config.id}_walk_00`;
    if (scene.textures.exists(walkKey)) {
      const sprite = scene.add.sprite(0, 0, walkKey);
      sprite.setOrigin(0.5, 0.5);
      sprite.setScale(SPRITE_SCALE * (config.isBoss ? 1.8 : 1));
      sprite.setY(-FEET_OFFSET + (CELL_SIZE / 2) - 8);
      sprite.setFlipX(true); // enemies face left
      this.sprite = sprite;
      this.add(sprite);

      // Shellbug: static armor overlay on top (hidden when armor breaks)
      if (config.id === 'shellbug' && scene.textures.exists('shellbug_armor_overlay')) {
        const overlay = scene.add.image(0, sprite.y, 'shellbug_armor_overlay');
        overlay.setOrigin(0.5, 0.5);
        overlay.setScale(SPRITE_SCALE);
        overlay.setFlipX(true);
        this.armorOverlaySprite = overlay;
        this.add(overlay);
      }

      const animKey = `${config.id}_walk`;
      if (scene.anims.exists(animKey)) sprite.play(animKey);
    } else {
      // Geometric fallback
      const body = scene.add.rectangle(0, 0, config.width, config.height, config.color);
      body.setStrokeStyle(2, 0xffffff, 0.5);
      this.add(body);
      const label = scene.add.text(0, 0, config.name.charAt(0), {
        fontSize: config.isBoss ? '28px' : '18px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.add(label);
    }

    // HP bar
    const barW = config.isBoss ? 80 : config.width;
    const bg = scene.add.rectangle(0, CELL_SIZE / 2 - 10, barW, 6, 0x333333);
    this.add(bg);
    this.hpBar = scene.add.rectangle(-barW / 2, CELL_SIZE / 2 - 10, barW, 6, 0xef5350);
    this.hpBar.setOrigin(0, 0.5);
    this.add(this.hpBar);

    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    this.setDepth(15);
  }

  update(delta: number): void {
    if (this.dead || this.reachedBase) return;

    if (this.targetPlant && !this.targetPlant.dead) {
      this.attackTimer += delta;
      if (this.attackTimer >= this.config.attackInterval) {
        this.attackTimer = 0;
        this.targetPlant.takeDamage(this.config.attackDamage);
      }
      // Play attack anim if not already
      this.playAnim('attack', true);
    } else {
      this.targetPlant = null;
      this.x -= (this.speed * delta) / 1000;
      // Play walk anim
      this.playAnim('walk', true);

      if (this.x < 40) {
        this.reachedBase = true;
      }
    }
  }

  private playAnim(state: string, loop: boolean): void {
    if (!this.sprite) return;
    const key = `${this.config.id}_${state}`;
    if (this.scene.anims.exists(key) && this.sprite.anims.currentAnim?.key !== key) {
      this.sprite.play(key);
    }
  }

  takeDamage(amount: number): void {
    let actual = amount;
    if (this.hasArmor && !this.armorBroken) {
      actual = Math.floor(amount / 2);
      if (!this.config.isBoss) {
        this.breakArmor();
      } else if (this.hp - actual <= this.maxHp * 0.5) {
        this.breakArmor();
      }
    }
    this.hp = Math.max(0, this.hp - actual);
    this.updateHpBar();
    (this.scene.game.registry.get('audio') as AudioManager | undefined)?.playHit(this.config.id);

    // Flash hit anim
    const hitKey = `${this.config.id}_hit`;
    const walkKey = `${this.config.id}_walk`;
    if (this.sprite && this.scene.anims.exists(hitKey)) {
      this.sprite.play(hitKey).once('animationcomplete', () => {
        if (!this.dead && this.sprite && this.scene.anims.exists(walkKey)) {
          this.sprite.play(walkKey);
        }
      });
    }

    if (this.hp <= 0) this.die();
  }

  private breakArmor(): void {
    this.armorBroken = true;
    // Remove shellbug armor overlay on break
    if (this.armorOverlaySprite) {
      this.armorOverlaySprite.destroy();
      this.armorOverlaySprite = null;
    }
    if (this.config.isBoss) {
      this.speed *= 2.5;
      const breakKey = 'bossbelly_armor_break';
      const walkKey = 'bossbelly_walk';
      if (this.sprite && this.scene.anims.exists(breakKey)) {
        this.sprite.play(breakKey).once('animationcomplete', () => {
          if (!this.dead && this.sprite && this.scene.anims.exists(walkKey)) {
            this.sprite.play(walkKey);
          }
        });
      }
    }
  }

  private updateHpBar(): void {
    const pct = this.hp / this.maxHp;
    const barW = this.config.isBoss ? 80 : this.config.width;
    this.hpBar.width = barW * pct;
  }

  die(): void {
    this.dead = true;
    (this.scene.game.registry.get('audio') as AudioManager | undefined)?.playDeath(this.config.id);
    const deathKey = `${this.config.id}_death`;
    if (this.sprite && this.scene.anims.exists(deathKey)) {
      this.sprite.play(deathKey).once('animationcomplete', () => this.destroy());
    } else {
      this.scene.tweens.add({
        targets: this,
        alpha: 0, y: this.y - 20, duration: 250,
        onComplete: () => this.destroy(),
      });
    }
  }
}
