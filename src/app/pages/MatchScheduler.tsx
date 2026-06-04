import React, { useState, useMemo } from 'react';
import { useÉquipes, useMatchs } from '../hooks/useSupabase';
import { créerMatch, créerMatchs } from '../services/matchsService';
import { useNavigate } from 'react-router-dom';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export const MatchScheduler: React.FC = () => {
  const { équipes, chargement: chargementÉquipes } = useÉquipes();
  const { refetch: refetchMatchs } = useMatchs();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
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
  };

  const onDropToSlot = (index: number, side: 'A' | 'B', e: React.DragEvent) => {
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
    try {
      await créerMatch({
        équipe_a_id: slot.teamA,
        équipe_b_id: slot.teamB,
        date: slot.date || selectedDate,
        heure: slot.heure || selectedTime,
        durée: String(slot.durée ?? slotDuration),
        lieu: 'Terrain Central ENSIT',
        score_a: slot.scoreA === '' ? null : Number(slot.scoreA),
        score_b: slot.scoreB === '' ? null : Number(slot.scoreB),
      });
      await refetchMatchs();
      clearSlot(index);
      alert('Match créé');
    } catch (err: any) {
      console.error('Erreur création via scheduler :', err);
      alert('Erreur lors de la création du match : ' + (err?.message || err));
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
    // same team on both sides already prevented, but check empty
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
    try {
      const created = await créerMatchs(formulaires);
      if (!created) throw new Error('Échec création en lot');
      await refetchMatchs();
      setSlots(initialSlots);
      alert(`Création réussie (${created.length} matchs)`);
    } catch (err: any) {
      console.error('Erreur création en lot :', err);
      alert('Erreur lors de la création en lot : ' + (err?.message || err));
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

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Planificateur de rencontres (Drag & Drop)</h1>
        <div className="flex gap-3">
          <button className="btn-secondary" onClick={() => navigate('/admin')}>Retour Admin</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 rounded-xl p-4 border border-panel">
          <h3 className="font-semibold mb-3">Équipes</h3>
          {chargementÉquipes ? (
            <p>Chargement...</p>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-auto">
              {équipes.map(team => (
                <div key={team.id} draggable onDragStart={e => onDragStart(e, team.id)} className="p-2 rounded flex items-center gap-3 hover:bg-white/5 cursor-grab">
                  <ImageWithFallback src={team.logo || ''} alt={team.nom} className="w-8 h-8 rounded-full" />
                  <div>
                    <div className="font-medium">{team.nom}</div>
                    <div className="text-xs text-slate-400">{team.classe}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-2 rounded-xl p-4 border border-panel">
          <div className="grid grid-cols-2 gap-4 items-center mb-4">
            <label htmlFor="scheduler-date" className="text-sm text-slate-400">Date</label>
            <input id="scheduler-date" type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="input-field" />
            <label htmlFor="scheduler-time" className="text-sm text-slate-400">Heure</label>
            <input id="scheduler-time" type="time" value={selectedTime} onChange={e => setSelectedTime(e.target.value)} className="input-field" />
            <label htmlFor="scheduler-slot-count" className="text-sm text-slate-400">Nombre de créneaux</label>
            <input id="scheduler-slot-count" type="number" min={1} max={24} value={slotCount} onChange={e => {
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
            }} className="input-field w-24" />
            <label htmlFor="scheduler-slot-duration" className="text-sm text-slate-400">Durée (min)</label>
            <input id="scheduler-slot-duration" type="number" min={5} step={5} value={slotDuration} onChange={e => setSlotDuration(Number(e.target.value) || 25)} className="input-field w-20" />
          </div>

          <div className="flex gap-3 items-center mb-4">
            <button className="btn-primary" onClick={batchCreateFilledSlots}>Créer tous les matchs remplis</button>
            <button className="btn-secondary" onClick={exportCSV}>Exporter CSV</button>
          </div>

          <div className="grid gap-3">
            {slots.map((slot, i) => (
              <div key={i} className="p-3 rounded-lg grid grid-cols-3 items-center bg-panel-soft">
                <div className="col-span-1" onDragOver={allowDrop} onDrop={e => onDropToSlot(i, 'A', e)}>
                  <div className="text-xs text-slate-400 mb-1">Équipe A</div>
                  {slot.teamA ? (
                    <div className="flex items-center gap-2 p-2 bg-white/5 rounded">
                      <ImageWithFallback src={(équipes.find(t => t.id === slot.teamA) || {}).logo || ''} alt="" className="w-6 h-6 rounded-full" />
                      <div className="font-medium">{(équipes.find(t => t.id === slot.teamA) || {}).nom}</div>
                    </div>
                  ) : (
                    <div className="p-3 rounded bg-transparent border-dashed text-slate-400">Glisser une équipe ici</div>
                  )}
                </div>
                <div className="col-span-1 text-center">
                  <div className="grid gap-2">
                    <label htmlFor={`slot-date-${i}`} className="sr-only">Date du créneau</label>
                    <input id={`slot-date-${i}`} type="date" value={slot.date || selectedDate} onChange={e => setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, date: e.target.value } : s))} className="input-field" />
                    <label htmlFor={`slot-time-${i}`} className="sr-only">Heure du créneau</label>
                    <input id={`slot-time-${i}`} type="time" value={slot.heure || selectedTime} onChange={e => setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, heure: e.target.value } : s))} className="input-field" />
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor={`slot-duration-${i}`} className="text-xs text-slate-400">Durée</label>
                      <input id={`slot-duration-${i}`} type="number" min={5} step={5} value={slot.durée ?? slotDuration} onChange={e => setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, durée: Number(e.target.value) } : s))} className="input-field w-24" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" min={0} value={slot.scoreA ?? ''} placeholder="Score A" onChange={e => setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, scoreA: e.target.value } : s))} className="input-field" />
                      <input type="number" min={0} value={slot.scoreB ?? ''} placeholder="Score B" onChange={e => setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, scoreB: e.target.value } : s))} className="input-field" />
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">Durée totale du match</div>
                  {slot.scoreA !== '' && slot.scoreB !== '' && (
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                      Match avec score — sera enregistré comme terminé
                    </div>
                  )}

                  <div className="mt-2 w-full h-10 rounded-lg overflow-hidden bg-slate-gradient-dark">
                    <div className="flex h-full">
                      <div className="flex-1 flex items-center justify-center text-xs font-semibold text-white border-r-soft">{(équipes.find(t => t.id === slot.teamA) || {}).nom || '—'}</div>
                      <div className="flex-1 flex items-center justify-center text-xs font-semibold text-white">{(équipes.find(t => t.id === slot.teamB) || {}).nom || '—'}</div>
                    </div>
                  </div>
                </div>
                <div className="col-span-1" onDragOver={allowDrop} onDrop={e => onDropToSlot(i, 'B', e)}>
                  <div className="text-xs text-slate-400 mb-1 text-right">Équipe B</div>
                  {slot.teamB ? (
                    <div className="flex items-center gap-2 justify-end p-2 bg-white/5 rounded">
                      <div className="font-medium">{(équipes.find(t => t.id === slot.teamB) || {}).nom}</div>
                      <ImageWithFallback src={(équipes.find(t => t.id === slot.teamB) || {}).logo || ''} alt="" className="w-6 h-6 rounded-full" />
                    </div>
                  ) : (
                    <div className="p-3 rounded bg-transparent border-dashed text-slate-400 text-right">Glisser une équipe ici</div>
                  )}
                </div>
                <div className="col-span-3 mt-3 flex flex-col gap-3 md:flex-row justify-between items-center">
                  <div className="text-sm text-slate-400">{slot.scoreA !== '' && slot.scoreB !== '' ? `Score proposé: ${slot.scoreA} - ${slot.scoreB}` : 'Scores à définir'}</div>
                  <div className="flex gap-3">
                    <button className="btn-secondary" onClick={() => clearSlot(i)}>Vider</button>
                    <button className="btn-primary" disabled={!slot.teamA || !slot.teamB} onClick={() => handleCreateMatch(i)}>Créer le match</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchScheduler;
