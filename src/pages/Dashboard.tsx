import React from 'react';
import { Users, Image, CalendarDays, TreePine, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Page } from '../App';
import { fullName } from '../lib/lineage';

interface Props {
  onNavigate: (p: Page) => void;
  onSelectMember: (id: string) => void;
}

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

  const stats: { label: string; value: number; icon: typeof Users; page: Page }[] = [
    { label: 'Family Members', value: data.members.length, icon: Users, page: 'directory' },
    { label: 'Living Members', value: living, icon: Users, page: 'directory' },
    { label: 'Generations', value: generations, icon: TreePine, page: 'tree' },
    { label: 'Photos Archived', value: data.photos.length, icon: Image, page: 'gallery' },
  ];

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
          Explore the family tree <ArrowRight size={15} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, page }) => (
          <button
            key={label}
            onClick={() => onNavigate(page)}
            className="text-left rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-4 shadow-soft hover:shadow-soft-lg hover:border-heritage-green-500 dark:hover:border-heritage-gold-400 transition-all"
          >
            <Icon size={18} className="text-heritage-gold-500 mb-2" />
            <p className="text-2xl font-serif text-heritage-green-900 dark:text-heritage-dark-text">{value}</p>
            <p className="text-xs text-heritage-green-600 dark:text-heritage-dark-muted">{label}</p>
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-heritage-green-900 dark:text-heritage-dark-text">Upcoming Events</h3>
            <button onClick={() => onNavigate('events')} className="text-xs text-heritage-gold-600 hover:underline">View all</button>
          </div>
          {upcoming.length === 0 && <p className="text-sm text-heritage-green-500">Nothing scheduled yet.</p>}
          <div className="space-y-3">
            {upcoming.map(ev => (
              <div key={ev.id} className="flex items-center gap-3">
                <div className="w-11 h-11 shrink-0 rounded-lg bg-heritage-green-50 dark:bg-heritage-dark-hover flex flex-col items-center justify-center border border-heritage-cream-400 dark:border-heritage-dark-border">
                  <span className="text-[10px] uppercase text-heritage-gold-600 leading-none">{new Date(ev.startsAt).toLocaleString('en', { month: 'short' })}</span>
                  <span className="text-sm font-semibold text-heritage-green-900 dark:text-heritage-dark-text leading-none mt-0.5">{new Date(ev.startsAt).getDate()}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-heritage-green-900 dark:text-heritage-dark-text truncate">{ev.title}</p>
                  <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted truncate">{ev.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-heritage-green-900 dark:text-heritage-dark-text">Recent Announcements</h3>
            <button onClick={() => onNavigate('announcements')} className="text-xs text-heritage-gold-600 hover:underline">View all</button>
          </div>
          <div className="space-y-3">
            {recentAnnouncements.map(a => (
              <div key={a.id} className="flex items-start gap-2">
                <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${a.priority === 'urgent' ? 'bg-red-500' : a.priority === 'important' ? 'bg-heritage-gold-500' : 'bg-heritage-green-400'}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-heritage-green-900 dark:text-heritage-dark-text truncate">{a.title}</p>
                  <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted line-clamp-1">{a.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-heritage-green-900 dark:text-heritage-dark-text">Newest Additions</h3>
          <button onClick={() => onNavigate('directory')} className="text-xs text-heritage-gold-600 hover:underline">Member directory</button>
        </div>
        <div className="flex flex-wrap gap-4">
          {[...data.members].slice(-6).map(m => (
            <button key={m.id} onClick={() => onSelectMember(m.id)} className="flex flex-col items-center w-20 group">
              <img src={m.avatarUrl} className="w-14 h-14 rounded-full bg-heritage-cream-200 border-2 border-white dark:border-heritage-dark-border shadow-soft group-hover:scale-105 transition-transform" alt="" />
              <p className="mt-1.5 text-xs font-medium text-heritage-green-900 dark:text-heritage-dark-text text-center leading-tight truncate w-full">{fullName(m)}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
