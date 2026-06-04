import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trophy, User as UserIcon, Key, ChevronRight, Loader2, Shield } from 'lucide-react';
import { clientSupabase } from '../config/supabase';

// Decorative particles removed to avoid inline styles

export const Login = () => {
  const navigate = useNavigate();
  const { registerCaptain, signIn, user, loginAsAdmin } = useAuth();

  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [teamCaptains, setTeamCaptains] = useState<Record<string, string>>({});
  const [captainNameWasAutoFilled, setCaptainNameWasAutoFilled] = useState(false);
  const [teamCode, setTeamCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    const fetchTeams = async () => {
      const { data } = await clientSupabase
        .from('équipes')
        .select('id, nom, classe, capitaine_id')
        .order('classe');
      if (data) {
        setTeams(data);
        if (data.length > 0) setSelectedTeamId(data[0].id);
      }
    };
    fetchTeams();
  }, []);

  useEffect(() => {
    async function loadCaptainName() {
      const selectedTeam = teams.find(team => team.id === selectedTeamId);
      if (!selectedTeam || !selectedTeam.capitaine_id) {
        if (captainNameWasAutoFilled) {
          setCaptainName('');
          setCaptainNameWasAutoFilled(false);
        }
        return;
      }

      if (teamCaptains[selectedTeamId]) {
        setCaptainName(teamCaptains[selectedTeamId]);
        setCaptainNameWasAutoFilled(true);
        return;
      }

      const { data: profile } = await clientSupabase
        .from('profiles')
        .select('full_name')
        .eq('id', selectedTeam.capitaine_id)
        .single();

      const captainFullName = profile?.full_name?.trim() || '';
      if (captainFullName) {
        const upperCaptainName = captainFullName.toUpperCase();
        setTeamCaptains(prev => ({ ...prev, [selectedTeamId]: upperCaptainName }));
        setCaptainName(upperCaptainName);
        setCaptainNameWasAutoFilled(true);
      }
    }

    loadCaptainName();
  }, [selectedTeamId, teams, teamCaptains, captainNameWasAutoFilled]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await registerCaptain(captainName, selectedTeamId, teamCode);
      navigate('/');
    } catch (err: any) {
      setError(err.message || "Code d'accès invalide. Vérifie le code donné par l'administrateur.");
    } finally {
      setLoading(false);
    }
  };

  const handleSecretAdminLogin = () => {
    const code = window.prompt("🔐 Code d'accès administrateur :");
    if (code === "ensit2026") {
      loginAsAdmin();
      navigate('/admin');
    } else if (code) {
      alert("❌ Code incorrect.");
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4 relative overflow-hidden">
      {/* Orbes animées */}
      <div className="login-orb login-orb-green w-96 h-96 -top-32 -left-32 opacity-30" />
      <div className="login-orb login-orb-purple w-80 h-80 -bottom-20 -right-20 opacity-20 delay-2s" />

      <div className="w-full max-w-md relative z-10">
      
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-up">
          {/* Trophy icon with glow */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full blur-2xl opacity-40 orb-gradient" />
            <div className="absolute inset-0 rounded-full border border-green-400/20 orb-breathe" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl float-anim trophy-bg">
                <Trophy className="w-10 h-10 text-black" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-display font-bold gradient-text mb-1">ENSIT Cup</h1>
        </div>

        {/* Form Card */}
        <div className="login-card p-8 animate-slide-up delay-100">
          {/* Header card */}
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-panel">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent-weak">
              <UserIcon className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-base font-bold text-primary">Espace Capitaine</h2>
              <p className="text-xs text-muted">Connecte-toi avec le code de ton équipe</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-xl px-4 py-3 text-sm font-medium animate-slide-up alert-error">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="selected-team" className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted">
                Ton Équipe
              </label>
              <div className="relative">
                <select id="selected-team" value={selectedTeamId} onChange={e => setSelectedTeamId(e.target.value)} className="select-field" required>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.classe} — {team.nom}</option>
                  ))}
                  {teams.length === 0 && <option value="">Aucune équipe disponible </option>}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none rotate-90 text-muted" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted">
                Code d'accès
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-accent" />
                <input value={teamCode} onChange={e => setTeamCode(e.target.value)} type="text"
                  required className="input-field font-mono tracking-widest" placeholder="..." />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted">
                Ton Nom (Capitaine)
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-muted" />
                <input value={captainName} onChange={e => { setCaptainName(e.target.value.toUpperCase()); setCaptainNameWasAutoFilled(false); }} type="text"
                  required className="input-field" placeholder="Ton nom" />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading || !selectedTeamId || !teamCode || !captainName}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
              {loading ? 'Connexion...' : 'Rejoindre mon équipe'}
            </button>
          </form>
        </div>

        <div className="text-center mt-6 flex flex-col items-center gap-2">
          <p className="text-xs text-muted">ENSIT Cup 2026 ·</p>
          <button
            type="button"
            onClick={handleSecretAdminLogin}
            className="w-8 h-8 rounded-full flex items-center justify-center opacity-30 hover:opacity-100 hover:bg-white/5 transition-all"
            title="Accès Administrateur"
          >
            <Shield className="w-3 h-3 text-muted" />
          </button>
        </div>
      </div>
    </div>
  );
};
