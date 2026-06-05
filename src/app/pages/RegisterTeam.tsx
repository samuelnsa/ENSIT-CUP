import React, { useState, useEffect } from 'react';
import { UserPlus, ShieldCheck, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { créerÉquipe } from '../services/équipesService';
import { créerJoueur } from '../services/joueursService';
import { clientSupabase } from '../config/supabase';

interface PlayerForm {
  nom: string;
  numéro: string;
  poste: string;
}

export const RegisterTeam = () => {
  const { user } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [teamName, setTeamName] = useState('');
  const [teamClass, setTeamClass] = useState(user?.class_name || 'P1');
  
  const [players, setPlayers] = useState<PlayerForm[]>(
    Array(7).fill({ nom: '', numéro: '', poste: '' })
  );

  useEffect(() => {
    if (user?.team_id) {
      const loadTeam = async () => {
        try {
          const { data, error } = await clientSupabase
            .from('équipes')
            .select('*')
            .eq('id', user.team_id)
            .single();
          if (data) {
            setTeamName(data.nom);
            setTeamClass(data.classe);
          }
        } catch (err) {
          console.error("Erreur chargement équipe :", err);
        }
      };
      loadTeam();
    }
  }, [user?.team_id]);

  if (user?.role !== 'captain') {
    return (
      <div className="p-8 max-w-3xl mx-auto mt-12">
        <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-10 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Accès restreint</h1>
          <p className="text-slate-600">L’inscription d’équipe est réservée aux capitaines.</p>
        </div>
      </div>
    );
  }

  const handlePlayerChange = (index: number, field: keyof PlayerForm, value: string) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], [field]: value };
    setPlayers(newPlayers);
  };

  const addPlayer = () => {
    if (players.length < 10) {
      setPlayers([...players, { nom: '', numéro: '', poste: '' }]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!navigator.onLine) {
      setError("Impossible de créer l'équipe : vérifiez votre connexion internet.");
      return;
    }

    // Validation
    if (!teamName.trim()) {
      setError("Le nom de l'équipe est requis.");
      return;
    }
    
    const validPlayers = players.filter(p => p.nom.trim());
    if (validPlayers.length < 7) {
      setError("Vous devez inscrire au moins 7 joueurs (5 titulaires + 2 remplaçants).");
      return;
    }
    
    for (const player of validPlayers) {
      if (!player.nom || !player.numéro || !player.poste) {
        setError(`Veuillez remplir toutes les informations pour le joueur ${player.nom || 'sans nom'}.`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let currentTeamId = user?.team_id;

      if (!currentTeamId) {
        // Créer l'équipe
        const generatedCode = `${teamClass}-${Date.now().toString(36).toUpperCase()}`;
        const equipe = await créerÉquipe({
          nom: teamName,
          classe: teamClass,
          écusson_id: '1', // Default
          description: 'Équipe inscrite via le formulaire',
          code_acces: generatedCode
        });

        if (!equipe) throw new Error("Erreur lors de la création de l'équipe.");
        currentTeamId = equipe.id;

        // Mettre à jour le profil du capitaine avec le team_id
        if (user?.id) {
          await clientSupabase
            .from('profiles')
            .update({ team_id: equipe.id })
            .eq('id', user.id);
        }

        // Mettre à jour l'équipe pour définir le capitaine
        await clientSupabase
          .from('équipes')
          .update({ capitaine_id: user?.id })
          .eq('id', equipe.id);
      }

      // Créer les joueurs
      const playersPromises = validPlayers.map(player => 
        créerJoueur({
          nom: player.nom,
          numéro: parseInt(player.numéro, 10),
          poste: player.poste,
          équipe_id: currentTeamId
        })
      );

      await Promise.all(playersPromises);

      setIsSubmitted(true);
    } catch (err: any) {
      const message = err?.message || '';
      if (message.includes('Failed to fetch')) {
        setError(
          "Impossible de joindre Supabase. Vérifiez les variables d'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY, puis actualisez la page."
        );
      } else {
        setError(message || "Une erreur est survenue lors de l'inscription.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-12">
        <div className="bg-emerald-50 text-emerald-800 p-8 rounded-2xl flex flex-col items-center text-center gap-4 border border-emerald-100 shadow-sm">
          <CheckCircle className="w-16 h-16 text-emerald-500" />
          <h2 className="text-2xl font-bold">Équipe inscrite avec succès !</h2>
          <p className="text-emerald-700 mt-2">Votre demande a été envoyée aux organisateurs (BDE) pour validation. Vous recevrez une notification une fois l'équipe approuvée.</p>
          <button 
            onClick={() => window.location.href = "/"}
            className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <UserPlus className="w-8 h-8 text-blue-500" />
          Inscrire une équipe
        </h1>
        <p className="text-slate-500 mt-2">En tant que capitaine, remplissez ce formulaire pour inscrire votre classe au tournoi.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Team Info */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
              <ShieldCheck className="w-5 h-5 text-slate-400" />
              Informations de l'équipe
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom de l'équipe</label>
                <input 
                  required 
                  type="text" 
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  disabled={!!user?.team_id}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500" 
                  placeholder="Ex: Les Lions de P1" 
                />
              </div>
              <div>
                <label htmlFor="team-class" className="block text-sm font-medium text-slate-700 mb-1">Classe</label>
                <select 
                  id="team-class"
                  required 
                  value={teamClass}
                  onChange={e => setTeamClass(e.target.value)}
                  disabled={!!user?.team_id}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="P1">P1</option>
                  <option value="P2">P2</option>
                  <option value="ING1">ING1</option>
                  <option value="ING2">ING2</option>
                  <option value="ING3">ING3</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="captain-name" className="block text-sm font-medium text-slate-700 mb-1">Capitaine</label>
                <input id="captain-name" disabled type="text" value={user?.full_name || user?.username || "Non défini"} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700" />
              </div>
            </div>
          </section>

          {/* Players Roster */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
              Effectif (5 Titulaires, min. 2 Remplaçants)
            </h2>
            
            <div className="space-y-4">
              {players.map((player, i) => (
                <div key={i} className="flex gap-4 items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="w-8 font-bold text-slate-400 text-right">#{i + 1}</div>
                  <input 
                    type="text" 
                    required={i < 7}
                    value={player.nom}
                    onChange={e => handlePlayerChange(i, 'nom', e.target.value)}
                    placeholder="Nom du joueur" 
                    className="flex-1 rounded-md border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                  <input 
                    type="number" 
                    required={i < 7}
                    value={player.numéro}
                    onChange={e => handlePlayerChange(i, 'numéro', e.target.value)}
                    placeholder="N°" 
                    className="w-20 rounded-md border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                  <select 
                    required={i < 7}
                    aria-label={`Poste du joueur ${i + 1}`}
                    value={player.poste}
                    onChange={e => handlePlayerChange(i, 'poste', e.target.value)}
                    className="w-32 rounded-md border border-slate-300 bg-slate-50 text-slate-900 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Poste</option>
                    <option value="Gardien">Gardien</option>
                    <option value="Défenseur">Défenseur</option>
                    <option value="Milieu">Milieu</option>
                    <option value="Attaquant">Attaquant</option>
                  </select>
                </div>
              ))}
              
              {players.length < 10 && (
                <button 
                  type="button" 
                  onClick={addPlayer}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-2"
                >
                  + Ajouter un remplaçant (Max 10 joueurs au total)
                </button>
              )}
            </div>
          </section>

          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
              Soumettre l'inscription
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
