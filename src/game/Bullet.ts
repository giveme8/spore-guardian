import Phaser from 'phaser';

export class Bullet extends Phaser.GameObjects.Container {
  speed: number;
  damage: number;
  isAoe: boolean;
  aoeRadius: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    damage: number,
    speed: number,
    isAoe = false,
    aoeRadius = 0,
    textureKey?: string
  ) {
    super(scene, x, y);
    this.damage = damage;
    this.speed = speed;
    this.isAoe = isAoe;
    this.aoeRadius = aoeRadius;

    if (textureKey && scene.textures.exists(textureKey)) {
      const sprite = scene.add.sprite(0, 0, textureKey);
      sprite.setScale(0.35);
      const animKey = 'projectile_spore';
      if (scene.anims.exists(animKey)) sprite.play(animKey);
      this.add(sprite);
    } else {
      const circle = scene.add.arc(0, 0, isAoe ? 0 : 8, 0, 360, false, 0xc8e6c9);
      this.add(circle);
    }

    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    this.setDepth(20);
  }

  update(delta: number): void {
    this.x += (this.speed * delta) / 1000;
  }
}
