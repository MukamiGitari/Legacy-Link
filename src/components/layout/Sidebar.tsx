import React from 'react';
import {
  TreePine, LayoutDashboard, Users, Image, BookHeart, CalendarDays,
  Megaphone, ScrollText, ShieldCheck, X, UsersRound, Languages, type LucideIcon,
} from 'lucide-react';
import type { Page } from '../../App';
import { useApp } from '../../context/AppContext';
import { isAdminRole } from '../../lib/permissions';

interface NavItem {
  page: Page;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'myFamily', label: 'My Family', icon: UsersRound },
  { page: 'tree', label: 'Family Tree', icon: TreePine },
  { page: 'directory', label: 'Members', icon: Users },
  { page: 'gallery', label: 'Photo Gallery', icon: Image },
  { page: 'memories', label: 'Memories', icon: BookHeart },
  { page: 'events', label: 'Events', icon: CalendarDays },
  { page: 'announcements', label: 'Announcements', icon: Megaphone },
  { page: 'chronicle', label: 'Chronicle', icon: ScrollText },
  { page: 'dictionary', label: 'Language & Sayings', icon: Languages },
  { page: 'admin', label: 'Admin Suite', icon: ShieldCheck, adminOnly: true },
];

interface SidebarProps {
  currentPage: Page;
  onNavigate: (p: Page) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, mobileOpen, onCloseMobile }) => {
  const { data, currentProfile } = useApp();
  const visibleNavItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdminRole(currentProfile.role));

  const content = (
    <div className="flex h-full flex-col bg-heritage-green-900 text-heritage-cream-100">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-heritage-green-800">
        <span className="text-2xl">🌳</span>
        <div className="min-w-0">
          <p className="font-serif text-lg leading-tight truncate">Legacy Link</p>
          <p className="text-[11px] tracking-wide text-heritage-gold-300 truncate">{data.family.name}</p>
        </div>
        <button onClick={onCloseMobile} className="ml-auto md:hidden text-heritage-cream-300">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-1">
        {visibleNavItems.map(({ page, label, icon: Icon }) => {
          const active = currentPage === page;
          return (
            <button
              key={page}
              onClick={() => { onNavigate(page); onCloseMobile(); }}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors
                ${active
                  ? 'bg-heritage-green-800 text-heritage-gold-300 font-medium'
                  : 'text-heritage-cream-200 hover:bg-heritage-green-800/60'
                }`}
            >
              <Icon size={18} className={active ? 'text-heritage-gold-400' : 'text-heritage-cream-400'} />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="px-6 py-4 border-t border-heritage-green-800 text-[11px] text-heritage-green-400">
        <p className="italic">"{data.family.motto}"</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:block w-64 shrink-0 h-screen sticky top-0">{content}</aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onCloseMobile} />
          <div className="absolute inset-y-0 left-0 w-72 shadow-xl">{content}</div>
        </div>
      )}
    </>
  );
};
