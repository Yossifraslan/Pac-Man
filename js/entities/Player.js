export class Player {
  constructor(maze, tileSize) {
    this.tileSize = tileSize;
    this.gridX = maze.playerStart.x;
    this.gridY = maze.playerStart.y;
    this.pixelX = this.gridX * tileSize;
    this.pixelY = this.gridY * tileSize;

    this.dir = null;
    this.nextDir = null;
    this.speed = 2;

    this.mouthAngle = 0.1;
    this.mouthDelta = 0.12;

    this.shield = false;
    this.speedBoostTimer = 0;
    this.doublePointTimer = 0;
    this.freezeActive = false;
  }

  setNextDir(dir) {
    this.nextDir = dir;
  }

  isAligned() {
    return (
      Math.round(this.pixelX) % this.tileSize === 0 &&
      Math.round(this.pixelY) % this.tileSize === 0
    );
  }

  _canMove(maze, dir) {
    const ts = this.tileSize;
    let tx = Math.round(this.pixelX / ts);
    let ty = Math.round(this.pixelY / ts);
    if (dir === "up") ty--;
    if (dir === "down") ty++;
    if (dir === "left") tx--;
    if (dir === "right") tx++;
    return !maze.isWall(maze, tx, ty);
  }

  update(maze) {
    const ts = this.tileSize;

    if (this.isAligned()) {
      this.gridX = Math.round(this.pixelX / ts);
      this.gridY = Math.round(this.pixelY / ts);

      if (this.nextDir && this._canMove(maze, this.nextDir)) {
        this.dir = this.nextDir;
      }
      if (this.dir && !this._canMove(maze, this.dir)) {
        this.dir = null;
      }
    }

    const speed = this.speedBoostTimer > 0 ? this.speed * 1.6 : this.speed;

    if (this.dir === "up") this.pixelY -= speed;
    if (this.dir === "down") this.pixelY += speed;
    if (this.dir === "left") this.pixelX -= speed;
    if (this.dir === "right") this.pixelX += speed;

    // Tunnel wrap
    const maxX = maze.width * ts;
    if (this.pixelX < -ts) this.pixelX = maxX;
    if (this.pixelX > maxX + ts) this.pixelX = -ts;

    // Mouth animation
    this.mouthAngle += this.mouthDelta;
    if (this.mouthAngle > 0.7 || this.mouthAngle < 0.02) {
      this.mouthDelta *= -1;
    }

    if (this.speedBoostTimer > 0) this.speedBoostTimer--;
    if (this.doublePointTimer > 0) this.doublePointTimer--;
  }

  draw(ctx) {
    const ts = this.tileSize;
    const cx = this.pixelX + ts / 2;
    const cy = this.pixelY + ts / 2;
    const r = ts / 2 - 1;

    let angle = 0;
    if (this.dir === "left") angle = Math.PI;
    if (this.dir === "up") angle = -Math.PI / 2;
    if (this.dir === "down") angle = Math.PI / 2;

    const mouth = this.dir ? this.mouthAngle : 0.1;

    ctx.save();
    ctx.fillStyle = this.shield ? "#00ffae" : "#ffe600";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle + mouth, angle + Math.PI * 2 - mouth);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
