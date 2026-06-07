import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Settings, Play, Database, CheckCircle2, Users, Calendar, Eye, Trash2, Copy, Pencil, Goal, Zap, MapPin, Clock, ChevronDown, ChevronUp, Save, X, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAdminÉquipes, useMatchs, useTousLesJoueurs, invalidateCacheÉquipes } from '../hooks/useSupabase';
import { créerÉquipe, désactiverÉquipe, supprimerÉquipe, mettreÀJourÉquipe, Équipe } from '../services/équipesService';
import { mettreÀJourMatch, supprimerMatch, créerMatch, créerMatchs, ajouterBut, ajouterPasse, obtenirButsMatch, obtenirPassesMatch, validerDateMatch, determinerStatutAuto } from '../services/matchsService';
import { getUserProfileFromSession, signUpWithUsername } from '../services/authService';
import { Formation, obtenirFormationÉquipe } from '../services/formationsService';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { SélecteurÉcusson } from '../components/sélecteurs/SélecteurÉcusson';
import { écussonsDisponibles } from '../donnees/écussons';
import { clientSupabase } from '../config/supabase';
import { formaterDate } from '../utils/date';

type AdminMatchData = {
  score_a: number | null;
  score_b: number | null;
  statut: 'à_venir' | 'en_cours' | 'terminé';
  durée?: string;
};

type FormationData = {
  id: string;
  teamId: string;
  numberOfPlayers: 5 | 7 | 9 | 11;
  players: Record<string, string>;
  savedAt?: string;
};

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

