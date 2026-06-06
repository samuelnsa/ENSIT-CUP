import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Users, Goal, Zap, Trophy } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useMatch, useÉquipes, useTousLesJoueurs } from '../hooks/useSupabase';
import { obtenirButsMatch, obtenirPassesMatch } from '../services/matchsService';
import { formaterDate } from '../utils/date';

export const MatchDetails = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { match, chargement } = useMatch(matchId ?? '');
  const { équipes } = useÉquipes();
  const { joueurs } = useTousLesJoueurs();
  const [buts, setButs] = useState<any[]>([]);
  const [passes, setPasses] = useState<any[]>([]);
  const [loadingEvts, setLoadingEvts] = useState(true);

  useEffect(() => {
    if (!match?.id) return;
    const load = async () => {
      setLoadingEvts(true);
      try {
        const [b, p] = await Promise.all([obtenirButsMatch(match.id), obtenirPassesMatch(match.id)]);
        setButs(b); setPasses(p);
      } finally { setLoadingEvts(false); }
    };
    load();
  }, [match]);

  if (chargement || loadingEvts) return (
    <div className="flex items-center justify-center h-full py-24">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-strong" />
    </div>
  );

  if (!match) return <div className="p-8 text-center text-muted">Match introuvable.</div>;

  const teamA = équipes.find(t => t.id === match.équipe_a_id);
  const teamB = équipes.find(t => t.id === match.équipe_b_id);
  const playersA = joueurs.filter(p => p.équipe_id === match.équipe_a_id);
  const playersB = joueurs.filter(p => p.équipe_id === match.équipe_b_id);
  const isFinished = match.statut === 'terminé';
  const winner = isFinished ? match.score_a! > match.score_b! ? teamA?.nom : match.score_b! > match.score_a! ? teamB?.nom : 'Nul' : null;
  const goalsA = buts.filter(g => g.équipe === 'A');
  const goalsB = buts.filter(g => g.équipe === 'B');
  const assistsA = passes.filter(a => a.équipe === 'A');
  const assistsB = passes.filter(a => a.équipe === 'B');
  const getPlayer = (id: string) => joueurs.find(p => p.id === id);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8 animate-slide-up">
      {/* Back */}
      <button onClick={() => navigate('/matches')} className="flex items-center gap-2 text-sm font-medium text-muted hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Retour aux matchs
      </button>

      {/* Hero score */}
      <div className={`glass rounded-3xl p-6 sm:p-8 border relative overflow-hidden ${isFinished ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-blue-500/20 bg-blue-500/5'}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-slate-950/50 pointer-events-none" />
        <div className="relative">
          {/* Statut */}
          <div className="text-center mb-6">
            <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${isFinished ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : match.statut === 'en_cours' ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
              {isFinished ? '⚡ Match Terminé' : match.statut === 'en_cours' ? '🔴 En cours' : '📅 À venir'}
            </span>
          </div>

          {/* Équipes + Score */}
          <div className="flex items-center justify-between gap-4">
            {/* Équipe A */}
            <div className="flex flex-col items-center gap-3 flex-1">
              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-panel-soft p-1.5 ring-2 ring-slate-700">
                <ImageWithFallback src={teamA?.logo || ''} alt={teamA?.nom || ''} className="w-full h-full object-contain" />
              </div>
              <h2 className="font-display font-bold text-primary text-center text-sm sm:text-base">{teamA?.nom}</h2>
            </div>

            {/* Score central */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-3 sm:gap-5">
                <span className="text-5xl sm:text-7xl font-black text-primary">{isFinished || match.statut === 'en_cours' ? match.score_a ?? '0' : '–'}</span>
                <span className="text-3xl font-black text-muted">:</span>
                <span className="text-5xl sm:text-7xl font-black text-primary">{isFinished || match.statut === 'en_cours' ? match.score_b ?? '0' : '–'}</span>
              </div>
              {winner && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400">{winner === 'Nul' ? 'Match nul' : winner}</span>
                </div>
              )}
            </div>

            {/* Équipe B */}
            <div className="flex flex-col items-center gap-3 flex-1">
              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-panel-soft p-1.5 ring-2 ring-slate-700">
                <ImageWithFallback src={teamB?.logo || ''} alt={teamB?.nom || ''} className="w-full h-full object-contain" />
              </div>
              <h2 className="font-display font-bold text-primary text-center text-sm sm:text-base">{teamB?.nom}</h2>
            </div>
          </div>

          {/* Infos match */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-xs text-muted">
            <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{match.lieu ?? 'Terrain Principal'}</div>
            <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{formaterDate(match.date)} · {match.heure}</div>
            <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" />{match.durée ?? '25'} min</div>
          </div>
        </div>
      </div>

      {/* Événements (buts + passes) */}
      {isFinished && (goalsA.length > 0 || goalsB.length > 0) && (
        <div className="glass rounded-2xl border-panel p-6">
          <h3 className="font-display font-bold text-primary mb-4 flex items-center gap-2">
            <Goal className="w-5 h-5 text-emerald-400" /> Buteurs
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <EventList title={teamA?.nom || 'Équipe A'} items={goalsA} getPlayer={getPlayer} color="text-emerald-400" bg="bg-emerald-500/10 border border-emerald-500/20" />
            <EventList title={teamB?.nom || 'Équipe B'} items={goalsB} getPlayer={getPlayer} color="text-emerald-400" bg="bg-emerald-500/10 border border-emerald-500/20" />
          </div>
        </div>
      )}

      {isFinished && (assistsA.length > 0 || assistsB.length > 0) && (
        <div className="glass rounded-2xl border-panel p-6">
          <h3 className="font-display font-bold text-primary mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" /> Passeurs décisifs
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <EventList title={teamA?.nom || 'Équipe A'} items={assistsA} getPlayer={getPlayer} color="text-yellow-400" bg="bg-yellow-500/10 border border-yellow-500/20" />
            <EventList title={teamB?.nom || 'Équipe B'} items={assistsB} getPlayer={getPlayer} color="text-yellow-400" bg="bg-yellow-500/10 border border-yellow-500/20" />
          </div>
        </div>
      )}

      {/* Effectifs */}
      <div className="glass rounded-2xl border-panel p-6">
        <h3 className="font-display font-bold text-primary mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" /> Effectifs
        </h3>
        <div className="grid sm:grid-cols-2 gap-6">
          <PlayerList title={teamA?.nom || 'Équipe A'} players={playersA} />
          <PlayerList title={teamB?.nom || 'Équipe B'} players={playersB} />
        </div>
      </div>
    </div>
  );
};

const EventList = ({ title, items, getPlayer, color, bg }: { title: string; items: any[]; getPlayer: (id: string) => any; color: string; bg: string }) => (
  <div>
    <p className="text-xs font-bold uppercase tracking-wider text-muted mb-3">{title}</p>
    {items.length > 0 ? (
      <div className="space-y-2">
        {items.map((item, i) => {
          const player = getPlayer(item.joueur_id);
          return (
            <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${bg}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-primary">
                  {player?.numéro ?? '?'}
                </div>
                <span className="text-sm font-semibold text-primary">{player?.nom ?? 'Inconnu'}</span>
              </div>
              <span className={`text-xs font-bold ${color}`}>{item.minute}'</span>
            </div>
          );
        })}
      </div>
    ) : (
      <p className="text-xs text-muted italic">Aucun événement</p>
    )}
  </div>
);

const PlayerList = ({ title, players }: { title: string; players: any[] }) => (
  <div>
    <p className="text-xs font-bold uppercase tracking-wider text-muted mb-3">{title}</p>
    <div className="space-y-2">
      {players.map(p => (
        <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-panel-soft hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-strong to-accent-medium flex items-center justify-center text-black text-xs font-bold">{p.numéro}</div>
            <div>
              <p className="text-sm font-semibold text-primary">{p.nom}</p>
              <p className="text-xs text-muted">{p.poste}</p>
            </div>
          </div>
          <span className="text-xs text-muted">{p.buts} buts</span>
        </div>
      ))}
      {players.length === 0 && <p className="text-xs text-muted italic">Aucun joueur</p>}
    </div>
  </div>
);
