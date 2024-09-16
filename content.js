// content.js

// Wait for the page to load before initializing the overlay
window.addEventListener('load', () => {
  initInfluenceOverlay();
});

function initInfluenceOverlay() {
  const checkBoardInterval = setInterval(() => {
    const boardContainer = document.querySelector('.cg-wrap');
    if (boardContainer) {
      console.log('Chess board found!');
      clearInterval(checkBoardInterval);
      setupInfluenceOverlay(boardContainer);
    } else {
      console.log('Waiting for chess board to load...');
    }
  }, 500);
}

function setupInfluenceOverlay(boardContainer) {
  // Create a new div to wrap the existing content
  const wrapper = document.createElement('div');

  // Style the wrapper
  wrapper.style.position = 'relative';
  wrapper.style.width = '100%';
  wrapper.style.height = '100%';

  // Move the board container's children into the wrapper
  while (boardContainer.firstChild) {
    wrapper.appendChild(boardContainer.firstChild);
  }

  // Add the wrapper to the board container
  boardContainer.appendChild(wrapper);

  // Create an overlay container
  const overlayContainer = document.createElement('div');
  overlayContainer.classList.add('overlay-container');
  overlayContainer.style.position = 'absolute';
  overlayContainer.style.top = '0';
  overlayContainer.style.left = '0';
  overlayContainer.style.width = '100%';
  overlayContainer.style.height = '100%';
  overlayContainer.style.pointerEvents = 'none'; // Allow clicks to pass through
  overlayContainer.style.zIndex = '1000';

  // Append the overlay container to the board container
  boardContainer.appendChild(overlayContainer);

  // Initial update
  updateInfluence(overlayContainer);

  // Observe changes to the board
  const observer = new MutationObserver(() => {
    updateInfluence(overlayContainer);
  });

  // Observe the wrapper since the pieces are now inside it
  observer.observe(wrapper, { childList: true, subtree: true });
}

function updateInfluence(overlayContainer) {
  const boardContainer = overlayContainer.parentElement;
  const board = boardContainer.querySelector('cg-board');
  const boardRect = board.getBoundingClientRect();
  const boardSize = boardRect.width; // Assuming a square board
  const squareSize = boardSize / 8;

  const pieces = board.querySelectorAll('piece');
  const piecePositions = [];

  pieces.forEach(piece => {
    const type = piece.getAttribute('class'); // e.g., 'white knight'
    const style = piece.getAttribute('style');
    const position = getPositionFromStyle(style, squareSize);

    if (type && position) {
      piecePositions.push({
        type,
        position
      });
    }
  });

  // Uncomment for debugging
  // console.log('Piece Positions:', piecePositions);

  const influenceMap = calculateInfluence(piecePositions);
  // Uncomment for debugging
  // console.log('Influence Map:', influenceMap);

  overlayInfluence(influenceMap, overlayContainer);
}

function getPositionFromStyle(style, squareSize) {
  // Extract the x and y values from the transform
  const transformMatch = /translate\(([\d.-]+)px,\s*([\d.-]+)px\)/.exec(style);
  if (transformMatch) {
    const x = parseFloat(transformMatch[1]);
    const y = parseFloat(transformMatch[2]);

    // Calculate the file and rank indices
    const fileIndex = Math.floor(x / squareSize);
    const rankIndex = 7 - Math.floor(y / squareSize);

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

    if (fileIndex >= 0 && fileIndex <= 7 && rankIndex >= 0 && rankIndex <= 7) {
      return files[fileIndex] + ranks[rankIndex];
    }
  }

  return null;
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

// Helper functions

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

// Move generation functions

function getPawnMoves(fromSquare, color, piecePositions) {
  const moves = [];
  const direction = color === 'white' ? 1 : -1;
  const { file, rank } = squareToCoords(fromSquare);

  // Forward moves (pawns influence squares ahead even if blocked)
  const oneStepRank = rank + direction;
  const oneStepSquare = coordsToSquare(file, oneStepRank);
  if (oneStepSquare) {
    moves.push(oneStepSquare);

    // Initial two-step move
    const initialRank = color === 'white' ? 1 : 6;
    if (rank === initialRank) {
      const twoStepRank = rank + 2 * direction;
      const twoStepSquare = coordsToSquare(file, twoStepRank);
      if (twoStepSquare) {
        moves.push(twoStepSquare);
      }
    }
  }

  // Captures
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

function overlayInfluence(influenceMap, overlayContainer) {
  // Clear existing overlays
  overlayContainer.innerHTML = '';

  // Create overlays for each square with influence
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
      const square = files[file] + ranks[rank];
      const influence = influenceMap[square];

      if (influence) {
        const squareOverlay = document.createElement('div');
        squareOverlay.style.position = 'absolute';
        squareOverlay.style.width = '12.5%';
        squareOverlay.style.height = '12.5%';
        squareOverlay.style.left = `${file * 12.5}%`;
        squareOverlay.style.top = `${(7 - rank) * 12.5}%`;
        squareOverlay.style.backgroundColor = getInfluenceColor(influence);
        overlayContainer.appendChild(squareOverlay);
      }
    }
  }
}

function getInfluenceColor(influence) {
  const whiteInfluence = influence.white || 0;
  const blackInfluence = influence.black || 0;

  const maxInfluence = Math.max(whiteInfluence, blackInfluence);
  const opacity = Math.min(maxInfluence / 5, 0.8);

  let color = 'transparent';
  if (whiteInfluence > blackInfluence) {
    color = `rgba(0, 0, 255, ${opacity})`; // Blue for white influence
  } else if (blackInfluence > whiteInfluence) {
    color = `rgba(255, 0, 0, ${opacity})`; // Red for black influence
  } else if (whiteInfluence === blackInfluence && whiteInfluence > 0) {
    color = `rgba(128, 0, 128, ${opacity})`; // Purple for equal influence
  }

  return color;
}