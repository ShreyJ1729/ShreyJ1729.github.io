import { Chess } from "./chess.js";

const PIECE_VALUES = {
  p: 10,
  n: 28,
  b: 32,
  r: 48,
  q: 92,
  k: 900,
};

const shuffleArray = array => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

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
  constructor() {
    // initialize game, computer player, and board UI
    this.game = new Chess();
    this.board = Chessboard("board", {
      draggable: this.gameMode == "cvc" ? false : true, // lock board in cvc gameMode
      showNotation: false,
      showErrors: "console",
      position: "start",
      moveSpeed: "10",
      onDragStart: this.onDragStart.bind(this),
      onDrop: this.onPieceDrop.bind(this),
      onSnapEnd: () => {this.board.position(this.game.fen())} // in case of pawn promotion
    });
    
    this.cPlayer = new ComputerPlayer(this.game, "minimax", 3, "b");

  }
  // don't move the other side's pieces
  onDragStart(source, piece, position, orientation) {
    if (piece.includes("b")) return false;
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
    let desiredMove = { from: source, to: target, promotion: 'q'};

    // check for pawn promotion
    if (this.isPawnPromoted(source, target, piece)) {
        desiredMove.promotion = "q";
    }

    // snapback if move is invalid
    if (this.game.move(desiredMove) == null) {
      return "snapback";
    }

    console.log(
      "Player moved:",
      source,
      target,
      piece,
    );

    // check for endgame conditions
    if (this.checkGameOver().over) {
        this.endGame();
        return;
      }

    // run computer move after 100ms delay
    this.timeoutID = setTimeout(() => {
      let computerMove = this.cPlayer.move();
      this.game.move(computerMove);
      this.board.position(this.game.fen());
      if (this.checkGameOver().over) {
        this.endGame();
        return;
      }
    }, 100);
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


class ComputerPlayer {
    constructor(game, algorithm, searchDepth) {
        this.algorithm = algorithm;
        this.searchDepth = searchDepth;
        this.color = "b";
        this.game = game;
    }

    move () {
        let [move, score] = this.minimax(
          this.game,
          3,
          true,
          this.evaluateBoard(this.game, this.color),
          this.color,
          true
        );

        console.log("computer minimax result: ", move, score);
        if (move == null) {
            console.log("minimax unconclusive, d-oing random move");
            move = this.getRandomMove();
        }

        // only promote to queen if available
        if (["r", "n", "b"].includes(move.promotion)) {
          move.promotion = "q";
        }

        return move;
    }
    
      minimax(state, depth, isMaximizing, score, color, topMost=false) {
        // let moves = state.moves({ verbose: true })
        let moves = shuffleArray(state.moves({ verbose: true }))
          
        let bestMove;
        let bestScore = isMaximizing
          ? Number.NEGATIVE_INFINITY
          : Number.POSITIVE_INFINITY;

        // for depth 1, iterate over possible moves and return the one with best eval score
        if (depth === 1) {
          for (let i = 0; i < moves.length; i++) {
            let currMove = moves[i];
            state.move(currMove);
            let currScore = this.evaluateBoard(state, color);
            state.undo();
            if (currScore != score) console.log(" ", currMove.from, currMove.to, currScore,);
            
            if (
                (isMaximizing && currScore > bestScore) ||
                (!isMaximizing && currScore < bestScore) ||
                i == 0
              ) {
                bestMove = currMove;
                bestScore = currScore;
                console.log(" newbest", currMove.from, currMove.to, currScore,);
              }
          }

          return [bestMove, bestScore];
        }

        // depth > 1
        // perform each possible move, recurse and record results, then undo
        for (var i = 0; i < moves.length; i++) {
          let currMove = moves[i];
          state.move(currMove);
          let currScore = this.evaluateBoard(state, color);
          let [childBestMove, childScore] = this.minimax(
            state,
            depth - 1,
            !isMaximizing,
            currScore,
            color
          );
          state.undo();

          if (
            (isMaximizing && childScore > bestScore) ||
            (!isMaximizing && childScore < bestScore) || 
            i == 0
          ) {
            bestMove = currMove;
            bestScore = childScore;
            // if (topMost) console.log(currMove.from, currMove.to, childScore);
          }
        }

        return [bestMove, bestScore];
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
    
      getRandomMove() {
        return this.game.moves()[Math.floor(Math.random() * moves.length)];
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
  $("#gameStatus").text("");
});

$("#startButton").on("click", () => {
  chessGame.run();
});