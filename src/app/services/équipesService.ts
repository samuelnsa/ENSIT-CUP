import { clientSupabase, ensureSupabaseConfig } from '../config/supabase';
import { écussonsDisponibles } from '../donnees/écussons';

export interface Équipe {
  id: string;
  nom: string;
  classe: string;
  logo: string;
  écusson_id: string;
  description: string;
  capitaine_id?: string;
  code_acces?: string;
  statut: 'actif' | 'disqualifié' | 'suspendu';
  date_création: string;
  joueurs_count?: number;
}

const obtenirLogoDepuisÉcussonId = (écussonId: string): string => {
  const écusson = écussonsDisponibles.find(e => e.id === écussonId);
  return écusson?.url ?? écussonsDisponibles[0].url;
};

/** Détecte si une URL de logo est une source externe non fiable (Sofascore, Unsplash, Wikipedia...) */
const estLogoExterneCassé = (url: string): boolean => {
  if (!url?.trim()) return true;
  return (
    url.includes('sofascore') ||
    url.includes('wikimedia') ||
    url.includes('wikipedia') ||
    url.includes('unsplash') ||
    url.includes('1541447275071') // ancienne URL Unsplash par défaut
  );
};

/**
 * Normalise le logo d'une équipe :
 * - Si le logo est une data URI SVG (généré localement), on le garde
 * - Sinon on génère le logo depuis l'écusson_id
 */
const normaliserLogoÉquipe = (team: any): any => {
  const logo: string = team.logo ?? '';
  const logoValide = logo.startsWith('data:') && !estLogoExterneCassé(logo);
  return {
    ...team,
    logo: logoValide ? logo : obtenirLogoDepuisÉcussonId(team.écusson_id),
  };
};

export interface FormulaireCréationÉquipe {
  nom: string;
  classe: string;
  écusson_id: string;
  description: string;
  code_acces: string;
  capitaine_id?: string;
}

// Récupérer toutes les équipes
export async function obtenirToutesLesÉquipes(includeNonActives = false): Promise<Équipe[]> {
  ensureSupabaseConfig();
  try {
    let query = clientSupabase.from('équipes').select('*');
    if (!includeNonActives) {
      query = query.eq('statut', 'actif');
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(normaliserLogoÉquipe);
  } catch (erreur) {
    console.error('Erreur lors de la récupération des équipes :', erreur);
    return [];
  }
}

// Récupérer une équipe par ID
export async function obtenirÉquipeParId(idÉquipe: string): Promise<Équipe | null> {
  ensureSupabaseConfig();
  try {
    const { data, error } = await clientSupabase
      .from('équipes')
      .select('*')
      .eq('id', idÉquipe)
      .single();

    if (error) throw error;
    return data ? normaliserLogoÉquipe(data) : null;
  } catch (erreur) {
    console.error(`Erreur lors de la récupération de l'équipe ${idÉquipe} :`, erreur);
    return null;
  }
}

// Créer une nouvelle équipe
export async function créerÉquipe(formulaire: FormulaireCréationÉquipe): Promise<Équipe | null> {
  ensureSupabaseConfig();
  try {
    // Résoudre le logo à partir de l'écusson sélectionné
    const écusson = écussonsDisponibles.find(e => e.id === formulaire.écusson_id);
    const logoUrl = écusson?.url || `https://images.unsplash.com/photo-1541447275071-4204d4d6a690?w=200&q=80`;

    const nouvelleÉquipe: any = {
      nom: formulaire.nom,
      classe: formulaire.classe,
      écusson_id: formulaire.écusson_id,
      description: formulaire.description,
      code_acces: formulaire.code_acces,
      logo: logoUrl,
      statut: 'actif',
      date_création: new Date().toISOString(),
    };

    if (formulaire.capitaine_id) {
      nouvelleÉquipe.capitaine_id = formulaire.capitaine_id;
    }

    const { data, error } = await clientSupabase
      .from('équipes')
      .insert([nouvelleÉquipe])
      .select();

    if (error) throw error;
    const insertedRow = Array.isArray(data) ? data[0] : data;
    return insertedRow || null;
  } catch (erreur) {
    console.error('Erreur lors de la création de l\'équipe :', erreur);
    throw erreur;
  }
}

// Mettre à jour une équipe
export async function mettreÀJourÉquipe(
  idÉquipe: string,
  miseÀJour: Partial<Équipe>
): Promise<Équipe | null> {
  ensureSupabaseConfig();
  try {
    // Vérifier la session active
    const { data: sessionData } = await clientSupabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Aucune session Supabase active. Reconnectez-vous en tant qu\'administrateur.');
    }

    const payload = {
      ...miseÀJour,
      ...(miseÀJour.écusson_id ? { logo: obtenirLogoDepuisÉcussonId(miseÀJour.écusson_id) } : {}),
    };

    // Supprimer les champs undefined
    Object.keys(payload).forEach(k => (payload as any)[k] === undefined && delete (payload as any)[k]);

    console.log('[mettreÀJourÉquipe] id:', idÉquipe, 'payload:', payload, 'uid:', sessionData.session.user.id);

    const { data, error } = await clientSupabase
      .from('équipes')
      .update(payload)
      .eq('id', idÉquipe)
      .select()
      .single();

    if (error) {
      console.error('[mettreÀJourÉquipe] Erreur Supabase:', error);
      throw error;
    }
    console.log('[mettreÀJourÉquipe] Succès:', data);
    return data ? normaliserLogoÉquipe(data) : null;
  } catch (erreur) {
    console.error(`[mettreÀJourÉquipe] Erreur pour l'équipe ${idÉquipe} :`, erreur);
    throw erreur;
  }
}

// Supprimer une équipe
export async function supprimerÉquipe(idÉquipe: string): Promise<boolean> {
  ensureSupabaseConfig();
  try {
    // Vérifier la session active
    const { data: sessionData } = await clientSupabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Aucune session Supabase active. Reconnectez-vous en tant qu\'administrateur.');
    }

    console.log('[supprimerÉquipe] id:', idÉquipe, 'uid:', sessionData.session.user.id);

    const { error } = await clientSupabase
      .from('équipes')
      .delete()
      .eq('id', idÉquipe);

    if (error) {
      console.error('[supprimerÉquipe] Erreur Supabase:', error);
      throw error;
    }
    console.log('[supprimerÉquipe] Succès');
    return true;
  } catch (erreur) {
    console.error(`[supprimerÉquipe] Erreur pour l'équipe ${idÉquipe} :`, erreur);
    throw erreur;
  }
}

// Désactiver une équipe
export async function désactiverÉquipe(idÉquipe: string): Promise<Équipe | null> {
  return mettreÀJourÉquipe(idÉquipe, { statut: 'disqualifié' });
}

// Obtenir les équipes d'un capitaine
export async function obtenirÉquipesCapitaine(idCapitaine: string): Promise<Équipe[]> {
  try {
    const { data, error } = await clientSupabase
      .from('équipes')
      .select('*')
      .eq('capitaine_id', idCapitaine);

    if (error) throw error;
    return data || [];
  } catch (erreur) {
    console.error(`Erreur lors de la récupération des équipes du capitaine ${idCapitaine} :`, erreur);
    return [];
  }
}
