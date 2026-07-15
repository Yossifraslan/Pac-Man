export class Renderer {
  constructor(canvas, tileSize) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.tileSize = tileSize;
  }

  resizeToMaze(maze) {
    this.canvas.width = maze.width * this.tileSize;
    this.canvas.height = maze.height * this.tileSize;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawMaze(maze) {
    const { ctx, tileSize: ts } = this;

    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const cell = maze.grid[y][x];

        if (cell === 0) {
          ctx.fillStyle = "#0d0d35";
          ctx.fillRect(x * ts, y * ts, ts, ts);
          ctx.strokeStyle = "#3333ff";
          ctx.lineWidth = 1;
          ctx.strokeRect(x * ts + 1, y * ts + 1, ts - 2, ts - 2);
        }

        if (cell === 2) {
          // Ghost house interior
          ctx.fillStyle = "#1a0a0a";
          ctx.fillRect(x * ts, y * ts, ts, ts);
          ctx.strokeStyle = "#ff000066";
          ctx.lineWidth = 1;
          ctx.strokeRect(x * ts + 1, y * ts + 1, ts - 2, ts - 2);
        }
      }
    }

    ctx.fillStyle = "#ffffff";
    for (const d of maze.dots) {
      ctx.beginPath();
      ctx.arc(d.x * ts + ts / 2, d.y * ts + ts / 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    const pulse = 3 + Math.sin(Date.now() / 150) * 1.5;
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 10;
    for (const p of maze.pellets) {
      ctx.beginPath();
      ctx.arc(p.x * ts + ts / 2, p.y * ts + ts / 2, pulse, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawProgressBar(maze) {
    const { ctx } = this;
    const ratio = 1 - maze.dots.length / maze.totalDots;
    const y = this.canvas.height - 3;
    ctx.fillStyle = "#1a1a3a";
    ctx.fillRect(0, y, this.canvas.width, 3);
    ctx.fillStyle = "#ffe600";
    ctx.fillRect(0, y, this.canvas.width * ratio, 3);
  }
}
