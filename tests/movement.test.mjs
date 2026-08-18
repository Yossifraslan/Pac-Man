import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MazeManager } from '../js/maze/MazeManager.js';
import { Player } from '../js/entities/Player.js';
import { Monster } from '../js/entities/Monster.js';

test('player moves when instructed to turn', () => {
  const maze = new MazeManager().build(1);
  const player = new Player(maze, 20);
  player.setNextDir('right');
  player.update(maze);
  assert.ok(player.x > 20);
});

test('ghosts stay inside maze and do not move through walls', () => {
  const maze = new MazeManager().build(1);
  const ghost = new Monster(maze, 20, 1, 1, 'chaser', '#ff0000', 2);
  ghost.dir = 'right';
  ghost.pixelX = 20;
  ghost.pixelY = 20;
  ghost.update(maze, { gridX: 1, gridY: 1, dir: null }, 0);
  assert.ok(ghost.pixelX >= 0 && ghost.pixelX <= maze.width * 20);
  assert.ok(ghost.pixelY >= 0 && ghost.pixelY <= maze.height * 20);
});

test('speed boost respects walls and stay inside the map', () => {
  const maze = {
    width: 5,
    height: 5,
    grid: [
      [0, 0, 0, 0, 0],
      [0, 1, 0, 1, 0],
      [0, 1, 1, 1, 0],
      [0, 1, 1, 1, 0],
      [0, 0, 0, 0, 0],
    ],
    playerStart: { x: 1, y: 1 },
    dots: [],
    pellets: [],
    totalDots: 0,
    centerRow: 2,
    centerCol: 2,
  };

  const player = new Player(maze, 20);
  player.x = 38;
  player.y = 20;
  player.velX = 4;
  player.velY = 0;
  player.speedBoostTimer = 1;

  player.update(maze);

  assert.ok(Math.floor(player.x / 20) === 1, 'player should stop before entering a wall');
  assert.ok(player.x >= 0 && player.x <= (maze.width - 1) * 20, 'player should not leave the map');
});
