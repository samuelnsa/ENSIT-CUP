import { clientSupabase } from '../config/supabase';

export interface Formation {
  id: string;
  équipe_id: string;
  formation: string;
  configuration: any;
  date_sauvegarde: string;
  created_at?: string;
  updated_at?: string;
}

export async function obtenirFormationÉquipe(équipe_id: string): Promise<Formation | null> {
  try {
    const { data, error } = await clientSupabase
      .from('formations')
      .select('*')
      .eq('équipe_id', équipe_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error; // PGRST116 is "No rows found", which is fine if team has no formation yet
    }
    
    return data || null;
  } catch (erreur) {
    console.error(`Erreur lors de la récupération de la formation de l'équipe ${équipe_id}:`, erreur);
    return null;
  }
}

export async function sauvegarderFormation(équipe_id: string, formation: string, configuration: any): Promise<Formation | null> {
  try {
    // Upsert equivalent: We check if it exists, then update or insert.
    const existing = await obtenirFormationÉquipe(équipe_id);
    
    if (existing) {
      const { data, error } = await clientSupabase
        .from('formations')
        .update({ formation, configuration, date_sauvegarde: new Date().toISOString() })
        .eq('équipe_id', équipe_id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await clientSupabase
        .from('formations')
        .insert([{ équipe_id, formation, configuration, date_sauvegarde: new Date().toISOString() }])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    }
  } catch (erreur) {
    console.error(`Erreur lors de la sauvegarde de la formation pour l'équipe ${équipe_id}:`, erreur);
    return null;
  }
}
