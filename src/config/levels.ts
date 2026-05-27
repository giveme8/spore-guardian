export interface EnemySpawn {
  enemyId: string;
  count: number;
  interval: number; // ms between spawns in this group
  lane?: number;    // undefined = random lane within active lanes
}

export interface Wave {
  delay: number;    // ms after previous wave ends before this starts
  spawns: EnemySpawn[];
}

export interface LevelConfig {
  id: number;
  name: string;
  activeLanes: number;  // how many of the 5 lanes are active (top N)
  waves: Wave[];
  startingSun: number;
  sunInterval: number; // ms between auto sun drops
  bossLane?: number;   // fixed lane for boss
}

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: '第一关 — 幼虫试炼',
    activeLanes: 1,
    startingSun: 150,
    sunInterval: 8000,
    waves: [
      { delay: 0,    spawns: [{ enemyId: 'larva', count: 3, interval: 1500 }] },
      { delay: 5000, spawns: [{ enemyId: 'larva', count: 4, interval: 1200 }] },
      { delay: 5000, spawns: [{ enemyId: 'larva', count: 5, interval: 1000 }] },
    ],
  },
  {
    id: 2,
    name: '第二关 — 双路奇袭',
    activeLanes: 2,
    startingSun: 150,
    sunInterval: 7000,
    waves: [
      { delay: 0,    spawns: [{ enemyId: 'larva', count: 3, interval: 1500 }] },
      { delay: 4000, spawns: [{ enemyId: 'larva', count: 4, interval: 1200 }] },
      { delay: 4000, spawns: [{ enemyId: 'larva', count: 4, interval: 1000 }] },
      { delay: 3000, spawns: [{ enemyId: 'larva', count: 6, interval: 800 }] },
    ],
  },
  {
    id: 3,
    name: '第三关 — 甲胄来袭',
    activeLanes: 3,
    startingSun: 150,
    sunInterval: 7000,
    waves: [
      { delay: 0,    spawns: [{ enemyId: 'larva', count: 4, interval: 1200 }] },
      { delay: 4000, spawns: [{ enemyId: 'shellbug', count: 2, interval: 2000 }] },
      { delay: 4000, spawns: [{ enemyId: 'larva', count: 4, interval: 1000 }, { enemyId: 'shellbug', count: 1, interval: 2000 }] },
      { delay: 3000, spawns: [{ enemyId: 'shellbug', count: 3, interval: 1500 }] },
      { delay: 3000, spawns: [{ enemyId: 'larva', count: 6, interval: 700 }, { enemyId: 'shellbug', count: 2, interval: 1800 }] },
    ],
  },
  {
    id: 4,
    name: '第四关 — 混合压制',
    activeLanes: 4,
    startingSun: 150,
    sunInterval: 6500,
    waves: [
      { delay: 0,    spawns: [{ enemyId: 'larva', count: 5, interval: 1000 }] },
      { delay: 3500, spawns: [{ enemyId: 'shellbug', count: 3, interval: 1500 }] },
      { delay: 3500, spawns: [{ enemyId: 'larva', count: 6, interval: 800 }] },
      { delay: 3000, spawns: [{ enemyId: 'shellbug', count: 4, interval: 1200 }] },
      { delay: 3000, spawns: [{ enemyId: 'larva', count: 5, interval: 700 }, { enemyId: 'shellbug', count: 2, interval: 1500 }] },
      { delay: 2500, spawns: [{ enemyId: 'larva', count: 8, interval: 600 }, { enemyId: 'shellbug', count: 3, interval: 1200 }] },
    ],
  },
  {
    id: 5,
    name: '第五关 — 虫王降临',
    activeLanes: 5,
    startingSun: 200,
    sunInterval: 6000,
    bossLane: 2,
    waves: [
      { delay: 0,    spawns: [{ enemyId: 'larva', count: 5, interval: 1000 }] },
      { delay: 4000, spawns: [{ enemyId: 'shellbug', count: 3, interval: 1500 }] },
      { delay: 3000, spawns: [{ enemyId: 'larva', count: 6, interval: 800 }] },
      { delay: 3000, spawns: [{ enemyId: 'shellbug', count: 4, interval: 1200 }] },
      { delay: 3000, spawns: [{ enemyId: 'larva', count: 6, interval: 700 }, { enemyId: 'shellbug', count: 3, interval: 1300 }] },
      { delay: 3000, spawns: [{ enemyId: 'bossbelly', count: 1, interval: 0, lane: 2 }] },
      { delay: 2000, spawns: [{ enemyId: 'larva', count: 8, interval: 600 }, { enemyId: 'shellbug', count: 4, interval: 1100 }] },
      { delay: 2000, spawns: [{ enemyId: 'larva', count: 10, interval: 500 }] },
    ],
  },
];
