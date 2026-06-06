import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useMatchsÀVenir, useMatchsTerminés, useÉquipes } from '../hooks/useSupabase';
import { formaterDate } from '../utils/date';

type Filter = 'all' | 'upcoming' | 'finished';

export const Matches = () => {
  const navigate = useNavigate();
  const { matchs: upcoming, chargement: chU } = useMatchsÀVenir();
  const { matchs: finished, chargement: chF } = useMatchsTerminés();
  const { équipes } = useÉquipes();
  const [filter, setFilter] = useState<Filter>('all');

  const isLoading = chU || chF;
  const allMatches = [...upcoming, ...finished].sort((a, b) => {
    const da = new Date(`${a.date}T${a.heure}`).getTime();
    const db = new Date(`${b.date}T${b.heure}`).getTime();
    return da - db;
  });
  const displayed = filter === 'upcoming' ? upcoming : filter === 'finished' ? finished : allMatches;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full bg-gradient-to-b from-blue-400 to-accent-strong" />
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2 text-primary">
              <Calendar className="w-6 h-6 text-blue-400" />
              Calendrier & Résultats
            </h1>
            <p className="text-sm text-muted mt-0.5">Suivez tous les matchs et scores de la compétition.</p>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="flex gap-3">
          <div className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
            <div className="text-xl font-black text-blue-400">{upcoming.length}</div>
            <div className="text-xs text-muted">À venir</div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <div className="text-xl font-black text-emerald-400">{finished.length}</div>
            <div className="text-xs text-muted">Terminés</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 p-1 rounded-xl bg-panel-soft border-panel w-fit">
        {([
          { v: 'all', label: 'Tous' },
          { v: 'upcoming', label: 'À venir' },
          { v: 'finished', label: 'Terminés' },
        ] as { v: Filter; label: string }[]).map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === f.v ? 'bg-gradient-to-r from-accent-strong to-emerald-400 text-black shadow-sm' : 'text-muted hover:text-primary'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-strong" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Aucun match à afficher.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(match => (
            <MatchCard key={match.id} match={match} équipes={équipes} onClick={() => navigate(`/matches/${match.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
};

const MatchCard = ({ match, équipes, onClick }: { match: any; équipes: any[]; onClick: () => void }) => {
  const teamA = équipes.find(t => t.id === match.équipe_a_id);
  const teamB = équipes.find(t => t.id === match.équipe_b_id);
  const isFinished = match.statut === 'terminé';
  const isLive = match.statut === 'en_cours';
  const winnerA = isFinished && (match.score_a ?? 0) > (match.score_b ?? 0);
  const winnerB = isFinished && (match.score_b ?? 0) > (match.score_a ?? 0);

  return (
    <div onClick={onClick} className={`glass card-3d rounded-2xl overflow-hidden cursor-pointer transition-all border hover:border-accent-strong/30 group ${isLive ? 'border-red-500/30 bg-red-500/5' : isFinished ? 'border-panel' : 'border-blue-500/20 bg-blue-500/5'}`}>
      <div className="p-4 sm:p-5">
        {/* Top row: date/status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 text-xs text-muted">
            <Calendar className="w-3.5 h-3.5" />
            <span className="font-semibold text-primary">{formaterDate(match.date)}</span>
            <Clock className="w-3.5 h-3.5" />
            <span>{match.heure}</span>
            {match.lieu && <><MapPin className="w-3.5 h-3.5" /><span className="hidden sm:inline">{match.lieu}</span></>}
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            isLive ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' :
            isFinished ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
          }`}>
            {isLive ? '🔴 En cours' : isFinished ? '⚡ Terminé' : '📅 À venir'}
          </span>
        </div>

        {/* Équipes et score */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Équipe A */}
          <div className={`flex items-center gap-3 flex-1 justify-end ${winnerA ? 'opacity-100' : winnerB ? 'opacity-50' : ''}`}>
            <span className={`font-bold text-sm sm:text-base text-right ${winnerA ? 'text-emerald-400' : 'text-primary'}`}>{teamA?.nom}</span>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-panel-soft p-0.5 flex-shrink-0">
              <ImageWithFallback src={teamA?.logo || ''} alt={teamA?.nom || ''} className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Score */}
          <div className="flex-shrink-0 flex flex-col items-center">
            {isFinished || isLive ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className={`text-2xl sm:text-3xl font-black ${winnerA ? 'text-emerald-400' : 'text-primary'}`}>{match.score_a ?? 0}</span>
                <span className="text-muted">–</span>
                <span className={`text-2xl sm:text-3xl font-black ${winnerB ? 'text-emerald-400' : 'text-primary'}`}>{match.score_b ?? 0}</span>
              </div>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-panel-soft border-panel">
                <span className="text-sm font-bold text-muted">VS</span>
              </div>
            )}
            {isFinished && match.score_a === match.score_b && (
              <span className="text-xs text-yellow-400 font-semibold mt-1">Nul</span>
            )}
          </div>

          {/* Équipe B */}
          <div className={`flex items-center gap-3 flex-1 ${winnerB ? 'opacity-100' : winnerA ? 'opacity-50' : ''}`}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-panel-soft p-0.5 flex-shrink-0">
              <ImageWithFallback src={teamB?.logo || ''} alt={teamB?.nom || ''} className="w-full h-full object-contain" />
            </div>
            <span className={`font-bold text-sm sm:text-base ${winnerB ? 'text-emerald-400' : 'text-primary'}`}>{teamB?.nom}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
