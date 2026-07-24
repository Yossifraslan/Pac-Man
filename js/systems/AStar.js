export class AStar {
  static nextDirection(maze, startX, startY, goalX, goalY, currentDir) {
    if (startX === goalX && startY === goalY) return currentDir;

    goalX = Math.max(0, Math.min(maze.width - 1, goalX));
    goalY = Math.max(0, Math.min(maze.height - 1, goalY));

    if (maze.isWall(maze, goalX, goalY)) {
      const nearest = AStar._nearestOpen(maze, goalX, goalY);
      if (!nearest) return currentDir;
      goalX = nearest.x;
      goalY = nearest.y;
    }

    const opposite = { up: "down", down: "up", left: "right", right: "left" };
    const key = (x, y) => `${x},${y}`;
    const h = (x, y) => Math.abs(x - goalX) + Math.abs(y - goalY);

    const openSet = [
      {
        x: startX,
        y: startY,
        g: 0,
        f: h(startX, startY),
        parent: null,
        dir: null,
      },
    ];

    const gScore = { [key(startX, startY)]: 0 };
    const visited = new Set();

    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();
      const ck = key(current.x, current.y);

      if (visited.has(ck)) continue;
      visited.add(ck);

      if (ck === key(goalX, goalY)) {
        let node = current;
        while (node.parent && node.parent.parent) node = node.parent;
        return node.dir || currentDir;
      }

      const neighbours = [
        { x: current.x, y: current.y - 1, dir: "up" },
        { x: current.x, y: current.y + 1, dir: "down" },
        { x: current.x - 1, y: current.y, dir: "left" },
        { x: current.x + 1, y: current.y, dir: "right" },
      ];

      for (const nb of neighbours) {
        const nk = key(nb.x, nb.y);
        if (maze.isWall(maze, nb.x, nb.y)) continue;
        if (visited.has(nk)) continue;
        if (!current.parent && nb.dir === opposite[currentDir]) continue;

        const tentativeG = (gScore[ck] ?? Infinity) + 1;
        if (tentativeG < (gScore[nk] ?? Infinity)) {
          gScore[nk] = tentativeG;
          openSet.push({
            x: nb.x,
            y: nb.y,
            g: tentativeG,
            f: tentativeG + h(nb.x, nb.y),
            parent: current,
            dir: current.parent ? current.dir : nb.dir,
          });
        }
      }
    }

    return currentDir;
  }

  static _nearestOpen(maze, gx, gy) {
    const visited = new Set();
    const queue = [{ x: gx, y: gy }];
    while (queue.length) {
      const { x, y } = queue.shift();
      const k = `${x},${y}`;
      if (visited.has(k)) continue;
      visited.add(k);
      if (
        x >= 0 &&
        x < maze.width &&
        y >= 0 &&
        y < maze.height &&
        !maze.isWall(maze, x, y)
      ) {
        return { x, y };
      }
      queue.push(
        { x: x + 1, y },
        { x: x - 1, y },
        { x, y: y + 1 },
        { x, y: y - 1 },
      );
    }
    return null;
  }
}
