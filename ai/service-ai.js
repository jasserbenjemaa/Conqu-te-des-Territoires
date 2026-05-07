/**
IA PROFESSIONNELLE — EXPECTIMINIMAX + OPTIMISATIONS
Version finale pour soutenance — Bug-free, production-ready
@module ai/pro
*/
import { PLAYER, UNIT_TYPES, GRID_SIZE } from '../config.js';
import { game } from '../state.js';
import { getCell } from '../core/grid.js';
import {
  getAllReachableForUnit,
  calculateWinProbability,
  cloneGameState,
  restoreGameState,
  hashGameState
} from './base.js';

// ═══════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════
const CONFIG = {
  MAX_DEPTH: 3,
  TIME_LIMIT_MS: 180,
  SAFETY_MARGIN_MS: 25,
  BRANCH_LIMIT_BASE: 12,
  ATTACK_PROB_THRESHOLD: 0.60,   // Règle métier stricte
  KILLER_MOVES_DEPTH: 4,
  HISTORY_SIZE: 1000,
  TT_MAX_SIZE: 5000,
  EVAL_CACHE_MAX: 5000,
  NULL_MOVE_REDUCTION: 2,
  LMR_THRESHOLD: 4,
  RANDOMNESS_FACTOR: 0.03        // 3% de variabilité contrôlée
};

// ═══════════════════════════════════════════════════════════
// MOTEUR IA
// ═══════════════════════════════════════════════════════════
class ProAIEngine {
  constructor() {
    this.tt = new Map();               // Table de transposition
    this.evalCache = new Map();        // Cache évaluation
    this.history = new Map();          // History Heuristic
    this.killers = new Array(CONFIG.KILLER_MOVES_DEPTH + 1)
      .fill(null).map(() => []);       // Killer Moves [depth][0|1]
    
    this.startTime = 0;
    this.nodesEvaluated = 0;
    this.bestRootMove = null;
    this.aiPlayer = PLAYER.P2;         // Fixé selon architecture
  }

  // ═══════════════════════════════════════════════════════════
  // POINT D'ENTRÉE
  // ═══════════════════════════════════════════════════════════
  decide(units) {
    if (!Array.isArray(units) || units.length === 0) return [];

    this.startTime = performance.now();
    this.nodesEvaluated = 0;
    this.bestRootMove = null;
    this.tt.clear();
    this.evalCache.clear();

    let bestScore = -Infinity;

    // 🔄 Iterative Deepening avec cutoff temporel strict
    for (let depth = 1; depth <= CONFIG.MAX_DEPTH; depth++) {
      if (!this._hasTime()) break;

      const result = this._expectiminimax(
        depth,
        -Infinity,
        Infinity,
        this.aiPlayer,
        true
      );

      if (result?.move && result.score > bestScore) {
        bestScore = result.score;
        this.bestRootMove = result.move;
      }

      // Coupe si victoire/défaite certaine
      if (Math.abs(bestScore) >= 9000) break;
    }

    // 🎲 Randomisation contrôlée (anti-prédictible)
    if (this.bestRootMove && Math.random() < CONFIG.RANDOMNESS_FACTOR) {
      const alternatives = this._generateAndOrderMoves(this.aiPlayer)
        .slice(0, 3)
        .filter(m => Math.abs((m.rawScore || 0) - (this.bestRootMove.rawScore || 0)) < 15);
      if (alternatives.length > 1) {
        this.bestRootMove = alternatives[Math.floor(Math.random() * alternatives.length)];
      }
    }

    return this.bestRootMove ? [this.bestRootMove] : [];
  }

  // ═══════════════════════════════════════════════════════════
  // EXPECTIMINIMAX — Arbre MAX → MIN → CHANCE
  // ═══════════════════════════════════════════════════════════
  _expectiminimax(depth, alpha, beta, player, allowNullMove = true) {
    // ⏱️ Time cutoff strict
    if (!this._hasTime()) {
      return { score: this._evaluate(), move: this.bestRootMove };
    }

    // 🎯 Terminal ou profondeur max → Quiescence
    if (depth <= 0 || this._isTerminal()) {
      return { score: this._quiescence(alpha, beta, player, 3), move: null };
    }

    this.nodesEvaluated++;
    const hash = hashGameState(game);

    // 💾 Table de transposition (Fail-Soft)
    const ttEntry = this.tt.get(hash);
    if (ttEntry && ttEntry.depth >= depth) {
      if (ttEntry.flag === 'EXACT') return { score: ttEntry.score, move: ttEntry.bestMove };
      if (ttEntry.flag === 'LOWER') alpha = Math.max(alpha, ttEntry.score);
      if (ttEntry.flag === 'UPPER') beta = Math.min(beta, ttEntry.score);
      if (alpha >= beta) return { score: ttEntry.score, move: ttEntry.bestMove };
    }

    // ✂️ Null-Move Pruning (désactivé en fin de partie)
    if (allowNullMove && depth >= 2 && player === this.aiPlayer) {
      const enemyUnits = [...game.units.values()].filter(u => u.owner !== this.aiPlayer);
      if (enemyUnits.length > 2) { // Désactive si <3 unités ennemies
        const nullResult = this._expectiminimax(
          depth - 1 - CONFIG.NULL_MOVE_REDUCTION,
          beta - 1,
          beta,
          this._nextPlayer(player),
          false
        );
        if (nullResult.score >= beta) return { score: beta, move: null };
      }
    }

    // 🎯 Génération & Tri des coups
    const moves = this._generateAndOrderMoves(player);
    if (moves.length === 0) return { score: this._evaluate(), move: null };

    const limit = Math.max(4, CONFIG.BRANCH_LIMIT_BASE - depth);
    const limitedMoves = moves.slice(0, limit);

    const isMax = player === this.aiPlayer;
    let bestMove = null;
    let bestScore = isMax ? -Infinity : Infinity;
    const alphaOrig = alpha;
    const betaOrig = beta;

    for (let i = 0; i < limitedMoves.length; i++) {
      const move = limitedMoves[i];
      const snapshot = cloneGameState();

      let score;

      // ♻️ Nœud de CHANCE pour attaques probabilistes
      if (move.dest.isAttack && move.winProb !== undefined) {
        // Branche VICTOIRE
        restoreGameState(snapshot);
        this._applyMove(move, 'win');
        const winScore = this._expectiminimax(
          depth - 1, alpha, beta, this._nextPlayer(player)
        ).score;

        // Branche DÉFAITE (attaque repoussée)
        restoreGameState(snapshot);
        this._applyMove(move, 'loss');
        const lossScore = this._expectiminimax(
          depth - 1, alpha, beta, this._nextPlayer(player)
        ).score;

        restoreGameState(snapshot);

        // Espérance mathématique : E = p*V_win + (1-p)*V_loss
        score = move.winProb * winScore + (1 - move.winProb) * lossScore;

      } else {
        // Mouvement normal
        this._applyMove(move, 'win');

        // Late Move Reduction (LMR) pour coups tardifs non-captures
        let reduction = 0;
        if (i >= CONFIG.LMR_THRESHOLD && depth >= 2 && !move.dest.isAttack) {
          reduction = 1;
        }

        score = this._expectiminimax(
          depth - 1 - reduction, alpha, beta, this._nextPlayer(player)
        ).score;

        restoreGameState(snapshot);
      }

      // Mise à jour alpha/beta
      if (isMax) {
        if (score > bestScore) { bestScore = score; bestMove = move; }
        alpha = Math.max(alpha, bestScore);
      } else {
        if (score < bestScore) { bestScore = score; bestMove = move; }
        beta = Math.min(beta, bestScore);
      }

      // ✂️ Élagage Alpha-Beta
      if (beta <= alpha) {
        this._recordKiller(depth, move);
        this._updateHistory(move, depth * depth);
        break;
      }
    }

    // 💾 Stockage dans la table de transposition
    if (this.tt.size < CONFIG.TT_MAX_SIZE) {
      let flag = 'EXACT';
      if (bestScore <= alphaOrig) flag = 'UPPER';
      else if (bestScore >= betaOrig) flag = 'LOWER';

      this.tt.set(hash, { depth, score: bestScore, bestMove, flag });
    }

    return { score: bestScore, move: bestMove };
  }

