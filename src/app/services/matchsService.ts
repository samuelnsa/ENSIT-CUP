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

/**
 * Détermine automatiquement le statut d'un match selon sa date/heure et ses scores.
 * - Si les deux scores sont renseignés → terminé
 * - Si la date+heure est dépassée → en_cours (le match a commencé)
 * - Sinon → à_venir
 */
export const determinerStatutAuto = (
  date: string,
  heure: string,
  durée: string | number = 90,
  score_a?: number | null,
  score_b?: number | null
): 'à_venir' | 'en_cours' | 'terminé' => {
  // Scores renseignés → terminé
  if (score_a !== undefined && score_a !== null && score_b !== undefined && score_b !== null) {
    return 'terminé';
  }

  try {
    const matchDateTime = new Date(`${date}T${heure}:00`);
    const now = new Date();
    const duréeMs = (Number(durée) || 90) * 60 * 1000;

    if (now >= new Date(matchDateTime.getTime() + duréeMs)) {
      return 'terminé'; // Le temps réglementaire est dépassé
    }
    if (now >= matchDateTime) {
      return 'en_cours'; // Le match a démarré
    }
  } catch {
    // date/heure invalide → fallback à_venir
  }

  return 'à_venir';
};

/**
 * Vérifie qu'une date de match n'est pas dans le passé.
 * Retourne un message d'erreur ou null si OK.
 */
export const validerDateMatch = (date: string, heure: string): string | null => {
  try {
    const matchDateTime = new Date(`${date}T${heure}:00`);
    const now = new Date();
    // Tolérance de 5 minutes (pour éviter les faux positifs)
    if (matchDateTime.getTime() < now.getTime() - 5 * 60 * 1000) {
      return `La date/heure du match (${date} à ${heure}) est dans le passé.`;
    }
  } catch {
    return 'Date ou heure invalide.';
  }
  return null;
};

// Récupérer tous les matchs
export async function obtenirTousLesMatchs(): Promise<Match[]> {
  try {
    const { data, error } = await clientSupabase
      .from('matchs')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    const matchs: Match[] = data || [];

    // Mettre à jour automatiquement les statuts en DB pour les matchs dont l'heure est dépassée
    const àMettreÀJour = matchs.filter(m => {
      if (m.statut === 'terminé') return false; // déjà terminé, on ne touche pas
      const nouveauStatut = determinerStatutAuto(m.date, m.heure, m.durée, m.score_a, m.score_b);
      return nouveauStatut !== m.statut;
    });

    if (àMettreÀJour.length > 0) {
      // Mise à jour silencieuse en arrière-plan
      for (const m of àMettreÀJour) {
        const nouveauStatut = determinerStatutAuto(m.date, m.heure, m.durée, m.score_a, m.score_b);
        await clientSupabase.from('matchs').update({ statut: nouveauStatut }).eq('id', m.id);
        m.statut = nouveauStatut; // Mettre à jour l'objet en mémoire aussi
      }
    }

    return matchs;
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

  // Refuser les dates passées
  const erreurDate = validerDateMatch(formulaire.date, formulaire.heure);
  if (erreurDate) throw new Error(erreurDate);

  try {
    const statut = determinerStatutAuto(
      formulaire.date,
      formulaire.heure,
      formulaire.durée,
      formulaire.score_a,
      formulaire.score_b
    );
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
    console.error('Erreur lors de la création du match :', erreur);
    if (erreur?.message) throw new Error(erreur.message);
    return null;
  }
}

export async function créerMatchs(formulaires: FormulaireCreationMatch[]): Promise<Match[] | null> {
  if (formulaires.length === 0) return [];

  // Valider toutes les dates
  for (const f of formulaires) {
    const erreurDate = validerDateMatch(f.date, f.heure);
    if (erreurDate) throw new Error(erreurDate);
  }

  const invalidMatches = formulaires.filter(formulaire => !validerFormulaireMatch(formulaire));
  if (invalidMatches.length > 0) {
    console.error('Matchs invalides détectés avant insertion :', invalidMatches);
    return null;
  }

  try {
    const nouveauxMatchs = formulaires.map(formulaire => ({
      ...formulaire,
      score_a: formulaire.score_a ?? null,
      score_b: formulaire.score_b ?? null,
      durée: formulaire.durée ?? '90',
      statut: determinerStatutAuto(formulaire.date, formulaire.heure, formulaire.durée, formulaire.score_a, formulaire.score_b),
      date_création: new Date().toISOString(),
    }));

    const { data, error } = await clientSupabase
      .from('matchs')
      .insert(nouveauxMatchs)
      .select('*');

    if (error) {
      console.error('Erreur Supabase lors de la création des matchs :', JSON.stringify(error, null, 2));
      throw error;
    }

    return data || [];
  } catch (erreur) {
    console.error('Erreur lors de la création des matchs :', erreur);
    return null;
  }
}

// Mettre à jour un match (statut auto-calculé si scores fournis)
export async function mettreÀJourMatch(
  idMatch: string,
  miseÀJour: Partial<Match>
): Promise<Match | null> {
  try {
    // Recalculer le statut si les scores changent
    let payload = { ...miseÀJour };
    if (miseÀJour.score_a !== undefined || miseÀJour.score_b !== undefined) {
      const match = await obtenirMatchParId(idMatch);
      if (match) {
        const score_a = miseÀJour.score_a !== undefined ? miseÀJour.score_a : match.score_a;
        const score_b = miseÀJour.score_b !== undefined ? miseÀJour.score_b : match.score_b;
        // Seulement si statut non explicitement fourni dans la mise à jour
        if (!miseÀJour.statut) {
          payload.statut = determinerStatutAuto(
            miseÀJour.date || match.date,
            miseÀJour.heure || match.heure,
            miseÀJour.durée || match.durée,
            score_a,
            score_b
          );
        }
      }
    }

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

// Supprimer un match et ses stats associées
export async function supprimerMatch(idMatch: string): Promise<boolean> {
  try {
    // Supprimer buts et passes d'abord (CASCADE devrait le faire mais sécurité supplémentaire)
    await clientSupabase.from('buts_matchs').delete().eq('match_id', idMatch);
    await clientSupabase.from('passes_matchs').delete().eq('match_id', idMatch);

    const { error } = await clientSupabase.from('matchs').delete().eq('id', idMatch);
    if (error) throw error;
    return true;
  } catch (erreur) {
    console.error(`Erreur lors de la suppression du match ${idMatch} :`, erreur);
    throw erreur;
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
