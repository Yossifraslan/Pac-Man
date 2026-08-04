export class InputManager {
  constructor() {
    this.nextDirection = null;
    this._onPause = null;

    // Keyboard
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

    // Touch D-pad — handle both touchstart and click for compatibility
    document.querySelectorAll("#touchControls button").forEach((btn) => {
      // Touchstart for instant response (no 300ms delay)
      btn.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          this.nextDirection = btn.dataset.dir;
          btn.classList.add("pressed");
        },
        { passive: false },
      );

      btn.addEventListener(
        "touchend",
        (e) => {
          e.preventDefault();
          btn.classList.remove("pressed");
        },
        { passive: false },
      );

      // Fallback for mouse clicks on desktop
      btn.addEventListener("click", () => {
        this.nextDirection = btn.dataset.dir;
      });
    });

    // Swipe detection for mobile (alternative to D-pad)
    let touchStartX = 0;
    let touchStartY = 0;

    window.addEventListener(
      "touchstart",
      (e) => {
        // Only track swipes outside the D-pad
        if (e.target.closest("#touchControls")) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      },
      { passive: true },
    );

    window.addEventListener(
      "touchend",
      (e) => {
        if (e.target.closest("#touchControls")) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        // Minimum swipe distance of 30px
        if (Math.max(absDx, absDy) < 30) return;

        if (absDx > absDy) {
          this.nextDirection = dx > 0 ? "right" : "left";
        } else {
          this.nextDirection = dy > 0 ? "down" : "up";
        }
      },
      { passive: true },
    );
  }

  onPause(fn) {
    this._onPause = fn;
  }
}
