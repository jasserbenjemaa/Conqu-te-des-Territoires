const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

const gameBoard = document.getElementById("gameboard");
const banner = document.getElementById("banner");
const playBtn = document.getElementById("playBtn");
const imgs = document.querySelectorAll(".img-wrap");
const checkBtn = document.getElementById("check-btn");

ranks.forEach((rank) => {
  files.forEach((file) => {
    const carre = document.createElement("div");
    carre.classList.add("carre");
    carre.id = `${file}${rank}`;
    gameBoard.appendChild(carre);
  });
});
banner.classList.add("visible");

function showImgs() {
  imgs.forEach((img, i) => {
    img.style.transitionDelay = `${i * 100}ms`;
    img.classList.add("visible");
  });
}

function hideImgs() {
  imgs.forEach((img, i) => {
    img.style.transitionDelay = `${i * 80}ms`;
    img.classList.remove("visible");
  });
}

function moveBoardRight() {
  gameBoard.style.transform = "translateX(350px)"; /* adjust px as needed */
}

function moveBoardLeft() {
  gameBoard.style.transform = "translateX(-350px)";
}

playBtn.addEventListener("click", () => {
  banner.classList.remove("visible");
  playBtn.classList.add("hidden");
  moveBoardRight();
  setTimeout(() => showImgs(), 1000);
});

checkBtn.addEventListener("click", () => {
  hideImgs();
  setTimeout(() => moveBoardLeft(), 1000);
});
