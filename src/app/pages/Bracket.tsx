import React from 'react';
import { GitFork, Trophy, Calendar, Clock } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useMatchsÀVenir, useMatchsTerminés, useÉquipes } from '../hooks/useSupabase';
import { useNavigate } from 'react-router-dom';
import { formaterDate } from '../utils/date';

export const Bracket = () => {
  const { matchs: upcoming } = useMatchsÀVenir();
  const { matchs: finished } = useMatchsTerminés();
  const { équipes } = useÉquipes();
  const navigate = useNavigate();

  const finalsStart = upcoming.length >= 7 ? upcoming.length - 7 : 0;
  const finals = upcoming.slice(finalsStart);
  const quarters = finals.slice(0, 4);
  const semis = finals.slice(4, 6);
  const finalMatch = finals[6] || null;
  const isReady = upcoming.length >= 7;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 rounded-full bg-gradient-to-b from-amber-400 to-amber-600" />
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-3 text-primary">
            <GitFork className="w-6 h-6 text-amber-400 rotate-90" />
            Phases Finales
          </h1>
          <p className="text-sm text-muted mt-0.5">
            {isReady ? 'Les 7 derniers matchs programmés forment le tableau' : 'En attente de 7 matchs minimum.'}
          </p>
        </div>
      </div>

      {!isReady && (
        <div className="glass rounded-2xl border border-blue-500/20 bg-blue-500/5 p-8 text-center">
          <GitFork className="w-12 h-12 mx-auto mb-4 text-blue-400 rotate-90 opacity-50" />
          <p className="text-muted font-medium">Le tableau des phases finales s'affichera dès qu'au moins 7 matchs seront programmés.</p>
          <p className="text-sm text-muted/60 mt-2">Actuellement : {upcoming.length} match{upcoming.length !== 1 ? 's' : ''} à venir</p>
        </div>
      )}

      {isReady && (
        <div className="glass rounded-2xl border-panel p-4 sm:p-6 overflow-x-auto">
          <div className="flex items-stretch gap-4 min-w-[700px] py-4">
            
            {/* Quarts */}
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-muted text-center mb-4">Quarts de finale</p>
              <div className="flex flex-col gap-4 h-full justify-around">
                {quarters.map(m => <BracketCard key={m.id} match={m} équipes={équipes} onClick={() => navigate(`/matches/${m.id}`)} />)}
              </div>
            </div>

            {/* Séparateur */}
            <div className="flex items-center"><div className="w-px h-full bg-gradient-to-b from-transparent via-slate-700 to-transparent min-h-24" /></div>

            {/* Demis */}
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-muted text-center mb-4">Demi-finales</p>
              <div className="flex flex-col gap-4 h-full justify-around py-12">
                {semis.map(m => <BracketCard key={m.id} match={m} équipes={équipes} onClick={() => navigate(`/matches/${m.id}`)} />)}
              </div>
            </div>

            {/* Séparateur */}
            <div className="flex items-center"><div className="w-px h-full bg-gradient-to-b from-transparent via-amber-500/30 to-transparent min-h-24" /></div>

            {/* Finale */}
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-widest text-amber-400 text-center mb-4 flex items-center justify-center gap-2">
                🏆 Finale
              </p>
              <div className="flex flex-col h-full justify-center">
                {finalMatch ? (
                  <BracketCard match={finalMatch} équipes={équipes} onClick={() => navigate(`/matches/${finalMatch.id}`)} isFinal />
                ) : (
                  <div className="text-sm text-muted text-center p-6 glass rounded-2xl">Finale non définie</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Résultats récents */}
      {finished.length > 0 && (
        <div>
          <h2 className="text-base font-display font-bold text-primary mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent-strong" /> Résultats récents
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {finished.slice(0, 6).map(m => {
              const tA = équipes.find(t => t.id === m.équipe_a_id);
              const tB = équipes.find(t => t.id === m.équipe_b_id);
              return (
                <div key={m.id} onClick={() => navigate(`/matches/${m.id}`)} className="glass card-3d rounded-xl p-4 cursor-pointer hover:border-accent-strong/30 transition-all border-panel">
                  <div className="flex items-center gap-2 text-xs text-muted mb-3">
                    <Calendar className="w-3.5 h-3.5" />{formaterDate(m.date)}
                    <Clock className="w-3.5 h-3.5 ml-1" />{m.heure}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <ImageWithFallback src={tA?.logo || ''} alt={tA?.nom || ''} className="w-7 h-7 rounded-full flex-shrink-0" />
                      <span className="text-sm font-semibold text-primary truncate">{tA?.nom}</span>
                    </div>
                    <div className="font-black text-primary px-2">{m.score_a ?? '-'} – {m.score_b ?? '-'}</div>
                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <span className="text-sm font-semibold text-primary truncate">{tB?.nom}</span>
                      <ImageWithFallback src={tB?.logo || ''} alt={tB?.nom || ''} className="w-7 h-7 rounded-full flex-shrink-0" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const BracketCard = ({ match, équipes, onClick, isFinal = false }: any) => {
  const tA = équipes.find((t: any) => t.id === match.équipe_a_id);
  const tB = équipes.find((t: any) => t.id === match.équipe_b_id);
  return (
    <div onClick={onClick} className={`glass rounded-xl p-3 cursor-pointer transition-all border hover:scale-[1.02] ${isFinal ? 'border-amber-400/40 bg-amber-500/5 shadow-amber-500/10 shadow-lg' : 'border-panel hover:border-accent-strong/30'}`}>
      <div className="text-xs text-muted text-center mb-2">{formaterDate(match.date)} · {match.heure}</div>
      {[{ team: tA, score: match.score_a }, { team: tB, score: match.score_b }].map((side, i) => (
        <div key={i} className={`flex items-center justify-between gap-2 ${i === 0 ? 'mb-2' : ''}`}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <ImageWithFallback src={side.team?.logo || ''} alt={side.team?.nom || ''} className="w-7 h-7 rounded-full flex-shrink-0" />
            <span className="text-xs font-semibold text-primary truncate">{side.team?.nom || 'À définir'}</span>
          </div>
          <span className="font-black text-sm text-primary">{side.score ?? '-'}</span>
        </div>
      ))}
    </div>
  );
};
