import React, { useState, useEffect } from 'react';
import { UserPlus, ShieldCheck, CheckCircle, Loader2, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { créerÉquipe } from '../services/équipesService';
import { créerJoueur } from '../services/joueursService';
import { clientSupabase } from '../config/supabase';

interface PlayerForm { nom: string; numéro: string; poste: string; }

export const RegisterTeam = () => {
  const { user } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamClass, setTeamClass] = useState(user?.class_name || 'P1');
  const [players, setPlayers] = useState<PlayerForm[]>(Array(7).fill({ nom: '', numéro: '', poste: '' }));

  useEffect(() => {
    if (user?.team_id) {
      clientSupabase.from('équipes').select('*').eq('id', user.team_id).single().then(({ data }) => {
        if (data) { setTeamName(data.nom); setTeamClass(data.classe); }
      });
    }
  }, [user?.team_id]);

  if (user?.role !== 'captain') {
    return (
      <div className="p-8 max-w-3xl mx-auto flex items-center justify-center min-h-64">
        <div className="glass rounded-3xl p-10 text-center border-panel max-w-md w-full">
          <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-muted opacity-50" />
          <h1 className="text-2xl font-display font-bold text-primary mb-3">Accès restreint</h1>
          <p className="text-muted">L'inscription d'équipe est réservée aux capitaines.</p>
        </div>
      </div>
    );
  }

  const handlePlayerChange = (i: number, field: keyof PlayerForm, value: string) => {
    const next = [...players]; next[i] = { ...next[i], [field]: value }; setPlayers(next);
  };

  const addPlayer = () => { if (players.length < 10) setPlayers([...players, { nom: '', numéro: '', poste: '' }]); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!navigator.onLine) { setError("Vérifiez votre connexion internet."); return; }
    if (!teamName.trim()) { setError("Le nom de l'équipe est requis."); return; }
    const valid = players.filter(p => p.nom.trim());
    if (valid.length < 7) { setError("Inscrivez au moins 7 joueurs (5 titulaires + 2 remplaçants)."); return; }
    for (const p of valid) { if (!p.nom || !p.numéro || !p.poste) { setError(`Complétez toutes les infos pour ${p.nom || 'ce joueur'}.`); return; } }
    setIsSubmitting(true);
    try {
      let teamId = user?.team_id;
      if (!teamId) {
        const code = `${teamClass}-${Date.now().toString(36).toUpperCase()}`;
        const équipe = await créerÉquipe({ nom: teamName, classe: teamClass, écusson_id: '1', description: 'Équipe inscrite', code_acces: code });
        if (!équipe) throw new Error("Erreur lors de la création de l'équipe.");
        teamId = équipe.id;
        if (user?.id) {
          await clientSupabase.from('profiles').update({ team_id: équipe.id }).eq('id', user.id);
          await clientSupabase.from('équipes').update({ capitaine_id: user.id }).eq('id', équipe.id);
        }
      }
      await Promise.all(valid.map(p => créerJoueur({ nom: p.nom, numéro: parseInt(p.numéro, 10), poste: p.poste, équipe_id: teamId })));
      setIsSubmitted(true);
    } catch (err: any) {
      const msg = err?.message || '';
      setError(msg.includes('Failed to fetch') ? "Impossible de joindre le serveur. Vérifiez les variables d'environnement." : msg || "Erreur lors de l'inscription.");
    } finally { setIsSubmitting(false); }
  };

  if (isSubmitted) {
    return (
      <div className="p-8 max-w-2xl mx-auto flex items-center justify-center min-h-64">
        <div className="glass rounded-3xl p-8 sm:p-12 text-center border border-emerald-500/30 bg-emerald-500/5 w-full animate-slide-up">
          <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-primary mb-3">Équipe inscrite !</h2>
          <p className="text-muted">Votre inscription a été transmise aux organisateurs. Vous serez notifié après validation.</p>
          <button onClick={() => window.location.href = '/'} className="mt-8 btn-primary max-w-xs mx-auto">
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 rounded-full bg-gradient-to-b from-accent-strong to-emerald-300" />
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2 text-primary">
            <UserPlus className="w-6 h-6 text-accent-strong" /> Inscrire une équipe
          </h1>
          <p className="text-sm text-muted mt-0.5">Remplissez ce formulaire en tant que capitaine pour inscrire votre classe.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl alert-error flex items-start gap-3 animate-slide-up">
          <span className="text-lg flex-shrink-0">⚠️</span>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Infos équipe */}
        <div className="glass rounded-2xl border-panel p-6">
          <h2 className="text-base font-display font-bold text-primary mb-5 flex items-center gap-2 pb-4 border-b border-panel">
            <ShieldCheck className="w-5 h-5 text-accent-strong" /> Informations de l'équipe
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Nom de l'équipe</label>
              <input required type="text" value={teamName} onChange={e => setTeamName(e.target.value)} disabled={!!user?.team_id}
                className="input-field pl-3" placeholder="Ex: Les Lions de P1" />
            </div>
            <div>
              <label htmlFor="reg-class" className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Classe</label>
              <select id="reg-class" required value={teamClass} onChange={e => setTeamClass(e.target.value)} disabled={!!user?.team_id} className="select-field">
                {['P1','P2','ING1','ING2','ING3'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="captain-name" className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Capitaine</label>
              <input id="captain-name" disabled type="text" value={user?.full_name || user?.username || 'Non défini'} className="input-field pl-3 opacity-60 cursor-not-allowed" />
            </div>
          </div>
        </div>

        {/* Effectif */}
        <div className="glass rounded-2xl border-panel p-6">
          <h2 className="text-base font-display font-bold text-primary mb-5 flex items-center gap-2 pb-4 border-b border-panel">
            <UserPlus className="w-5 h-5 text-blue-400" /> Effectif
            <span className="text-xs font-normal text-muted ml-1">(5 titulaires + min. 2 remplaçants)</span>
          </h2>
          <div className="space-y-3">
            {players.map((player, i) => (
              <div key={i} className="flex gap-3 items-center p-3 rounded-xl bg-panel-soft">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-strong/30 to-accent-strong/10 border border-accent-strong/20 flex items-center justify-center text-xs font-bold text-accent-strong flex-shrink-0">
                  {i + 1}
                </div>
                <input type="text" required={i < 7} value={player.nom} onChange={e => handlePlayerChange(i, 'nom', e.target.value)} placeholder="Nom du joueur"
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-sm text-primary focus:border-accent-strong outline-none transition-all" />
                <input type="number" required={i < 7} value={player.numéro} onChange={e => handlePlayerChange(i, 'numéro', e.target.value)} placeholder="N°"
                  className="w-16 px-2 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-sm text-primary focus:border-accent-strong outline-none transition-all text-center" />
                <select required={i < 7} aria-label={`Poste joueur ${i + 1}`} value={player.poste} onChange={e => handlePlayerChange(i, 'poste', e.target.value)}
                  className="w-28 px-2 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-sm text-primary focus:border-accent-strong outline-none transition-all">
                  <option value="">Poste</option>
                  <option>Gardien</option>
                  <option>Défenseur</option>
                  <option>Milieu</option>
                  <option>Attaquant</option>
                </select>
              </div>
            ))}
          </div>
          {players.length < 10 && (
            <button type="button" onClick={addPlayer} className="mt-4 flex items-center gap-2 text-sm font-semibold text-accent-strong hover:text-accent-medium transition-colors">
              <Plus className="w-4 h-4" /> Ajouter un remplaçant (max 10)
            </button>
          )}
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={isSubmitting} className="btn-primary max-w-xs">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {isSubmitting ? 'Envoi en cours...' : "Soumettre l'inscription"}
          </button>
        </div>
      </form>
    </div>
  );
};
