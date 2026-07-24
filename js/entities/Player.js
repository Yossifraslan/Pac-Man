export class Player {
  constructor(maze, tileSize) {
    this.ts = tileSize;
    this.x = maze.playerStart.x * tileSize;
    this.y = maze.playerStart.y * tileSize;
    this.gridX = maze.playerStart.x;
    this.gridY = maze.playerStart.y;

    this.velX = 0;
    this.velY = 0;
    this.queuedVelX = 0;
    this.queuedVelY = 0;

    this.mouth = 0.1;
    this.mouthDir = 1;

    this.shield = false;
    this.speedBoostTimer = 0;
    this.doublePointTimer = 0;

    // keep pixelX/pixelY working for collision in main.js
    this.pixelX = this.x;
    this.pixelY = this.y;
  }

  get dir() {
    if (this.velX > 0) return "right";
    if (this.velX < 0) return "left";
    if (this.velY < 0) return "up";
    if (this.velY > 0) return "down";
    return null;
  }

  setNextDir(dir) {
    const s = 2;
    if (dir === "up") {
      this.queuedVelX = 0;
      this.queuedVelY = -s;
    }
    if (dir === "down") {
      this.queuedVelX = 0;
      this.queuedVelY = s;
    }
    if (dir === "left") {
      this.queuedVelX = -s;
      this.queuedVelY = 0;
    }
    if (dir === "right") {
      this.queuedVelX = s;
      this.queuedVelY = 0;
    }
  }

  isAligned() {
    return this.x % this.ts === 0 && this.y % this.ts === 0;
  }

  // Only call when isAligned — col/row are integers
  _tileOpen(maze, col, row) {
    if (col < 0 || col >= maze.width) return true; // tunnel
    if (row < 0 || row >= maze.height) return false;
    const cell = maze.grid[row][col];
    return cell !== 0 && cell !== 2 && cell !== undefined;
  }

  _canGoVel(maze, vx, vy) {
    const col = this.x / this.ts;
    const row = this.y / this.ts;
    const nc = col + (vx > 0 ? 1 : vx < 0 ? -1 : 0);
    const nr = row + (vy > 0 ? 1 : vy < 0 ? -1 : 0);
    return this._tileOpen(maze, nc, nr);
  }

  update(maze) {
    const spd = 2; // must divide tileSize (20) evenly

    // ── Direction decisions — only when exactly on a tile ─────────────
    if (this.isAligned()) {
      this.gridX = this.x / this.ts;
      this.gridY = this.y / this.ts;

      // Try queued direction
      if (
        (this.queuedVelX !== 0 || this.queuedVelY !== 0) &&
        this._canGoVel(maze, this.queuedVelX, this.queuedVelY)
      ) {
        this.velX = this.queuedVelX;
        this.velY = this.queuedVelY;
      }

      // Stop if current direction is now blocked
      if (
        (this.velX !== 0 || this.velY !== 0) &&
        !this._canGoVel(maze, this.velX, this.velY)
      ) {
        this.velX = 0;
        this.velY = 0;
      }
    }

    // ── Movement — no wall check mid-tile ─────────────────────────────
    if (this.velX !== 0 || this.velY !== 0) {
      const mx = this.velX > 0 ? spd : this.velX < 0 ? -spd : 0;
      const my = this.velY > 0 ? spd : this.velY < 0 ? -spd : 0;
      this.x += mx;
      this.y += my;
    }

    // Tunnel wrap
    const W = maze.width * this.ts;
    if (this.x < 0) this.x = W - this.ts;
    if (this.x >= W) this.x = 0;

    // Sync pixelX/pixelY for collision detection in main.js
    this.pixelX = this.x;
    this.pixelY = this.y;

    // Mouth
    if (this.velX !== 0 || this.velY !== 0) {
      this.mouth += 0.1 * this.mouthDir;
      if (this.mouth > 0.65 || this.mouth < 0.02) this.mouthDir *= -1;
    }

    if (this.speedBoostTimer > 0) this.speedBoostTimer--;
    if (this.doublePointTimer > 0) this.doublePointTimer--;
  }

  draw(ctx) {
    const cx = this.x + this.ts / 2;
    const cy = this.y + this.ts / 2;
    const r = this.ts / 2 - 1;
    const m = this.velX !== 0 || this.velY !== 0 ? this.mouth : 0.1;

    let angle = 0;
    if (this.velX > 0) angle = 0;
    if (this.velX < 0) angle = Math.PI;
    if (this.velY < 0) angle = -Math.PI / 2;
    if (this.velY > 0) angle = Math.PI / 2;

    ctx.save();
    ctx.fillStyle = this.shield ? "#00ffae" : "#ffe600";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle + m, angle + Math.PI * 2 - m);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
