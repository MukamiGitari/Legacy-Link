import React from 'react';
import { Users, Image, TreePine, ArrowRight, CalendarDays, Megaphone } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Page } from '../App';
import { fullName } from '../lib/lineage';

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
  const upcoming = [...data.events]
    .filter(e => new Date(e.startsAt) >= new Date(Date.now() - 86400000))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 3);
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
      <div
        className="relative rounded-2xl overflow-hidden text-white p-8 md:p-12 shadow-soft-lg"
        style={{
          backgroundImage: `linear-gradient(rgba(19,42,32,0.72), rgba(19,42,32,0.85)), url(${data.family.coverPhotoUrl})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}
      >
        <p className="text-heritage-gold-300 text-sm tracking-wide">{data.family.motto}</p>
        <h2 className="font-serif text-3xl md:text-4xl mt-2 max-w-lg">{data.family.name}</h2>
        <p className="mt-3 max-w-xl text-heritage-cream-200 text-sm leading-relaxed">{data.family.originStory}</p>
        <button
          onClick={() => onNavigate('tree')}
          className="mt-6 inline-flex items-center gap-2 bg-heritage-gold-500 hover:bg-heritage-gold-600 text-heritage-green-950 font-medium text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          Explore Your Tree <ArrowRight size={15} />
        </button>
      </div>

      {/* Upcoming Events & Recent Announcements */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-heritage-gold-600 dark:text-heritage-gold-400" />
              <h3 className="font-serif text-heritage-green-900 dark:text-heritage-dark-text font-medium">Upcoming Events</h3>
            </div>
            <button onClick={() => onNavigate('events')} className="text-xs text-heritage-gold-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </button>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-heritage-green-500 dark:text-heritage-dark-muted">Nothing scheduled yet.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map(ev => (
                <div key={ev.id} className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover transition-colors">
                  <div className="w-11 h-11 shrink-0 rounded-lg bg-heritage-green-50 dark:bg-heritage-dark-hover flex flex-col items-center justify-center border border-heritage-cream-400 dark:border-heritage-dark-border">
                    <span className="text-[10px] uppercase text-heritage-gold-600 leading-none">{new Date(ev.startsAt).toLocaleString('en', { month: 'short' })}</span>
                    <span className="text-sm font-semibold text-heritage-green-900 dark:text-heritage-dark-text leading-none mt-0.5">{new Date(ev.startsAt).getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-heritage-green-900 dark:text-heritage-dark-text truncate">{ev.title}</p>
                    <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted truncate">{ev.location || 'No location set'}</p>
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
