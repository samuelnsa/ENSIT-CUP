import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Shield } from 'lucide-react';
import { useÉquipes, useTousLesJoueurs } from '../hooks/useSupabase';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export const TeamsRegisteredPage = () => {
  const navigate = useNavigate();
  const { équipes, chargement, erreur } = useÉquipes();
  const { joueurs } = useTousLesJoueurs();

  const playersByTeam = joueurs.reduce<Record<string, number>>((acc, p) => { acc[p.équipe_id] = (acc[p.équipe_id] || 0) + 1; return acc; }, {});
  const goalsByTeam = joueurs.reduce<Record<string, number>>((acc, p) => { acc[p.équipe_id] = (acc[p.équipe_id] || 0) + (p.buts ?? 0); return acc; }, {});

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/')} className="p-2.5 rounded-xl bg-panel-soft border-panel hover:bg-white/10 transition-all">
          <ArrowLeft className="w-4 h-4 text-muted" />
        </button>
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2 text-primary">
            <Shield className="w-6 h-6 text-accent-strong" /> Équipes Inscrites
          </h1>
          <p className="text-sm text-muted mt-0.5">
            {chargement ? '...' : équipes.length} équipes participantes · {chargement ? '...' : Math.max(10 - équipes.length, 0)} places restantes
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {!chargement && (
        <div className="glass rounded-2xl border-panel p-5">
          <div className="flex justify-between text-sm mb-3">
            <span className="text-muted font-medium">Inscriptions</span>
            <span className="font-bold text-primary">{équipes.length} / 10</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-accent-strong to-emerald-300 transition-all" style={{ width: `${Math.min(équipes.length / 10 * 100, 100)}%` }} />
          </div>
        </div>
      )}

      {/* Grid équipes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {chargement ? (
          <div className="col-span-full flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-strong" />
          </div>
        ) : erreur ? (
          <div className="col-span-full text-center text-red-400 py-12">{erreur}</div>
        ) : équipes.length === 0 ? (
          <div className="col-span-full text-center text-muted py-16">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Aucune équipe inscrite pour le moment.</p>
          </div>
        ) : (
          équipes.map(team => (
            <div key={team.id} onClick={() => navigate(`/teams/${team.id}`)} className="glass card-3d rounded-2xl overflow-hidden cursor-pointer group border-panel hover:border-accent-strong/30 transition-all">
              {/* Logo zone */}
              <div className="relative h-36 bg-panel-soft flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-strong/5 to-purple-500/5 group-hover:from-accent-strong/10 transition-all" />
                <ImageWithFallback src={team.logo} alt={team.nom} className="w-20 h-20 object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <h3 className="font-display font-bold text-primary text-lg drop-shadow">{team.nom}</h3>
                </div>
              </div>

              {/* Infos */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-accent-strong/10 border border-accent-strong/20 text-accent-strong font-semibold">{team.classe}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${team.statut === 'disqualifié' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                    {team.statut === 'disqualifié' ? 'Désactivée' : '✓ Active'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-panel text-center">
                  <div>
                    <div className="text-xl font-black text-blue-400">{playersByTeam[team.id] || 0}</div>
                    <div className="text-xs text-muted mt-0.5">Joueurs</div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-emerald-400">{goalsByTeam[team.id] || 0}</div>
                    <div className="text-xs text-muted mt-0.5">Buts</div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-purple-400">→</div>
                    <div className="text-xs text-muted mt-0.5">Détails</div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer info */}
      {!chargement && équipes.length > 0 && (
        <div className="glass rounded-2xl border-panel p-5 text-center flex items-center justify-center gap-3">
          <Users className="w-5 h-5 text-accent-strong flex-shrink-0" />
          <p className="text-sm text-muted">
            Cliquez sur une équipe pour voir ses détails complets
          </p>
        </div>
      )}
    </div>
  );
};
