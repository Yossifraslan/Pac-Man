export class PowerUpManager {
  constructor() {
    // Random power-ups that trigger on pellet eat
    this.types = [
      { id: "speed", label: "⚡ SPEED BOOST!", color: "#00ff00" },
      { id: "slow", label: "☆ GHOSTS SLOWED!", color: "#9b59b6" },
      { id: "double", label: "2× DOUBLE POINTS!", color: "#ffd700" },
      { id: "freeze", label: "❄ GHOSTS FROZEN!", color: "#00bfff" },
      { id: "shield", label: "🛡️ SHIELD ACTIVE!", color: "#00ffae" },
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
        // Speed boost for player
        player.speedBoostTimer = 360; // 6 seconds at 60fps
        showDelayed("⚡ SPEED BOOST!");
        break;

      case "slow":
        // Ghosts move very slowly (every other frame)
        monsters.forEach((m) => {
          if (!m.eaten) {
            m._slowTimer = 300; // 5 seconds at 60fps
          }
        });
        showDelayed("☆ GHOSTS SLOWED!");
        break;

      case "double":
        // Double points for 10 seconds
        player.doublePointTimer = 600; // 10 seconds at 60fps
        showDelayed("2× DOUBLE POINTS!");
        break;

      case "freeze":
        // Ghosts freeze in place (stay as normal ghosts, not scared)
        monsters.forEach((m) => {
          if (!m.eaten) {
            m._frozenTimer = 180; // 3 seconds at 60fps
          }
        });
        showDelayed("❄ GHOSTS FROZEN!");
        break;

      case "shield":
        // Shield: blocks hits for 15 seconds without affecting ghosts initially
        // When a ghost hits shield, that ghost becomes scared
        const shieldDuration = 900; // 15 seconds at 60fps
        player.shield = true;
        player.shieldTimer = shieldDuration;
        showDelayed("🛡️ SHIELD ACTIVE!");
        break;

      case "extralife":
        // Extra life
        showDelayed("❤️ EXTRA LIFE!");
        return 1; // Return 1 to add a life
    }
    return 0;
  }
}
