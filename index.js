const gameBoard = document.getElementById("gameboard");
const banner = document.getElementById("banner");
const playBtn = document.getElementById("playBtn");
const imgsBlue = document.querySelectorAll(".img-wrap-blue");
const imgsRed = document.querySelectorAll(".img-wrap-red");
const checkBtnBlue = document.getElementById("check-btn-blue");
const checkBtnRed = document.getElementById("check-btn-red");

function showImgs(imgs) {
  imgs.forEach((img, i) => {
    img.style.transitionDelay = `${i * 100}ms`;
    img.classList.add("visible");
  });
}

function hideImgs(imgs) {
  imgs.forEach((img, i) => {
    img.style.transitionDelay = `${i * 100}ms`;
    img.classList.remove("visible");
  });
}

function moveBoardRight() {
  gameBoard.style.transform = "translateX(350px)";
}

function moveBoardLeft() {
  gameBoard.style.transform = "translateX(-350px)";
}

function moveBoardCenter() {
  gameBoard.style.transform = "translateX(0)";
}

const game = new Game();
const combatQueue = [];
const combatIdx = 0;

function renderBoard() {
  const boardEl = document.getElementById("gameboard");
  boardEl.innerHTML = "";

  const pid = game.currentPlayerId();
  const selUnit = game.selectedUnit;
  const moveSet = new Set(game.validMoves.map(([r, c]) => `${r},${c}`));

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";

      if (game.isPlacing()) {
        const rows = game.player(pid).deployRows();
        if (rows.includes(r))
          cell.classList.add(pid === 1 ? "zone-p1" : "zone-p2");
      }

      // Selected cell highlight
      if (selUnit && selUnit.row === r && selUnit.col === c)
        cell.classList.add("sel-cell");

      // Valid moves / attacks
      if (moveSet.has(`${r},${c}`)) {
        const sq = game.board.sq(r, c);
        cell.classList.add(sq.hasEnemy(pid) ? "can-attack" : "can-move");
      }

      cell.addEventListener("click", () => onCellClick(r, c));

      // Render unit tokens
      const sq = game.board.sq(r, c);
      for (let unit of sq.units) {
        const tok = document.createElement("div");
        tok.className = `unit-token p${unit.player}`;
        if (selUnit && selUnit.id === unit.id)
          tok.classList.add("selected-unit");
        tok.textContent = unit.getLabel();
        tok.addEventListener("click", (e) => {
          e.stopPropagation();
          onUnitClick(unit);
        });
        cell.appendChild(tok);
      }

      boardEl.appendChild(cell);
    }
  }
}

function renderUI() {
  // START | PLACE_1 | PLACE_2 | BATTLE_1 | BATTLE_2 | OVER
  switch (game.state) {
    case "START":
      banner.classList.add("visible");
      playBtn.addEventListener("click", () => {
        banner.classList.remove("visible");
        playBtn.classList.add("hidden");
        moveBoardRight();
        setTimeout(() => showImgs(imgsBlue), 1000);
        game.state = "PLACE_1";
        renderAll();
      });
      break;

    case "PLACE_1":
      checkBtnBlue.addEventListener("click", () => {
        hideImgs(imgsBlue);
        setTimeout(() => moveBoardLeft(), 1000);
        setTimeout(() => showImgs(imgsRed), 2000);
        game.state = "PLACE_2";
        renderAll();
      });
      break;

    case "PLACE_2":
      checkBtnRed.addEventListener("click", () => {
        hideImgs(imgsRed);
        setTimeout(() => moveBoardCenter(), 1000);
        game.state = "BATTLE_1";
        renderAll();
      });
      break;

    case "OVER":
      console.log("game over dude");
      break;

    default:
      console.log(game.board.grid);
      break;
  }
}

function renderAll() {
  renderUI();
  renderBoard();
}

function onCellClick(r, c) {
  if (game.state === "OVER" || combatQueue.length > 0) return;

  if (game.isPlacing()) {
    if (game.tryPlace(r, c)) renderAll();
    return;
  }

  if (game.isBattling() && game.selectedUnit) {
    if (game.tryMoveOrAttack(r, c)) renderAll();
    return;
  }

  renderAll();
}

function onUnitClick(unit) {
  if (game.state === "OVER" || combatQueue.length || !game.isBattling()) return;

  if (unit.player === game.currentPlayerId()) {
    if (game.selectedUnit && game.selectedUnit.id === unit.id) {
      game.clearSel();
    } else {
      game.selectUnit(unit);
    }
    renderAll();
  }
}

// Unit-type buttons
document.querySelectorAll(".unit-type-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".unit-type-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    game.chosenType = btn.dataset.type;
  });
});

renderAll();
