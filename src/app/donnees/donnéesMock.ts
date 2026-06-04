// 📊 Données Mock - À remplacer par Supabase
// Ce fichier est utilisé à titre temporaire pendant la migration vers Supabase

export const équipes = [
  {
    id: '1',
    name: 'AS Saint-Michel',
    className: '4ème',
    logo: 'https://images.unsplash.com/photo-1541447275071-4204d4d6a690?w=200&q=80',
    description: 'Une équipe jeune et dynamique',
    players: ['j1', 'j2', 'j3', 'j4', 'j5'],
  },
  {
    id: '2',
    name: 'FC Voltaire',
    className: '5ème',
    logo: 'https://images.unsplash.com/photo-1522869635100-ce306e08b56d?w=200&q=80',
    description: 'Équipe expérimentée',
    players: ['j6', 'j7', 'j8', 'j9', 'j10'],
  },
];

export const joueurs = [
  // Équipe 1
  { id: 'j1', name: 'Léo Martin', position: 'Gardien', number: 1, teamId: '1', goals: 0, assists: 0 },
  { id: 'j2', name: 'Tom Dupont', position: 'Défenseur', number: 2, teamId: '1', goals: 1, assists: 0 },
  { id: 'j3', name: 'Paul Girard', position: 'Milieu', number: 5, teamId: '1', goals: 2, assists: 3 },
  { id: 'j4', name: 'Marc Renard', position: 'Attaquant', number: 9, teamId: '1', goals: 5, assists: 2 },
  { id: 'j5', name: 'Jean Petit', position: 'Attaquant', number: 10, teamId: '1', goals: 3, assists: 1 },
  // Équipe 2
  { id: 'j6', name: 'Rémi Blanc', position: 'Gardien', number: 1, teamId: '2', goals: 0, assists: 0 },
  { id: 'j7', name: 'Alex Noir', position: 'Défenseur', number: 3, teamId: '2', goals: 0, assists: 0 },
  { id: 'j8', name: 'Chris Durand', position: 'Milieu', number: 6, teamId: '2', goals: 1, assists: 2 },
  { id: 'j9', name: 'Laurent Rouge', position: 'Attaquant', number: 7, teamId: '2', goals: 4, assists: 1 },
  { id: 'j10', name: 'Stéphane Vert', position: 'Attaquant', number: 11, teamId: '2', goals: 2, assists: 0 },
];

export const matchs = [
  {
    id: 'm1',
    teamAId: '1',
    teamBId: '2',
    scoreA: null,
    scoreB: null,
    status: 'upcoming',
    date: '15/06/2026',
    time: '14:00',
    duration: '90',
    goals: [],
    assists: [],
  },
  {
    id: 'm2',
    teamAId: '1',
    teamBId: '2',
    scoreA: 2,
    scoreB: 1,
    status: 'finished',
    date: '08/06/2026',
    time: '15:00',
    duration: '90',
    goals: [
      { playerId: 'j4', minute: 25, team: 'A' },
      { playerId: 'j3', minute: 45, team: 'A' },
      { playerId: 'j9', minute: 60, team: 'B' },
    ],
    assists: [
      { playerId: 'j3', minute: 25, team: 'A' },
      { playerId: 'j8', minute: 60, team: 'B' },
    ],
  },
];

export const formations = [
  {
    id: 'f1',
    teamId: '1',
    formation: '4-3-3',
    players: {
      GK: ['j1'],
      DEF: ['j2', 'j5'],
      MID: ['j3'],
      ATT: ['j4'],
    },
  },
];

// Export pour compatibilité avec le code existant
export const teams = équipes;
export const players = joueurs;
export const matches = matchs;
