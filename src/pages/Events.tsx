import React, { useState } from 'react';
import { Plus, MapPin, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { EventType } from '../types';
import { canAddContent } from '../lib/permissions';

const TYPE_STYLES: Record<EventType, string> = {
  reunion: 'bg-heritage-green-100 text-heritage-green-700',
  birthday: 'bg-heritage-gold-100 text-heritage-gold-700',
  memorial: 'bg-heritage-bark-100 text-heritage-bark-700',
  meeting: 'bg-blue-100 text-blue-700',
  other: 'bg-heritage-cream-300 text-heritage-green-700',
};

export const Events: React.FC = () => {
  const { data, addEvent, setRsvp, currentProfile } = useApp();
  const canAdd = canAddContent(currentProfile?.role);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>('reunion');
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [description, setDescription] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startsAt) return;
    addEvent({ title, eventType, location, description, startsAt });
    setTitle(''); setLocation(''); setStartsAt(''); setDescription(''); setShowForm(false);
  };

  const sorted = [...data.events].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const myMemberId = currentProfile?.memberId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted max-w-md">
          Reunions, birthdays, memorials, and meetings — all in one calendar.
        </p>
        {canAdd && (
          <button onClick={() => setShowForm(s => !s)} className="flex items-center gap-1.5 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg">
            <Plus size={16} /> New Event
          </button>
        )}
      </div>

      {showForm && canAdd && (
        <form onSubmit={submit} className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-5 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title" className="rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm" />
            <select value={eventType} onChange={e => setEventType(e.target.value as EventType)} className="rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm">
              <option value="reunion">Reunion</option>
              <option value="birthday">Birthday</option>
              <option value="memorial">Memorial</option>
              <option value="meeting">Meeting</option>
              <option value="other">Other</option>
            </select>
            <input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} className="rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm" />
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" className="rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm" />
          </div>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Description" className="w-full rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3.5 py-2 text-sm rounded-lg border border-heritage-cream-400 text-heritage-green-700 dark:text-heritage-dark-muted">Cancel</button>
            <button type="submit" className="px-3.5 py-2 text-sm rounded-lg bg-heritage-green-800 text-white font-medium">Schedule event</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {sorted.map(ev => {
          const going = ev.rsvps.filter(r => r.status === 'going').length;
          const myStatus = myMemberId ? ev.rsvps.find(r => r.memberId === myMemberId)?.status : undefined;
          return (
            <div key={ev.id} className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-14 h-14 shrink-0 rounded-lg bg-heritage-green-50 dark:bg-heritage-dark-hover flex flex-col items-center justify-center border border-heritage-cream-300 dark:border-heritage-dark-border">
                <span className="text-[10px] uppercase text-heritage-gold-600 leading-none">{new Date(ev.startsAt).toLocaleString('en', { month: 'short' })}</span>
                <span className="text-lg font-serif text-heritage-green-900 dark:text-heritage-dark-text leading-none mt-0.5">{new Date(ev.startsAt).getDate()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-heritage-green-900 dark:text-heritage-dark-text">{ev.title}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${TYPE_STYLES[ev.eventType]}`}>{ev.eventType}</span>
                </div>
                {ev.description && <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted mt-0.5">{ev.description}</p>}
                <div className="flex items-center gap-4 mt-1.5 text-xs text-heritage-green-500 dark:text-heritage-dark-muted">
                  {ev.location && <span className="flex items-center gap-1"><MapPin size={12} /> {ev.location}</span>}
                  <span className="flex items-center gap-1"><Users size={12} /> {going} going</span>
                </div>
              </div>
              {myMemberId && (
                <div className="flex gap-1.5 shrink-0">
                  {(['going', 'maybe', 'declined'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setRsvp(ev.id, myMemberId, s)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border capitalize
                        ${myStatus === s ? 'bg-heritage-green-800 border-heritage-green-800 text-white' : 'border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-700 dark:text-heritage-dark-muted hover:border-heritage-green-500'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
