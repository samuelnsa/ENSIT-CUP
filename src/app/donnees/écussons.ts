/**
 * Écussons d'équipes — logos SVG embarqués en data URI
 * Zéro dépendance réseau, fonctionne en prod sans CORS.
 * Encodage via encodeURIComponent (évite les problèmes btoa/Unicode).
 */

interface ClubConfig {
  id: string;
  nom: string;
  bg: string;       // Couleur de fond du bouclier
  text: string;     // Couleur du texte/abréviation
  abbr: string;     // 2-3 lettres
  ring: string;     // Couleur de bordure / détails
}

const CLUBS: ClubConfig[] = [
  { id: 'real-madrid',  nom: 'Real Madrid',      bg: '#FBBF24', text: '#1e3a8a', abbr: 'RM',  ring: '#1e3a8a' },
  { id: 'barcelona',   nom: 'FC Barcelone',      bg: '#A50044', text: '#FFFFFF', abbr: 'FCB', ring: '#004D98' },
  { id: 'man-city',    nom: 'Manchester City',   bg: '#6CABDD', text: '#1C2C5B', abbr: 'MC',  ring: '#1C2C5B' },
  { id: 'psg',         nom: 'Paris SG',          bg: '#003399', text: '#FFFFFF', abbr: 'PSG', ring: '#ED2939' },
  { id: 'bayern',      nom: 'Bayern Munich',     bg: '#DC052D', text: '#FFFFFF', abbr: 'FCB', ring: '#0066B2' },
  { id: 'liverpool',   nom: 'Liverpool FC',      bg: '#C8102E', text: '#FFFFFF', abbr: 'LFC', ring: '#F6EB61' },
  { id: 'arsenal',     nom: 'Arsenal FC',        bg: '#EF0107', text: '#FFFFFF', abbr: 'AFC', ring: '#FFFFFF' },
  { id: 'juventus',  nom: 'juventus',        bg: '#87CEEB', text: '#003366', abbr: 'JUV', ring: '#003366' },
  { id: 'ac-milan',    nom: 'AC Milan',          bg: '#FB090B', text: '#000000', abbr: 'ACM', ring: '#000000' },
  { id: 'inter-milan', nom: 'Inter Milan',       bg: '#003399', text: '#000000', abbr: 'INT', ring: '#000000' },
];

function makeÉcussonSVG(c: ClubConfig): string {
  const fontSize = c.abbr.length > 2 ? 20 : 24;
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 110">',
    '<defs>',
    '<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">',
    `<stop offset="0%" stop-color="${c.bg}" stop-opacity="1"/>`,
    `<stop offset="100%" stop-color="${c.bg}" stop-opacity="0.7"/>`,
    '</linearGradient>',
    '</defs>',
    // Forme bouclier
    `<path d="M50 3 L93 17 L93 54 Q93 90 50 108 Q7 90 7 54 L7 17 Z" fill="url(#g)" stroke="${c.ring}" stroke-width="4"/>`,
    // Reflet haut
    `<path d="M50 3 L93 17 L93 35 Q71 28 50 28 Q29 28 7 35 L7 17 Z" fill="white" opacity="0.12"/>`,
    // Texte
    `<text x="50" y="66" text-anchor="middle" dominant-baseline="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="${fontSize}" fill="${c.text}" letter-spacing="1">${c.abbr}</text>`,
    // Étoile décorative
    `<polygon points="50,13 52,19 58,19 53,23 55,29 50,25 45,29 47,23 42,19 48,19" fill="${c.ring}" opacity="0.8"/>`,
    '</svg>',
  ].join('');

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const écussonsDisponibles = CLUBS.map(club => ({
  id: club.id,
  nom: club.nom,
  url: makeÉcussonSVG(club),
}));

export type Écusson = typeof écussonsDisponibles[number];
