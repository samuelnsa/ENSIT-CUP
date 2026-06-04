import React, { useMemo } from 'react';
import { Trophy } from 'lucide-react';
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
      acc[team.id] = {
        teamId: team.id,
        joués: 0,
        victoires: 0,
        nuls: 0,
        défaites: 0,
        butsPour: 0,
        butsContre: 0,
        différence: 0,
        points: 0,
      };
      return acc;
    }, {});

    matchs
      .filter(match => match.statut === 'terminé')
      .forEach(match => {
        const scoreA = match.score_a ?? 0;
        const scoreB = match.score_b ?? 0;
        const teamA = initial[match.équipe_a_id];
        const teamB = initial[match.équipe_b_id];

        if (!teamA || !teamB) return;

        teamA.joués += 1;
        teamB.joués += 1;
        teamA.butsPour += scoreA;
        teamA.butsContre += scoreB;
        teamB.butsPour += scoreB;
        teamB.butsContre += scoreA;

        if (scoreA > scoreB) {
          teamA.victoires += 1;
          teamB.défaites += 1;
          teamA.points += 3;
        } else if (scoreA < scoreB) {
          teamB.victoires += 1;
          teamA.défaites += 1;
          teamB.points += 3;
        } else {
          teamA.nuls += 1;
          teamB.nuls += 1;
          teamA.points += 1;
          teamB.points += 1;
        }
      });

    return Object.values(initial)
      .map(row => ({ ...row, différence: row.butsPour - row.butsContre }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.différence !== a.différence) return b.différence - a.différence;
        return b.butsPour - a.butsPour;
      });
  }, [équipes, matchs]);

  if (chargement) {
    return <div className="p-8 text-slate-500">Chargement du classement...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-amber-500" />
          Classement Général
        </h1>
        <p className="text-slate-500 mt-2">Le classement est mis à jour après chaque match.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-500">
                <th className="p-4 w-16 text-center">Pos</th>
                <th className="p-4">Équipe</th>
                <th className="p-4 text-center">J</th>
                <th className="p-4 text-center">V</th>
                <th className="p-4 text-center">N</th>
                <th className="p-4 text-center">D</th>
                <th className="p-4 text-center">BP</th>
                <th className="p-4 text-center">BC</th>
                <th className="p-4 text-center">Diff</th>
                <th className="p-4 text-center font-bold text-emerald-600">Pts</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {classement.map((row, index) => {
                const team = équipes.find(t => t.id === row.teamId);
                return (
                  <tr key={row.teamId} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-center font-bold text-slate-500">{index + 1}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <ImageWithFallback src={team?.logo || ''} alt={team?.nom || ''} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                        <span className="font-semibold text-slate-900">{team?.nom}</span>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md hidden sm:inline-block">{team?.classe}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">{row.joués}</td>
                    <td className="p-4 text-center">{row.victoires}</td>
                    <td className="p-4 text-center">{row.nuls}</td>
                    <td className="p-4 text-center">{row.défaites}</td>
                    <td className="p-4 text-center">{row.butsPour}</td>
                    <td className="p-4 text-center">{row.butsContre}</td>
                    <td className="p-4 text-center font-medium">{row.différence > 0 ? `+${row.différence}` : row.différence}</td>
                    <td className="p-4 text-center font-bold text-emerald-600 text-lg">{row.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
