export const GRID_SIZE = 6;

// 빈 보드 생성
export function createEmptyBoard() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}

let nextTileId = 1;

export function createTile(value, row, col, isNew = true) {
  return {
    id: nextTileId++,
    value,
    row,
    col,
    isNew,
    isMerged: false,
  };
}

// 빈 셀 좌표들 찾기
export function getEmptyCells(board) {
  const cells = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!board[r][c]) {
        cells.push({ r, c });
      }
    }
  }
  return cells;
}

// 랜덤 타일 스폰 (90% 확률 2, 10% 확률 4)
export function spawnRandomTile(board) {
  const emptyCells = getEmptyCells(board);
  if (emptyCells.length === 0) return { newBoard: board, spawned: null };

  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  const tile = createTile(value, randomCell.r, randomCell.c, true);

  const newBoard = board.map((row) => [...row]);
  newBoard[randomCell.r][randomCell.c] = tile;

  return { newBoard, spawned: tile };
}

// 새 게임 초기화 (2개 타일 생성)
export function initGame() {
  let board = createEmptyBoard();
  const first = spawnRandomTile(board);
  board = first.newBoard;
  const second = spawnRandomTile(board);
  board = second.newBoard;
  return board;
}

// 한 줄 슬라이드 및 병합 (왼쪽 방향 기준)
function slideAndMergeRow(rowTiles, rowIndex) {
  const nonNull = rowTiles.filter((tile) => tile !== null);
  const result = [];
  let scoreGained = 0;
  let mergedAny = false;
  let highestMergedValue = 0;

  let i = 0;
  while (i < nonNull.length) {
    if (i + 1 < nonNull.length && nonNull[i].value === nonNull[i + 1].value) {
      const mergedVal = nonNull[i].value * 2;
      scoreGained += mergedVal;
      mergedAny = true;
      if (mergedVal > highestMergedValue) highestMergedValue = mergedVal;

      result.push({
        ...createTile(mergedVal, rowIndex, result.length, false),
        isMerged: true,
      });
      i += 2;
    } else {
      result.push({
        ...nonNull[i],
        row: rowIndex,
        col: result.length,
        isNew: false,
        isMerged: false,
      });
      i += 1;
    }
  }

  while (result.length < GRID_SIZE) {
    result.push(null);
  }

  return { resultRow: result, scoreGained, mergedAny, highestMergedValue };
}

// 보드 회전 (90도 시계방향)
function rotateClockwise(board) {
  const rotated = createEmptyBoard();
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      rotated[c][GRID_SIZE - 1 - r] = board[r][c];
    }
  }
  return rotated;
}

// 보드 회전 (90도 반시계방향)
function rotateCounterClockwise(board) {
  const rotated = createEmptyBoard();
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      rotated[GRID_SIZE - 1 - c][r] = board[r][c];
    }
  }
  return rotated;
}

// 보드 180도 회전
function rotate180(board) {
  const rotated = createEmptyBoard();
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      rotated[GRID_SIZE - 1 - r][GRID_SIZE - 1 - c] = board[r][c];
    }
  }
  return rotated;
}

// 방향별 이동 실행
export function moveBoard(board, direction) {
  let rotatedBoard = board;
  let rotations = 0;

  // 모든 이동을 왼쪽으로 통일하기 위한 회전
  if (direction === 'LEFT') {
    rotations = 0;
  } else if (direction === 'RIGHT') {
    rotations = 2;
    rotatedBoard = rotate180(board);
  } else if (direction === 'UP') {
    rotations = 3;
    rotatedBoard = rotateCounterClockwise(board);
  } else if (direction === 'DOWN') {
    rotations = 1;
    rotatedBoard = rotateClockwise(board);
  }

  let totalScore = 0;
  let hasMerged = false;
  let maxMergedValue = 0;
  const processedBoard = createEmptyBoard();

  for (let r = 0; r < GRID_SIZE; r++) {
    const { resultRow, scoreGained, mergedAny, highestMergedValue } = slideAndMergeRow(
      rotatedBoard[r],
      r
    );
    processedBoard[r] = resultRow;
    totalScore += scoreGained;
    if (mergedAny) hasMerged = true;
    if (highestMergedValue > maxMergedValue) maxMergedValue = highestMergedValue;
  }

  // 원래 방향으로 복원
  let finalBoard = processedBoard;
  if (rotations === 2) {
    finalBoard = rotate180(processedBoard);
  } else if (rotations === 3) {
    finalBoard = rotateClockwise(processedBoard);
  } else if (rotations === 1) {
    finalBoard = rotateCounterClockwise(processedBoard);
  }

  // 좌표(row, col) 재동기화
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (finalBoard[r][c]) {
        finalBoard[r][c].row = r;
        finalBoard[r][c].col = c;
      }
    }
  }

  // 이동이 실제로 일어났는지 체크 (값의 변화 또는 위치 변화)
  let moved = false;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const oldTile = board[r][c];
      const newTile = finalBoard[r][c];
      if ((oldTile && !newTile) || (!oldTile && newTile)) {
        moved = true;
        break;
      }
      if (oldTile && newTile && oldTile.value !== newTile.value) {
        moved = true;
        break;
      }
    }
    if (moved) break;
  }

  return {
    board: finalBoard,
    moved,
    scoreGained: totalScore,
    hasMerged,
    maxMergedValue,
  };
}

// 게임 오버 여부 판정
export function checkGameOver(board) {
  // 1. 빈 칸이 하나라도 있으면 아직 게임오버 아님
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!board[r][c]) return false;
    }
  }

  // 2. 가로/세로 인접 칸에 같은 숫자가 있으면 합칠 수 있으므로 게임오버 아님
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const current = board[r][c].value;
      // 오른쪽 검사
      if (c + 1 < GRID_SIZE && board[r][c + 1]?.value === current) return false;
      // 아래쪽 검사
      if (r + 1 < GRID_SIZE && board[r + 1][c]?.value === current) return false;
    }
  }

  return true;
}

