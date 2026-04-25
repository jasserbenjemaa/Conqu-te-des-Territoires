class Unit {
      constructor(type, player, id) {
        this.type = type;
        this.player = player;
        this.id = id;
        this.row = null;
        this.col = null;
      }
      getValidMoves() { return []; }
      getName() { return 'Unit'; }
      getLabel() { return '?'; }
    }

    class Warrior extends Unit {
      constructor(player, id) { super('warrior', player, id); }
      getValidMoves() {
        const moves = [];
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nr = this.row + dr, nc = this.col + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) moves.push([nr, nc]);
        }
        return moves;
      }
      getName() { return 'Warrior'; }
      getLabel() { return 'W'; }
    }

    class Lancer extends Unit {
      constructor(player, id) { super('lancer', player, id); }
      getValidMoves() {
        const moves = [];
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          for (let step = 1; step <= 2; step++) {
            const nr = this.row + dr * step;
            const nc = this.col + dc * step;
            if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
            moves.push([nr, nc]);
          }
        }
        return moves;
      }
      getName() { return 'Lancer'; }
      getLabel() { return 'L'; }
    }

    class Monk extends Unit {
      constructor(player, id) { super('monk', player, id); }
      getValidMoves() {
        const moves = [];
        for (let r = 0; r < 8; r++)
          for (let c = 0; c < 8; c++)
            if (r !== this.row || c !== this.col) moves.push([r, c]);
        return moves;
      }
      getName() { return 'Monk'; }
      getLabel() { return 'M'; }
    }
