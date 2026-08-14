import { MAZES } from "./MazeData.js";

export class MazeManager {
  constructor() {
    this.tileSize = 20;
  }

  getTemplateForLevel(level) {
    return MAZES[Math.min(level - 1, MAZES.length - 1)];
  }

  build(level) {
    const template = this.getTemplateForLevel(level);
    const grid = template.map((row) => row.split("").map(Number));
    const dots = [];
    const pellets = [];
    const ghostSpawns = [];

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];
        if (cell === 1) dots.push({ x, y });
        if (cell === 3) pellets.push({ x, y });
        if (cell === 2) ghostSpawns.push({ x, y });
      }
    }

    const H = grid.length;
    const W = grid[0].length;
    const cRow = Math.floor(H / 2);
    const cCol = Math.floor(W / 2);
    const minDist = Math.floor(Math.min(H, W) / 3);

    // Random player spawn — open tile far from center
    const spawnPool = [];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const cell = grid[y][x];
        if (cell === 1 || cell === 3) {
          const dist = Math.abs(x - cCol) + Math.abs(y - cRow);
          if (dist >= minDist) spawnPool.push({ x, y });
        }
      }
    }
    // Shuffle and pick one
    for (let i = spawnPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [spawnPool[i], spawnPool[j]] = [spawnPool[j], spawnPool[i]];
    }
    const playerStart = spawnPool[0] || { x: 1, y: 1 };

    const maze = {
      grid,
      dots,
      pellets,
      ghostSpawns,
      width: W,
      height: H,
      playerStart,
      totalDots: dots.length,
      centerRow: cRow,
      centerCol: cCol,
    };

    maze.isWall = (m, x, y) => {
      if (x < 0 || x >= m.width || y < 0 || y >= m.height) return true;
      return m.grid[y][x] === 0;
    };

    maze.isGhostHouse = (m, x, y) => {
      if (x < 0 || x >= m.width || y < 0 || y >= m.height) return false;
      return m.grid[y][x] === 2;
    };

    return maze;
  }
}
