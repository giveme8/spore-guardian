import Phaser from 'phaser';

// SFX Phaser load keys — match actual filenames in public/assets/audio/
export const SFX = {
  SHOOT_0: 'audio_sfx_shootbud_fire_00',
  SHOOT_1: 'audio_sfx_shootbud_fire_01',

  HIT_LARVA_0:    'audio_sfx_enemy_hit_larva_00',
  HIT_LARVA_1:    'audio_sfx_enemy_hit_larva_01',
  HIT_LARVA_2:    'audio_sfx_enemy_hit_larva_02',
  HIT_SHELLBUG_0: 'audio_sfx_enemy_hit_shellbug_00',
  HIT_SHELLBUG_1: 'audio_sfx_enemy_hit_shellbug_01',
  HIT_SHELLBUG_2: 'audio_sfx_enemy_hit_shellbug_02',
  HIT_BOSSBELLY_0:'audio_sfx_enemy_hit_bossbelly_00',
  HIT_BOSSBELLY_1:'audio_sfx_enemy_hit_bossbelly_01',
  HIT_BOSSBELLY_2:'audio_sfx_enemy_hit_bossbelly_02',

  DEATH_LARVA:    'audio_sfx_enemy_death_larva_00',
  DEATH_SHELLBUG: 'audio_sfx_enemy_death_shellbug_00',
  DEATH_BOSSBELLY:'audio_sfx_enemy_death_bossbelly_00',

  EXPLODE_0: 'audio_sfx_burstbloom_explode_00',
  EXPLODE_1: 'audio_sfx_burstbloom_explode_01',

  COLLECT_0: 'audio_sfx_sporelight_collect_00',
  COLLECT_1: 'audio_sfx_sporelight_collect_01',

  STINGER_WIN:  'audio_stinger_result_victory_00',
  STINGER_LOSE: 'audio_stinger_result_failure_00',
} as const;

const HIT_VARIANTS: Record<string, readonly string[]> = {
  larva:    [SFX.HIT_LARVA_0,    SFX.HIT_LARVA_1,    SFX.HIT_LARVA_2],
  shellbug: [SFX.HIT_SHELLBUG_0, SFX.HIT_SHELLBUG_1, SFX.HIT_SHELLBUG_2],
  bossbelly:[SFX.HIT_BOSSBELLY_0,SFX.HIT_BOSSBELLY_1,SFX.HIT_BOSSBELLY_2],
};

const DEATH_VARIANTS: Record<string, string> = {
  larva:    SFX.DEATH_LARVA,
  shellbug: SFX.DEATH_SHELLBUG,
  bossbelly:SFX.DEATH_BOSSBELLY,
};

export class AudioManager {
  private sound: Phaser.Sound.BaseSoundManager;
  private sfxVol  = 0.7;
  private stingerVol = 0.85;
  private _muted = false;
  private shootIndex = 0;
  private hitCounters: Record<string, number> = {};
  private collectIndex = 0;

  constructor(sound: Phaser.Sound.BaseSoundManager) {
    this.sound = sound;
  }

  play(key: string, volScale = 1): void {
    if (this._muted) return;
    if (!this.sound.game.cache.audio.exists(key)) return;
    this.sound.play(key, { volume: this.sfxVol * volScale });
  }

  playStinger(key: string): void {
    if (this._muted) return;
    if (!this.sound.game.cache.audio.exists(key)) return;
    this.sound.play(key, { volume: this.stingerVol });
  }

  playShoot(): void {
    const variants = [SFX.SHOOT_0, SFX.SHOOT_1];
    this.play(variants[this.shootIndex % variants.length]);
    this.shootIndex++;
  }

  playHit(enemyId: string): void {
    const variants = HIT_VARIANTS[enemyId] ?? HIT_VARIANTS['larva'];
    const idx = this.hitCounters[enemyId] ?? 0;
    this.play(variants[idx % variants.length]);
    this.hitCounters[enemyId] = idx + 1;
  }

  playDeath(enemyId: string): void {
    this.play(DEATH_VARIANTS[enemyId] ?? SFX.DEATH_LARVA);
  }

  playExplode(): void {
    const variants = [SFX.EXPLODE_0, SFX.EXPLODE_1];
    this.play(variants[Math.floor(Math.random() * variants.length)], 1.2);
  }

  playCollect(): void {
    const variants = [SFX.COLLECT_0, SFX.COLLECT_1];
    this.play(variants[this.collectIndex % variants.length], 0.6);
    this.collectIndex++;
  }

  setVolume(channel: 'sfx' | 'stinger', value: number): void {
    const v = Math.max(0, Math.min(1, value));
    if (channel === 'sfx') this.sfxVol = v;
    else this.stingerVol = v;
  }

  toggleMute(): boolean {
    this._muted = !this._muted;
    this.sound.volume = this._muted ? 0 : 1;
    return this._muted;
  }

  get muted(): boolean {
    return this._muted;
  }
}
