const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

const gameBoard = document.querySelector("#gameboard");

ranks.forEach((rank) => {
  files.forEach((file) => {
    const carre = document.createElement("div");
    carre.classList.add("carre");
    carre.id = `${file}${rank}`;
    gameBoard.appendChild(carre);
  });
});
const banner = document.getElementById("banner");
const playBtn = document.getElementById("playBtn");
banner.classList.add("visible");

function moveRight() {
  gameBoard.style.transform = "translateX(350px)"; /* adjust px as needed */
}

function moveLeft() {
  gameBoard.style.transform = "translateX(-350px)";
}
const imgs = document.querySelectorAll(".img-wrap");

function showImgs() {
  imgs.forEach((img, i) => {
    img.style.transitionDelay = `${i * 100}ms`; // 0ms, 100ms, 200ms...
    img.classList.add("visible");
  });
}

function hideImgs() {
  imgs.forEach((img, i) => {
    img.style.transitionDelay = `${i * 80}ms`;
    img.classList.remove("visible");
  });
}

playBtn.addEventListener("click", () => {
  banner.classList.remove("visible");
  playBtn.classList.add("hidden");
  moveRight();
  setTimeout(() => showImgs(), 1000);
});
