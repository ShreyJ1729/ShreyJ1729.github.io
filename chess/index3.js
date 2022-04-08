import { Chess } from "./chess.js";

const game = new Chess();

$("#resetButton").on("click", () => {
    board.start();
    game.reset();
    console.log("reset game!");
});

const onDragStart = (source, piece, position, orientation) => {
  // don't move the other side's pieces
  if ((orientation === 'white' && piece.includes('b')) ||
      (orientation === 'black' && piece.includes('w'))) {
    return false
  }
}

const onDrop = (source, target, piece, newPos, oldPos, orientation) => {
  
  //validate the move
  let desiredMove = {from: source, to: target};
  let validMoves = game.moves({verbose: true});
  let isMoveValid = false;

  validMoves.forEach(move => {
    if (desiredMove.from == move.from && desiredMove.to == move.to)
    {
      isMoveValid = true;
      game.move(desiredMove);
    }
  });

  console.log('OnDrop:', source, target, piece, newPos, oldPos, orientation, isMoveValid);

  if (!isMoveValid) {
    return 'snapback';
  }

  console.log('Player moved, now AI turn')
  setTimeout(AImove, 50);
}

const AImove = () => {
  if (checkGameOver().over)
  {
    console.log(checkGameOver());
    return;
  }

  let moves = game.moves({ verbose: true });

  let move = getRandomMove(moves)
  game.move(move);

  let boardMove = move.from + "-" + move.to;
  board.move(boardMove);

  if (checkGameOver().over)
  {
    console.log(checkGameOver());
    return;
  }

  console.log('AI moved, now Player turn')
  setTimeout(AImove, 50);

};

const getRandomMove = (moves) => {
  return moves[Math.floor(Math.random() * moves.length)];
}

const checkGameOver = () => {
    if (game.in_checkmate())
    {
      return {over: true, details: 'checkmate by ' + game.turn()}
    }

    if (game.in_stalemate() || game.in_draw() || game.in_threefold_repetition() || game.insufficient_material())
    {
      return {over: true, details: 'draw', stalemate: game.in_stalemate(), draw: game.in_draw(), insuf: game.insufficient_material(), rep:game.in_threefold_repetition()}
    }

    return {over: false};
}

var board = Chessboard("board", {
  draggable: true,
  showNotation: false,
  showErrors: 'console',
  position: 'start',
  moveSpeed: 1,
  onDragStart: onDragStart,
  onDrop: onDrop,
});

board.start();