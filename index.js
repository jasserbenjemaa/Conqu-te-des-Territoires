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

playBtn.addEventListener("click", () => {
  banner.classList.remove("visible");
  playBtn.classList.add("hidden");
});
