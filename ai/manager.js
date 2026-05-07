/**
COORDINATEUR IA — 1 ACTION/TOUR + FALLBACK SÉCURISÉ
@module ai/manager
*/
import { PLAYER } from '../config.js';
import { game } from '../state.js';
import { logEvent } from '../ui/logger.js';
import { updateScoreDisplay, checkWinCondition } from '../gameplay/win-condition.js';
import { renderGrid } from '../ui/renderer.js';
import { updateProbabilityDisplay } from '../utils/probability.js';
import { getBestMove } from './pro.js';
import { getAvailableUnits, getAllReachableForUnit } from './base.js'; // ✅ getAllReachableForUnit added
import { executeAiAttack, executeAiMove } from '../gameplay/movement.js';

export async function executeAiTurn() {
  if (game?.phase === 'GAME_OVER' || game.turn !== PLAYER.P2) return;

  const aiUnits = getAvailableUnits(PLAYER.P2);
  if (!aiUnits?.length) {
    logEvent('🤖 IA: aucune unité disponible', 'ai');
    return switchToPlayer();
  }

  const thinkingEl = document.getElementById('ai-thinking');
  thinkingEl?.classList?.add?.('show');
  await sleep(40);

  let bestMove = null;
  try {
    const moves = getBestMove(aiUnits) || [];
    bestMove = moves[0] || null;
  } catch (err) {
    console.error('[AI] Erreur calcul:', err);
    thinkingEl?.classList?.remove?.('show');
    return switchToPlayer();
  }

  thinkingEl?.classList?.remove?.('show');

  // 🛡️ FALLBACK : si aucun coup valide, jouer un mouvement aléatoire sécurisé
  if (!bestMove) {
    logEvent('⚠️ IA: fallback mouvement aléatoire', 'ai');
    const safeMove = aiUnits
      .map(u => {
        const reach = getAllReachableForUnit(u) ?? [];
        const nonAttack = reach.find(r => !r.isAttack);
        return nonAttack ? { unit: u, dest: nonAttack } : null;
      })
      .find(m => m !== null);
    
    if (safeMove) {
      executeAiMove(safeMove.unit, safeMove.dest);
      renderGrid();
      updateScoreDisplay();
      updateProbabilityDisplay();
    }
    return switchToPlayer();
  }

  const unit = game.units.get(bestMove.unit?.id);
  if (!unit || unit.hasMoved) return switchToPlayer();

  try {
    if (bestMove.dest?.isAttack) {
      await new Promise(r =>
        executeAiAttack(unit, bestMove.dest, () => sleep(500).then(r))
      );
    } else {
      executeAiMove(unit, bestMove.dest);
      await sleep(300);
    }
    renderGrid();
    updateScoreDisplay();
    updateProbabilityDisplay();
  } catch (e) {
    console.error('[AI] Erreur exécution:', e);
  }

  switchToPlayer();
}

function switchToPlayer() {
  for (const u of game.units.values()) {
    if (u.owner === PLAYER.P1) u.hasMoved = false;
  }
  game.turn = PLAYER.P1;

  const banner = document.getElementById('turn-banner');
  if (banner) { banner.textContent = 'VOTRE TOUR'; banner.className = 'p1'; }
  const endBtn = document.getElementById('end-btn');
  if (endBtn) endBtn.disabled = true;
  document.getElementById('phase-badge').textContent = 'MOUVEMENT';

  logEvent('✅ Tour IA terminé → C\'est à vous', 'system');
  checkWinCondition();
  renderGrid();
  updateProbabilityDisplay();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }