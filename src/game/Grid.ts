import Phaser from 'phaser';
import { GRID_COLS, GRID_ROWS, CELL_SIZE, GRID_ORIGIN_X, GRID_ORIGIN_Y } from '../config/constants';
import { PlantConfig } from '../config/plants';
import { Plant } from './Plant';

export function cellToWorld(col: number, row: number): { x: number; y: number } {
  return {
    x: GRID_ORIGIN_X + col * CELL_SIZE + CELL_SIZE / 2,
    y: GRID_ORIGIN_Y + row * CELL_SIZE + CELL_SIZE / 2,
  };
}

export function worldToCell(wx: number, wy: number): { col: number; row: number } | null {
  const col = Math.floor((wx - GRID_ORIGIN_X) / CELL_SIZE);
  const row = Math.floor((wy - GRID_ORIGIN_Y) / CELL_SIZE);
  if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return null;
  return { col, row };
}

export class Grid {
  private cells: (Plant | null)[][];
  private highlights: Phaser.GameObjects.Rectangle[][];
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.cells = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null));
    this.highlights = [];
    this.drawGrid();
  }

  private drawGrid(): void {
    const gfx = this.scene.add.graphics();
    gfx.lineStyle(1, 0x336633, 0.4);

    for (let row = 0; row < GRID_ROWS; row++) {
      this.highlights[row] = [];
      for (let col = 0; col < GRID_COLS; col++) {
        const x = GRID_ORIGIN_X + col * CELL_SIZE;
        const y = GRID_ORIGIN_Y + row * CELL_SIZE;
        gfx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);

        const hl = this.scene.add.rectangle(
          x + CELL_SIZE / 2,
          y + CELL_SIZE / 2,
          CELL_SIZE - 2,
          CELL_SIZE - 2,
          0xffffff,
          0
        );
        hl.setDepth(5);
        hl.setInteractive();
        this.highlights[row][col] = hl;
      }
    }
  }

  getHighlight(col: number, row: number): Phaser.GameObjects.Rectangle {
    return this.highlights[row][col];
  }

  isOccupied(col: number, row: number): boolean {
    return this.cells[row][col] !== null;
  }

  placePlant(col: number, row: number, plant: Plant): void {
    this.cells[row][col] = plant;
  }

  removePlant(col: number, row: number): void {
    this.cells[row][col] = null;
  }

  getPlant(col: number, row: number): Plant | null {
    return this.cells[row][col];
  }

  getPlantsInRow(row: number): Plant[] {
    return this.cells[row].filter((p): p is Plant => p !== null);
  }

  getAllPlants(): Plant[] {
    return this.cells.flat().filter((p): p is Plant => p !== null);
  }
}
