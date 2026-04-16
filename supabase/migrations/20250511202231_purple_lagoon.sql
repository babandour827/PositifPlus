/*
  # Positif+ Database Schema
  
  Tables:
    - profiles (user profiles with anonymity)
    - groupes (community discussion groups)
    - groupe_membres (group membership)
    - messages (encrypted messages)
    - conversations (patient-soignant private chats)
    - articles (verified health information)
    - rappels (discrete medication reminders)
    - mood_entries (mood tracking)
    - ai_conversations (AI chat history)
    - ai_messages (AI chat messages)
  
  Security:
    - RLS enabled on all tables
    - Users can only access their own data
*/

-- Profiles table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  pseudonyme varchar(50) UNIQUE NOT NULL,
  avatar_url text,
  role text NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'soignant', 'mediateur', 'admin')),
  structure varchar(100),
  is_available boolean DEFAULT false,
  language varchar(5) DEFAULT 'fr',
  notification_settings jsonb DEFAULT '{"groupMessages": true, "directMessages": true, "resourceUpdates": true, "medicationReminders": true, "moodTracking": true}'::jsonb,
  accessibility_settings jsonb DEFAULT '{"fontSize": "normal", "highContrast": false, "screenReader": false}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Groups for community discussions
CREATE TABLE IF NOT EXISTS groupes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom varchar(100) NOT NULL,
  description text,
  thematique varchar(50),
  mediateur_id uuid REFERENCES profiles(id),
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Group membership (n..n)
CREATE TABLE IF NOT EXISTS groupe_membres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  groupe_id uuid REFERENCES groupes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(groupe_id, user_id)
);

-- Messages (encrypted content)
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contenu_chiffre text NOT NULL,
  sender_id uuid REFERENCES profiles(id) NOT NULL,
  groupe_id uuid REFERENCES groupes(id) ON DELETE CASCADE,
  conversation_id uuid,
  type text DEFAULT 'text' CHECK (type IN ('text', 'image', 'audio')),
  created_at timestamptz DEFAULT now()
);

-- Private conversations (patient <-> soignant)
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES profiles(id) NOT NULL,
  soignant_id uuid REFERENCES profiles(id) NOT NULL,
  statut text DEFAULT 'active' CHECK (statut IN ('active', 'fermee')),
  urgence text DEFAULT 'normale' CHECK (urgence IN ('normale', 'urgente')),
  created_at timestamptz DEFAULT now()
);

-- Add FK constraint on messages.conversation_id
ALTER TABLE messages ADD CONSTRAINT fk_messages_conversation 
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

-- Articles (verified health information)
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre varchar(200) NOT NULL,
  contenu text NOT NULL,
  auteur_id uuid REFERENCES profiles(id),
  categorie varchar(50),
  statut text DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'publie', 'archive')),
  image_url text,
  tags text[],
  published_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Medication reminders (discrete)
CREATE TABLE IF NOT EXISTS rappels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  libelle_discret varchar(100) NOT NULL DEFAULT 'Rappel',
  heure time NOT NULL,
  frequence text DEFAULT 'quotidien' CHECK (frequence IN ('quotidien', 'hebdomadaire', 'mensuel')),
  actif boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Mood tracking
CREATE TABLE IF NOT EXISTS mood_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  mood text NOT NULL CHECK (mood IN ('veryGood', 'good', 'neutral', 'bad', 'veryBad')),
  note text,
  created_at timestamptz DEFAULT now()
);

-- AI conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title text NOT NULL DEFAULT 'Nouvelle conversation',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI messages
CREATE TABLE IF NOT EXISTS ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES ai_conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- =========================================
-- ROW LEVEL SECURITY
-- =========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groupes ENABLE ROW LEVEL SECURITY;
ALTER TABLE groupe_membres ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rappels ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles but only update their own
CREATE POLICY "Lire tous les profils" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Modifier son propre profil" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Creer son profil" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Groups: all authenticated users can read groups
CREATE POLICY "Lire les groupes" ON groupes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Creer un groupe (mediateur/admin)" ON groupes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('mediateur', 'admin')));

-- Group members
CREATE POLICY "Lire les membres" ON groupe_membres FOR SELECT TO authenticated USING (true);
CREATE POLICY "Rejoindre un groupe" ON groupe_membres FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Quitter un groupe" ON groupe_membres FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Messages: only read messages from own groups/conversations
CREATE POLICY "Lire messages de ses groupes" ON messages FOR SELECT TO authenticated
  USING (
    groupe_id IN (SELECT groupe_id FROM groupe_membres WHERE user_id = auth.uid())
    OR conversation_id IN (SELECT id FROM conversations WHERE patient_id = auth.uid() OR soignant_id = auth.uid())
  );
CREATE POLICY "Envoyer un message" ON messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

-- Conversations
CREATE POLICY "Voir ses conversations" ON conversations FOR SELECT TO authenticated
  USING (patient_id = auth.uid() OR soignant_id = auth.uid());
CREATE POLICY "Creer une conversation" ON conversations FOR INSERT TO authenticated
  WITH CHECK (patient_id = auth.uid());

-- Articles: all can read published, soignants/admins can write
CREATE POLICY "Lire articles publies" ON articles FOR SELECT TO authenticated USING (statut = 'publie');
CREATE POLICY "Gerer articles" ON articles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('soignant', 'admin')));

-- Rappels: only own reminders
CREATE POLICY "Gerer ses rappels" ON rappels FOR ALL TO authenticated USING (patient_id = auth.uid());

-- Mood entries: only own entries
CREATE POLICY "Gerer son humeur" ON mood_entries FOR ALL TO authenticated USING (user_id = auth.uid());

-- AI conversations: only own
CREATE POLICY "Gerer ses conversations IA" ON ai_conversations FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Gerer ses messages IA" ON ai_messages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM ai_conversations WHERE ai_conversations.id = conversation_id AND ai_conversations.user_id = auth.uid()));

-- =========================================
-- REALTIME (enable for messages)
-- =========================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- =========================================
-- SEED DATA (default groups)
-- =========================================
INSERT INTO groupes (nom, description, thematique) VALUES
  ('Observance & Traitement', 'Partagez vos expériences sur le traitement ARV, les effets secondaires et les astuces du quotidien.', 'traitement'),
  ('Bien-être & Nutrition', 'Conseils nutrition, exercice physique et bien-être pour vivre mieux au quotidien.', 'bien-etre'),
  ('Vie quotidienne', 'Échangez sur la gestion de la maladie au travail, en famille et dans la société.', 'quotidien'),
  ('Témoignages & Espoir', 'Un espace pour partager vos parcours, vos victoires et vous encourager mutuellement.', 'temoignage'),
  ('Droits & Protection', 'Informez-vous sur vos droits en tant que PVVIH au Sénégal (Loi n° 2010-03).', 'droits')
ON CONFLICT DO NOTHING;
