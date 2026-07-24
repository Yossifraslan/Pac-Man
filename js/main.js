import { MazeManager } from "./maze/MazeManager.js";
import { Renderer } from "./engine/Renderer.js";
import { InputManager } from "./engine/InputManager.js";
import { Player } from "./entities/Player.js";
import { Monster } from "./entities/Monster.js";
import { CollisionSystem } from "./systems/CollisionSystem.js";
import { PowerUpManager } from "./systems/PowerUpManager.js";
import { UIManager } from "./ui/UIManager.js";
import { LEVEL_CONFIG } from "./maze/MazeData.js";

const mazeManager = new MazeManager();
const renderer = new Renderer(document.getElementById("gameCanvas"), 20);
const input = new InputManager();
const ui = new UIManager();
const powerUpMgr = new PowerUpManager();

let maze = null;
let player = null;
let monsters = [];
let animFrameId = null;
let paused = false;
let frameCount = 0;

let score = 0;
let lives = 3;
let level = 1;
let gameActive = false;

const frightenDuration = (lvl) => Math.max(480 - lvl * 30, 180);
const highScore = () => parseInt(localStorage.getItem("pacman_hs") || "0");
const unlocked = () => parseInt(localStorage.getItem("pacman_unlocked") || "1");

function validateMaze(m) {
  const visited = new Set();
  const start = m.dots[0];
  if (!start) return;
  const queue = [{ x: start.x, y: start.y }];
  while (queue.length) {
    const { x, y } = queue.shift();
    const key = `${x},${y}`;
    if (visited.has(key)) continue;
    visited.add(key);
    for (const [dx, dy] of [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ]) {
      const nx = x + dx,
        ny = y + dy;
      if (ny >= 0 && ny < m.height && nx >= 0 && nx < m.width) {
        const cell = m.grid[ny][nx];
        if (cell !== 0 && cell !== 2) queue.push({ x: nx, y: ny });
      }
    }
  }
  const reached = m.dots.filter((d) => visited.has(`${d.x},${d.y}`)).length;
  console.log(
    `Maze ${level}: ${reached}/${m.dots.length} ${reached === m.dots.length ? "✅" : "❌"}`,
  );
}

function spawnMonsters(m, lvl) {
  const cfg = LEVEL_CONFIG[lvl - 1] || LEVEL_CONFIG[LEVEL_CONFIG.length - 1];
  const count = cfg.ghosts;
  const speed = 2; // fixed at 2px/frame — divides tileSize 20 evenly, scales via cfg later
  const behaviors = ["chaser", "ambusher", "predictive", "patroller"];
  const colors = [
    "#ff4d4d",
    "#ff8fd6",
    "#00e5ff",
    "#ffa500",
    "#7fff00",
    "#ff66ff",
    "#ffff00",
    "#ff6600",
  ];

  // Only spawn on open path tiles (1 or 3), never walls (0) or ghost house (2)
  // Pick tiles that are far from the player start
  const open = [];
  for (let y = 0; y < m.height; y++) {
    for (let x = 0; x < m.width; x++) {
      const cell = m.grid[y][x];
      if (cell === 1 || cell === 3) {
        const dist =
          Math.abs(x - m.playerStart.x) + Math.abs(y - m.playerStart.y);
        if (dist > 6) open.push({ x, y, dist });
      }
    }
  }

  // Sort by distance descending — ghosts start as far as possible from player
  open.sort((a, b) => b.dist - a.dist);

  // Spread ghosts across far corners — take evenly spaced entries
  const step = Math.max(1, Math.floor(open.length / count));
  const spawns = Array.from(
    { length: count },
    (_, i) => open[i * step] || open[0],
  );

  return spawns.map(
    (sp, i) =>
      new Monster(m, 20, sp.x, sp.y, behaviors[i % 4], colors[i % 8], speed),
  );
}

window.startLevel = (lvl) => {
  level = lvl;
  frameCount = 0;
  maze = mazeManager.build(level);
  player = new Player(maze, 20);
  monsters = spawnMonsters(maze, level);
  validateMaze(maze);
  renderer.resizeToMaze(maze);
  ui.showScreen("gameScreen");
  ui.updateHUD(score, level, lives);
  ui.showOverlay("LEVEL " + level, 1000);
  gameActive = true;
  paused = false;
  if (animFrameId) cancelAnimationFrame(animFrameId);
  loop();
};

function newGame(startLvl = 1) {
  score = 0;
  lives = 3;
  window.startLevel(startLvl);
}

input.onPause(() => {
  if (!gameActive) return;
  paused = !paused;
  if (paused) ui.showOverlay("PAUSED", 0);
  else ui.hideOverlay();
});

