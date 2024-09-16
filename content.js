// content.js

window.addEventListener('load', () => {
    initInfluenceOverlay();
  });
  
  function initInfluenceOverlay() {
    const board = document.querySelector('.cg-board');
    if (!board) {
      console.error('Chess board not found.');
      return;
    }
  
    // Initial update
    updateInfluence();
  
    // Observe changes to the board
    const observer = new MutationObserver(() => {
      updateInfluence();
    });
  
    observer.observe(board, { childList: true, subtree: true });
  }
  
  function updateInfluence() {
    const pieces = document.querySelectorAll('.cg-board piece');
    const piecePositions = [];
  
    pieces.forEach(piece => {
      const type = piece.getAttribute('class'); // e.g., 'white knight'
      const position = piece.parentElement.getAttribute('data-key'); // e.g., 'e4'
  
      if (type && position) {
        piecePositions.push({
          type,
          position
        });
      }
    });
  
    const influenceMap = calculateInfluence(piecePositions);
    overlayInfluence(influenceMap);
  }
  
  function calculateInfluence(piecePositions) {
    const influenceMap = {};
  
    piecePositions.forEach(piece => {
      const { type, position } = piece;
      const [color, ...typeParts] = type.split(' ');
      const pieceType = typeParts.join(' ');
      const fromSquare = position;
  
      const moves = getPieceMoves(pieceType, fromSquare, color, piecePositions);
  
      moves.forEach(move => {
        if (!influenceMap[move]) {
          influenceMap[move] = { white: 0, black: 0 };
        }
        influenceMap[move][color] += 1;
      });
    });
  
    return influenceMap;
  }
  
  function getPieceMoves(pieceType, fromSquare, color, piecePositions) {
    switch (pieceType) {
      case 'pawn':
        return getPawnMoves(fromSquare, color, piecePositions);
      case 'knight':
        return getKnightMoves(fromSquare);
      case 'bishop':
        return getBishopMoves(fromSquare, color, piecePositions);
      case 'rook':
        return getRookMoves(fromSquare, color, piecePositions);
      case 'queen':
        return getQueenMoves(fromSquare, color, piecePositions);
      case 'king':
        return getKingMoves(fromSquare);
      default:
        return [];
    }
  }
  
  // Helper functions and move generation functions
  
  function squareToCoords(square) {
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0); // 0 to 7
    const rank = parseInt(square[1], 10) - 1; // 0 to 7
    return { file, rank };
  }
  
  function coordsToSquare(file, rank) {
    if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
    const fileChar = String.fromCharCode('a'.charCodeAt(0) + file);
    const square = fileChar + (rank + 1);
    return square;
  }
  
  function isOccupied(square, piecePositions) {
    return piecePositions.some(piece => piece.position === square);
  }
  
  function isOccupiedByOpponent(square, color, piecePositions) {
    return piecePositions.some(piece => {
      const [pieceColor] = piece.type.split(' ');
      return piece.position === square && pieceColor !== color;
    });
  }
  
  function getPawnMoves(fromSquare, color, piecePositions) {
    const moves = [];
    const direction = color === 'white' ? 1 : -1;
    const { file, rank } = squareToCoords(fromSquare);
  
    // Forward moves
    const oneStepRank = rank + direction;
    const oneStepSquare = coordsToSquare(file, oneStepRank);
    if (oneStepSquare && !isOccupied(oneStepSquare, piecePositions)) {
      moves.push(oneStepSquare);
  
      // Initial two-step move
      const initialRank = color === 'white' ? 1 : 6;
      if (rank === initialRank) {
        const twoStepRank = rank + 2 * direction;
        const twoStepSquare = coordsToSquare(file, twoStepRank);
        if (twoStepSquare && !isOccupied(twoStepSquare, piecePositions)) {
          moves.push(twoStepSquare);
        }
      }
    }
  
    // Captures (influence squares even if not capturing)
    [file - 1, file + 1].forEach(f => {
      const captureSquare = coordsToSquare(f, rank + direction);
      if (captureSquare) {
        moves.push(captureSquare);
      }
    });
  
    return moves;
  }
  
  function getKnightMoves(fromSquare) {
    const moves = [];
    const { file, rank } = squareToCoords(fromSquare);
    const deltas = [
      [1, 2], [2, 1], [-1, 2], [-2, 1],
      [1, -2], [2, -1], [-1, -2], [-2, -1]
    ];
  
    deltas.forEach(delta => {
      const [df, dr] = delta;
      const targetSquare = coordsToSquare(file + df, rank + dr);
      if (targetSquare) {
        moves.push(targetSquare);
      }
    });
  
    return moves;
  }
  
  function getBishopMoves(fromSquare, color, piecePositions) {
    return getSlidingMoves(fromSquare, color, piecePositions, [
      [1, 1], [1, -1], [-1, 1], [-1, -1]
    ]);
  }
  
  function getRookMoves(fromSquare, color, piecePositions) {
    return getSlidingMoves(fromSquare, color, piecePositions, [
      [1, 0], [-1, 0], [0, 1], [0, -1]
    ]);
  }
  
  function getQueenMoves(fromSquare, color, piecePositions) {
    return getSlidingMoves(fromSquare, color, piecePositions, [
      [1, 1], [1, -1], [-1, 1], [-1, -1],
      [1, 0], [-1, 0], [0, 1], [0, -1]
    ]);
  }
  
  function getKingMoves(fromSquare) {
    const moves = [];
    const { file, rank } = squareToCoords(fromSquare);
    const deltas = [
      [1, 1], [1, -1], [-1, 1], [-1, -1],
      [1, 0], [-1, 0], [0, 1], [0, -1]
    ];
  
    deltas.forEach(delta => {
      const [df, dr] = delta;
      const targetSquare = coordsToSquare(file + df, rank + dr);
      if (targetSquare) {
        moves.push(targetSquare);
      }
    });
  
    return moves;
  }
  
  function getSlidingMoves(fromSquare, color, piecePositions, directions) {
    const moves = [];
    const { file, rank } = squareToCoords(fromSquare);
  
    directions.forEach(direction => {
      let [df, dr] = direction;
      let f = file + df;
      let r = rank + dr;
  
      while (f >= 0 && f <= 7 && r >= 0 && r <= 7) {
        const square = coordsToSquare(f, r);
        if (square) {
          moves.push(square);
          if (isOccupied(square, piecePositions)) {
            // Stop if there's a piece blocking
            break;
          }
        }
        f += df;
        r += dr;
      }
    });
  
    return moves;
  }
  
  function overlayInfluence(influenceMap) {
    // Remove existing overlays
    document.querySelectorAll('.influence-overlay').forEach(el => el.remove());
  
    Object.keys(influenceMap).forEach(square => {
      const squareElement = document.querySelector(`.cg-board .square[data-key='${square}']`);
      if (!squareElement) return;
  
      const overlay = document.createElement('div');
      overlay.classList.add('influence-overlay');
      squareElement.appendChild(overlay);
  
      const influence = influenceMap[square];
      const color = getInfluenceColor(influence);
      overlay.style.backgroundColor = color;
    });
  }
  
  function getInfluenceColor(influence) {
    const whiteInfluence = influence.white || 0;
    const blackInfluence = influence.black || 0;
  
    const maxInfluence = Math.max(whiteInfluence, blackInfluence);
    const opacity = Math.min(maxInfluence / 5, 0.8);
  
    let color = 'transparent';
    if (whiteInfluence > blackInfluence) {
      color = `rgba(0, 0, 255, ${opacity})`; // Blue for white
    } else if (blackInfluence > whiteInfluence) {
      color = `rgba(255, 0, 0, ${opacity})`; // Red for black
    } else if (whiteInfluence === blackInfluence && whiteInfluence > 0) {
      color = `rgba(128, 0, 128, ${opacity})`; // Purple for equal influence
    }
  
    return color;
  }
  