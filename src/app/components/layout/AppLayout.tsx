import React, { useState } from 'react';
import { Outlet, NavLink, Navigate, useLocation } from 'react-router-dom';
import {
  Trophy, Users, Calendar, LayoutDashboard, Settings,
  Trello, UserPlus, BarChart3, GitFork, LogOut, Shield,
  Loader2, Activity, Menu, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Auth resolution is now instant, no need for full screen loading spinner

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const role = user?.role;

  return (
    <div className="flex h-screen bg-mesh overflow-hidden">
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-30 transition-opacity duration-200 md:hidden ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar fixed inset-y-0 left-0 z-40 w-64 transform bg-mesh transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:translate-x-0 md:block`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center hero-gradient-green">
            <Trophy className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-base font-display font-bold text-primary">ENSIT Cup</h1>
            <p className="text-xs text-muted">Tournoi Interclasses</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <NavSection label="Général">
            <SidebarItem to="/" icon={<LayoutDashboard />} label="Tableau de bord" />
            <SidebarItem to="/matches" icon={<Calendar />} label="Matchs & Résultats" />
            <SidebarItem to="/standings" icon={<Activity />} label="Classement" />
            <SidebarItem to="/bracket" icon={<GitFork className="rotate-90" />} label="Phases Finales" />
            <SidebarItem to="/statistics" icon={<BarChart3 />} label="Statistiques" />
            <SidebarItem to="/teams" icon={<Users />} label="Équipes" />
          </NavSection>

          {role === 'captain' && (
            <NavSection label="Mon Équipe">
              <SidebarItem to="/register-team" icon={<UserPlus />} label="Inscrire des joueurs" />
              <SidebarItem to="/tactics" icon={<Trello />} label="Composition" />
            </NavSection>
          )}

          {role === 'admin' && (
            <NavSection label="Administration">
              <SidebarItem to="/admin" icon={<Shield />} label="Espace Admin" isAdmin />
            </NavSection>
          )}
        </nav>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-panel">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-panel-overlay">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-black flex-shrink-0 ${role === 'admin' ? 'hero-gradient-purple' : 'hero-gradient-green'}`}>
              {(user?.full_name || user?.username || 'U').substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-primary">
                {user?.full_name || user?.username}
              </p>
              <p className={`text-xs font-medium capitalize ${role === 'admin' ? 'text-sky-500' : 'text-accent-strong'}`}>
                {role === 'admin' ? '⚡ Administrateur' : '👤 Capitaine'}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg transition-all flex-shrink-0 hover:bg-white/10 hover:text-white text-muted"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="md:hidden flex items-center justify-between gap-3 border-b border-panel bg-panel-dark px-4 py-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl bg-panel-overlay text-muted transition hover:bg-white/10"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center hero-gradient-green">
              <Trophy className="w-5 h-5 text-black" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">ENSIT Cup</p>
              <p className="text-xs text-muted">Tournoi Interclasses</p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-xl bg-panel-overlay text-muted transition hover:bg-white/10"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const NavSection = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mb-5">
    <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest text-muted">{label}</p>
    {children}
  </div>
);

const SidebarItem = ({ to, icon, label, isAdmin }: { to: string; icon: React.ReactNode; label: string; isAdmin?: boolean }) => (
  <NavLink
    to={to}
    end={to === '/'}
    className={({ isActive }) =>
      `sidebar-nav-item ${isActive ? 'active' : ''} ${isAdmin ? 'admin-nav' : ''}`
    }
  >
    <span className="w-4 h-4 flex-shrink-0">{icon}</span>
    <span>{label}</span>
  </NavLink>
);
