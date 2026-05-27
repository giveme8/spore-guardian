import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { LEVELS } from '../config/levels';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    // Background gradient effect
    const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1b5e20);
    bg.setDepth(0);

    // Decorative circles (mushroom-forest vibe)
    for (let i = 0; i < 12; i++) {
      const cx = Math.random() * GAME_WIDTH;
      const cy = Math.random() * GAME_HEIGHT;
      const r = 20 + Math.random() * 60;
      const c = [0x2e7d32, 0x388e3c, 0x1b5e20, 0x33691e][Math.floor(Math.random() * 4)];
      this.add.arc(cx, cy, r, 0, 360, false, c, 0.3).setDepth(1);
    }

    // Title
    this.add.text(GAME_WIDTH / 2, 140, '孢子卫士', {
      fontSize: '72px',
      color: '#a5d6a7',
      fontStyle: 'bold',
      stroke: '#1b5e20',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(10);

    this.add.text(GAME_WIDTH / 2, 215, 'Spore Guardian', {
      fontSize: '28px',
      color: '#81c784',
    }).setOrigin(0.5).setDepth(10);

    this.add.text(GAME_WIDTH / 2, 260, '保卫蘑菇森林，抵御虫族入侵', {
      fontSize: '18px',
      color: '#c8e6c9',
    }).setOrigin(0.5).setDepth(10);

    // Level buttons
    const levels = LEVELS;
    const buttonY = 360;
    levels.forEach((lvl, i) => {
      const bx = GAME_WIDTH / 2 + (i - 2) * 155;
      const btn = this.add.rectangle(bx, buttonY, 135, 60, 0x2e7d32)
        .setInteractive()
        .setDepth(10)
        .setStrokeStyle(2, 0x81c784);

      this.add.text(bx, buttonY - 10, `第 ${lvl.id} 关`, {
        fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(11);

      this.add.text(bx, buttonY + 12, lvl.name.split('—')[1]?.trim() ?? '', {
        fontSize: '12px', color: '#a5d6a7',
      }).setOrigin(0.5).setDepth(11);

      btn.on('pointerover', () => btn.setFillStyle(0x388e3c));
      btn.on('pointerout', () => btn.setFillStyle(0x2e7d32));
      btn.on('pointerdown', () => {
        this.scene.start('GameScene', { levelId: lvl.id });
      });
    });

    // Quick start
    const startBtn = this.add.rectangle(GAME_WIDTH / 2, 470, 220, 60, 0xf57f17)
      .setInteractive().setDepth(10).setStrokeStyle(2, 0xffca28);
    this.add.text(GAME_WIDTH / 2, 470, '▶  快速开始（第1关）', {
      fontSize: '20px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11);
    startBtn.on('pointerover', () => startBtn.setFillStyle(0xfb8c00));
    startBtn.on('pointerout', () => startBtn.setFillStyle(0xf57f17));
    startBtn.on('pointerdown', () => this.scene.start('GameScene', { levelId: 1 }));

    // Controls hint
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, '点击卡牌选择植物 → 点击格子种植  |  收集掉落的孢光⊙ 获得资源', {
      fontSize: '14px', color: '#66bb6a',
    }).setOrigin(0.5).setDepth(10);
  }
}
