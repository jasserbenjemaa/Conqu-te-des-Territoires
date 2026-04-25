class Player {
  constructor(id) {
    this.id = id;
    this.name = `Player ${id}`;
    this.units = [];
    this.unitsPlaced = 0;
  }
  deployRows() {
    return this.id === 1 ? [6, 7] : [0, 1];
  }
  addUnit(unit) {
    this.units.push(unit);
  }
  killUnit(id) {
    this.units = this.units.filter((u) => u.id !== id);
  }
  get unitCount() {
    return this.units.length;
  }
  get canStillPlace() {
    return this.unitsPlaced < 5;
  }
}
