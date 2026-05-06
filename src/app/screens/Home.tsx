import {
  ArrowRight, Calendar, Heart, ShieldAlert, Sparkles, TrendingUp,
  CheckCircle2, Bot, MessageCircle, Stethoscope, BarChart3,
  AlertTriangle, Users2, Activity, Clock, Pill, Sun, BookOpen, UserRound,
} from "lucide-react";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useProfile } from "../../hooks/useProfile";

const DAILY_RESOURCES = [
  { title: "Indétectable = Intransmissible", sub: "L'étude PARTNER2 confirmée — 6 min de lecture" },
  { title: "Bien vivre avec les ARV", sub: "Conseils pratiques pour l'observance — 4 min" },
  { title: "Nutrition et VIH", sub: "Alimentation équilibrée et immunité — 5 min" },
  { title: "Santé mentale et PVVIH", sub: "Gérer le stress et l'anxiété — 7 min" },
  { title: "Les nouvelles thérapies ARV", sub: "Protocoles 2025 au Sénégal — 8 min" },
  { title: "Droits des PVVIH au Sénégal", sub: "Loi n°2008-12 et confidentialité — 5 min" },
  { title: "Charge virale indétectable", sub: "Comprendre votre bilan — 4 min" },
];

function getDailyResource() {
  const day = Math.floor(Date.now() / 86400000);
  return DAILY_RESOURCES[day % DAILY_RESOURCES.length];
}

const DAILY_QUOTES = [
  { text: "Chaque petit pas est une victoire vers votre bien-être.", author: "Dr. Aminata Touré, CTA Fann" },
  { text: "Prendre soin de soi n'est pas un luxe, c'est une nécessité.", author: "Dr. Ibrahima Diallo" },
  { text: "L'observance aujourd'hui, c'est la santé de demain.", author: "Équipe Positif+" },
  { text: "Vous n'êtes jamais seul(e) dans ce parcours.", author: "Communauté Positif+" },
  { text: "La régularité du traitement est votre meilleure protection.", author: "Dr. Fatou Cissé, Ziguinchor" },
  { text: "Chaque jour où vous prenez votre traitement est un jour de victoire.", author: "Dr. Moussa Sarr" },
  { text: "La force n'est pas l'absence de peur, c'est d'avancer malgré elle.", author: "Pair-éducateur RNP+" },
  { text: "Votre santé mérite toute votre attention et tout votre amour.", author: "Équipe soignante CTA" },
  { text: "Indétectable, c'est aussi indestructible.", author: "Campagne I=I Sénégal" },
  { text: "Ensemble, on est vraiment plus forts.", author: "Communauté Positif+" },
  { text: "Votre courage au quotidien inspire tous ceux qui vous entourent.", author: "Dr. Rokhaya Ndiaye" },
  { text: "Un traitement régulier, une vie épanouie — c'est possible.", author: "CNLS Sénégal" },
];

function getDailyQuote() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
}

function getNextArvTime(meds: { name: string; reminder_time: string }[]): string | null {
  if (!meds || meds.length === 0) return null;
  const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const sorted = meds
    .filter(m => m.reminder_time)
    .map(m => {
      const [h, min] = m.reminder_time.split(":").map(Number);
      return { name: m.name, minutes: h * 60 + min, time: m.reminder_time };
    })
    .sort((a, b) => a.minutes - b.minutes);
  const next = sorted.find(t => t.minutes > currentMinutes) ?? sorted[0];
  return next ? `${next.name} à ${next.time}` : null;
}

