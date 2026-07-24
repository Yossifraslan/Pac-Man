export class Monster {
  constructor(maze, tileSize, gridX, gridY, behavior, color, speed) {
    this.ts = tileSize;
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
    return this.pixelX % this.ts === 0 && this.pixelY % this.ts === 0;
  }

  // Only call this when isAligned() is true — col/row must be integers
  _tileOpen(maze, col, row) {
    if (col < 0 || col >= maze.width) return false;
    if (row < 0 || row >= maze.height) return false;
    const cell = maze.grid[row][col];
    return cell !== 0 && cell !== undefined;
  }

  _canGoDir(maze, dir, col, row) {
    const nc = col + (dir === "right" ? 1 : dir === "left" ? -1 : 0);
    const nr = row + (dir === "down" ? 1 : dir === "up" ? -1 : 0);
    return this._tileOpen(maze, nc, nr);
  }

  _getValidDirs(maze, col, row, excludeReverse) {
    const opp = { up: "down", down: "up", left: "right", right: "left" };
    const all = ["up", "down", "left", "right"];
    return all.filter((d) => {
      if (excludeReverse && d === opp[this.dir]) return false;
      return this._canGoDir(maze, d, col, row);
    });
  }

  _pickDir(maze, col, row, targetX, targetY) {
    const dirs = this._getValidDirs(maze, col, row, true);
    const pool =
      dirs.length > 0 ? dirs : this._getValidDirs(maze, col, row, false);
    if (pool.length === 0) return this.dir;

    const dc = { up: 0, down: 0, left: -1, right: 1 };
    const dr = { up: -1, down: 1, left: 0, right: 0 };

    let best = pool[0],
      bestDist = Infinity;
    for (const d of pool) {
      const dist = (col + dc[d] - targetX) ** 2 + (row + dr[d] - targetY) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        best = d;
      }
    }
    return best;
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
    const ts = this.ts;
    const spd = 2; // integer, divides 20 evenly — NEVER change this

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

    // ── Direction decision — ONLY when exactly on a tile ──────────────
    // At this point pixelX/ts and pixelY/ts are guaranteed integers
    if (this.isAligned()) {
      const col = this.pixelX / ts;
      const row = this.pixelY / ts;
      this.gridX = col;
      this.gridY = row;

      if (this.frightened) {
        const dirs = this._getValidDirs(maze, col, row, true);
        const pool =
          dirs.length > 0 ? dirs : this._getValidDirs(maze, col, row, false);
        if (pool.length > 0) {
          this.dir = pool[Math.floor(Math.random() * pool.length)];
        }
      } else {
        const t = this._getTarget(player, frameCount);
        this.dir = this._pickDir(maze, col, row, t.x, t.y);
      }
    }

    // ── Movement — always move mid-tile, no wall check needed ─────────
    // Wall checks happen only at alignment above, so direction is always valid
    if (this.dir === "up") this.pixelY -= spd;
    if (this.dir === "down") this.pixelY += spd;
    if (this.dir === "left") this.pixelX -= spd;
    if (this.dir === "right") this.pixelX += spd;

    // Hard clamp — never leave map
    this.pixelX = Math.max(0, Math.min(this.pixelX, (maze.width - 1) * ts));
    this.pixelY = Math.max(0, Math.min(this.pixelY, (maze.height - 1) * ts));
  }

  draw(ctx) {
    if (this.eaten) return;
    const ts = this.ts;
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
      for (let i = 0; i <= 4; i++)
        ctx.lineTo(
          cx - r * 0.5 + i * (r / 4),
          cy + r * 0.3 + (i % 2 === 0 ? r * 0.15 : -r * 0.15),
        );
      ctx.stroke();
    }
    ctx.restore();
  }
}
