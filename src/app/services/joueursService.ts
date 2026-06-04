import { clientSupabase } from '../config/supabase';

export interface Joueur {
  id: string;
  nom: string;
  numéro: number;
  poste: string;
  équipe_id: string;
  buts: number;
  passes_décisives: number;
  apparitions: number;
  date_ajout: string;
}

export interface FormulaireAjoutJoueur {
  nom: string;
  numéro: number;
  poste: string;
  équipe_id: string;
}

// Récupérer tous les joueurs d'une équipe
export async function obtenirJoueursÉquipe(idÉquipe: string): Promise<Joueur[]> {
  try {
    const { data, error } = await clientSupabase
      .from('joueurs')
      .select('*')
      .eq('équipe_id', idÉquipe)
      .order('numéro', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (erreur) {
    console.error(`Erreur lors de la récupération des joueurs de l'équipe ${idÉquipe} :`, erreur);
    return [];
  }
}

// Obtenir tous les joueurs
export async function obtenirTousLesJoueurs(): Promise<Joueur[]> {
  try {
    const { data, error } = await clientSupabase.from('joueurs').select('*');

    if (error) throw error;
    return data || [];
  } catch (erreur) {
    console.error('Erreur lors de la récupération de tous les joueurs :', erreur);
    return [];
  }
}

// Créer un nouveau joueur
export async function créerJoueur(formulaire: FormulaireAjoutJoueur): Promise<Joueur | null> {
  try {
    const nouveauJoueur = {
      ...formulaire,
      buts: 0,
      passes_décisives: 0,
      apparitions: 0,
      date_ajout: new Date().toISOString(),
    };

    const { data, error } = await clientSupabase
      .from('joueurs')
      .insert([nouveauJoueur])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (erreur) {
    console.error('Erreur lors de la création du joueur :', erreur);
    return null;
  }
}

// Mettre à jour un joueur
export async function mettreÀJourJoueur(
  idJoueur: string,
  miseÀJour: Partial<Joueur>
): Promise<Joueur | null> {
  try {
    const { data, error } = await clientSupabase
      .from('joueurs')
      .update(miseÀJour)
      .eq('id', idJoueur)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (erreur) {
    console.error(`Erreur lors de la mise à jour du joueur ${idJoueur} :`, erreur);
    return null;
  }
}

// Supprimer un joueur
export async function supprimerJoueur(idJoueur: string): Promise<boolean> {
  try {
    const { error } = await clientSupabase.from('joueurs').delete().eq('id', idJoueur);

    if (error) throw error;
    return true;
  } catch (erreur) {
    console.error(`Erreur lors de la suppression du joueur ${idJoueur} :`, erreur);
    return false;
  }
}

// Incrémenter les buts d'un joueur
export async function incrémenterButs(idJoueur: string, nombre: number = 1): Promise<Joueur | null> {
  const joueur = await clientSupabase
    .from('joueurs')
    .select('buts')
    .eq('id', idJoueur)
    .single()
    .then(({ data }) => data);

  if (!joueur) return null;

  return mettreÀJourJoueur(idJoueur, { buts: joueur.buts + nombre });
}

// Incrémenter les passes décisives d'un joueur
export async function incrémenterPassesDécisives(
  idJoueur: string,
  nombre: number = 1
): Promise<Joueur | null> {
  const { data } = await clientSupabase
    .from('joueurs')
    .select('passes_décisives')
    .eq('id', idJoueur)
    .single();

  if (!data) return null;

  return mettreÀJourJoueur(idJoueur, { passes_décisives: (data as any).passes_décisives + nombre });
}
