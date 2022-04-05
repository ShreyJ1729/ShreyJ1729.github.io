import { Chess } from "./chess.js";

var board = Chessboard("board", {
  draggable: true,
});
board.start();

const game = new Chess();

console.log(game.pgn());

$("#startBtn").on("click", () => {
  if (confirm("This will reset the board. Are you sure?")) {
    board.start();
    game.reset();
    console.log("reset game!");
  }
});

$("#moveBtn").on("click", () => {
//   if (!game.game_over()) {
    move();
//   }
  console.log(game.fen());
});

$("#moveToEndBtn").on("click", () => {
  while (!game.game_over()) {
    move();
  }
  console.log(game.pgn());
});

const move = () => {
  let moves = game.moves({ verbose: true });

  let move = moves[Math.floor(Math.random() * moves.length)];
  game.move(move);

  let boardMove = move.from + "-" + move.to;
  board.move(boardMove);
};
