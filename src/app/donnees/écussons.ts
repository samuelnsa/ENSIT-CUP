// Écussons d'équipes prédéfinis (10 meilleurs clubs internationaux actuels)
export const écussonsDisponibles = [
  { id: 'real-madrid', nom: 'Real Madrid', url: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg' },
  { id: 'barcelona', nom: 'FC Barcelone', url: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_(crest).svg' },
  { id: 'man-city', nom: 'Manchester City', url: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg' },
  { id: 'psg', nom: 'Paris SG', url: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg' },
  { id: 'bayern', nom: 'Bayern Munich', url: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_(2017).svg' },
  { id: 'liverpool', nom: 'Liverpool FC', url: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg' },
  { id: 'arsenal', nom: 'Arsenal FC', url: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg' },
  { id: 'juventus', nom: 'Juventus', url: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Juventus_FC_2017_icon_%28black%29.svg' },
  { id: 'ac-milan', nom: 'AC Milan', url: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg' },
  { id: 'inter-milan', nom: 'Inter Milan', url: 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021_logo.svg' },
];

export type Écusson = typeof écussonsDisponibles[number];
