import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Settings, Play, Database, CheckCircle2, Users, Calendar, Eye, Trash2, Copy, Pencil, Goal, Zap, MapPin, Clock, ChevronDown, ChevronUp, Save, X, Plus, LogOut } from 'lucide-react';
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
import { BallSVG, TrophySVG, ShirtSVG, WhistleSVG, BootSVG } from '../components/figma/FootIcons';

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

  const [supabaseSessionActive, setSupabaseSessionActive] = useState<boolean | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    const ADMIN_EMAIL = 'admin_tournoi@tournoi-foot.com';
    const ADMIN_PASSWORD = 'AdminPassword2026!';

    const checkAndRefreshSession = async () => {
      const { data } = await clientSupabase.auth.getSession();
      if (data.session?.user) {
        setSupabaseSessionActive(true);
        return;
      }
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

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'teams', 'compositions', 'matches'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const ensureAdminSession = async (): Promise<boolean> => {
    const { data } = await clientSupabase.auth.getSession();
    if (data.session?.user) return true;
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

  const [isDeleting, setIsDeleting] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<Record<string, AdminMatchData>>({});
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
  const [copiedCodeTeamId, setCopiedCodeTeamId] = useState<string | null>(null);
  const [formations, setFormations] = useState<Record<string, Formation | null>>({});
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => user?.role === 'admin');
  const [adminCode, setAdminCode] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminCode !== 'ensit2026') {
      setLoginError('Code administrateur incorrect.');
      return;
    }
    setLoginError('');

    const ADMIN_EMAIL = 'admin_tournoi@tournoi-foot.com';
    const ADMIN_PASSWORD = 'AdminPassword2026!';

    try {
      let session: any = null;

      const { data: signInData, error: signInError } = await clientSupabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });

      if (signInError) {
        if (signInError.message.toLowerCase().includes('invalid') || signInError.message.toLowerCase().includes('not found') || signInError.status === 400) {
          const { data: signUpData, error: signUpError } = await clientSupabase.auth.signUp({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            options: { data: { role: 'admin', full_name: 'Administrateur', username: 'admin_tournoi' } },
          });
          if (signUpError) throw signUpError;
          session = signUpData.session;
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

  const handleResetTournament = async () => {
    if (!confirm("⚠️ Attention : cela supprimera TOUS les matchs, buts et passes du tournoi.\n\nCette action est irréversible. Continuer ?")) return;
    if (!(await ensureAdminSession())) return;
    setIsDeleting(true);
    try {
      const { data: allMatchs, error: fetchErr } = await clientSupabase.from('matchs').select('id');
      if (fetchErr) throw fetchErr;

      if (!allMatchs || allMatchs.length === 0) {
        alert('Aucun match à supprimer.');
        return;
      }

      const matchIds = allMatchs.map((m: any) => m.id);
      const { error: errButs } = await clientSupabase.from('buts_matchs').delete().in('match_id', matchIds);
      if (errButs) console.warn('Erreur suppression buts:', errButs);

      const { error: errPasses } = await clientSupabase.from('passes_matchs').delete().in('match_id', matchIds);
      if (errPasses) console.warn('Erreur suppression passes:', errPasses);

      const { error: errMatchs } = await clientSupabase.from('matchs').delete().in('id', matchIds);
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

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center p-4 relative overflow-hidden -m-8">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-accent-strong/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />

        <div className="w-full max-w-md relative z-10 animate-slide-up">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center shadow-2xl mb-6 hero-gradient-purple relative overflow-hidden">
              <WhistleSVG className="w-10 h-10 text-white relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-purple-900/30 animate-breathe" />
            </div>
            <h1 className="text-3xl font-display font-bold mb-1 bg-gradient-to-r from-purple-400 via-purple-300 to-purple-500 bg-clip-text text-transparent">
              Espace Admin
            </h1>
            <p className="text-sm text-muted">Accès restreint aux organisateurs</p>
          </div>

          <div className="login-card p-8 glass card-3d border border-purple-500/20">
            {loginError && (
              <div className="mb-5 rounded-xl px-4 py-3 text-sm font-medium bg-red-500/10 border border-red-500/20 text-red-300">
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
              <button type="submit" className="btn-primary mt-2 w-full" disabled={!adminCode}>
                <WhistleSVG className="w-4 h-4" /> Accéder au tableau de bord
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const obtenirURLÉcusson = (écussonId: string) => écussonsDisponibles.find(e => e.id === écussonId)?.url || '';
  const CLASSES_ENSIT = ['P1', 'P2', 'ING1', 'ING2', 'ING3'];

  const upcomingMatches = matchs.filter(m => m.statut === 'à_venir');
  const finishedMatches = matchs.filter(m => m.statut === 'terminé');

  return (
    <div className="min-h-screen -m-8 relative overflow-hidden">
      {/* Fond terrain subtil */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] z-0">
        <svg viewBox="0 0 100 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <rect x="5" y="5" width="90" height="110" fill="none" stroke="currentColor" strokeWidth="0.2" className="text-purple-400" />
          <circle cx="50" cy="60" r="9" fill="none" stroke="currentColor" strokeWidth="0.2" className="text-purple-400" />
          <line x1="5" y1="60" x2="95" y2="60" stroke="currentColor" strokeWidth="0.2" className="text-purple-400" />
          <rect x="30" y="5" width="40" height="18" fill="none" stroke="currentColor" strokeWidth="0.2" className="text-purple-400" />
          <rect x="30" y="97" width="40" height="18" fill="none" stroke="currentColor" strokeWidth="0.2" className="text-purple-400" />
        </svg>
      </div>

      <div className="fixed top-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none z-0 animate-float" />
      <div className="fixed bottom-20 right-20 w-80 h-80 bg-accent-strong/10 rounded-full blur-3xl pointer-events-none z-0 animate-float" style={{ animationDelay: '1.5s' }} />

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-slide-up">
        {/* Bannière d'alerte */}
        {supabaseSessionActive === false && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm glass">
            <span>⚠️</span>
            <span>Session Supabase inactive. Déconnectez-vous et reconnectez-vous.</span>
            <button onClick={() => { setIsAdminAuthenticated(false); }} className="ml-auto text-xs underline hover:text-red-200">Se reconnecter</button>
          </div>
        )}

        {/* Header */}
        <div className="glass p-6 rounded-3xl border border-purple-500/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-xl relative overflow-hidden">
                <WhistleSVG className="w-7 h-7 text-white relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-transparent animate-breathe" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-display font-black bg-gradient-to-r from-purple-400 via-purple-300 to-purple-500 bg-clip-text text-transparent">
                  Tableau de Bord Admin
                </h1>
                <p className="text-sm text-muted mt-0.5">Gestion centralisée du tournoi ENSIT Cup 2026</p>
              </div>
            </div>
            <button
              onClick={handleAdminLogout}
              className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-sm font-semibold flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Déconnexion
            </button>
          </div>
        </div>

        {/* Tabs avec icônes */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="glass grid w-full grid-cols-4 mb-6 bg-slate-900/50 border border-purple-500/20 rounded-2xl p-1.5">
            <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              <TrophySVG className="w-4 h-4 mr-2" /> Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="teams" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              <ShirtSVG className="w-4 h-4 mr-2" /> Équipes
            </TabsTrigger>
            <TabsTrigger value="compositions" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              <BootSVG className="w-4 h-4 mr-2" /> Compositions
            </TabsTrigger>
            <TabsTrigger value="matches" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              <BallSVG className="w-4 h-4 mr-2" /> Matchs
            </TabsTrigger>
          </TabsList>

          {/* Tab: Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Équipes', value: `${équipes.length}/10`, sub: `${Math.max(10 - équipes.length, 0)} places libres`, Icon: ShirtSVG, color: 'text-blue-400' },
                { label: 'À venir', value: upcomingMatches.length, sub: 'matchs planifiés', Icon: BallSVG, color: 'text-accent-strong' },
                { label: 'Terminés', value: finishedMatches.length, sub: 'matchs joués', Icon: TrophySVG, color: 'text-amber-400' },
                { label: 'Joueurs', value: joueurs.length, sub: 'inscrits', Icon: Users, color: 'text-purple-400' },
              ].map((stat, i) => (
                <div key={i} className="glass card-3d p-5 rounded-2xl border border-purple-500/20 hover:border-purple-500/40 transition-all">
                  <stat.Icon className={`w-5 h-5 mb-3 ${stat.color}`} />
                  <div className={`text-3xl font-black mb-1 ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs font-semibold text-primary">{stat.label}</div>
                  <div className="text-xs text-muted mt-0.5">{stat.sub}</div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Inscriptions */}
              <div className="glass card-3d p-6 rounded-2xl border border-blue-500/20 space-y-5">
                <h2 className="text-base font-display font-bold flex items-center gap-2 text-primary">
                  <Database className="w-5 h-5 text-blue-400" /> Statut des inscriptions
                </h2>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted">Équipes inscrites</span>
                    <span className="font-bold text-primary">{équipes.length} / 10</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-accent-strong transition-all"
                      style={{ width: `${Math.min((équipes.length / 10) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <div className="text-2xl font-black text-emerald-400">{équipes.length}</div>
                    <div className="text-xs text-muted mt-1">Confirmées</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-700 text-center">
                    <div className="text-2xl font-black text-muted">{Math.max(10 - équipes.length, 0)}</div>
                    <div className="text-xs text-muted mt-1">Places libres</div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('teams')}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
                >
                  <Users className="w-4 h-4" /> Gérer les équipes
                </button>
              </div>

              {/* Actions rapides */}
              <div className="glass card-3d p-6 rounded-2xl border border-purple-500/20 space-y-4">
                <h2 className="text-base font-display font-bold flex items-center gap-2 text-primary">
                  <Zap className="w-5 h-5 text-accent-strong" /> Actions rapides
                </h2>
                <div className="space-y-3">
                  <Link
                    to="/admin/scheduler"
                    className="flex items-center gap-3 p-3 rounded-xl bg-panel-soft hover:bg-white/5 border border-panel hover:border-accent-strong/30 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-accent-strong/10 border border-accent-strong/20 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-accent-strong" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-primary text-sm">Planificateur</p>
                      <p className="text-xs text-muted">Drag and drop matchs</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted -rotate-90" />
                  </Link>
                  <button
                    onClick={() => setActiveTab('matches')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-panel-soft hover:bg-white/5 border border-panel hover:border-purple-500/30 transition-all text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <BallSVG className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-primary text-sm">Gestion matchs</p>
                      <p className="text-xs text-muted">{matchs.length} au total</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted -rotate-90" />
                  </button>
                </div>
              </div>
            </div>

            {/* Zone de danger */}
            <div className="glass rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
              <h2 className="text-base font-display font-bold flex items-center gap-2 text-red-400 mb-4">
                <Trash2 className="w-5 h-5" /> Zone de danger
              </h2>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-primary">Réinitialiser tous les matchs</p>
                  <p className="text-xs text-muted mt-1">
                    Supprime <strong className="text-red-400">{matchs.length} match{matchs.length !== 1 ? 's' : ''}</strong>, buts et passes.
                  </p>
                </div>
                <button
                  onClick={handleResetTournament}
                  disabled={isDeleting || matchs.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" /> Réinitialiser
                    </>
                  )}
                </button>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Équipes - Placeholder pour maintenant */}
          <TabsContent value="teams" className="glass card-3d p-6 rounded-2xl border border-purple-500/20">
            <h2 className="text-base font-display font-bold flex items-center gap-2 text-primary mb-4">
              <ShirtSVG className="w-5 h-5 text-blue-400" /> Gestion des équipes ({équipes.length})
            </h2>
            <div className="text-muted text-sm">Module de gestion des équipes en développement...</div>
          </TabsContent>

          {/* Tab: Compositions - Placeholder pour maintenant */}
          <TabsContent value="compositions" className="glass card-3d p-6 rounded-2xl border border-purple-500/20">
            <h2 className="text-base font-display font-bold flex items-center gap-2 text-primary mb-4">
              <BootSVG className="w-5 h-5 text-purple-400" /> Compositions tactiques
            </h2>
            <div className="text-muted text-sm">Visualisation des formations en développement...</div>
          </TabsContent>

          {/* Tab: Matchs - Placeholder pour maintenant */}
          <TabsContent value="matches" className="glass card-3d p-6 rounded-2xl border border-purple-500/20">
            <h2 className="text-base font-display font-bold flex items-center gap-2 text-primary mb-4">
              <BallSVG className="w-5 h-5 text-accent-strong" /> Gestion des matchs
            </h2>
            <div className="text-muted text-sm">Module de gestion des matchs en développement...</div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
