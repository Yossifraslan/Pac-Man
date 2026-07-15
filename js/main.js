import { MazeManager } from "./maze/MazeManager.js";
import { Renderer } from "./engine/Renderer.js";

const mazeManager = new MazeManager();
const canvas = document.getElementById("gameCanvas");
const renderer = new Renderer(canvas, 20);

let maze = null;
let animFrameId = null;

const showScreen = (id) => {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
};

function validateMaze(maze) {
  const visited = new Set();
  const start = maze.dots[0];
  if (!start) return console.warn("No dots found");

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
      const nx = x + dx;
      const ny = y + dy;
      if (ny >= 0 && ny < maze.height && nx >= 0 && nx < maze.width) {
        const cell = maze.grid[ny][nx];
        if (cell !== 0 && cell !== 2) {
          queue.push({ x: nx, y: ny });
        }
      }
    }
  }

  const reached = maze.dots.filter((d) => visited.has(`${d.x},${d.y}`)).length;
  const total = maze.dots.length;

  console.log(`Maze validation: ${reached}/${total} dots reachable`);
  if (reached < total) {
    console.error("❌ BLOCKED SECTIONS DETECTED — some dots are unreachable");
  } else {
    console.log("✅ All paths connected");
  }
}

const startLevel = (level) => {
  maze = mazeManager.build(level);
  validateMaze(maze);
  renderer.resizeToMaze(maze);
  showScreen("gameScreen");
  if (animFrameId) cancelAnimationFrame(animFrameId);
  loop();
};

const loop = () => {
  renderer.clear();
  renderer.drawMaze(maze);
  renderer.drawProgressBar(maze);
  animFrameId = requestAnimationFrame(loop);
};

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("hsDisplay").textContent =
    localStorage.getItem("pacman_hs") || "0";

  document.getElementById("startBtn").onclick = () => startLevel(1);
  document.getElementById("levelsBtn").onclick = () => {
    buildLevelGrid();
    showScreen("levelScreen");
  };
  document.getElementById("levelBackBtn").onclick = () =>
    showScreen("menuScreen");
  document.getElementById("howtoBtn").onclick = () => showScreen("howtoScreen");
  document.getElementById("howtoBackBtn").onclick = () =>
    showScreen("menuScreen");
  document.getElementById("retryBtn").onclick = () => startLevel(1);
  document.getElementById("menuBtn").onclick = () => showScreen("menuScreen");
  document.getElementById("pauseBtn").onclick = () => {};

  document.getElementById("soundToggleBtn").onclick = (e) => {
    const on = e.target.textContent.includes("ON");
    e.target.textContent = on ? "SOUND: OFF" : "SOUND: ON";
  };

  function buildLevelGrid() {
    const grid = document.getElementById("levelGrid");
    const unlocked = parseInt(localStorage.getItem("pacman_unlocked") || "1");
    grid.innerHTML = "";
    for (let i = 1; i <= 10; i++) {
      const cell = document.createElement("div");
      const locked = i > unlocked;
      cell.className = "level-cell" + (locked ? " locked" : "");
      cell.textContent = locked ? "🔒" : i;
      if (!locked) cell.onclick = () => startLevel(i);
      grid.appendChild(cell);
    }
  }
});
