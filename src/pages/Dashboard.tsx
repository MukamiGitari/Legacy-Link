import React, { useMemo } from 'react';
import { Users, Image, TreePine, ArrowRight, CalendarDays, Megaphone, ChefHat, Brain, Cake, Pin } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Page } from '../App';
import { fullName } from '../lib/lineage';
import { buildTriviaRound } from '../lib/trivia';

interface Props {
  onNavigate: (p: Page) => void;
  onSelectMember: (id: string) => void;
}

/** "1st", "2nd", "3rd", "4th"… used for the Featured Family Members captions. */
const ordinal = (n: number) => {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
};

export const Dashboard: React.FC<Props> = ({ onNavigate, onSelectMember }) => {
  const { data } = useApp();
  const living = data.members.filter(m => m.isLiving).length;
  const generations = new Set(data.members.map(m => m.generation)).size;
  // Upcoming events + birthdays, merged and sorted soonest-first.
  const upcoming = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const horizon = new Date(today.getTime() + 90 * 86400000);
    type Item = { key: string; date: Date; title: string; sub: string; kind: 'event' | 'birthday' };
    const items: Item[] = [];

    data.events.forEach(e => {
      const d = new Date(e.startsAt);
      if (!isNaN(d.getTime()) && d >= new Date(today.getTime() - 86400000)) {
        items.push({ key: `e-${e.id}`, date: d, title: e.title, sub: e.location || 'No location set', kind: 'event' });
      }
    });

    data.members.filter(m => m.isLiving && m.dateOfBirth).forEach(m => {
      const born = new Date(m.dateOfBirth as string);
      if (isNaN(born.getTime())) return;
      const next = new Date(today.getFullYear(), born.getMonth(), born.getDate());
      if (next < today) next.setFullYear(today.getFullYear() + 1);
      if (next > horizon) return;
      const turning = next.getFullYear() - born.getFullYear();
      items.push({
        key: `b-${m.id}`, date: next, title: `${fullName(m)}'s birthday`,
        sub: turning > 0 ? `Turning ${turning}` : 'Birthday', kind: 'birthday',
      });
    });

    return items.sort((x, y) => x.date.getTime() - y.date.getTime()).slice(0, 5);
  }, [data.events, data.members]);

  const newMemoriesThisWeek = data.memories.filter(
    m => Date.now() - new Date(m.createdAt).getTime() <= 7 * 86400000,
  ).length;

  // Featured recipe rotates daily.
  const featuredRecipe = data.recipes.length
    ? data.recipes[Math.floor(Date.now() / 86400000) % data.recipes.length]
    : undefined;
  const recipeCook = featuredRecipe?.contributedByMemberId
    ? data.members.find(m => m.id === featuredRecipe.contributedByMemberId)
    : undefined;

  const triviaQuestion = useMemo(() => {
    try { return buildTriviaRound(data, 'our_family', 1)[0]; } catch { return undefined; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.members.length, data.relationships.length]);

  const recentAnnouncements = [...data.announcements]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);

  const stats = [
    { label: 'Family Members', value: data.members.length, icon: Users },
    { label: 'Living Members', value: living, icon: Users },
    { label: 'Generations', value: generations, icon: TreePine },
    { label: 'Photos Archived', value: data.photos.length, icon: Image },
  ];

  const featuredMembers = [...data.members].slice(-4);
  const recentPhotos = [...data.photos].slice(-6).reverse();

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="font-serif text-2xl md:text-3xl uppercase tracking-wide text-heritage-green-900 dark:text-heritage-dark-text">
          Welcome to the {data.family.name} Hub
        </h2>
        {data.family.motto && (
          <p className="mt-2 text-sm italic text-heritage-green-600 dark:text-heritage-dark-muted">“{data.family.motto}”</p>
        )}
      </div>

      {/* Quick action */}
      <button
        onClick={() => onNavigate('memories')}
        className="w-full flex items-center gap-3 rounded-xl border border-heritage-gold-300 bg-heritage-gold-50 dark:bg-heritage-dark-card dark:border-heritage-dark-border px-4 py-3 text-left hover:shadow-soft transition-shadow"
      >
        <Pin size={18} className="shrink-0 text-heritage-gold-600" />
        <span className="text-sm text-heritage-green-900 dark:text-heritage-dark-text">
          <span className="font-semibold uppercase text-[11px] tracking-wide text-heritage-gold-700 mr-2">Quick action</span>
          {newMemoriesThisWeek > 0
            ? `${newMemoriesThisWeek} new ${newMemoriesThisWeek === 1 ? 'memory' : 'memories'} added this week`
            : 'No new memories this week — share one with the family'}
        </span>
        <ArrowRight size={14} className="ml-auto shrink-0 text-heritage-gold-600" />
      </button>

      {/* Highlights */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-3">
            <ChefHat size={18} className="text-heritage-gold-600 dark:text-heritage-gold-400" />
            <h3 className="font-serif text-heritage-green-900 dark:text-heritage-dark-text font-medium uppercase text-sm tracking-wide">Featured recipe</h3>
          </div>
          {featuredRecipe ? (
            <>
              <p className="text-sm font-medium text-heritage-green-900 dark:text-heritage-dark-text">{featuredRecipe.title}</p>
              {recipeCook && (
                <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted mt-1">Submitted by {recipeCook.firstName}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-heritage-green-500 dark:text-heritage-dark-muted">No recipes yet.</p>
          )}
          <button onClick={() => onNavigate('cookbook')} className="mt-4 text-xs text-heritage-gold-600 hover:underline flex items-center gap-1">
            Open the cookbook <ArrowRight size={12} />
          </button>
        </div>

        <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={18} className="text-heritage-gold-600 dark:text-heritage-gold-400" />
            <h3 className="font-serif text-heritage-green-900 dark:text-heritage-dark-text font-medium uppercase text-sm tracking-wide">Trivia of the day</h3>
          </div>
          <p className="text-sm text-heritage-green-900 dark:text-heritage-dark-text">
            {triviaQuestion ? `“${triviaQuestion.prompt}”` : 'Play a round of family trivia.'}
          </p>
          <button onClick={() => onNavigate('trivia')} className="mt-4 text-xs text-heritage-gold-600 hover:underline flex items-center gap-1">
            Play trivia <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Upcoming Family Events & Birthdays + Recent Announcements */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-heritage-gold-600 dark:text-heritage-gold-400" />
              <h3 className="font-serif text-heritage-green-900 dark:text-heritage-dark-text font-medium">Upcoming Family Events &amp; Birthdays</h3>
            </div>
            <button onClick={() => onNavigate('events')} className="text-xs text-heritage-gold-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </button>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-heritage-green-500 dark:text-heritage-dark-muted">Nothing scheduled yet.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map(item => (
                <div key={item.key} className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover transition-colors">
                  <div className="w-11 h-11 shrink-0 rounded-lg bg-heritage-green-50 dark:bg-heritage-dark-hover flex flex-col items-center justify-center border border-heritage-cream-400 dark:border-heritage-dark-border">
                    <span className="text-[10px] uppercase text-heritage-gold-600 leading-none">{item.date.toLocaleString('en', { month: 'short' })}</span>
                    <span className="text-sm font-semibold text-heritage-green-900 dark:text-heritage-dark-text leading-none mt-0.5">{item.date.getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-heritage-green-900 dark:text-heritage-dark-text truncate flex items-center gap-1.5">
                      {item.kind === 'birthday' && <Cake size={13} className="shrink-0 text-heritage-gold-600" />}
                      {item.title}
                    </p>
                    <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted truncate">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Megaphone size={18} className="text-heritage-gold-600 dark:text-heritage-gold-400" />
              <h3 className="font-serif text-heritage-green-900 dark:text-heritage-dark-text font-medium">Recent Announcements</h3>
            </div>
            <button onClick={() => onNavigate('announcements')} className="text-xs text-heritage-gold-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </button>
          </div>
          {recentAnnouncements.length === 0 ? (
            <p className="text-sm text-heritage-green-500 dark:text-heritage-dark-muted">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {recentAnnouncements.map(a => (
                <div key={a.id} className="flex items-start gap-2.5 p-1.5 rounded-lg hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover transition-colors">
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${a.priority === 'urgent' ? 'bg-red-500' : a.priority === 'important' ? 'bg-heritage-gold-500' : 'bg-heritage-green-400'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-heritage-green-900 dark:text-heritage-dark-text truncate">{a.title}</p>
                    <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted line-clamp-2">{a.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Featured Family Members */}
      <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-heritage-green-900 dark:text-heritage-dark-text">Featured Family Members</h3>
          <button onClick={() => onNavigate('directory')} className="text-xs text-heritage-gold-600 hover:underline flex items-center gap-1">
            View All <ArrowRight size={12} />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {featuredMembers.map(m => (
            <button key={m.id} onClick={() => onSelectMember(m.id)} className="flex flex-col items-center group">
              <img
                src={m.avatarUrl}
                alt=""
                className="w-16 h-16 rounded-full object-cover border-2 border-heritage-gold-400 shadow-soft group-hover:scale-105 transition-transform"
              />
              <p className="mt-2 text-sm font-medium text-heritage-green-900 dark:text-heritage-dark-text text-center leading-tight truncate w-full">{fullName(m)}</p>
              <p className="text-[11px] text-heritage-green-500 dark:text-heritage-dark-muted">({ordinal(m.generation)} Generation)</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Photos */}
      <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-heritage-green-900 dark:text-heritage-dark-text">Recent Photos</h3>
          <button onClick={() => onNavigate('gallery')} className="text-xs text-heritage-gold-600 hover:underline flex items-center gap-1">
            View All <ArrowRight size={12} />
          </button>
        </div>
        {recentPhotos.length === 0 ? (
          <p className="text-sm text-heritage-green-500 dark:text-heritage-dark-muted">No photos uploaded yet.</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-1">
            {recentPhotos.map(p => (
              <button
                key={p.id}
                onClick={() => onNavigate('gallery')}
                className="shrink-0 w-28 h-28 rounded-lg overflow-hidden border border-heritage-cream-400 dark:border-heritage-dark-border hover:opacity-90 transition-opacity"
              >
                <img src={p.url} alt={p.caption ?? ''} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-4 shadow-soft">
            <Icon size={18} className="text-heritage-gold-500 mb-2" />
            <p className="text-2xl font-serif text-heritage-green-900 dark:text-heritage-dark-text">{value}</p>
            <p className="text-xs text-heritage-green-600 dark:text-heritage-dark-muted">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
