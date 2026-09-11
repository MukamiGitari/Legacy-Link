import React, { useMemo, useState } from 'react';
import { ArrowLeft, RotateCcw, Sparkles, Grid3x3, Eraser } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateSudoku, isSolved, findConflicts, type SudokuDifficulty, type Grid } from '../../lib/sudoku';

// Points awarded on a solve, by difficulty — harder puzzles are worth more on the
// combined family leaderboard.
const SOLVE_POINTS: Record<SudokuDifficulty, number> = { easy: 30, medium: 50, hard: 80 };

type Stage = 'menu' | 'playing' | 'solved';

const DIFFICULTIES: { key: SudokuDifficulty; label: string; blurb: string }[] = [
  { key: 'easy', label: 'Easy', blurb: 'A relaxed round, good for a first try.' },
  { key: 'medium', label: 'Medium', blurb: 'A fair challenge for regular players.' },
  { key: 'hard', label: 'Hard', blurb: 'Few clues — for the family sudoku champion.' },
];

/** True if placing `val` at (row, col) wouldn't repeat a number already in that
 *  row, column, or 3x3 box. Erasing (val === 0) is always allowed. */
function isPlacementValid(board: Grid, row: number, col: number, val: number): boolean {
  if (val === 0) return true;
  for (let i = 0; i < 9; i++) {
    if (i !== col && board[row][i] === val) return false;
    if (i !== row && board[i][col] === val) return false;
  }
  const boxRow = row - (row % 3);
  const boxCol = col - (col % 3);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if ((boxRow + r !== row || boxCol + c !== col) && board[boxRow + r][boxCol + c] === val) return false;
    }
  }
  return true;
}

export const Sudoku: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { recordGameScore } = useApp();
  const [stage, setStage] = useState<Stage>('menu');
  const [difficulty, setDifficulty] = useState<SudokuDifficulty>('easy');
  const [givens, setGivens] = useState<Grid | null>(null);
  const [solution, setSolution] = useState<Grid | null>(null);
  const [board, setBoard] = useState<Grid | null>(null);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [blockedCell, setBlockedCell] = useState<string | null>(null);

  const start = (diff: SudokuDifficulty) => {
    const { puzzle, solution: sol } = generateSudoku(diff);
    setDifficulty(diff);
    setGivens(puzzle);
    setSolution(sol);
    setBoard(puzzle.map(row => [...row]));
    setSelected(null);
    setStage('playing');
  };

  const conflicts = useMemo(() => (board ? findConflicts(board) : new Set<string>()), [board]);

  const setCell = (val: number) => {
    if (!board || !givens || !selected) return;
    const [row, col] = selected;
    if (givens[row][col] !== 0) return; // can't overwrite an original clue
    // A number that already appears in this row, column, or box is rejected outright
    // rather than just highlighted in red — so the board can never end up showing the
    // same number twice in one line.
    if (!isPlacementValid(board, row, col, val)) {
      setBlockedCell(`${row}-${col}`);
      setTimeout(() => setBlockedCell(null), 400);
      return;
    }
    const next = board.map(r => [...r]);
    next[row][col] = val;
    setBoard(next);
    if (solution && isSolved(next, solution)) {
      recordGameScore('sudoku', SOLVE_POINTS[difficulty]);
      setStage('solved');
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-heritage-green-600 dark:text-heritage-dark-muted hover:text-heritage-green-900 dark:hover:text-heritage-dark-text"
      >
        <ArrowLeft size={14} /> Back to games
      </button>

      {stage === 'menu' && (
        <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-8 max-w-lg mx-auto text-center">
          <Grid3x3 size={28} className="text-heritage-gold-500 mx-auto mb-3" />
          <p className="font-serif text-2xl text-heritage-green-900 dark:text-heritage-dark-text mb-2">Sudoku</p>
          <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted mb-6">
            A classic number puzzle to unwind with between family updates. Pick a difficulty to start.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {DIFFICULTIES.map(d => (
              <button
                key={d.key}
                onClick={() => start(d.key)}
                className="text-left rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border p-4 hover:border-heritage-gold-400 hover:shadow-sm transition-all"
              >
                <p className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text">{d.label}</p>
                <p className="text-xs text-heritage-green-600 dark:text-heritage-dark-muted mt-1">{d.blurb}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {stage === 'playing' && board && givens && (
        <div className="max-w-md mx-auto">
          <div className="grid grid-cols-9 border-2 border-heritage-green-800 dark:border-heritage-dark-border rounded-lg overflow-hidden mb-5 select-none">
            {board.map((row, r) =>
              row.map((val, c) => {
                const isGiven = givens[r][c] !== 0;
                const isSelected = selected?.[0] === r && selected?.[1] === c;
                const hasConflict = conflicts.has(`${r}-${c}`);
                const isBlocked = blockedCell === `${r}-${c}`;
                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => setSelected([r, c])}
                    className={`aspect-square flex items-center justify-center text-sm sm:text-base font-medium
                      border border-heritage-cream-300 dark:border-heritage-dark-border
                      ${r % 3 === 0 ? 'border-t-2 border-t-heritage-green-800 dark:border-t-heritage-dark-text' : ''}
                      ${c % 3 === 0 ? 'border-l-2 border-l-heritage-green-800 dark:border-l-heritage-dark-text' : ''}
                      ${r === 8 ? 'border-b-2 border-b-heritage-green-800 dark:border-b-heritage-dark-text' : ''}
                      ${c === 8 ? 'border-r-2 border-r-heritage-green-800 dark:border-r-heritage-dark-text' : ''}
                      ${isBlocked ? 'bg-red-100 dark:bg-red-900/40' : isSelected ? 'bg-heritage-gold-100 dark:bg-heritage-gold-900/30' : 'bg-white dark:bg-heritage-dark-card'}
                      ${isGiven ? 'text-heritage-green-900 dark:text-heritage-dark-text' : 'text-heritage-green-700 dark:text-heritage-gold-400'}
                      ${hasConflict ? 'text-red-600 dark:text-red-400' : ''}
                      transition-colors
                    `}
                  >
                    {val !== 0 ? val : ''}
                  </button>
                );
              })
            )}
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button
                key={n}
                onClick={() => setCell(n)}
                disabled={!selected}
                className="py-2.5 text-sm font-medium rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-800 dark:text-heritage-dark-text hover:border-heritage-gold-400 disabled:opacity-40"
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setCell(0)}
              disabled={!selected}
              className="py-2.5 flex items-center justify-center rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-600 dark:text-heritage-dark-muted hover:border-heritage-gold-400 disabled:opacity-40"
              title="Erase"
            >
              <Eraser size={14} />
            </button>
          </div>

          <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted text-center mt-4">
            Tap a cell, then tap a number. Original clues can't be changed.
          </p>
        </div>
      )}

      {stage === 'solved' && (
        <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-8 max-w-lg mx-auto text-center">
          <Sparkles size={28} className="text-heritage-gold-500 mx-auto mb-3" />
          <p className="font-serif text-2xl text-heritage-green-900 dark:text-heritage-dark-text mb-2">Solved it!</p>
          <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted mb-6">
            Well played. Fancy another round?
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setStage('menu')}
              className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-700 dark:text-heritage-dark-muted"
            >
              <RotateCcw size={14} /> Play again
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2 text-sm rounded-lg bg-heritage-green-800 hover:bg-heritage-green-700 text-white font-medium"
            >
              Back to games
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
