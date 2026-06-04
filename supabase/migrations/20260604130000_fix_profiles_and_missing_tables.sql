-- ============================================================
-- Fix 1 : Colonnes manquantes dans profiles
-- La migration purple_lagoon utilise pseudonyme/language/role
-- mais tout le code utilise pseudo/langue/is_soignant.
-- On ajoute les colonnes attendues par le code.
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pseudo        varchar(50),
  ADD COLUMN IF NOT EXISTS is_soignant   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_verified   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS specialite    varchar(100),
  ADD COLUMN IF NOT EXISTS cta_id        varchar(100),
  ADD COLUMN IF NOT EXISTS langue        varchar(5) DEFAULT 'fr',
  ADD COLUMN IF NOT EXISTS contact_phone varchar(20),
  ADD COLUMN IF NOT EXISTS region        varchar(100);

-- Copier pseudonyme → pseudo si la colonne existe et pseudo est vide
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'pseudonyme'
  ) THEN
    UPDATE profiles SET pseudo = pseudonyme WHERE pseudo IS NULL;
  END IF;
END $$;

-- Index de recherche soignant (filtre fréquent)
CREATE INDEX IF NOT EXISTS idx_profiles_is_soignant  ON profiles(is_soignant);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified  ON profiles(is_soignant, is_verified) WHERE is_soignant = true;

-- ============================================================
-- Fix 2 : RLS pour soignant_id
-- Seul le propriétaire du profil peut modifier son soignant_id.
-- Un soignant ne peut pas s'auto-assigner des patients.
-- ============================================================
DROP POLICY IF EXISTS "Modifier son propre profil" ON profiles;
CREATE POLICY "Modifier son propre profil" ON profiles
  FOR UPDATE TO authenticated
  USING  (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- Fix 3 : Table mood_logs (le code utilise mood_logs,
-- la migration purple_lagoon crée mood_entries — on crée
-- mood_logs pour le code actuel).
-- ============================================================
CREATE TABLE IF NOT EXISTS mood_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  mood       text NOT NULL,
  note       text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mood_logs_user ON mood_logs(user_id, created_at DESC);

ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Voir ses humeurs" ON mood_logs;
CREATE POLICY "Voir ses humeurs" ON mood_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Ajouter une humeur" ON mood_logs;
CREATE POLICY "Ajouter une humeur" ON mood_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Soignant peut lire les humeurs de ses patients
DROP POLICY IF EXISTS "Soignant lit humeurs patients" ON mood_logs;
CREATE POLICY "Soignant lit humeurs patients" ON mood_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = mood_logs.user_id
        AND p.soignant_id = auth.uid()
    )
  );

-- ============================================================
-- Fix 4 : Tables manquantes utilisées dans Profile.tsx /
-- Tracking.tsx mais jamais créées.
-- ============================================================

-- Documents médicaux du patient
CREATE TABLE IF NOT EXISTS user_documents (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name     text NOT NULL,
  type     text,
  doc_date date,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Voir ses documents" ON user_documents;
CREATE POLICY "Voir ses documents" ON user_documents FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Bilans de santé (CD4, charge virale, poids…)
CREATE TABLE IF NOT EXISTS health_records (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  record_date date,
  cd4         integer,
  viral_load  text,
  weight      numeric(5,2),
  note        text,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Voir ses bilans" ON health_records;
CREATE POLICY "Voir ses bilans" ON health_records FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Rendez-vous
CREATE TABLE IF NOT EXISTS appointments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  soignant_id      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  appointment_date timestamptz NOT NULL,
  cta_name         text,
  notes            text,
  status           text DEFAULT 'planifie' CHECK (status IN ('planifie', 'confirme', 'annule', 'effectue')),
  created_at       timestamptz DEFAULT now()
);
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Patient voit ses rdv" ON appointments;
CREATE POLICY "Patient voit ses rdv" ON appointments FOR SELECT TO authenticated
  USING (patient_id = auth.uid() OR soignant_id = auth.uid());
DROP POLICY IF EXISTS "Soignant crée rdv" ON appointments;
CREATE POLICY "Soignant crée rdv" ON appointments FOR INSERT TO authenticated
  WITH CHECK (soignant_id = auth.uid());
DROP POLICY IF EXISTS "Soignant modifie rdv" ON appointments;
CREATE POLICY "Soignant modifie rdv" ON appointments FOR UPDATE TO authenticated
  USING (soignant_id = auth.uid() OR patient_id = auth.uid());

-- Médicaments / rappels ARV
CREATE TABLE IF NOT EXISTS medications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name          text NOT NULL,
  reminder_time time,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Voir ses médicaments" ON medications;
CREATE POLICY "Voir ses médicaments" ON medications FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Suivi du poids
CREATE TABLE IF NOT EXISTS weight_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  weight     numeric(5,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Voir son poids" ON weight_logs;
CREATE POLICY "Voir son poids" ON weight_logs FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- Fix 5 : Table soignant_requests (demande de suivi quand
-- le soignant n'est pas encore inscrit)
-- ============================================================
CREATE TABLE IF NOT EXISTS soignant_requests (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id     uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  soignant_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  soignant_email varchar(255),
  message        text,
  status         text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at     timestamptz DEFAULT now(),
  responded_at   timestamptz
);
ALTER TABLE soignant_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Patient voit ses demandes" ON soignant_requests;
CREATE POLICY "Patient voit ses demandes" ON soignant_requests FOR SELECT TO authenticated
  USING (patient_id = auth.uid() OR soignant_id = auth.uid());
DROP POLICY IF EXISTS "Patient crée demande" ON soignant_requests;
CREATE POLICY "Patient crée demande" ON soignant_requests FOR INSERT TO authenticated
  WITH CHECK (patient_id = auth.uid());
DROP POLICY IF EXISTS "Soignant répond demande" ON soignant_requests;
CREATE POLICY "Soignant répond demande" ON soignant_requests FOR UPDATE TO authenticated
  USING (soignant_id = auth.uid());
