import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Key, ChevronDown, Loader2, Shield } from 'lucide-react';
import { clientSupabase } from '../config/supabase';

/* ── SVG Icons foot ─────────────────────────────────────────── */
const BallIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="2.5" fill="none" />
    <polygon points="32,8 40,16 37,26 27,26 24,16" fill="currentColor" opacity="0.9" />
    <polygon points="8,24 18,20 24,28 19,38 9,36" fill="currentColor" opacity="0.7" />
    <polygon points="56,24 46,20 40,28 45,38 55,36" fill="currentColor" opacity="0.7" />
    <polygon points="14,50 22,42 32,46 32,56 20,58" fill="currentColor" opacity="0.7" />
    <polygon points="50,50 42,42 32,46 32,56 44,58" fill="currentColor" opacity="0.7" />
    <polygon points="27,26 24,16 32,8 40,16 37,26 32,30" fill="currentColor" opacity="0.5" />
  </svg>
);

const TrophyIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 8h24v20c0 11-12 16-12 16S20 39 20 28V8z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
    <path d="M20 14H10c0 10 6 14 10 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M44 14h10c0 10-6 14-10 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <line x1="32" y1="44" x2="32" y2="52" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <rect x="22" y="52" width="20" height="4" rx="2" stroke="currentColor" strokeWidth="2.5" fill="none"/>
    <path d="M28 22l2 4 4 0.5-3 3 0.7 4-3.7-2-3.7 2 0.7-4-3-3 4-0.5z" fill="currentColor" opacity="0.8"/>
  </svg>
);

const ShirtIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6l-14 10 6 8 6-4v34h28V20l6 4 6-8-14-10c-2 4-6 6-12 6s-10-2-12-6z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
    <path d="M26 6c0 3.3 2.7 6 6 6s6-2.7 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
  </svg>
);

const WhistleIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="22" cy="40" r="16" stroke="currentColor" strokeWidth="2.5" fill="none"/>
    <path d="M34 28L50 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    <path d="M44 8l8 8-6 2-4-4z" fill="currentColor" opacity="0.8"/>
    <circle cx="22" cy="40" r="6" fill="currentColor" opacity="0.3"/>
    <line x1="10" y1="40" x2="16" y2="40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="22" y1="28" x2="22" y2="34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const BootIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 20v22c0 4 3 6 6 6h32l4-8H28V20H10z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
    <path d="M28 20V10c0-2 2-4 4-4h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <line x1="10" y1="34" x2="28" y2="34" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M46 42l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M42 46l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const StarIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 2l3.6 7.3 8 1.2-5.8 5.6 1.4 8-7.2-3.8-7.2 3.8 1.4-8L4.4 10.5l8-1.2z"/>
  </svg>
);