function timeAgo(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
  if (h < 1) return "Il y a quelques min";
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${Math.floor(h / 24)}j`;
}

export function Home() {
  const { isSoignant, profile } = useProfile();
  const [lastPost, setLastPost]   = useState<{ content: string; likes_count?: number; created_at: string } | null>(null);
  const [nextAppt, setNextAppt]   = useState<{ appointment_date: string } | null>(null);
  const [meds, setMeds]           = useState<{ name: string; reminder_time: string }[]>([]);
  const [pdvStats, setPdvStats]   = useState({ patients: 0, soignants: 0, posts: 0 });
  const [loading, setLoading]     = useState(true);
  const [atRisk, setAtRisk]       = useState<{ pseudo: string; mood?: string; daysAgo?: number }[]>([]);

  const quote         = getDailyQuote();
  const dailyResource = getDailyResource();

  async function shareQuote() {
    const text = `"${quote.text}" — ${quote.author}`;
    if (navigator.share) {
      await navigator.share({ title: "Positif+", text }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(text).catch(() => {});
    }
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();

      supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle()
        .then(({ data }) => { if (data) setLastPost(data); });

      if (user) {
        supabase.from("appointments").select("*").eq("patient_id", user.id)
          .gte("appointment_date", new Date().toISOString())
          .order("appointment_date", { ascending: true }).limit(1).maybeSingle()
          .then(({ data }) => { if (data) setNextAppt(data); });

        supabase.from("medications").select("name, reminder_time").eq("user_id", user.id).eq("is_active", true)
          .then(({ data }) => { if (data) setMeds(data); });
      }

      const [{ count: patients }, { count: soignants }, { count: posts }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_soignant", false),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_soignant", true),
        supabase.from("posts").select("*", { count: "exact", head: true }),
      ]);
      setPdvStats({ patients: patients ?? 0, soignants: soignants ?? 0, posts: posts ?? 0 });

      // Patients à risque pour le soignant
      const { data: allPatients } = await supabase
        .from("profiles").select("id, pseudo").eq("is_soignant", false).limit(40);
      if (allPatients && allPatients.length > 0) {
        const { data: moods } = await supabase
          .from("mood_logs").select("user_id, mood, created_at")
          .in("user_id", allPatients.map(p => p.id))
          .order("created_at", { ascending: false });
        const moodMap: Record<string, { mood: string; created_at: string }> = {};
        (moods || []).forEach(m => { if (!moodMap[m.user_id]) moodMap[m.user_id] = m; });
        const risky = allPatients
          .map(p => {
            const m = moodMap[p.id];
            const daysAgo = m ? Math.floor((Date.now() - new Date(m.created_at).getTime()) / 86400000) : null;
            return { pseudo: p.pseudo, mood: m?.mood, daysAgo: daysAgo ?? undefined };
          })
          .filter(p => p.mood === "difficile" || p.daysAgo === undefined || p.daysAgo >= 3)
          .slice(0, 3);
        setAtRisk(risky);
      }
      setLoading(false);
    }
    load();
  }, []);

  const apptLabel = nextAppt
    ? new Date(nextAppt.appointment_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
      + " · " + new Date(nextAppt.appointment_date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : "Aucun prévu";

  const nextArv = getNextArvTime(meds);

  // ── VUE SOIGNANT ─────────────────────────────────────────────────────────
  if (isSoignant) {
    return (
      <div className="flex flex-col gap-5 p-5 min-h-full font-sans pb-24 bg-gray-50/50">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-5 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl -ml-10 -mb-10" />
          <div className="relative z-10">
            <span className="flex items-center gap-1.5 text-white/70 text-xs font-bold uppercase tracking-wider mb-2">
              <Stethoscope className="w-3.5 h-3.5" /> Tableau de bord Soignant
            </span>
            <h2 className="text-xl font-black leading-tight mb-1">Bonjour, {profile?.pseudo ?? "Dr."}</h2>
            <p className="text-sm text-white/80 font-medium">{profile?.specialite ?? "Professionnel de santé"} · {profile?.cta_id ?? "CTA Sénégal"}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="bg-white/20 text-white text-[10px] font-black px-2.5 py-1 rounded-full border border-white/20">✓ Compte vérifié</span>
              <span className="bg-white/20 text-white text-[10px] font-black px-2.5 py-1 rounded-full border border-white/20">Positif+ Expert</span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Aperçu de la plateforme</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0"><Users2 className="w-5 h-5 text-blue-500" /></div>
              <div><p className="text-2xl font-black text-gray-900 leading-none">{pdvStats.patients}</p><p className="text-[10px] font-bold text-gray-400 mt-0.5">patients inscrits</p></div>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-4 shadow-sm border border-emerald-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0"><Activity className="w-5 h-5 text-[#10AC84]" /></div>
              <div><p className="text-2xl font-black text-emerald-700 leading-none">{pdvStats.soignants}</p><p className="text-[10px] font-bold text-emerald-500 mt-0.5">soignants CTA</p></div>
            </div>
            <div className="bg-orange-50 rounded-2xl p-4 shadow-sm border border-orange-100 col-span-2 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0"><Clock className="w-5 h-5 text-orange-500" /></div>
              <div><p className="text-2xl font-black text-orange-700 leading-none">{pdvStats.posts}</p><p className="text-[10px] font-bold text-orange-400 mt-0.5">messages dans la communauté</p></div>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Actions rapides</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: "/app/echanges", icon: MessageCircle, label: "Mes Patients",  sub: "Messagerie CTA",       bg: "bg-blue-50",    color: "text-blue-500" },
              { to: "/app/echanges", icon: BarChart3,     label: "Score PDV",     sub: "Matrice de risque IA", bg: "bg-indigo-50",  color: "text-indigo-500" },
              { to: "/app/echanges", icon: Users2,        label: "Communauté",    sub: "Modération & soutien", bg: "bg-emerald-50", color: "text-[#10AC84]" },
              { to: "/app/resources",icon: TrendingUp,    label: "Ressources",    sub: "Protocoles & CTA",     bg: "bg-purple-50",  color: "text-purple-500" },
            ].map(item => (
              <Link key={item.label} to={item.to} className="bg-white rounded-2xl p-4 flex flex-col gap-3 shadow-sm border border-gray-100 active:scale-95 transition-transform">
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">{item.label}</h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{item.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Patients à surveiller */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Patients à surveiller
            </p>
            <Link to="/app/echanges" className="text-xs font-bold text-blue-500 flex items-center gap-1">
              Voir tous <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {atRisk.length === 0 && !loading && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-[#10AC84]" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-900">Tous les patients sont actifs</p>
                <p className="text-xs text-emerald-700 font-medium">Aucune alerte en ce moment</p>
              </div>
            </div>
          )}

          {atRisk.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {atRisk.map((p, i) => (
                <div key={i} className={`bg-white rounded-2xl border shadow-sm p-3.5 flex items-center gap-3 ${
                  p.mood === "difficile" ? "border-red-200" : "border-amber-200"
                }`}>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm">{p.pseudo.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-900">{p.pseudo}</p>
                    <p className="text-[10px] font-medium text-gray-500 mt-0.5">
                      {p.mood === "difficile"
                        ? "😔 Humeur difficile signalée"
                        : p.daysAgo === undefined
                        ? "⚠️ Aucune activité enregistrée"
                        : `⚠️ Inactif depuis ${p.daysAgo} jour${p.daysAgo > 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <Link to="/app/echanges"
                    className="text-[10px] font-bold text-white bg-blue-600 px-2.5 py-1.5 rounded-full shrink-0">
                    Contacter
                  </Link>
                </div>
              ))}
              <Link to="/app/echanges"
                className="text-xs font-bold text-blue-600 text-center py-2 bg-blue-50 rounded-2xl border border-blue-100">
                Voir la liste complète des patients →
              </Link>
            </div>
          )}
        </div>

        {/* Activité communauté */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 text-base">Activité communauté</h3>
            <Link to="/app/echanges" className="text-xs font-bold text-blue-500 flex items-center gap-1">Voir tout <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-800">Membre anonyme</p>
                  <p className="text-[10px] text-gray-400 font-medium">{lastPost ? timeAgo(lastPost.created_at) : "Il y a 2 heures"}</p>
                </div>
              </div>
              <div className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-md">Communauté</div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed font-medium line-clamp-2">
              {lastPost?.content ?? '"Merci pour le soutien de ce groupe, ça m\'aide vraiment dans mon suivi."'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── SKELETON ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-5 min-h-full font-sans pb-24 bg-gray-50/50 animate-pulse">
        <div className="h-36 bg-gray-200 rounded-3xl" />
        <div className="grid grid-cols-2 gap-3">
          {[0,1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
        </div>
        <div className="h-20 bg-gray-200 rounded-2xl" />
        <div className="h-28 bg-gray-200 rounded-2xl" />
        <div className="h-16 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  // ── VUE PATIENT ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 p-5 min-h-full font-sans pb-24 bg-gray-50/50">

      {/* Pensée du jour */}
      <div className="bg-gradient-to-br from-[#FF6B6B] to-[#FF9F43] rounded-3xl p-5 text-white shadow-xl shadow-[#FF6B6B]/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl -ml-10 -mb-10" />
        <div className="relative z-10 flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-white/80 text-sm font-medium">
            <Sparkles className="w-4 h-4" /> Pensée du jour
          </span>
          <h2 className="text-lg font-bold leading-tight mt-1 mb-3 pr-4">"{quote.text}"</h2>
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/90 font-medium">{quote.author}</p>
            <button onClick={shareQuote} className="bg-white text-[#FF6B6B] text-xs font-bold px-3 py-1.5 rounded-full shadow-sm active:scale-95 transition-transform">
              Partager
            </button>
          </div>
        </div>
      </div>

      {/* Rappel ARV du jour */}
      {meds.length > 0 && (
        <div className={`rounded-2xl p-4 border flex items-center gap-3 ${nextArv ? "bg-orange-50 border-orange-100" : "bg-emerald-50 border-emerald-100"}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${nextArv ? "bg-[#FF9F43]" : "bg-[#10AC84]"}`}>
            <Pill className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            {nextArv ? (
              <>
                <p className="text-sm font-bold text-orange-900">Prochain ARV</p>
                <p className="text-xs font-medium text-orange-700">{nextArv}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-emerald-900">ARV du jour validés ✓</p>
                <p className="text-xs font-medium text-emerald-700">Toutes vos prises d'aujourd'hui sont passées.</p>
              </>
            )}
          </div>
          <Link to="/app/tracking" className={`text-[10px] font-bold px-2.5 py-1.5 rounded-full ${nextArv ? "bg-[#FF9F43] text-white" : "bg-[#10AC84] text-white"}`}>
            Suivi
          </Link>
        </div>
      )}

      {/* Accès rapides — 4 tuiles */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { to: "/app/tracking",  icon: Heart,         label: "Mon Suivi",    sub: "Tâches & observance",   bg: "bg-[#1DD1A1]/10", color: "text-[#10AC84]" },
          { to: "/app/profile",   icon: Calendar,      label: "Rendez-vous",  sub: apptLabel,               bg: "bg-blue-50",      color: "text-blue-500" },
          { to: "/app/echanges",  icon: Bot,           label: "Échanges",     sub: "Forum · Soignants · IA", bg: "bg-purple-50",   color: "text-purple-500" },
          { to: "/app/resources", icon: BookOpen,      label: "Ressources",   sub: "Articles & guides",      bg: "bg-teal-50",     color: "text-teal-500" },
        ].map(item => (
          <Link key={item.to + item.label} to={item.to} className="bg-white rounded-2xl p-4 flex flex-col gap-3 shadow-sm border border-gray-100 active:scale-95 transition-transform">
            <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
              <item.icon className={`w-5 h-5 ${item.color}`} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">{item.label}</h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5 leading-tight">{item.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Urgence */}
      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3">
        <div className="bg-rose-100 p-2 rounded-full shrink-0"><ShieldAlert className="w-5 h-5 text-rose-600" /></div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-rose-900 mb-1">Besoin d'aide immédiate ?</h3>
          <p className="text-xs text-rose-700/80 mb-2 leading-relaxed font-medium">Nos professionnels sont disponibles 24/7 pour vous écouter en toute confidentialité.</p>
          <Link to="/app/echanges" className="text-xs font-bold text-white bg-rose-600 px-3 py-1.5 rounded-full inline-flex items-center gap-1 shadow-sm">
            Contacter un spécialiste <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Dans la communauté */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 text-base">Dans la communauté</h3>
          <Link to="/app/echanges" className="text-xs font-bold text-[#FF9F43] flex items-center gap-1">Voir tout <ArrowRight className="w-3 h-3" /></Link>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-gray-800">{lastPost ? "Membre anonyme" : "Mariam D."}</p>
                <p className="text-[10px] text-gray-400 font-medium">{lastPost ? timeAgo(lastPost.created_at) : "Il y a 2 heures"}</p>
              </div>
            </div>
            <div className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />{lastPost ? "Communauté" : "Succès"}
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed font-medium line-clamp-3">
            {lastPost?.content ?? '"Je viens de terminer mon premier mois complet de suivi. Ce n\'était pas facile, mais la bienveillance de ce groupe m\'a tellement aidée !"'}
          </p>
          <div className="flex items-center gap-4 mt-1">
            <span className="flex items-center gap-1 text-xs font-bold text-gray-400"><Heart className="w-4 h-4" /> {lastPost?.likes_count ?? 24}</span>
            <span className="flex items-center gap-1 text-xs font-bold text-gray-400"><MessageCircle className="w-4 h-4" /> Commentaires</span>
          </div>
        </div>
      </div>

      {/* Ressource du jour */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 text-base">Ressource du jour</h3>
          <Link to="/app/resources" className="text-xs font-bold text-blue-500 flex items-center gap-1">Toutes <ArrowRight className="w-3 h-3" /></Link>
        </div>
        <Link to="/app/resources" className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100 rounded-2xl p-4 flex gap-3 items-center">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-teal-100">
            <Sun className="w-6 h-6 text-teal-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-teal-900">{dailyResource.title}</p>
            <p className="text-xs font-medium text-teal-700 mt-0.5">{dailyResource.sub}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-teal-400 shrink-0" />
        </Link>
      </div>
    </div>
  );
}
