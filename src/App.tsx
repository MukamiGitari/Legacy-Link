import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { PersonDrawer } from './components/members/PersonDrawer';
import { ToastStack } from './components/layout/ToastStack';
import { AddEditMemberModal } from './components/members/AddEditMemberModal';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { TreePage } from './pages/TreePage';
import { MyFamily } from './pages/MyFamily';
import { Directory } from './pages/Directory';
import { MemberProfile } from './pages/MemberProfile';
import { Gallery } from './pages/Gallery';
import { Cookbook } from './pages/Cookbook';
import { Memories } from './pages/Memories';
import { Events } from './pages/Events';
import { Announcements } from './pages/Announcements';
import { Chronicle } from './pages/Chronicle';
import { Dictionary } from './pages/Dictionary';
import { Trivia } from './pages/Trivia';
import { Games } from './pages/Games';
import { Admin } from './pages/Admin';
import { useApp } from './context/AppContext';
import { isAdminRole, canAddContent } from './lib/permissions';
import { ShieldAlert } from 'lucide-react';

export type Page =
  | 'dashboard' | 'myFamily' | 'tree' | 'directory' | 'profile' | 'gallery' | 'cookbook'
  | 'memories' | 'events' | 'announcements' | 'chronicle' | 'dictionary' | 'trivia' | 'games' | 'admin';

const App: React.FC = () => {
  const { isAuthenticated, isLoading, currentProfile } = useApp();
  const isAdmin = isAdminRole(currentProfile?.role);
  const [page, setPage] = useState<Page>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [drawerMemberId, setDrawerMemberId] = useState<string | null>(null);
  const [modalMemberId, setModalMemberId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [profileMemberId, setProfileMemberId] = useState<string | null>(null);

  const navigate = (p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openMemberDrawer = (id: string) => {
    setMobileSidebarOpen(false);
    setDrawerMemberId(id);
  };

  const openProfile = (id: string) => {
    setProfileMemberId(id);
    setDrawerMemberId(null);
    setPage('profile');
  };

  const openEditModal = (id: string) => {
    setMobileSidebarOpen(false);
    setModalMemberId(id);
    setDrawerMemberId(null);
  };

  const openAddModal = () => {
    setMobileSidebarOpen(false);
    setShowAddModal(true);
  };

  const viewFullTree = (anchorId: string) => {
    setPage('tree');
    setDrawerMemberId(anchorId);
  };

  // Lock background scroll while any full-screen drawer/modal is open, so the
  // page behind it can't scroll or show its own scrollbar underneath the
  // overlay (the cause of the "cut out" look when a drawer opens on mobile).
  React.useEffect(() => {
    const anyOverlayOpen = Boolean(drawerMemberId || modalMemberId || showAddModal || mobileSidebarOpen);
    document.body.style.overflow = anyOverlayOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerMemberId, modalMemberId, showAddModal, mobileSidebarOpen]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-heritage-cream-200 dark:bg-heritage-dark-bg">
        <div className="animate-pulse text-heritage-green-700 dark:text-heritage-dark-muted text-sm tracking-wide">
          Loading your family archive…
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Login />;

  return (
    <div className="flex min-h-screen bg-heritage-cream-200 dark:bg-heritage-dark-bg">
      <Sidebar
        currentPage={page}
        onNavigate={navigate}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 min-w-0">
        <Topbar
          page={page}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onAddMember={openAddModal}
          canAddMember={canAddContent(currentProfile?.role)}
        />

        <main className="p-4 md:p-8 max-w-7xl mx-auto">
          {page === 'dashboard' && <Dashboard onNavigate={navigate} onSelectMember={openMemberDrawer} />}
          {page === 'myFamily' && <MyFamily onSelectMember={openMemberDrawer} onViewFullTree={viewFullTree} />}
          {page === 'tree' && <TreePage onSelectMember={openMemberDrawer} />}
          {page === 'directory' && <Directory onSelectMember={openMemberDrawer} />}
          {page === 'profile' && profileMemberId && (
            <MemberProfile
              memberId={profileMemberId}
              onBack={() => navigate('directory')}
              onSelectMember={openProfile}
              onEdit={openEditModal}
            />
          )}
          {page === 'gallery' && <Gallery onSelectMember={openMemberDrawer} />}
          {page === 'cookbook' && <Cookbook onSelectMember={openMemberDrawer} />}
          {page === 'memories' && <Memories onSelectMember={openMemberDrawer} />}
          {page === 'events' && <Events />}
          {page === 'announcements' && <Announcements />}
          {page === 'chronicle' && <Chronicle />}
          {page === 'dictionary' && <Dictionary onSelectMember={openMemberDrawer} />}
          {page === 'trivia' && <Trivia />}
          {page === 'games' && <Games />}
          {page === 'admin' && (isAdmin ? <Admin /> : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-12 text-center">
              <ShieldAlert size={28} className="text-heritage-bark-500" />
              <p className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text">Admins only</p>
              <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted max-w-sm">
                The Admin Suite is restricted to Family Admins and Super Admins. Ask a family admin if you need something changed here.
              </p>
            </div>
          ))}
        </main>
      </div>

      {drawerMemberId && (
        <PersonDrawer
          memberId={drawerMemberId}
          onClose={() => setDrawerMemberId(null)}
          onSelectMember={openMemberDrawer}
          onEdit={openEditModal}
          onViewProfile={openProfile}
        />
      )}

      {(showAddModal || modalMemberId) && canAddContent(currentProfile?.role) && (
        <AddEditMemberModal
          memberId={modalMemberId}
          onClose={() => { setShowAddModal(false); setModalMemberId(null); }}
        />
      )}

      <ToastStack />
    </div>
  );
};

export default App;
