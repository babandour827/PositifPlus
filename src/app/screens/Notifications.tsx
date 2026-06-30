import { Bell, HeartPulse, ShieldAlert, CheckCircle2, MessageCircle, Trash2, Filter } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  alert:     { icon: ShieldAlert,   color: "text-rose-500",   bg: "bg-rose-50",        label: "ARV" },
  success:   { icon: CheckCircle2,  color: "text-emerald-500",bg: "bg-emerald-50",     label: "Succès" },
  community: { icon: MessageCircle, color: "text-[#FF9F43]",  bg: "bg-[#FF9F43]/10",  label: "Communauté" },
  system:    { icon: HeartPulse,    color: "text-blue-500",   bg: "bg-blue-50",        label: "Système" },
};

const ROUTE_MAP: Record<string, string> = {
  alert: "/app/tracking",
  success: "/app/tracking",
  community: "/app/echanges",
  system: "/app/profile",
};

type FilterTab = "all" | "alert" | "community" | "system" | "success";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all",       label: "Tout" },
  { key: "alert",     label: "ARV" },
  { key: "community", label: "Communauté" },
  { key: "system",    label: "Système" },
  { key: "success",   label: "Succès" },
];


function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "À l'instant";
  if (min < 60) return `Il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Hier";
  return `Il y a ${d}j`;
}

export function Notifications() {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { setLoading(false); return; }
      const uid = data.user.id;
      setUserId(uid);
      loadNotifs(uid);

      const channel = supabase
        .channel("notifs-screen-" + uid)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` }, (payload) => {
          setNotifs(prev => [payload.new as any, ...prev]);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    });
  }, []);

  async function loadNotifs(uid: string) {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifs(data ?? []);
    setLoading(false);
  }

  async function markRead(id: string) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    if (userId) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    }
  }

  async function markAllRead() {
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    if (userId) {
      await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
    }
  }

  async function deleteNotif(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setDeletingId(id);
    // Optimistic removal
    setNotifs(prev => prev.filter(n => n.id !== id));
    if (userId) {
      await supabase.from("notifications").delete().eq("id", id);
    }
    setDeletingId(null);
  }

  async function clearAll() {
    const filtered = activeFilter === "all" ? notifs : notifs.filter(n => n.type === activeFilter);
    const ids = filtered.map(n => n.id);
    setNotifs(prev => activeFilter === "all" ? [] : prev.filter(n => n.type !== activeFilter));
    if (userId) {
      const realIds = ids.filter(id => !id.startsWith("f"));
      if (realIds.length > 0) {
        await supabase.from("notifications").delete().in("id", realIds);
      }
    }
  }

  async function handleNotifClick(n: any) {
    await markRead(n.id);
    const route = ROUTE_MAP[n.type] || "/app";
    navigate(route);
  }

  async function validatePrise(n: any) {
    await markRead(n.id);
    if (userId) {
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "Prise validée",
        body: "Vous avez validé la prise de vos médicaments. Bravo !",
        type: "success",
        is_read: false,
      });
    }
  }

  const filteredNotifs = activeFilter === "all"
    ? notifs
    : notifs.filter(n => n.type === activeFilter);

  const unreadCount = notifs.filter(n => !n.is_read).length;
  const filteredUnread = filteredNotifs.filter(n => !n.is_read).length;

  return (
    <div className="flex flex-col min-h-full font-sans bg-gray-50 pb-28">
      {/* Header */}
      <div className="bg-white px-5 pt-4 pb-3 shadow-sm border-b border-gray-100 z-10 sticky top-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2 mb-1">
              Notifications <Bell className="w-5 h-5 text-gray-700" />
              {unreadCount > 0 && (
                <span className="bg-[#FF6B6B] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </h2>
            <p className="text-sm font-medium text-gray-500">Restez informé de votre suivi.</p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-bold text-[#10AC84] hover:text-[#10AC84]/80 transition-colors bg-[#1DD1A1]/10 px-3 py-1.5 rounded-full"
              >
                Tout lire
              </button>
            )}
            {filteredNotifs.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs font-bold text-gray-500 hover:text-rose-500 transition-colors bg-gray-100 hover:bg-rose-50 px-3 py-1.5 rounded-full flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {activeFilter === "all" ? "Tout" : "Filtré"}
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_TABS.map(tab => {
            const count = tab.key === "all"
              ? notifs.filter(n => !n.is_read).length
              : notifs.filter(n => n.type === tab.key && !n.is_read).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeFilter === tab.key
                    ? "bg-[#FF6B6B] text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Filter className="w-3 h-3" />
                {tab.label}
                {count > 0 && (
                  <span className={`text-[9px] font-black px-1 py-0.5 rounded-full min-w-[16px] text-center ${
                    activeFilter === tab.key ? "bg-white/30 text-white" : "bg-[#FF6B6B] text-white"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 mt-4 flex flex-col gap-3">
        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-[#FF6B6B] rounded-full animate-spin" />
          </div>
        )}

        {!loading && filteredNotifs.map((n) => {
          const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
          const Icon = cfg.icon;
          return (
            <div
              key={n.id}
              onClick={() => handleNotifClick(n)}
              className={`bg-white rounded-2xl p-4 shadow-sm border relative overflow-hidden transition-all cursor-pointer hover:shadow-md group ${
                n.is_read
                  ? "border-gray-100"
                  : "border-l-4 border-l-[#FF6B6B] border-t-gray-100 border-r-gray-100 border-b-gray-100"
              }`}
            >
              <div className="flex gap-4 items-start">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${cfg.bg}`}>
                  <Icon className={`w-5 h-5 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h3 className={`text-sm font-bold truncate ${n.is_read ? "text-gray-700" : "text-gray-900"}`}>{n.title}</h3>
                      <span className={`shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">{timeAgo(n.created_at)}</span>
                  </div>
                  <p className="text-xs font-medium text-gray-500 leading-relaxed">{n.body}</p>
                  {n.type === "alert" && (
                    <button
                      onClick={e => { e.stopPropagation(); validatePrise(n); }}
                      className="mt-3 text-[10px] font-bold text-white bg-rose-500 px-3 py-1.5 rounded-full shadow-sm hover:bg-rose-600 transition-colors"
                    >
                      Valider la prise
                    </button>
                  )}
                  {n.type === "community" && (
                    <Link
                      to="/app/echanges"
                      onClick={e => { e.stopPropagation(); markRead(n.id); }}
                      className="mt-3 text-[10px] font-bold text-[#FF9F43] border border-[#FF9F43]/30 px-3 py-1.5 rounded-full inline-block hover:bg-[#FF9F43]/5 transition-colors"
                    >
                      Voir la réponse
                    </Link>
                  )}
                </div>

                {/* Delete button — visible on hover */}
                <button
                  onClick={e => deleteNotif(n.id, e)}
                  disabled={deletingId === n.id}
                  className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {!n.is_read && (
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#FF6B6B]"></div>
              )}
            </div>
          );
        })}

        {!loading && filteredNotifs.length === 0 && (
          <div className="text-center mt-10 flex flex-col items-center justify-center opacity-50">
            <CheckCircle2 className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-sm font-bold text-gray-500">
              {activeFilter === "all" ? "Aucune notification" : `Aucune notification "${FILTER_TABS.find(t => t.key === activeFilter)?.label}"`}
            </p>
            {activeFilter !== "all" && (
              <button
                onClick={() => setActiveFilter("all")}
                className="mt-2 text-xs font-bold text-[#FF6B6B] underline"
              >
                Voir toutes les notifications
              </button>
            )}
          </div>
        )}

        {!loading && filteredNotifs.length > 0 && filteredNotifs.every(n => n.is_read) && (
          <div className="text-center mt-4 flex flex-col items-center justify-center opacity-50">
            <CheckCircle2 className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-xs font-bold text-gray-500">Vous êtes à jour</p>
            <p className="text-[10px] font-medium text-gray-400">Aucune autre notification</p>
          </div>
        )}
      </div>
    </div>
  );
}
