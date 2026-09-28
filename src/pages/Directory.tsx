import React, { useMemo, useState } from 'react';
import {
  Search, Plus, ChevronLeft, ChevronRight, ArrowRight,
  Users, TreeDeciduous
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fullName } from '../lib/lineage';
import type { Member } from '../types';

type StatusFilter = 'all' | 'living' | 'deceased';
type GenFilter = 'gen1' | 'gen2' | 'gen3' | 'gen4' | null;
type GenderFilter = 'male' | 'female' | null;

const PAGE_SIZE = 16;

interface Props {
  onSelectMember: (id: string) => void;
}

function GenderIcon({ gender }: { gender: Member['gender'] }) {
  if (gender === 'male') {
    return (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2">
        <circle cx="10.5" cy="13.5" r="5.5" />
        <path d="M15.5 8.5L20 4M20 4h-4M20 4v4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="12" cy="10" r="6" />
      <path d="M12 16v6M9 19h6" />
    </svg>
  );
}

export const Directory: React.FC<Props> = ({ onSelectMember }) => {
  const { data } = useApp();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [genFilter, setGenFilter] = useState<GenFilter>(null);
  const [genderFilter, setGenderFilter] = useState<GenderFilter>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const counts = useMemo(() => ({
    all: data.members.length,
    living: data.members.filter(m => m.isLiving).length,
    deceased: data.members.filter(m => !m.isLiving).length,
  }), [data.members]);

  const filtered = useMemo(() => {
    let list = data.members;

    if (statusFilter === 'living') list = list.filter(m => m.isLiving);
    else if (statusFilter === 'deceased') list = list.filter(m => !m.isLiving);

    if (genFilter) list = list.filter(m => m.generation === Number(genFilter.slice(3)));
    if (genderFilter) list = list.filter(m => m.gender === genderFilter);

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(m => fullName(m).toLowerCase().includes(q) || m.occupation?.toLowerCase().includes(q));
    }

    return [...list].sort((a, b) => a.generation - b.generation || a.firstName.localeCompare(b.firstName));
  }, [data.members, statusFilter, genFilter, genderFilter, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const showingFrom = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(page * PAGE_SIZE, filtered.length);

  const setFilters = (fn: () => void) => { fn(); setPage(1); };

  const toggleGen = (g: GenFilter) => setFilters(() => setGenFilter(prev => prev === g ? null : g));
  const toggleGender = (g: GenderFilter) => setFilters(() => setGenderFilter(prev => prev === g ? null : g));

  const GEN_LABELS = ['Gen 1', 'Gen 2', 'Gen 3', 'Gen 4'] as const;

  return (
    <div className="space-y-0">


      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Status group */}
        <div className="flex items-center rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border overflow-hidden bg-white dark:bg-heritage-dark-card shadow-soft">
          {(['all', 'living', 'deceased'] as StatusFilter[]).map(s => {
            const isActive = statusFilter === s;
            const count = counts[s];
            const dot = s === 'living' ? 'bg-emerald-500' : s === 'deceased' ? 'bg-gray-400' : null;
            return (
              <button
                key={s}
                onClick={() => setFilters(() => setStatusFilter(s))}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium transition-colors border-r last:border-r-0 border-heritage-cream-300 dark:border-heritage-dark-border
                  ${isActive
                    ? 'bg-heritage-green-800 text-white'
                    : 'text-heritage-green-700 dark:text-heritage-dark-muted hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover'
                  }`}
              >
                {s === 'all' && (
                  <Users size={14} className={isActive ? 'text-white' : 'text-heritage-green-500'} />
                )}
                {dot && (
                  <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                )}
                <span className="capitalize">{s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}</span>
                <span className={`text-xs font-semibold ml-0.5 ${isActive ? 'text-white/80' : 'text-heritage-green-500 dark:text-heritage-dark-muted'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Generation group */}
        <div className="flex items-center rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border overflow-hidden bg-white dark:bg-heritage-dark-card shadow-soft">
          {GEN_LABELS.map((label, i) => {
            const key = `gen${i + 1}` as GenFilter;
            const isActive = genFilter === key;
            return (
              <button
                key={key}
                onClick={() => toggleGen(key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-r last:border-r-0 border-heritage-cream-300 dark:border-heritage-dark-border
                  ${isActive
                    ? 'bg-heritage-green-800 text-white'
                    : 'text-heritage-green-700 dark:text-heritage-dark-muted hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover'
                  }`}
              >
                <TreeDeciduous size={13} className={isActive ? 'text-white' : 'text-heritage-green-500'} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Gender group */}
        <div className="flex items-center rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border overflow-hidden bg-white dark:bg-heritage-dark-card shadow-soft">
          {(['male', 'female'] as GenderFilter[]).map(g => {
            const isActive = genderFilter === g;
            return (
              <button
                key={g!}
                onClick={() => toggleGender(g)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium transition-colors border-r last:border-r-0 border-heritage-cream-300 dark:border-heritage-dark-border
                  ${isActive
                    ? 'bg-heritage-green-800 text-white'
                    : 'text-heritage-green-700 dark:text-heritage-dark-muted hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover'
                  }`}
              >
                <span className={isActive ? 'text-white' : 'text-heritage-green-500'}>
                  <GenderIcon gender={g!} />
                </span>
                <span className="capitalize">{g}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-44">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-heritage-green-400" />
          <input
            value={query}
            onChange={e => setFilters(() => setQuery(e.target.value))}
            placeholder="Search by name..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-card dark:text-heritage-dark-text shadow-soft focus:outline-none focus:ring-2 focus:ring-heritage-green-500 bg-white"
          />
        </div>

        {/* Add Member */}
        <button className="flex items-center gap-1.5 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-soft transition-colors shrink-0">
          <Plus size={16} /> Add Member
        </button>
      </div>

      {/* ── Results header ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-heritage-green-700 dark:text-heritage-dark-muted text-sm font-medium">
          <Users size={16} />
          <span>{filtered.length} member{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-heritage-green-600 dark:text-heritage-dark-muted">
          <span className="hidden sm:inline">Sort by:</span>
          <select className="text-sm border border-heritage-cream-400 dark:border-heritage-dark-border rounded-lg px-2 py-1 bg-white dark:bg-heritage-dark-card dark:text-heritage-dark-text focus:outline-none focus:ring-2 focus:ring-heritage-green-500">
            <option>Name (A–Z)</option>
            <option>Generation</option>
          </select>
        </div>
      </div>

      {/* ── Member Cards Grid ── */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-heritage-cream-400 dark:border-heritage-dark-border py-16 text-center">
          <Users size={32} className="mx-auto text-heritage-green-300 dark:text-heritage-dark-muted mb-3" />
          <p className="text-sm text-heritage-green-500 dark:text-heritage-dark-muted">No members match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {paged.map(member => (
            <MemberCard key={member.id} member={member} onClick={() => onSelectMember(member.id)} />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-heritage-cream-300 dark:border-heritage-dark-border">
          {/* Left label */}
          <div className="flex items-center gap-2 text-sm text-heritage-green-600 dark:text-heritage-dark-muted">
            <Users size={15} />
            <span>
              Showing {showingFrom}–{showingTo} of {filtered.length} members
            </span>
          </div>

          {/* Right page controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-700 dark:text-heritage-dark-muted hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
                  ${p === page
                    ? 'bg-heritage-green-800 text-white'
                    : 'border border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-700 dark:text-heritage-dark-muted hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover'
                  }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-700 dark:text-heritage-dark-muted hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Member Card ── */
interface MemberCardProps {
  member: Member;
  onClick: () => void;
}

const GEN_COLORS: Record<number, string> = {
  1: 'bg-heritage-gold-100 text-heritage-gold-700',
  2: 'bg-amber-100 text-amber-700',
  3: 'bg-emerald-100 text-emerald-700',
  4: 'bg-sky-100 text-sky-700',
};

function MemberCard({ member, onClick }: MemberCardProps) {
  const isLiving = member.isLiving;
  const genColor = GEN_COLORS[member.generation] ?? 'bg-heritage-cream-200 text-heritage-green-700';
  const birthYear = member.dateOfBirth ? new Date(member.dateOfBirth).getFullYear() : null;

  return (
    <div className="relative rounded-2xl border border-heritage-cream-300 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card overflow-visible hover:shadow-soft-lg hover:-translate-y-0.5 transition-all group">
      {/* Living / Deceased badge — top right */}
      <div className={`absolute top-2.5 right-2.5 z-10 text-[9px] font-semibold px-2 py-0.5 rounded-full ${
        isLiving
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-gray-100 text-gray-500'
      }`}>
        {isLiving ? 'Living' : 'Deceased'}
      </div>

      <div className="flex flex-col items-center px-3 pt-6 pb-4">
        {/* Circular avatar */}
        <div className="w-20 h-20 rounded-full border-4 border-heritage-cream-200 dark:border-heritage-dark-border bg-heritage-cream-100 overflow-hidden shrink-0">
          {member.avatarUrl ? (
            <img src={member.avatarUrl} alt={fullName(member)} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {member.gender === 'male' ? (
                <svg viewBox="0 0 80 80" className="w-full h-full" fill="none">
                  <rect width="80" height="80" fill="#e8dcc8" />
                  <circle cx="40" cy="30" r="16" fill="#b8a882" />
                  <ellipse cx="40" cy="72" rx="26" ry="22" fill="#b8a882" />
                </svg>
              ) : (
                <svg viewBox="0 0 80 80" className="w-full h-full" fill="none">
                  <rect width="80" height="80" fill="#e8dcc8" />
                  <circle cx="40" cy="30" r="16" fill="#b8a882" />
                  <ellipse cx="40" cy="72" rx="26" ry="22" fill="#b8a882" />
                </svg>
              )}
            </div>
          )}
        </div>

        {/* Name */}
        <p className="mt-3 text-sm font-semibold text-heritage-green-900 dark:text-heritage-dark-text text-center leading-tight line-clamp-2 w-full">
          {fullName(member)}
        </p>

        {/* Birth year */}
        <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted mt-0.5">
          b. {birthYear ?? '?'}
        </p>

        {/* Generation badge */}
        <span className={`mt-2 text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${genColor}`}>
          Gen {member.generation}
        </span>
      </div>

      {/* Footer row: gender icon + arrow button */}
      <div className="flex items-center justify-between px-3 pb-3">
        <span className="text-heritage-green-500 dark:text-heritage-dark-muted">
          <GenderIcon gender={member.gender} />
        </span>
        <button
          onClick={onClick}
          className="w-7 h-7 rounded-full bg-heritage-green-800 hover:bg-heritage-green-700 text-white flex items-center justify-center transition-colors"
          aria-label={`View ${fullName(member)}`}
        >
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
