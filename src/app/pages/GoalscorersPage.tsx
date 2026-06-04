import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target } from 'lucide-react';
import { useTousLesJoueurs, useÉquipes } from '../hooks/useSupabase';

export const GoalscorersPage = () => {
  const navigate = useNavigate();
  const { joueurs, chargement } = useTousLesJoueurs();
  const { équipes } = useÉquipes();

  const sortedPlayers = [...joueurs].sort((a, b) => b.buts - a.buts);
  const topScorer = sortedPlayers[0];

  if (chargement) {
    return <div className="p-8 text-slate-500">Chargement des données des buteurs...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Target className="w-8 h-8 text-amber-500" />
          Classement des Buteurs
        </h1>
        <p className="text-slate-500 mt-2">Liste complète des meilleurs buteurs du tournoi</p>
      </div>

      {topScorer && (
        <div className="bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-6">
            <div className="text-6xl">👑</div>
            <div>
              <p className="text-amber-100 text-sm font-semibold">MEILLEUR BUTEUR</p>
              <h2 className="text-3xl font-bold">{topScorer.nom}</h2>
              <p className="text-amber-100 mt-1">{équipes.find(t => t.id === topScorer.équipe_id)?.nom}</p>
              <div className="flex gap-6 mt-3">
                <div>
                  <div className="text-amber-100 text-xs">Buts</div>
                  <div className="text-4xl font-black">{topScorer.buts}</div>
                </div>
                <div>
                  <div className="text-amber-100 text-xs">Passes</div>
                  <div className="text-4xl font-black">{topScorer.passes_décisives}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Tableau de classement complet</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Rang</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Joueur</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Équipe</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Buts</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Passes</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Impact</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player, index) => {
                const team = équipes.find(t => t.id === player.équipe_id);
                const impact = player.buts + player.passes_décisives;
                return (
                  <tr key={player.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${index < 3 ? 'bg-gradient-to-r from-slate-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {index === 0 && <span className="text-2xl">🥇</span>}
                        {index === 1 && <span className="text-2xl">🥈</span>}
                        {index === 2 && <span className="text-2xl">🥉</span>}
                        {index >= 3 && <span className="font-semibold text-slate-600 w-6">{index + 1}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{player.nom}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <img src={team?.logo} alt={team?.nom} className="w-6 h-6 rounded" />
                        <span className="text-slate-600">{team?.nom}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold">{player.buts}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">{player.passes_décisives}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">{impact}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
