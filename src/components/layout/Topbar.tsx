import React, { useState } from 'react';
import { Menu, ChevronDown, Wifi, WifiOff, Plus, LogOut, Sun, Moon, Camera, Loader2, Bell, Tag, Pencil, Check, X, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import type { Page } from '../../App';
import { uploadFileToR2 } from '../../lib/api';
import { GlobalSearch } from './GlobalSearch';

const PAGE_TITLES: Record<Page, string> = {
  dashboard: 'Home',
  myFamily: 'My Family',
  tree: 'Family Tree',
  directory: 'Member Directory',
  profile: 'Member Profile',
  gallery: 'Photo Gallery',
  cookbook: 'Family Cookbook',
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
  onNavigate: (p: Page) => void;
  onSelectMember: (id: string) => void;
  onOpenAssistant?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  page,
  onOpenMobileSidebar,
  onAddMember,
  canAddMember,
  onNavigate,
  onSelectMember,
  onOpenAssistant,
}) => {
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

  const rawFamilyName = (data.family?.name || '').replace(/\s*family\s*/i, '').trim() || 'Family';
  const assistantName = `${rawFamilyName} Assistant`;

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
        const media = await uploadFileToR2({ category: 'photos', file });
        updateProfileAvatar(currentProfile.id, media.url || media.key);
      } else {
        const reader = new FileReader();
        reader.onload = () => updateProfileAvatar(currentProfile.id, reader.result as string);
        reader.readAsDataURL(file);
      }
      pushToast('Photo updated', 'success');
    } catch {
      pushToast('Could not save photo');
    } finally {
      setSavingPhoto(false);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-heritage-cream-400 dark:border-heritage-dark-border bg-heritage-cream-100 dark:bg-heritage-dark-card px-4 md:px-8 shadow-soft">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden text-heritage-green-800 dark:text-heritage-dark-text p-1"
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>
        <h1 className="font-serif text-lg md:text-xl text-heritage-green-900 dark:text-heritage-dark-text font-bold">
          {PAGE_TITLES[page]}
        </h1>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <GlobalSearch onNavigate={onNavigate} onSelectMember={onSelectMember} />

        <span
          className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-heritage-green-700 dark:text-heritage-dark-muted px-2 py-1 rounded-full border border-heritage-cream-400 dark:border-heritage-dark-border"
          title={isOnlineMode ? 'Synced to your live archive' : 'Demo / local mode — changes stay in this browser'}
        >
          {isOnlineMode ? <Wifi size={12} className="text-emerald-700 dark:text-emerald-400" /> : <WifiOff size={12} className="text-heritage-gold-600 dark:text-heritage-gold-400" />}
          {isOnlineMode ? 'Live archive' : 'Demo mode'}
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

        {/* Chatbot Assistant Button */}
        {onOpenAssistant && (
          <button
            onClick={onOpenAssistant}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-heritage-green-900 via-heritage-green-800 to-heritage-green-900 text-heritage-gold-300 border border-heritage-gold-500/40 hover:brightness-110 active:scale-95 shadow-sm transition-all text-xs font-bold shrink-0"
            title={`Ask ${assistantName}`}
          >
            <Sparkles size={14} className="text-heritage-gold-400 animate-pulse" />
            <span className="hidden sm:inline">{assistantName}</span>
          </button>
        )}

        {canAddMember && (
          <button
            onClick={onAddMember}
            className="flex items-center gap-1.5 bg-heritage-green-800 hover:bg-heritage-green-700 text-heritage-cream-50 text-sm font-medium px-3 md:px-4 py-2 rounded-lg shadow-soft transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Member</span>
          </button>
        )}

        {/* Tag notifications */}
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
                  <div
                    key={n.id}
                    onClick={() => {
                      markNotificationRead(n.id);
                      if (n.kind === 'photo_tag') onNavigate('gallery');
                      else if (n.kind === 'memory_tag') onNavigate('memories');
                      setNotifOpen(false);
                    }}
                    className={`flex items-start gap-2.5 px-3 py-2 text-xs border-b border-heritage-cream-200 dark:border-heritage-dark-border last:border-b-0 cursor-pointer hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover ${n.readAt ? 'opacity-60' : ''}`}
                  >
                    <Tag size={14} className="text-heritage-bark-500 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-heritage-green-900 dark:text-heritage-dark-text font-medium leading-tight">{n.message}</p>
                      <p className="text-[10px] text-heritage-green-500 dark:text-heritage-dark-muted mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Account Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 rounded-full border border-heritage-cream-400 dark:border-heritage-dark-border p-1 hover:bg-heritage-cream-200 dark:hover:bg-heritage-dark-hover transition-colors"
          >
            <img
              src={avatarFor(currentProfile)}
              alt={currentProfile?.displayName ?? 'Account'}
              className="h-8 w-8 rounded-full object-cover"
            />
            <ChevronDown size={14} className="text-heritage-green-700 dark:text-heritage-dark-muted pr-1" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card shadow-soft-lg py-2 z-40">
              <div className="px-4 py-2 border-b border-heritage-cream-300 dark:border-heritage-dark-border">
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <img
                      src={avatarFor(currentProfile)}
                      alt={currentProfile?.displayName ?? 'Profile'}
                      className="h-12 w-12 rounded-full object-cover border border-heritage-cream-400"
                    />
                    <label
                      title="Upload a new profile picture"
                      className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                    >
                      {savingPhoto ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={savingPhoto}
                        className="hidden"
                        onChange={e => handleAccountPhoto(e.target.files)}
                      />
                    </label>
                  </div>
                  <div className="min-w-0 flex-1">
                    {editingName ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={nameDraft}
                          onChange={e => setNameDraft(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveName(); else if (e.key === 'Escape') setEditingName(false); }}
                          autoFocus
                          className="w-full text-xs font-semibold px-1.5 py-0.5 rounded border border-heritage-green-600 bg-heritage-cream-50 dark:bg-heritage-dark-bg text-heritage-green-900 dark:text-heritage-dark-text focus:outline-none"
                        />
                        <button onClick={saveName} className="p-0.5 text-emerald-600 hover:text-emerald-700" title="Save name"><Check size={14} /></button>
                        <button onClick={() => setEditingName(false)} className="p-0.5 text-heritage-bark-500 hover:text-heritage-bark-700" title="Cancel"><X size={14} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <p className="font-serif font-bold text-sm text-heritage-green-900 dark:text-heritage-dark-text truncate">
                          {currentProfile?.displayName}
                        </p>
                        <button
                          onClick={() => { setNameDraft(currentProfile?.displayName ?? ''); setEditingName(true); }}
                          className="text-heritage-green-500 hover:text-heritage-green-700 dark:text-heritage-dark-muted p-0.5"
                          title="Edit your name"
                        >
                          <Pencil size={11} />
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-heritage-green-600 dark:text-heritage-dark-muted capitalize">
                      {currentProfile?.role?.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </div>

              {data.profiles.length > 1 && (
                <div className="py-1 border-b border-heritage-cream-300 dark:border-heritage-dark-border">
                  <p className="px-4 py-1 text-[10px] uppercase font-bold tracking-wider text-heritage-green-500">
                    Switch Family Member Profile
                  </p>
                  {data.profiles.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setCurrentProfileId(p.id); setMenuOpen(false); }}
                      className={`w-full text-left px-4 py-1.5 text-xs flex items-center justify-between ${
                        p.id === currentProfile?.id
                          ? 'bg-heritage-green-100 dark:bg-heritage-dark-hover font-semibold text-heritage-green-900 dark:text-heritage-dark-text'
                          : 'text-heritage-green-800 dark:text-heritage-dark-muted hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover'
                      }`}
                    >
                      <span className="truncate">{p.displayName}</span>
                      <span className="text-[10px] text-heritage-green-500 capitalize">{p.role.replace('_', ' ')}</span>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2 text-xs text-red-700 dark:text-red-400 hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover flex items-center gap-2"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
