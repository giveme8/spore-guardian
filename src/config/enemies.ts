export interface EnemyConfig {
  id: string;
  name: string;
  hp: number;
  speed: number;       // px/s
  attackDamage: number;
  attackInterval: number; // ms
  reward: number;      // sun reward on kill
  color: number;
  width: number;
  height: number;
  hasArmor: boolean;
  isBoss: boolean;
}

export const ENEMIES: Record<string, EnemyConfig> = {
  larva: {
    id: 'larva',
    name: '蠕行幼虫',
    hp: 80,
    speed: 60,
    attackDamage: 10,
    attackInterval: 1000,
    reward: 25,
    color: 0x8bc34a,
    width: 48,
    height: 48,
    hasArmor: false,
    isBoss: false,
  },
  shellbug: {
    id: 'shellbug',
    name: '甲胄虫兵',
    hp: 200,
    speed: 80,
    attackDamage: 15,
    attackInterval: 1000,
    reward: 50,
    color: 0x607d8b,
    width: 56,
    height: 56,
    hasArmor: true,
    isBoss: false,
  },
  bossbelly: {
    id: 'bossbelly',
    name: '巨腹虫王',
    hp: 1200,
    speed: 30,
    attackDamage: 40,
    attackInterval: 2000,
    reward: 200,
    color: 0x4a148c,
    width: 80,
    height: 80,
    hasArmor: true,
    isBoss: true,
  },
};
