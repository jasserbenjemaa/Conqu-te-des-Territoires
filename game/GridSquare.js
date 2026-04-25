class GridSquare {
  constructor(row, col) {
    this.row = row;
    this.col = col;
    this.units = [];
  }
  addUnit(unit) {
    this.units.push(unit);
    unit.row = this.row;
    unit.col = this.col;
  }
  removeUnit(id) {
    this.units = this.units.filter((u) => u.id !== id);
  }
  unitsOf(player) {
    return this.units.filter((u) => u.player === player);
  }
  enemiesOf(player) {
    return this.units.filter((u) => u.player !== player);
  }
  hasEnemy(player) {
    return this.units.some((u) => u.player !== player);
  }
}
