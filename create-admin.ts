import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Anon Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  const username = 'admin_tournoi';
  const email = 'admin_tournoi@tournoi-foot.com';
  const password = 'AdminPassword2026!';

  console.log('Creating admin user...');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'admin',
        username: username,
        full_name: 'Administrateur Tournoi',
      },
    },
  });

  if (error) {
    // If it already exists, that's fine.
    if (error.message.includes('User already registered')) {
        console.log('Admin user already exists!');
        console.log(`Username: ${username}`);
        console.log(`Password: ${password}`);
        return;
    }
    console.error('Error creating user:', error.message);
    return;
  }

  const user = data.user;
  if (user) {
    // Insert into profiles
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      username,
      full_name: 'Administrateur Tournoi',
      role: 'admin',
    });

    if (profileError) {
      console.error('Error creating profile:', profileError.message);
    } else {
      console.log('\n✅ Admin user created successfully!');
      console.log(`Identifiant : ${username}`);
      console.log(`Mot de passe : ${password}`);
    }
  }
}

createAdmin();
