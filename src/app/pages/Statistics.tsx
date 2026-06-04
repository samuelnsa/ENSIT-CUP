import React from 'react';
import { useÉquipes, useTousLesJoueurs, useMatchs } from '../hooks/useSupabase';
import { BarChart3, Goal, UserCheck, Trophy, TrendingUp } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export const Statistics = () => {
  const { joueurs, chargement: chargementJoueurs } = useTousLesJoueurs();
  const { équipes } = useÉquipes();
  const { matchs, chargement: chargementMatchs } = useMatchs();

  const chargement = chargementJoueurs || chargementMatchs;
  if (chargement) {
    return <div className="p-8 text-slate-500">Chargement des statistiques...</div>;
  }

  const playedMatches = matchs.filter(m => m.score_a !== null && m.score_b !== null);
  const totalGoals = playedMatches.reduce((sum, m) => sum + (m.score_a ?? 0) + (m.score_b ?? 0), 0);
  const averageGoals = playedMatches.length ? (totalGoals / playedMatches.length).toFixed(1) : '0.0';
  const totalMatches = matchs.length;
  const totalTeams = équipes.length;
  const totalPlayers = joueurs.length;

  const playerPoints = joueurs.map(player => ({
    ...player,
    points: player.buts * 2 + player.passes_décisives,
  }));

  const topScorers = [...joueurs].sort((a, b) => b.buts - a.buts).filter(p => p.buts > 0).slice(0, 10);
  const topAssists = [...joueurs].sort((a, b) => b.passes_décisives - a.passes_décisives).filter(p => p.passes_décisives > 0).slice(0, 10);
  const mvpList = [...playerPoints].sort((a, b) => b.points - a.points).slice(0, 3);

  const teamStats = équipes.map(team => {
    const teamMatches = playedMatches.filter(m => m.équipe_a_id === team.id || m.équipe_b_id === team.id);
    const stats = teamMatches.reduce(
      (acc, match) => {
        const isHome = match.équipe_a_id === team.id;
        const goalsFor = isHome ? (match.score_a ?? 0) : (match.score_b ?? 0);
        const goalsAgainst = isHome ? (match.score_b ?? 0) : (match.score_a ?? 0);
        const win = goalsFor > goalsAgainst ? 1 : 0;
        const draw = goalsFor === goalsAgainst ? 1 : 0;
        const loss = goalsFor < goalsAgainst ? 1 : 0;
        return {
          played: acc.played + 1,
          wins: acc.wins + win,
          draws: acc.draws + draw,
          losses: acc.losses + loss,
          goalsFor: acc.goalsFor + goalsFor,
          goalsAgainst: acc.goalsAgainst + goalsAgainst,
        };
      },
      { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 }
    );
    return {
      ...team,
      ...stats,
      goalDifference: stats.goalsFor - stats.goalsAgainst,
      points: stats.wins * 3 + stats.draws,
    };
  });

  const topTeams = [...teamStats].sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference).slice(0, 5);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-indigo-500" />
          Statistiques du Tournoi
        </h1>
        <p className="text-slate-500 mt-2">Rapport global des équipes, des meilleurs joueurs et des performances clefs.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Joueurs enregistrés', value: totalPlayers, icon: UserCheck, color: 'bg-slate-900' },
          { label: 'Équipes en course', value: totalTeams, icon: Trophy, color: 'bg-emerald-500' },
          { label: 'Matchs programmés', value: totalMatches, icon: TrendingUp, color: 'bg-indigo-500' },
          { label: 'Buts marqués', value: totalGoals, icon: Goal, color: 'bg-amber-500' },
        ].map(card => (
          <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className={`inline-flex p-3 rounded-2xl text-white ${card.color}`}><card.icon className="w-5 h-5" /></div>
            <div className="mt-4 text-sm text-slate-500">{card.label}</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Meilleur du Tournoi</h2>
          <div className="space-y-4">
            {mvpList.map((player, idx) => {
              const team = équipes.find(t => t.id === player.équipe_id);
              return (
                <div key={player.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
                  <div className="text-sm font-semibold text-slate-700">#{idx + 1}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">{player.nom}</div>
                    <div className="text-xs text-slate-500">{team?.nom || 'Équipe inconnue'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">{player.points} pts</div>
                    <div className="text-xs text-slate-500">{player.buts} buts • {player.passes_décisives} passes</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Performance des équipes</h2>
          <div className="space-y-3">
            {topTeams.map(team => (
              <div key={team.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 p-3">
                <div className="flex items-center gap-3">
                  <ImageWithFallback src={team.logo || ''} alt={team.nom} className="h-10 w-10 rounded-full object-cover" />
                  <div>
                    <div className="font-semibold text-slate-900">{team.nom}</div>
                    <div className="text-xs text-slate-500">{team.points} pts • Diff. {team.goalDifference}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900">{team.goalsFor} - {team.goalsAgainst}</div>
                  <div className="text-xs text-slate-500">{team.played} matchs</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Moyenne de buts</h2>
          <div className="rounded-3xl bg-slate-50 p-6 text-center">
            <div className="text-5xl font-black text-slate-900">{averageGoals}</div>
            <div className="mt-2 text-sm text-slate-500">buts par match sur les rencontres jouées</div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold">Classement des Buteurs</h2>
              <p className="text-sm text-slate-500">Top 10 des stars du tournoi.</p>
            </div>
            <Goal className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="space-y-3">
            {topScorers.map((player, index) => {
              const team = équipes.find(t => t.id === player.équipe_id);
              return (
                <div key={player.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">#{index + 1}</div>
                    <div>
                      <div className="font-semibold text-slate-900">{player.nom}</div>
                      <div className="text-xs text-slate-500">{team?.nom}</div>
                    </div>
                  </div>
                  <div className="text-right font-bold text-emerald-600">{player.buts}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold">Passeurs décisifs</h2>
              <p className="text-sm text-slate-500">Top 10 des architectes de jeu.</p>
            </div>
            <UserCheck className="h-6 w-6 text-blue-600" />
          </div>
          <div className="space-y-3">
            {topAssists.map((player, index) => {
              const team = équipes.find(t => t.id === player.équipe_id);
              return (
                <div key={player.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">#{index + 1}</div>
                    <div>
                      <div className="font-semibold text-slate-900">{player.nom}</div>
                      <div className="text-xs text-slate-500">{team?.nom}</div>
                    </div>
                  </div>
                  <div className="text-right font-bold text-blue-600">{player.passes_décisives}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
