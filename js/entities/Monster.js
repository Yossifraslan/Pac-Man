export class Monster {
  constructor(maze, tileSize, gridX, gridY, behavior, color, speed) {
    this.tileSize = tileSize;
    this.pixelX = gridX * tileSize;
    this.pixelY = gridY * tileSize;
    this.gridX = gridX;
    this.gridY = gridY;
    this.homeX = gridX;
    this.homeY = gridY;

    this.behavior = behavior;
    this.color = color;
    this.dir = "up";

    this.frightened = false;
    this.frightenedTimer = 0;
    this.eaten = false;
    this.respawnTimer = 0;
    this._patrolTarget = null;
  }

  isAligned() {
    return (
      this.pixelX % this.tileSize === 0 && this.pixelY % this.tileSize === 0
    );
  }

  // Only call with integer col/row (guaranteed when isAligned() is true)
  _open(maze, col, row) {
    if (col < 0 || col >= maze.width) return false;
    if (row < 0 || row >= maze.height) return false;
    const cell = maze.grid[row][col];
    return cell !== undefined && cell !== 0;
  }

  // BFS — finds actual shortest path to target, eliminates circling
  _bfsDir(maze, fromCol, fromRow, toCol, toRow) {
    const key = (c, r) => c * 1000 + r;
    const start = key(fromCol, fromRow);
    const goal = key(toCol, toRow);

    if (start === goal) return this.dir;

    const queue = [{ col: fromCol, row: fromRow, firstDir: null }];
    const visited = new Set([start]);

    while (queue.length) {
      const { col, row, firstDir } = queue.shift();

      for (const d of ["up", "down", "left", "right"]) {
        const nc = col + (d === "right" ? 1 : d === "left" ? -1 : 0);
        const nr = row + (d === "down" ? 1 : d === "up" ? -1 : 0);
        const k = key(nc, nr);

        if (visited.has(k)) continue;
        if (!this._open(maze, nc, nr)) continue;

        const fd = firstDir || d;
        if (k === goal) return fd;

        visited.add(k);
        queue.push({ col: nc, row: nr, firstDir: fd });
      }
    }

    // No path found — pick any valid direction that isn't reverse
    const opp = { up: "down", down: "up", left: "right", right: "left" };
    const dirs = ["up", "down", "left", "right"].filter((d) => {
      if (d === opp[this.dir]) return false;
      return this._open(
        maze,
        fromCol + (d === "right" ? 1 : d === "left" ? -1 : 0),
        fromRow + (d === "down" ? 1 : d === "up" ? -1 : 0),
      );
    });
    return dirs.length > 0 ? dirs[0] : this.dir;
  }

  _randomDir(maze, col, row) {
    const opp = { up: "down", down: "up", left: "right", right: "left" };
    const dirs = ["up", "down", "left", "right"].filter((d) => {
      if (d === opp[this.dir]) return false;
      const nc = col + (d === "right" ? 1 : d === "left" ? -1 : 0);
      const nr = row + (d === "down" ? 1 : d === "up" ? -1 : 0);
      return this._open(maze, nc, nr);
    });
    if (dirs.length === 0) {
      // dead end — reverse
      const rev = opp[this.dir];
      const nc = col + (rev === "right" ? 1 : rev === "left" ? -1 : 0);
      const nr = row + (rev === "down" ? 1 : rev === "up" ? -1 : 0);
      if (this._open(maze, nc, nr)) return rev;
    }
    return dirs.length > 0
      ? dirs[Math.floor(Math.random() * dirs.length)]
      : this.dir;
  }

  _getTarget(player, frameCount) {
    const dv = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const [pdx, pdy] = dv[player.dir] || [0, 0];
    switch (this.behavior) {
      case "chaser":
        return { x: player.gridX, y: player.gridY };
      case "ambusher":
        return { x: player.gridX + pdx * 4, y: player.gridY + pdy * 4 };
      case "predictive":
        return Math.floor(frameCount / 60) % 2 === 0
          ? { x: player.gridX, y: player.gridY }
          : { x: player.gridX + pdx * 2, y: player.gridY + pdy * 2 };
      default: // patroller
        if (!this._patrolTarget || frameCount % 180 === 0) {
          this._patrolTarget = {
            x: 1 + Math.floor(Math.random() * 10),
            y: 1 + Math.floor(Math.random() * 10),
          };
        }
        return this._patrolTarget;
    }
  }

  setFrightened(frames) {
    if (this.eaten) return;
    this.frightened = true;
    this.frightenedTimer = frames;
  }

  update(maze, player, frameCount) {
    const ts = this.tileSize;
    const spd = 1; // MUST be integer that divides tileSize (20) — never change

    // Respawn countdown
    if (this.eaten) {
      this.respawnTimer--;
      if (this.respawnTimer <= 0) {
        this.eaten = false;
        this.frightened = false;
        this.pixelX = this.homeX * ts;
        this.pixelY = this.homeY * ts;
        this.gridX = this.homeX;
        this.gridY = this.homeY;
        this.dir = "up";
      }
      return;
    }

    if (this.frightenedTimer > 0) {
      this.frightenedTimer--;
      if (this.frightenedTimer <= 0) this.frightened = false;
    }

    // Direction decisions ONLY when exactly on a tile
    if (this.isAligned()) {
      const col = this.pixelX / ts; // guaranteed integer when aligned
      const row = this.pixelY / ts;
      this.gridX = col;
      this.gridY = row;

      if (this.frightened) {
        this.dir = this._randomDir(maze, col, row);
      } else {
        const t = this._getTarget(player, frameCount);
        this.dir = this._bfsDir(maze, col, row, t.x, t.y);
      }
    }

    // Move — no wall check needed here because direction was validated above
    if (this.dir === "up") this.pixelY -= spd;
    if (this.dir === "down") this.pixelY += spd;
    if (this.dir === "left") this.pixelX -= spd;
    if (this.dir === "right") this.pixelX += spd;

    // Hard clamp — never leave the map
    this.pixelX = Math.max(0, Math.min(this.pixelX, (maze.width - 1) * ts));
    this.pixelY = Math.max(0, Math.min(this.pixelY, (maze.height - 1) * ts));
  }

  draw(ctx) {
    if (this.eaten) return;

    const ts = this.tileSize;
    const cx = this.pixelX + ts / 2;
    const cy = this.pixelY + ts / 2;
    const r = ts / 2 - 1;

    let color = this.color;
    if (this.frightened) {
      const flash =
        this.frightenedTimer < 120 &&
        Math.floor(this.frightenedTimer / 12) % 2 === 0;
      color = flash ? "#ffffff" : "#2222cc";
    }

    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;

    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.1, r, Math.PI, 0);
    ctx.lineTo(cx + r, cy + r * 0.8);
    for (let i = 0; i < 3; i++) {
      ctx.lineTo(
        cx + r - (i + 0.5) * ((2 * r) / 3),
        cy + (i % 2 === 0 ? r * 0.4 : r * 0.8),
      );
      ctx.lineTo(cx + r - (i + 1) * ((2 * r) / 3), cy + r * 0.8);
    }
    ctx.lineTo(cx - r, cy + r * 0.8);
    ctx.closePath();
    ctx.fill();

    if (!this.frightened) {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(cx - r * 0.38, cy - r * 0.15, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + r * 0.38, cy - r * 0.15, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#00008b";
      ctx.beginPath();
      ctx.arc(cx - r * 0.38, cy - r * 0.15, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + r * 0.38, cy - r * 0.15, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(cx - r * 0.35, cy - r * 0.1, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + r * 0.35, cy - r * 0.1, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.5, cy + r * 0.3);
      for (let i = 0; i <= 4; i++) {
        ctx.lineTo(
          cx - r * 0.5 + i * (r / 4),
          cy + r * 0.3 + (i % 2 === 0 ? r * 0.15 : -r * 0.15),
        );
      }
      ctx.stroke();
    }
    ctx.restore();
  }
}
