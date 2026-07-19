export class CollisionSystem {
  static checkDot(player, maze) {
    const idx = maze.dots.findIndex(
      (d) => d.x === player.gridX && d.y === player.gridY,
    );
    if (idx !== -1) {
      maze.dots.splice(idx, 1);
      maze.grid[player.gridY][player.gridX] = 2;
      return true;
    }
    return false;
  }

  static checkPellet(player, maze) {
    const idx = maze.pellets.findIndex(
      (p) => p.x === player.gridX && p.y === player.gridY,
    );
    if (idx !== -1) {
      maze.pellets.splice(idx, 1);
      maze.grid[player.gridY][player.gridX] = 2;
      return true;
    }
    return false;
  }
}
