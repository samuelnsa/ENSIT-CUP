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
    return data || [];
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
    return data;
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
  try {
    const { data, error } = await clientSupabase
      .from('équipes')
      .update(miseÀJour)
      .eq('id', idÉquipe)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (erreur) {
    console.error(`Erreur lors de la mise à jour de l'équipe ${idÉquipe} :`, erreur);
    return null;
  }
}

// Supprimer une équipe
export async function supprimerÉquipe(idÉquipe: string): Promise<boolean> {
  try {
    const { error } = await clientSupabase.from('équipes').delete().eq('id', idÉquipe);

    if (error) throw error;
    return true;
  } catch (erreur) {
    console.error(`Erreur lors de la suppression de l'équipe ${idÉquipe} :`, erreur);
    return false;
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