  // ═══════════════════════════════════════════════════════════
  // QUIESCENCE SEARCH — Stabilise les positions tactiques
  // ═══════════════════════════════════════════════════════════
  _quiescence(alpha, beta, player, depth) {
    const standPat = this._evaluate();

    if (depth <= 0 || !this._hasTime()) return standPat;

    if (player === this.aiPlayer) {
      if (standPat >= beta) return beta;
      alpha = Math.max(alpha, standPat);
    } else {
      if (standPat <= alpha) return alpha;
      beta = Math.min(beta, standPat);
    }

    // Explore uniquement les attaques favorables (≥60%)
    const attacks = this._generateAndOrderMoves(player)
      .filter(m => m.dest.isAttack && m.winProb >= CONFIG.ATTACK_PROB_THRESHOLD);

    for (const move of attacks) {
      const snapshot = cloneGameState();
      this._applyMove(move, 'win');

      const score = this._quiescence(
        alpha, beta, this._nextPlayer(player), depth - 1
      );

      restoreGameState(snapshot);

      if (player === this.aiPlayer) {
        if (score >= beta) return beta;
        alpha = Math.max(alpha, score);
      } else {
        if (score <= alpha) return alpha;
        beta = Math.min(beta, score);
      }
    }

    return player === this.aiPlayer ? alpha : beta;
  }

  // ═══════════════════════════════════════════════════════════
  // MOVE ORDERING — History + Killer + Score attendu
  // ═══════════════════════════════════════════════════════════
  _generateAndOrderMoves(player) {
    const candidates = [];
    const units = [...game.units.values()]
      .filter(u => u?.owner === player && !u?.hasMoved && u?.pos);

    for (const unit of units) {
      const reachable = getAllReachableForUnit(unit) ?? [];

      for (const dest of reachable) {
        let score = 0;
        let prob = 1;
        const cell = getCell(dest.x, dest.y);
        if (!cell) continue;

        if (dest.isAttack) {
          const defenderId = cell.units?.find(uid =>
            game.units.get(uid)?.owner !== player
          );
          if (!defenderId) continue;

          const defender = game.units.get(defenderId);
          prob = calculateWinProbability(
            UNIT_TYPES[unit.type]?.force ?? 1,
            UNIT_TYPES[defender.type]?.force ?? 1,
            defender?.defending ? 2 : 0
          );

          // ✅ Règle métier : attaque uniquement si prob ≥ 60%
          if (prob < CONFIG.ATTACK_PROB_THRESHOLD) continue;

          score += prob * 100;                          // Espérance de gain
          score += (UNIT_TYPES[defender.type]?.val ?? 1) * 25; // Valeur de la capture
        }

        // Bonus terrain
        if (cell.type === 'BONUS_ATK') score += 20;
        if (cell.type === 'BONUS_DEF') score += 14;
        if (cell.owner !== player) score += 18;         // Capture de territoire

        // Pénalité exposition
        score -= this._countAdjacentEnemies(dest.x, dest.y, player) * 5;

        // History Heuristic
        score += this._getHistory(unit, dest);

        // Killer Moves
        if (this._isKiller(unit, dest)) score += 50;

        candidates.push({ unit, dest, winProb: prob, rawScore: score });
      }
    }

    return candidates.sort((a, b) => b.rawScore - a.rawScore);
  }

