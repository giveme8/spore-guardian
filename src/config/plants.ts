export interface PlantConfig {
  id: string;
  name: string;
  cost: number;
  hp: number;
  attackDamage: number;
  attackInterval: number; // ms
  bulletSpeed: number;
  color: number; // placeholder color
  cardColor: string;
  description: string;
}

export const PLANTS: Record<string, PlantConfig> = {
  shootbud: {
    id: 'shootbud',
    name: '射芽卫士',
    cost: 100,
    hp: 150,
    attackDamage: 20,
    attackInterval: 1500,
    bulletSpeed: 400,
    color: 0x4caf50,
    cardColor: '#2e7d32',
    description: '持续发射孢子弹，单体攻击',
  },
  mosswall: {
    id: 'mosswall',
    name: '盾藓卫士',
    cost: 50,
    hp: 450,
    attackDamage: 0,
    attackInterval: 0,
    bulletSpeed: 0,
    color: 0x795548,
    cardColor: '#4e342e',
    description: '高血量肉盾，阻挡敌人前进',
  },
  burstbloom: {
    id: 'burstbloom',
    name: '爆裂球花',
    cost: 150,
    hp: 100,
    attackDamage: 120,
    attackInterval: 5000, // fuse timer
    bulletSpeed: 0,
    color: 0xff5722,
    cardColor: '#bf360c',
    description: '定时爆炸，范围伤害 AOE',
  },
};

export const PLANT_ORDER = ['shootbud', 'mosswall', 'burstbloom'] as const;
