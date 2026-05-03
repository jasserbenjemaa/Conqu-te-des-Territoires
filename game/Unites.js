class Unit {
  constructor(type, player, id) {
    this.type = type;
    this.player = player;
    this.id = id;
    this.row = null;
    this.col = null;
    this.atk = 0;
    this.def = 0;
  }
  getValidMoves() {
    return [];
  }
  getRangedAttacks() {
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
  constructor(player, id) {
    super("warrior", player, id);
    this.atk = 5;
    this.def = 4;
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
    this.atk = 4;
    this.def = 3;
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
    this.atk = 3;
    this.def = 6;
  }
  // Move 1 step in cardinal directions
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
  // Ranged: any non-adjacent enemy cell
  getRangedAttacks(board) {
    const adjSet = new Set(this.getValidMoves().map(([r, c]) => `${r},${c}`));
    const attacks = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const key = `${r},${c}`;
        if (key === `${this.row},${this.col}`) continue;
        if (adjSet.has(key)) continue;
        if (board.sq(r, c).hasEnemy(this.player)) attacks.push([r, c]);
      }
    }
    return attacks;
  }
  getName() {
    return "Monk";
  }
  getLabel() {
    return "M";
  }
}
