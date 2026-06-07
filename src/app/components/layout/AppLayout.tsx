import React, { useState } from 'react';
import { Outlet, NavLink, Navigate } from 'react-router-dom';
import {
  Users, Calendar, LayoutDashboard,
  Trello, UserPlus, BarChart3, GitFork, LogOut, Shield,
  Activity, Menu, X, Target,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BallSVG, TrophySVG, ShirtSVG, WhistleSVG, BootSVG, StarSVG } from '../figma/FootIcons';

export const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const role = user?.role;
  const initials = (user?.full_name || user?.username || 'U').substring(0, 2).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'linear-gradient(135deg, #050810 0%, #0a1428 40%, #0d1f12 100%)' }}>

      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-30 transition-opacity duration-200 md:hidden ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:translate-x-0`}
        style={{ background: 'rgba(8,11,18,0.97)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Ballon avec glow */}
          <div className="relative w-10 h-10 flex-shrink-0">
            <div className="absolute inset-0 rounded-full blur-md opacity-60" style={{ background: 'radial-gradient(circle, #00e676 0%, transparent 70%)' }} />
            <div className="relative w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00e676 0%, #00b248 100%)', boxShadow: '0 0 20px rgba(0,230,118,0.4)' }}>
              <BallSVG className="w-5 h-5 text-black" />
            </div>
          </div>
          <div>
            <h1 className="text-sm font-display font-black" style={{ background: 'linear-gradient(135deg, #00e676, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              ENSIT Cup
            </h1>
            <p className="text-xs text-muted">Tournoi Interclasses</p>
          </div>
          {/* Étoiles déco */}
          <div className="ml-auto flex gap-0.5 opacity-30">
            <StarSVG className="w-2.5 h-2.5 text-yellow-400" />
            <StarSVG className="w-2.5 h-2.5 text-yellow-400" />
            <StarSVG className="w-2.5 h-2.5 text-yellow-400" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-5">

          <NavSection label="Général">
            <SidebarItem to="/" icon={<LayoutDashboard className="w-4 h-4" />} label="Tableau de bord" />
            <SidebarItem to="/matches" icon={<Calendar className="w-4 h-4" />} label="Matchs & Résultats" />
            <SidebarItem to="/standings" icon={<Activity className="w-4 h-4" />} label="Classement" />
            <SidebarItem to="/bracket" icon={<GitFork className="w-4 h-4 rotate-90" />} label="Phases Finales" />
            <SidebarItem to="/statistics" icon={<BarChart3 className="w-4 h-4" />} label="Statistiques" />
            <SidebarItem to="/teams" icon={<Users className="w-4 h-4" />} label="Équipes" />
          </NavSection>

          {role === 'captain' && (
            <NavSection label="Mon Équipe" accent="green">
              <SidebarItem to="/register-team" icon={<UserPlus className="w-4 h-4" />} label="Inscrire des joueurs" />
              <SidebarItem to="/tactics" icon={<Trello className="w-4 h-4" />} label="Composition tactique" />
            </NavSection>
          )}

          {role === 'admin' && (
            <NavSection label="Administration" accent="purple">
              <SidebarItem to="/admin" icon={<Shield className="w-4 h-4" />} label="Espace Admin" isAdmin />
            </NavSection>
          )}
        </nav>

        {/* Footer terrain mini + profil */}
        <div className="px-3 pb-3 space-y-3">
          {/* Terrain mini déco */}
          <div className="opacity-5 overflow-hidden rounded-xl h-14 flex items-center justify-center">
            <svg viewBox="0 0 200 100" className="w-full" fill="none">
              <rect x="4" y="4" width="192" height="92" rx="2" stroke="white" strokeWidth="2"/>
              <line x1="100" y1="4" x2="100" y2="96" stroke="white" strokeWidth="2"/>
              <circle cx="100" cy="50" r="20" stroke="white" strokeWidth="2"/>
              <rect x="4" y="28" width="30" height="44" stroke="white" strokeWidth="2"/>
              <rect x="166" y="28" width="30" height="44" stroke="white" strokeWidth="2"/>
            </svg>
          </div>

          {/* Profil */}
          <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {/* Avatar avec icône foot */}
            <div className="relative w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
              style={role === 'admin'
                ? { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 0 12px rgba(124,58,237,0.4)' }
                : { background: 'linear-gradient(135deg, #00e676, #00b248)', boxShadow: '0 0 12px rgba(0,230,118,0.4)' }
              }>
              <span className="text-black text-xs font-black">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-primary">{user?.full_name || user?.username}</p>
              <p className="text-xs font-medium flex items-center gap-1" style={{ color: role === 'admin' ? '#a78bfa' : '#00e676' }}>
                {role === 'admin' ? <><WhistleSVG className="w-3 h-3" /> Administrateur</> : <><ShirtSVG className="w-3 h-3" /> Capitaine</>}
              </p>
            </div>
            <button onClick={logout} className="p-1.5 rounded-lg transition-all hover:bg-white/10 text-muted hover:text-white flex-shrink-0" title="Déconnexion">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Contenu principal ────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Header mobile */}
        <header className="md:hidden flex items-center justify-between gap-3 px-4 py-3"
          style={{ background: 'rgba(8,11,18,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-xl hover:bg-white/10 text-muted transition" aria-label="Menu">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00e676, #00b248)', boxShadow: '0 0 12px rgba(0,230,118,0.4)' }}>
              <BallSVG className="w-4 h-4 text-black" />
            </div>
            <div>
              <p className="text-sm font-display font-black" style={{ background: 'linear-gradient(135deg, #00e676, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>ENSIT Cup</p>
              <p className="text-xs text-muted leading-none">Tournoi Interclasses</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-xl hover:bg-white/10 text-muted transition" aria-label="Fermer">
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

/* ── Sous-composants ──────────────────────────────────────── */

const NavSection = ({ label, children, accent }: { label: string; children: React.ReactNode; accent?: 'green' | 'purple' }) => (
  <div>
    <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: accent === 'green' ? 'rgba(0,230,118,0.6)' : accent === 'purple' ? 'rgba(167,139,250,0.6)' : 'rgba(148,163,184,0.5)' }}>
      {label}
    </p>
    <div className="space-y-0.5">{children}</div>
  </div>
);

const SidebarItem = ({ to, icon, label, isAdmin }: { to: string; icon: React.ReactNode; label: string; isAdmin?: boolean }) => (
  <NavLink
    to={to}
    end={to === '/'}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all duration-150 ${
        isActive
          ? isAdmin
            ? 'text-violet-300 border-violet-500/30'
            : 'text-accent-strong border-accent-strong/20'
          : 'text-muted border-transparent hover:text-primary hover:bg-white/5'
      }`
    }
    style={({ isActive }) => isActive
      ? isAdmin
        ? { background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.08))' }
        : { background: 'linear-gradient(135deg, rgba(0,230,118,0.12), rgba(0,178,72,0.06))' }
      : {}
    }
  >
    <span className="flex-shrink-0">{icon}</span>
    <span>{label}</span>
  </NavLink>
);
