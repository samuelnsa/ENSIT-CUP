import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save, RotateCcw, Loader2 } from 'lucide-react';
import { useÉquipes, useJoueurs } from '../hooks/useSupabase';
import { obtenirFormationÉquipe, sauvegarderFormation } from '../services/formationsService';

const FORMATION_PRESETS: Record<5 | 7 | 9 | 11, Record<string, { topClass: string; leftClass: string; label: string }>> = {
  5: {
    goalkeeper: { topClass: 'top-[10%]', leftClass: 'left-[50%]', label: 'GK' },
    defender_left: { topClass: 'top-[40%]', leftClass: 'left-[25%]', label: 'LD' },
    defender_right: { topClass: 'top-[40%]', leftClass: 'left-[75%]', label: 'RD' },
    midfielder: { topClass: 'top-[65%]', leftClass: 'left-[50%]', label: 'MC' },
    attacker: { topClass: 'top-[85%]', leftClass: 'left-[50%]', label: 'AT' },
  },
  7: {
    goalkeeper: { topClass: 'top-[10%]', leftClass: 'left-[50%]', label: 'GK' },
    defender_left: { topClass: 'top-[35%]', leftClass: 'left-[20%]', label: 'LD' },
    defender_center: { topClass: 'top-[35%]', leftClass: 'left-[50%]', label: 'DC' },
    defender_right: { topClass: 'top-[35%]', leftClass: 'left-[80%]', label: 'RD' },
    midfielder_left: { topClass: 'top-[60%]', leftClass: 'left-[35%]', label: 'MG' },
    midfielder_right: { topClass: 'top-[60%]', leftClass: 'left-[65%]', label: 'MD' },
    attacker: { topClass: 'top-[85%]', leftClass: 'left-[50%]', label: 'AT' },
  },
  9: {
    goalkeeper: { topClass: 'top-[10%]', leftClass: 'left-[50%]', label: 'GK' },
    defender_left: { topClass: 'top-[35%]', leftClass: 'left-[15%]', label: 'LD' },
    defender_center1: { topClass: 'top-[35%]', leftClass: 'left-[40%]', label: 'DC' },
    defender_center2: { topClass: 'top-[35%]', leftClass: 'left-[60%]', label: 'DC' },
    defender_right: { topClass: 'top-[35%]', leftClass: 'left-[85%]', label: 'RD' },
    midfielder: { topClass: 'top-[60%]', leftClass: 'left-[50%]', label: 'MC' },
    attacker_left: { topClass: 'top-[80%]', leftClass: 'left-[30%]', label: 'AG' },
    attacker_center: { topClass: 'top-[80%]', leftClass: 'left-[50%]', label: 'AC' },
    attacker_right: { topClass: 'top-[80%]', leftClass: 'left-[70%]', label: 'AD' },
  },
  11: {
    goalkeeper: { topClass: 'top-[10%]', leftClass: 'left-[50%]', label: 'GK' },
    defender_left: { topClass: 'top-[30%]', leftClass: 'left-[10%]', label: 'LD' },
    defender_center1: { topClass: 'top-[30%]', leftClass: 'left-[35%]', label: 'DC' },
    defender_center2: { topClass: 'top-[30%]', leftClass: 'left-[65%]', label: 'DC' },
    defender_right: { topClass: 'top-[30%]', leftClass: 'left-[90%]', label: 'RD' },
    midfielder_left: { topClass: 'top-[55%]', leftClass: 'left-[25%]', label: 'MG' },
    midfielder_center: { topClass: 'top-[55%]', leftClass: 'left-[50%]', label: 'MC' },
    midfielder_right: { topClass: 'top-[55%]', leftClass: 'left-[75%]', label: 'MD' },
    attacker_left: { topClass: 'top-[80%]', leftClass: 'left-[20%]', label: 'AG' },
    attacker_center: { topClass: 'top-[80%]', leftClass: 'left-[50%]', label: 'AC' },
    attacker_right: { topClass: 'top-[80%]', leftClass: 'left-[80%]', label: 'AD' },
  },
};

