/**
UTILITAIRES COMMUNS POUR L'IA — VERSION SOUTENANCE
@module ai/base
*/
import { GRID_SIZE, MAX_UNITS_PER_CELL, UNIT_TYPES } from '../config.js';
import { game } from '../state.js';
import { getCell } from '../core/grid.js';
import { getReachableCells } from '../core/pathfinder.js';

/**
Récupère toutes les cases atteignables pour une unité
✅ Tank : portée infinie sur toute la grille
*/
export function getAllReachableForUnit(unit) {
  if (!unit || !unit.pos || typeof unit.pos.x !== 'number') return [];
  const results = [];

  // 🚜 TANK : peut attaquer N'IMPORTE QUEL ennemi sur la grille
  if (unit.type === 'TANK') {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = getCell(x, y);
        if (cell?.units?.some(uid => game.units.get(uid)?.owner !== unit.owner)) {
          results.push({ x, y, path: [], isAttack: true });
        }
      }
    }
    return results;
  }

  // 🚶 Unités normales : pathfinder classique
  const reachable = getReachableCells(unit.id) ?? [];
  for (const target of reachable) {
    if (target.x < 0 || target.x >= GRID_SIZE || target.y < 0 || target.y >= GRID_SIZE) continue;
    const cell = getCell(target.x, target.y);
    if (!cell || cell.type === 'TRAP') continue;
    const hasOwn = cell.units?.some(uid => game.units.get(uid)?.owner === unit.owner);
    const hasEnemy = cell.units?.some(uid => game.units.get(uid)?.owner !== unit.owner);
    if (hasOwn && !hasEnemy && (cell.units?.length ?? 0) >= MAX_UNITS_PER_CELL) continue;
    results.push({ x: target.x, y: target.y, path: target.path ?? [], isAttack: target.isAttack ?? false });
  }
  return results;
}

export function getAvailableUnits(player) {
  if (!player || !game?.units) return [];
  return [...game.units.values()]
    .filter(u => u?.owner === player && !u?.hasMoved && u?.pos)
    .sort((a, b) => (UNIT_TYPES[b.type]?.val ?? 0) - (UNIT_TYPES[a.type]?.val ?? 0));
}

export function cloneGameState() {
  if (!game?.grid || !game?.units) return null;
  return {
    grid: game.grid.map(row => row?.map(c => c ? {
      owner: c.owner, type: c.type, units: [...(c.units ?? [])]
    } : null) ?? []),
    units: new Map([...game.units.entries()].map(([k, v]) => v ? [k, {
      ...v, pos: v.pos ? { ...v.pos } : null
    }] : [k, null])),
    scores: { ...game.scores }, phase: game.phase, turn: game.turn
  };
}

export function restoreGameState(snapshot) {
  if (!snapshot?.grid) return false;
  try {
    game.grid = snapshot.grid.map(row => row?.map(c => c ? {
      ...c, units: [...c.units]
    } : null) ?? []);
    game.units = new Map([...snapshot.units.entries()].map(([k, v]) => v ? [k, {
      ...v, pos: v.pos ? { ...v.pos } : null
    }] : [k, null]));
    game.scores = { ...snapshot.scores };
    game.phase = snapshot.phase;
    game.turn = snapshot.turn;
    return true;
  } catch (e) { return false; }
}

export function calculateWinProbability(attForce, defForce, defBonus = 0) {
  if (typeof attForce !== 'number' || typeof defForce !== 'number') return 0.5;
  let wins = 0;
  for (let a = 1; a <= 6; a++) {
    for (let d = 1; d <= 6; d++) {
      if ((a + attForce) > (d + defForce + defBonus)) wins++;
    }
  }
  return wins / 36;
}

/**
Hash d'état COMPLET pour table de transposition
✅ Inclut : positions, types, hasMoved, defending
*/
export function hashGameState(state) {
  if (!state?.grid) return 'invalid';
  const boardHash = state.grid
    .map(row => row?.map(c => `${c?.owner ?? ''}${c?.type ?? ''}`).join('|'))
    .join('#');
  const unitHash = [...(state.units?.values?.() ?? [])]
    .map(u => `${u?.id ?? ''}:${u?.pos?.x ?? ''}:${u?.pos?.y ?? ''}:${u?.owner ?? ''}:${u?.hasMoved ? 1 : 0}:${u?.defending ? 1 : 0}`)
    .sort()
    .join(',');
  return `${boardHash}::${unitHash}`;
}