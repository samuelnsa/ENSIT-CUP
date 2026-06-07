import React from 'react';
import { useÉquipes, useTousLesJoueurs, useMatchs } from '../hooks/useSupabase';
import { BarChart3, Goal, UserCheck, Trophy, TrendingUp, Zap, Star } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { BallSVG, BootSVG, StarSVG } from '../components/figma/FootIcons';

export const Statistics = () => {
  const { joueurs, chargement: chJ } = useTousLesJoueurs();
  const { équipes } = useÉquipes();
  const { matchs, chargement: chM } = useMatchs();

  if (chJ || chM) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-strong" />
      </div>
    );
  }

  const played = matchs.filter(m => m.score_a !== null && m.score_b !== null);
  const totalGoals = played.reduce((s, m) => s + (m.score_a ?? 0) + (m.score_b ?? 0), 0);
  const avgGoals = played.length ? (totalGoals / played.length).toFixed(1) : '0.0';

  const playerPoints = joueurs.map(p => ({ ...p, pts: p.buts * 2 + p.passes_décisives }));
  const topScorers = [...joueurs].sort((a, b) => b.buts - a.buts).filter(p => p.buts > 0).slice(0, 10);
  const topAssists = [...joueurs].sort((a, b) => b.passes_décisives - a.passes_décisives).filter(p => p.passes_décisives > 0).slice(0, 10);
  const mvpList = [...playerPoints].sort((a, b) => b.pts - a.pts).slice(0, 3);

  const teamStats = équipes.map(team => {
    const tm = played.filter(m => m.équipe_a_id === team.id || m.équipe_b_id === team.id);
    const s = tm.reduce((acc, m) => {
      const home = m.équipe_a_id === team.id;
      const gF = home ? (m.score_a ?? 0) : (m.score_b ?? 0);
      const gA = home ? (m.score_b ?? 0) : (m.score_a ?? 0);
      return { played: acc.played + 1, wins: acc.wins + (gF > gA ? 1 : 0), draws: acc.draws + (gF === gA ? 1 : 0), losses: acc.losses + (gF < gA ? 1 : 0), gF: acc.gF + gF, gA: acc.gA + gA };
    }, { played: 0, wins: 0, draws: 0, losses: 0, gF: 0, gA: 0 });
    return { ...team, ...s, diff: s.gF - s.gA, points: s.wins * 3 + s.draws };
  }).sort((a, b) => b.points - a.points || b.diff - a.diff).slice(0, 5);

  const kpis = [
    { label: 'Joueurs inscrits', value: joueurs.length, icon: UserCheck, color: 'stat-blue', textColor: 'text-blue-400' },
    { label: 'Équipes en course', value: équipes.length, icon: Trophy, color: 'stat-green', textColor: 'text-accent-strong' },
    { label: 'Matchs programmés', value: matchs.length, icon: TrendingUp, color: 'stat-purple', textColor: 'text-purple-400' },
    { label: 'Buts marqués', value: totalGoals, icon: Goal, color: 'stat-gold', textColor: 'text-amber-400' },
  ];

  return (
    <div className="min-h-screen -m-8 relative overflow-hidden">
      {/* Fond terrain */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] z-0">
        <svg viewBox="0 0 100 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <rect x="5" y="5" width="90" height="110" fill="none" stroke="currentColor" strokeWidth="0.2" className="text-blue-400" />
          <circle cx="50" cy="60" r="9" fill="none" stroke="currentColor" strokeWidth="0.2" className="text-blue-400" />
        </svg>
      </div>

      {/* Orbes */}
      <div className="fixed top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none z-0 animate-float" />
      <div className="fixed bottom-32 right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none z-0 animate-float" style={{ animationDelay: '1.5s' }} />

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-slide-up">
        {/* Header */}
        <div className="glass p-6 rounded-3xl border border-blue-500/20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center shadow-xl">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-black bg-gradient-to-r from-blue-400 via-purple-400 to-purple-500 bg-clip-text text-transparent">
                Statistiques du Tournoi
              </h1>
              <p className="text-sm text-muted mt-0.5">Performances, records et classements individuels</p>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(k => (
            <div key={k.label} className={`glass card-3d p-5 rounded-2xl border border-blue-500/20 hover:border-blue-500/40 transition-all ${k.color}`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-xl bg-panel-soft`}><k.icon className={`w-5 h-5 ${k.textColor}`} /></div>
              </div>
              <div className={`text-3xl font-display font-black mb-1 ${k.textColor}`}>{k.value}</div>
              <p className="text-xs text-muted">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Moyenne buts + MVP + Perf équipes */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* MVP */}
          <div className="glass rounded-2xl border border-amber-500/20 p-6">
            <h2 className="text-base font-display font-bold mb-4 flex items-center gap-2 text-primary">
              <StarSVG className="w-5 h-5 text-amber-400" /> Meilleurs du tournoi
            </h2>
            <div className="space-y-3">
              {mvpList.map((player, i) => {
                const team = équipes.find(t => t.id === player.équipe_id);
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <div key={player.id} className="flex items-center gap-3 p-3 rounded-xl bg-panel-soft">
                    <span className="text-xl">{medals[i]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-primary truncate">{player.nom}</div>
                      <div className="text-xs text-muted truncate">{team?.nom}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-black text-accent-strong">{player.pts} pts</div>
                      <div className="text-xs text-muted">{player.buts}B · {player.passes_décisives}P</div>
                    </div>
                  </div>
                );
              })}
              {mvpList.length === 0 && <p className="text-sm text-muted text-center py-4">Aucune stat enregistrée.</p>}
            </div>
          </div>

          {/* Perf équipes */}
          <div className="glass rounded-2xl border border-accent-strong/20 p-6">
            <h2 className="text-base font-display font-bold mb-4 flex items-center gap-2 text-primary">
              <Trophy className="w-5 h-5 text-accent-strong" /> Performance équipes
            </h2>
            <div className="space-y-3">
              {teamStats.map((team, i) => (
                <div key={team.id} className="flex items-center gap-3 p-3 rounded-xl bg-panel-soft">
                  <span className="text-lg font-black text-muted w-6 text-center">{i + 1}</span>
                  <ImageWithFallback src={team.logo || ''} alt={team.nom} className="w-9 h-9 rounded-full object-contain flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-primary truncate">{team.nom}</div>
                    <div className="text-xs text-muted">{team.points} pts · Diff {team.diff > 0 ? '+' : ''}{team.diff}</div>
                  </div>
                  <div className="text-right text-xs text-muted flex-shrink-0">
                    <div className="font-semibold text-primary">{team.gF}-{team.gA}</div>
                    <div>{team.played} matchs</div>
                  </div>
                </div>
              ))}
              {teamStats.length === 0 && <p className="text-sm text-muted text-center py-4">Aucun match terminé.</p>}
            </div>
          </div>

          {/* Moyenne buts */}
          <div className="glass rounded-2xl border border-amber-500/20 p-6 flex flex-col">
            <h2 className="text-base font-display font-bold mb-4 flex items-center gap-2 text-primary">
              <Zap className="w-5 h-5 text-amber-400" /> Intensité offensive
            </h2>
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 rounded-full bg-amber-500/10 border-2 border-amber-500/20 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <div className="text-4xl font-black text-amber-400">{avgGoals}</div>
                  <div className="text-xs text-muted mt-1">buts/match</div>
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm text-primary font-semibold">Total: {totalGoals} buts</p>
                <p className="text-xs text-muted">Sur {played.length} match{played.length > 1 ? 's' : ''} joué{played.length > 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top buteurs + Passeurs */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Buteurs */}
          <div className="glass rounded-2xl border border-emerald-500/20 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-display font-bold flex items-center gap-2 text-primary">
                <BallSVG className="w-5 h-5 text-emerald-400" /> Top Buteurs
              </h2>
              <span className="text-xs text-muted">Top 10</span>
            </div>
            <div className="space-y-2">
              {topScorers.map((p, i) => {
                const team = équipes.find(t => t.id === p.équipe_id);
                const pct = topScorers[0]?.buts ? (p.buts / topScorers[0].buts) * 100 : 0;
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="w-7 text-center text-xs font-bold text-muted">{i + 1}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-primary">{p.nom}</span>
                        <span className="text-sm font-black text-emerald-400">{p.buts}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted w-16 truncate">{team?.nom}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {topScorers.length === 0 && <p className="text-sm text-muted text-center py-6">Aucun but enregistré.</p>}
            </div>
          </div>

          {/* Passeurs */}
          <div className="glass rounded-2xl border border-blue-500/20 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-display font-bold flex items-center gap-2 text-primary">
                <BootSVG className="w-5 h-5 text-blue-400" /> Top Passeurs
              </h2>
              <span className="text-xs text-muted">Top 10</span>
            </div>
            <div className="space-y-2">
              {topAssists.map((p, i) => {
                const team = équipes.find(t => t.id === p.équipe_id);
                const pct = topAssists[0]?.passes_décisives ? (p.passes_décisives / topAssists[0].passes_décisives) * 100 : 0;
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="w-7 text-center text-xs font-bold text-muted">{i + 1}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-primary">{p.nom}</span>
                        <span className="text-sm font-black text-blue-400">{p.passes_décisives}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-300 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted w-16 truncate">{team?.nom}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {topAssists.length === 0 && <p className="text-sm text-muted text-center py-6">Aucune passe enregistrée.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