function update() {
  if (!maze || !player) return;
  frameCount++;

  if (input.nextDirection) {
    player.setNextDir(input.nextDirection);
    input.nextDirection = null;
  }

  player.update(maze);

  if (CollisionSystem.checkDot(player, maze)) {
    score += player.doublePointTimer > 0 ? 20 : 10;
    ui.updateHUD(score, level, lives);
  }

  if (CollisionSystem.checkPellet(player, maze)) {
    score += 50;
    ui.updateHUD(score, level, lives);
    ui.showOverlay("POWER PELLET!", 800);
    const dur = frightenDuration(level);
    monsters.forEach((m) => m.setFrightened(dur));
    const pu = powerUpMgr.random();
    const lifeGain = powerUpMgr.apply(pu.id, player, monsters, ui);
    if (lifeGain) {
      lives++;
      ui.updateHUD(score, level, lives);
    }
  }

  for (const m of monsters) {
    m.update(maze, player, frameCount);
    if (m.eaten) continue;

    const dx = player.pixelX - m.pixelX;
    const dy = player.pixelY - m.pixelY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 20 * 0.65) {
      if (m.frightened) {
        m.eaten = true;
        m.respawnTimer = 180;
        score += player.doublePointTimer > 0 ? 400 : 200;
        ui.showOverlay("+200!", 600);
        ui.updateHUD(score, level, lives);
      } else if (player.shield) {
        player.shield = false;
        ui.showOverlay("SHIELD BLOCKED!", 800);
      } else {
        handleDeath();
        return;
      }
    }
  }

  if (maze.dots.length === 0 && maze.pellets.length === 0) {
    handleLevelComplete();
  }
}

function handleDeath() {
  lives--;
  ui.updateHUD(score, level, lives);
  gameActive = false;

  if (lives <= 0) {
    ui.showOverlay("GAME OVER", 0);
    setTimeout(handleGameOver, 1400);
    return;
  }

  ui.showOverlay("💀 -1 LIFE", 0);
  setTimeout(() => {
    const ts = 20;
    player.pixelX = maze.playerStart.x * ts;
    player.pixelY = maze.playerStart.y * ts;
    player.gridX = maze.playerStart.x;
    player.gridY = maze.playerStart.y;
    player.dir = null;
    player.shield = false;
    monsters.forEach((m) => {
      m.pixelX = m.homeX * ts;
      m.pixelY = m.homeY * ts;
      m.gridX = m.homeX;
      m.gridY = m.homeY;
      m.frightened = false;
      m.eaten = false;
      m.respawnTimer = 0;
      m.dir = "up";
    });
    gameActive = true;
    ui.hideOverlay();
  }, 1400);
}

function handleLevelComplete() {
  gameActive = false;
  score += level * 500;
  const next = level + 1;
  if (next > unlocked()) localStorage.setItem("pacman_unlocked", next);
  ui.showOverlay("🎉 LEVEL COMPLETE!", 0);
  ui.updateHUD(score, level, lives);
  setTimeout(() => {
    ui.hideOverlay();
    if (next <= 10) window.startLevel(next);
    else handleGameOver();
  }, 2000);
}

function handleGameOver() {
  gameActive = false;
  const hs = highScore();
  const isNew = score > hs;
  if (isNew) {
    localStorage.setItem("pacman_hs", score);
    ui.updateHighScore(score);
  }
  ui.showGameOver(score, isNew);
}

function loop() {
  if (!paused && gameActive) update();
  renderer.clear();
  if (maze) renderer.drawMaze(maze);
  monsters.forEach((m) => m.draw(renderer.ctx));
  if (player) player.draw(renderer.ctx);
  if (maze) renderer.drawProgressBar(maze);
  animFrameId = requestAnimationFrame(loop);
}

window.addEventListener("DOMContentLoaded", () => {
  ui.updateHighScore(highScore());
  document.getElementById("startBtn").onclick = () => newGame(1);
  document.getElementById("retryBtn").onclick = () => newGame(1);
  document.getElementById("menuBtn").onclick = () => {
    gameActive = false;
    ui.showScreen("menuScreen");
  };
  document.getElementById("howtoBtn").onclick = () =>
    ui.showScreen("howtoScreen");
  document.getElementById("howtoBackBtn").onclick = () =>
    ui.showScreen("menuScreen");
  document.getElementById("pauseBtn").onclick = () => {
    if (!gameActive) return;
    paused = !paused;
    if (paused) ui.showOverlay("PAUSED", 0);
    else ui.hideOverlay();
  };
  document.getElementById("levelsBtn").onclick = () => {
    ui.buildLevelGrid(unlocked(), (lvl) => newGame(lvl));
    ui.showScreen("levelScreen");
  };
  document.getElementById("levelBackBtn").onclick = () =>
    ui.showScreen("menuScreen");
  document.getElementById("soundToggleBtn").onclick = (e) => {
    const on = e.target.textContent.includes("ON");
    e.target.textContent = on ? "SOUND: OFF" : "SOUND: ON";
  };
});
