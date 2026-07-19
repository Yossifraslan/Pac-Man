import { MazeManager } from "./maze/MazeManager.js";
import { Renderer } from "./engine/Renderer.js";
import { InputManager } from "./engine/InputManager.js";
import { Player } from "./entities/Player.js";
import { CollisionSystem } from "./systems/CollisionSystem.js";
import { UIManager } from "./ui/UIManager.js";

const mazeManager = new MazeManager();
const renderer = new Renderer(document.getElementById("gameCanvas"), 20);
const input = new InputManager();
const ui = new UIManager();

let maze = null;
let player = null;
let animFrameId = null;
let paused = false;

let score = 0;
let lives = 3;
let level = 1;
let gameActive = false;

const highScore = () => parseInt(localStorage.getItem("pacman_hs") || "0");
const unlocked = () => parseInt(localStorage.getItem("pacman_unlocked") || "1");

function validateMaze(maze) {
  const visited = new Set();
  const start = maze.dots[0];
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
      if (ny >= 0 && ny < maze.height && nx >= 0 && nx < maze.width) {
        const cell = maze.grid[ny][nx];
        if (cell !== 0 && cell !== 2) queue.push({ x: nx, y: ny });
      }
    }
  }
  const reached = maze.dots.filter((d) => visited.has(`${d.x},${d.y}`)).length;
  const total = maze.dots.length;
  console.log(`Maze validation: ${reached}/${total} dots reachable`);
  if (reached < total) console.error("❌ BLOCKED SECTIONS DETECTED");
  else console.log("✅ All paths connected");
}

window.startLevel = (lvl) => {
  level = lvl;
  maze = mazeManager.build(level);
  player = new Player(maze, 20);
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

function newGame(startLevel = 1) {
  score = 0;
  lives = 3;
  window.startLevel(startLevel);
}

input.onPause(() => {
  if (!gameActive) return;
  paused = !paused;
  if (paused) ui.showOverlay("PAUSED", 0);
  else ui.hideOverlay();
});

function update() {
  if (!maze || !player) return;

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
    ui.showOverlay("POWER PELLET!", 800);
    ui.updateHUD(score, level, lives);
    // Ghosts + power-up effect added in Devlog 4
  }

  if (maze.dots.length === 0 && maze.pellets.length === 0) {
    handleLevelComplete();
  }
}

function handleLevelComplete() {
  gameActive = false;
  score += level * 500;
  const next = level + 1;
  if (next > unlocked()) {
    localStorage.setItem("pacman_unlocked", next);
  }
  ui.showOverlay("LEVEL COMPLETE!", 0);
  ui.updateHUD(score, level, lives);
  setTimeout(() => {
    ui.hideOverlay();
    if (next <= 10) window.startLevel(next);
    else handleGameOver();
  }, 2000);
}

function handleDeath() {
  lives--;
  ui.updateHUD(score, level, lives);
  if (lives <= 0) {
    setTimeout(handleGameOver, 1200);
    return;
  }
  gameActive = false;
  ui.showOverlay("💀 -1 LIFE", 0);
  setTimeout(() => {
    player.pixelX = maze.playerStart.x * 20;
    player.pixelY = maze.playerStart.y * 20;
    player.dir = null;
    player.shield = false;
    gameActive = true;
    ui.hideOverlay();
  }, 1400);
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
