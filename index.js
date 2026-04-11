const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

const gameBoard = document.getElementById("gameboard");
const banner = document.getElementById("banner");
const playBtn = document.getElementById("playBtn");
const imgsBlue = document.querySelectorAll(".img-wrap-blue");
const imgsRed = document.querySelectorAll(".img-wrap-red");
const checkBtnBlue = document.getElementById("check-btn-blue");
const checkBtnRed = document.getElementById("check-btn-red");

ranks.forEach((rank) => {
  files.forEach((file) => {
    const canva = document.createElement("canvas");
    const c = canva.getContext("2d");
    const image = new Image();
    image.src =
      "assets/Units Sprites/Blue Units/Lancer/Lancer_Right_Attack.png";
    carre.classList.add("carre");

    carre.id = `${file}${rank}`;
    gameBoard.appendChild(carre);
  });
});
banner.classList.add("visible");

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
  gameBoard.style.transform = "translateX(350px)"; /* adjust px as needed */
}

function moveBoardLeft() {
  gameBoard.style.transform = "translateX(-350px)";
}

function moveBoardCenter() {
  gameBoard.style.transform = "translateX(0)";
}

playBtn.addEventListener("click", () => {
  banner.classList.remove("visible");
  playBtn.classList.add("hidden");
  moveBoardRight();
  setTimeout(() => showImgs(imgsBlue), 1000);
});

checkBtnBlue.addEventListener("click", () => {
  hideImgs(imgsBlue); // 1. Blue fades out
  setTimeout(() => moveBoardLeft(), 1000); // 2. Board slides left
  setTimeout(() => showImgs(imgsRed), 2000); // 3. Red appears (after board moves)
});

checkBtnRed.addEventListener("click", () => {
  hideImgs(imgsRed); // 1. Blue fades out
  setTimeout(() => moveBoardCenter(), 1000); // 2. Board slides left
});
