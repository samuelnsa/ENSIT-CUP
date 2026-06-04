# 🏁 Guide d'Installation et Configuration Supabase

## Étape 1 : Créer un Compte Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Cliquez sur "Sign Up"
3. Créez un compte (avec GitHub ou email)

## Étape 2 : Créer un Nouveau Projet

1. Dans votre dashboard Supabase, cliquez sur "New project"
2. Donnez un nom à votre projet (ex: `tournoi-foot`)
3. Créez une base de données (PostgreSQL)
4. Attendez l'initialisation (environ 2 minutes)

## Étape 3 : Récupérer les Clés d'API

1. Cliquez sur **Settings** (en bas à gauche)
2. Allez dans **API**
3. Copiez:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

## Étape 4 : Configuration Locale

1. Copiez `.env.example` en `.env.local`
2. Collez vos clés dans le fichier `.env.local`
3. Sauvegardez

**Exemple .env.local:**
```env
VITE_SUPABASE_URL=https://abc123def456.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Étape 5 : Initialiser la Base de Données

1. Dans Supabase, allez dans **SQL Editor**
2. Créez une nouvelle requête
3. Copiez le contenu du fichier `docs/SCHEMA_SQL.sql`
4. Exécutez la requête

> Cette configuration crée une table `profiles` pour stocker le rôle (`admin`, `captain`, `spectator`) et les informations utilisateur liées à l’authentification.
> L’application utilise maintenant le `username` avec un mot de passe, sans champ `email` côté front.

## Étape 6 : Créer le premier administrateur

1. Dans Supabase, allez dans **Authentication > Users**
2. Créez un nouvel utilisateur avec un email valide (cette étape est nécessaire dans Supabase Auth, même si l’app front n’utilise que le `username`)
3. Copiez l’ID de l’utilisateur créé
4. Dans **Table Editor**, ajoutez une ligne dans `profiles` avec le même `id`, `username`, `role = 'admin'`, et `full_name`
> Note : le champ `email` n’est pas nécessaire dans la table `profiles` côté application.
## Étape 7 : Tester la Connexion

1. Dans Supabase, allez dans **SQL Editor**
2. Créez une nouvelle requête
3. Copiez le contenu du fichier `docs/SCHEMA_SQL.sql`
4. Collez-le dans l'éditeur SQL
5. Cliquez sur "Run"

✅ Les tables sont maintenant créées !

## Étape 6 : Tester la Connexion

Redémarrez l'application développement:
```bash
npm run dev
```

Vous devriez voir dans la console:
```
✓ Connexion Supabase établie
```

## 🔒 Sécurité

⚠️ **IMPORTANT :**
- Ne commitez JAMAIS `.env.local` sur Git
- La clé `anon` est publique, c'est normal
- Utilisez les Row-Level Security (RLS) pour protéger les données

## 📚 Documentation Supabase

- [Docs Supabase](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [PostgreSQL sur Supabase](https://supabase.com/docs/guides/database)

## ❓ Dépannage

**Erreur: "Clés Supabase manquantes"**
→ Vérifiez que `.env.local` existe et contient les bonnes clés

**Erreur: "Connexion refusée"**
→ Vérifiez votre URL Supabase et votre clé

**Les tables ne s'affichent pas**
→ Rechargez la page Supabase ou attendez quelques secondes
