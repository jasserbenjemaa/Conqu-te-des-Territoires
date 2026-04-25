class Unit {
  weights = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 };
  defenseFavor = 0;
  attackFavor = 0;

  constructor(type, player, id) {
    this.type = type;
    this.player = player;
    this.id = id;
    this.row = null;
    this.col = null;
  }

  weightedDistanceRoll(dist, move) {
    const favor = move === "defense" ? this.defenseFavor : this.attackFavor;
    const maxDist = 14;
    const bias = 1 - dist / maxDist;
    const weights = [1, 1, 1, 1, 1, 1];
    for (let i = 0; i < 6; i++) {
      const face = i + 1;
      const distEffect =
        bias > 0.5 ? bias * face * 0.5 : (1 - bias) * (7 - face) * 0.5;
      const favorEffect =
        favor > 0 ? favor * face * 0.3 : Math.abs(favor) * (7 - face) * 0.3;
      weights[i] += distEffect + favorEffect;
    }
    const pool = [];
    weights.forEach((w, i) => {
      for (let j = 0; j < Math.round(w * 10); j++) pool.push(i + 1);
    });
    return pool[Math.floor(Math.random() * pool.length)];
  }

  weightedD6(move) {
    const favor = move === "defense" ? this.defenseFavor : this.attackFavor;
    const boosted = {};
    for (const [face, weight] of Object.entries(this.weights)) {
      const f = Number(face);
      const favorEffect =
        favor > 0 ? favor * f * 0.3 : Math.abs(favor) * (7 - f) * 0.3;
      boosted[f] = weight + favorEffect;
    }
    const pool = [];
    for (const [face, weight] of Object.entries(boosted)) {
      for (let i = 0; i < Math.round(weight * 10); i++) pool.push(Number(face));
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  getValidMoves() {
    return [];
  }
  getName() {
    return "Unit";
  }
  getLabel() {
    return "?";
  }
}

class Warrior extends Unit {
  attackFavor = 2; // slight edge on attack
  constructor(player, id) {
    super("warrior", player, id);
  }
  rollAttack() {
    return this.weightedD6("attack");
  }
  rollDefense() {
    return this.weightedD6("defense");
  }
  getValidMoves() {
    const moves = [];
    for (const [dr, dc] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]) {
      const nr = this.row + dr,
        nc = this.col + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) moves.push([nr, nc]);
    }
    return moves;
  }
  getName() {
    return "Warrior";
  }
  getLabel() {
    return "W";
  }
}

class Lancer extends Unit {
  constructor(player, id) {
    super("lancer", player, id);
  }
  rollAttack() {
    return this.weightedD6("attack");
  }
  rollDefense() {
    return this.weightedD6("defense");
  }
  getValidMoves() {
    const moves = [];
    for (const [dr, dc] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]) {
      for (let step = 1; step <= 2; step++) {
        const nr = this.row + dr * step;
        const nc = this.col + dc * step;
        if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
        moves.push([nr, nc]);
      }
    }
    return moves;
  }
  getName() {
    return "Lancer";
  }
  getLabel() {
    return "L";
  }
}

class Monk extends Unit {
  constructor(player, id) {
    super("monk", player, id);
  }
  rollAttack(dist) {
    return this.weightedDistanceRoll(dist, "attack");
  } // penalized by distance
  rollDefense() {
    return this.weightedD6("defense");
  }
  getValidMoves() {
    const moves = [];
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++)
        if (r !== this.row || c !== this.col) moves.push([r, c]);
    return moves;
  }
  getName() {
    return "Monk";
  }
  getLabel() {
    return "M";
  }
}
