import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { LEVELS } from '../config/levels';
import { AudioManager } from '../game/AudioManager';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultScene' });
  }

  create(data: { result: 'won' | 'lost'; levelId: number }): void {
    const { result, levelId } = data;
    const won = result === 'won';

    // Play result stinger
    const audio = this.game.registry.get('audio') as AudioManager | undefined;
    audio?.playStinger(won ? 'audio_stinger_result_victory_00' : 'audio_stinger_result_failure_00');

    // Overlay
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, won ? 0x1b5e20 : 0x7f0000, 0.85).setDepth(50);

    // Result icon (PNG asset) + big result text
    const iconKey = won ? 'ui_result_victory_icon' : 'ui_result_failure_icon';
    const iconY = GAME_HEIGHT / 2 - 150;
    const labelY = GAME_HEIGHT / 2 - 90;
    if (this.textures.exists(iconKey)) {
      this.add.image(GAME_WIDTH / 2, iconY, iconKey)
        .setDisplaySize(80, 80)
        .setDepth(51);
    } else {
      // Fallback: simple geometric icon
      const fallbackIcon = won ? '✦' : '✕';
      this.add.text(GAME_WIDTH / 2, iconY, fallbackIcon, {
        fontSize: '56px', color: won ? '#a5d6a7' : '#ef9a9a',
      }).setOrigin(0.5).setDepth(51);
    }
    this.add.text(GAME_WIDTH / 2, labelY, won ? '胜利！' : '失败', {
      fontSize: '64px',
      color: won ? '#a5d6a7' : '#ef9a9a',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(51);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, won ? '蘑菇森林得到了保护！' : '虫族突破了防线…', {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(51);

    // Retry + next level buttons — center retry when no next-level exists
    const hasNextLevel = won && levelId < LEVELS.length;
    const retryX = hasNextLevel ? GAME_WIDTH / 2 - 120 : GAME_WIDTH / 2;
    this.addButton(retryX, GAME_HEIGHT / 2 + 80, '重新挑战', 0x1565c0, () => {
      this.scene.start('GameScene', { levelId });
    });
    if (hasNextLevel) {
      this.addButton(GAME_WIDTH / 2 + 120, GAME_HEIGHT / 2 + 80, '下一关 ▶', 0x2e7d32, () => {
        this.scene.start('GameScene', { levelId: levelId + 1 });
      });
    }

    // Main menu
    this.addButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 160, '返回主菜单', 0x424242, () => {
      this.scene.start('MenuScene');
    });
  }

  private addButton(x: number, y: number, label: string, color: number, cb: () => void): void {
    const btn = this.add.rectangle(x, y, 200, 56, color)
      .setInteractive()
      .setDepth(51)
      .setStrokeStyle(2, 0xffffff, 0.6);
    this.add.text(x, y, label, {
      fontSize: '20px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(52);
    btn.on('pointerover', () => btn.setFillStyle(Phaser.Display.Color.IntegerToColor(color).lighten(20).color));
    btn.on('pointerout', () => btn.setFillStyle(color));
    btn.on('pointerdown', cb);
  }
}
