import { MAZES } from "./MazeData.js";

export class MazeManager {
  constructor() {
    this.tileSize = 20;
  }

  getTemplateForLevel(level) {
    return MAZES[level - 1] || MAZES[MAZES.length - 1];
  }

  build(level) {
    const template = this.getTemplateForLevel(level);
    const grid = template.map((row) => row.split("").map(Number));

    const dots = [];
    const pellets = [];
    const ghostSpawns = [];

    let playerStart = { x: 1, y: 1 };
    let foundStart = false;

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];

        if (cell === 1) {
          dots.push({ x, y });
        }

        if (cell === 3) {
          pellets.push({ x, y });
        }

        if (cell === 2) {
          ghostSpawns.push({ x, y });
        }

        if (!foundStart && (cell === 1 || cell === 3)) {
          playerStart = { x, y };
          foundStart = true;
        }
      }
    }

    const maze = {
      grid,
      dots,
      pellets,
      ghostSpawns,
      width: grid[0].length,
      height: grid.length,
      playerStart,
      totalDots: dots.length,
    };

    maze.isWall = (m, x, y) => {
      if (x < 0 || x >= m.width || y < 0 || y >= m.height) {
        return true;
      }

      return m.grid[y][x] === 0;
    };

    maze.isGhostHouse = (m, x, y) => {
      if (x < 0 || x >= m.width || y < 0 || y >= m.height) {
        return false;
      }

      return m.grid[y][x] === 2;
    };

    return maze;
  }
}
