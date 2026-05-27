import Phaser from 'phaser';
import { AudioManager, SFX } from '../game/AudioManager';

interface AnimDef {
  key: string;
  prefix: string;
  count: number;
  fps: number;
  loop: boolean;
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.showLoadingBar();

    // Tiles
    this.load.image('tile_base', 'assets/tiles/tile_forest_base_01.png');
    this.load.image('tile_hover_valid', 'assets/tiles/tile_forest_hover_valid_01.png');
    this.load.image('tile_hover_invalid', 'assets/tiles/tile_forest_hover_invalid_01.png');
    this.load.image('tile_path_hint', 'assets/tiles/tile_forest_path_hint_01.png');
    this.load.image('tile_shadow', 'assets/tiles/tile_forest_shadow_soft_01.png');

    // Plants — shootbud
    this.loadFrames('shootbud_idle', 'assets/plants/plant_shootbud_idle_', 6);
    this.loadFrames('shootbud_attack', 'assets/plants/plant_shootbud_attack_', 6);
    this.loadFrames('shootbud_hit', 'assets/plants/plant_shootbud_hit_', 3);
    this.loadFrames('shootbud_death', 'assets/plants/plant_shootbud_death_', 6);

    // Plants — mosswall
    this.loadFrames('mosswall_idle', 'assets/plants/plant_mosswall_idle_', 6);
    this.loadFrames('mosswall_block', 'assets/plants/plant_mosswall_block_', 4);
    this.loadFrames('mosswall_hit', 'assets/plants/plant_mosswall_hit_', 3);
    this.loadFrames('mosswall_death', 'assets/plants/plant_mosswall_death_', 6);

    // Plants — burstbloom
    this.loadFrames('burstbloom_idle', 'assets/plants/plant_burstbloom_idle_', 6);
    this.loadFrames('burstbloom_charge', 'assets/plants/plant_burstbloom_charge_', 6);
    this.loadFrames('burstbloom_explode', 'assets/plants/plant_burstbloom_explode_', 8);
    this.loadFrames('burstbloom_hit', 'assets/plants/plant_burstbloom_hit_', 3);
    this.loadFrames('burstbloom_death', 'assets/plants/plant_burstbloom_death_', 6);

    // Enemies — larva
    this.loadFrames('larva_walk', 'assets/enemies/enemy_larva_walk_', 6);
    this.loadFrames('larva_attack', 'assets/enemies/enemy_larva_attack_', 4);
    this.loadFrames('larva_hit', 'assets/enemies/enemy_larva_hit_', 3);
    this.loadFrames('larva_death', 'assets/enemies/enemy_larva_death_', 6);

    // Enemies — shellbug
    this.loadFrames('shellbug_walk', 'assets/enemies/enemy_shellbug_walk_', 6);
    this.loadFrames('shellbug_attack', 'assets/enemies/enemy_shellbug_attack_', 4);
    this.loadFrames('shellbug_hit', 'assets/enemies/enemy_shellbug_hit_', 3);
    this.loadFrames('shellbug_death', 'assets/enemies/enemy_shellbug_death_', 6);

    // Enemies — bossbelly
    this.loadFrames('bossbelly_walk', 'assets/enemies/enemy_bossbelly_walk_', 6);
    this.loadFrames('bossbelly_attack', 'assets/enemies/enemy_bossbelly_attack_', 4);
    this.loadFrames('bossbelly_hit', 'assets/enemies/enemy_bossbelly_hit_', 3);
    this.loadFrames('bossbelly_death', 'assets/enemies/enemy_bossbelly_death_', 6);
    this.loadFrames('bossbelly_armor_break', 'assets/enemies/enemy_bossbelly_armor_break_', 5);
    this.loadFrames('bossbelly_charge', 'assets/enemies/enemy_bossbelly_charge_', 6);

    // FX
    this.loadFrames('projectile_spore', 'assets/ui/projectile_spore_', 4);
    this.loadFrames('fx_explosion', 'assets/ui/fx_explosion_spore_', 8);

    // UI
    this.load.image('ui_icon_sporelight', 'assets/ui/ui_icon_sporelight_00.png');
    this.load.image('ui_bar_hp', 'assets/ui/ui_bar_hp_00.png');
    this.load.image('ui_bar_armor', 'assets/ui/ui_bar_armor_00.png');
    this.load.image('ui_card_mosswall', 'assets/ui/ui_card_mosswall_00.png');
    this.load.image('ui_card_burstbloom', 'assets/ui/ui_card_burstbloom_00.png');
    // Result screen icons (P1 — gracefully absent until delivered)
    this.load.image('ui_result_failure_icon', 'assets/ui/ui_result_failure_icon_00.png');
    this.load.image('ui_result_victory_icon', 'assets/ui/ui_result_victory_icon_00.png');

