-- Lie un patient à son soignant référent choisi lors de l'inscription
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS soignant_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Index pour accélérer la requête "mes patients" côté soignant
CREATE INDEX IF NOT EXISTS idx_profiles_soignant_id ON profiles(soignant_id);