  // ═══════════════════════════════════════════════════════════
  // ÉVALUATION HEURISTIQUE — Point de vue IA fixe (P2)
  // ═══════════════════════════════════════════════════════════
  _evaluate() {
    const hash = hashGameState(game);
    if (this.evalCache.has(hash)) return this.evalCache.get(hash);

    let score = 0;
    let aiTerritory = 0, enemyTerritory = 0;

    for (const unit of game.units.values()) {
      if (!unit?.pos) continue;
      const value = UNIT_TYPES[unit.type]?.val ?? 1;

      // Matériel
      score += unit.owner === this.aiPlayer ? value * 15 : -value * 15;

      // Position centrale
      const centerDist = Math.abs(unit.pos.x - GRID_SIZE/2) + Math.abs(unit.pos.y - GRID_SIZE/2);
      score += unit.owner === this.aiPlayer ? (8 - centerDist) : -(8 - centerDist);

      // Menaces adjacentes
      const threats = this._countAdjacentEnemies(unit.pos.x, unit.pos.y, unit.owner);
      score += unit.owner === this.aiPlayer ? -threats * 7 : threats * 7;
    }

    // Territoire
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = getCell(x, y);
        if (cell?.owner === this.aiPlayer) aiTerritory++;
        if (cell?.owner === PLAYER.P1) enemyTerritory++;
      }
    }
    score += (aiTerritory - enemyTerritory) * 12;

    // Normalisation + Cache
    score = Math.max(-9999, Math.min(9999, score));
    if (this.evalCache.size < CONFIG.EVAL_CACHE_MAX) {
      this.evalCache.set(hash, score);
    }

    return score;
  }

  // ═══════════════════════════════════════════════════════════
  // APPLICATION DE MOUVEMENT (Simulation win/loss)
  // ═══════════════════════════════════════════════════════════
  _applyMove(move, outcome) {
    const { unit, dest } = move;
    if (!unit?.pos) return false;

    const oldCell = getCell(unit.pos.x, unit.pos.y);
    const targetCell = getCell(dest.x, dest.y);
    if (!oldCell || !targetCell) return false;

    // Retirer de l'ancienne case
    oldCell.units = (oldCell.units || []).filter(id => id !== unit.id);

    if (dest.isAttack) {
      const defenderId = targetCell.units?.find(uid =>
        game.units.get(uid)?.owner !== unit.owner
      );

      if (defenderId) {
        if (outcome === 'win') {
          // Branche victoire : défenseur éliminé, unité avance
          targetCell.units = targetCell.units.filter(id => id !== defenderId);
          game.units.delete(defenderId);
          unit.pos = { x: dest.x, y: dest.y };
          targetCell.owner = unit.owner;
        } else {
          // Branche défaite : attaque échoue, unité reste, hasMoved = true
          oldCell.units.push(unit.id);
          unit.hasMoved = true;
          return true;
        }
      }
    } else {
      // Mouvement normal
      unit.pos = { x: dest.x, y: dest.y };
      targetCell.owner = unit.owner;
    }

    if (!targetCell.units) targetCell.units = [];
    if (!targetCell.units.includes(unit.id)) targetCell.units.push(unit.id);
    unit.hasMoved = true;

    return true;
  }

  // ═══════════════════════════════════════════════════════════
  // UTILITAIRES INTERNES
  // ═══════════════════════════════════════════════════════════
  _countAdjacentEnemies(x, y, owner) {
    let count = 0;
    const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;
      const cell = getCell(nx, ny);
      if (cell?.units?.some(uid => game.units.get(uid)?.owner !== owner)) count++;
    }
    return count;
  }

  _recordKiller(depth, move) {
    if (!move?.dest?.isAttack) return;
    const slot = this.killers[depth] || [];
    if (!slot.some(m => this._sameMove(m, move))) {
      slot.unshift(move);
      if (slot.length > 2) slot.pop();
    }
    this.killers[depth] = slot;
  }

  _isKiller(unit, dest) {
    return this.killers.some(slot =>
      slot.some(m => m?.unit?.id === unit.id && m?.dest?.x === dest.x && m?.dest?.y === dest.y)
    );
  }

  _sameMove(a, b) {
    return a?.unit?.id === b?.unit?.id && a?.dest?.x === b?.dest?.x && a?.dest?.y === b?.dest?.y;
  }

  _updateHistory(move, bonus) {
    const key = `${move.unit.type}:${move.dest.x},${move.dest.y}`;
    this.history.set(key, (this.history.get(key) || 0) + bonus);
  }

  _getHistory(unit, dest) {
    return this.history.get(`${unit.type}:${dest.x},${dest.y}`) || 0;
  }

  _nextPlayer(player) {
    return player === PLAYER.P1 ? PLAYER.P2 : PLAYER.P1;
  }

  _hasTime() {
    return performance.now() - this.startTime < CONFIG.TIME_LIMIT_MS - CONFIG.SAFETY_MARGIN_MS;
  }

  _isTerminal() {
    let p1 = 0, p2 = 0;
    for (const unit of game.units.values()) {
      if (unit.owner === PLAYER.P1) p1++;
      if (unit.owner === PLAYER.P2) p2++;
    }
    return p1 === 0 || p2 === 0;
  }
}

// ═══════════════════════════════════════════════════════════
// SINGLETON & EXPORT
// ═══════════════════════════════════════════════════════════
const aiEngine = new ProAIEngine();

/**
Point d'entrée public — Compatible manager.js
@param {Array} units - Unités IA disponibles
@returns {Array} Mouvement unique optimisé [{ unit, dest }]
*/
export function getBestMove(units) {
  return aiEngine.decide(units);
}