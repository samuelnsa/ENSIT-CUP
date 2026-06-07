import React, { useMemo } from 'react';
import { Trophy, TrendingUp } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useÉquipes, useMatchs } from '../hooks/useSupabase';
import { TrophySVG } from '../components/figma/FootIcons';

interface ClassementRow {
  teamId: string;
  joués: number;
  victoires: number;
  nuls: number;
  défaites: number;
  butsPour: number;
  butsContre: number;
  différence: number;
  points: number;
}

export const Standings = () => {
  const { équipes } = useÉquipes();
  const { matchs, chargement } = useMatchs();

  const classement = useMemo(() => {
    if (équipes.length === 0) return [] as ClassementRow[];

    const initial = équipes.reduce<Record<string, ClassementRow>>((acc, team) => {
      acc[team.id] = { teamId: team.id, joués: 0, victoires: 0, nuls: 0, défaites: 0, butsPour: 0, butsContre: 0, différence: 0, points: 0 };
      return acc;
    }, {});

    matchs.filter(m => m.statut === 'terminé').forEach(match => {
      const sA = match.score_a ?? 0;
      const sB = match.score_b ?? 0;
      const tA = initial[match.équipe_a_id];
      const tB = initial[match.équipe_b_id];
      if (!tA || !tB) return;
      tA.joués++; tB.joués++;
      tA.butsPour += sA; tA.butsContre += sB;
      tB.butsPour += sB; tB.butsContre += sA;
      if (sA > sB) { tA.victoires++; tB.défaites++; tA.points += 3; }
      else if (sA < sB) { tB.victoires++; tA.défaites++; tB.points += 3; }
      else { tA.nuls++; tB.nuls++; tA.points++; tB.points++; }
    });

    return Object.values(initial)
      .map(r => ({ ...r, différence: r.butsPour - r.butsContre }))
      .sort((a, b) => b.points - a.points || b.différence - a.différence || b.butsPour - a.butsPour);
  }, [équipes, matchs]);

  if (chargement) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-strong" />
      </div>
    );
  }

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="min-h-screen -m-8 relative overflow-hidden">
      {/* Fond terrain subtil */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.01] z-0">
        <svg viewBox="0 0 100 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <rect x="5" y="5" width="90" height="110" fill="none" stroke="currentColor" strokeWidth="0.2" className="text-amber-400" />
          <circle cx="50" cy="60" r="9" fill="none" stroke="currentColor" strokeWidth="0.2" className="text-amber-400" />
        </svg>
      </div>

      {/* Orbes */}
      <div className="fixed top-10 right-20 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none z-0 animate-float" />
      <div className="fixed bottom-32 left-20 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none z-0 animate-float" style={{ animationDelay: '1.5s' }} />

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-slide-up">
        {/* Header */}
        <div className="glass p-6 rounded-3xl border border-amber-500/20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-xl">
              <TrophySVG className="w-7 h-7 text-amber-200" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-black bg-gradient-to-r from-amber-300 via-amber-400 to-amber-600 bg-clip-text text-transparent">
                Classement Général
              </h1>
              <p className="text-sm text-muted mt-0.5">Mis à jour après chaque match terminé • {classement.length} équipes</p>
            </div>
          </div>
        </div>

      {/* Podium top 3 */}
      {classement.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[classement[1], classement[0], classement[2]].map((row, i) => {
            const isFirst = i === 1;
            const medalIdx = i === 0 ? 1 : i === 1 ? 0 : 2;
            const team = équipes.find(t => t.id === row.teamId);
            const colors = ['bg-gold/10 border-gold/30', 'bg-amber-400/10 border-amber-400/30', 'bg-bronze/10 border-bronze/30'];
            const medalEmojis = ['🥇', '🥈', '🥉'];
            return (
              <div
                key={row.teamId}
                className={`glass card-3d p-4 flex flex-col items-center gap-3 text-center transition-all ${colors[medalIdx]} border ${isFirst ? 'scale-105 shadow-lg shadow-amber-400/20' : ''}`}
              >
                <span className="text-4xl animate-breathe">{medalEmojis[medalIdx]}</span>
                <ImageWithFallback
                  src={team?.logo || ''}
                  alt={team?.nom || ''}
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-md ring-2 ring-white/10 rounded-2xl"
                />
                <div className="font-bold text-sm text-primary truncate w-full">{team?.nom}</div>
                <div className="flex items-center gap-2 justify-center">
                  <TrophySVG className="w-4 h-4 text-amber-400" />
                  <div className="text-2xl font-black bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                    {row.points}
                  </div>
                </div>
                <div className="text-xs text-muted">
                  {row.joués} matchs • {row.victoires}V {row.nuls}N {row.défaites}D
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tableau complet */}
      <div className="glass rounded-2xl overflow-hidden border border-amber-500/20">
        {/* En-tête tableau */}
        <div className="px-4 py-4 border-b border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-amber-600/5 flex items-center gap-2">
          <TrophySVG className="w-5 h-5 text-amber-400" />
          <span className="font-display font-bold text-primary">Classement complet</span>
          <span className="ml-auto text-xs text-muted">{classement.length} équipes</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-panel-soft text-xs uppercase tracking-wider text-muted border-b border-amber-500/20">
                <th className="px-4 py-3 text-center w-12">Pos</th>
                <th className="px-4 py-3 text-left">Équipe</th>
                <th className="px-4 py-3 text-center">J</th>
                <th className="px-4 py-3 text-center hidden sm:table-cell">V</th>
                <th className="px-4 py-3 text-center hidden sm:table-cell">N</th>
                <th className="px-4 py-3 text-center hidden sm:table-cell">D</th>
                <th className="px-4 py-3 text-center hidden md:table-cell">BP</th>
                <th className="px-4 py-3 text-center hidden md:table-cell">BC</th>
                <th className="px-4 py-3 text-center hidden sm:table-cell">Diff</th>
                <th className="px-4 py-3 text-center font-bold text-amber-400">Pts</th>
              </tr>
            </thead>
            <tbody>
              {classement.map((row, index) => {
                const team = équipes.find(t => t.id === row.teamId);
                const isTop3 = index < 3;
                const isLeader = index === 0;
                const medalEmojis = ['🥇', '🥈', '🥉'];
                return (
                  <tr key={row.teamId} className={`border-b border-amber-500/10 transition-colors hover:bg-amber-400/5 ${isLeader ? 'bg-amber-500/5' : ''}`}>
                    <td className="px-4 py-3 text-center">
                      {isTop3 ? (
                        <span className="text-xl">{medalEmojis[index]}</span>
                      ) : (
                        <span className="font-bold text-muted">{index + 1}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ImageWithFallback
                          src={team?.logo || ''}
                          alt={team?.nom || ''}
                          className="w-8 h-8 rounded-full object-contain flex-shrink-0 ring-2 ring-amber-500/30"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-primary truncate">{team?.nom}</div>
                          <div className="text-xs text-muted hidden sm:block">{team?.classe}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-muted font-semibold">{row.joués}</td>
                    <td className="px-4 py-3 text-center text-emerald-400 font-bold hidden sm:table-cell">{row.victoires}</td>
                    <td className="px-4 py-3 text-center text-yellow-400 font-bold hidden sm:table-cell">{row.nuls}</td>
                    <td className="px-4 py-3 text-center text-red-400 font-bold hidden sm:table-cell">{row.défaites}</td>
                    <td className="px-4 py-3 text-center text-muted font-semibold hidden md:table-cell">{row.butsPour}</td>
                    <td className="px-4 py-3 text-center text-muted font-semibold hidden md:table-cell">{row.butsContre}</td>
                    <td className={`px-4 py-3 text-center font-bold hidden sm:table-cell ${row.différence > 0 ? 'text-emerald-400' : row.différence < 0 ? 'text-red-400' : 'text-muted'}`}>
                      {row.différence > 0 ? `+${row.différence}` : row.différence}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block font-black text-lg ${isLeader ? 'text-amber-400' : 'text-amber-300'}`}>{row.points}</span>
                    </td>
                  </tr>
                );
              })}
              {classement.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-muted">Aucune équipe dans le classement pour le moment.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
