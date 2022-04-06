import { Chess } from "./chess.js";

class ChessGame {
  constructor(whitePlayer, blackPlayer) {
    this.white = whitePlayer;
    this.black = blackPlayer;

    // determine gameMode
    if (this.white == "h" && this.black == "h") this.gameMode = "hvh";
    else if (this.white !== this.black) this.gameMode = "hvc";
    else this.gameMode = "cvc";

    console.log("Game Mode:", this.gameMode);

    // initialist game state and board UI
    this.game = new Chess();
    this.board = Chessboard("board", {
      draggable: this.gameMode == "cvc" ? false : true, // lock board in cvc gameMode
      showNotation: false,
      showErrors: "console",
      position: "start",
      moveSpeed: "10",
      orientation: this.getInitialOrientation(),
      onDragStart: this.onDragStart.bind(this),
      onDrop: this.onDrop.bind(this),
    });
  }

  // gets initial board UI orientation from gameMode
  getInitialOrientation() {
    if (this.white == this.black) return "white";
    if (this.white == "h") return "white";
    return "black";
  }

  onDragStart(source, piece, position, orientation) {
    // don't move the other side's pieces
    if (
      (orientation === "white" && piece.includes("b")) ||
      (orientation === "black" && piece.includes("w"))
    ) {
      return false;
    }
  }

  onDrop(source, target, piece, newPos, oldPos, orientation) {
    // validate the move
    let desiredMove = { from: source, to: target };
    let validMoves = this.game.moves({ verbose: true });
    let isMoveValid = false;

    validMoves.forEach((move) => {
      if (desiredMove.from == move.from && desiredMove.to == move.to) {
        isMoveValid = true;
        this.game.move(desiredMove);
      }
    });

    if (!isMoveValid) {
      return "snapback";
    }

    console.log("OnDrop:", source, target, piece, newPos, oldPos, orientation);

    if (this.gameMode == "hvc") {
      this.timeoutID = setTimeout(this.computerMove.bind(this), 100);
    }
  }

  computerMove() {
    if (this.checkGameOver().over) {
      console.log(this.checkGameOver());
      return;
    }

    let moves = this.game.moves({ verbose: true });

    let move = this.getRandomMove(moves);
    this.game.move(move);
    console.log(move);

    let boardMove = move.from + "-" + move.to;
    console.log(boardMove);
    this.board.move(boardMove);

    if (this.gameMode == "cvc") {
      this.timeoutID = setTimeout(this.computerMove.bind(this), 100);
    }
  }

  getRandomMove(moves) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  reset() {
    this.game.reset();
    this.board.start();
    clearTimeout(this.timeoutID);
  }

  run() {
    if (this.gameMode == "cvc") {
      this.timeoutID = setTimeout(this.computerMove.bind(this), 500);
    }

    if (this.gameMode == "hvc" && this.white == "c") {
      this.timeoutID = setTimeout(this.computerMove.bind(this), 500);
    }
  }

  checkGameOver() {
    return {
      over: this.game.game_over(),
      checkmate: this.game.in_checkmate(),
      draw: this.game.in_draw(),
      stalemate: this.game.in_stalemate(),
      insuff: this.game.insufficient_material(),
      rep: this.game.in_threefold_repetition(),
    };
  }
}

const initializeGame = () => {
  return new ChessGame(
    $("#whitePlayer :selected").val(),
    $("#blackPlayer :selected").val()
  );
};

var chessGame = initializeGame();

$("#whitePlayer").on("change", () => {
  chessGame = initializeGame();
});

$("#blackPlayer").on("change", () => {
  chessGame = initializeGame();
});

$("#resetButton").on("click", () => {
  chessGame.reset();
});
$("#startButton").on("click", () => {
  chessGame.run();
});

// class ComputerPlayer {
//   constructor(algorithm, color) {
//     this.algorithm = algorithm;
//     this.color = color;
//   }

//   getMove(moves) {
//     if (this.algorithm == "random") {
//       return getRandomMove(moves);
//     }
//   }
// }
