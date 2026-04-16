import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";
import { supabase } from "../../lib/supabaseClient";

export function AuthGuard() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthenticated(!!data.session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div className="mx-auto w-full max-w-md h-[100dvh] bg-white flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#FF6B6B]/20 border-t-[#FF6B6B] rounded-full animate-spin" />
    </div>
  );

  if (!authenticated) return <Navigate to="/auth" replace />;

  if (!localStorage.getItem("pp_onboarded")) return <Navigate to="/onboarding" replace />;

  return <Outlet />;
}
