export class UIManager {
  constructor() {
    this.scoreEl = document.getElementById("scoreDisplay");
    this.levelEl = document.getElementById("levelDisplay");
    this.livesEl = document.getElementById("livesDisplay");
    this.overlayEl = document.getElementById("overlayMsg");
    this.hsEl = document.getElementById("hsDisplay");

    this._overlayTimeout = null;

    // Animated score counter
    this._displayedScore = 0;
    this._targetScore = 0;
  }

  showScreen(id) {
    document
      .querySelectorAll(".screen")
      .forEach((s) => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  }

  updateHUD(score, level, lives) {
    this._targetScore = score;
    this.levelEl.textContent = level;

    const pac = (alive) => `
      <svg class="life-icon" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="9" fill="${alive ? "#ffe600" : "#2a2a2a"}"/>
        <polygon points="10,10 19,6 19,14" fill="${alive ? "#000" : "#1a1a1a"}"/>
      </svg>`;

    const totalLives = Math.max(0, lives);
    this.livesEl.innerHTML = Array.from({ length: totalLives }, (_, i) =>
      pac(i < lives),
    ).join("");
  }

  // Call every frame to tick score up smoothly
  tickScore() {
    if (this._displayedScore < this._targetScore) {
      const diff = this._targetScore - this._displayedScore;
      this._displayedScore += Math.max(1, Math.floor(diff / 6));
      if (this._displayedScore > this._targetScore) {
        this._displayedScore = this._targetScore;
      }
      this.scoreEl.textContent = this._displayedScore;
    }
  }

  showOverlay(text, duration = 1200) {
    this.overlayEl.textContent = text;
    this.overlayEl.style.display = "block";
    clearTimeout(this._overlayTimeout);
    if (duration > 0) {
      this._overlayTimeout = setTimeout(
        () => (this.overlayEl.style.display = "none"),
        duration,
      );
    }
  }

  hideOverlay() {
    clearTimeout(this._overlayTimeout);
    this.overlayEl.style.display = "none";
  }

  updateHighScore(hs) {
    if (this.hsEl) this.hsEl.textContent = hs;
  }

  showGameOver(score, isNew) {
    document.getElementById("finalScore").textContent = score;
    document.getElementById("newHsMsg").style.display = isNew
      ? "block"
      : "none";
    this.showScreen("gameOverScreen");
  }

  buildLevelGrid(unlocked, onSelect) {
    const grid = document.getElementById("levelGrid");
    grid.innerHTML = "";
    for (let i = 1; i <= 10; i++) {
      const cell = document.createElement("div");
      const locked = i > unlocked;
      cell.className = "level-cell" + (locked ? " locked" : "");
      cell.textContent = locked ? "🔒" : i;
      if (!locked) cell.onclick = () => onSelect(i);
      grid.appendChild(cell);
    }
  }
}
