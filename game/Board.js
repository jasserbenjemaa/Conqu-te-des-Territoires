class Board {
  constructor() {
    this.grid = Array.from({ length: 8 }, (_, r) =>
      Array.from({ length: 8 }, (_, c) => new GridSquare(r, c))
    );
  }
  sq(r, c) {
    return this.grid[r][c];
  }
  place(unit, r, c) {
    this.grid[r][c].addUnit(unit);
  }
  move(unit, toR, toC) {
    this.grid[unit.row][unit.col].removeUnit(unit.id);
    this.grid[toR][toC].addUnit(unit);
  }
}
