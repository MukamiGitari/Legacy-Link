import React, { useMemo, useState } from 'react';
import { ArrowLeft, RotateCcw, Trash2, Trophy, Spade } from 'lucide-react';

interface RoundEntry {
  id: string;
  teamAPoints: number;
  teamBPoints: number;
}

// Standard canasta bonus values — tap to add/subtract instead of doing mental math.
const BONUS_CHIPS: { label: string; value: number }[] = [
  { label: 'Natural canasta', value: 500 },
  { label: 'Mixed canasta', value: 300 },
  { label: 'Went out', value: 100 },
  { label: 'Went out concealed', value: 200 },
  { label: 'Red three', value: 100 },
  { label: 'Red three (all 4)', value: 800 },
  { label: 'Black three penalty', value: -100 },
  { label: 'Stuck with cards', value: -100 },
];

const TARGET_SCORE = 5000;

export const Canasta: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [teamAName, setTeamAName] = useState('Team 1');
  const [teamBName, setTeamBName] = useState('Team 2');
  const [rounds, setRounds] = useState<RoundEntry[]>([]);
  const [draftA, setDraftA] = useState(0);
  const [draftB, setDraftB] = useState(0);

  const totalA = useMemo(() => rounds.reduce((s, r) => s + r.teamAPoints, 0), [rounds]);
  const totalB = useMemo(() => rounds.reduce((s, r) => s + r.teamBPoints, 0), [rounds]);

  const winner =
    totalA >= TARGET_SCORE || totalB >= TARGET_SCORE
      ? (totalA === totalB ? null : totalA > totalB ? teamAName : teamBName)
      : null;

  const addChip = (team: 'A' | 'B', value: number) => {
    if (team === 'A') setDraftA(v => v + value);
    else setDraftB(v => v + value);
  };

  const addRound = () => {
    setRounds(r => [...r, { id: `r${r.length}-${Date.now()}`, teamAPoints: draftA, teamBPoints: draftB }]);
    setDraftA(0);
    setDraftB(0);
  };

  const undoLast = () => setRounds(r => r.slice(0, -1));

  const resetGame = () => {
    setRounds([]);
    setDraftA(0);
    setDraftB(0);
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-heritage-green-600 dark:text-heritage-dark-muted hover:text-heritage-green-900 dark:hover:text-heritage-dark-text"
      >
        <ArrowLeft size={14} /> Back to games
      </button>

      <div className="max-w-lg mx-auto space-y-5">
        <div className="text-center">
          <Spade size={26} className="text-heritage-gold-500 mx-auto mb-2" />
          <p className="font-serif text-2xl text-heritage-green-900 dark:text-heritage-dark-text">Canasta Scorepad</p>
          <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted mt-1">
            Play with real cards — this just keeps score. First team to {TARGET_SCORE.toLocaleString()} wins.
          </p>
        </div>

        {winner && (
          <div className="rounded-xl border border-heritage-gold-400 bg-heritage-gold-50 dark:bg-heritage-gold-900/20 p-4 text-center flex items-center justify-center gap-2">
            <Trophy size={16} className="text-heritage-gold-500" />
            <span className="text-sm font-medium text-heritage-green-900 dark:text-heritage-dark-text">
              {winner} wins with {Math.max(totalA, totalB).toLocaleString()} points!
            </span>
          </div>
        )}

        {/* Team names + running totals */}
        <div className="grid grid-cols-2 gap-3">
          {(['A', 'B'] as const).map(team => (
            <div key={team} className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-4 text-center">
              <input
                value={team === 'A' ? teamAName : teamBName}
                onChange={e => (team === 'A' ? setTeamAName(e.target.value) : setTeamBName(e.target.value))}
                className="w-full text-center text-sm font-medium bg-transparent border-b border-heritage-cream-400 dark:border-heritage-dark-border focus:outline-none focus:border-heritage-gold-400 text-heritage-green-900 dark:text-heritage-dark-text mb-2"
              />
              <p className="font-serif text-3xl text-heritage-green-900 dark:text-heritage-dark-text">
                {(team === 'A' ? totalA : totalB).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* Round entry */}
        <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-4">
          <p className="text-xs uppercase tracking-wide font-medium text-heritage-green-500 dark:text-heritage-dark-muted mb-3">
            Add this hand's score
          </p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {(['A', 'B'] as const).map(team => (
              <div key={team}>
                <label className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted">
                  {team === 'A' ? teamAName : teamBName}
                </label>
                <input
                  type="number"
                  value={team === 'A' ? draftA : draftB}
                  onChange={e => (team === 'A' ? setDraftA(Number(e.target.value)) : setDraftB(Number(e.target.value)))}
                  className="w-full mt-1 px-2 py-1.5 text-sm rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border bg-transparent text-heritage-green-900 dark:text-heritage-dark-text"
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {BONUS_CHIPS.map(chip => (
                    <button
                      key={chip.label}
                      onClick={() => addChip(team, chip.value)}
                      title={chip.label}
                      className={`text-[10px] px-1.5 py-1 rounded-md border ${
                        chip.value > 0
                          ? 'border-green-300 text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20'
                          : 'border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                      }`}
                    >
                      {chip.value > 0 ? `+${chip.value}` : chip.value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={addRound}
            className="w-full px-4 py-2 text-sm rounded-lg bg-heritage-green-800 hover:bg-heritage-green-700 text-white font-medium"
          >
            Add hand to score
          </button>
        </div>

        {/* History */}
        {rounds.length > 0 && (
          <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-wide font-medium text-heritage-green-500 dark:text-heritage-dark-muted">
                Hand-by-hand
              </p>
              <button onClick={undoLast} className="text-xs text-heritage-green-600 dark:text-heritage-dark-muted hover:text-heritage-green-900 flex items-center gap-1">
                <RotateCcw size={12} /> Undo last
              </button>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {rounds.map((r, i) => (
                <div key={r.id} className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg border border-heritage-cream-300 dark:border-heritage-dark-border">
                  <span className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted w-10">Hand {i + 1}</span>
                  <span className="text-heritage-green-900 dark:text-heritage-dark-text">{r.teamAPoints >= 0 ? '+' : ''}{r.teamAPoints}</span>
                  <span className="text-heritage-green-900 dark:text-heritage-dark-text">{r.teamBPoints >= 0 ? '+' : ''}{r.teamBPoints}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={resetGame}
          className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-600 dark:text-heritage-dark-muted hover:text-red-600 hover:border-red-300"
        >
          <Trash2 size={12} /> Reset game
        </button>
      </div>
    </div>
  );
};
