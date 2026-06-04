import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { useÉquipes, useTousLesJoueurs } from '../hooks/useSupabase';

export const TeamsRegisteredPage = () => {
  const navigate = useNavigate();
  const { équipes, chargement, erreur } = useÉquipes();
  const { joueurs } = useTousLesJoueurs();

  const playersByTeam = joueurs.reduce<Record<string, number>>((acc, player) => {
    acc[player.équipe_id] = (acc[player.équipe_id] || 0) + 1;
    return acc;
  }, {});

  const goalsByTeam = joueurs.reduce<Record<string, number>>((acc, player) => {
    acc[player.équipe_id] = (acc[player.équipe_id] || 0) + (player.buts ?? 0);
    return acc;
  }, {});

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
          <Users className="w-8 h-8 text-blue-500" />
          Équipes Inscrites
        </h1>
        <p className="text-slate-500 mt-2">Liste des équipes participantes ({chargement ? '...' : équipes.length} / 10)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {chargement ? (
          <div className="col-span-full text-center text-slate-500 py-12">Chargement des équipes...</div>
        ) : erreur ? (
          <div className="col-span-full text-center text-red-600 py-12">{erreur}</div>
        ) : équipes.length === 0 ? (
          <div className="col-span-full text-center text-slate-500 py-12">Aucune équipe n'est inscrite pour le moment.</div>
        ) : (
          équipes.map(team => (
            <div
              key={team.id}
              onClick={() => navigate(`/teams/${team.id}`)}
              className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer"
            >
              <div className="relative h-32 bg-slate-200 overflow-hidden">
                <img src={team.logo} alt={team.nom} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900">{team.nom}</h3>
                <p className="text-sm text-slate-500 mt-2 line-clamp-2">{team.description}</p>

                <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-100">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{playersByTeam[team.id] || 0}</div>
                    <div className="text-xs text-slate-500 mt-1">Joueurs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600">✓</div>
                    <div className="text-xs text-slate-500 mt-1">Inscrite</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">{goalsByTeam[team.id] || 0}</div>
                    <div className="text-xs text-slate-500 mt-1">Buts</div>
                  </div>
                </div>

                <button className="w-full mt-6 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-medium py-2 rounded-lg transition-colors text-sm">Voir détails →</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
        <p className="text-blue-900 font-medium">
          {chargement ? '...' : équipes.length} équipes sont actuellement inscrites • {chargement ? '...' : 10 - équipes.length} places restantes
        </p>
        <p className="text-blue-700 text-sm mt-2">Cliquez sur une équipe pour voir ses détails complets</p>
      </div>
    </div>
  );
};
