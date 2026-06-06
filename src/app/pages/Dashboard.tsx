import React, { useMemo } from 'react';
import { Trophy, Users, Goal, ArrowRight, Calendar, Zap, TrendingUp, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useÉquipes, useTousLesJoueurs, useMatchsÀVenir, useMatchs } from '../hooks/useSupabase';
import { useAuth } from '../context/AuthContext';
import { formaterDate } from '../utils/date';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { équipes, chargement: chargementÉquipes } = useÉquipes();
  const { joueurs } = useTousLesJoueurs();
  const { matchs: upcomingMatches } = useMatchsÀVenir();
  const { matchs } = useMatchs();

  const totalGoals = useMemo(
    () => joueurs.reduce((acc, joueur) => acc + Number(joueur.buts || 0), 0),
    [joueurs],
  );

  const topScorer = useMemo(
    () =>
      [...joueurs]
        .sort((a, b) => Number(b.buts || 0) - Number(a.buts || 0))
        .find(() => true),
    [joueurs],
  );

  const pointsByTeam = useMemo(() => {
    const totals = new Map<string, number>();
    matchs
      .filter(match => match.statut === 'terminé' && match.score_a !== null && match.score_b !== null)
      .forEach((match) => {
        if (!match.équipe_a_id || !match.équipe_b_id) return;
        const scoreA = Number(match.score_a);
        const scoreB = Number(match.score_b);

        if (scoreA > scoreB) {
          totals.set(match.équipe_a_id, (totals.get(match.équipe_a_id) ?? 0) + 3);
        } else if (scoreA < scoreB) {
          totals.set(match.équipe_b_id, (totals.get(match.équipe_b_id) ?? 0) + 3);
        } else {
          totals.set(match.équipe_a_id, (totals.get(match.équipe_a_id) ?? 0) + 1);
          totals.set(match.équipe_b_id, (totals.get(match.équipe_b_id) ?? 0) + 1);
        }
      });
    return totals;
  }, [matchs]);

  const topThree = useMemo(
    () =>
      équipes
        .filter(team => team.statut === 'actif')
        .map((team) => ({ teamId: team.id, points: pointsByTeam.get(team.id) ?? 0 }))
        .sort((a, b) => b.points - a.points)
        .slice(0, 3),
    [équipes, pointsByTeam],
  );

  return (
    <div className="space-y-8 px-4 py-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted">Tableau de bord</p>
          <h1 className="text-3xl font-bold text-primary">Bienvenue{user?.full_name ? `, ${user.full_name}` : ''}</h1>
        </div>
        <div className="rounded-3xl bg-panel-overlay border border-panel p-4 inline-flex items-center gap-3">
          <Trophy className="w-5 h-5 text-accent" />
          <div>
            <p className="text-sm text-muted">Statut connecté</p>
            <p className="text-sm font-semibold text-primary">{user?.role === 'admin' ? 'Administrateur' : 'Capitaine'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          {
            icon: <Users className="w-6 h-6" />,
            title: 'Équipes inscrites',
            value: chargementÉquipes ? '...' : équipes.length,
            sub: 'sur 10 équipes max',
            iconColor: '#3b82f6',
            to: '/teams-registered',
            delay: '0s',
          },
          {
            icon: <Goal className="w-6 h-6" />,
            title: 'Buts marqués',
            value: totalGoals,
            sub: 'depuis le début',
            iconColor: 'var(--color-accent)',
            to: '/goalscorers',
            delay: '0.1s',
          },
          {
            icon: <Star className="w-6 h-6" />,
            title: 'Meilleur buteur',
            value: topScorer?.nom || '—',
            sub: `${topScorer?.buts || 0} buts`,
            iconColor: '#f59e0b',
            to: topScorer ? `/teams/${topScorer.équipe_id}` : '/statistics',
            delay: '0.2s',
          },
        ].map((card, i) => (
          <div
            key={i}
            onClick={() => navigate(card.to)}
            className={`stat-card glass card-3d cursor-pointer group ${
              card.delay === '0.1s' ? 'delay-100' : card.delay === '0.2s' ? 'delay-200' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`p-3 rounded-xl ${
                  card.iconColor === '#3b82f6'
                    ? 'stat-blue'
                    : card.iconColor === 'var(--color-accent)'
                    ? 'stat-green'
                    : 'stat-gold'
                }`}
              >
                {card.icon}
              </div>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 text-muted" />
            </div>
            <div className="text-3xl font-display font-bold mb-1 text-primary">{card.value}</div>
            <p className="text-sm font-medium text-muted">{card.title}</p>
            <p className="text-xs mt-1 text-muted opacity-60">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 glass card-3d rounded-2xl p-6 animate-slide-up delay-300">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent-strong" />
              <h2 className="text-lg font-display font-bold text-primary">Prochain Match</h2>
            </div>
            <Link to="/matches" className="flex items-center gap-1 text-xs font-semibold transition-all hover:gap-2 text-accent-strong">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {upcomingMatches.length > 0 ? (
            <div
              onClick={() => navigate(`/matches/${upcomingMatches[0].id}`)}
              className="rounded-2xl p-6 cursor-pointer group transition-all bg-panel-lighter border-panel"
            >
              <div className="flex justify-center mb-5">
                <span className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-panel-success">
                  <Calendar className="w-3 h-3" />
                  {formaterDate(upcomingMatches[0].date)} · {upcomingMatches[0].heure}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <TeamDisplay teamId={upcomingMatches[0].équipe_a_id} équipes={équipes} align="right" />
                <div className="flex flex-col items-center gap-1">
                  <div className="text-3xl font-black text-white-10">VS</div>
                  <div className="w-2 h-2 rounded-full breathe dot-accent" />
                </div>
                <TeamDisplay teamId={upcomingMatches[0].équipe_b_id} équipes={équipes} align="left" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Calendar className="w-12 h-12 opacity-20 text-muted" />
              <p className="text-muted">Aucun match programmé</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 glass card-3d rounded-2xl p-6 animate-slide-up delay-400">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-sky-500" />
              <h2 className="text-lg font-display font-bold text-primary">Top 3</h2>
            </div>
            <Link to="/standings" className="flex items-center gap-1 text-xs font-semibold text-purple-400">
              Complet <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {topThree.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted">Le classement apparaîtra ici.</p>
            ) : (
              topThree.map((row, index) => {
                const team = équipes.find((t) => t.id === row.teamId);
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <div
                    key={row.teamId}
                    onClick={() => navigate(`/teams/${row.teamId}`)}
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all group team-row bg-panel-lighter border-panel"
                  >
                    <span className="text-xl w-8 text-center flex-shrink-0">{medals[index]}</span>
                    <ImageWithFallback src={team?.logo || ''} alt={team?.nom || ''} className="w-12 h-12 rounded-2xl object-contain flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-primary">{team?.nom || '—'}</p>
                      <p className="text-xs text-muted">{team?.classe}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-lg font-bold ${index === 0 ? 'text-gold' : index === 1 ? 'text-silver' : 'text-bronze'}`}>
                        {row.points}
                      </div>
                      <div className="text-xs text-muted">pts</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TeamDisplay = ({ teamId, équipes, align }: { teamId: string; équipes: any[]; align: 'left' | 'right' }) => {
  const team = équipes.find((t) => t.id === teamId);
  if (!team) return <div className="flex-1" />;

  return (
    <div className={`flex flex-col items-center gap-3 flex-1 ${align === 'right' ? 'items-end' : 'items-start'}`}>
      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 float-anim border-panel-light">
        <ImageWithFallback src={team.logo} alt={team.nom} className="w-full h-full object-cover" />
      </div>
      <div className={`${align === 'right' ? 'text-right' : 'text-left'}`}>
        <p className="font-bold text-sm text-primary">{team.nom}</p>
        <span className="text-xs badge-surface">{team.classe}</span>
      </div>
    </div>
  );
};
