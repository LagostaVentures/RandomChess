import React, { useState, useEffect, useCallback } from 'react';
import './ChessApp.css';

const ChessApp = () => {
  const [gameMode, setGameMode] = useState('standard');
  const [opponent, setOpponent] = useState('ai');
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [board, setBoard] = useState(() => initializeBoard('standard').board);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [currentTurn, setCurrentTurn] = useState('white');
  const [gameStatus, setGameStatus] = useState('active');
  const [message, setMessage] = useState('White to move');
  const [moveHistory, setMoveHistory] = useState([]);
  const [aiThinking, setAiThinking] = useState(false);
  const [whitePieces, setWhitePieces] = useState([]);
  const [blackPieces, setBlackPieces] = useState([]);
  const [piecePositions, setPiecePositions] = useState({ white: [], black: [] });

  const pieceValues = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0 };

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function isInBounds(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }

  function getValidMovesRaw(piece, row, col, boardState) {
    const moves = [];
    if (!piece) return moves;
    const { type, color } = piece;
    if (type === 'pawn') {
      const dir = color === 'white' ? -1 : 1;
      const startRank = color === 'white' ? 6 : 1;
      if (isInBounds(row + dir, col) && !boardState[row + dir][col]) {
        moves.push([row + dir, col]);
        if (row === startRank && isInBounds(row + 2 * dir, col) && !boardState[row + 2 * dir][col] && !boardState[row + dir][col]) {
          moves.push([row + 2 * dir, col]);
        }
      }
      for (const dc of [-1, 1]) {
        const nc = col + dc;
        if (isInBounds(row + dir, nc) && boardState[row + dir][nc] && boardState[row + dir][nc].color !== color) {
          moves.push([row + dir, nc]);
        }
      }
    }
    if (type === 'rook' || type === 'queen') {
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        let r = row + dr, c = col + dc;
        while (isInBounds(r, c)) {
          if (!boardState[r][c]) moves.push([r, c]);
          else {
            if (boardState[r][c].color !== color) moves.push([r, c]);
            break;
          }
          r += dr;
          c += dc;
        }
      }
    }
    if (type === 'bishop' || type === 'queen') {
      for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        let r = row + dr, c = col + dc;
        while (isInBounds(r, c)) {
          if (!boardState[r][c]) moves.push([r, c]);
          else {
            if (boardState[r][c].color !== color) moves.push([r, c]);
            break;
          }
          r += dr;
          c += dc;
        }
      }
    }
    if (type === 'knight') {
      const offsets = [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]];
      for (const [dr, dc] of offsets) {
        const r = row + dr, c = col + dc;
        if (isInBounds(r, c) && (!boardState[r][c] || boardState[r][c].color !== color)) moves.push([r, c]);
      }
    }
    if (type === 'king') {
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const r = row + dr, c = col + dc;
        if (isInBounds(r, c) && (!boardState[r][c] || boardState[r][c].color !== color)) moves.push([r, c]);
      }
    }
    return moves;
  }

  function isKingInCheck(board, color, piecePositions) {
    const kingPos = piecePositions[color].find(p => p.piece.type === 'king');
    if (!kingPos) {
      console.log("No king found for", color);
      return false;
    }
    const [kingR, kingC] = [kingPos.row, kingPos.col];
    const oppColor = color === 'white' ? 'black' : 'white';
    let inCheck = false;

    for (const { piece, row: r, col: c } of piecePositions[oppColor]) {
      const moves = getValidMovesRaw(piece, r, c, board);
      if (moves.some(([mr, mc]) => mr === kingR && mc === kingC)) {
        console.log(`Check detected by ${piece.type} at (${r}, ${c}) with moves:`, moves);
        inCheck = true;
        break;
      }
    }
    return inCheck;
  }

  function simulateMove(board, fromR, fromC, toR, toC) {
    const newBoard = board.map(row => row.map(cell => cell ? { ...cell } : null));
    const movingPiece = newBoard[fromR][fromC];
    if (movingPiece.type === 'pawn' && (toR === 0 || toR === 7)) {
      newBoard[toR][toC] = { type: 'queen', color: movingPiece.color };
    } else {
      newBoard[toR][toC] = movingPiece;
    }
    newBoard[fromR][fromC] = null;
    return newBoard;
  }

  function updatePiecePositions(board) {
    const newPiecePositions = { white: [], black: [] };
    board.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          newPiecePositions[cell.color].push({ piece: cell, row: r, col: c });
        }
      });
    });
    return newPiecePositions;
  }

  function getValidMoves(piece, row, col, boardState = board, piecePositionsState = piecePositions) {
    if (!piece) return [];

    const rawMoves = getValidMovesRaw(piece, row, col, boardState);
    const filteredMoves = [];
    const isInCheckNow = isKingInCheck(boardState, piece.color, piecePositionsState);

    console.log(`getValidMoves for ${piece.color} ${piece.type} at (${row}, ${col}), in check: ${isInCheckNow}`);
    console.log("Board state:", boardState.map(row => row.map(cell => cell ? `${cell.color} ${cell.type}` : null)));

    for (const [toR, toC] of rawMoves) {
      const testBoard = simulateMove(boardState, row, col, toR, toC);
      // Update piece positions for the simulated board
      const updatedPositions = updatePiecePositions(testBoard);
      const stillInCheck = isKingInCheck(testBoard, piece.color, updatedPositions);

      if (isInCheckNow) {
        if (!stillInCheck) {
          filteredMoves.push([toR, toC]);
        }
      } else {
        if (!stillInCheck) {
          filteredMoves.push([toR, toC]);
        }
      }
    }

    console.log(`Piece ${piece.type} at (${row}, ${col}) has raw moves:`, rawMoves, 'filtered to:', filteredMoves);
    return filteredMoves;
  }

  function evaluateBoard(board, color) {
    let score = 0;
    const myColor = color === 'black' ? 'black' : 'white';
    const oppColor = myColor === 'white' ? 'black' : 'white';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c]) {
          score += pieceValues[board[r][c].type] * (board[r][c].color === myColor ? 1 : -1);
        }
      }
    }
    if (isKingInCheck(board, oppColor, piecePositions)) score += 5;
    if (isKingInCheck(board, myColor, piecePositions)) score -= 5;
    return score;
  }

  function minimax(board, depth, alpha, beta, maximizing, color) {
    if (depth === 0 || gameStatus !== 'active') return evaluateBoard(board, color);
    const moves = [];
    const playerColor = maximizing ? 'black' : 'white';
    for (const { piece, row: r, col: c } of piecePositions[playerColor]) {
      const validMoves = getValidMoves(piece, r, c, board, piecePositions);
      for (const [toR, toC] of validMoves) moves.push([r, c, toR, toC]);
    }
    if (moves.length === 0) return evaluateBoard(board, color);
    if (maximizing) {
      let maxEval = -Infinity;
      for (const [fromR, fromC, toR, toC] of moves) {
        const newBoard = simulateMove(board, fromR, fromC, toR, toC);
        const evalScore = minimax(newBoard, depth - 1, alpha, beta, false, color);
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const [fromR, fromC, toR, toC] of moves) {
        const newBoard = simulateMove(board, fromR, fromC, toR, toC);
        const evalScore = minimax(newBoard, depth - 1, alpha, beta, true, color);
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  function hasLegalMoves(board, color, piecePositions) {
    for (const { piece, row: r, col: c } of piecePositions[color]) {
      const moves = getValidMoves(piece, r, c, board, piecePositions);
      if (moves.length > 0) {
        console.log(`Legal moves found for ${piece.type} at (${r}, ${c}):`, moves);
        return true;
      }
    }
    console.log(`No legal moves found for ${color}`);
    return false;
  }

  function hasEscapeFromCheck(board, color, piecePositions) {
    if (!isKingInCheck(board, color, piecePositions)) return true;
    return hasLegalMoves(board, color, piecePositions);
  }

  function generateRandomPieceSet(mode) {
    const pieces = [];
    const maxPawns = 6;
    if (mode === 'randomSame') {
      const probs = [
        { type: 'pawn', prob: 0.3 },
        { type: 'knight', prob: 0.2 },
        { type: 'bishop', prob: 0.2 },
        { type: 'rook', prob: 0.2 },
        { type: 'queen', prob: 0.1 },
      ];
      while (pieces.length < 15) {
        let rand = Math.random();
        let cumulative = 0;
        for (const p of probs) {
          cumulative += p.prob;
          if (rand <= cumulative && (p.type !== 'pawn' || pieces.filter(x => x === 'pawn').length < maxPawns)) {
            pieces.push(p.type);
            break;
          }
        }
      }
    } else if (mode === 'randomDifferent') {
      const available = ['pawn', 'knight', 'bishop', 'rook', 'queen'];
      let points = 0;
      let retries = 0;
      while (pieces.length < 15 && retries < 100) {
        const remaining = 15 - pieces.length;
        const maxPoints = 39 - points;
        const validPieces = available.filter(
          p =>
            pieceValues[p] <= maxPoints &&
            (remaining === 1 ? pieceValues[p] === maxPoints : true) &&
            (p !== 'pawn' || pieces.filter(x => x === 'pawn').length < maxPawns)
        );
        if (!validPieces.length) {
          if (pieces.length > 0) points -= pieceValues[pieces.pop()];
          retries++;
          continue;
        }
        const piece = validPieces[Math.floor(Math.random() * validPieces.length)];
        pieces.push(piece);
        points += pieceValues[piece];
      }
      if (pieces.length !== 15 || points !== 39) return generateRandomPieceSet(mode);
    } else if (mode === 'randomCrazy') {
      const available = ['pawn', 'knight', 'bishop', 'rook', 'queen'];
      while (pieces.length < 15) {
        const piece = available[Math.floor(Math.random() * 5)];
        if (piece !== 'pawn' || pieces.filter(x => x === 'pawn').length < maxPawns) pieces.push(piece);
      }
    }
    return pieces;
  }

  function placePiecesRandomly(board, color, nonKingPieces) {
    if (nonKingPieces.length !== 15) throw new Error('Must have exactly 15 non-king pieces');
    const firstRank = color === 'white' ? 7 : 0;
    const secondRank = color === 'white' ? 6 : 1;
    const kingFile = 4;
    board[firstRank][kingFile] = { type: 'king', color };
    const positions = [];
    for (let c = 0; c < 8; c++) {
      if (c !== kingFile) positions.push([firstRank, c]);
      positions.push([secondRank, c]);
    }
    shuffleArray(positions);
    for (let i = 0; i < 15; i++) {
      const [r, c] = positions[i];
      board[r][c] = { type: nonKingPieces[i], color };
    }
    return board;
  }

  function initializeBoard(mode) {
    const maxRetries = 10;
    let retries = 0;
    let board, whiteSet, blackSet;

    while (retries < maxRetries) {
      board = Array(8).fill().map(() => Array(8).fill(null));
      whiteSet = [];
      blackSet = [];

      if (mode === 'standard') {
        for (let i = 0; i < 8; i++) {
          board[1][i] = { type: 'pawn', color: 'black' };
          board[6][i] = { type: 'pawn', color: 'white' };
        }
        const backRank = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
        for (let i = 0; i < 8; i++) {
          board[0][i] = { type: backRank[i], color: 'black' };
          board[7][i] = { type: backRank[i], color: 'white' };
        }
        whiteSet = blackSet = ['king', 'queen', ...Array(2).fill('rook'), ...Array(2).fill('knight'), ...Array(2).fill('bishop'), ...Array(8).fill('pawn')];
      } else if (mode === 'randomSame') {
        const pieces = generateRandomPieceSet(mode);
        placePiecesRandomly(board, 'white', pieces);
        placePiecesRandomly(board, 'black', pieces);
        whiteSet = blackSet = ['king', ...pieces];
      } else if (mode === 'randomDifferent' || mode === 'randomCrazy') {
        const whiteP = generateRandomPieceSet(mode);
        const blackP = generateRandomPieceSet(mode);
        placePiecesRandomly(board, 'white', whiteP);
        placePiecesRandomly(board, 'black', blackP);
        whiteSet = ['king', ...whiteP];
        blackSet = ['king', ...blackP];
      }

      const piecePositions = { white: [], black: [] };
      board.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell) {
            piecePositions[cell.color].push({ piece: cell, row: r, col: c });
          }
        });
      });

      const whiteInCheck = isKingInCheck(board, 'white', piecePositions);
      const blackInCheck = isKingInCheck(board, 'black', piecePositions);
      const whiteCanEscape = hasEscapeFromCheck(board, 'white', piecePositions);
      const blackCanEscape = hasEscapeFromCheck(board, 'black', piecePositions);

      if (!whiteInCheck && !blackInCheck && whiteCanEscape && blackCanEscape) {
        return { board, whiteSet, blackSet };
      }

      console.log("Regenerating board because a king is in check or a side cannot escape check at the start...");
      retries++;
    }

    throw new Error('Failed to generate a valid board after maximum retries');
  }

  // Suppress the warning for initializeBoard since it's a stable function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const { whiteSet, blackSet } = initializeBoard(gameMode);
    setWhitePieces(whiteSet);
    setBlackPieces(blackSet);
    // Update piece positions
    const newPiecePositions = { white: [], black: [] };
    board.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          newPiecePositions[cell.color].push({ piece: cell, row: r, col: c });
        }
      });
    });
    setPiecePositions(newPiecePositions);
  }, [gameMode, board]);

  // Suppress the warning for getValidMoves, isKingInCheck, minimax, and pieceValues since they are stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const makeAiMove = useCallback(() => {
    const startTime = Date.now();
    const timeout = 5000;
    const moves = [];
    for (const { piece, row: r, col: c } of piecePositions.black) {
      const validMoves = getValidMoves(piece, r, c, board, piecePositions);
      for (const [toR, toC] of validMoves) {
        moves.push([r, c, toR, toC]);
      }
    }
    console.log(`AI found ${moves.length} moves:`, moves);
    if (!moves.length) {
      const inCheck = isKingInCheck(board, 'black', piecePositions);
      setGameStatus(inCheck ? 'checkmate' : 'stalemate');
      setMessage(inCheck ? 'Checkmate! White wins!' : 'Stalemate! Draw.');
      setAiThinking(false);
      return;
    }
    let move = moves[Math.floor(Math.random() * moves.length)];
    if (aiDifficulty === 'easy') {
      move = moves[Math.floor(Math.random() * moves.length)];
    } else if (aiDifficulty === 'medium') {
      const scoredMoves = moves.map(([fromR, fromC, toR, toC]) => {
        let score = 0;
        if (board[toR][toC]) score += pieceValues[board[toR][toC].type] * 10;
        const dist = Math.abs(toR - 3.5) + Math.abs(toC - 3.5);
        score += (4 - dist);
        return { fromR, fromC, toR, toC, score };
      });
      scoredMoves.sort((a, b) => b.score - a.score);
      if (scoredMoves.length > 0) {
        move = [scoredMoves[0].fromR, scoredMoves[0].fromC, scoredMoves[0].toR, scoredMoves[0].toC];
      }
    } else if (aiDifficulty === 'hard') {
      let bestScore = -Infinity;
      let bestMove = moves[0];
      for (const [fromR, fromC, toR, toC] of moves) {
        const testBoard = simulateMove(board, fromR, fromC, toR, toC);
        const score = minimax(testBoard, 1, -Infinity, Infinity, false, 'black');
        if (score > bestScore) {
          bestScore = score;
          bestMove = [fromR, fromC, toR, toC];
        }
        if (Date.now() - startTime > timeout) {
          console.log('AI timeout, using best move so far');
          break;
        }
      }
      move = bestMove;
    }
    if (move) {
      console.log(`AI selected move: ${board[move[0]][move[1]].type} from (${move[0]}, ${move[1]}) to (${move[2]}, ${move[3]})`);
      movePiece(...move);
    } else {
      console.error('AI failed to select a move, using random move');
      move = moves[Math.floor(Math.random() * moves.length)];
      movePiece(...move);
    }
    setAiThinking(false);
  }, [board, aiDifficulty, piecePositions, setGameStatus, setMessage, setAiThinking, movePiece]);

  useEffect(() => {
    if (opponent === 'ai' && currentTurn === 'black' && (gameStatus === 'active' || gameStatus === 'check') && !aiThinking) {
      setAiThinking(true);
      setTimeout(() => {
        try {
          makeAiMove();
        } catch (error) {
          console.error('AI move failed:', error);
          setAiThinking(false);
          setGameStatus('error');
          setMessage('AI failed to move. Please start a new game.');
        }
      }, 500);
    }
  }, [currentTurn, gameStatus, opponent, aiThinking, makeAiMove]);

  function handleSquareClick(row, col) {
    console.log(`Square clicked: (${row}, ${col}), gameStatus: ${gameStatus}, aiThinking: ${aiThinking}, currentTurn: ${currentTurn}`);
    if (!(gameStatus === 'active' || gameStatus === 'check') || aiThinking) {
      console.log("Cannot move: game not active/check or AI is thinking");
      return;
    }
    if (opponent === 'ai' && currentTurn === 'black') {
      console.log("Cannot move: it's the AI's turn");
      return;
    }
    if (!selectedPiece && board[row][col] && board[row][col].color === currentTurn) {
      console.log(`Selected piece: ${board[row][col].type} at (${row}, ${col})`);
      setSelectedPiece({ row, col });
      return;
    }
    if (selectedPiece) {
      if (selectedPiece.row === row && selectedPiece.col === col) {
        console.log("Deselected piece");
        setSelectedPiece(null);
        return;
      }
      if (board[row][col]?.color === currentTurn) {
        console.log(`Changed selection to: ${board[row][col].type} at (${row}, ${col})`);
        setSelectedPiece({ row, col });
        return;
      }
      const validMoves = getValidMoves(board[selectedPiece.row][selectedPiece.col], selectedPiece.row, selectedPiece.col, board, piecePositions);
      console.log(`Valid moves for selected piece:`, validMoves);
      if (validMoves.some(([r, c]) => r === row && c === col)) {
        console.log(`Moving piece from (${selectedPiece.row}, ${selectedPiece.col}) to (${row}, ${col})`);
        movePiece(selectedPiece.row, selectedPiece.col, row, col);
        setSelectedPiece(null);
      } else {
        console.log(`Invalid move to (${row}, ${col})`);
      }
    }
  }

  function movePiece(fromR, fromC, toR, toC) {
    const newBoard = simulateMove(board, fromR, fromC, toR, toC);
    const piece = board[fromR][fromC];
    const nextTurn = currentTurn === 'white' ? 'black' : 'white';
    setBoard(newBoard);
    setMoveHistory(prev => [...prev, `${piece.type} ${String.fromCharCode(97 + fromC)}${8 - fromR} to ${String.fromCharCode(97 + toC)}${8 - toR}`]);
    setCurrentTurn(nextTurn);
    // Update piece positions
    const newPiecePositions = updatePiecePositions(newBoard);
    setPiecePositions(newPiecePositions);
    updateGameStatus(newBoard, nextTurn, newPiecePositions);
  }

  function updateGameStatus(boardState, nextTurn, piecePositionsState) {
    const inCheck = isKingInCheck(boardState, nextTurn, piecePositionsState);
    const hasMoves = hasLegalMoves(boardState, nextTurn, piecePositionsState);

    console.log(`Updating game status: nextTurn=${nextTurn}, inCheck=${inCheck}, hasLegalMoves=${hasMoves}`);

    if (!hasMoves) {
      if (inCheck) {
        setGameStatus('checkmate');
        setMessage(`Checkmate! ${nextTurn === 'white' ? 'Black' : 'White'} wins!`);
      } else {
        setGameStatus('stalemate');
        setMessage('Stalemate! Draw.');
      }
    } else {
      if (inCheck) {
        setGameStatus('check');
        setMessage(`${nextTurn} is in check!`);
      } else {
        setGameStatus('active');
        setMessage(`${nextTurn === 'white' ? 'White' : 'Black'} to move${opponent === 'ai' && nextTurn === 'black' ? ' (AI thinking...)' : ''}`);
      }
    }
  }

  function resetGame() {
    const { board, whiteSet, blackSet } = initializeBoard(gameMode);
    setBoard(board);
    setWhitePieces(whiteSet);
    setBlackPieces(blackSet);
    setSelectedPiece(null);
    setCurrentTurn('white');
    setGameStatus('active');
    setMoveHistory([]);
    setAiThinking(false);
    const newPiecePositions = updatePiecePositions(board);
    setPiecePositions(newPiecePositions);
    updateGameStatus(board, 'white', newPiecePositions);
  }

  function getSquareClass(row, col) {
    const isSelected = selectedPiece && selectedPiece.row === row && selectedPiece.col === col;
    const isValidMove = selectedPiece && getValidMoves(board[selectedPiece.row][selectedPiece.col], selectedPiece.row, selectedPiece.col, board, piecePositions).some(([r, c]) => r === row && c === col);
    let className = (row + col) % 2 === 0 ? 'square-light' : 'square-dark';
    className += ' square';
    if (isSelected) className += ' selected';
    else if (isValidMove) className += ' valid-move';
    return className;
  }

  function renderPiece(piece) {
    if (!piece) return null;
    const symbols = {
      white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
      black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' },
    };
    return <div className={`piece ${piece.color}`}>{symbols[piece.color][piece.type]}</div>;
  }

  function summarizePieces(pieces) {
    if (!pieces.length) return 'None';
    const counts = { king: 0, queen: 0, rook: 0, bishop: 0, knight: 0, pawn: 0 };
    pieces.forEach(p => counts[p]++);
    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
      .join(', ');
  }

  return (
    <div className="app-container">
      <div className="game-section">
        <h2 className="title">Random Chess</h2>
        <div className="controls">
          <select value={gameMode} onChange={(e) => { setGameMode(e.target.value); resetGame(); }} className="select">
            <option value="standard">Standard</option>
            <option value="randomSame">Symmetric Random</option>
            <option value="randomDifferent">Asymmetric Random</option>
            <option value="randomCrazy">Crazy Random</option>
          </select>
          <select value={opponent} onChange={(e) => { setOpponent(e.target.value); resetGame(); }} className="select">
            <option value="ai">Vs. AI</option>
            <option value="human">Vs. Human</option>
          </select>
          {opponent === 'ai' && (
            <select value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value)} className="select">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          )}
        </div>
        <div className="status">
          <div className={`message ${gameStatus === 'check' ? 'check' : gameStatus !== 'active' ? 'game-over' : ''}`}>
            {message}
          </div>
          {aiThinking && <div className="thinking">AI thinking...</div>}
        </div>
        <div className="pieces-info">
          <p><strong>White:</strong> {summarizePieces(whitePieces)}</p>
          <p><strong>Black:</strong> {summarizePieces(blackPieces)}</p>
        </div>
        <div className="board-container">
          {board.map((row, r) => (
            <div key={r} className="board-row">
              {row.map((piece, c) => (
                <div key={`${r}-${c}`} className={getSquareClass(r, c)} onClick={() => handleSquareClick(r, c)}>
                  {renderPiece(piece)}
                </div>
              ))}
            </div>
          ))}
        </div>
        <button onClick={resetGame} className="new-game-button">New Game</button>
      </div>
      <div className="history-section">
        <h3 className="history-title">Move History</h3>
        <div className="history-box">
          {moveHistory.length === 0 ? (
            <p className="no-moves">No moves yet</p>
          ) : (
            <ol className="move-list">
              {moveHistory.map((move, i) => (
                <li key={i} className="move-item">{move}</li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChessApp;