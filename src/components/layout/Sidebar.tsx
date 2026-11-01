import React from 'react';
import {
  Home, Users, Image, ChefHat, TreePine, BookHeart,
  ScrollText, ShieldCheck, X, UsersRound, Languages, Brain, Gamepad2, Sparkles, type LucideIcon,
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

interface NavGroup {
  /** Section heading shown above the items; omitted for the top-level Home link. */
  heading?: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  { items: [{ page: 'dashboard', label: 'Home', icon: Home }] },
  {
    heading: 'Genealogy',
    items: [
      { page: 'tree', label: 'Family Tree', icon: TreePine },
      { page: 'myFamily', label: 'My Family', icon: UsersRound },
      { page: 'directory', label: 'Members', icon: Users },
    ],
  },
  {
    heading: 'Archives',
    items: [
      { page: 'dictionary', label: 'Vault', icon: Languages },
      { page: 'gallery', label: 'Albums', icon: Image },
    ],
  },
  {
    heading: 'Culture',
    items: [
      { page: 'chronicle', label: 'Chronicle', icon: ScrollText },
      { page: 'memories', label: 'Memories', icon: BookHeart },
      { page: 'cookbook', label: 'Cookbook', icon: ChefHat },
    ],
  },
  {
    heading: 'Fun',
    items: [
      { page: 'games', label: 'Games', icon: Gamepad2 },
      { page: 'trivia', label: 'Family Trivia', icon: Brain },
    ],
  },
  { heading: 'Admin', items: [{ page: 'admin', label: 'Admin Suite', icon: ShieldCheck, adminOnly: true }] },
];

interface SidebarProps {
  currentPage: Page;
  onNavigate: (p: Page) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenAssistant?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  mobileOpen,
  onCloseMobile,
  onOpenAssistant,
}) => {
  const { data, currentProfile } = useApp();
  const rawFamilyName = (data.family?.name || '').replace(/\s*family\s*/i, '').trim() || 'Family';
  const assistantName = `${rawFamilyName} Assistant`;

  const visibleGroups = NAV_GROUPS
    .map(g => ({ ...g, items: g.items.filter(item => !item.adminOnly || isAdminRole(currentProfile.role)) }))
    .filter(g => g.items.length > 0);

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

      {/* Prominent Chatbot Assistant Button */}
      {onOpenAssistant && (
        <div className="px-3 pt-3">
          <button
            onClick={() => {
              onOpenAssistant();
              onCloseMobile();
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-heritage-gold-500/25 via-amber-500/20 to-heritage-gold-500/10 border border-heritage-gold-500/50 text-heritage-gold-300 hover:brightness-110 active:scale-95 transition-all text-xs font-bold shadow-md group"
            title={`Ask ${assistantName}`}
          >
            <Sparkles size={16} className="text-heritage-gold-400 group-hover:rotate-12 transition-transform shrink-0" />
            <span className="truncate">{assistantName}</span>
            <span className="ml-auto flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-heritage-gold-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-heritage-gold-400"></span>
            </span>
          </button>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-4">
        {visibleGroups.map((group, gi) => (
          <div key={group.heading ?? `g${gi}`} className="space-y-1">
            {group.heading && (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-heritage-gold-400/80">
                {group.heading}
              </p>
            )}
            {group.items.map(({ page, label, icon: Icon }) => {
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
          </div>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-heritage-green-800 text-[11px] text-heritage-green-400">
        <p className="italic">"{data.family.motto}"</p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:block w-64 shrink-0 h-screen sticky top-0 shadow-soft-lg z-30">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
