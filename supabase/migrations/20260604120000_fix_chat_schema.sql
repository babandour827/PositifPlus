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
