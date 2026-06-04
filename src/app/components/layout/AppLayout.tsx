import React from 'react';
import { Outlet, NavLink, Navigate, useLocation } from 'react-router-dom';
import {
  Trophy, Users, Calendar, LayoutDashboard, Settings,
  Trello, UserPlus, BarChart3, GitFork, LogOut, Shield,
  Loader2, Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AppLayout = () => {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Auth resolution is now instant, no need for full screen loading spinner

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const role = user?.role;

  return (
    <div className="flex h-screen bg-mesh overflow-hidden">
      {/* Sidebar */}
      <aside className="sidebar w-64 flex-shrink-0">
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
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
