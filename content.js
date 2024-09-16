// content.js

window.addEventListener('load', () => {
    initInfluenceOverlay();
  });
  
  function initInfluenceOverlay() {
    const board = document.querySelector('cg-board');
    if (!board) return;
  
    const observer = new MutationObserver(mutations => {
      if (window.influenceUpdateTimeout) clearTimeout(window.influenceUpdateTimeout);
      window.influenceUpdateTimeout = setTimeout(() => {
        updateInfluence();
      }, 100);
    });
  
    observer.observe(board, { childList: true, subtree: true });
  
    // Initial update
    updateInfluence();
  }
  
  function updateInfluence() {
    const pieces = document.querySelectorAll('piece');
    const piecePositions = [];
  
    pieces.forEach(piece => {
      const type = piece.getAttribute('class'); // e.g., 'white pawn'
      const position = piece.parentElement.getAttribute('class'); // e.g., 'square e4'
  
      piecePositions.push({
        type,
        position
      });
    });
  
    const influenceMap = calculateInfluence(piecePositions);
    overlayInfluence(influenceMap);
  }
  
  function calculateInfluence(piecePositions) {
    const influenceMap = {};
  
    piecePositions.forEach(piece => {
      const { type, position } = piece;
      const [color, pieceType] = type.split(' ');
      const fromSquare = position.split(' ')[1];
  
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
        return getKnightMoves(fromSquare, color);
      case 'bishop':
        return getBishopMoves(fromSquare, color, piecePositions);
      case 'rook':
        return getRookMoves(fromSquare, color, piecePositions);
      case 'queen':
        return getQueenMoves(fromSquare, color, piecePositions);
      case 'king':
        return getKingMoves(fromSquare, color);
      default:
        return [];
    }
  }
  
  // Helper functions and move generation functions as implemented above
  
  // ... (Include all helper functions and move generation functions here)
  function isOccupied(square, piecePositions) {
    return piecePositions.some(piece => {
      const position = piece.position.split(' ')[1];
      return position === square;
    });
  }
  
  function isOccupiedByOpponent(square, color, piecePositions) {
    return piecePositions.some(piece => {
      const position = piece.position.split(' ')[1];
      const [pieceColor] = piece.type.split(' ');
      return position === square && pieceColor !== color;
    });
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

  function getKingMoves(fromSquare, color) {
    const moves = [];
    const { file, rank } = squareToCoords(fromSquare);
    const deltas = [
      [1, 0], [-1, 0], [0, 1], [0, -1],
      [1, 1], [1, -1], [-1, 1], [-1, -1]
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

  function getQueenMoves(fromSquare, color, piecePositions) {
    return getSlidingMoves(fromSquare, color, piecePositions, [
      [1, 0], [-1, 0], [0, 1], [0, -1],
      [1, 1], [1, -1], [-1, 1], [-1, -1]
    ]);
  }

  function getRookMoves(fromSquare, color, piecePositions) {
    return getSlidingMoves(fromSquare, color, piecePositions, [
      [1, 0], [-1, 0], [0, 1], [0, -1]
    ]);
  }

  function getBishopMoves(fromSquare, color, piecePositions) {
    return getSlidingMoves(fromSquare, color, piecePositions, [
      [1, 1], [1, -1], [-1, 1], [-1, -1]
    ]);
  }

  function getKnightMoves(fromSquare, color) {
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

  function getPawnMoves(fromSquare, color, piecePositions) {
    const moves = [];
    const direction = color === 'white' ? 1 : -1;
    const { file, rank } = squareToCoords(fromSquare);
  
    // Forward move
    const oneStep = coordsToSquare(file, rank + direction);
    if (oneStep && !isOccupied(oneStep, piecePositions)) {
      moves.push(oneStep);
  
      // Initial two-step move
      const initialRank = color === 'white' ? 1 : 6;
      if (rank === initialRank) {
        const twoStep = coordsToSquare(file, rank + 2 * direction);
        if (twoStep && !isOccupied(twoStep, piecePositions)) {
          moves.push(twoStep);
        }
      }
    }
  
    // Captures
    const captureFiles = [file - 1, file + 1];
    captureFiles.forEach(f => {
      const captureSquare = coordsToSquare(f, rank + direction);
      if (captureSquare) {
        if (isOccupiedByOpponent(captureSquare, color, piecePositions)) {
          moves.push(captureSquare);
        }
        // Pawns also influence squares diagonally even if not capturing
        else {
          moves.push(captureSquare);
        }
      }
    });
  
    return moves;
  }

// Helper function to convert square (e.g., 'e4') to file and rank indices
function squareToCoords(square) {
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0); // 0 to 7
    const rank = parseInt(square[1], 10) - 1; // 0 to 7
    return { file, rank };
  }
  
  // Helper function to convert file and rank indices to square (e.g., 'e4')
  function coordsToSquare(file, rank) {
    if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
    const fileChar = String.fromCharCode('a'.charCodeAt(0) + file);
    const square = fileChar + (rank + 1);
    return square;
  }
  

  
  
  // Overlay functions remain the same
  function overlayInfluence(influenceMap) {
    Object.keys(influenceMap).forEach(square => {
      const squareElement = document.querySelector(`.cg-board .square.${square}`);
      if (!squareElement) return;
  
      let overlay = squareElement.querySelector('.influence-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.classList.add('influence-overlay');
        squareElement.appendChild(overlay);
      }
  
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
      color = `rgba(0, 0, 255, ${opacity})`;
    } else if (blackInfluence > whiteInfluence) {
      color = `rgba(255, 0, 0, ${opacity})`;
    } else if (whiteInfluence === blackInfluence && whiteInfluence > 0) {
      color = `rgba(128, 0, 128, ${opacity})`;
    }
  
    return color;
  }
  