    // SFX — OGG primary, MP3 fallback (#t26 assets)
    for (const key of Object.values(SFX)) {
      this.load.audio(key, [
        `assets/audio/${key}.ogg`,
        `assets/audio/${key}.mp3`,
      ]);
    }
  }

  private loadFrames(prefix: string, path: string, count: number): void {
    for (let i = 0; i < count; i++) {
      this.load.image(`${prefix}_${i.toString().padStart(2, '0')}`, `${path}${i.toString().padStart(2, '0')}.png`);
    }
  }

  private showLoadingBar(): void {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, 420, 20, 0x333333).setDepth(10);
    const bar = this.add.rectangle(width / 2 - 200, height / 2, 0, 14, 0x4caf50).setOrigin(0, 0.5).setDepth(11);
    const pct = this.add.text(width / 2, height / 2 - 30, '加载中…', {
      fontSize: '18px', color: '#a5d6a7',
    }).setOrigin(0.5).setDepth(11);
    this.load.on('progress', (v: number) => {
      bar.width = 400 * v;
      pct.setText(`加载中… ${Math.round(v * 100)}%`);
    });
  }

  create(): void {
    this.registerAnims();
    // Init AudioManager once; store in game registry for all scenes
    if (!this.game.registry.get('audio')) {
      this.game.registry.set('audio', new AudioManager(this.sound));
    }
    this.scene.start('MenuScene');
  }

  private registerAnims(): void {
    const defs: AnimDef[] = [
      // Plants
      { key: 'shootbud_idle',   prefix: 'shootbud_idle',   count: 6, fps: 6,  loop: true },
      { key: 'shootbud_attack', prefix: 'shootbud_attack', count: 6, fps: 10, loop: false },
      { key: 'shootbud_hit',    prefix: 'shootbud_hit',    count: 3, fps: 10, loop: false },
      { key: 'shootbud_death',  prefix: 'shootbud_death',  count: 6, fps: 8,  loop: false },
      { key: 'mosswall_idle',   prefix: 'mosswall_idle',   count: 6, fps: 5,  loop: true },
      { key: 'mosswall_block',  prefix: 'mosswall_block',  count: 4, fps: 8,  loop: true },
      { key: 'mosswall_hit',    prefix: 'mosswall_hit',    count: 3, fps: 10, loop: false },
      { key: 'mosswall_death',  prefix: 'mosswall_death',  count: 6, fps: 8,  loop: false },
      { key: 'burstbloom_idle',    prefix: 'burstbloom_idle',    count: 6, fps: 5,  loop: true },
      { key: 'burstbloom_charge',  prefix: 'burstbloom_charge',  count: 6, fps: 8,  loop: false },
      { key: 'burstbloom_explode', prefix: 'burstbloom_explode', count: 8, fps: 12, loop: false },
      { key: 'burstbloom_hit',     prefix: 'burstbloom_hit',     count: 3, fps: 10, loop: false },
      { key: 'burstbloom_death',   prefix: 'burstbloom_death',   count: 6, fps: 8,  loop: false },
      // Enemies
      { key: 'larva_walk',   prefix: 'larva_walk',   count: 6, fps: 8,  loop: true },
      { key: 'larva_attack', prefix: 'larva_attack', count: 4, fps: 8,  loop: true },
      { key: 'larva_hit',    prefix: 'larva_hit',    count: 3, fps: 10, loop: false },
      { key: 'larva_death',  prefix: 'larva_death',  count: 6, fps: 8,  loop: false },
      { key: 'shellbug_walk',   prefix: 'shellbug_walk',   count: 6, fps: 7,  loop: true },
      { key: 'shellbug_attack', prefix: 'shellbug_attack', count: 4, fps: 8,  loop: true },
      { key: 'shellbug_hit',    prefix: 'shellbug_hit',    count: 3, fps: 10, loop: false },
      { key: 'shellbug_death',  prefix: 'shellbug_death',  count: 6, fps: 8,  loop: false },
      { key: 'bossbelly_walk',        prefix: 'bossbelly_walk',        count: 6, fps: 5,  loop: true },
      { key: 'bossbelly_attack',      prefix: 'bossbelly_attack',      count: 4, fps: 7,  loop: true },
      { key: 'bossbelly_hit',         prefix: 'bossbelly_hit',         count: 3, fps: 10, loop: false },
      { key: 'bossbelly_death',       prefix: 'bossbelly_death',       count: 6, fps: 6,  loop: false },
      { key: 'bossbelly_armor_break', prefix: 'bossbelly_armor_break', count: 5, fps: 8,  loop: false },
      { key: 'bossbelly_charge',      prefix: 'bossbelly_charge',      count: 6, fps: 10, loop: true },
      // FX
      { key: 'projectile_spore', prefix: 'projectile_spore', count: 4, fps: 12, loop: true },
      { key: 'fx_explosion',     prefix: 'fx_explosion',     count: 8, fps: 14, loop: false },
    ];

    for (const def of defs) {
      const frames: Phaser.Types.Animations.AnimationFrame[] = [];
      for (let i = 0; i < def.count; i++) {
        frames.push({ key: `${def.prefix}_${i.toString().padStart(2, '0')}` });
      }
      this.anims.create({
        key: def.key,
        frames,
        frameRate: def.fps,
        repeat: def.loop ? -1 : 0,
      });
    }
  }
}
