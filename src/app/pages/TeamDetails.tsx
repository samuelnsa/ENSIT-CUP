import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Shield, Trophy, Target, TrendingUp } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useÉquipe, useJoueurs, useMatchs, useÉquipes } from '../hooks/useSupabase';
import { formaterDate } from '../utils/date';

export const TeamDetails = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { équipe, chargement: chE } = useÉquipe(teamId ?? '');
  const { joueurs: players, chargement: chJ } = useJoueurs(teamId ?? '');
  const { matchs, chargement: chM } = useMatchs();
  const { équipes } = useÉquipes();

  const teamMatches = useMemo(() => matchs.filter(m => m.équipe_a_id === teamId || m.équipe_b_id === teamId), [matchs, teamId]);

  const stats = useMemo(() => {
    const finished = teamMatches.filter(m => m.statut === 'terminé');
    const wins = finished.filter(m => (m.équipe_a_id === teamId && (m.score_a ?? 0) > (m.score_b ?? 0)) || (m.équipe_b_id === teamId && (m.score_b ?? 0) > (m.score_a ?? 0))).length;
    const draws = finished.filter(m => m.score_a === m.score_b).length;
    const losses = finished.length - wins - draws;
    const gF = teamMatches.reduce((s, m) => s + ((m.équipe_a_id === teamId ? m.score_a : m.score_b) ?? 0), 0);
    const gA = teamMatches.reduce((s, m) => s + ((m.équipe_a_id === teamId ? m.score_b : m.score_a) ?? 0), 0);
    const pts = wins * 3 + draws;

    const ranking = équipes.reduce<Record<string, number>>((acc, t) => { acc[t.id] = 0; return acc; }, {});
    matchs.filter(m => m.statut === 'terminé').forEach(m => {
      const sA = m.score_a ?? 0, sB = m.score_b ?? 0;
      if (sA > sB) ranking[m.équipe_a_id] = (ranking[m.équipe_a_id] || 0) + 3;
      else if (sA < sB) ranking[m.équipe_b_id] = (ranking[m.équipe_b_id] || 0) + 3;
      else { ranking[m.équipe_a_id] = (ranking[m.équipe_a_id] || 0) + 1; ranking[m.équipe_b_id] = (ranking[m.équipe_b_id] || 0) + 1; }
    });
    const sorted = Object.entries(ranking).sort((a, b) => b[1] - a[1]);
    const pos = sorted.findIndex(([id]) => id === teamId) + 1;
    return { wins, draws, losses, gF, gA, pts, pos, played: finished.length };
  }, [teamMatches, teamId, équipes, matchs]);

  if (chE || chJ || chM) return (
    <div className="flex items-center justify-center h-full py-24">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-strong" />
    </div>
  );

  if (!équipe) return (
    <div className="p-8 text-center text-muted">Équipe introuvable.</div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-slide-up">
      {/* Back */}
      <button onClick={() => navigate('/teams')} className="flex items-center gap-2 text-sm font-medium text-muted hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Retour aux équipes
      </button>

      {/* Hero banner */}
      <div className="glass rounded-3xl p-6 sm:p-8 border-panel relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-strong/5 via-transparent to-purple-500/5 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative flex-shrink-0">
            <div className="w-28 h-28 rounded-3xl overflow-hidden ring-4 ring-accent-strong/20 bg-panel-soft p-2">
              <ImageWithFallback src={équipe.logo} alt={équipe.nom} className="w-full h-full object-contain" />
            </div>
            <div className={`absolute -bottom-2 -right-2 text-xs font-bold px-2 py-1 rounded-full ${équipe.statut === 'disqualifié' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
              {équipe.statut === 'disqualifié' ? 'Désactivée' : 'Active'}
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-display font-black text-primary">{équipe.nom}</h1>
            <p className="text-muted mt-1 text-sm">{équipe.description}</p>
            <div className="flex flex-wrap gap-4 mt-4 justify-center sm:justify-start">
              <div className="px-3 py-1.5 rounded-xl bg-panel-soft border-panel text-xs font-semibold text-muted">
                <span className="text-accent-strong">{équipe.classe}</span>
              </div>
              {stats.pos > 0 && (
                <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400">
                  #{stats.pos} au classement
                </div>
              )}
              <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
                {players.length} joueurs
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Points', value: stats.pts, icon: Trophy, color: 'text-amber-400', bg: 'stat-gold' },
          { label: 'Victoires', value: stats.wins, icon: TrendingUp, color: 'text-emerald-400', bg: 'stat-green' },
          { label: 'Buts pour', value: stats.gF, icon: Target, color: 'text-blue-400', bg: 'stat-blue' },
          { label: 'Matchs joués', value: stats.played, icon: Shield, color: 'text-purple-400', bg: 'stat-purple' },
        ].map(s => (
          <div key={s.label} className={`glass card-3d p-5 rounded-2xl border-panel ${s.bg}`}>
            <s.icon className={`w-5 h-5 mb-3 ${s.color}`} />
            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Bilan détaillé */}
        <div className="glass rounded-2xl border-panel p-6">
          <h3 className="font-display font-bold text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent-strong" /> Bilan
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Matchs joués', v: stats.played },
              { label: 'Victoires', v: stats.wins, cls: 'text-emerald-400' },
              { label: 'Nuls', v: stats.draws, cls: 'text-yellow-400' },
              { label: 'Défaites', v: stats.losses, cls: 'text-red-400' },
              { label: 'Buts pour', v: stats.gF },
              { label: 'Buts contre', v: stats.gA },
              { label: 'Différence', v: stats.gF - stats.gA, cls: (stats.gF - stats.gA) >= 0 ? 'text-emerald-400' : 'text-red-400' },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-center py-2 border-b border-panel last:border-0">
                <span className="text-sm text-muted">{r.label}</span>
                <span className={`font-bold ${r.cls || 'text-primary'}`}>{r.v !== undefined && (r.v as number) > 0 && r.label === 'Différence' ? `+${r.v}` : r.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Effectif */}
        <div className="lg:col-span-2 glass rounded-2xl border-panel p-6">
          <h3 className="font-display font-bold text-primary mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" /> Effectif ({players.length} joueurs)
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-2">
            {players.map(player => (
              <div key={player.id} className="flex items-center justify-between p-3 rounded-xl bg-panel-soft hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-strong to-accent-medium flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
                    {player.numéro}
                  </div>
                  <div>
                    <p className="font-semibold text-primary text-sm">{player.nom}</p>
                    <p className="text-xs text-muted">{player.poste}</p>
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-right">
                  <div>
                    <div className="font-black text-emerald-400">{player.buts}</div>
                    <div className="text-muted">buts</div>
                  </div>
                  <div>
                    <div className="font-black text-blue-400">{player.passes_décisives}</div>
                    <div className="text-muted">passes</div>
                  </div>
                </div>
              </div>
            ))}
            {players.length === 0 && <p className="text-sm text-muted text-center py-6">Aucun joueur inscrit.</p>}
          </div>
        </div>
      </div>

      {/* Matchs de l'équipe */}
      <div className="glass rounded-2xl border-panel p-6">
        <h3 className="font-display font-bold text-primary mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-accent-strong" /> Matchs de cette équipe
        </h3>
        {teamMatches.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">Aucun match programmé.</p>
        ) : (
          <div className="space-y-2">
            {teamMatches.map(match => {
              const opId = match.équipe_a_id === teamId ? match.équipe_b_id : match.équipe_a_id;
              const opp = équipes.find(t => t.id === opId);
              const isHome = match.équipe_a_id === teamId;
              const myScore = isHome ? match.score_a : match.score_b;
              const oppScore = isHome ? match.score_b : match.score_a;
              const won = match.statut === 'terminé' && (myScore ?? 0) > (oppScore ?? 0);
              const lost = match.statut === 'terminé' && (myScore ?? 0) < (oppScore ?? 0);
              return (
                <div key={match.id} className="flex items-center gap-4 p-3 rounded-xl bg-panel-soft hover:bg-white/5 transition-colors">
                  <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${won ? 'bg-emerald-400' : lost ? 'bg-red-400' : 'bg-yellow-400'}`} />
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ImageWithFallback src={opp?.logo || ''} alt={opp?.nom || ''} className="w-8 h-8 rounded-full object-contain" />
                    <span className="font-semibold text-primary text-sm hidden sm:block">{opp?.nom}</span>
                  </div>
                  <div className="flex-1 text-xs text-muted">
                    <span className="sm:hidden font-semibold text-primary mr-2">{opp?.nom}</span>
                    {formaterDate(match.date)} · {match.heure}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {match.statut === 'terminé' ? (
                      <span className={`text-base font-black ${won ? 'text-emerald-400' : lost ? 'text-red-400' : 'text-yellow-400'}`}>
                        {myScore} - {oppScore}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-blue-400 px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">À venir</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
