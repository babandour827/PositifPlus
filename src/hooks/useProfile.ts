import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const CACHE_KEY = "pp_profile_cache";

export interface Profile {
  id: string;
  pseudo: string;
  avatar_url?: string;
  bio?: string;
  cta_id?: string;
  region?: string;
  langue?: string;
  is_soignant: boolean;
  is_verified: boolean;
  specialite?: string;
}

export function useProfile() {
  const cached: Profile | null = (() => {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); } catch { return null; }
  })();

  const [profile, setProfile] = useState<Profile | null>(cached);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { setLoading(false); return; }
      supabase.from("profiles").select("*").eq("id", data.user.id).single()
        .then(({ data: p }) => {
          if (p) {
            setProfile(p as Profile);
            localStorage.setItem(CACHE_KEY, JSON.stringify(p));
          }
          setLoading(false);
        }).catch(() => setLoading(false));
    });
  }, []);

  function invalidate() {
    localStorage.removeItem(CACHE_KEY);
  }

  return {
    profile,
    loading,
    isSoignant: profile?.is_soignant === true,
    invalidate,
  };
}
