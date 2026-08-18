export class Player {
  constructor(maze, tileSize) {
    this.tileSize = tileSize;
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
    this.shieldTimer = 0;
    this.speedBoostTimer = 0;
    this.doublePointTimer = 0;

    this.dying = false;
    this.deathTimer = 0;
    this.deathFrames = 80; // longer so animation is visible

    this.spawning = true;
    this.spawnTimer = 40; // slower so it's visible
    this.spawnFrames = 40;

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

  triggerDeath() {
    this.dying = true;
    this.deathTimer = this.deathFrames;
    this.velX = 0;
    this.velY = 0;
    this._waitingRespawn = true;
  }

  triggerSpawn() {
    this.spawning = true;
    this.spawnTimer = this.spawnFrames;
    this._waitingRespawn = false;
  }

  isAligned() {
    return this.x % this.tileSize === 0 && this.y % this.tileSize === 0;
  }

  _tileOpen(maze, col, row) {
    if (col < 0 || col >= maze.width) return true;
    if (row < 0 || row >= maze.height) return false;
    const cell = maze.grid[row][col];
    return cell !== 0 && cell !== 2 && cell !== undefined;
  }

  _canGoVel(maze, vx, vy) {
    const col = this.x / this.tileSize;
    const row = this.y / this.tileSize;
    const nc = col + (vx > 0 ? 1 : vx < 0 ? -1 : 0);
    const nr = row + (vy > 0 ? 1 : vy < 0 ? -1 : 0);
    return this._tileOpen(maze, nc, nr);
  }

  _stepToward(maze, value, delta, axis) {
    let nextValue = value;
    const dir = delta === 0 ? 0 : Math.sign(delta);
    if (dir === 0) return nextValue;

    for (let i = 0; i < Math.abs(delta); i++) {
      const candidate = nextValue + dir;

      if (axis === "x") {
        const currentCol = Math.floor(nextValue / this.tileSize);
        const nextCol = Math.floor(candidate / this.tileSize);
        const row = Math.floor(this.y / this.tileSize);
        const wouldCrossWall = nextCol !== currentCol && !this._tileOpen(maze, nextCol, row);
        if (wouldCrossWall) break;
      } else {
        const currentRow = Math.floor(nextValue / this.tileSize);
        const nextRow = Math.floor(candidate / this.tileSize);
        const col = Math.floor(this.x / this.tileSize);
        const wouldCrossWall = nextRow !== currentRow && !this._tileOpen(maze, col, nextRow);
        if (wouldCrossWall) break;
      }

      nextValue = candidate;
    }

    return nextValue;
  }

  update(maze) {
    if (this.dying || this.spawning) {
      if (this.dying) {
        this.deathTimer--;
        if (this.deathTimer <= 0) this.dying = false;
      }
      if (this.spawning) {
        this.spawnTimer--;
        if (this.spawnTimer <= 0) this.spawning = false;
      }
      return;
    }

    const spd = 2;

    if (this.isAligned()) {
      this.gridX = this.x / this.tileSize;
      this.gridY = this.y / this.tileSize;

      if (
        (this.queuedVelX !== 0 || this.queuedVelY !== 0) &&
        this._canGoVel(maze, this.queuedVelX, this.queuedVelY)
      ) {
        this.velX = this.queuedVelX;
        this.velY = this.queuedVelY;
      }

      if (
        (this.velX !== 0 || this.velY !== 0) &&
        !this._canGoVel(maze, this.velX, this.velY)
      ) {
        this.velX = 0;
        this.velY = 0;
        this.queuedVelX = 0;
        this.queuedVelY = 0;
      }
    }

    const previousX = this.x;
    const previousY = this.y;

    if (this.velX !== 0 || this.velY !== 0) {
      const boostedSpd = this.speedBoostTimer > 0 ? 4 : spd;
      const mx = this.velX > 0 ? boostedSpd : this.velX < 0 ? -boostedSpd : 0;
      const my = this.velY > 0 ? boostedSpd : this.velY < 0 ? -boostedSpd : 0;

      const nextX = this._stepToward(maze, this.x, mx, "x");
      const nextY = this._stepToward(maze, this.y, my, "y");

      this.x = nextX;
      this.y = nextY;
    }

    const cellX = Math.floor(this.x / this.tileSize);
    const cellY = Math.floor(this.y / this.tileSize);
    if (!this._tileOpen(maze, cellX, cellY)) {
      this.x = previousX;
      this.y = previousY;
      this.velX = 0;
      this.velY = 0;
      this.queuedVelX = 0;
      this.queuedVelY = 0;
    }

    const W = maze.width * this.tileSize;
    if (this.x < 0) this.x = W - this.tileSize;
    if (this.x >= W) this.x = 0;

    this.gridX = Math.floor(this.x / this.tileSize);
    this.gridY = Math.floor(this.y / this.tileSize);
    this.pixelX = this.x;
    this.pixelY = this.y;

    if (this.velX !== 0 || this.velY !== 0) {
      this.mouth += 0.1 * this.mouthDir;
      if (this.mouth > 0.65 || this.mouth < 0.02) this.mouthDir *= -1;
    }

    if (this.speedBoostTimer > 0) this.speedBoostTimer--;
    if (this.shieldTimer > 0) {
      this.shieldTimer--;
      // Disable shield when timer expires
      if (this.shieldTimer <= 0) this.shield = false;
    }
    if (this.doublePointTimer > 0) this.doublePointTimer--;
  }

  draw(ctx) {
    if (!this.dying && !this.spawning && this._waitingRespawn) return;

    const ts = this.tileSize;
    const cx = this.x + ts / 2;
    const cy = this.y + ts / 2;
    const r = ts / 2 - 1;

    ctx.save();

    // All transforms go through center point
    ctx.translate(cx, cy);

    if (this.spawning) {
      // Grow from 0 to full size
      const progress = 1 - this.spawnTimer / this.spawnFrames;
      ctx.scale(progress, progress);
    }

    if (this.dying) {
      // Spin and shrink
      const progress = 1 - this.deathTimer / this.deathFrames;
      const scale = Math.max(0, 1 - progress);
      const spin = progress * Math.PI * 4; // 2 full rotations
      ctx.rotate(spin);
      ctx.scale(scale, scale);
    }

    // After transforms, draw at origin (0,0) since we translated to cx,cy
    let angle = 0;
    if (this.velX > 0) angle = 0;
    if (this.velX < 0) angle = Math.PI;
    if (this.velY < 0) angle = -Math.PI / 2;
    if (this.velY > 0) angle = Math.PI / 2;

    // Death: mouth closes as animation progresses
    const mouth = this.dying
      ? Math.max(0.02, 0.5 - (1 - this.deathTimer / this.deathFrames) * 0.5)
      : this.velX !== 0 || this.velY !== 0
        ? this.mouth
        : 0.1;

    ctx.fillStyle = this.shield ? "#00ffae" : "#ffe600";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, 0); // center is now at origin
    ctx.arc(0, 0, r, angle + mouth, angle + Math.PI * 2 - mouth);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