export const Admin = () => {
  const { user, loginAsAdmin } = useAuth();
  
  const { équipes, chargement: chargementÉquipes, refetch: refetchÉquipes } = useAdminÉquipes();
  const { matchs, chargement: chargementMatchs, refetch: refetchMatchs } = useMatchs();
  const { joueurs, chargement: chargementJoueurs } = useTousLesJoueurs();

  // Vérifier et maintenir la session Supabase active
  const [supabaseSessionActive, setSupabaseSessionActive] = useState<boolean | null>(null);

  useEffect(() => {
    const ADMIN_EMAIL = 'admin_tournoi@tournoi-foot.com';
    const ADMIN_PASSWORD = 'AdminPassword2026!';

    const checkAndRefreshSession = async () => {
      const { data } = await clientSupabase.auth.getSession();
      if (data.session?.user) {
        setSupabaseSessionActive(true);
        return;
      }
      // Session absente — ré-authentifier silencieusement en arrière-plan
      try {
        const { data: signInData, error } = await clientSupabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        });
        const ok = !error && !!signInData.session;
        setSupabaseSessionActive(ok);
      } catch {
        setSupabaseSessionActive(false);
      }
    };

    checkAndRefreshSession();
    const interval = setInterval(checkAndRefreshSession, 60000);
    return () => clearInterval(interval);
  }, []);

  /** Ré-authentifie silencieusement l'admin si la session a expiré */
  const ensureAdminSession = async (): Promise<boolean> => {
    const { data } = await clientSupabase.auth.getSession();
    if (data.session?.user) return true;
    // Tentative de ré-authentification automatique
    try {
      const { data: signInData, error } = await clientSupabase.auth.signInWithPassword({
        email: 'admin_tournoi@tournoi-foot.com',
        password: 'AdminPassword2026!'
      });
      if (error || !signInData.session) {
        alert('Session expirée. Veuillez vous reconnecter via le formulaire admin.');
        setIsAdminAuthenticated(false);
        return false;
      }
      setSupabaseSessionActive(true);
      return true;
    } catch {
      alert('Session expirée. Veuillez vous reconnecter.');
      setIsAdminAuthenticated(false);
      return false;
    }
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'teams', 'compositions', 'matches'].includes(tabParam)) {
      setActiveTab(tabParam);
      if (tabParam === 'teams' && window.location.hash === '#create-team-form') {
        setTimeout(() => {
          const el = document.getElementById('create-team-form');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const input = el.querySelector('input');
            if (input) input.focus();
          }
        }, 100);
      }
    }
  }, [searchParams]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<Record<string, AdminMatchData>>({});
  // Buteurs / passeurs
  const [buteurMatchId, setButeurMatchId] = useState<string | null>(null);
  type EntréeStats = { joueur_id: string; minute: string; équipe: 'A' | 'B' };
  const [buts, setButs] = useState<EntréeStats[]>([]);
  const [passes, setPasses] = useState<EntréeStats[]>([]);
  const [butsSauvegardés, setButsSauvegardés] = useState<any[]>([]);
  const [passesSauvegardées, setPassesSauvegardées] = useState<any[]>([]);
  const [savingStats, setSavingStats] = useState(false);
  const [selectedTeamForCompo, setSelectedTeamForCompo] = useState<string | null>(null);
  const [teamForm, setTeamForm] = useState({ nom: '', classe: '', écusson_id: '', description: '', code_acces: '', capitaine_nom: '' });
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamEditForm, setTeamEditForm] = useState({ nom: '', classe: '', description: '', code_acces: '', capitaine_nom: '' });
  const [manualMatchForm, setManualMatchForm] = useState<{
    équipe_a_id: string;
    équipe_b_id: string;
    date: string;
    heure: string;
    durée: string;
    lieu: string;
  }>({
    équipe_a_id: '',
    équipe_b_id: '',
    date: new Date().toISOString().slice(0, 10),
    heure: '09:00',
    durée: '25',
    lieu: 'Terrain Central ENSIT',
  });
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [manualMatchError, setManualMatchError] = useState<string | null>(null);

  useEffect(() => {
    setIsAdminAuthenticated(user?.role === 'admin');
  }, [user]);

  useEffect(() => {
    const chargerFormations = async () => {
      if (!équipes || équipes.length === 0) return;
      const résultats: Record<string, Formation | null> = {};
      await Promise.all(
        équipes.map(async (équipe) => {
          const formation = await obtenirFormationÉquipe(équipe.id);
          résultats[équipe.id] = formation;
        })
      );
      setFormations(résultats);
    };

    chargerFormations();
  }, [équipes]);

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return user?.role === 'admin';
  });
  const [adminCode, setAdminCode] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminCode !== 'ensit2026') {
      setLoginError('Code administrateur incorrect.');
      return;
    }
    setLoginError('');

    // 1. Essayer de se connecter avec le compte admin existant
    const ADMIN_EMAIL = 'admin_tournoi@tournoi-foot.com';
    const ADMIN_PASSWORD = 'AdminPassword2026!';

    try {
      let session: any = null;

      const { data: signInData, error: signInError } = await clientSupabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });

      if (signInError) {
        // Compte inexistant — le créer automatiquement
        if (signInError.message.toLowerCase().includes('invalid') || signInError.message.toLowerCase().includes('not found') || signInError.status === 400) {
          const { data: signUpData, error: signUpError } = await clientSupabase.auth.signUp({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            options: { data: { role: 'admin', full_name: 'Administrateur', username: 'admin_tournoi' } },
          });
          if (signUpError) throw signUpError;
          session = signUpData.session;
          // Insérer le profil admin
          if (signUpData.user?.id) {
            await clientSupabase.from('profiles').upsert({
              id: signUpData.user.id,
              username: 'admin_tournoi',
              full_name: 'Administrateur',
              role: 'admin',
            }, { onConflict: 'id' });
          }
        } else {
          throw signInError;
        }
      } else {
        session = signInData.session;
        // S'assurer que le profil existe
        if (signInData.user?.id) {
          await clientSupabase.from('profiles').upsert({
            id: signInData.user.id,
            username: 'admin_tournoi',
            full_name: 'Administrateur',
            role: 'admin',
          }, { onConflict: 'id' });
        }
      }

      const profile = session ? await getUserProfileFromSession(session) : null;
      const adminProfile = profile || {
        id: signInData?.user?.id || 'admin_local',
        username: 'admin_tournoi',
        email: ADMIN_EMAIL,
        full_name: 'Administrateur',
        role: 'admin' as const,
      };

      localStorage.setItem('admin_authenticated', 'true');
      loginAsAdmin(adminProfile);
      setIsAdminAuthenticated(true);
      setSupabaseSessionActive(!!session);
    } catch (err: any) {
      console.error('Admin signin error:', err);
      setLoginError(err.message || 'Erreur lors de la connexion à la base de données.');
    }
  };

  const handleAdminLogout = async () => {
    localStorage.removeItem('admin_authenticated');
    try {
      await clientSupabase.auth.signOut();
    } catch (err) {
      console.warn('Erreur lors de la déconnexion admin Supabase :', err);
    }
    setIsAdminAuthenticated(false);
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center p-4 relative overflow-hidden -m-8">
        <div className="w-full max-w-md relative z-10 animate-slide-up">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center shadow-2xl mb-6 hero-gradient-purple">
              <Settings className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold mb-1 text-primary">Espace Admin</h1>
            <p className="text-sm text-muted">Accès restreint aux organisateurs</p>
          </div>

          <div className="login-card p-8 glass card-3d">
            {loginError && (
              <div className="mb-5 rounded-xl px-4 py-3 text-sm font-medium bg-red-50 border border-red-200 text-red-600">
                ❌ {loginError}
              </div>
            )}
            <form onSubmit={handleAdminLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted">Code d'accès administrateur</label>
                <div className="relative">
                  <Database className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-muted" />
                  <input
                    value={adminCode}
                    onChange={e => setAdminCode(e.target.value)}
                    type="password"
                    required
                    className="input-field pl-10"
                    placeholder="Entrez le code secret"
                    autoFocus
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary mt-2" disabled={!adminCode}>
                🔓 Accéder au tableau de bord
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const obtenirURLÉcusson = (écussonId: string) => écussonsDisponibles.find(e => e.id === écussonId)?.url || '';
  
  const CLASSES_ENSIT = ['P1', 'P2', 'ING1', 'ING2', 'ING3'];

  const [copiedCodeTeamId, setCopiedCodeTeamId] = useState<string | null>(null);
  const [formations, setFormations] = useState<Record<string, Formation | null>>({});

  const handleResetTournament = async () => {
    if (!confirm("⚠️ Attention : cela supprimera TOUS les matchs, buts et passes du tournoi.\n\nCette action est irréversible. Continuer ?")) return;
    if (!(await ensureAdminSession())) return;
    setIsDeleting(true);
    try {
      // Récupérer tous les IDs des matchs d'abord, puis les supprimer un par un
      // (évite le DELETE sans filtre qui est bloqué par RLS Supabase)
      const { data: allMatchs, error: fetchErr } = await clientSupabase
        .from('matchs')
        .select('id');
      if (fetchErr) throw fetchErr;

      if (!allMatchs || allMatchs.length === 0) {
        alert('Aucun match à supprimer.');
        return;
      }

      const matchIds = allMatchs.map((m: any) => m.id);

      // Supprimer buts et passes par batch d'IDs
      const { error: errButs } = await clientSupabase
        .from('buts_matchs')
        .delete()
        .in('match_id', matchIds);
      if (errButs) console.warn('Erreur suppression buts:', errButs);

      const { error: errPasses } = await clientSupabase
        .from('passes_matchs')
        .delete()
        .in('match_id', matchIds);
      if (errPasses) console.warn('Erreur suppression passes:', errPasses);

      // Supprimer les matchs
      const { error: errMatchs } = await clientSupabase
        .from('matchs')
        .delete()
        .in('id', matchIds);
      if (errMatchs) throw errMatchs;

      await refetchMatchs();
      alert(`✅ ${matchIds.length} match(s) supprimé(s) avec succès.`);
    } catch (err: any) {
      console.error('Erreur lors de la réinitialisation :', err);
      alert('Erreur lors de la réinitialisation : ' + (err?.message || JSON.stringify(err)));
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleTeamFormChange = (field: string, value: string) => setTeamForm(prev => ({
    ...prev,
    [field]: field === 'nom' || field === 'capitaine_nom' ? value.toUpperCase() : value
  }));
  
  const handleAddTeam = async () => {
    const normalizedNom = teamForm.nom.trim().toUpperCase();
    const captainName = teamForm.capitaine_nom.trim().toUpperCase();

    if (!normalizedNom || !teamForm.classe.trim()) {
      alert("Le nom et la classe sont obligatoires.");
      return;
    }

    if (équipes.some(team => team.nom.trim().toUpperCase() === normalizedNom)) {
      alert("Une équipe avec ce nom existe déjà. Choisissez un autre nom.");
      return;
    }
    
    if (!(await ensureAdminSession())) return;
    // Auto-generate access code: e.g. "ING1-LIONS-4829"
    const cleanNom = normalizedNom.replace(/\s+/g, '').replace(/[^A-Z0-9]/g, '').substring(0, 6);
    const generatedCode = `${teamForm.classe.toUpperCase()}-${cleanNom}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const equipe = await créerÉquipe({
        nom: normalizedNom,
        classe: teamForm.classe.trim(),
        écusson_id: teamForm.écusson_id || 'real-madrid',
        description: teamForm.description || `Équipe ${normalizedNom} de la classe ${teamForm.classe.trim()}`,
        code_acces: generatedCode
      });
      
      if (!equipe) {
        alert("Erreur inattendue lors de la création de l'équipe.");
        return;
      }

      if (captainName) {
        try {
          const password = `${generatedCode}_ENSITCup_Secure`;
          const captainProfile = await signUpWithUsername(captainName, password, 'captain', teamForm.classe.trim(), equipe.id);
          if (captainProfile?.id) {
            await mettreÀJourÉquipe(equipe.id, { capitaine_id: captainProfile.id });
          }
        } catch (captainErr: any) {
          console.warn('Erreur lors de la création du compte capitaine :', captainErr);
          alert(`L'équipe a été créée, mais le compte du capitaine n'a pas pu être généré : ${captainErr?.message || captainErr}`);
        }
      }
      
      setTeamForm({ nom: '', classe: '', écusson_id: '', description: '', code_acces: '', capitaine_nom: '' });
      invalidateCacheÉquipes();
      await refetchÉquipes();
      alert(`Équipe ${equipe.nom} créée avec succès !`);
    } catch (err: any) {
      console.error('Erreur création équipe :', err);
      alert("Erreur lors de la création de l'équipe : " + (err?.message || JSON.stringify(err) || err));
    }
  };

  const handleStartEditTeam = (team: Équipe) => {
    setEditingTeamId(team.id);
    setTeamEditForm({
      nom: team.nom || '',
      classe: team.classe || '',
      description: team.description || '',
      code_acces: team.code_acces || '',
      capitaine_nom: ''
    });
  };

  const handleTeamEditFormChange = (field: string, value: string) => setTeamEditForm(prev => ({
    ...prev,
    [field]: field === 'nom' || field === 'capitaine_nom' ? value.toUpperCase() : value
  }));

  const handleCancelEditTeam = () => {
    setEditingTeamId(null);
  };

  const handleSaveTeamEdits = async (team: Équipe) => {
    const updatedFields: Partial<Équipe> = {};
    const normalizedNom = teamEditForm.nom.trim().toUpperCase();
    const normalizedClasse = teamEditForm.classe.trim();
    const normalizedDescription = teamEditForm.description.trim();
    const normalizedCodeAcces = teamEditForm.code_acces.trim();
    const captainName = teamEditForm.capitaine_nom.trim().toUpperCase();

    if (!normalizedNom || !normalizedClasse) {
      alert('Le nom et la classe sont obligatoires.');
      return;
    }

    if (normalizedNom !== team.nom) {
      updatedFields.nom = normalizedNom;
    }
    if (normalizedClasse !== team.classe) {
      updatedFields.classe = normalizedClasse;
    }
    if (normalizedDescription !== team.description) {
      updatedFields.description = normalizedDescription;
    }
    if (normalizedCodeAcces && normalizedCodeAcces !== team.code_acces) {
      updatedFields.code_acces = normalizedCodeAcces;
    }

    if (!(await ensureAdminSession())) return;
    try {
      if (Object.keys(updatedFields).length > 0) {
        await mettreÀJourÉquipe(team.id, updatedFields);
      }

      if (!team.capitaine_id && captainName) {
        const accessCodeToUse = normalizedCodeAcces || team.code_acces || `TEAM-${Math.floor(1000 + Math.random() * 9000)}`;
        const password = `${accessCodeToUse}_ENSITCup_Secure`;
        const captainProfile = await signUpWithUsername(captainName, password, 'captain', normalizedClasse || team.classe, team.id);
        if (captainProfile?.id) {
          await mettreÀJourÉquipe(team.id, { capitaine_id: captainProfile.id });
        }
      }

      setEditingTeamId(null);
      invalidateCacheÉquipes();
      await refetchÉquipes();
      alert('Les informations de l’équipe ont été mises à jour.');
    } catch (err: any) {
      console.error('Erreur mise à jour équipe :', err);
      alert('Impossible de mettre à jour l’équipe : ' + (err?.message || err));
    }
  };

  const handleDisqualifyTeam = async (teamId: string) => {
    if (!(await ensureAdminSession())) return;
    try {
      const result = await désactiverÉquipe(teamId);
      if (!result) {
        alert('La désactivation de l’équipe a échoué. Vérifiez la console pour plus de détails.');
        return;
      }
      invalidateCacheÉquipes();
      await refetchÉquipes();
    } catch (err) {
      console.error('Erreur désactivation équipe :', err);
      alert('Impossible de désactiver l’équipe. Vérifiez la console pour plus de détails.');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!(await ensureAdminSession())) return;
    if (confirm('Voulez-vous vraiment supprimer cette équipe ?')) {
      try {
        const deleted = await supprimerÉquipe(teamId);
        if (!deleted) {
          alert('La suppression de l’équipe a échoué. Vérifiez la console pour plus de détails.');
          return;
        }
        invalidateCacheÉquipes();
        await refetchÉquipes();
      } catch (err) {
        console.error('Erreur suppression équipe :', err);
        alert('Impossible de supprimer l’équipe. Vérifiez la console pour plus de détails.');
      }
    }
  };

  const handleEditMatch = (matchId: string) => {
    const next = editingMatchId === matchId ? null : matchId;
    setEditingMatchId(next);
    if (next && !matchData[matchId]) {
      const match = matchs.find(m => m.id === matchId);
      if (match) {
        setMatchData(prev => ({
          ...prev,
          [matchId]: { score_a: match.score_a, score_b: match.score_b, statut: match.statut },
        }));
      }
    }
    // Fermer le panel buteurs si on change de match
    if (buteurMatchId && buteurMatchId !== matchId) setButeurMatchId(null);
  };

  const handleMatchScoreChange = (matchId: string, team: 'A' | 'B', value: string) => {
    const score = value === '' ? null : parseInt(value, 10);
    setMatchData(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], [team === 'A' ? 'score_a' : 'score_b']: score },
    }));
  };

  const handleMatchStatusChange = (matchId: string, value: 'à_venir' | 'en_cours' | 'terminé') => {
    setMatchData(prev => ({ ...prev, [matchId]: { ...prev[matchId], statut: value } }));
  };

  const handleSaveMatch = async (matchId: string) => {
    const cur = matchData[matchId];
    if (!cur) return;
    if (!(await ensureAdminSession())) return;
    try {
      await mettreÀJourMatch(matchId, {
        score_a: cur.score_a,
        score_b: cur.score_b,
        statut: cur.statut,
      });
      setEditingMatchId(null);
      await refetchMatchs();
    } catch (err: any) {
      alert('Erreur lors de la sauvegarde : ' + (err?.message || err));
    }
  };

  // Supprimer un match individuel
  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Supprimer ce match et toutes ses statistiques ?')) return;
    if (!(await ensureAdminSession())) return;
    try {
      await supprimerMatch(matchId);
      if (editingMatchId === matchId) setEditingMatchId(null);
      if (buteurMatchId === matchId) setButeurMatchId(null);
      await refetchMatchs();
    } catch (err: any) {
      alert('Erreur lors de la suppression : ' + (err?.message || err));
    }
  };

  // Ouvrir le panel buteurs/passeurs pour un match terminé
  const handleOpenButeurs = async (matchId: string) => {
    if (buteurMatchId === matchId) { setButeurMatchId(null); return; }
    setButeurMatchId(matchId);
    const [existingButs, existingPasses] = await Promise.all([
      obtenirButsMatch(matchId),
      obtenirPassesMatch(matchId),
    ]);
    setButsSauvegardés(existingButs);
    setPassesSauvegardées(existingPasses);
    setButs(existingButs.map((b: any) => ({ joueur_id: b.joueur_id, minute: String(b.minute), équipe: b.équipe })));
    setPasses(existingPasses.map((p: any) => ({ joueur_id: p.joueur_id, minute: String(p.minute), équipe: p.équipe })));
  };

  const addBut = (équipe: 'A' | 'B') => setButs(prev => [...prev, { joueur_id: '', minute: '', équipe }]);
  const removeBut = (idx: number) => setButs(prev => prev.filter((_, i) => i !== idx));
  const updateBut = (idx: number, field: string, value: string) =>
    setButs(prev => prev.map((b, i) => i === idx ? { ...b, [field]: value } : b));

  const addPasse = (équipe: 'A' | 'B') => setPasses(prev => [...prev, { joueur_id: '', minute: '', équipe }]);
  const removePasse = (idx: number) => setPasses(prev => prev.filter((_, i) => i !== idx));
  const updatePasse = (idx: number, field: string, value: string) =>
    setPasses(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));

  const handleSaveStats = async (matchId: string) => {
    if (!(await ensureAdminSession())) return;
    setSavingStats(true);
    try {
      // Supprimer les stats existantes et réinsérer
      await clientSupabase.from('buts_matchs').delete().eq('match_id', matchId);
      await clientSupabase.from('passes_matchs').delete().eq('match_id', matchId);

      const butsValides = buts.filter(b => b.joueur_id && b.minute);
      const passesValides = passes.filter(p => p.joueur_id && p.minute);

      for (const b of butsValides) {
        await ajouterBut(matchId, { match_id: matchId, joueur_id: b.joueur_id, minute: Number(b.minute), équipe: b.équipe });
      }
      for (const p of passesValides) {
        await ajouterPasse(matchId, { match_id: matchId, joueur_id: p.joueur_id, minute: Number(p.minute), équipe: p.équipe });
      }

      // Mettre à jour les stats des joueurs (buts / passes_décisives)
      const butParJoueur: Record<string, number> = {};
      const passeParJoueur: Record<string, number> = {};
      butsValides.forEach(b => { butParJoueur[b.joueur_id] = (butParJoueur[b.joueur_id] || 0) + 1; });
      passesValides.forEach(p => { passeParJoueur[p.joueur_id] = (passeParJoueur[p.joueur_id] || 0) + 1; });

      // Recalculer les totaux depuis toutes les stats de ce joueur
      const allJoueurIds = [...new Set([...Object.keys(butParJoueur), ...Object.keys(passeParJoueur)])];
      for (const joueurId of allJoueurIds) {
        const updates: Record<string, number> = {};
        if (butParJoueur[joueurId] !== undefined) updates.buts = butParJoueur[joueurId];
        if (passeParJoueur[joueurId] !== undefined) updates.passes_décisives = passeParJoueur[joueurId];
        if (Object.keys(updates).length > 0) {
          await clientSupabase.from('joueurs').update(updates).eq('id', joueurId);
        }
      }

      alert('Statistiques enregistrées avec succès !');
      setButeurMatchId(null);
    } catch (err: any) {
      alert('Erreur lors de la sauvegarde des stats : ' + (err?.message || err));
    } finally {
      setSavingStats(false);
    }
  };
  const upcomingMatches = matchs.filter(m => m.statut === 'à_venir');
  const finishedMatches = matchs.filter(m => m.statut === 'terminé');

  const progressWidthClasses = [
    'w-[0%]', 'w-[10%]', 'w-[20%]', 'w-[30%]', 'w-[40%]', 'w-[50%]', 'w-[60%]', 'w-[70%]', 'w-[80%]', 'w-[90%]', 'w-[100%]'
  ];
  const inscribedProgressClass = progressWidthClasses[Math.min(Math.max(Math.round((équipes.length / 10) * 10), 0), 10)];

  const renderTeamActionButtons = (team: Équipe) => (
    <div className="flex flex-wrap gap-2 mt-2">
      <button onClick={() => handleStartEditTeam(team)} className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg font-medium text-sm transition-colors">Modifier</button>
      <button onClick={() => handleDisqualifyTeam(team.id)} className="px-3 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 rounded-lg font-medium text-sm transition-colors">Désactiver</button>
      <button onClick={() => handleDeleteTeam(team.id)} className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg font-medium text-sm transition-colors flex items-center gap-1"><Trash2 className="w-4 h-4" /> Supprimer</button>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-slide-up">
      {/* Bannière d'alerte session Supabase */}
      {supabaseSessionActive === false && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <span>⚠️</span>
          <span>Session Supabase inactive — les modifications ne seront pas sauvegardées. Déconnectez-vous et reconnectez-vous.</span>
          <button onClick={() => { setIsAdminAuthenticated(false); }} className="ml-auto text-xs underline">Se reconnecter</button>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-1 h-8 rounded-full stripe-purple" />
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-3 text-primary">
            <Settings className="w-6 h-6 text-purple-400" /> Tableau de Bord Administrateur
          </h1>
          <p className="text-sm text-muted">
            Gestion centralisée du tournoi ENSIT Cup.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6 bg-panel-lighter border-panel rounded-radius-xl">
          <TabsTrigger value="overview" className="rounded-radius-lg">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="teams" className="rounded-radius-lg">Équipes</TabsTrigger>
          <TabsTrigger value="compositions" className="rounded-radius-lg">Compositions</TabsTrigger>
          <TabsTrigger value="matches" className="rounded-radius-lg">Matchs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats rapides */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Équipes', value: `${équipes.length}/10`, sub: `${Math.max(10-équipes.length,0)} places libres`, bg:'stat-blue', text:'text-blue-400', Icon: Users },
              { label: 'À venir', value: upcomingMatches.length, sub: 'matchs planifiés', bg:'stat-purple', text:'text-purple-400', Icon: Calendar },
              { label: 'Terminés', value: finishedMatches.length, sub: 'matchs joués', bg:'stat-green', text:'text-accent-strong', Icon: CheckCircle2 },
              { label: 'Joueurs', value: joueurs.length, sub: 'inscrits', bg:'stat-gold', text:'text-amber-400', Icon: Users },
            ].map(s => (
              <div key={s.label} className={`glass card-3d p-5 rounded-2xl border-panel ${s.bg}`}>
                <s.Icon className={`w-5 h-5 mb-3 ${s.text}`} />
                <div className={`text-3xl font-black mb-1 ${s.text}`}>{s.value}</div>
                <div className="text-xs font-semibold text-primary">{s.label}</div>
                <div className="text-xs text-muted mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Inscriptions */}
            <div className="glass card-3d p-6 rounded-2xl border-panel space-y-5">
              <h2 className="text-base font-display font-bold flex items-center gap-2 text-primary">
                <Database className="w-5 h-5 text-blue-400" /> Statut des inscriptions
              </h2>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted">Équipes inscrites</span>
                  <span className="font-bold text-primary">{équipes.length} / 10</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-accent-strong transition-all" style={{ width: ${'${Math.min(équipes.length/10*100,100)}%'} }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <div className="text-2xl font-black text-emerald-400">{équipes.length}</div>
                  <div className="text-xs text-muted mt-1">Confirmées</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-700 text-center">
                  <div className="text-2xl font-black text-muted">{Math.max(10-équipes.length,0)}</div>
                  <div className="text-xs text-muted mt-1">Places libres</div>
                </div>
              </div>
              <button onClick={() => setActiveTab('teams')} className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all">
                <Users className="w-4 h-4" /> Gérer les équipes
              </button>
            </div>
            <div className="glass card-3d p-6 rounded-2xl border-panel space-y-4">
              <h2 className="text-base font-display font-bold flex items-center gap-2 text-primary">
                <Zap className="w-5 h-5 text-accent-strong" /> Actions rapides
              </h2>
              <div className="space-y-3">
                <Link to="/admin/scheduler" className="flex items-center gap-3 p-3 rounded-xl bg-panel-soft hover:bg-white/5 border border-panel hover:border-accent-strong/30 transition-all group">
                  <div className="w-9 h-9 rounded-xl bg-accent-strong/10 border border-accent-strong/20 flex items-center justify-center flex-shrink-0"><Calendar className="w-4 h-4 text-accent-strong" /></div>
                  <div className="flex-1 min-w-0"><p className="font-semibold text-primary text-sm">Planificateur de matchs</p><p className="text-xs text-muted">Drag and drop rapide</p></div>
                  <ChevronDown className="w-4 h-4 text-muted -rotate-90" />
                </Link>
                <button onClick={() => setActiveTab('matches')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-panel-soft hover:bg-white/5 border border-panel hover:border-purple-500/30 transition-all text-left">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0"><Play className="w-4 h-4 text-purple-400" /></div>
                  <div className="flex-1 min-w-0"><p className="font-semibold text-primary text-sm">Gérer les matchs</p><p className="text-xs text-muted">{matchs.length} match{matchs.length!==1?'s':''} au total</p></div>
                  <ChevronDown className="w-4 h-4 text-muted -rotate-90" />
                </button>
                <button onClick={() => setActiveTab('compositions')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-panel-soft hover:bg-white/5 border border-panel hover:border-blue-500/30 transition-all text-left">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0"><Users className="w-4 h-4 text-blue-400" /></div>
                  <div className="flex-1 min-w-0"><p className="font-semibold text-primary text-sm">Voir les compositions</p><p className="text-xs text-muted">{joueurs.length} joueurs</p></div>
                  <ChevronDown className="w-4 h-4 text-muted -rotate-90" />
                </button>
              </div>
            </div>
          </div>
          <div className="glass card-3d p-6 rounded-2xl border-panel">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-display font-bold flex items-center gap-2 text-primary"><Calendar className="w-5 h-5 text-accent-strong" /> Résumé du calendrier</h2>
              <button onClick={() => setActiveTab('matches')} className="text-xs font-semibold text-accent-strong hover:underline">Voir tout</button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center"><div className="text-3xl font-black text-blue-400">{upcomingMatches.length}</div><div className="text-xs font-semibold text-muted mt-1 uppercase tracking-wider">À venir</div></div>
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center"><div className="text-3xl font-black text-emerald-400">{finishedMatches.length}</div><div className="text-xs font-semibold text-muted mt-1 uppercase tracking-wider">Terminés</div></div>
              <div className="p-5 rounded-2xl bg-panel-soft text-center"><div className="text-3xl font-black text-primary">{matchs.length}</div><div className="text-xs font-semibold text-muted mt-1 uppercase tracking-wider">Total</div></div>
            </div>
          </div>
          <div className="glass rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            <h2 className="text-base font-display font-bold flex items-center gap-2 text-red-400 mb-4"><Trash2 className="w-5 h-5" /> Zone de danger</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-primary">Réinitialiser tous les matchs</p>
                <p className="text-xs text-muted mt-1">Supprime <strong className="text-red-400">{matchs.length} match{matchs.length!==1?'s':''}</strong>, buts et passes. Les équipes ne sont pas affectées.</p>
              </div>
              <button onClick={handleResetTournament} disabled={isDeleting || matchs.length===0} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0">
                {isDeleting ? <><div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" /> Suppression...</> : <><Trash2 className="w-4 h-4" /> Réinitialiser le tournoi</>}
              </button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="teams">
          <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
            <div className="glass card-3d p-6">
              <h2 className="text-lg font-display font-bold mb-6 flex items-center gap-2 text-primary">
                <Users className="w-5 h-5 text-sky-500" /> Gestion des équipes ({équipes.length})
              </h2>
              <div className="space-y-4">
                {chargementÉquipes ? (
                  <p className="text-muted">Chargement...</p>
                ) : équipes.map(team => {
                  const teamPlayers = joueurs.filter(p => p.équipe_id === team.id);
                  return (
                    <div key={team.id} className="flex flex-col p-4 rounded-xl bg-panel-soft">
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <div className="flex items-center gap-4">
                          <ImageWithFallback src={team.logo} alt={team.nom} className="w-14 h-14 rounded-2xl object-contain" />
                          <div>
                            <div className="font-semibold text-primary">{team.nom}</div>
                            <div className="text-xs text-muted">Classe {team.classe} • {teamPlayers.length} joueurs</div>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          team.statut === 'disqualifié' 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                            : 'bg-green-500/10 text-green-400 border border-green-500/20'
                        }`}>
                          {team.statut === 'disqualifié' ? 'Désactivée' : 'Active'}
                        </span>
                      </div>
                      <div className="text-sm px-3 py-2 rounded-lg mb-3 flex flex-col gap-3 bg-panel-lighter">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted">Code d'accès Capitaine :</span>
                          <code className="font-bold text-xs text-accent-strong">{team.code_acces || 'Non défini'}</code>
                        </div>
                        {team.code_acces && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(team.code_acces!);
                                setCopiedCodeTeamId(team.id);
                                setTimeout(() => setCopiedCodeTeamId(null), 2000);
                              } catch (err) {
                                console.error('Erreur copie code :', err);
                                alert('Impossible de copier le code. Vérifie que ton navigateur autorise le presse-papier.');
                              }
                            }}
                            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900/70 border border-slate-700 text-slate-100 hover:bg-slate-800 transition"
                          >
                            <Copy className="w-4 h-4" />
                            {copiedCodeTeamId === team.id ? 'Copié !' : 'Copier le code'}
                          </button>
                        )}
                      </div>
                      {renderTeamActionButtons(team)}
                      {editingTeamId === team.id && (
                        <div className="mt-4 p-4 rounded-2xl border border-slate-700 bg-panel-dark">
                          <h3 className="text-sm font-semibold text-primary mb-4">Modifier l'équipe</h3>
                          <div className="grid gap-4">
                            <div>
                              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted">Nom de l'équipe</label>
                              <input type="text" value={teamEditForm.nom} onChange={e => handleTeamEditFormChange('nom', e.target.value)} className="input-field pl-3" placeholder="EX: LIONS" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted">Classe</label>
                              <input type="text" value={teamEditForm.classe} onChange={e => handleTeamEditFormChange('classe', e.target.value)} className="input-field pl-3" placeholder="ING2" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted">Description</label>
                              <textarea value={teamEditForm.description} onChange={e => handleTeamEditFormChange('description', e.target.value)} className="input-field pl-3 min-h-[100px]" placeholder="Description de l'équipe..." />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted">Code d'accès</label>
                              <input type="text" value={teamEditForm.code_acces} onChange={e => handleTeamEditFormChange('code_acces', e.target.value)} className="input-field pl-3" placeholder="Ex: ING2-LIONS-4829" />
                            </div>
                            {!team.capitaine_id ? (
                              <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted">Nom du capitaine</label>
                                <input type="text" value={teamEditForm.capitaine_nom} onChange={e => handleTeamEditFormChange('capitaine_nom', e.target.value)} className="input-field pl-3" placeholder="Nom du capitaine" />
                                <p className="text-[11px] text-muted mt-1">Saisissez le nom du capitaine si l'équipe a été créée sans capitaine.</p>
                              </div>
                            ) : (
                              <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-sm text-slate-300">
                                Capitaine déjà attribué. Vous pouvez modifier les informations de l'équipe ici.
                              </div>
                            )}
                            <div className="flex flex-wrap gap-3">
                              <button onClick={() => handleSaveTeamEdits(team)} className="btn-primary py-2 px-4">Enregistrer</button>
                              <button onClick={handleCancelEditTeam} className="btn-secondary py-2 px-4">Annuler</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div id="create-team-form" className="glass card-3d p-6 h-fit">
              <h2 className="text-lg font-display font-bold mb-6 text-primary">Créer une équipe</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted">Nom de l'équipe</label>
                  <input type="text" value={teamForm.nom} onChange={e => handleTeamFormChange('nom', e.target.value)} className="input-field pl-3" placeholder="EX: LIONS" />
                </div>
                <div>
                  <label htmlFor="classe" className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted">Classe</label>
                  <select id="classe" value={teamForm.classe} onChange={e => handleTeamFormChange('classe', e.target.value)} className="select-field">
                    <option value="">— Sélectionner une classe —</option>
                    {CLASSES_ENSIT.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted">Nom du capitaine</label>
                  <input type="text" value={teamForm.capitaine_nom} onChange={e => handleTeamFormChange('capitaine_nom', e.target.value)} className="input-field pl-3" placeholder="Nom du capitaine" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted">Code d'accès secret </label>
                  <div className="input-field font-mono flex items-center bg-slate-800/40 text-slate-400 select-none cursor-not-allowed text-xs pl-3 h-10 border-dashed">
                    {teamForm.nom && teamForm.classe 
                      ? `${teamForm.classe}-${teamForm.nom.trim().replace(/\s+/g, '').replace(/[^A-Z0-9]/g, '').substring(0, 5)}-XXXX`
                      : "Saisissez le nom et la classe..."
                    }
                  </div>
                  <p className="text-[10px] mt-1 text-muted opacity-70">Ce code sera généré et affiché dans la liste des équipes.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted">Sélectionner un écusson</label>
                  <SélecteurÉcusson écussonSélectionné={teamForm.écusson_id} onÉcussonChange={(id: string) => { handleTeamFormChange('écusson_id', id); }} />
                </div>

                <button onClick={handleAddTeam} className="btn-primary w-full mt-2">Créer et générer accès</button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="compositions">
          <div className="space-y-4">
            {équipes.map(team => {
              const teamPlayers = joueurs.filter(p => p.équipe_id === team.id);
              const savedFormation = formations[team.id];
              const formationConfig = savedFormation?.configuration as FormationData | undefined;
              const formationPositions = formationConfig ? FORMATION_PRESETS[formationConfig.numberOfPlayers] : null;
              const assignedCount = formationConfig ? Object.keys(formationConfig.players).length : 0;
              const savedAt = formationConfig?.savedAt || savedFormation?.date_sauvegarde;

              return (
                <div key={team.id} className="glass overflow-hidden">
                  <button type="button" className="w-full p-4 hover:bg-white/5 cursor-pointer transition-colors flex items-center justify-between" onClick={() => setSelectedTeamForCompo(selectedTeamForCompo === team.id ? null : team.id)}>
                    <div className="flex items-center gap-3">
                      <ImageWithFallback src={team.logo} alt={team.nom} className="w-10 h-10 rounded-full object-cover" />
                      <div className="text-left">
                        <div className="font-semibold text-primary">{team.nom}</div>
                        <div className="text-xs text-muted">
                          {teamPlayers.length} joueurs • {formationConfig ? `${formationConfig.numberOfPlayers}v${formationConfig.numberOfPlayers}` : 'Pas de composition'}
                        </div>
                      </div>
                    </div>
                    <Eye className="w-5 h-5 text-muted" />
                  </button>
                  {selectedTeamForCompo === team.id && (
                    <div className="p-6 border-t animate-slide-up border-panel bg-panel-dark">
                      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
                        <div className="space-y-4">
                          <div className="rounded-3xl border border-slate-700 bg-slate-950 p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="font-semibold text-primary">Mini-visualisation</h3>
                                <p className="text-xs text-muted">
                                  {formationConfig ? `Formation ${formationConfig.numberOfPlayers}v${formationConfig.numberOfPlayers}` : 'Aucune composition enregistrée'}
                                </p>
                              </div>
                              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{formationPositions ? `${assignedCount}/${Object.keys(formationPositions).length}` : '0/0'}</span>
                            </div>

                            <div className="relative w-full aspect-[3/4] rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 overflow-hidden">
                              <div className="absolute inset-x-6 top-6 h-px bg-slate-700" />
                              <div className="absolute inset-x-6 bottom-6 h-px bg-slate-700" />
                              <div className="absolute inset-y-6 left-6 w-px bg-slate-700" />
                              <div className="absolute inset-y-6 right-6 w-px bg-slate-700" />
                              {formationPositions ? Object.entries(formationPositions).map(([position, details]) => {
                                const playerId = formationConfig?.players?.[position];
                                const player = playerId ? teamPlayers.find(p => p.id === playerId) : null;
                                return (
                                  <div key={position} className={`absolute ${details.topClass} ${details.leftClass} -translate-x-1/2 -translate-y-1/2`}>
                                    <div className="w-12 h-12 rounded-full border border-white/10 bg-slate-800/90 shadow-lg flex flex-col items-center justify-center text-[10px] leading-tight text-white">
                                      <span className="font-bold">{details.label}</span>
                                      <span className="text-[10px] text-slate-300 mt-0.5">{player ? `#${player.numéro}` : 'vide'}</span>
                                    </div>
                                  </div>
                                );
                              }) : (
                                <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400 px-4 text-center">
                                  Aucune composition tactique enregistrée pour cette équipe.
                                </div>
                              )}
                            </div>

                            {formationConfig && (
                              <div className="mt-4 text-sm space-y-2">
                                <p className="text-slate-300">Enregistrée le {savedAt ? new Date(savedAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</p>
                                <p className="text-slate-400">Joueurs assignés : <strong className="text-white">{assignedCount}</strong> / {Object.keys(formationPositions || {}).length}</p>
                              </div>
                            )}
                          </div>

                          <div className="rounded-3xl border border-slate-700 bg-slate-900 p-4">
                            <h4 className="font-semibold mb-3 text-primary">Détails de composition</h4>
                            {formationConfig ? (
                              <ul className="space-y-2 text-sm text-slate-300">
                                {Object.entries(formationPositions || {}).map(([position, details]) => {
                                  const playerId = formationConfig.players?.[position];
                                  const player = playerId ? teamPlayers.find(p => p.id === playerId) : null;
                                  return (
                                    <li key={position} className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2 bg-slate-950/70">
                                      <span>{details.label}</span>
                                      <span className="text-slate-200">{player ? `${player.nom} (#${player.numéro})` : 'Libre'}</span>
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : (
                              <p className="text-sm text-slate-500">Cette équipe n’a pas encore de formation tactique enregistrée.</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-4 text-primary">Joueurs</h3>
                          <div className="space-y-3">
                            {teamPlayers.length === 0 ? (
                              <p className="text-sm text-muted">Aucun joueur inscrit.</p>
                            ) : teamPlayers.map(player => (
                              <div key={player.id} className="rounded-xl p-3 border bg-panel-soft">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="font-medium text-primary">{player.nom}</p>
                                    <p className="text-xs text-muted">{player.poste} • #{player.numéro}</p>
                                  </div>
                                  <span className="text-xs font-semibold px-2 py-1 rounded bg-white/5 text-primary">
                                    {player.buts ?? 0} buts • {player.passes_décisives ?? 0} passes
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="matches">
          <div className="space-y-5">

            {/* Bannière planificateur */}
            <div className="rounded-2xl overflow-hidden border border-accent-strong/20 bg-gradient-to-r from-accent-strong/10 via-emerald-500/5 to-transparent">
              <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-accent-strong/20 border border-accent-strong/30 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-accent-strong" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-primary">Planificateur drag & drop</p>
                    <p className="text-xs text-muted mt-0.5">Créez plusieurs matchs en un clin d'œil avec le planificateur visuel.</p>
                  </div>
                </div>
                <Link
                  to="/admin/scheduler"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-accent-strong to-emerald-400 text-black hover:shadow-lg hover:shadow-accent-strong/20 hover:scale-[1.02] transition-all whitespace-nowrap flex-shrink-0"
                >
                  <Zap className="w-4 h-4" /> Ouvrir le planificateur
                </Link>
              </div>
            </div>

            {/* En-tête section matchs */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-bold flex items-center gap-2 text-primary">
                <Goal className="w-5 h-5 text-accent-strong" />
                Tous les Matchs
                <span className="ml-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent-strong/10 border border-accent-strong/20 text-accent-strong">
                  {matchs.length}
                </span>
              </h2>
              <div className="flex gap-3 text-xs text-muted">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  {matchs.filter(m => m.statut === 'à_venir').length} à venir
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  {matchs.filter(m => m.statut === 'en_cours').length} en cours
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {matchs.filter(m => m.statut === 'terminé').length} terminés
                </span>
              </div>
            </div>

            {/* Liste des matchs */}
            {chargementMatchs ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-strong" />
              </div>
            ) : matchs.length === 0 ? (
              <div className="glass rounded-2xl border-panel p-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-muted opacity-30" />
                <p className="text-muted font-medium">Aucun match planifié pour l'instant.</p>
                <p className="text-xs text-muted/60 mt-1">Utilisez le planificateur pour créer des rencontres.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {matchs.map(match => {
                  const teamA = équipes.find(t => t.id === match.équipe_a_id);
                  const teamB = équipes.find(t => t.id === match.équipe_b_id);
                  const current = matchData[match.id] ?? { score_a: match.score_a, score_b: match.score_b, statut: match.statut };
                  const isEditing = editingMatchId === match.id;
                  const isButeurs = buteurMatchId === match.id;
                  const playersA = joueurs.filter(p => p.équipe_id === match.équipe_a_id);
                  const playersB = joueurs.filter(p => p.équipe_id === match.équipe_b_id);
                  const isFinished = match.statut === 'terminé';
                  const isLive = match.statut === 'en_cours';

                  return (
                    <div key={match.id} className={`rounded-2xl overflow-hidden border transition-all ${
                      isEditing || isButeurs
                        ? 'border-accent-strong/30 shadow-lg shadow-accent-strong/5'
                        : isLive
                        ? 'border-red-500/30 bg-red-500/5'
                        : isFinished
                        ? 'border-panel bg-panel-ultra-soft'
                        : 'border-blue-500/20 bg-blue-500/[0.03]'
                    }`}>

                      {/* Card principale du match */}
                      <div className="p-4 sm:p-5">

                        {/* Ligne supérieure: infos + actions */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                          {/* Infos match */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                              isLive ? 'bg-red-500/15 text-red-400 border border-red-500/25 animate-pulse' :
                              isFinished ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-red-400 animate-ping' : isFinished ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                              {isLive ? 'En cours' : isFinished ? 'Terminé' : 'À venir'}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-muted">
                              <Calendar className="w-3 h-3" /> {formaterDate(match.date)}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-muted">
                              <Clock className="w-3 h-3" /> {match.heure}
                            </span>
                            {match.lieu && (
                              <span className="flex items-center gap-1.5 text-xs text-muted hidden sm:flex">
                                <MapPin className="w-3 h-3" /> {match.lieu}
                              </span>
                            )}
                          </div>

                          {/* Boutons d'action */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditMatch(match.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                isEditing
                                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30'
                                  : 'bg-panel-soft text-muted border-panel hover:text-primary hover:border-accent-strong/30 hover:bg-white/5'
                              }`}
                            >
                              {isEditing ? <ChevronUp className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                              {isEditing ? 'Fermer' : 'Modifier'}
                            </button>

                            {isFinished && (
                              <button
                                onClick={() => handleOpenButeurs(match.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                  isButeurs
                                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                }`}
                              >
                                {isButeurs ? <ChevronUp className="w-3 h-3" /> : <Goal className="w-3 h-3" />}
                                {isButeurs ? 'Fermer' : 'Stats'}
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteMatch(match.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span className="hidden sm:inline">Supprimer</span>
                            </button>
                          </div>
                        </div>

                        {/* Corps de la card: équipes + score */}
                        <div className="flex items-center gap-4">
                          {/* Équipe A */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-panel-soft p-1 flex-shrink-0 ring-2 ring-slate-700">
                              <ImageWithFallback src={teamA?.logo || ''} alt={teamA?.nom || ''} className="w-full h-full object-contain" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-display font-bold text-primary truncate">{teamA?.nom ?? '—'}</div>
                              <div className="text-xs text-muted">{teamA?.classe}</div>
                            </div>
                          </div>

                          {/* Score central */}
                          <div className="flex-shrink-0 text-center">
                            {!isFinished && !isLive ? (
                              <div className="px-4 py-2 rounded-xl bg-panel-soft border-panel">
                                <span className="text-sm font-bold text-muted">VS</span>
                              </div>
                            ) : (
                              <div className={`px-4 py-2 rounded-xl font-black text-2xl tracking-widest ${
                                isLive
                                  ? 'bg-red-500/10 border border-red-500/20 text-primary'
                                  : 'bg-panel-soft border-panel text-primary'
                              }`}>
                                {match.score_a ?? 0} — {match.score_b ?? 0}
                              </div>
                            )}
                          </div>

                          {/* Équipe B */}
                          <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
                            <div className="min-w-0 text-right">
                              <div className="font-display font-bold text-primary truncate">{teamB?.nom ?? '—'}</div>
                              <div className="text-xs text-muted">{teamB?.classe}</div>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-panel-soft p-1 flex-shrink-0 ring-2 ring-slate-700">
                              <ImageWithFallback src={teamB?.logo || ''} alt={teamB?.nom || ''} className="w-full h-full object-contain" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ─── Panel Modifier score / statut ─── */}
                      {isEditing && (
                        <div className="border-t border-panel p-5 space-y-4 animate-slide-up bg-slate-900/60">
                          <div className="flex items-center gap-2 mb-2">
                            <Pencil className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-semibold text-primary">Modifier le match</span>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2 text-muted">
                                <div className="w-5 h-5 rounded-full bg-panel-soft flex items-center justify-center overflow-hidden flex-shrink-0">
                                  <ImageWithFallback src={teamA?.logo || ''} alt="" className="w-full h-full object-contain" />
                                </div>
                                {teamA?.nom ?? 'Équipe A'}
                              </label>
                              <input
                                type="number" min="0"
                                value={current.score_a ?? ''}
                                onChange={e => handleMatchScoreChange(match.id, 'A', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-center text-2xl font-black text-primary focus:border-accent-strong outline-none transition-all"
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2 text-muted">
                                <div className="w-5 h-5 rounded-full bg-panel-soft flex items-center justify-center overflow-hidden flex-shrink-0">
                                  <ImageWithFallback src={teamB?.logo || ''} alt="" className="w-full h-full object-contain" />
                                </div>
                                {teamB?.nom ?? 'Équipe B'}
                              </label>
                              <input
                                type="number" min="0"
                                value={current.score_b ?? ''}
                                onChange={e => handleMatchScoreChange(match.id, 'B', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-center text-2xl font-black text-primary focus:border-accent-strong outline-none transition-all"
                                placeholder="0"
                              />
                            </div>
                          </div>

                          <div>
                            <label htmlFor={`statut-${match.id}`} className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted">Statut du match</label>
                            <select id={`statut-${match.id}`} value={current.statut} onChange={e => handleMatchStatusChange(match.id, e.target.value as any)} className="select-field">
                              <option value="à_venir">📅 À venir</option>
                              <option value="en_cours">🔴 En cours</option>
                              <option value="terminé">⚡ Terminé</option>
                            </select>
                          </div>

                          <div className="flex gap-3 pt-1">
                            <button
                              onClick={() => handleSaveMatch(match.id)}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-accent-strong to-emerald-400 text-black hover:shadow-lg hover:shadow-accent-strong/20 transition-all"
                            >
                              <Save className="w-4 h-4" /> Enregistrer
                            </button>
                            <button
                              onClick={() => setEditingMatchId(null)}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-panel-soft border-panel text-muted hover:text-primary hover:bg-white/5 transition-all"
                            >
                              <X className="w-4 h-4" /> Annuler
                            </button>
                          </div>
                        </div>
                      )}

                      {/* ─── Panel Buteurs / Passeurs ─── */}
                      {isButeurs && (
                        <div className="border-t border-panel p-5 space-y-6 animate-slide-up bg-slate-900/60">
                          <div className="flex items-center gap-2">
                            <Goal className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-semibold text-primary">Buteurs & Passeurs décisifs</span>
                            <span className="ml-auto text-xs text-muted">Les stats remplacent les précédentes</span>
                          </div>

                          {/* BUTS */}
                          <div className="grid sm:grid-cols-2 gap-4">
                            {(['A', 'B'] as const).map(side => {
                              const team = side === 'A' ? teamA : teamB;
                              const players = side === 'A' ? playersA : playersB;
                              const butsCôté = buts.filter(b => b.équipe === side);
                              return (
                                <div key={side} className="space-y-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-panel-soft flex items-center justify-center overflow-hidden">
                                        <ImageWithFallback src={team?.logo || ''} alt="" className="w-full h-full object-contain" />
                                      </div>
                                      <span className="text-sm font-bold text-emerald-400">⚽ {team?.nom}</span>
                                    </div>
                                    <button onClick={() => addBut(side)} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all font-semibold">
                                      <Plus className="w-3 h-3" /> Ajouter
                                    </button>
                                  </div>
                                  {butsCôté.length === 0 && <p className="text-xs text-muted/60 italic text-center py-1">Aucun but</p>}
                                  {butsCôté.map((b, relIdx) => (
                                    <div key={relIdx} className="flex gap-2 items-center">
                                      <select value={b.joueur_id} onChange={e => updateBut(buts.indexOf(b), 'joueur_id', e.target.value)} className="select-field flex-1 text-xs py-2">
                                        <option value="">— Joueur —</option>
                                        {players.map(p => <option key={p.id} value={p.id}>#{p.numéro} {p.nom}</option>)}
                                      </select>
                                      <input type="number" min="1" max="120" placeholder="min" value={b.minute} onChange={e => updateBut(buts.indexOf(b), 'minute', e.target.value)}
                                        className="w-16 px-2 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-xs text-primary text-center focus:border-accent-strong outline-none" />
                                      <button onClick={() => removeBut(buts.indexOf(b))} className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-all flex-shrink-0">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>

                          <div className="w-full h-px bg-panel" />

                          {/* PASSES */}
                          <div className="grid sm:grid-cols-2 gap-4">
                            {(['A', 'B'] as const).map(side => {
                              const team = side === 'A' ? teamA : teamB;
                              const players = side === 'A' ? playersA : playersB;
                              const passesCôté = passes.filter(p => p.équipe === side);
                              return (
                                <div key={side} className="space-y-3 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/15">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-panel-soft flex items-center justify-center overflow-hidden">
                                        <ImageWithFallback src={team?.logo || ''} alt="" className="w-full h-full object-contain" />
                                      </div>
                                      <span className="text-sm font-bold text-yellow-400">🎯 {team?.nom}</span>
                                    </div>
                                    <button onClick={() => addPasse(side)} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 hover:bg-yellow-500/25 transition-all font-semibold">
                                      <Plus className="w-3 h-3" /> Ajouter
                                    </button>
                                  </div>
                                  {passesCôté.length === 0 && <p className="text-xs text-muted/60 italic text-center py-1">Aucune passe</p>}
                                  {passesCôté.map((p, relIdx) => (
                                    <div key={relIdx} className="flex gap-2 items-center">
                                      <select value={p.joueur_id} onChange={e => updatePasse(passes.indexOf(p), 'joueur_id', e.target.value)} className="select-field flex-1 text-xs py-2">
                                        <option value="">— Joueur —</option>
                                        {players.map(pl => <option key={pl.id} value={pl.id}>#{pl.numéro} {pl.nom}</option>)}
                                      </select>
                                      <input type="number" min="1" max="120" placeholder="min" value={p.minute} onChange={e => updatePasse(passes.indexOf(p), 'minute', e.target.value)}
                                        className="w-16 px-2 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-xs text-primary text-center focus:border-accent-strong outline-none" />
                                      <button onClick={() => removePasse(passes.indexOf(p))} className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-all flex-shrink-0">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex gap-3 pt-1">
                            <button
                              onClick={() => handleSaveStats(match.id)}
                              disabled={savingStats}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-accent-strong to-emerald-400 text-black hover:shadow-lg hover:shadow-accent-strong/20 transition-all disabled:opacity-50"
                            >
                              <Save className="w-4 h-4" />
                              {savingStats ? 'Enregistrement...' : 'Sauvegarder les stats'}
                            </button>
                            <button
                              onClick={() => setButeurMatchId(null)}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-panel-soft border-panel text-muted hover:text-primary hover:bg-white/5 transition-all"
                            >
                              <X className="w-4 h-4" /> Fermer
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
        </Tabs>
    </div>
  );
};

export default Admin;
