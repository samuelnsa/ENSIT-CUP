import React from 'react';
import { Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useMatchsÀVenir, useMatchsTerminés, useÉquipes } from '../hooks/useSupabase';
import { formaterDate } from '../utils/date';

export const Matches = () => {
  const navigate = useNavigate();
  const { matchs: upcoming, chargement: chargementUpcoming } = useMatchsÀVenir();
  const { matchs: finished, chargement: chargementFinished } = useMatchsTerminés();
  const { équipes } = useÉquipes();

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 rounded-full stripe-purple" />
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-3 text-primary">
            <Calendar className="w-6 h-6 text-emerald-400" />
            Calendrier & Résultats
          </h1>
          <p className="text-sm text-muted">Suivez tous les matchs et scores de la compétition.</p>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-display font-bold pb-2 border-b text-primary border-panel">Prochains Matchs</h2>
        <div className="space-y-4">
          {chargementUpcoming ? (
            <p className="text-sm text-muted">Chargement des prochains matchs...</p>
          ) : upcoming.length > 0 ? (
            upcoming.map(match => <MatchCard key={match.id} match={match} équipes={équipes} navigate={navigate} />)
          ) : (
            <p className="text-sm text-muted">Aucun match à venir.</p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-display font-bold pb-2 border-b text-primary border-panel">Résultats Récents</h2>
        <div className="space-y-4">
          {chargementFinished ? (
            <p className="text-sm text-muted">Chargement des résultats...</p>
          ) : finished.length > 0 ? (
            finished.map(match => <MatchCard key={match.id} match={match} équipes={équipes} navigate={navigate} />)
          ) : (
            <p className="text-sm text-muted">Aucun match terminé.</p>
          )}
        </div>
      </section>
    </div>
  );
};

const MatchCard = ({ match, équipes, navigate }: { match: any; équipes: any[]; navigate: any }) => {
  const teamA = équipes.find(t => t.id === match.équipe_a_id);
  const teamB = équipes.find(t => t.id === match.équipe_b_id);

  return (
    <div
      onClick={() => navigate(`/matches/${match.id}`)}
      className="glass card-3d p-4 flex flex-col sm:flex-row items-center justify-between gap-6 cursor-pointer"
    >
      <div className="text-sm font-medium flex flex-col items-center sm:items-start w-32 text-muted">
        <span className="font-semibold text-primary">{formaterDate(match.date)}</span>
        <span>{match.heure}</span>
      </div>

      <div className="flex-1 flex items-center justify-center gap-4 sm:gap-8">
        <div className="flex items-center gap-3 flex-1 justify-end">
          <span className="font-semibold text-right text-primary">{teamA?.nom}</span>
          <ImageWithFallback src={teamA?.logo || ''} alt={teamA?.nom || ''} className="w-10 h-10 rounded-full object-cover border border-panel" />
        </div>

        <div className="flex items-center justify-center min-w-[100px]">
          {match.statut === 'terminé' ? (
            <div className="px-4 py-1.5 rounded-xl font-display font-bold text-lg tracking-wider bg-panel-success">
              {match.score_a} - {match.score_b}
            </div>
          ) : (
            <div className="px-4 py-1.5 rounded-xl font-semibold text-sm bg-panel-lighter border-panel text-muted">
              VS
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 flex-1 justify-start">
          <ImageWithFallback src={teamB?.logo || ''} alt={teamB?.nom || ''} className="w-10 h-10 rounded-full object-cover border border-panel" />
          <span className="font-semibold text-left text-primary">{teamB?.nom}</span>
        </div>
      </div>

      <div className="w-32 flex justify-end">
        {match.statut !== 'terminé' ? (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-panel-info text-sky-500">
            À venir
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-panel-lighter text-muted">
            Terminé
          </span>
        )}
      </div>
    </div>
  );
};
