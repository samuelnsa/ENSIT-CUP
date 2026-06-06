import React, { useMemo } from 'react';
import { Trophy, TrendingUp } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useÉquipes, useMatchs } from '../hooks/useSupabase';

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
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 rounded-full bg-gradient-to-b from-amber-400 to-amber-600" />
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-3 text-primary">
            <Trophy className="w-6 h-6 text-amber-400" />
            Classement Général
          </h1>
          <p className="text-sm text-muted mt-0.5">Mis à jour après chaque match terminé.</p>
        </div>
      </div>

      {/* Podium top 3 */}
      {classement.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[classement[1], classement[0], classement[2]].map((row, i) => {
            const isFirst = i === 1;
            const medalIdx = i === 0 ? 1 : i === 1 ? 0 : 2;
            const team = équipes.find(t => t.id === row.teamId);
            return (
              <div key={row.teamId} className={`glass card-3d p-4 flex flex-col items-center gap-2 text-center transition-all ${isFirst ? 'border-amber-400/30 bg-amber-500/5 scale-105' : 'border-panel'}`}>
                <span className="text-2xl">{medals[medalIdx]}</span>
                <ImageWithFallback src={team?.logo || ''} alt={team?.nom || ''} className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-md" />
                <div className="font-bold text-sm text-primary truncate w-full">{team?.nom}</div>
                <div className={`text-2xl font-black ${medalIdx === 0 ? 'text-gold' : medalIdx === 1 ? 'text-silver' : 'text-bronze'}`}>{row.points}</div>
                <div className="text-xs text-muted">pts</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tableau complet */}
      <div className="glass rounded-2xl overflow-hidden border-panel">
        {/* En-tête tableau */}
        <div className="px-4 py-4 border-b border-panel flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent-strong" />
          <span className="font-display font-bold text-primary">Tableau complet</span>
          <span className="ml-auto text-xs text-muted">{classement.length} équipes</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-panel-soft text-xs uppercase tracking-wider text-muted border-b border-panel">
                <th className="px-4 py-3 text-center w-12">Pos</th>
                <th className="px-4 py-3 text-left">Équipe</th>
                <th className="px-4 py-3 text-center">J</th>
                <th className="px-4 py-3 text-center hidden sm:table-cell">V</th>
                <th className="px-4 py-3 text-center hidden sm:table-cell">N</th>
                <th className="px-4 py-3 text-center hidden sm:table-cell">D</th>
                <th className="px-4 py-3 text-center hidden md:table-cell">BP</th>
                <th className="px-4 py-3 text-center hidden md:table-cell">BC</th>
                <th className="px-4 py-3 text-center hidden sm:table-cell">Diff</th>
                <th className="px-4 py-3 text-center font-bold text-accent-strong">Pts</th>
              </tr>
            </thead>
            <tbody>
              {classement.map((row, index) => {
                const team = équipes.find(t => t.id === row.teamId);
                const isTop3 = index < 3;
                const isLeader = index === 0;
                return (
                  <tr key={row.teamId} className={`border-b border-panel transition-colors hover:bg-white/[0.03] ${isLeader ? 'bg-amber-500/5' : ''}`}>
                    <td className="px-4 py-3 text-center">
                      {isTop3 ? (
                        <span className="text-lg">{medals[index]}</span>
                      ) : (
                        <span className="font-bold text-muted">{index + 1}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ImageWithFallback src={team?.logo || ''} alt={team?.nom || ''} className="w-8 h-8 rounded-full object-contain flex-shrink-0 ring-2 ring-slate-700" />
                        <div className="min-w-0">
                          <div className="font-semibold text-primary truncate">{team?.nom}</div>
                          <div className="text-xs text-muted hidden sm:block">{team?.classe}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-muted">{row.joués}</td>
                    <td className="px-4 py-3 text-center text-emerald-400 font-semibold hidden sm:table-cell">{row.victoires}</td>
                    <td className="px-4 py-3 text-center text-yellow-400 hidden sm:table-cell">{row.nuls}</td>
                    <td className="px-4 py-3 text-center text-red-400 hidden sm:table-cell">{row.défaites}</td>
                    <td className="px-4 py-3 text-center text-muted hidden md:table-cell">{row.butsPour}</td>
                    <td className="px-4 py-3 text-center text-muted hidden md:table-cell">{row.butsContre}</td>
                    <td className={`px-4 py-3 text-center font-medium hidden sm:table-cell ${row.différence > 0 ? 'text-emerald-400' : row.différence < 0 ? 'text-red-400' : 'text-muted'}`}>
                      {row.différence > 0 ? `+${row.différence}` : row.différence}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block font-black text-lg ${isLeader ? 'text-gold' : 'text-accent-strong'}`}>{row.points}</span>
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
