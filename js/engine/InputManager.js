export class InputManager {
  constructor() {
    this.direction = null;
    this.nextDirection = null;
    this._onPause = null;

    window.addEventListener("keydown", (e) => {
      const map = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
        W: "up",
        S: "down",
        A: "left",
        D: "right",
      };
      if (map[e.key]) {
        this.nextDirection = map[e.key];
        e.preventDefault();
      }
      if (e.key === "p" || e.key === "P") {
        if (this._onPause) this._onPause();
      }
    });

    document.querySelectorAll("#touchControls button").forEach((btn) => {
      btn.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          this.nextDirection = btn.dataset.dir;
        },
        { passive: false },
      );
      btn.addEventListener("click", () => {
        this.nextDirection = btn.dataset.dir;
      });
    });
  }

  onPause(fn) {
    this._onPause = fn;
  }
}
