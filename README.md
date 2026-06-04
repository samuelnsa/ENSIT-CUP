# ⚽ Plateforme de Tournoi de Football

Une application web moderne pour gérer des tournois de football scolaires, avec inscription d'équipes, gestion des matchs, compositions, tactiques et classements en temps réel.

## 🎯 Fonctionnalités

### Pour les Capitaines
- ✅ Inscription des équipes avec sélection d'écusson (50 options)
- ✅ Gestion des joueurs et leurs statistiques
- ✅ Construction des formations tactiques (4-3-3, 3-5-2, etc.)
- ✅ Suivi des matchs et résultats
- ✅ Vue des statistiques individuelles des joueurs

### Pour les Administrateurs
- ✅ Gestion complète des équipes
- ✅ Création et édition des matchs
- ✅ Attribution des buteurs et passeurs
- ✅ Gestion des classements en direct
- ✅ Vue d'ensemble du tournoi
- ✅ Disqualification/suppression d'équipes

### Infrastructure
- ✅ Backend Supabase (PostgreSQL)
- ✅ Authentification et autorisation
- ✅ Sécurité des données avec RLS (Row-Level Security)
- ✅ Base de données relationnelle complète

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- npm ou yarn
- Un compte Supabase (gratuit: https://supabase.com)

### Installation

```bash
# 1. Cloner ou télécharger le projet
cd "Plateforme de Tournoi de Foot"

# 2. Installer les dépendances
npm install

# 3. Configurer Supabase (voir guide ci-dessous)
cp .env.example .env.local
# Éditer .env.local avec vos clés Supabase

# 4. Démarrer l'app développement
npm run dev

# 5. Accéder à l'application
# Ouvrez http://localhost:5173
```

## 🗄️ Configuration Base de Données Supabase

Consultez le fichier [SETUP_SUPABASE.md](docs/SETUP_SUPABASE.md) pour les étapes détaillées.

En résumé:
1. Créer un compte Supabase
2. Créer un projet
3. Copier les clés API
4. Exécuter le script SQL (`docs/SCHEMA_SQL.sql`)
5. Configurer `.env.local`

## 📁 Structure du Projet

```
src/app/
├── components/         # Composants React réutilisables
│   ├── figma/         # Composants design system
│   ├── layout/        # Layouts (AppLayout, etc.)
│   ├── ui/            # Composants UI (buttons, dialogs, etc.)
│   └── sélecteurs/    # Sélecteurs spécialisés (écussons, etc.)
├── config/            # Configuration (Supabase)
├── context/           # Contexte React (authentification)
├── donnees/           # Données et écussons
├── hooks/             # Hooks personnalisés (useSupabase, etc.)
├── pages/             # Pages principales
│   ├── Admin.tsx
│   ├── Tableau de Bord.tsx
│   ├── Connexion.tsx
│   ├── Matchs.tsx
│   ├── Équipes.tsx
│   ├── Tactiques.tsx
│   ├── Classements.tsx
│   └── ...
├── services/          # Services API Supabase
│   ├── équipesService.ts
│   ├── joueursService.ts
│   ├── matchsService.ts
│   └── ...
└── styles/            # Styles CSS/Tailwind
```

## 🛠️ Développement

### Commandes disponibles

```bash
# Démarrer le serveur développement
npm run dev

# Construire pour production
npm run build

# Lancer localement la version production
npm run preview

# Vérifier les erreurs (ESLint, etc.)
npm run lint
```

### Traduction

Le code et les commentaires sont maintenant en **français**. Les fichiers et dossiers sont nommés en français (ex: `équipes`, `joueurs`, `tactiques`).

## 🎨 Écussons d'Équipes

50 écussons prédéfinis disponibles lors de la création d'une équipe. Consultez `src/app/donnees/écussons.ts` pour la liste complète.

Les capitaines peuvent sélectionner un écusson au moment de l'inscription, ou changer le logo plus tard.

## 🔐 Sécurité

- ✅ Authentification Supabase (JWT)
- ✅ Row-Level Security (RLS) sur les tables
- ✅ Clés API séparées (development/production)
- ✅ Variables d'environnement sécurisées

⚠️ **Important:**
- Ne commitez jamais `.env.local`
- Utilisez des permissions RLS appropriées
- Changez les clés de production régulièrement

## 📊 Schéma Base de Données

Voir `docs/SCHEMA_SQL.sql` pour le schéma complet.

Tables principales:
- `équipes` - Informations des équipes
- `joueurs` - Joueurs et leurs stats
- `matchs` - Calendrier et résultats
- `buts_matchs` - Buteurs
- `passes_matchs` - Passeurs
- `formations` - Formations tactiques
- `classements` - Classement en direct

## 🌐 Déploiement

### Vercel (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel
```

### Autres plateformes
- Netlify: `npm run build` → deploy `dist/`
- Railway: `npm run build` → deploy `dist/`
- Heroku: Voir `Procfile`

**Important:** Ajouter les variables d'environnement sur votre plateforme:
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## 📚 Documentation

- [Guide Supabase](docs/SETUP_SUPABASE.md)
- [Schéma SQL](docs/SCHEMA_SQL.sql)
- [Règles de Nommage](docs/CONVENTIONS.md)

## 🐛 Dépannage

**"Erreur: Clés Supabase manquantes"**
→ Vérifiez que `.env.local` existe et contient `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`

**"Erreur de connexion à la base"**
→ Vérifiez votre URL Supabase et votre clé dans le dashboard

**"Page blanche après le build"**
→ Vérifiez la console du navigateur (F12) pour les erreurs

## 📱 Responsive

L'application est entièrement responsive:
- 📱 Mobile (< 640px)
- 📱 Tablet (640px - 1024px)
- 💻 Desktop (> 1024px)

## 🎓 Apprentissage

Technologies utilisées:
- **React 18** - Framework UI
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styles utilitaires
- **Vite** - Build tool
- **Supabase** - Backend & Base de données
- **React Router** - Navigation

## 📝 Licence

Projet scolaire - Libre d'utilisation

## ✨ Contributeurs

- Équipe de développement - 2026

---

**Besoin d'aide?** Consultez la [documentation Supabase](https://supabase.com/docs) ou posez une question!
