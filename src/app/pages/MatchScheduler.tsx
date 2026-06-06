import React, { useState, useMemo } from 'react';
import { useÉquipes, useMatchs } from '../hooks/useSupabase';
import { créerMatch, créerMatchs, validerDateMatch } from '../services/matchsService';
import { useNavigate } from 'react-router-dom';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Calendar, Clock, Download, ArrowLeft, Zap, Shield, AlertCircle, CheckCircle, Trash2, Plus } from 'lucide-react';

/** Retourne la date du jour au format YYYY-MM-DD (pour l'attribut min des inputs date) */
const aujourd_hui = () => new Date().toISOString().slice(0, 10);

export const MatchScheduler: React.FC = () => {
  const { équipes, chargement: chargementÉquipes } = useÉquipes();
  const { refetch: refetchMatchs } = useMatchs();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState<string>(aujourd_hui());
  const [selectedTime, setSelectedTime] = useState<string>('09:00');

  // dynamic scheduler settings
  const [slotCount, setSlotCount] = useState<number>(6);
  const [slotDuration, setSlotDuration] = useState<number>(25);

  const initialSlots = useMemo(
    () =>
      Array.from({ length: slotCount }).map(() => ({
        teamA: '',
        teamB: '',
        date: selectedDate,
        heure: selectedTime,
        durée: slotDuration,
        scoreA: '',
        scoreB: '',
      })),
    [slotCount, selectedDate, selectedTime, slotDuration]
  );
  const [slots, setSlots] = useState(() => initialSlots);

  const onDragStart = (e: React.DragEvent, teamId: string) => {
    e.dataTransfer.setData('text/plain', teamId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDropToSlot = (index: number, side: 'A' | 'B', e: React.DragEvent) => {
    e.preventDefault();
    const teamId = e.dataTransfer.getData('text/plain');
    if (!teamId) return;
    setSlots(prev => {
      const next = [...prev];
      if (side === 'A') next[index].teamA = teamId;
      else next[index].teamB = teamId;
      if (next[index].teamA === next[index].teamB) {
        // don't allow same team both sides
        if (side === 'B') next[index].teamB = '';
        else next[index].teamA = '';
      }
      return next;
    });
  };

  const allowDrop = (e: React.DragEvent) => e.preventDefault();

  const clearSlot = (index: number) =>
    setSlots(prev =>
      prev.map((s, i) =>
        i === index
          ? { teamA: '', teamB: '', date: selectedDate, heure: selectedTime, durée: slotDuration, scoreA: '', scoreB: '' }
          : s
      )
    );

  const handleCreateMatch = async (index: number) => {
    const slot = slots[index];
    if (!slot.teamA || !slot.teamB) return;

    const dateSlot = slot.date || selectedDate;
    const heureSlot = slot.heure || selectedTime;
    const erreurDate = validerDateMatch(dateSlot, heureSlot);
    if (erreurDate) { alert(erreurDate); return; }

    try {
      await créerMatch({
        équipe_a_id: slot.teamA,
        équipe_b_id: slot.teamB,
        date: dateSlot,
        heure: heureSlot,
        durée: String(slot.durée ?? slotDuration),
        lieu: 'Terrain Central ENSIT',
        score_a: slot.scoreA === '' ? null : Number(slot.scoreA),
        score_b: slot.scoreB === '' ? null : Number(slot.scoreB),
      });
      await refetchMatchs();
      clearSlot(index);
      alert('Match créé avec succès !');
    } catch (err: any) {
      console.error('Erreur création via scheduler :', err);
      alert('Erreur : ' + (err?.message || err));
    }
  };

  // validate conflicts: same team used multiple times or scheduled at same time
  const validateSlots = (currentSlots = slots) => {
    const errors: Record<number, string> = {};
    const teamUsage: Record<string, number[]> = {};
    currentSlots.forEach((s, i) => {
      if (s.teamA) teamUsage[s.teamA] = (teamUsage[s.teamA] || []).concat(i);
      if (s.teamB) teamUsage[s.teamB] = (teamUsage[s.teamB] || []).concat(i);
    });
    Object.entries(teamUsage).forEach(([teamId, indices]) => {
      if (indices.length > 1) {
        indices.forEach(idx => {
          errors[idx] = 'Équipe déjà programmée dans un autre créneau';
        });
      }
    });
    return errors;
  };

  const batchCreateFilledSlots = async () => {
    const errors = validateSlots();
    if (Object.keys(errors).length > 0) {
      alert('Conflits détectés. Corrigez-les avant la sauvegarde.');
      return;
    }
    const formulaires = slots
      .map(s => ({
        équipe_a_id: s.teamA,
        équipe_b_id: s.teamB,
        date: s.date || selectedDate,
        heure: s.heure || selectedTime,
        durée: String(s.durée ?? slotDuration),
        lieu: 'Terrain Central ENSIT',
        score_a: s.scoreA === '' ? null : Number(s.scoreA),
        score_b: s.scoreB === '' ? null : Number(s.scoreB),
      }))
      .filter(f => f.équipe_a_id && f.équipe_b_id);

    if (formulaires.length === 0) {
      alert('Aucun créneau rempli à sauvegarder.');
      return;
    }

    // Valider toutes les dates avant d'envoyer
    for (const f of formulaires) {
      const err = validerDateMatch(f.date, f.heure);
      if (err) { alert(err); return; }
    }

    try {
      const created = await créerMatchs(formulaires);
      if (!created) throw new Error('Échec création en lot');
      await refetchMatchs();
      setSlots(initialSlots);
      alert(`${created.length} match(s) créé(s) avec succès !`);
    } catch (err: any) {
      console.error('Erreur création en lot :', err);
      alert('Erreur : ' + (err?.message || err));
    }
  };

  const exportCSV = () => {
    const rows = [['date','heure','équipe_a','équipe_b','durée','score_a','score_b','lieu']];
    slots.forEach(s => {
      if (s.teamA && s.teamB) {
        const teamA = (équipes.find(t => t.id === s.teamA) || {}).nom || s.teamA;
        const teamB = (équipes.find(t => t.id === s.teamB) || {}).nom || s.teamB;
        rows.push([
          s.date || selectedDate,
          s.heure || selectedTime,
          teamA,
          teamB,
          String(s.durée ?? slotDuration),
          s.scoreA || '',
          s.scoreB || '',
          'Terrain Central ENSIT',
        ]);
      }
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planning_matchs_${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filledSlotsCount = slots.filter(s => s.teamA && s.teamB).length;
  const errors = validateSlots();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* En-tête moderne */}
        <div className="glass p-6 rounded-3xl border border-panel">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/admin')} 
                className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-display font-black text-primary flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-accent-strong" />
                  Planificateur de Matchs
                </h1>
                <p className="text-sm text-muted mt-1">Glissez-déposez les équipes pour créer des rencontres</p>
              </div>
            </div>
            
            {/* Stats rapides */}
            <div className="flex gap-3">
              <div className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="text-xs text-blue-300 font-semibold">Créneaux remplis</div>
                <div className="text-2xl font-black text-blue-400">{filledSlotsCount}/{slotCount}</div>
              </div>
              {Object.keys(errors).length > 0 && (
                <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                  <div className="text-xs text-red-300 font-semibold">Conflits</div>
                  <div className="text-2xl font-black text-red-400">{Object.keys(errors).length}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          
          {/* Sidebar - Liste des équipes */}
          <div className="lg:col-span-1">
            <div className="glass p-6 rounded-3xl border border-panel sticky top-6">
              <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2 text-primary">
                <Shield className="w-5 h-5 text-accent-strong" />
                Équipes ({équipes.length})
              </h3>
              {chargementÉquipes ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-strong"></div>
                </div>
              ) : (
                <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-auto pr-2 custom-scrollbar">
                  {équipes.map(team => (
                    <div 
                      key={team.id} 
                      draggable 
                      onDragStart={e => onDragStart(e, team.id)} 
                      className="group p-3 rounded-xl flex items-center gap-3 bg-slate-800/30 border border-slate-700/50 hover:bg-slate-700/40 hover:border-accent-strong/30 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.02] card-3d"
                    >
                      <div className="relative">
                        <ImageWithFallback 
                          src={team.logo || ''} 
                          alt={team.nom} 
                          className="w-10 h-10 rounded-full ring-2 ring-slate-700 group-hover:ring-accent-strong/50 transition-all" 
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-primary truncate">{team.nom}</div>
                        <div className="text-xs text-muted">{team.classe}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Zone principale - Configuration et créneaux */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Panneau de configuration */}
            <div className="glass p-6 rounded-3xl border border-panel">
              <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2 text-primary">
                <Zap className="w-5 h-5 text-accent-strong" />
                Configuration globale
              </h3>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div>
                  <label htmlFor="scheduler-date" className="block text-xs font-semibold text-muted mb-2 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> Date par défaut
                  </label>
                  <input 
                    id="scheduler-date" 
                    type="date" 
                    min={aujourd_hui()} 
                    value={selectedDate} 
                    onChange={e => setSelectedDate(e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-primary focus:border-accent-strong focus:ring-2 focus:ring-accent-strong/20 transition-all outline-none" 
                  />
                </div>
                
                <div>
                  <label htmlFor="scheduler-time" className="block text-xs font-semibold text-muted mb-2 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> Heure par défaut
                  </label>
                  <input 
                    id="scheduler-time" 
                    type="time" 
                    value={selectedTime} 
                    onChange={e => setSelectedTime(e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-primary focus:border-accent-strong focus:ring-2 focus:ring-accent-strong/20 transition-all outline-none" 
                  />
                </div>
                
                <div>
                  <label htmlFor="scheduler-slot-count" className="block text-xs font-semibold text-muted mb-2 flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5" /> Nb créneaux
                  </label>
                  <input 
                    id="scheduler-slot-count" 
                    type="number" 
                    min={1} 
                    max={24} 
                    value={slotCount} 
                    onChange={e => {
                      const v = Math.max(1, Math.min(24, Number(e.target.value) || 1));
                      setSlotCount(v);
                      setSlots(prev => {
                        const next = Array.from({ length: v }).map((_, i) =>
                          prev[i]
                            ? { ...prev[i] }
                            : { teamA: '', teamB: '', date: selectedDate, heure: selectedTime, durée: slotDuration, scoreA: '', scoreB: '' }
                        );
                        return next;
                      });
                    }} 
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-primary focus:border-accent-strong focus:ring-2 focus:ring-accent-strong/20 transition-all outline-none" 
                  />
                </div>
                
                <div>
                  <label htmlFor="scheduler-slot-duration" className="block text-xs font-semibold text-muted mb-2 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> Durée (min)
                  </label>
                  <input 
                    id="scheduler-slot-duration" 
                    type="number" 
                    min={5} 
                    step={5} 
                    value={slotDuration} 
                    onChange={e => setSlotDuration(Number(e.target.value) || 25)} 
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-primary focus:border-accent-strong focus:ring-2 focus:ring-accent-strong/20 transition-all outline-none" 
                  />
                </div>
              </div>
              
              {/* Actions globales */}
              <div className="flex flex-wrap gap-3">
                <button 
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-accent-strong to-accent-medium text-white hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={batchCreateFilledSlots}
                  disabled={filledSlotsCount === 0 || Object.keys(errors).length > 0}
                >
                  <Zap className="w-4 h-4" /> Créer tous les matchs ({filledSlotsCount})
                </button>
                <button 
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-slate-800/50 border border-slate-700 text-primary hover:bg-slate-700/50 hover:border-accent-strong/30 transition-all"
                  onClick={exportCSV}
                >
                  <Download className="w-4 h-4" /> Exporter CSV
                </button>
              </div>
              
              {Object.keys(errors).length > 0 && (
                <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-300">Conflits détectés</p>
                    <p className="text-xs text-red-200/70 mt-1">Une ou plusieurs équipes sont programmées dans plusieurs créneaux simultanément.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Liste des créneaux */}
            <div className="space-y-4">
              {slots.map((slot, i) => {
                const hasError = errors[i];
                const teamAData = équipes.find(t => t.id === slot.teamA);
                const teamBData = équipes.find(t => t.id === slot.teamB);
                const isComplete = slot.teamA && slot.teamB;
                
                return (
                  <div 
                    key={i} 
                    className={`glass p-5 rounded-3xl border transition-all ${
                      hasError 
                        ? 'border-red-500/50 bg-red-500/5' 
                        : isComplete 
                        ? 'border-emerald-500/30 bg-emerald-500/5' 
                        : 'border-panel'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-strong to-accent-medium flex items-center justify-center font-black text-white">
                          {i + 1}
                        </div>
                        {isComplete && (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-semibold text-emerald-300">Prêt</span>
                          </div>
                        )}
                        {hasError && (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                            <AlertCircle className="w-4 h-4 text-red-400" />
                            <span className="text-xs font-semibold text-red-300">Conflit</span>
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => clearSlot(i)} 
                        className="p-2 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-red-500/10 hover:border-red-500/30 transition-all group"
                      >
                        <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-400 transition-colors" />
                      </button>
                    </div>

                    <div className="grid lg:grid-cols-5 gap-4 items-center">
                      
                      {/* Zone Équipe A */}
                      <div 
                        className="lg:col-span-2"
                        onDragOver={allowDrop} 
                        onDrop={e => onDropToSlot(i, 'A', e)}
                      >
                        {slot.teamA && teamAData ? (
                          <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-700 flex items-center gap-3 hover:border-accent-strong/30 transition-all">
                            <ImageWithFallback 
                              src={teamAData.logo || ''} 
                              alt={teamAData.nom} 
                              className="w-12 h-12 rounded-full ring-2 ring-slate-700" 
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-primary truncate">{teamAData.nom}</div>
                              <div className="text-xs text-muted">{teamAData.classe}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-6 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800/20 flex flex-col items-center justify-center text-center hover:border-accent-strong/30 hover:bg-slate-800/40 transition-all min-h-[100px]">
                            <Shield className="w-6 h-6 text-slate-600 mb-2" />
                            <div className="text-xs text-muted font-medium">Glissez l'équipe A ici</div>
                          </div>
                        )}
                      </div>

                      {/* Zone centrale - Infos match */}
                      <div className="lg:col-span-1 space-y-3">
                        <input 
                          id={`slot-date-${i}`}
                          type="date" 
                          min={aujourd_hui()} 
                          value={slot.date || selectedDate} 
                          onChange={e => setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, date: e.target.value } : s))} 
                          className="w-full px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-xs text-primary focus:border-accent-strong transition-all outline-none" 
                        />
                        <input 
                          id={`slot-time-${i}`}
                          type="time" 
                          value={slot.heure || selectedTime} 
                          onChange={e => setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, heure: e.target.value } : s))} 
                          className="w-full px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-xs text-primary focus:border-accent-strong transition-all outline-none" 
                        />
                        <input 
                          id={`slot-duration-${i}`}
                          type="number" 
                          min={5} 
                          step={5} 
                          value={slot.durée ?? slotDuration} 
                          onChange={e => setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, durée: Number(e.target.value) } : s))} 
                          className="w-full px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-xs text-primary focus:border-accent-strong transition-all outline-none"
                          placeholder="Durée min"
                        />
                        
                        {/* Scores */}
                        <div className="flex gap-2">
                          <input 
                            type="number" 
                            min={0} 
                            value={slot.scoreA ?? ''} 
                            placeholder="0" 
                            onChange={e => setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, scoreA: e.target.value } : s))} 
                            className="w-full px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-center font-bold text-primary focus:border-accent-strong transition-all outline-none" 
                          />
                          <div className="flex items-center justify-center text-muted font-bold">-</div>
                          <input 
                            type="number" 
                            min={0} 
                            value={slot.scoreB ?? ''} 
                            placeholder="0" 
                            onChange={e => setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, scoreB: e.target.value } : s))} 
                            className="w-full px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-center font-bold text-primary focus:border-accent-strong transition-all outline-none" 
                          />
                        </div>
                        
                        {slot.scoreA !== '' && slot.scoreB !== '' && (
                          <div className="text-center">
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                              <span className="text-xs font-semibold text-blue-300">Terminé</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Zone Équipe B */}
                      <div 
                        className="lg:col-span-2"
                        onDragOver={allowDrop} 
                        onDrop={e => onDropToSlot(i, 'B', e)}
                      >
                        {slot.teamB && teamBData ? (
                          <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-700 flex items-center gap-3 hover:border-accent-strong/30 transition-all">
                            <ImageWithFallback 
                              src={teamBData.logo || ''} 
                              alt={teamBData.nom} 
                              className="w-12 h-12 rounded-full ring-2 ring-slate-700" 
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-primary truncate">{teamBData.nom}</div>
                              <div className="text-xs text-muted">{teamBData.classe}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-6 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800/20 flex flex-col items-center justify-center text-center hover:border-accent-strong/30 hover:bg-slate-800/40 transition-all min-h-[100px]">
                            <Shield className="w-6 h-6 text-slate-600 mb-2" />
                            <div className="text-xs text-muted font-medium">Glissez l'équipe B ici</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action du créneau */}
                    <div className="mt-4 flex justify-end">
                      <button 
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-accent-strong to-accent-medium text-white hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                        disabled={!slot.teamA || !slot.teamB}
                        onClick={() => handleCreateMatch(i)}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Créer ce match
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchScheduler;
