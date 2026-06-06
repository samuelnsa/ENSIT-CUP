import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Trophy } from 'lucide-react';
import { useTousLesJoueurs, useÉquipes } from '../hooks/useSupabase';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export const GoalscorersPage = () => {
  const navigate = useNavigate();
  const { joueurs, chargement } = useTousLesJoueurs();
  const { équipes } = useÉquipes();

  const sorted = [...joueurs].sort((a, b) => b.buts - a.buts);
  const topScorer = sorted[0];
  const medals = ['🥇', '🥈', '🥉'];

  if (chargement) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-strong" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/')} className="p-2.5 rounded-xl bg-panel-soft border-panel hover:bg-white/10 transition-all">
          <ArrowLeft className="w-4 h-4 text-muted" />
        </button>
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2 text-primary">
            <Target className="w-6 h-6 text-amber-400" /> Classement des Buteurs
          </h1>
          <p className="text-sm text-muted mt-0.5">Classement complet des meilleurs buteurs</p>
        </div>
      </div>

      {/* Meilleur buteur hero */}
      {topScorer && topScorer.buts > 0 && (
        <div className="glass rounded-3xl p-6 sm:p-8 border border-amber-500/20 bg-amber-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="text-6xl">👑</div>
            <div className="text-center sm:text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">Meilleur Buteur</p>
              <h2 className="text-3xl font-display font-black text-primary">{topScorer.nom}</h2>
              <p className="text-muted mt-1">{équipes.find(t => t.id === topScorer.équipe_id)?.nom}</p>
              <div className="flex gap-8 mt-4 justify-center sm:justify-start">
                <div>
                  <div className="text-4xl font-black text-amber-400">{topScorer.buts}</div>
                  <div className="text-xs text-muted mt-1">Buts</div>
                </div>
                <div>
                  <div className="text-4xl font-black text-blue-400">{topScorer.passes_décisives}</div>
                  <div className="text-xs text-muted mt-1">Passes</div>
                </div>
                <div>
                  <div className="text-4xl font-black text-purple-400">{topScorer.buts * 2 + topScorer.passes_décisives}</div>
                  <div className="text-xs text-muted mt-1">Impact</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tableau complet */}
      <div className="glass rounded-2xl overflow-hidden border-panel">
        <div className="px-5 py-4 border-b border-panel flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span className="font-display font-bold text-primary">Classement complet</span>
          <span className="ml-auto text-xs text-muted">{sorted.length} joueurs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-panel-soft text-xs uppercase tracking-wider text-muted border-b border-panel">
                <th className="px-4 py-3 text-center w-12">Rang</th>
                <th className="px-4 py-3 text-left">Joueur</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Équipe</th>
                <th className="px-4 py-3 text-center text-emerald-400">Buts</th>
                <th className="px-4 py-3 text-center text-blue-400 hidden sm:table-cell">Passes</th>
                <th className="px-4 py-3 text-center text-purple-400 hidden md:table-cell">Impact</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((player, i) => {
                const team = équipes.find(t => t.id === player.équipe_id);
                const impact = player.buts + player.passes_décisives;
                return (
                  <tr key={player.id} className="border-b border-panel hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3 text-center">
                      {i < 3 ? <span className="text-lg">{medals[i]}</span> : <span className="text-muted font-bold">{i + 1}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-primary">{player.nom}</div>
                      <div className="text-xs text-muted sm:hidden">{team?.nom}</div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <ImageWithFallback src={team?.logo || ''} alt={team?.nom || ''} className="w-6 h-6 rounded-full object-contain" />
                        <span className="text-muted">{team?.nom}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {player.buts}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {player.passes_décisives}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {impact}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted">Aucun buteur enregistré pour le moment.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
