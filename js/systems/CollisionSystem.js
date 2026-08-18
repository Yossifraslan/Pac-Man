export class CollisionSystem {
  static getCurrentTile(player) {
    return {
      x: Math.floor(player.x / player.tileSize),
      y: Math.floor(player.y / player.tileSize),
    };
  }

  static checkDot(player, maze) {
    const tile = this.getCurrentTile(player);
    const idx = maze.dots.findIndex((d) => d.x === tile.x && d.y === tile.y);
    if (idx !== -1) {
      maze.dots.splice(idx, 1);
      return true;
    }
    return false;
  }

  static checkPellet(player, maze) {
    const tile = this.getCurrentTile(player);
    const idx = maze.pellets.findIndex((p) => p.x === tile.x && p.y === tile.y);
    if (idx !== -1) {
      maze.pellets.splice(idx, 1);
      return true;
    }
    return false;
  }
}
