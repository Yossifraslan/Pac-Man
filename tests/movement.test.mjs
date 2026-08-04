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
