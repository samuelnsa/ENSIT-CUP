-- =====================================================
-- CORRECTIF RLS ADMIN — Exécuter dans Supabase SQL Editor
-- IMPORTANT : Copiez chaque bloc séparément et cliquez RUN
-- =====================================================

-- ── BLOC 1 : Supprimer les anciennes policies ────────
-- Copiez ce bloc, collez dans SQL Editor, cliquez RUN

DROP POLICY IF EXISTS "Capitaines mettent à jour leur équipe" ON "équipes";
DROP POLICY IF EXISTS "Admins suppriment équipes" ON "équipes";
DROP POLICY IF EXISTS "Capitaines créent des équipes" ON "équipes";
DROP POLICY IF EXISTS "Admin ou capitaine peuvent créer des équipes" ON "équipes";
DROP POLICY IF EXISTS "Admin ou capitaine peuvent modifier leurs équipes" ON "équipes";
DROP POLICY IF EXISTS "Admin peut supprimer des équipes" ON "équipes";

-- ── BLOC 2 : Policy INSERT ───────────────────────────
-- Copiez ce bloc seul, collez, cliquez RUN

CREATE POLICY "Admin ou capitaine peuvent créer des équipes" ON "équipes"
  FOR INSERT WITH CHECK (
    auth.email() = 'admin_tournoi@tournoi-foot.com'
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('captain', 'admin'))
  );

-- ── BLOC 3 : Policy UPDATE ───────────────────────────
-- Copiez ce bloc seul, collez, cliquez RUN

CREATE POLICY "Admin ou capitaine peuvent modifier leurs équipes" ON "équipes"
  FOR UPDATE USING (
    auth.email() = 'admin_tournoi@tournoi-foot.com'
    OR capitaine_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── BLOC 4 : Policy DELETE ───────────────────────────
-- Copiez ce bloc seul, collez, cliquez RUN

CREATE POLICY "Admin peut supprimer des équipes" ON "équipes"
  FOR DELETE USING (
    auth.email() = 'admin_tournoi@tournoi-foot.com'
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── BLOC 5 : Vérification ────────────────────────────
-- Copiez ce bloc seul pour voir les policies actives

SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'équipes'
ORDER BY policyname;
