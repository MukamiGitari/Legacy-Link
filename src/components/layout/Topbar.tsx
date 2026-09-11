import React, { useState } from 'react';
import { Menu, ChevronDown, Wifi, WifiOff, Plus, LogOut, Sun, Moon, Camera, Loader2, Bell, Tag, Pencil, Check, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import type { Page } from '../../App';
import * as db from '../../lib/db';

const PAGE_TITLES: Record<Page, string> = {
  dashboard: 'Dashboard',
  myFamily: 'My Family',
  tree: 'Family Tree',
  directory: 'Member Directory',
  profile: 'Member Profile',
  gallery: 'Photo Gallery',
  memories: 'Family Memories',
  events: 'Events Calendar',
  announcements: 'Announcements',
  chronicle: 'Family History Chronicle',
  dictionary: 'Heritage Vault',
  trivia: 'Family Trivia',
  games: 'Games',
  admin: 'Admin Suite',
};

const timeAgo = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

interface TopbarProps {
  page: Page;
  onOpenMobileSidebar: () => void;
  onAddMember: () => void;
  canAddMember: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({ page, onOpenMobileSidebar, onAddMember, canAddMember }) => {
  const {
    data, currentProfile, setCurrentProfileId, isOnlineMode, logout, updateProfileAvatar, updateProfileDisplayName, pushToast,
    notificationsForCurrentProfile, markNotificationRead, markAllNotificationsRead,
  } = useApp();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const unreadCount = notificationsForCurrentProfile.filter(n => !n.readAt).length;

  const saveName = () => {
    const trimmed = nameDraft.trim();
    if (trimmed && currentProfile) updateProfileDisplayName(currentProfile.id, trimmed);
    setEditingName(false);
  };

  const avatarFor = (p?: { id: string; displayName: string; avatarUrl?: string }) =>
    p?.avatarUrl || `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(p?.displayName ?? 'guest')}`;

  const handleAccountPhoto = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !currentProfile) return;
    setSavingPhoto(true);
    try {
      if (isOnlineMode) {
        const url = await db.uploadAvatarFile(data.family.id, currentProfile.id, file);
        updateProfileAvatar(currentProfile.id, url);
      } else {
        const reader = new FileReader();
        reader.onload = () => updateProfileAvatar(currentProfile.id, reader.result as string);
        reader.readAsDataURL(file);
      }
    } catch (err) {
      pushToast(`Couldn't update your photo: ${err instanceof Error ? err.message : 'unknown error'}`);
    } finally {
      setSavingPhoto(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-heritage-cream-400 bg-heritage-cream-100/90 backdrop-blur px-4 md:px-8 py-4 dark:bg-heritage-dark-card/90">
      <button onClick={onOpenMobileSidebar} className="md:hidden text-heritage-green-800 dark:text-heritage-dark-text">
        <Menu size={22} />
      </button>

      <h1 className="font-serif text-xl md:text-2xl text-heritage-green-900 dark:text-heritage-dark-text">
        {PAGE_TITLES[page]}
      </h1>

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <span
          title={isOnlineMode ? 'Connected to Supabase' : 'Standalone local storage mode'}
          className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-heritage-green-100 text-heritage-green-700 dark:bg-heritage-dark-hover dark:text-heritage-dark-muted"
        >
          {isOnlineMode ? <Wifi size={13} /> : <WifiOff size={13} />}
          {isOnlineMode ? 'Live' : 'Local mode'}
        </span>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex items-center justify-center w-9 h-9 rounded-full border border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-700 dark:text-heritage-dark-muted hover:bg-heritage-cream-200 dark:hover:bg-heritage-dark-hover transition-colors"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {canAddMember && (
          <button
            onClick={onAddMember}
            className="flex items-center gap-1.5 bg-heritage-green-800 hover:bg-heritage-green-700 text-heritage-cream-50 text-sm font-medium px-3 md:px-4 py-2 rounded-lg shadow-soft transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Member</span>
          </button>
        )}

        {/* Tag notifications: fires whenever someone is tagged in a photo or a legacy
            memory and has a login profile linked to their member record. */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(o => !o); setMenuOpen(false); }}
            aria-label="Notifications"
            className="relative flex items-center justify-center w-9 h-9 rounded-full border border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-700 dark:text-heritage-dark-muted hover:bg-heritage-cream-200 dark:hover:bg-heritage-dark-hover transition-colors"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-medium leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-xl border border-heritage-cream-400 bg-white dark:bg-heritage-dark-card shadow-soft-lg py-1.5 z-40">
              <div className="flex items-center justify-between px-3 py-1.5">
                <p className="text-[11px] uppercase tracking-wide text-heritage-green-500">Notifications</p>
                {unreadCount > 0 && (
                  <button onClick={markAllNotificationsRead} className="text-xs text-heritage-green-700 dark:text-heritage-dark-muted hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                {notificationsForCurrentProfile.length === 0 && (
                  <p className="px-3 py-4 text-sm text-heritage-green-500 dark:text-heritage-dark-muted italic">You're all caught up.</p>
                )}
                {notificationsForCurrentProfile.map(n => (
                  <button
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className={`w-full text-left px-3 py-2.5 text-sm flex items-start gap-2 hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover ${!n.readAt ? 'bg-heritage-gold-50 dark:bg-heritage-dark-hover' : ''}`}
                  >
                    <Tag size={14} className="text-heritage-gold-500 mt-0.5 shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-heritage-green-900 dark:text-heritage-dark-text">{n.message}</span>
                      <span className="block text-xs text-heritage-green-500 dark:text-heritage-dark-muted mt-0.5">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => { setMenuOpen(o => !o); setNotifOpen(false); }}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-heritage-cream-400 hover:bg-heritage-cream-200 dark:hover:bg-heritage-dark-hover"
          >
            <img
              src={avatarFor(currentProfile)}
              className="w-7 h-7 rounded-full object-cover bg-heritage-gold-100"
              alt=""
            />
            <ChevronDown size={14} className="text-heritage-green-700 dark:text-heritage-dark-muted" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-heritage-cream-400 bg-white dark:bg-heritage-dark-card shadow-soft-lg py-1.5 z-40">
              {currentProfile && (
                <div className="flex items-center gap-3 px-3 py-2.5 border-b border-heritage-cream-300 dark:border-heritage-dark-border">
                  <img src={avatarFor(currentProfile)} className="w-10 h-10 rounded-full object-cover bg-heritage-gold-100 shrink-0" alt="" />
                  <div className="min-w-0 flex-1">
                    {editingName ? (
                      <div className="flex items-center gap-1">
                        <input
                          autoFocus
                          className="text-sm font-medium text-heritage-green-900 dark:text-heritage-dark-text bg-transparent border-b border-heritage-gold-400 focus:outline-none w-full min-w-0"
                          value={nameDraft}
                          onChange={e => setNameDraft(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveName();
                            else if (e.key === 'Escape') setEditingName(false);
                          }}
                        />
                        <button onClick={saveName} className="text-heritage-green-700 dark:text-heritage-dark-muted hover:text-heritage-green-900 shrink-0" aria-label="Save name">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingName(false)} className="text-heritage-green-400 hover:text-heritage-green-700 shrink-0" aria-label="Cancel">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-heritage-green-900 dark:text-heritage-dark-text truncate flex items-center gap-1.5">
                        {currentProfile.displayName}
                        <button
                          onClick={() => { setNameDraft(currentProfile.displayName); setEditingName(true); }}
                          className="text-heritage-green-400 hover:text-heritage-green-800 dark:text-heritage-dark-muted shrink-0"
                          aria-label="Edit your display name"
                        >
                          <Pencil size={11} />
                        </button>
                      </p>
                    )}
                    <label className="flex items-center gap-1 text-xs text-heritage-green-600 dark:text-heritage-dark-muted hover:text-heritage-green-900 cursor-pointer">
                      {savingPhoto ? <Loader2 size={11} className="animate-spin" /> : <Camera size={11} />}
                      {savingPhoto ? 'Saving…' : 'Change photo'}
                      <input type="file" accept="image/*" className="hidden" disabled={savingPhoto} onChange={e => handleAccountPhoto(e.target.files)} />
                    </label>
                  </div>
                </div>
              )}
              <p className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-heritage-green-500">Viewing as</p>
              {data.profiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setCurrentProfileId(p.id); setMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm flex flex-col hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover ${p.id === currentProfile?.id ? 'bg-heritage-gold-50 dark:bg-heritage-dark-hover' : ''}`}
                >
                  <span className="font-medium text-heritage-green-900 dark:text-heritage-dark-text">{p.displayName}</span>
                  <span className="text-xs text-heritage-green-600 dark:text-heritage-dark-muted capitalize">{p.role.replace('_', ' ')}</span>
                </button>
              ))}
              <div className="border-t border-heritage-cream-300 dark:border-heritage-dark-border mt-1 pt-1">
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-heritage-dark-hover"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