type FormationData = { id: string; teamId: string; numberOfPlayers: number; players: Record<string, string>; savedAt?: string };

export const Tactics = () => {
  const { user } = useAuth();
  const { équipes } = useÉquipes();
  const [userTeam, setUserTeam] = useState<any | null>(null);
  const [teamPlayers, setTeamPlayers] = useState<any[]>([]);
  const [numberOfPlayers, setNumberOfPlayers] = useState<5 | 7 | 9 | 11>(5);
  const [formation, setFormation] = useState<Record<string, string>>({});
  const [savedFormation, setSavedFormation] = useState(false);
  const [loadedFormation, setLoadedFormation] = useState<FormationData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingFormation, setIsLoadingFormation] = useState(true);

  // load user's team from équipes (either via user.teamId or captain id)
  useEffect(() => {
    if (!équipes.length) return;
    let team = null;
    if (user?.team_id) team = équipes.find(t => t.id === user.team_id) || null;
    if (!team && user?.role === 'captain') team = équipes.find(t => t.capitaine_id === user.id) || équipes[0] || null;
    setUserTeam(team);
  }, [équipes, user]);

  // load players for team
  const { joueurs } = useJoueurs(userTeam?.id || '');

  useEffect(() => {
    if (!joueurs) return;
    setTeamPlayers(joueurs);
  }, [joueurs]);

  // load saved formation from Supabase
  useEffect(() => {
    const fetchFormation = async () => {
      if (!userTeam) return;
      setIsLoadingFormation(true);
      const data = await obtenirFormationÉquipe(userTeam.id);
      if (data && data.configuration) {
        const parsed = data.configuration as FormationData;
        setLoadedFormation(parsed);
        setNumberOfPlayers(parsed.numberOfPlayers as any);
        setFormation(parsed.players);
        setSavedFormation(true);
      }
      setIsLoadingFormation(false);
    };
    
    fetchFormation();
  }, [userTeam]);

  const fieldPositions = FORMATION_PRESETS[numberOfPlayers];
  const placedPlayerIds = useMemo(() => new Set(Object.values(formation)), [formation]);
  const availablePlayers = useMemo(
    () => teamPlayers.filter(player => !placedPlayerIds.has(player.id)),
    [teamPlayers, placedPlayerIds]
  );

  const getPlayerName = (playerId: string) => teamPlayers.find(player => player.id === playerId)?.nom || 'Joueur';
  const getPlayerNumber = (playerId: string) => teamPlayers.find(player => player.id === playerId)?.numéro || '-';

  const handlePlayerDrop = (e: React.DragEvent<HTMLDivElement>, position: string) => {
    e.preventDefault();
    const playerId = e.dataTransfer.getData('playerId');
    if (!playerId) return;
    setFormation(prev => ({ ...prev, [position]: playerId }));
    setSavedFormation(false);
  };

  const handleRemovePlayer = (position: string) => {
    setFormation(prev => {
      const next = { ...prev };
      delete next[position];
      return next;
    });
    setSavedFormation(false);
  };

  const handleSaveFormation = async () => {
    if (userTeam) {
      setIsSaving(true);
      const payload: FormationData = {
        id: `db_${userTeam.id}`,
        teamId: userTeam.id,
        numberOfPlayers,
        players: formation,
        savedAt: new Date().toISOString(),
      };
      
      const dbFormation = `${numberOfPlayers}v${numberOfPlayers}`;
      const result = await sauvegarderFormation(userTeam.id, dbFormation, payload);
      
      if (result) {
        setLoadedFormation(payload);
        setSavedFormation(true);
      }
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormation({});
    setSavedFormation(false);
  };

  if (user?.role !== 'captain') {
    return (
      <div className="p-8 text-center">
        <div className="max-w-md mx-auto bg-blue-50 border border-blue-200 rounded-xl p-6">
          <p className="text-blue-900 font-medium">Accès réservé aux capitaines</p>
          <p className="text-blue-700 text-sm mt-2">Seuls les capitaines peuvent créer une composition tactique.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Composition Tactique</h1>
          <p className="text-slate-500 mt-2">{userTeam?.nom} • Créez et sauvegardez votre tactique</p>
        </div>
        {loadedFormation && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-900 text-sm">
            <strong>Formation chargée :</strong> {loadedFormation.numberOfPlayers}v{loadedFormation.numberOfPlayers}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">Nombre de joueurs sur le terrain</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {[5, 7, 9, 11].map(num => (
                  <button
                    key={num}
                    onClick={() => {
                      setNumberOfPlayers(num as 5 | 7 | 9 | 11);
                      setFormation({});
                      setSavedFormation(false);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      numberOfPlayers === num
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {num}v{num}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <button
                onClick={handleSaveFormation}
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-white font-medium hover:bg-emerald-700 transition-colors disabled:bg-emerald-400"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Sauvegarder
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-3 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Réinitialiser
              </button>
            </div>
          </div>

          <div className="relative w-full aspect-square rounded-3xl bg-gradient-to-b from-green-700 to-green-600 overflow-hidden border border-slate-200">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/30 rounded-full" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-1/4 border-2 border-white/30" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-1/4 border-2 border-white/30" />
            </div>

            {isLoadingFormation ? (
               <div className="absolute inset-0 flex items-center justify-center text-white">
                 <Loader2 className="w-10 h-10 animate-spin" />
               </div>
            ) : Object.entries(fieldPositions).map(([position, coords]) => {
              const playerId = formation[position];
              return (
                <div
                  key={position}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 ${coords.topClass} ${coords.leftClass}`}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => handlePlayerDrop(e, position)}
                >
                  {playerId ? (
                    <button
                      type="button"
                      onClick={() => handleRemovePlayer(position)}
                      className="relative w-14 h-14 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex flex-col items-center justify-center text-white text-xs font-bold transition-transform hover:-translate-y-1"
                    >
                      <span>{getPlayerNumber(playerId)}</span>
                      <span className="text-[10px] mt-0.5">{coords.label}</span>
                      <span className="absolute -top-2 right-[-0.5rem] inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-green-700 text-[10px] font-bold">×</span>
                    </button>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-[10px] text-white font-semibold">
                      {coords.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">
            <p className="font-medium text-slate-900">Positions à placer</p>
            <p className="mt-2">{Object.keys(formation).length} / {Object.keys(fieldPositions).length} joueurs placés</p>
            <p className="mt-1 text-slate-500">Faites glisser un joueur depuis la liste de droite vers un emplacement du terrain.</p>
          </div>
          {savedFormation && (
            <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-900 text-sm">
              ✓ Formation sauvegardée sur la base de données. Utilisez la même composition pour vos prochains matchs.
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Joueurs disponibles</h2>
            <div className="space-y-3 max-h-[560px] overflow-y-auto">
              {teamPlayers.map(player => {
                const isPlaced = placedPlayerIds.has(player.id);
                return (
                  <div
                    key={player.id}
                    draggable={!isPlaced}
                    onDragStart={e => e.dataTransfer.setData('playerId', player.id)}
                    className={`p-3 rounded-2xl border transition-colors ${isPlaced ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-70' : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 cursor-grab'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                        {player.numéro}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{player.nom}</p>
                        <p className="text-xs text-slate-500">{player.poste}</p>
                      </div>
                    </div>
                    {isPlaced && <p className="mt-2 text-[11px] text-emerald-700 font-semibold">Position assignée</p>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl border border-blue-200 p-5 text-sm text-blue-900">
            <p className="font-semibold">Terrain adaptatif</p>
            <p className="mt-2">Formation actuelle : {numberOfPlayers}v{numberOfPlayers}</p>
            <p className="mt-1">Joueurs placés : {Object.keys(formation).length} / {Object.keys(fieldPositions).length}</p>
            <p className="mt-2 text-blue-700">La composition se met à jour en temps réel pendant le drag-and-drop.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
