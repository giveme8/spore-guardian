import Phaser from 'phaser';
import { PlantConfig } from '../config/plants';
import { Bullet } from './Bullet';
import { cellToWorld } from './Grid';
import { CELL_SIZE } from '../config/constants';
import { AudioManager } from './AudioManager';

const SPRITE_SCALE = (CELL_SIZE - 8) / 256;
// Feet at (128,232) → shift sprite up so feet sit at cell bottom
const FEET_OFFSET = (232 - 128) * SPRITE_SCALE;

export class Plant extends Phaser.GameObjects.Container {
  config: PlantConfig;
  col: number;
  row: number;
  hp: number;
  maxHp: number;
  private attackTimer: number = 0;
  private fuseTimer: number = 0;
  private hpBar: Phaser.GameObjects.Rectangle;
  private sprite: Phaser.GameObjects.Sprite | null = null;
  dead = false;
  exploded = false;

  constructor(scene: Phaser.Scene, col: number, row: number, config: PlantConfig) {
    const { x, y } = cellToWorld(col, row);
    super(scene, x, y);
    this.config = config;
    this.col = col;
    this.row = row;
    this.hp = config.hp;
    this.maxHp = config.hp;

    const idleKey = `${config.id}_idle_00`;
    if (scene.textures.exists(idleKey)) {
      const sprite = scene.add.sprite(0, 0, idleKey);
      sprite.setOrigin(0.5, 0.5);
      sprite.setScale(SPRITE_SCALE);
      sprite.setY(-FEET_OFFSET + (CELL_SIZE / 2) - 8);
      this.sprite = sprite;
      this.add(sprite);
      const animKey = `${config.id}_idle`;
      if (scene.anims.exists(animKey)) sprite.play(animKey);
    } else {
      const body = scene.add.rectangle(0, 0, CELL_SIZE - 12, CELL_SIZE - 12, config.color);
      body.setStrokeStyle(2, 0xffffff, 0.6);
      this.add(body);
      const label = scene.add.text(0, 0, config.name.charAt(0), {
        fontSize: '22px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.add(label);
    }

    // HP bar
    const hpW = CELL_SIZE - 14;
    const hpBg = scene.add.rectangle(0, 38, hpW, 6, 0x333333);
    this.add(hpBg);
    this.hpBar = scene.add.rectangle(-hpW / 2, 38, hpW, 6, 0x00e676);
    this.hpBar.setOrigin(0, 0.5);
    this.add(this.hpBar);

    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    this.setDepth(10);
  }

  update(delta: number, bullets: Bullet[], hasEnemyInRow: boolean): void {
    if (this.dead) return;

    if (this.config.id === 'burstbloom') {
      this.fuseTimer += delta;
      // Switch to charge anim at 70% fuse
      if (this.fuseTimer > this.config.attackInterval * 0.7) {
        if (this.sprite && this.sprite.anims.currentAnim?.key !== 'burstbloom_charge') {
          if (this.scene.anims.exists('burstbloom_charge')) this.sprite.play('burstbloom_charge');
        }
      }
      if (this.fuseTimer >= this.config.attackInterval && !this.exploded) {
        this.triggerExplosion(bullets);
      }
      return;
    }

    if (this.config.attackDamage === 0) {
      // mosswall: show block anim when enemy in row
      if (this.sprite) {
        const targetAnim = hasEnemyInRow ? 'mosswall_block' : 'mosswall_idle';
        if (this.sprite.anims.currentAnim?.key !== targetAnim && this.scene.anims.exists(targetAnim)) {
          this.sprite.play(targetAnim);
        }
      }
      return;
    }

    if (!hasEnemyInRow) return;
    this.attackTimer += delta;
    if (this.attackTimer >= this.config.attackInterval) {
      this.attackTimer = 0;
      this.shoot(bullets);
    }
  }

  private shoot(bullets: Bullet[]): void {
    if (this.sprite && this.scene.anims.exists('shootbud_attack')) {
      this.sprite.play('shootbud_attack').once('animationcomplete', () => {
        if (!this.dead && this.sprite && this.scene.anims.exists('shootbud_idle')) {
          this.sprite.play('shootbud_idle');
        }
      });
    }
    const sporeKey = this.scene.textures.exists('projectile_spore_00') ? 'projectile_spore_00' : undefined;
    const bullet = new Bullet(this.scene, this.x + 40, this.y, this.config.attackDamage, this.config.bulletSpeed, false, 0, sporeKey);
    bullets.push(bullet);
    (this.scene.game.registry.get('audio') as AudioManager | undefined)?.playShoot();
  }

  private triggerExplosion(bullets: Bullet[]): void {
    this.exploded = true;
    const deathKey = `${this.config.id}_death`;
    if (this.sprite && this.scene.anims.exists(deathKey)) {
      this.sprite.play(deathKey).once('animationcomplete', () => this.die());
    }
    const aoe = new Bullet(this.scene, this.x, this.y, this.config.attackDamage, 0, true, 130);
    bullets.push(aoe);
    (this.scene.game.registry.get('audio') as AudioManager | undefined)?.playExplode();
    if (!this.sprite) this.die();
  }

  takeDamage(amount: number): void {
    this.hp = Math.max(0, this.hp - amount);
    this.updateHpBar();
    const hitKey = `${this.config.id}_hit`;
    const idleKey = `${this.config.id}_idle`;
    if (this.sprite && this.scene.anims.exists(hitKey) && this.sprite.anims.currentAnim?.key !== `${this.config.id}_death`) {
      this.sprite.play(hitKey).once('animationcomplete', () => {
        if (!this.dead && this.sprite && this.scene.anims.exists(idleKey)) this.sprite.play(idleKey);
      });
    }
    if (this.hp <= 0) this.die();
  }

  private updateHpBar(): void {
    const pct = this.hp / this.maxHp;
    this.hpBar.width = (CELL_SIZE - 14) * pct;
    this.hpBar.fillColor = pct > 0.5 ? 0x00e676 : pct > 0.25 ? 0xffeb3b : 0xf44336;
  }

  die(): void {
    this.dead = true;
    const deathKey = `${this.config.id}_death`;
    if (this.sprite && this.scene.anims.exists(deathKey)) {
      this.sprite.play(deathKey).once('animationcomplete', () => this.destroy());
    } else {
      this.scene.tweens.add({
        targets: this,
        alpha: 0, scaleX: 0, scaleY: 0, duration: 300,
        onComplete: () => this.destroy(),
      });
    }
  }
}
