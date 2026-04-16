import { Outlet, NavLink, useLocation, useNavigate } from "react-router";
import { Home, Users, HeartPulse, BookOpen, User, Phone, Bell, ChevronLeft, Flame } from "lucide-react";
import { cn } from "../../lib/utils";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useStreak } from "../../hooks/useStreak";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isProfile = location.pathname === "/app/profile";
  // Chat garde le mode plein écran (interface messagerie) — AIAssistant récupère le header normal
  const isFullscreen = ["/app/chat"].includes(location.pathname);
  const [pseudo, setPseudo] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const { streak } = useStreak();

  // Pages avec bouton retour
  const BACK_ROUTES: Record<string, { label: string; to: string }> = {
    "/app/notifications": { label: "Retour", to: "/app" },
    "/app/ai-assistant":  { label: "Retour", to: "/app" },
  };
  const backInfo = BACK_ROUTES[location.pathname];

  useEffect(() => {
    let channel: any = null;

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { setPseudo("vous"); return; }
      const uid = data.user.id;

      supabase.from("profiles").select("pseudo").eq("id", uid).single()
        .then(({ data: p }) => setPseudo(p?.pseudo || data.user.email?.split("@")[0] || "vous"))
        .catch(() => setPseudo(data.user.email?.split("@")[0] || "vous"));

      supabase.from("notifications").select("id", { count: "exact", head: true })
        .eq("user_id", uid).eq("is_read", false)
        .then(({ count }) => setUnreadCount(count || 0))
        .catch(() => {});

      channel = supabase.channel("layout-notifs-" + uid)
        .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
          supabase.from("notifications").select("id", { count: "exact", head: true })
            .eq("user_id", uid).eq("is_read", false)
            .then(({ count }) => setUnreadCount(count || 0)).catch(() => {});
        }).subscribe();
    });

    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="mx-auto w-full max-w-md h-[100dvh] bg-gray-50 flex flex-col relative overflow-hidden font-sans sm:shadow-2xl sm:border sm:border-gray-200 sm:rounded-[2.5rem]">

      {/* Bannière Gindima */}
      <div className="bg-[#FF6B6B] text-white px-4 py-2.5 flex items-center justify-between shadow-sm z-50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1 rounded-full animate-pulse">
            <Phone className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-xs tracking-wide">Ligne Gindima · 800 00 30 30</span>
        </div>
        <a href="tel:80000030 30" className="text-white/90 text-[10px] font-bold bg-black/15 px-2 py-0.5 rounded-full">
          Appeler
        </a>
      </div>

      {/* Header principal */}
      {!isProfile && !isFullscreen && (
        <header className="px-4 py-3 bg-white shadow-[0_4px_20px_-10px_rgba(0,0,0,0.06)] flex items-center justify-between shrink-0 z-40 relative rounded-b-3xl">
          {backInfo ? (
            <button
              onClick={() => navigate(backInfo.to)}
              className="flex items-center gap-1 text-[#FF6B6B] font-bold text-sm"
            >
              <ChevronLeft className="w-5 h-5" /> {backInfo.label}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B6B] to-[#FF9F43] rounded-xl flex items-center justify-center shadow-md shadow-[#FF6B6B]/20">
                <span className="text-white font-black text-xl leading-none tracking-tighter">P+</span>
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-800 leading-tight">
                  Positif<span className="text-[#10AC84]">+</span>
                </h1>
                <p className="text-[11px] text-gray-500 font-medium">
                  Bonjour{pseudo ? `, ${pseudo}` : ""}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Flamme streak */}
            <div className={cn(
              "flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-black transition-all",
              streak >= 7 ? "bg-orange-100 text-orange-600" :
              streak >= 3 ? "bg-amber-50 text-amber-600" :
              "bg-gray-100 text-gray-500"
            )}>
              <Flame className={cn("w-3.5 h-3.5", streak >= 3 ? "fill-current" : "")} />
              <span>{streak}</span>
            </div>

            {/* Cloche */}
            <Link to="/app/notifications" className="relative p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] bg-[#FF6B6B] rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black text-white px-0.5">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </header>
      )}

      {/* Contenu */}
      <main className="flex-1 overflow-y-auto pb-24 relative z-0">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      {!isFullscreen && (
        <nav className="absolute bottom-0 left-0 right-0 bg-white shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.1)] pb-4 rounded-t-[2rem] z-50 border-t border-gray-100">
          <div className="flex justify-around items-center px-2 py-3 relative">
            <NavItem to="/app" icon={Home} label="Accueil" end />
            <NavItem to="/app/community" icon={Users} label="Communauté" />
            <div className="relative -top-6">
              <NavLink
                to="/app/tracking"
                className={({ isActive }) => cn(
                  "flex flex-col items-center justify-center w-14 h-14 rounded-full shadow-lg shadow-[#1DD1A1]/30 transition-all duration-300 border-4 border-gray-50",
                  isActive ? "bg-[#10AC84] scale-110" : "bg-[#1DD1A1] hover:scale-105"
                )}
              >
                <HeartPulse className="w-6 h-6 text-white" strokeWidth={2.5} />
              </NavLink>
              <span className="text-[10px] font-medium text-gray-400 absolute -bottom-4 w-full text-center tracking-tight">Suivi</span>
            </div>
            <NavItem to="/app/resources" icon={BookOpen} label="Ressources" />
            <NavItem to="/app/profile" icon={User} label="Profil" />
          </div>
        </nav>
      )}
    </div>
  );
}

function NavItem({ to, icon: Icon, label, end }: { to: string; icon: any; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => cn(
        "flex flex-col items-center justify-center w-16 gap-1 transition-all duration-300 group pt-2",
        isActive ? "text-[#FF6B6B]" : "text-gray-400 hover:text-gray-600"
      )}
    >
      {({ isActive }) => (
        <>
          <div className={cn("p-1.5 rounded-xl transition-all duration-300", isActive ? "bg-[#FF6B6B]/10" : "bg-transparent group-hover:bg-gray-100")}>
            <Icon className={cn("w-6 h-6", isActive ? "stroke-[2.5px]" : "stroke-[1.5px]")} />
          </div>
          <span className={cn("text-[10px] font-medium tracking-tight", isActive ? "font-bold" : "")}>{label}</span>
        </>
      )}
    </NavLink>
  );
}
