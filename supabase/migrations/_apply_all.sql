-- Lie un patient Ã  son soignant rÃ©fÃ©rent choisi lors de l'inscription
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS soignant_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Index pour accÃ©lÃ©rer la requÃªte "mes patients" cÃ´tÃ© soignant
CREATE INDEX IF NOT EXISTS idx_profiles_soignant_id ON profiles(soignant_id);


-- Fix messages table: add columns expected by Chat.tsx
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS content        text,
  ADD COLUMN IF NOT EXISTS receiver_id    uuid REFERENCES profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_read        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS message_type   text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio')),
  ADD COLUMN IF NOT EXISTS media_url      text,
  ADD COLUMN IF NOT EXISTS duration       int,
  ADD COLUMN IF NOT EXISTS expires_at     timestamptz;

CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender   ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_expires  ON messages(expires_at) WHERE expires_at IS NOT NULL;

-- RLS on messages: sender and receiver can read/write
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Voir ses messages" ON messages;
CREATE POLICY "Voir ses messages" ON messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

DROP POLICY IF EXISTS "Envoyer un message" ON messages;
CREATE POLICY "Envoyer un message" ON messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Marquer lu" ON messages;
CREATE POLICY "Marquer lu" ON messages FOR UPDATE TO authenticated
  USING (receiver_id = auth.uid() OR sender_id = auth.uid());

DROP POLICY IF EXISTS "Supprimer expires" ON messages;
CREATE POLICY "Supprimer expires" ON messages FOR DELETE TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- groups table (used by Chat.tsx, separate from groupes used by Community)
CREATE TABLE IF NOT EXISTS groups (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         varchar(100) NOT NULL,
  description  text,
  category     varchar(50),
  member_count int DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Voir les groupes" ON groups;
CREATE POLICY "Voir les groupes" ON groups FOR SELECT TO authenticated USING (true);

-- posts table (group messages in Chat.tsx)
CREATE TABLE IF NOT EXISTS posts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  content      text NOT NULL,
  is_anonymous boolean DEFAULT true,
  likes_count  int DEFAULT 0,
  author_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Voir les posts" ON posts;
CREATE POLICY "Voir les posts" ON posts FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Publier un post" ON posts;
CREATE POLICY "Publier un post" ON posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());

-- friendships table (pair-to-pair contacts in Chat.tsx)
CREATE TABLE IF NOT EXISTS friendships (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  addressee_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status       text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at   timestamptz DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Voir ses amis" ON friendships;
CREATE POLICY "Voir ses amis" ON friendships FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());
DROP POLICY IF EXISTS "Envoyer demande" ON friendships;
CREATE POLICY "Envoyer demande" ON friendships FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());
DROP POLICY IF EXISTS "Accepter demande" ON friendships;
CREATE POLICY "Accepter demande" ON friendships FOR UPDATE TO authenticated
  USING (addressee_id = auth.uid());

-- reports table (message reporting in Chat.tsx)
CREATE TABLE IF NOT EXISTS reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  message_id  uuid REFERENCES messages(id) ON DELETE CASCADE,
  reason      text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Signaler un message" ON reports;
CREATE POLICY "Signaler un message" ON reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());


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

-- Copier pseudonyme â†’ pseudo si la colonne existe et pseudo est vide
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'pseudonyme'
  ) THEN
    UPDATE profiles SET pseudo = pseudonyme WHERE pseudo IS NULL;
  END IF;
END $$;

-- Index de recherche soignant (filtre frÃ©quent)
CREATE INDEX IF NOT EXISTS idx_profiles_is_soignant  ON profiles(is_soignant);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified  ON profiles(is_soignant, is_verified) WHERE is_soignant = true;

-- ============================================================
-- Fix 2 : RLS pour soignant_id
-- Seul le propriÃ©taire du profil peut modifier son soignant_id.
-- Un soignant ne peut pas s'auto-assigner des patients.
-- ============================================================
DROP POLICY IF EXISTS "Modifier son propre profil" ON profiles;
CREATE POLICY "Modifier son propre profil" ON profiles
  FOR UPDATE TO authenticated
  USING  (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- Fix 3 : Table mood_logs (le code utilise mood_logs,
-- la migration purple_lagoon crÃ©e mood_entries â€” on crÃ©e
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
-- Fix 4 : Tables manquantes utilisÃ©es dans Profile.tsx /
-- Tracking.tsx mais jamais crÃ©Ã©es.
-- ============================================================

-- Documents mÃ©dicaux du patient
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

-- Bilans de santÃ© (CD4, charge virale, poidsâ€¦)
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
DROP POLICY IF EXISTS "Soignant crÃ©e rdv" ON appointments;
CREATE POLICY "Soignant crÃ©e rdv" ON appointments FOR INSERT TO authenticated
  WITH CHECK (soignant_id = auth.uid());
DROP POLICY IF EXISTS "Soignant modifie rdv" ON appointments;
CREATE POLICY "Soignant modifie rdv" ON appointments FOR UPDATE TO authenticated
  USING (soignant_id = auth.uid() OR patient_id = auth.uid());

-- MÃ©dicaments / rappels ARV
CREATE TABLE IF NOT EXISTS medications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name          text NOT NULL,
  reminder_time time,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Voir ses mÃ©dicaments" ON medications;
CREATE POLICY "Voir ses mÃ©dicaments" ON medications FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

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
DROP POLICY IF EXISTS "Patient crÃ©e demande" ON soignant_requests;
CREATE POLICY "Patient crÃ©e demande" ON soignant_requests FOR INSERT TO authenticated
  WITH CHECK (patient_id = auth.uid());
DROP POLICY IF EXISTS "Soignant rÃ©pond demande" ON soignant_requests;
CREATE POLICY "Soignant rÃ©pond demande" ON soignant_requests FOR UPDATE TO authenticated
  USING (soignant_id = auth.uid());

