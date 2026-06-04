import { clientSupabase } from '../config/supabase';

export interface Match {
  id: string;
  équipe_a_id: string;
  équipe_b_id: string;
  score_a: number | null;
  score_b: number | null;
  durée: string;
  statut: 'à_venir' | 'en_cours' | 'terminé';
  date: string;
  heure: string;
  lieu?: string;
  date_création: string;
}

export interface ButMatch {
  id: string;
  match_id: string;
  joueur_id: string;
  minute: number;
  équipe: 'A' | 'B';
}

export interface PasseMatch {
  id: string;
  match_id: string;
  joueur_id: string;
  minute: number;
  équipe: 'A' | 'B';
}

export interface FormulaireCreationMatch {
  équipe_a_id: string;
  équipe_b_id: string;
  date: string;
  heure: string;
  lieu?: string;
  durée?: string;
  score_a?: number | null;
  score_b?: number | null;
}

const determinerStatut = (score_a?: number | null, score_b?: number | null) => {
  if (score_a !== undefined && score_b !== undefined && score_a !== null && score_b !== null) {
    return 'terminé' as const;
  }
  return 'à_venir' as const;
};

// Récupérer tous les matchs
export async function obtenirTousLesMatchs(): Promise<Match[]> {
  try {
    const { data, error } = await clientSupabase
      .from('matchs')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (erreur) {
    console.error('Erreur lors de la récupération des matchs :', erreur);
    return [];
  }
}

// Récupérer les matchs à venir
export async function obtenirMatchsÀVenir(): Promise<Match[]> {
  try {
    const { data, error } = await clientSupabase
      .from('matchs')
      .select('*')
      .eq('statut', 'à_venir')
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (erreur) {
    console.error('Erreur lors de la récupération des matchs à venir :', erreur);
    return [];
  }
}

// Récupérer les matchs terminés
export async function obtenirMatchsTerminés(): Promise<Match[]> {
  try {
    const { data, error } = await clientSupabase
      .from('matchs')
      .select('*')
      .eq('statut', 'terminé')
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (erreur) {
    console.error('Erreur lors de la récupération des matchs terminés :', erreur);
    return [];
  }
}

// Récupérer les matchs d'une équipe
export async function obtenirMatchsÉquipe(idÉquipe: string): Promise<Match[]> {
  try {
    const { data, error } = await clientSupabase
      .from('matchs')
      .select('*')
      .or(`équipe_a_id.eq.${idÉquipe},équipe_b_id.eq.${idÉquipe}`)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (erreur) {
    console.error(`Erreur lors de la récupération des matchs de l'équipe ${idÉquipe} :`, erreur);
    return [];
  }
}

// Récupérer un match par ID
export async function obtenirMatchParId(idMatch: string): Promise<Match | null> {
  try {
    const { data, error } = await clientSupabase
      .from('matchs')
      .select('*')
      .eq('id', idMatch)
      .single();

    if (error) throw error;
    return data;
  } catch (erreur) {
    console.error(`Erreur lors de la récupération du match ${idMatch} :`, erreur);
    return null;
  }
}

// Créer un nouveau match
const validerFormulaireMatch = (formulaire: FormulaireCreationMatch) => {
  const requiredFields = ['équipe_a_id', 'équipe_b_id', 'date', 'heure'];
  for (const field of requiredFields) {
    if (!Object.prototype.hasOwnProperty.call(formulaire, field) || !formulaire[field as keyof FormulaireCreationMatch]) {
      return false;
    }
  }
  return formulaire.équipe_a_id !== formulaire.équipe_b_id;
};

export async function créerMatch(formulaire: FormulaireCreationMatch): Promise<Match | null> {
  if (!validerFormulaireMatch(formulaire)) {
    console.error('Formulaire de match invalide :', formulaire);
    return null;
  }

  try {
    const statut = determinerStatut(formulaire.score_a, formulaire.score_b);
    const nouveauMatch = {
      ...formulaire,
      score_a: formulaire.score_a ?? null,
      score_b: formulaire.score_b ?? null,
      durée: formulaire.durée ?? '90',
      statut,
      date_création: new Date().toISOString(),
    };

    const { data, error } = await clientSupabase
      .from('matchs')
      .insert([nouveauMatch])
      .select()
      .single();

    if (error) {
      console.error('Erreur Supabase lors de la création du match :', JSON.stringify(error, null, 2));
      throw error;
    }
    return data;
  } catch (erreur: any) {
    console.error('Erreur lors de la création du match :', JSON.stringify(erreur, Object.getOwnPropertyNames(erreur).reduce((acc, key) => ({ ...acc, [key]: (erreur as any)[key] }), {}), 2));
    if (erreur?.message) {
      throw new Error(erreur.message);
    }
    return null;
  }
}

export async function créerMatchs(formulaires: FormulaireCreationMatch[]): Promise<Match[] | null> {
  if (formulaires.length === 0) {
    return [];
  }

  const invalidMatches = formulaires.filter(formulaire => !validerFormulaireMatch(formulaire));
  if (invalidMatches.length > 0) {
    console.error('Matchs invalides détectés avant insertion :', invalidMatches);
    return null;
  }

  try {
    const nouveauxMatchs = formulaires.map(formulaire => {
      const statut = determinerStatut(formulaire.score_a, formulaire.score_b);
      return {
        ...formulaire,
        score_a: formulaire.score_a ?? null,
        score_b: formulaire.score_b ?? null,
        durée: formulaire.durée ?? '90',
        statut,
        date_création: new Date().toISOString(),
      };
    });

    const { data, error } = await clientSupabase
      .from('matchs')
      .insert(nouveauxMatchs)
      .select('*');

    if (error) {
      console.error('Erreur Supabase lors de la création des matchs :', JSON.stringify(error, null, 2));
      console.error('Payload envoyé :', JSON.stringify(nouveauxMatchs, null, 2));
      throw error;
    }

    return data || [];
  } catch (erreur) {
    console.error('Erreur lors de la création des matchs :', JSON.stringify(erreur, Object.getOwnPropertyNames(erreur).reduce((acc, key) => ({ ...acc, [key]: (erreur as any)[key] }), {}), 2));
    return null;
  }
}

// Mettre à jour un match
export async function mettreÀJourMatch(
  idMatch: string,
  miseÀJour: Partial<Match>
): Promise<Match | null> {
  try {
    const statutTermine = miseÀJour.score_a !== undefined && miseÀJour.score_b !== undefined && miseÀJour.score_a !== null && miseÀJour.score_b !== null;
    const payload = statutTermine ? { ...miseÀJour, statut: 'terminé' as const } : miseÀJour;

    const { data, error } = await clientSupabase
      .from('matchs')
      .update(payload)
      .eq('id', idMatch)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (erreur) {
    console.error(`Erreur lors de la mise à jour du match ${idMatch} :`, erreur);
    return null;
  }
}

// Ajouter un but
export async function ajouterBut(matchId: string, but: Omit<ButMatch, 'id'>): Promise<ButMatch | null> {
  try {
    const { data, error } = await clientSupabase
      .from('buts_matchs')
      .insert([{ ...but, match_id: matchId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (erreur) {
    console.error(`Erreur lors de l'ajout du but au match ${matchId} :`, erreur);
    return null;
  }
}

// Ajouter une passe décisive
export async function ajouterPasse(
  matchId: string,
  passe: Omit<PasseMatch, 'id'>
): Promise<PasseMatch | null> {
  try {
    const { data, error } = await clientSupabase
      .from('passes_matchs')
      .insert([{ ...passe, match_id: matchId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (erreur) {
    console.error(`Erreur lors de l'ajout de la passe au match ${matchId} :`, erreur);
    return null;
  }
}

// Obtenir les buts d'un match
export async function obtenirButsMatch(matchId: string): Promise<ButMatch[]> {
  try {
    const { data, error } = await clientSupabase
      .from('buts_matchs')
      .select('*')
      .eq('match_id', matchId)
      .order('minute', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (erreur) {
    console.error(`Erreur lors de la récupération des buts du match ${matchId} :`, erreur);
    return [];
  }
}

// Obtenir les passes d'un match
export async function obtenirPassesMatch(matchId: string): Promise<PasseMatch[]> {
  try {
    const { data, error } = await clientSupabase
      .from('passes_matchs')
      .select('*')
      .eq('match_id', matchId)
      .order('minute', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (erreur) {
    console.error(`Erreur lors de la récupération des passes du match ${matchId} :`, erreur);
    return [];
  }
}
