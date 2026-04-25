class Game {
  constructor() {
    this._init();
  }

  _init() {
    this.board = new Board();
    this.p = [new Player(1), new Player(2)];
    this.state = "START"; // START | PLACE_1 | PLACE_2 | BATTLE_1 | BATTLE_2 | OVER
    this.selectedUnit = null;
    this.validMoves = [];
    this.uidSeq = 0;
    this.chosenType = "warrior";
  }

  reset() {
    this._init();
  }

  player(id) {
    return this.p[id - 1];
  }

  currentPlayerId() {
    if (this.state === "PLACE_1" || this.state === "BATTLE_1") return 1;
    if (this.state === "PLACE_2" || this.state === "BATTLE_2") return 2;
    return null;
  }

  isPlacing() {
    return this.state.startsWith("PLACE");
  }
  isBattling() {
    return this.state.startsWith("BATTLE");
  }

  _mkUnit(type, pid) {
    this.uidSeq++;
    switch (type) {
      case "warrior":
        return new Warrior(pid, this.uidSeq);
      case "lancer":
        return new Lancer(pid, this.uidSeq);
      case "monk":
        return new Monk(pid, this.uidSeq);
    }
  }

  /* ── Placement ── */
  tryPlace(r, c) {
    const pid = this.currentPlayerId();
    const pl = this.player(pid);
    if (!pl.deployRows().includes(r) || !pl.canStillPlace) return false;

    const unit = this._mkUnit(this.chosenType, pid);
    this.board.place(unit, r, c);
    pl.addUnit(unit);
    pl.unitsPlaced++;

    if (pl.unitsPlaced === 5) {
      if (pid === 1) {
        this.state = "PLACE_1";
      } else {
        this.state = "PLACE_2";
      }
    }
    return true; //3lch return true
  }

  /* ── Selection ── */
  selectUnit(unit) {
    if (unit.player !== this.currentPlayerId()) return false;
    this.selectedUnit = unit;
    this.validMoves = unit.getValidMoves();
    return true;
  }

  clearSel() {
    this.selectedUnit = null;
    this.validMoves = [];
  }

  /* ── Move / Attack ── */
  tryMove(r, c) {
    if (!this.selectedUnit) return null;
    const ok = this.validMoves.some(([mr, mc]) => mr === r && mc === c);
    if (!ok) return null;

    const attacker = this.selectedUnit;
    const sq = this.board.sq(r, c);
    this.clearSel();

    if (sq.hasEnemy(attacker.player)) {
      return { kind: "combat", attacker, sq, toR: r, toC: c };
    }
    this.board.move(attacker, r, c);
    this.addLog(
      `${this.player(attacker.player).name}'s ${attacker.getName()} → ${coord(r, c)}`,
    );
    this._nextTurn();
    return { kind: "move" };
  }

  /* ── Combat resolution (called after dice UI) ── */
  applyResults(attacker, sq, toR, toC, results) {
    let allDead = true;
    for (const res of results) {
      if (res.atkWins) {
        sq.removeUnit(res.defender.id);
        this.player(res.defender.player).killUnit(res.defender.id);
      } else {
        allDead = false;
      }
    }
    if (allDead) {
      this.board.move(attacker, toR, toC);
      this.addLog(
        `${this.player(attacker.player).name}'s ${attacker.getName()} captured ${coord(toR, toC)}!`,
      );
    } else {
      this.addLog(`Some defenders held. ${attacker.getName()} is repelled.`);
    }
    if (!this._checkWin()) this._nextTurn();
  }

  _checkWin() {
    for (const pl of this.p) {
      if (pl.unitCount === 0) {
        const winner = this.p.find((p) => p.id !== pl.id);
        this.state = "OVER";
        this.addLog(`🏆 ${winner.name} is victorious!`);
        return true;
      }
    }
    return false;
  }

  _nextTurn() {
    if (this.state === "BATTLE_1") this.state = "BATTLE_2";
    else if (this.state === "BATTLE_2") this.state = "BATTLE_1";
  }
  clearRowColumn(row) {
    const pl = this.p[this.currentPlayerId() - 1];
    pl.unitsPlaced = 0;

    for (let c = 0; c < 8; c++) {
      const sq = this.board.sq(row, c);
      for (const unit of sq.units) {
        pl.killUnit(unit.id);
      }
      this.board.grid[row][c].units = [];
    }
  }
}
