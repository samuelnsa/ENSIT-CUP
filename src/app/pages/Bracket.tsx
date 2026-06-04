import React from 'react';
import { GitFork } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useMatchsÀVenir, useMatchsTerminés, useÉquipes } from '../hooks/useSupabase';
import { useNavigate } from 'react-router-dom';

export const Bracket = () => {
  const { matchs: upcoming } = useMatchsÀVenir();
  const { matchs: finished } = useMatchsTerminés();
  const { équipes } = useÉquipes();
  const navigate = useNavigate();

  const finalsStartIndex = upcoming.length >= 7 ? upcoming.length - 7 : 0;
  const finals = upcoming.slice(finalsStartIndex);
  const quarters = finals.slice(0, 4);
  const semis = finals.slice(4, 6);
  const finalMatch = finals[6] || null;
  const isPhaseFinaleReady = upcoming.length >= 7;

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <GitFork className="w-8 h-8 text-emerald-500 rotate-90" />
          Tableau des Phases Finales
        </h1>
        <p className="text-slate-500 mt-2">Visualisation simplifiée des phases finales.</p>
        <p className="text-sm mt-3 text-slate-500">
          {isPhaseFinaleReady
            ? 'Les 7 derniers matchs programmés sont interprétés comme le tableau des quarts, demi-finales et finale.'
            : 'Les phases finales seront affichées dès qu’au moins 7 matchs seront programmés. Continuez le planning dans l’outil du scheduler.'}
        </p>
      </div>

      <div className="flex justify-between items-stretch w-full overflow-x-auto pb-8 gap-8 px-4">
        <div className="flex flex-col justify-around gap-16 min-w-[300px] py-8">
          <div className="text-center font-bold text-slate-500 mb-4 uppercase tracking-wider text-sm">Quarts de finale</div>
          {quarters.length === 0 ? (
            <div className="text-slate-500 text-center">Aucun match de quart programmé</div>
          ) : (
            quarters.map(m => <MatchBox key={m.id} match={m} équipes={équipes} onClick={() => navigate(`/matches/${m.id}`)} />)
          )}
        </div>

        <div className="flex flex-col justify-around gap-32 min-w-[300px] py-24 relative">
          <div className="absolute top-8 left-0 right-0 text-center font-bold text-slate-500 uppercase tracking-wider text-sm">Demi-finales</div>
          {semis.length === 0 ? (
            <div className="text-slate-500 text-center">Aucune demi-finale programmée</div>
          ) : (
            semis.map(m => <MatchBox key={m.id} match={m} équipes={équipes} onClick={() => navigate(`/matches/${m.id}`)} />)
          )}
        </div>

        <div className="flex flex-col justify-center min-w-[350px] relative">
          <div className="absolute top-8 left-0 right-0 text-center font-black text-amber-500 uppercase tracking-widest text-lg flex items-center justify-center gap-2">
            🏆 Finale 🏆
          </div>
          {finalMatch ? (
            <MatchBox match={finalMatch} équipes={équipes} onClick={() => navigate(`/matches/${finalMatch.id}`)} isFinal />
          ) : (
            <div className="text-slate-500 text-center p-8">Finale non définie</div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Résultats récents</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {finished.slice(0, 6).map(m => (
            <div key={m.id} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
              <div className="text-sm text-slate-500 mb-2">{m.date} {m.heure}</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TeamInline id={m.équipe_a_id} équipes={équipes} />
                  <div className="font-bold">{m.score_a ?? '-'}</div>
                </div>
                <div className="text-slate-400">—</div>
                <div className="flex items-center gap-3">
                  <div className="font-bold">{m.score_b ?? '-'}</div>
                  <TeamInline id={m.équipe_b_id} équipes={équipes} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TeamInline = ({ id, équipes }: { id: string; équipes: any[] }) => {
  const team = équipes.find(t => t.id === id);
  if (!team) return <span className="text-slate-400 text-sm">Équipe</span>;
  return (
    <div className="flex items-center gap-2">
      <ImageWithFallback src={team.logo} alt={team.nom} className="w-6 h-6 rounded-full object-cover" />
      <span className="text-sm font-medium text-slate-800">{team.nom}</span>
    </div>
  );
};

const MatchBox = ({ match, équipes, isFinal = false, onClick }: any) => {
  const teamA = équipes.find((t: any) => t.id === match.équipe_a_id);
  const teamB = équipes.find((t: any) => t.id === match.équipe_b_id);

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm border overflow-hidden relative p-3 cursor-pointer ${isFinal ? 'border-amber-400 shadow-amber-500/20 shadow-xl transform scale-105' : 'border-slate-200'}`}>
      <div className="text-xs font-semibold text-slate-500 text-center mb-2">{match.date} • {match.heure}</div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ImageWithFallback src={teamA?.logo || ''} alt={teamA?.nom || ''} className="w-8 h-8 rounded-full" />
          <div className="text-sm font-medium">{teamA?.nom || 'À définir'}</div>
        </div>
        <div className="font-bold text-slate-700">{match.score_a ?? '-'}</div>
      </div>
      <div className="flex items-center justify-between mt-3 bg-slate-50 p-2 rounded">
        <div className="flex items-center gap-3">
          <div className="font-bold text-slate-700">{match.score_b ?? '-'}</div>
          <div className="text-sm font-medium">{teamB?.nom || 'À définir'}</div>
        </div>
        <ImageWithFallback src={teamB?.logo || ''} alt={teamB?.nom || ''} className="w-8 h-8 rounded-full" />
      </div>
    </div>
  );
};
