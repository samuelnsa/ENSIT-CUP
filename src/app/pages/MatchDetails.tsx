import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Users, Goal, Zap } from 'lucide-react';
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
  const [chargementÉvénements, setChargementÉvénements] = useState(true);

  useEffect(() => {
    if (!match?.id) return;

    const chargerÉvénements = async () => {
      try {
        setChargementÉvénements(true);
        const [butsMatch, passesMatch] = await Promise.all([
          obtenirButsMatch(match.id),
          obtenirPassesMatch(match.id),
        ]);
        setButs(butsMatch);
        setPasses(passesMatch);
      } catch (err) {
        console.error(err);
      } finally {
        setChargementÉvénements(false);
      }
    };

    chargerÉvénements();
  }, [match]);

  if (chargement || chargementÉvénements) {
    return <div className="p-8 text-slate-500">Chargement des détails du match...</div>;
  }

  if (!match) {
    return <div className="p-8 text-center text-slate-500">Match non trouvé</div>;
  }

  const teamA = équipes.find(t => t.id === match.équipe_a_id);
  const teamB = équipes.find(t => t.id === match.équipe_b_id);

  const playersA = joueurs.filter(p => p.équipe_id === match.équipe_a_id);
  const playersB = joueurs.filter(p => p.équipe_id === match.équipe_b_id);

  const isFinished = match.statut === 'terminé';
  const winner = isFinished
    ? match.score_a! > match.score_b!
      ? teamA?.nom
      : match.score_b! > match.score_a!
      ? teamB?.nom
      : 'Match nul'
    : null;

  const goalsA = buts.filter(g => g.équipe === 'A');
  const goalsB = buts.filter(g => g.équipe === 'B');
  const assistsA = passes.filter(a => a.équipe === 'A');
  const assistsB = passes.filter(a => a.équipe === 'B');

  const getPlayerName = (playerId: string) => joueurs.find(p => p.id === playerId)?.nom || '?';
  const getPlayerNumber = (playerId: string) => joueurs.find(p => p.id === playerId)?.numéro || '-';

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <button
        onClick={() => navigate('/matches')}
        className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      <div className={`rounded-xl p-8 text-white ${isFinished ? 'bg-gradient-to-r from-slate-700 to-slate-800' : 'bg-gradient-to-r from-blue-600 to-blue-700'}`}>
        <div className="text-center mb-6">
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${isFinished ? 'bg-slate-600' : 'bg-blue-500'}`}>
            {isFinished ? 'Match Terminé' : 'Match à venir'}
          </span>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between mb-6 gap-6">
          <div className="text-center flex-1">
            <img src={teamA?.logo} alt={teamA?.nom} className="w-20 h-20 mx-auto mb-3 rounded-lg" />
            <h2 className="text-2xl font-bold">{teamA?.nom}</h2>
          </div>

          <div className="text-center px-8">
            <div className="text-6xl font-black mb-2">{match.score_a ?? '-'} - {match.score_b ?? '-'}</div>
            <div className="text-lg text-blue-100">{formaterDate(match.date)} à {match.heure}</div>
            {isFinished && winner !== 'Match nul' && <div className="mt-3 text-emerald-300 font-semibold">🏆 Vainqueur: {winner}</div>}
            {isFinished && winner === 'Match nul' && <div className="mt-3 text-yellow-300 font-semibold">⚖️ Match nul</div>}
          </div>

          <div className="text-center flex-1">
            <img src={teamB?.logo} alt={teamB?.nom} className="w-20 h-20 mx-auto mb-3 rounded-lg" />
            <h2 className="text-2xl font-bold">{teamB?.nom}</h2>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-blue-100 text-sm">
          <div className="flex items-center gap-1"><MapPin className="w-4 h-4" />{match.lieu ?? 'Terrain Principal'}</div>
          <div className="flex items-center gap-1"><Clock className="w-4 h-4" />{match.durée ?? '90 min'}</div>
        </div>
      </div>

      {isFinished && (goalsA.length > 0 || goalsB.length > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2"><Goal className="w-5 h-5 text-emerald-600" /> Buteurs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ScoreList title={teamA?.nom || 'Équipe A'} items={goalsA} getPlayerName={getPlayerName} getPlayerNumber={getPlayerNumber} />
            <ScoreList title={teamB?.nom || 'Équipe B'} items={goalsB} getPlayerName={getPlayerName} getPlayerNumber={getPlayerNumber} />
          </div>
        </div>
      )}

      {isFinished && (assistsA.length > 0 || assistsB.length > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-600" /> Passeurs décisifs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ScoreList title={teamA?.nom || 'Équipe A'} items={assistsA} getPlayerName={getPlayerName} getPlayerNumber={getPlayerNumber} isAssist />
            <ScoreList title={teamB?.nom || 'Équipe B'} items={assistsB} getPlayerName={getPlayerName} getPlayerNumber={getPlayerNumber} isAssist />
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100">
          <button className="flex-1 py-4 font-semibold text-center text-emerald-600 bg-emerald-50">Joueurs de l'équipe A</button>
          <button className="flex-1 py-4 font-semibold text-center text-slate-600">Joueurs de l'équipe B</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          <PlayerList title={teamA?.nom || 'Équipe A'} players={playersA} />
          <PlayerList title={teamB?.nom || 'Équipe B'} players={playersB} />
        </div>
      </div>
    </div>
  );
};

const ScoreList = ({ title, items, getPlayerName, getPlayerNumber, isAssist = false }: any) => (
  <div>
    <div className="font-semibold text-slate-700 mb-3 text-sm">{title}</div>
    {items.length > 0 ? (
      <div className="space-y-2">
        {items.map((item: any, idx: number) => (
          <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${isAssist ? 'bg-yellow-50 border border-yellow-200' : 'bg-emerald-50 border border-emerald-200'}`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-bold">{getPlayerNumber(item.joueur_id)}</div>
              <div>
                <p className="font-medium text-slate-900 text-sm">{getPlayerName(item.joueur_id)}</p>
              </div>
            </div>
            <span className="text-xs text-slate-600 font-semibold">{item.minute}'</span>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-slate-500 text-sm">Aucun {isAssist ? 'assist' : 'but'} enregistré</p>
    )}
  </div>
);

const PlayerList = ({ title, players }: any) => (
  <div className="p-4">
    <div className="font-semibold text-slate-700 mb-4">{title}</div>
    <div className="space-y-3">
      {players.map((player: any) => (
        <div key={player.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">{player.numéro}</div>
            <div>
              <p className="font-medium text-slate-900">{player.nom}</p>
              <p className="text-xs text-slate-500">{player.poste}</p>
            </div>
          </div>
          <div className="text-right text-slate-500 text-sm">{player.buts} buts</div>
        </div>
      ))}
    </div>
  </div>
);
