import { clientSupabase } from '../config/supabase';

const ADMIN_EMAILS = ['admin_tournoi@tournoi-foot.com'];

export type Role = 'admin' | 'captain';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: Role;
  class_name?: string;
  team_id?: string;
}

interface ProfileRow {
  id: string;
  username?: string;
  email?: string;
  full_name: string;
  role: Role;
  class_name?: string;
  team_id?: string;
}

function normalizeUsername(username: string) {
  return username
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function usernameToEmail(username: string) {
  const normalized = normalizeUsername(username);
  return `${normalized}@tournoi-foot.com`;
}

async function profilesTableExists(): Promise<boolean> {
  const { error } = await clientSupabase
    .from('profiles')
    .select('id')
    .limit(1);

  return !error || !/Could not find the table/i.test(error.message);
}

export async function fetchUserProfile(userId: string): Promise<ProfileRow | null> {
  try {
    const { data, error } = await clientSupabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (/Could not find the table/i.test(error.message)) {
        return null;
      }
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error(`Erreur lors de la récupération du profil ${userId} :`, error);
    return null;
  }
}

export async function getUserProfileFromSession(session: any): Promise<UserProfile | null> {
  if (!session?.user) return null;

  const userId = session.user.id;
  const profile = await fetchUserProfile(userId);
  const metadata = session.user.user_metadata as {
    role?: Role;
    username?: string;
    full_name?: string;
    class_name?: string;
    team_id?: string;
  } | null;

  if (profile) {
    const usernameFromProfile = profile.username || normalizeUsername(profile.full_name);
    return {
      id: userId,
      username: usernameFromProfile,
      email: profile.email || session.user.email,
      full_name: profile.full_name || metadata?.full_name || usernameFromProfile,
      role: profile.role,
      class_name: profile.class_name || metadata?.class_name,
      team_id: profile.team_id || metadata?.team_id,
    };
  }

  const usernameFromMetadata = metadata?.username || normalizeUsername(metadata?.full_name || session.user.email?.split('@')[0] || 'user');
  const email = session.user.email || `${usernameFromMetadata}@tournoi-foot.com`;
  const roleFromMetadata = metadata?.role as Role | undefined;
  const fallbackRole: Role | undefined = roleFromMetadata || (ADMIN_EMAILS.includes(email) ? 'admin' : undefined);

  if (!fallbackRole) {
    return null;
  }

  return {
    id: userId,
    username: usernameFromMetadata,
    email,
    full_name: metadata?.full_name || usernameFromMetadata,
    role: fallbackRole,
    class_name: metadata?.class_name,
    team_id: metadata?.team_id,
  };
}

export async function signInWithUsername(username: string, password: string): Promise<UserProfile> {
  const email = usernameToEmail(username);
  const { data, error } = await clientSupabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw error;
  }

  const profile = await getUserProfileFromSession(data.session);
  if (!profile) {
    throw new Error('Profil introuvable pour cet utilisateur. Vérifiez vos données Supabase.');
  }

  return profile;
}

export async function signUpWithUsername(
  username: string,
  password: string,
  role: Role,
  class_name?: string,
  team_id?: string
): Promise<UserProfile> {
  const email = usernameToEmail(username);
  const { data, error } = await clientSupabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        username,
        full_name: username,
        class_name: class_name || null,
        team_id: team_id || null,
      },
    },
  });

  if (error) {
    throw error;
  }

  const user = data.user;
  if (!user?.id) {
    throw new Error('Impossible de créer l’utilisateur Supabase.');
  }

  const profile: UserProfile = {
    id: user.id,
    username,
    email,
    full_name: username,
    role,
    class_name,
    team_id,
  };

  try {
    if (await profilesTableExists()) {
      const insertData = {
        id: user.id,
        username,
        full_name: username,
        role,
        class_name: class_name || null,
        team_id: team_id || null,
      };
      const { error: profileError } = await clientSupabase.from('profiles').insert(insertData);
      if (profileError && !/Could not find the table/i.test(profileError.message)) {
        console.warn('Erreur lors de l’insertion du profil Supabase :', profileError.message);
      }
    }
  } catch (err) {
    console.warn('Impossible de créer un profil Supabase, le compte est quand même créé.', err);
  }

  return profile;
}

export async function registerCaptain(username: string, teamId: string, teamCode: string): Promise<UserProfile> {
  // 1. Vérifier le code de l'équipe
  const { data: team, error: teamError } = await clientSupabase
    .from('équipes')
    .select('id, code_acces, capitaine_id')
    .eq('id', teamId)
    .single();

  if (teamError || !team) {
    throw new Error('Équipe introuvable.');
  }
  if (!team.code_acces || team.code_acces !== teamCode) {
    throw new Error('Code secret invalide pour cette équipe.');
  }
  if (team.capitaine_id) {
    // Check if the current user trying to login is already the captain
    // We will just attempt login
  }

  const password = `${teamCode}_ENSITCup_Secure`; // Ensure length >= 6
  let profile: UserProfile;

  try {
    profile = await signInWithUsername(username, password);
    // Si la connexion réussit, c'est qu'il avait déjà créé son compte.
  } catch (err: any) {
    // Si échec, on crée le compte
    try {
      profile = await signUpWithUsername(username, password, 'captain', undefined, teamId);
    } catch (signUpErr: any) {
      throw new Error(signUpErr.message || 'Erreur lors de la création du compte capitaine.');
    }
  }

  // 2. Assigner ce capitaine à l'équipe
  const { error: updateError } = await clientSupabase
    .from('équipes')
    .update({ capitaine_id: profile.id })
    .eq('id', teamId);

  if (updateError) {
    console.error('Erreur lors de l\'assignation du capitaine:', updateError);
  }

  return profile;
}

export async function signOutUser(): Promise<void> {
  const { error } = await clientSupabase.auth.signOut();
  if (error) {
    console.error('Erreur lors de la déconnexion Supabase :', error);
    throw error;
  }
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const { data } = await clientSupabase.auth.getSession();
  return getUserProfileFromSession(data.session);
}
