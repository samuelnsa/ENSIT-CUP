-- Schéma SQL pour la Plateforme de Tournoi de Foot
-- À exécuter dans Supabase SQL Editor

-- =====================================================
-- TABLE: PROFILES
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'captain')),
  class_name TEXT,
  team_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: ÉQUIPES
-- =====================================================
CREATE TABLE IF NOT EXISTS "équipes" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(255) NOT NULL UNIQUE,
  classe VARCHAR(50) NOT NULL,
  logo TEXT,
  "écusson_id" VARCHAR(50),
  description TEXT,
  capitaine_id UUID,
  code_acces VARCHAR(50),
  statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'disqualifié', 'suspendu')),
  "date_création" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: JOUEURS
-- =====================================================
CREATE TABLE IF NOT EXISTS joueurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(255) NOT NULL,
  "numéro" INTEGER NOT NULL,
  poste VARCHAR(50) NOT NULL,
  "équipe_id" UUID NOT NULL,
  buts INTEGER DEFAULT 0,
  "passes_décisives" INTEGER DEFAULT 0,
  apparitions INTEGER DEFAULT 0,
  date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("équipe_id") REFERENCES "équipes"(id) ON DELETE CASCADE,
  UNIQUE("équipe_id", "numéro")
);

-- =====================================================
-- TABLE: MATCHS
-- =====================================================
CREATE TABLE IF NOT EXISTS matchs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "équipe_a_id" UUID NOT NULL,
  "équipe_b_id" UUID NOT NULL,
  score_a INTEGER,
  score_b INTEGER,
  durée VARCHAR(50) DEFAULT '90',
  statut VARCHAR(20) DEFAULT 'à_venir' CHECK (statut IN ('à_venir', 'en_cours', 'terminé')),
  date VARCHAR(20) NOT NULL,
  heure VARCHAR(10) NOT NULL,
  lieu VARCHAR(255),
  "date_création" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("équipe_a_id") REFERENCES "équipes"(id) ON DELETE CASCADE,
  FOREIGN KEY ("équipe_b_id") REFERENCES "équipes"(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE: BUTS_MATCHS
-- =====================================================
CREATE TABLE IF NOT EXISTS buts_matchs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL,
  joueur_id UUID NOT NULL,
  minute INTEGER NOT NULL,
  "équipe" VARCHAR(1) NOT NULL CHECK ("équipe" IN ('A', 'B')),
  "date_création" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matchs(id) ON DELETE CASCADE,
  FOREIGN KEY (joueur_id) REFERENCES joueurs(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE: PASSES_MATCHS
-- =====================================================
CREATE TABLE IF NOT EXISTS passes_matchs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL,
  joueur_id UUID NOT NULL,
  minute INTEGER NOT NULL,
  "équipe" VARCHAR(1) NOT NULL CHECK ("équipe" IN ('A', 'B')),
  "date_création" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matchs(id) ON DELETE CASCADE,
  FOREIGN KEY (joueur_id) REFERENCES joueurs(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE: FORMATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "équipe_id" UUID NOT NULL UNIQUE,
  formation VARCHAR(50) NOT NULL,
  configuration JSONB,
  date_sauvegarde TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("équipe_id") REFERENCES "équipes"(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE: CLASSEMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS classements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "équipe_id" UUID NOT NULL,
  position INTEGER,
  matchs_joués INTEGER DEFAULT 0,
  victoires INTEGER DEFAULT 0,
  nuls INTEGER DEFAULT 0,
  défaites INTEGER DEFAULT 0,
  buts_pour INTEGER DEFAULT 0,
  buts_contre INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  "date_mise_à_jour" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("équipe_id") REFERENCES "équipes"(id) ON DELETE CASCADE,
  UNIQUE("équipe_id")
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_équipes_statut ON "équipes"(statut);
CREATE INDEX IF NOT EXISTS idx_équipes_classe ON "équipes"(classe);
CREATE INDEX IF NOT EXISTS idx_joueurs_équipe ON joueurs("équipe_id");
CREATE INDEX IF NOT EXISTS idx_joueurs_numéro ON joueurs("numéro");
CREATE INDEX IF NOT EXISTS idx_matchs_équipe_a ON matchs("équipe_a_id");
CREATE INDEX IF NOT EXISTS idx_matchs_équipe_b ON matchs("équipe_b_id");
CREATE INDEX IF NOT EXISTS idx_matchs_statut ON matchs(statut);
CREATE INDEX IF NOT EXISTS idx_matchs_date ON matchs(date);
CREATE INDEX IF NOT EXISTS idx_buts_match ON buts_matchs(match_id);
CREATE INDEX IF NOT EXISTS idx_buts_joueur ON buts_matchs(joueur_id);
CREATE INDEX IF NOT EXISTS idx_passes_match ON passes_matchs(match_id);
CREATE INDEX IF NOT EXISTS idx_passes_joueur ON passes_matchs(joueur_id);
CREATE INDEX IF NOT EXISTS idx_formations_équipe ON formations("équipe_id");
CREATE INDEX IF NOT EXISTS idx_classements_position ON classements(position);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE "équipes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE joueurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchs ENABLE ROW LEVEL SECURITY;
ALTER TABLE buts_matchs ENABLE ROW LEVEL SECURITY;
ALTER TABLE passes_matchs ENABLE ROW LEVEL SECURITY;
ALTER TABLE formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE classements ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
CREATE POLICY IF NOT EXISTS "Profils lisibles par tous" ON profiles FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Insertion de son propre profil" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Mise à jour de son profil" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Équipes
CREATE POLICY IF NOT EXISTS "Équipes lisibles par tous" ON "équipes" FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Capitaines créent des équipes" ON "équipes" FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('captain', 'admin'))
);
CREATE POLICY IF NOT EXISTS "Capitaines mettent à jour leur équipe" ON "équipes" FOR UPDATE USING (
  capitaine_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY IF NOT EXISTS "Admins suppriment équipes" ON "équipes" FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. Joueurs
CREATE POLICY IF NOT EXISTS "Joueurs lisibles par tous" ON joueurs FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Capitaines gèrent leurs joueurs" ON joueurs FOR ALL USING (
  EXISTS (SELECT 1 FROM "équipes" WHERE id = joueurs."équipe_id" AND capitaine_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Matchs
CREATE POLICY IF NOT EXISTS "Matchs lisibles par tous" ON matchs FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Admins créent matchs" ON matchs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY IF NOT EXISTS "Admins modifient matchs" ON matchs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY IF NOT EXISTS "Admins suppriment matchs" ON matchs FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 5. Stats (Buts & Passes)
CREATE POLICY IF NOT EXISTS "Buts lisibles par tous" ON buts_matchs FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Admins créent buts" ON buts_matchs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY IF NOT EXISTS "Admins modifient buts" ON buts_matchs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY IF NOT EXISTS "Admins suppriment buts" ON buts_matchs FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY IF NOT EXISTS "Passes lisibles par tous" ON passes_matchs FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Admins créent passes" ON passes_matchs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY IF NOT EXISTS "Admins modifient passes" ON passes_matchs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY IF NOT EXISTS "Admins suppriment passes" ON passes_matchs FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 6. Formations
CREATE POLICY IF NOT EXISTS "Formations lisibles par tous" ON formations FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Capitaines gèrent leurs formations" ON formations FOR ALL USING (
  EXISTS (SELECT 1 FROM "équipes" WHERE id = formations."équipe_id" AND capitaine_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 7. Classements
CREATE POLICY IF NOT EXISTS "Classements lisibles par tous" ON classements FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Admins gèrent classements" ON classements FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =====================================================
-- CONTRAINTES ET TRIGGERS (UPDATED_AT)
-- =====================================================

-- Ajouter les FK manquantes (idempotent via DO $$)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_capitaine'
  ) THEN
    ALTER TABLE "équipes" ADD CONSTRAINT fk_capitaine FOREIGN KEY (capitaine_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_team'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES "équipes"(id) ON DELETE SET NULL;
  END IF;
END;
$$;

-- Fonction pour mettre à jour automatiquement 'updated_at'
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_profiles_modtime ON profiles;
DROP TRIGGER IF EXISTS update_équipes_modtime ON "équipes";
DROP TRIGGER IF EXISTS update_joueurs_modtime ON joueurs;
DROP TRIGGER IF EXISTS update_matchs_modtime ON matchs;
DROP TRIGGER IF EXISTS update_formations_modtime ON formations;

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_équipes_modtime BEFORE UPDATE ON "équipes" FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_joueurs_modtime BEFORE UPDATE ON joueurs FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_matchs_modtime BEFORE UPDATE ON matchs FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_formations_modtime BEFORE UPDATE ON formations FOR EACH ROW EXECUTE FUNCTION update_modified_column();
