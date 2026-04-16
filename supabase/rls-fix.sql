-- ============================================================
-- POSITIF+ — Correctifs RLS pour production
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. GROUPES : lecture publique (tous les utilisateurs authentifiés voient les groupes)
DROP POLICY IF EXISTS "groups_select_all" ON public.groups;
CREATE POLICY "groups_select_all" ON public.groups
  FOR SELECT USING (auth.role() = 'authenticated' OR true);

-- 2. POSTS : lecture publique des posts communautaires
DROP POLICY IF EXISTS "posts_select" ON public.posts;
CREATE POLICY "posts_select" ON public.posts
  FOR SELECT USING (true);

-- 3. POSTS : insertion — l'auteur doit être authentifié
DROP POLICY IF EXISTS "posts_insert" ON public.posts;
CREATE POLICY "posts_insert" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = author_id);

-- 4. PROFILES : lecture des profils soignants (pour la messagerie)
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

-- 5. PROFILES : insert et update seulement pour le propriétaire
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 6. MESSAGES : accès propre
DROP POLICY IF EXISTS "messages_select" ON public.messages;
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "messages_insert" ON public.messages;
CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 7. Activer realtime sur les tables nécessaires (à faire dans le dashboard Supabase)
-- Database > Replication > Activer pour : posts, messages, notifications

SELECT 'RLS Positif+ corrigé avec succès !' AS status;
