export class PowerUpManager {
  constructor() {
    // Only these 4 trigger on pellet eat — shield/life are too powerful for random
    this.types = [
      { id: "speed", label: "⚡ SPEED BOOST!", color: "#00ff00" },
      { id: "slow", label: "☆ GHOSTS SLOWED!", color: "#9b59b6" },
      { id: "double", label: "2× DOUBLE POINTS!", color: "#ffd700" },
      { id: "freeze", label: "❄ GHOSTS FROZEN!", color: "#00bfff" },
    ];
  }

  random() {
    return this.types[Math.floor(Math.random() * this.types.length)];
  }

  apply(id, player, monsters, ui) {
    const showDelayed = (text) => {
      setTimeout(() => ui.showOverlay(text, 1200), 900);
    };

    switch (id) {
      case "speed":
        player.speedBoostTimer = 360;
        showDelayed("⚡ SPEED BOOST!");
        break;

      case "slow":
        monsters.forEach((m) => (m.speed = Math.max(m.speed * 0.5, 0.5)));
        showDelayed("☆ GHOSTS SLOWED!");
        setTimeout(
          () => monsters.forEach((m) => (m.speed = Math.min(m.speed * 2, 4))),
          5000,
        );
        break;

      case "double":
        player.doublePointTimer = 600;
        showDelayed("2× DOUBLE POINTS!");
        break;

      case "freeze":
        monsters.forEach((m) => {
          m._savedSpeed = m.speed;
          m.speed = 0;
        });
        showDelayed("❄ GHOSTS FROZEN!");
        setTimeout(() => {
          monsters.forEach((m) => {
            if (m._savedSpeed !== undefined) {
              m.speed = m._savedSpeed;
              m._savedSpeed = undefined;
            }
          });
        }, 3000);
        break;
    }
    return 0;
  }
}