export const Login = () => {
  const navigate = useNavigate();
  const { registerCaptain, user, loginAsAdmin } = useAuth();

  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [teamCaptains, setTeamCaptains] = useState<Record<string, string>>({});
  const [captainNameWasAutoFilled, setCaptainNameWasAutoFilled] = useState(false);
  const [teamCode, setTeamCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) navigate('/'); }, [user, navigate]);

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
      const selectedTeam = teams.find(t => t.id === selectedTeamId);
      if (!selectedTeam?.capitaine_id) {
        if (captainNameWasAutoFilled) { setCaptainName(''); setCaptainNameWasAutoFilled(false); }
        return;
      }
      if (teamCaptains[selectedTeamId]) {
        setCaptainName(teamCaptains[selectedTeamId]); setCaptainNameWasAutoFilled(true); return;
      }
      const { data: profile } = await clientSupabase.from('profiles').select('full_name').eq('id', selectedTeam.capitaine_id).single();
      const name = profile?.full_name?.trim().toUpperCase() || '';
      if (name) { setTeamCaptains(prev => ({ ...prev, [selectedTeamId]: name })); setCaptainName(name); setCaptainNameWasAutoFilled(true); }
    }
    loadCaptainName();
  }, [selectedTeamId, teams, teamCaptains, captainNameWasAutoFilled]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await registerCaptain(captainName, selectedTeamId, teamCode);
      navigate('/');
    } catch (err: any) {
      setError(err.message || "Code d'accès invalide. Vérifie le code donné par l'administrateur.");
    } finally { setLoading(false); }
  };

  const handleSecretAdminLogin = () => {
    const code = window.prompt('🔐 Code administrateur :');
    if (code === 'ensit2026') { loginAsAdmin(); navigate('/admin'); }
    else if (code) alert('❌ Code incorrect.');
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #050810 0%, #0a1428 40%, #0d1f12 100%)' }}>

      {/* ── Terrain de foot SVG en arrière-plan ───────────── */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none">
        <svg viewBox="0 0 800 520" className="w-full h-full max-w-4xl" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Contour terrain */}
          <rect x="40" y="40" width="720" height="440" rx="4" stroke="white" strokeWidth="3"/>
          {/* Ligne médiane */}
          <line x1="400" y1="40" x2="400" y2="480" stroke="white" strokeWidth="3"/>
          {/* Cercle central */}
          <circle cx="400" cy="260" r="80" stroke="white" strokeWidth="3"/>
          {/* Point central */}
          <circle cx="400" cy="260" r="5" fill="white"/>
          {/* Surface réparation gauche */}
          <rect x="40" y="160" width="120" height="200" stroke="white" strokeWidth="3"/>
          {/* Surface but gauche */}
          <rect x="40" y="210" width="50" height="100" stroke="white" strokeWidth="3"/>
          {/* Surface réparation droite */}
          <rect x="640" y="160" width="120" height="200" stroke="white" strokeWidth="3"/>
          {/* Surface but droite */}
          <rect x="710" y="210" width="50" height="100" stroke="white" strokeWidth="3"/>
          {/* Arc surface gauche */}
          <path d="M160 180 Q200 260 160 340" stroke="white" strokeWidth="3" fill="none"/>
          {/* Arc surface droite */}
          <path d="M640 180 Q600 260 640 340" stroke="white" strokeWidth="3" fill="none"/>
          {/* Buts gauche */}
          <rect x="10" y="220" width="32" height="80" stroke="white" strokeWidth="2.5"/>
          {/* Buts droite */}
          <rect x="758" y="220" width="32" height="80" stroke="white" strokeWidth="2.5"/>
          {/* Points de penalty */}
          <circle cx="130" cy="260" r="4" fill="white"/>
          <circle cx="670" cy="260" r="4" fill="white"/>
        </svg>
      </div>

      {/* ── Orbes lumineuses ─────────────────────────────── */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #00e676 0%, transparent 70%)' }} />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
      <div className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full opacity-10 blur-2xl" style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }} />

      {/* ── Icônes flottantes déco ───────────────────────── */}
      <div className="absolute top-12 left-16 text-accent-strong/20 animate-[float_7s_ease-in-out_infinite]">
        <BallIcon className="w-12 h-12" />
      </div>
      <div className="absolute top-24 right-20 text-yellow-400/15 animate-[float_9s_ease-in-out_infinite_1s]">
        <TrophyIcon className="w-10 h-10" />
      </div>
      <div className="absolute bottom-32 left-24 text-purple-400/15 animate-[float_8s_ease-in-out_infinite_2s]">
        <ShirtIcon className="w-10 h-10" />
      </div>
      <div className="absolute bottom-20 right-16 text-accent-strong/15 animate-[float_6s_ease-in-out_infinite_0.5s]">
        <WhistleIcon className="w-9 h-9" />
      </div>
      <div className="absolute top-1/2 left-10 text-blue-400/10 animate-[float_10s_ease-in-out_infinite_3s]">
        <BootIcon className="w-8 h-8" />
      </div>
      <div className="absolute top-16 right-1/3 text-yellow-300/10 animate-[float_8s_ease-in-out_infinite_1.5s]">
        <StarIcon className="w-6 h-6" />
      </div>
      <div className="absolute bottom-40 right-1/3 text-accent-strong/10 animate-[float_7s_ease-in-out_infinite_4s]">
        <BallIcon className="w-7 h-7" />
      </div>

      {/* ── Contenu principal ────────────────────────────── */}
      <div className="w-full max-w-sm relative z-10 animate-slide-up">

        {/* Logo & titre */}
        <div className="text-center mb-8">
          {/* Ballon animé avec glow */}
          <div className="relative w-28 h-28 mx-auto mb-5">
            {/* Glow vert */}
            <div className="absolute inset-0 rounded-full blur-2xl opacity-50" style={{ background: 'radial-gradient(circle, #00e676 0%, transparent 70%)' }} />
            {/* Cercles orbitaux */}
            <div className="absolute inset-2 rounded-full border border-accent-strong/20 animate-[breathe_3s_ease-in-out_infinite]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl" style={{ background: 'linear-gradient(135deg, #00e676 0%, #00b248 100%)', boxShadow: '0 0 40px rgba(0,230,118,0.5)' }}>
                <BallIcon className="w-11 h-11 text-black" />
              </div>
            </div>
          </div>

          {/* Titre */}
          <h1 className="text-4xl font-display font-black mb-1" style={{ background: 'linear-gradient(135deg, #00e676 0%, #7c3aed 50%, #f59e0b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            ENSIT Cup
          </h1>
          <p className="text-sm text-muted tracking-widest uppercase font-semibold">Tournoi Interclasses 2026</p>

          {/* Stars déco */}
          <div className="flex items-center justify-center gap-1.5 mt-2">
            {[0,1,2].map(i => (
              <StarIcon key={i} className="w-3 h-3 text-yellow-400/60" />
            ))}
          </div>
        </div>

        {/* Card formulaire */}
        <div className="rounded-3xl overflow-hidden" style={{ background: 'rgba(17,19,26,0.85)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)' }}>

          {/* Bandeau vert haut */}
          <div className="px-7 pt-6 pb-5 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.2)' }}>
                <ShirtIcon className="w-5 h-5 text-accent-strong" />
              </div>
              <div>
                <h2 className="text-base font-bold text-primary">Espace Capitaine</h2>
                <p className="text-xs text-muted">Entre avec le code de ton équipe</p>
              </div>
              {/* Ballon mini déco */}
              <div className="ml-auto opacity-30">
                <BallIcon className="w-6 h-6 text-accent-strong" />
              </div>
            </div>
          </div>

          <div className="px-7 py-6">
            {/* Erreur */}
            {error && (
              <div className="mb-5 rounded-xl px-4 py-3 text-sm font-medium flex items-start gap-2 animate-slide-up" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                <WhistleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Équipe */}
              <div>
                <label htmlFor="selected-team" className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#94a3b8' }}>
                  Ton Équipe
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ShirtIcon className="w-4 h-4 text-accent-strong" />
                  </div>
                  <select
                    id="selected-team"
                    value={selectedTeamId}
                    onChange={e => setSelectedTeamId(e.target.value)}
                    required
                    className="select-field pl-10 pr-10"
                  >
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.classe} — {team.nom}</option>
                    ))}
                    {teams.length === 0 && <option value="">Aucune équipe disponible</option>}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-muted" />
                </div>
              </div>

              {/* Code d'accès */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#94a3b8' }}>
                  Code d'accès
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Key className="w-4 h-4 text-accent-strong" />
                  </div>
                  <input
                    value={teamCode}
                    onChange={e => setTeamCode(e.target.value)}
                    type="text"
                    required
                    className="input-field font-mono tracking-widest"
                    placeholder="ING2-TEAM-XXXX"
                  />
                </div>
              </div>

              {/* Nom capitaine */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#94a3b8' }}>
                  Ton Nom (Capitaine)
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <TrophyIcon className="w-4 h-4 text-muted" />
                  </div>
                  <input
                    value={captainName}
                    onChange={e => { setCaptainName(e.target.value.toUpperCase()); setCaptainNameWasAutoFilled(false); }}
                    type="text"
                    required
                    className="input-field"
                    placeholder="TON NOM"
                  />
                </div>
              </div>

              {/* Bouton submit */}
              <button
                type="submit"
                disabled={loading || !selectedTeamId || !teamCode || !captainName}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                style={{
                  background: loading ? 'rgba(0,230,118,0.5)' : 'linear-gradient(135deg, #00e676 0%, #00b248 100%)',
                  color: '#000',
                  boxShadow: loading ? 'none' : '0 8px 24px rgba(0,230,118,0.35)'
                }}
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Connexion...</>
                ) : (
                  <><BallIcon className="w-5 h-5" /> Rejoindre mon équipe</>
                )}
              </button>
            </form>
          </div>

          {/* Pied card avec icônes sport */}
          <div className="px-7 py-4 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3 opacity-20">
              <BallIcon className="w-5 h-5 text-white" />
              <TrophyIcon className="w-5 h-5 text-white" />
              <ShirtIcon className="w-5 h-5 text-white" />
              <WhistleIcon className="w-5 h-5 text-white" />
              <BootIcon className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs text-muted">ENSIT · 2026</p>
          </div>
        </div>

        {/* Bouton admin secret */}
        <div className="text-center mt-5 flex flex-col items-center gap-1">
          <p className="text-xs text-muted/40">Tournoi officiel interclasses</p>
          <button
            type="button"
            onClick={handleSecretAdminLogin}
            className="mt-1 w-8 h-8 rounded-full flex items-center justify-center opacity-20 hover:opacity-70 hover:bg-white/5 transition-all"
            title="Accès Administrateur"
          >
            <Shield className="w-3 h-3 text-muted" />
          </button>
        </div>
      </div>
    </div>
  );
};
