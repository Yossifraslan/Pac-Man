import { MazeManager } from "./maze/MazeManager.js";
import { Renderer } from "./engine/Renderer.js";
import { InputManager } from "./engine/InputManager.js";
import { Player } from "./entities/Player.js";
import { Monster } from "./entities/Monster.js";
import { CollisionSystem } from "./systems/CollisionSystem.js";
import { PowerUpManager } from "./systems/PowerUpManager.js";
import { UIManager } from "./ui/UIManager.js";
import { AudioManager } from "./audio/AudioManager.js";
import { LEVEL_CONFIG } from "./maze/MazeData.js";

const mazeManager = new MazeManager();
const renderer = new Renderer(document.getElementById("gameCanvas"), 20);
const input = new InputManager();
const ui = new UIManager();
const audio = new AudioManager();
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

// Score popups — floating +200, +10 etc at position on canvas
let scorePopups = [];

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
  open.sort((a, b) => b.dist - a.dist);
  const step = Math.max(1, Math.floor(open.length / count));
  const spawns = Array.from(
    { length: count },
    (_, i) => open[(i * step) % open.length] || open[0],
  );

  return spawns.map(
    (sp, i) =>
      new Monster(m, 20, sp.x, sp.y, behaviors[i % 4], colors[i % 8], 1),
  );
}

function addPopup(text, x, y) {
  scorePopups.push({ text, x, y, life: 50, maxLife: 50 });
}

window.startLevel = (lvl) => {
  audio.stopMenuMusic();
  level = lvl;
  frameCount = 0;
  scorePopups = [];
  maze = mazeManager.build(level);
  player = new Player(maze, 20);
  player.triggerSpawn();
  monsters = spawnMonsters(maze, level);
  validateMaze(maze);
  renderer.resizeToMaze(maze);
  ui.showScreen("gameScreen");
  ui.updateHUD(score, level, lives);
  ui.showOverlay("LEVEL " + level, 1200);
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
  togglePause();
});

function togglePause() {
  paused = !paused;
  const panel = document.getElementById("pausePanel");
  if (paused) {
    panel.classList.add("active");
    audio.pause();
  } else {
    panel.classList.remove("active");
    ui.hideOverlay();
  }
}

function setupPausePanel() {
  const musicBtn = document.getElementById("musicToggleBtn");
  const sfxBtn = document.getElementById("sfxToggleBtn");
  const resumeBtn = document.getElementById("resumeBtn");

  musicBtn.classList.add("active-on");
  sfxBtn.classList.add("active-on");

  musicBtn.onclick = () => {
    const on = !audio.musicEnabled;
    audio.setMusicEnabled(on);
    musicBtn.textContent = on ? "🎵 MUSIC: ON" : "🎵 MUSIC: OFF";
    if (on) musicBtn.classList.add("active-on");
    else musicBtn.classList.remove("active-on");
  };

  sfxBtn.onclick = () => {
    const on = !audio.sfxEnabled;
    audio.setSfxEnabled(on);
    sfxBtn.textContent = on ? "🔊 SFX: ON" : "🔊 SFX: OFF";
    if (on) sfxBtn.classList.add("active-on");
    else sfxBtn.classList.remove("active-on");
  };

  resumeBtn.onclick = () => togglePause();
}

function update() {
  if (!maze || !player) return;
  frameCount++;

  if (input.nextDirection) {
    player.setNextDir(input.nextDirection);
    input.nextDirection = null;
  }

  player.update(maze);

  // Don't process collisions during spawn or death animation
  if (player.dying || player.spawning) return;

  if (CollisionSystem.checkDot(player, maze)) {
    const pts = player.doublePointTimer > 0 ? 20 : 10;
    score += pts;
    audio.eatDot();
    ui.updateHUD(score, level, lives);
  }

  if (CollisionSystem.checkPellet(player, maze)) {
    score += 50;
    audio.eatPellet();
    ui.updateHUD(score, level, lives);
    ui.showOverlay("POWER PELLET!", 800);
    const dur = frightenDuration(level);
    monsters.forEach((m) => m.setFrightened(dur));
    const pu = powerUpMgr.random();
    powerUpMgr.apply(pu.id, player, monsters, ui, audio);
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
        const pts = player.doublePointTimer > 0 ? 400 : 200;
        score += pts;
        audio.eatGhost();
        // Popup at ghost position
        addPopup("+" + pts, m.pixelX + 10, m.pixelY);
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
  audio.death();
  ui.updateHUD(score, level, lives);
  gameActive = false;

  // Trigger death animation
  player.triggerDeath();

  setTimeout(
    () => {
      if (lives <= 0) {
        handleGameOver();
        return;
      }

      const ts = 20;
      player.pixelX = maze.playerStart.x * ts;
      player.pixelY = maze.playerStart.y * ts;
      player.x = player.pixelX;
      player.y = player.pixelY;
      player.velX = 0;
      player.velY = 0;
      player.shield = false;
      player.dying = false;
      player.triggerSpawn();

      monsters.forEach((m) => {
        m.pixelX = m.homeX * ts;
        m.pixelY = m.homeY * ts;
        m.gridX = m.homeX;
        m.gridY = m.homeY;
        m.frightened = false;
        m.eaten = false;
        m.respawnTimer = 0;
        m.dir = "up";
        m._frozenTimer = 0;
        m._slowTimer = 0;
      });

      gameActive = true;
      ui.hideOverlay();
    },
    (player.deathFrames / 60) * 1000 + 800,
  );
}

function handleLevelComplete() {
  gameActive = false;
  score += level * 500;
  lives = 3;
  audio.levelUp();
  renderer.flash("#ffe600", 30);
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

  if (!gameActive && player && (player.dying || player.spawning)) {
    player.update(maze);
  }

  renderer.clear();
  if (maze) renderer.drawMaze(maze);
  renderer.drawFlash();
  monsters.forEach((m) => m.draw(renderer.ctx));
  if (player) player.draw(renderer.ctx);
  if (maze) renderer.drawProgressBar(maze);

  // Draw and tick score popups
  scorePopups = scorePopups.filter((p) => p.life > 0);
  scorePopups.forEach((p) => renderer.drawScorePopup(p));

  // Tick animated score counter
  ui.tickScore();

  animFrameId = requestAnimationFrame(loop);
}

window.addEventListener("DOMContentLoaded", () => {
  setupPausePanel();
  ui.updateHighScore(highScore());

  document.getElementById("startBtn").onclick = () => newGame(unlocked());
  document.getElementById("retryBtn").onclick = () => newGame(1);
  document.getElementById("menuBtn").onclick = () => {
    gameActive = false;
    ui.showScreen("menuScreen");
    audio.startMenuMusic();
  };
  document.getElementById("howtoBtn").onclick = () =>
    ui.showScreen("howtoScreen");
  document.getElementById("howtoBackBtn").onclick = () =>
    ui.showScreen("menuScreen");
  document.getElementById("pauseBtn").onclick = () => {
    togglePause();
    if (!gameActive) return;
    paused = !paused;
    audio.pause();
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
    audio.setEnabled(!audio.enabled);
    e.target.textContent = audio.enabled ? "SOUND: ON" : "SOUND: OFF";
    if (audio.enabled) {
      setTimeout(() => audio.startMenuMusic(), 300);
    }
  };

  document.body.addEventListener(
    "click",
    () => {
      if (audio.ctx && audio.ctx.state === "suspended") {
        audio.ctx.resume().then(() => audio.startMenuMusic());
      } else {
        audio.startMenuMusic();
      }
    },
    { once: true },
  );
});
