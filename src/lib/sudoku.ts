export type SudokuDifficulty = 'easy' | 'medium' | 'hard';
export type Grid = number[][]; // 9x9, 0 = empty

const SIZE = 9;
const BOX = 3;

// Number of cells left blank for each difficulty (out of 81).
const BLANKS: Record<SudokuDifficulty, number> = {
  easy: 36,
  medium: 46,
  hard: 54,
};

function emptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function canPlace(grid: Grid, row: number, col: number, val: number): boolean {
  for (let i = 0; i < SIZE; i++) {
    if (grid[row][i] === val || grid[i][col] === val) return false;
  }
  const boxRow = row - (row % BOX);
  const boxCol = col - (col % BOX);
  for (let r = 0; r < BOX; r++) {
    for (let c = 0; c < BOX; c++) {
      if (grid[boxRow + r][boxCol + c] === val) return false;
    }
  }
  return true;
}

/** Fills an empty grid into a complete, valid, randomized solution via backtracking. */
function fillGrid(grid: Grid): boolean {
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (grid[row][col] !== 0) continue;
      for (const val of shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
        if (canPlace(grid, row, col, val)) {
          grid[row][col] = val;
          if (fillGrid(grid)) return true;
          grid[row][col] = 0;
        }
      }
      return false;
    }
  }
  return true;
}

/** Counts solutions up to `limit` (stops early) — used to confirm a puzzle has exactly one solution. */
function countSolutions(grid: Grid, limit: number): number {
  let count = 0;
  const solve = (): boolean => {
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        if (grid[row][col] !== 0) continue;
        for (let val = 1; val <= 9; val++) {
          if (canPlace(grid, row, col, val)) {
            grid[row][col] = val;
            if (solve()) return true; // early exit once we've hit `limit`
            grid[row][col] = 0;
          }
        }
        return false;
      }
    }
    count++;
    return count >= limit;
  };
  solve();
  return count;
}

function cloneGrid(grid: Grid): Grid {
  return grid.map(row => [...row]);
}

export interface SudokuPuzzle {
  puzzle: Grid;
  solution: Grid;
}

/** Generates a puzzle by solving a full grid, then removing cells one at a time,
 *  only keeping a removal if the puzzle still has exactly one solution. */
export function generateSudoku(difficulty: SudokuDifficulty): SudokuPuzzle {
  const solution = emptyGrid();
  fillGrid(solution);

  const puzzle = cloneGrid(solution);
  const targetBlanks = BLANKS[difficulty];
  const positions = shuffled(
    Array.from({ length: SIZE * SIZE }, (_, i) => [Math.floor(i / SIZE), i % SIZE] as const)
  );

  let blanks = 0;
  for (const [row, col] of positions) {
    if (blanks >= targetBlanks) break;
    const backup = puzzle[row][col];
    puzzle[row][col] = 0;
    const testGrid = cloneGrid(puzzle);
    if (countSolutions(testGrid, 2) === 1) {
      blanks++;
    } else {
      puzzle[row][col] = backup; // removing this cell made it ambiguous — put it back
    }
  }

  return { puzzle, solution };
}

/** True if every filled cell currently matches the solution and no cell is empty. */
export function isSolved(current: Grid, solution: Grid): boolean {
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (current[row][col] !== solution[row][col]) return false;
    }
  }
  return true;
}

/** Cells that conflict with another cell in the same row, column, or box (for gentle error highlighting). */
export function findConflicts(grid: Grid): Set<string> {
  const conflicts = new Set<string>();
  const mark = (cells: [number, number][]) => {
    const seen = new Map<number, [number, number]>();
    for (const [r, c] of cells) {
      const val = grid[r][c];
      if (val === 0) continue;
      if (seen.has(val)) {
        const [pr, pc] = seen.get(val)!;
        conflicts.add(`${pr}-${pc}`);
        conflicts.add(`${r}-${c}`);
      } else {
        seen.set(val, [r, c]);
      }
    }
  };
  for (let i = 0; i < SIZE; i++) {
    mark(Array.from({ length: SIZE }, (_, j) => [i, j] as [number, number])); // row i
    mark(Array.from({ length: SIZE }, (_, j) => [j, i] as [number, number])); // col i
  }
  for (let br = 0; br < SIZE; br += BOX) {
    for (let bc = 0; bc < SIZE; bc += BOX) {
      const cells: [number, number][] = [];
      for (let r = 0; r < BOX; r++) for (let c = 0; c < BOX; c++) cells.push([br + r, bc + c]);
      mark(cells);
    }
  }
  return conflicts;
}
