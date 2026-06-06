import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save, RotateCcw, Loader2, Shield, Users } from 'lucide-react';
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
  const [userTeam, setUserTeam] = useState<any>(null);
  const [numberOfPlayers, setNumberOfPlayers] = useState<5 | 7 | 9 | 11>(5);
  const [formation, setFormation] = useState<Record<string, string>>({});
  const [savedFormation, setSavedFormation] = useState(false);
  const [loadedFormation, setLoadedFormation] = useState<FormationData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!équipes.length) return;
    let team = null;
    if (user?.team_id) team = équipes.find(t => t.id === user.team_id) || null;
    if (!team && user?.role === 'captain') team = équipes.find(t => t.capitaine_id === user.id) || équipes[0] || null;
    setUserTeam(team);
  }, [équipes, user]);

  const { joueurs } = useJoueurs(userTeam?.id || '');

  useEffect(() => {
    const fetch = async () => {
      if (!userTeam) return;
      setIsLoading(true);
      const data = await obtenirFormationÉquipe(userTeam.id);
      if (data?.configuration) {
        const parsed = data.configuration as FormationData;
        setLoadedFormation(parsed);
        setNumberOfPlayers(parsed.numberOfPlayers as any);
        setFormation(parsed.players);
        setSavedFormation(true);
      }
      setIsLoading(false);
    };
    fetch();
  }, [userTeam]);

  const fieldPositions = FORMATION_PRESETS[numberOfPlayers];
  const placedIds = useMemo(() => new Set(Object.values(formation)), [formation]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, position: string) => {
    e.preventDefault();
    const pid = e.dataTransfer.getData('playerId');
    if (!pid) return;
    setFormation(prev => ({ ...prev, [position]: pid }));
    setSavedFormation(false);
  };

  const handleRemove = (position: string) => {
    setFormation(prev => { const n = { ...prev }; delete n[position]; return n; });
    setSavedFormation(false);
  };

  const handleSave = async () => {
    if (!userTeam) return;
    setIsSaving(true);
    const payload: FormationData = { id: `db_${userTeam.id}`, teamId: userTeam.id, numberOfPlayers, players: formation, savedAt: new Date().toISOString() };
    const result = await sauvegarderFormation(userTeam.id, `${numberOfPlayers}v${numberOfPlayers}`, payload);
    if (result) { setLoadedFormation(payload); setSavedFormation(true); }
    setIsSaving(false);
  };

  if (user?.role !== 'captain') {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <div className="glass rounded-3xl p-10 text-center border-panel max-w-md w-full">
          <Shield className="w-12 h-12 mx-auto mb-4 text-muted opacity-50" />
          <h2 className="text-xl font-display font-bold text-primary mb-3">Accès Capitaine requis</h2>
          <p className="text-muted text-sm">Seuls les capitaines peuvent créer une composition tactique.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full bg-gradient-to-b from-accent-strong to-emerald-300" />
          <div>
            <h1 className="text-2xl font-display font-bold text-primary">Composition Tactique</h1>
            <p className="text-sm text-muted">{userTeam?.nom} · Formation {numberOfPlayers}v{numberOfPlayers}</p>
          </div>
        </div>
        {loadedFormation && (
          <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
            ✓ Formation sauvegardée · {loadedFormation.numberOfPlayers}v{loadedFormation.numberOfPlayers}
          </div>
        )}
      </div>

      <div className="grid xl:grid-cols-[1fr_320px] gap-6">
        {/* Terrain + contrôles */}
        <div className="space-y-5">
          {/* Contrôles */}
          <div className="glass rounded-2xl border-panel p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Format de jeu</p>
                <div className="flex gap-2">
                  {([5, 7, 9, 11] as const).map(n => (
                    <button key={n} onClick={() => { setNumberOfPlayers(n); setFormation({}); setSavedFormation(false); }}
                      className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${numberOfPlayers === n ? 'bg-gradient-to-r from-accent-strong to-emerald-400 text-black' : 'bg-panel-soft text-muted hover:text-primary hover:bg-white/5'}`}>
                      {n}v{n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-accent-strong to-emerald-400 text-black hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Sauvegarder
                </button>
                <button onClick={() => { setFormation({}); setSavedFormation(false); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-panel-soft text-muted hover:text-primary hover:bg-white/5 transition-all border-panel">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 text-sm">
              <div className="h-1.5 flex-1 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-accent-strong to-emerald-300 transition-all" style={{ width: `${(Object.keys(formation).length / Object.keys(fieldPositions).length) * 100}%` }} />
              </div>
              <span className="text-muted text-xs whitespace-nowrap">{Object.keys(formation).length}/{Object.keys(fieldPositions).length} placés</span>
            </div>
          </div>

          {/* Terrain de jeu */}
          <div className="relative w-full rounded-3xl overflow-hidden" style={{ aspectRatio: '3/4' }}>
            {/* Fond terrain */}
            <div className="absolute inset-0 bg-gradient-to-b from-green-800 via-green-700 to-green-800">
              {/* Lignes */}
              <div className="absolute inset-6 border border-white/20 rounded" />
              <div className="absolute left-6 right-6 top-1/2 h-px bg-white/20" />
              <div className="absolute left-1/2 top-6 bottom-6 w-px bg-white/10" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-white/20 rounded-full" />
              {/* Surface de but haut */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-1/3 h-1/6 border border-white/20" />
              {/* Surface de but bas */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-1/3 h-1/6 border border-white/20" />
              {/* Bandes alternées */}
              {[0,1,2,3,4].map(i => (
                <div key={i} className="absolute top-0 bottom-0" style={{ left: `${i * 20}%`, width: '20%', background: i % 2 === 0 ? 'rgba(0,0,0,0.04)' : 'transparent' }} />
              ))}
            </div>

            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-white/50" />
              </div>
            ) : Object.entries(fieldPositions).map(([pos, coords]) => {
              const pid = formation[pos];
              const player = pid ? joueurs.find(p => p.id === pid) : null;
              return (
                <div key={pos} className={`absolute -translate-x-1/2 -translate-y-1/2 ${coords.topClass} ${coords.leftClass}`}
                  onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, pos)}>
                  {player ? (
                    <button type="button" onClick={() => handleRemove(pos)}
                      className="relative w-14 h-14 rounded-full bg-gradient-to-br from-accent-strong to-emerald-400 border-2 border-white/50 shadow-lg shadow-black/40 flex flex-col items-center justify-center text-black text-xs font-black transition-all hover:scale-110 hover:-translate-y-1">
                      <span className="text-sm">{player.numéro}</span>
                      <span className="text-[9px] mt-0.5 opacity-80">{coords.label}</span>
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center text-white text-[9px] font-black">×</span>
                    </button>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white/15 border-2 border-white/30 flex items-center justify-center text-[10px] text-white font-bold backdrop-blur-sm hover:bg-white/25 transition-all">
                      {coords.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {savedFormation && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
              <span>✓</span>
              <span>Formation sauvegardée. Votre composition sera visible dans l'espace administrateur.</span>
            </div>
          )}
        </div>

        {/* Sidebar joueurs */}
        <div className="space-y-4">
          <div className="glass rounded-2xl border-panel p-5">
            <h2 className="font-display font-bold text-primary mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" /> Joueurs disponibles
              <span className="ml-auto text-xs text-muted">{joueurs.length - placedIds.size} libres</span>
            </h2>
            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
              {joueurs.map(player => {
                const placed = placedIds.has(player.id);
                return (
                  <div key={player.id} draggable={!placed} onDragStart={e => e.dataTransfer.setData('playerId', player.id)}
                    className={`p-3 rounded-xl border transition-all ${placed ? 'bg-panel-soft border-panel opacity-50 cursor-not-allowed' : 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10 cursor-grab active:cursor-grabbing hover:border-emerald-500/40'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${placed ? 'bg-slate-700 text-muted' : 'bg-gradient-to-br from-accent-strong to-emerald-400 text-black'}`}>
                        {player.numéro}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-primary text-sm truncate">{player.nom}</p>
                        <p className="text-xs text-muted">{player.poste}</p>
                      </div>
                      {placed && <span className="text-xs text-emerald-400 font-semibold flex-shrink-0">✓</span>}
                    </div>
                  </div>
                );
              })}
              {joueurs.length === 0 && <p className="text-sm text-muted text-center py-6">Aucun joueur inscrit.</p>}
            </div>
          </div>

          {/* Infos */}
          <div className="glass rounded-2xl border-panel p-4 text-sm space-y-2">
            <p className="font-semibold text-primary">Mode d'emploi</p>
            <p className="text-muted text-xs leading-relaxed">Glissez un joueur depuis la liste vers un poste sur le terrain. Cliquez sur un joueur placé pour le retirer. Sauvegardez pour conserver la composition.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
