import { Chess } from "./chess.js";

const PIECE_VALUES = {
  p: 10,
  n: 28,
  b: 32,
  r: 48,
  q: 92,
  k: 900,
};

const getFrequency = (string) => {
  var freq = {};
  for (var i = 0; i < string.length; i++) {
    var character = string.charAt(i);

    // only count alphabets
    let ascii = string.charCodeAt(i);
    if (!((ascii >= 65 && ascii <= 90) || (ascii >= 97 && ascii <= 122)))
      continue;

    if (freq[character]) {
      freq[character]++;
    } else {
      freq[character] = 1;
    }
  }

  return freq;
};

const isCapital = (ch) => {
  return ch.charCodeAt() >= 65 && ch.charCodeAt() <= 90;
};

class ChessGame {
  constructor(whitePlayer) {
    this.white = whitePlayer;
    this.black = "c";

    // determine gameMode
    if (this.white == "h") this.gameMode = "hvc";
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
      onDragStart: this.onPlayerDragStart.bind(this),
      onDrop: this.onPieceDrop.bind(this),
    });
  }

  // gets initial board UI orientation from gameMode
  getInitialOrientation() {
    if (this.white == this.black) return "white";
    if (this.white == "h") return "white";
    return "black";
  }

  // don't move the other side's pieces
  onPlayerDragStart(source, piece, position, orientation) {
    if (
      (orientation === "white" && piece.includes("b")) ||
      (orientation === "black" && piece.includes("w"))
    ) {
      return false;
    }
  }

  isPawnPromoted(source, target, piece) {
    if (piece.charAt(1) == "P") {
      if (
        (source.charAt(1) == 7 && target.charAt(1) == 8) ||
        (source.charAt(1) == 2 && target.charAt(1) == 1)
      ) {
        return true;
      }
    }
  }

  onPieceDrop(source, target, piece, newPos, oldPos, orientation) {
    let desiredMove = { from: source, to: target };

    // check for pawn promotion
    if (this.isPawnPromoted(source, target, piece)) {
      desiredMove.promotion = "q";
    }

    // validate the move
    if (this.game.move(desiredMove) == null) {
      return "snapback";
    }

    // update board to match fen in case of pawn promotion
    setTimeout(() => {
      this.board.position(this.game.fen());
    }, 10);

    console.log(
      "Player moved:",
      source,
      target,
      piece,
      oldPos,
      newPos,
      orientation
    );

    console.log(this.game.board());

    // check for endgame conditions
    if (this.checkGameOver().over) {
      this.endGame();
      return;
    }

    // run computer move
    this.timeoutID = setTimeout(this.computerMove.bind(this), 100);
  }

  computerMove() {
    let moves = this.game.moves({ verbose: true });

    let [move, score] = this.getOptimalMove(
      this.game,
      3,
      true,
      this.evaluateBoard(this.game, this.game.turn()),
      this.game.turn()
    );

    console.log("optimal move:", move, score);
    if (move == null)
    {
      console.log('doing random move')
      move = this.getRandomMove(moves);
    }

    // only promote to queen
    if (["r", "n", "b"].includes(move.promotion)) {
      move.promotion = "q";
    }

    this.game.move(move);

    // render in case of pawn promotion
    setTimeout(() => {
      this.board.position(this.game.fen());
    }, 10);

    console.log("computer moved:", move);

    // check endgame
    if (this.checkGameOver().over) {
      this.endGame();
      return;
    }

    // run next move if cvc
    if (this.gameMode == "cvc") {
      this.timeoutID = setTimeout(this.computerMove.bind(this), 300);
      return;
    }
  }

  evaluateBoard(state, color) {
    let fen = state.fen().split(" ")[0];
    let freq = getFrequency(fen);

    // get scores from piece values
    let score = 0;
    for (const [piece, count] of Object.entries(freq)) {
      // add own side's pieces + subtract opponent's pieces
      if (isCapital(piece)) {
        score += PIECE_VALUES[piece.toLowerCase()] * count;
      } else {
        score -= PIECE_VALUES[piece.toLowerCase()] * count;
      }
    }

    if (color == "b") score *= -1;

    // use state.board() to account for positional play in score

    return score;
  }

  getOptimalMove(state, depth, isMaxPlayer, score, color) {
    let moves = state.moves({verbose: true});
    let bestMove;
    let minVal = Number.POSITIVE_INFINITY;
    let maxVal = Number.NEGATIVE_INFINITY;

    if (depth === 0 || moves.length === 0) {
      return [null, score];
    }

    for (var i = 0; i < moves.length; i++) {
      let currMove = moves[i];
      state.move(currMove);
      let currScore = this.evaluateBoard(state, color);
      let [childBestMove, childScore] = this.getOptimalMove(state, depth-1, !isMaxPlayer, currScore, color);
      state.undo();

      if (isMaxPlayer && childScore > maxVal) {
        bestMove = currMove;
        maxVal = childScore;
      }
      else if (childScore < minVal) {
        bestMove = currMove;
        minVal = childScore;
      }
    }

    return isMaxPlayer ? [bestMove, maxVal] : [bestMove, minVal];
  }

  getRandomMove(moves) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  endGame() {
    let data = this.checkGameOver();
    console.log(data);

    if (data.checkmate) {
      $("#gameStatus").text(this.game.turn() + " was checkmated");
    } else if (data.draw) {
      $("#gameStatus").text("draw\n" + JSON.stringify(data));
    }

    console.log(this.game.fen());
    console.log(this.game.pgn());
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
  }

  checkGameOver() {
    return {
      over: this.game.game_over(),
      checkmate: this.game.in_checkmate(),
      draw: this.game.in_draw(),
      stalemate: this.game.in_stalemate(),
      insuff: this.game.insufficient_material(),
      three_reps: this.game.in_threefold_repetition(),
      fifty_reps: this.game.fen().split(" ")[4] == 100 ? true : false,
      fen: this.game.fen(),
      pgn: this.game.pgn(),
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

$("#resetButton").on("click", () =>{
  chessGame.reset();
  $("#gameStatus").text("");
});
$("#startButton").on("click", () => {
  chessGame.run();
});
