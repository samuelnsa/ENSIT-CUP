import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useÉquipe, useJoueurs, useMatchs, useÉquipes } from '../hooks/useSupabase';

export const TeamDetails = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { équipe, chargement: chargementÉquipe } = useÉquipe(teamId ?? '');
  const { joueurs: teamPlayers, chargement: chargementJoueurs } = useJoueurs(teamId ?? '');
  const { matchs, chargement: chargementMatchs } = useMatchs();
  const { équipes } = useÉquipes();

  const teamMatches = useMemo(() => {
    return matchs.filter(match => match.équipe_a_id === teamId || match.équipe_b_id === teamId);
  }, [matchs, teamId]);

  const classement = useMemo(() => {
    if (!équipe || équipes.length === 0) return null;

    const initial = équipes.reduce<Record<string, { points: number; position: number | null }>>((acc, team) => {
      acc[team.id] = { points: 0, position: null };
      return acc;
    }, {});

    matchs
      .filter(match => match.statut === 'terminé')
      .forEach(match => {
        const scoreA = match.score_a ?? 0;
        const scoreB = match.score_b ?? 0;
        if (!initial[match.équipe_a_id] || !initial[match.équipe_b_id]) return;

        if (scoreA > scoreB) {
          initial[match.équipe_a_id].points += 3;
        } else if (scoreA < scoreB) {
          initial[match.équipe_b_id].points += 3;
        } else {
          initial[match.équipe_a_id].points += 1;
          initial[match.équipe_b_id].points += 1;
        }
      });

    const ranking = Object.entries(initial)
      .map(([teamId, row]) => ({ teamId, points: row.points }))
      .sort((a, b) => b.points - a.points);

    const position = ranking.findIndex(row => row.teamId === teamId);
    return position >= 0 ? { points: ranking[position].points, position: position + 1 } : null;
  }, [équipe, équipes, matchs, teamId]);

  const matchesWon = teamMatches.filter(match =>
    match.statut === 'terminé' &&
    ((match.équipe_a_id === teamId && (match.score_a ?? 0) > (match.score_b ?? 0)) ||
      (match.équipe_b_id === teamId && (match.score_b ?? 0) > (match.score_a ?? 0)))
  ).length;

  const matchesLost = teamMatches.filter(match =>
    match.statut === 'terminé' &&
    ((match.équipe_a_id === teamId && (match.score_a ?? 0) < (match.score_b ?? 0)) ||
      (match.équipe_b_id === teamId && (match.score_b ?? 0) < (match.score_a ?? 0)))
  ).length;

  const totalGames = teamMatches.length;
  const goalsFor = teamMatches.reduce((sum, match) => sum + ((match.équipe_a_id === teamId ? match.score_a : match.score_b) ?? 0), 0);
  const goalsAgainst = teamMatches.reduce((sum, match) => sum + ((match.équipe_a_id === teamId ? match.score_b : match.score_a) ?? 0), 0);

  if (chargementÉquipe || chargementJoueurs || chargementMatchs) {
    return <div className="p-8 text-slate-500">Chargement des détails de l'équipe...</div>;
  }

  if (!équipe) {
    return <div className="p-8 text-center text-slate-500">Équipe non trouvée</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <button
        onClick={() => navigate('/teams')}
        className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl p-8 flex flex-col lg:flex-row items-center gap-6">
        <ImageWithFallback src={équipe.logo} alt={équipe.nom} className="w-28 h-28 rounded-xl object-contain drop-shadow-xl bg-white/10 p-2" />
        <div className="flex-1">
          <h1 className="text-4xl font-bold">{équipe.nom}</h1>
          <p className="text-emerald-100 mt-2">{équipe.description}</p>
          {classement && (
            <div className="flex flex-wrap gap-6 mt-4">
              <div>
                <div className="text-sm text-emerald-100">Classement</div>
                <div className="text-2xl font-bold">#{classement.position}</div>
              </div>
              <div>
                <div className="text-sm text-emerald-100">Points</div>
                <div className="text-2xl font-bold">{classement.points}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-900 mb-4">Statistiques</h3>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-slate-600">Matchs joués</span><span className="font-bold text-slate-900">{totalGames}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Victoires</span><span className="font-bold text-emerald-600">{matchesWon}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Défaites</span><span className="font-bold text-red-600">{matchesLost}</span></div>
              <div className="pt-3 border-t border-slate-100 flex justify-between"><span className="text-slate-600">Buts pour</span><span className="font-bold text-slate-900">{goalsFor}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Buts contre</span><span className="font-bold text-slate-900">{goalsAgainst}</span></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-500" /> Effectif ({teamPlayers.length} joueurs)</h3>
            <div className="space-y-3">
              {teamPlayers.map(player => (
                <div key={player.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">{player.numéro}</div>
                    <div>
                      <p className="font-medium text-slate-900">{player.nom}</p>
                      <p className="text-xs text-slate-500">{player.poste}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="text-center"><div className="text-slate-500">Buts</div><div className="font-bold text-slate-900">{player.buts}</div></div>
                    <div className="text-center"><div className="text-slate-500">Passes</div><div className="font-bold text-slate-900">{player.passes_décisives}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 mb-4">Matchs de cette équipe</h3>
        <div className="space-y-3">
          {teamMatches.length === 0 ? (
            <p className="text-slate-500 text-center py-6">Aucun match pour cette équipe</p>
          ) : (
            teamMatches.map(match => {
              const opponentId = match.équipe_a_id === teamId ? match.équipe_b_id : match.équipe_a_id;
              const opponent = équipes.find(t => t.id === opponentId);
              const isHome = match.équipe_a_id === teamId;
              return (
                <div key={match.id} className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${match.statut === 'terminé' ? 'bg-slate-200 text-slate-700' : 'bg-blue-100 text-blue-700'}`}>
                        {match.statut === 'terminé' ? 'Terminé' : 'À venir'}
                      </span>
                      <div className="flex items-center gap-2">
                        <ImageWithFallback src={opponent?.logo || ''} alt={opponent?.nom || ''} className="w-6 h-6 rounded" />
                        <span className="font-medium text-slate-900">{opponent?.nom}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900">
                        {isHome ? match.score_a : match.score_b} - {isHome ? match.score_b : match.score_a}
                      </div>
                      <div className="text-xs text-slate-500">{match.date} à {match.heure}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
