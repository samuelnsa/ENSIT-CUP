import React, { useMemo } from 'react';
import { ArrowRight, Calendar, Zap, TrendingUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { BallSVG, TrophySVG, ShirtSVG, StarSVG, FieldLineSVG, BootSVG, WhistleSVG } from '../components/figma/FootIcons';
import { useÉquipes, useTousLesJoueurs, useMatchsÀVenir, useMatchs } from '../hooks/useSupabase';
import { useAuth } from '../context/AuthContext';
import { formaterDate } from '../utils/date';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { équipes, chargement: chargementÉquipes } = useÉquipes();
  const { joueurs } = useTousLesJoueurs();
  const { matchs: upcomingMatches } = useMatchsÀVenir();
  const { matchs } = useMatchs();

  const totalGoals = useMemo(() => joueurs.reduce((acc, j) => acc + Number(j.buts || 0), 0), [joueurs]);
  const topScorer = useMemo(() => [...joueurs].sort((a, b) => Number(b.buts || 0) - Number(a.buts || 0)).find(() => true), [joueurs]);

  const pointsByTeam = useMemo(() => {
    const totals = new Map<string, number>();
    matchs.filter(m => m.statut === 'terminé' && m.score_a !== null && m.score_b !== null).forEach(m => {
      const sA = Number(m.score_a), sB = Number(m.score_b);
      if (sA > sB) totals.set(m.équipe_a_id, (totals.get(m.équipe_a_id) ?? 0) + 3);
      else if (sA < sB) totals.set(m.équipe_b_id, (totals.get(m.équipe_b_id) ?? 0) + 3);
      else { totals.set(m.équipe_a_id, (totals.get(m.équipe_a_id) ?? 0) + 1); totals.set(m.équipe_b_id, (totals.get(m.équipe_b_id) ?? 0) + 1); }
    });
    return totals;
  }, [matchs]);

  const topThree = useMemo(() =>
    équipes.filter(t => t.statut === 'actif')
      .map(t => ({ teamId: t.id, points: pointsByTeam.get(t.id) ?? 0 }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 3),
  [équipes, pointsByTeam]);

  const role = user?.role;
  const isAdmin = role === 'admin';

  return (
    <div className="relative min-h-full overflow-hidden">
      {/* Terrain en fond très subtil */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.025] pointer-events-none select-none">
        <FieldLineSVG className="w-full h-full max-w-5xl" />
      </div>
      {/* Orbes */}
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #00e676 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-8 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />

      <div className="relative z-10 space-y-8 px-4 py-6 lg:px-8">

        {/* ── Header ───────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted mb-1 flex items-center gap-1.5">
              <BallSVG className="w-3 h-3 text-accent-strong" /> Tableau de bord
            </p>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-primary">
              Bienvenue{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''} <span className="text-accent-strong">⚽</span>
            </h1>
          </div>

          {/* Badge rôle */}
          <div className="inline-flex items-center gap-3 px-4 py-3 rounded-2xl flex-shrink-0"
            style={isAdmin
              ? { background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', boxShadow: '0 0 20px rgba(124,58,237,0.1)' }
              : { background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)', boxShadow: '0 0 20px rgba(0,230,118,0.08)' }
            }>
            {isAdmin ? <WhistleSVG className="w-5 h-5 text-violet-400" /> : <ShirtSVG className="w-5 h-5 text-accent-strong" />}
            <div>
              <p className="text-xs text-muted">Connecté en tant que</p>
              <p className="text-sm font-bold" style={{ color: isAdmin ? '#a78bfa' : '#00e676' }}>
                {isAdmin ? 'Administrateur' : 'Capitaine'}
              </p>
            </div>
          </div>
        </div>

        {/* ── KPIs ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { Icon: ShirtSVG, label: 'Équipes inscrites', value: chargementÉquipes ? '...' : équipes.length, sub: 'sur 10 max', to: '/teams-registered', glow: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
            { Icon: BallSVG, label: 'Buts marqués', value: totalGoals, sub: 'cette saison', to: '/goalscorers', glow: '#00e676', bg: 'rgba(0,230,118,0.08)', border: 'rgba(0,230,118,0.2)' },
            { Icon: TrophySVG, label: 'Meilleur buteur', value: topScorer?.nom || '—', sub: `${topScorer?.buts || 0} buts`, to: topScorer ? `/teams/${topScorer.équipe_id}` : '/statistics', glow: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
          ].map((card, i) => (
            <div key={i} onClick={() => navigate(card.to)}
              className="group relative rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-1 hover:scale-[1.01] overflow-hidden"
              style={{ background: card.bg, border: `1px solid ${card.border}`, boxShadow: `0 4px 24px rgba(0,0,0,0.3)` }}>
              {/* Glow hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" style={{ background: `radial-gradient(circle at top left, ${card.glow}15 0%, transparent 60%)` }} />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${card.glow}18`, border: `1px solid ${card.glow}30` }}>
                    <card.Icon className="w-6 h-6" style={{ color: card.glow }} />
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-muted" />
                </div>
                <div className="text-3xl font-display font-black mb-1 text-primary truncate">{card.value}</div>
                <p className="text-sm font-medium text-muted">{card.label}</p>
                <p className="text-xs text-muted/60 mt-0.5">{card.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Prochain match + Top 3 ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Prochain match */}
          <div className="lg:col-span-3 rounded-2xl p-6 animate-slide-up delay-300"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)' }}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.2)' }}>
                  <Zap className="w-4 h-4 text-accent-strong" />
                </div>
                <h2 className="text-base font-display font-bold text-primary">Prochain Match</h2>
              </div>
              <Link to="/matches" className="flex items-center gap-1 text-xs font-semibold text-accent-strong hover:gap-2 transition-all">
                Voir tout <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {upcomingMatches.length > 0 ? (
              <div onClick={() => navigate(`/matches/${upcomingMatches[0].id}`)}
                className="rounded-2xl p-5 cursor-pointer group transition-all hover:scale-[1.01] relative overflow-hidden"
                style={{ background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.15)' }}>
                {/* Ballon déco */}
                <div className="absolute -right-4 -top-4 opacity-5">
                  <BallSVG className="w-24 h-24 text-accent-strong" />
                </div>
                <div className="flex justify-center mb-5">
                  <span className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.25)', color: '#00e676' }}>
                    <Calendar className="w-3 h-3" />
                    {formaterDate(upcomingMatches[0].date)} · {upcomingMatches[0].heure}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <TeamDisplay teamId={upcomingMatches[0].équipe_a_id} équipes={équipes} align="right" />
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <div className="text-2xl font-black text-muted/20">VS</div>
                    <div className="animate-[breathe_2s_ease-in-out_infinite]">
                      <BallSVG className="w-6 h-6 text-accent-strong" />
                    </div>
                  </div>
                  <TeamDisplay teamId={upcomingMatches[0].équipe_b_id} équipes={équipes} align="left" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="opacity-20">
                  <BallSVG className="w-14 h-14 text-muted" />
                </div>
                <p className="text-muted text-sm">Aucun match programmé</p>
              </div>
            )}
          </div>

          {/* Top 3 */}
          <div className="lg:col-span-2 rounded-2xl p-6 animate-slide-up delay-400"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)' }}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <TrophySVG className="w-4 h-4 text-amber-400" />
                </div>
                <h2 className="text-base font-display font-bold text-primary">Top 3</h2>
              </div>
              <Link to="/standings" className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:gap-2 transition-all">
                Classement <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {topThree.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 opacity-30">
                  <TrophySVG className="w-10 h-10 text-muted" />
                  <p className="text-sm text-muted">Aucun classement</p>
                </div>
              ) : topThree.map((row, i) => {
                const team = équipes.find(t => t.id === row.teamId);
                const medals = ['🥇', '🥈', '🥉'];
                const colors = ['#f59e0b', '#9ca3af', '#d97706'];
                return (
                  <div key={row.teamId} onClick={() => navigate(`/teams/${row.teamId}`)}
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.01] group"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-lg w-7 text-center flex-shrink-0">{medals[i]}</span>
                    <div className="w-10 h-10 rounded-2xl overflow-hidden flex-shrink-0 ring-2 ring-white/10">
                      <ImageWithFallback src={team?.logo || ''} alt={team?.nom || ''} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-primary">{team?.nom || '—'}</p>
                      <p className="text-xs text-muted">{team?.classe}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-black" style={{ color: colors[i] }}>{row.points}</div>
                      <div className="text-xs text-muted">pts</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Accès rapide selon le rôle ──────────────── */}
        {role === 'captain' && (
          <div className="rounded-2xl p-5" style={{ background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.15)' }}>
            <h2 className="text-sm font-display font-bold text-accent-strong mb-4 flex items-center gap-2">
              <ShirtSVG className="w-4 h-4" /> Espace Capitaine
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { icon: ShirtSVG, label: 'Inscrire des joueurs', sub: 'Gérez l\'effectif de votre équipe', to: '/register-team', color: '#00e676' },
                { icon: BootSVG, label: 'Composition tactique', sub: 'Placez vos joueurs sur le terrain', to: '/tactics', color: '#3b82f6' },
              ].map(a => (
                <div key={a.to} onClick={() => navigate(a.to)}
                  className="flex items-center gap-3 p-4 rounded-xl cursor-pointer group transition-all hover:scale-[1.02]"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${a.color}18`, border: `1px solid ${a.color}30` }}>
                    <a.icon className="w-5 h-5" style={{ color: a.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-primary text-sm">{a.label}</p>
                    <p className="text-xs text-muted">{a.sub}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              ))}
            </div>
          </div>
        )}

        {role === 'admin' && (
          <div className="rounded-2xl p-5" style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <h2 className="text-sm font-display font-bold text-violet-400 mb-4 flex items-center gap-2">
              <WhistleSVG className="w-4 h-4" /> Espace Administrateur
            </h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { icon: ShirtSVG, label: 'Gérer les équipes', sub: `${équipes.length} équipes`, to: '/admin?tab=teams', color: '#3b82f6' },
                { icon: BallSVG, label: 'Gérer les matchs', sub: `${matchs.length} matchs`, to: '/admin?tab=matches', color: '#00e676' },
                { icon: TrophySVG, label: 'Vue d\'ensemble', sub: 'Tableau de bord admin', to: '/admin', color: '#a78bfa' },
              ].map(a => (
                <div key={a.to} onClick={() => navigate(a.to)}
                  className="flex items-center gap-3 p-4 rounded-xl cursor-pointer group transition-all hover:scale-[1.02]"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${a.color}18`, border: `1px solid ${a.color}30` }}>
                    <a.icon className="w-4 h-4" style={{ color: a.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-primary text-sm truncate">{a.label}</p>
                    <p className="text-xs text-muted">{a.sub}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Icônes déco bas */}
        <div className="flex items-center justify-center gap-6 pt-2 opacity-10">
          <BallSVG className="w-5 h-5 text-white" />
          <TrophySVG className="w-5 h-5 text-white" />
          <ShirtSVG className="w-5 h-5 text-white" />
          <WhistleSVG className="w-5 h-5 text-white" />
          <BootSVG className="w-5 h-5 text-white" />
          <StarSVG className="w-4 h-4 text-white" />
        </div>

      </div>
    </div>
  );
};

const TeamDisplay = ({ teamId, équipes, align }: { teamId: string; équipes: any[]; align: 'left' | 'right' }) => {
  const team = équipes.find(t => t.id === teamId);
  if (!team) return <div className="flex-1" />;
  return (
    <div className={`flex flex-col items-center gap-3 flex-1 ${align === 'right' ? 'items-end' : 'items-start'}`}>
      <div className="w-14 h-14 rounded-2xl overflow-hidden animate-[float_6s_ease-in-out_infinite]" style={{ border: '2px solid rgba(0,230,118,0.2)' }}>
        <ImageWithFallback src={team.logo} alt={team.nom} className="w-full h-full object-contain" />
      </div>
      <div className={align === 'right' ? 'text-right' : 'text-left'}>
        <p className="font-bold text-sm text-primary">{team.nom}</p>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(148,163,184,0.8)' }}>{team.classe}</span>
      </div>
    </div>
  );
};
