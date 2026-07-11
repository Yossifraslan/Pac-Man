window.addEventListener("DOMContentLoaded", () => {
  const showScreen = (id) => {
    document
      .querySelectorAll(".screen")
      .forEach((s) => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  };

  document.getElementById("hsDisplay").textContent =
    localStorage.getItem("pacman_hs") || "0";

  document.getElementById("startBtn").onclick = () => showScreen("gameScreen");
  document.getElementById("levelsBtn").onclick = () => {
    buildLevelGrid();
    showScreen("levelScreen");
  };
  document.getElementById("levelBackBtn").onclick = () =>
    showScreen("menuScreen");
  document.getElementById("howtoBtn").onclick = () => showScreen("howtoScreen");
  document.getElementById("howtoBackBtn").onclick = () =>
    showScreen("menuScreen");
  document.getElementById("retryBtn").onclick = () => showScreen("gameScreen");
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
      if (!locked) cell.onclick = () => showScreen("gameScreen");
      grid.appendChild(cell);
    }
  }
});
