import {
  CalendarDays, CheckCircle2, ChevronRight, Pill, Moon, Sun,
  Utensils, Plus, X, Smile, Meh, Frown, Flame, Droplets,
  Scale, History, Sparkles, Bell, AlertTriangle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useStreak } from "../../hooks/useStreak";
import { useDailyTasks, getAdherenceHistory } from "../../hooks/useDailyTasks";

const ICON_MAP: Record<string, any> = { Sun, Droplets, Utensils, Moon };

const MOOD_CONFIG = {
  bien:      { icon: Smile, label: "Bien",      emoji: "😊", activeBg: "bg-[#10AC84]",  bg: "bg-emerald-50" },
  moyen:     { icon: Meh,   label: "Moyen",     emoji: "😐", activeBg: "bg-[#FF9F43]",  bg: "bg-orange-50" },
  difficile: { icon: Frown, label: "Difficile", emoji: "😔", activeBg: "bg-[#FF6B6B]",  bg: "bg-rose-50" },
} as const;
type MoodKey = keyof typeof MOOD_CONFIG;

/* ── SVG adherence ring ────────────────────────────────────────────────── */
function AdherenceRing({ pct }: { pct: number }) {
  const r = 72, cx = 88, cy = 88;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width="176" height="176" style={{ transform: "rotate(-90deg)" }}>
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1DD1A1" />
          <stop offset="100%" stopColor="#10AC84" />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="url(#ringGrad)" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
}

/* ── SVG weight line chart ─────────────────────────────────────────────── */
function WeightChart({ logs }: { logs: any[] }) {
  if (logs.length < 2) return null;
  const ordered = [...logs].reverse();
  const weights = ordered.map(l => l.weight_kg as number);
  const min = Math.min(...weights) - 1;
  const max = Math.max(...weights) + 1;
  const W = 260, H = 56;
  const pts = ordered.map((_, i) => ({
    x: (i / (ordered.length - 1)) * W,
    y: H - ((weights[i] - min) / (max - min)) * H,
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L ${W} ${H} L 0 ${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H + 6}`} className="w-full" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="wAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A855F7" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#wAreaGrad)" />
      <path d={line} fill="none" stroke="#A855F7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y}
          r={i === pts.length - 1 ? 4.5 : 3}
          fill="#A855F7" stroke="white" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TRACKING SCREEN
══════════════════════════════════════════════════════════════════════════ */
export function Tracking() {
  const { tasks, toggle, done, total, pct } = useDailyTasks();
  const { streak: loginStreak, isNew: isNewStreak } = useStreak();
  const history = getAdherenceHistory();

  const [meds, setMeds] = useState<any[]>([]);
  const [nextAppt, setNextAppt] = useState<any>(null);
  const [mood, setMood] = useState<MoodKey | null>(null);
  const [showAddMed, setShowAddMed] = useState(false);
  const [newMed, setNewMed] = useState({ name: "", dosage: "", frequency: "daily", reminder_time: "08:00" });
  const [userId, setUserId] = useState<string | null>(null);
  const [moodHistory, setMoodHistory] = useState<any[]>([]);
  const [showMoodHistory, setShowMoodHistory] = useState(false);
  const [weightLogs, setWeightLogs] = useState<any[]>([]);
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const inp = "w-full bg-gray-50 border border-gray-200 text-sm font-medium rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#10AC84]/40 focus:border-[#10AC84]/40 transition-all";

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      const uid = data.user.id;
      setUserId(uid);

      supabase.from("medications").select("*").eq("user_id", uid).eq("is_active", true)
        .then(({ data: d }) => { if (d) setMeds(d); });

      supabase.from("appointments").select("*").eq("patient_id", uid)
        .gte("appointment_date", new Date().toISOString())
        .order("appointment_date", { ascending: true }).limit(1).maybeSingle()
        .then(({ data: a }) => { if (a) setNextAppt(a); });

      const today = new Date().toISOString().slice(0, 10);
      supabase.from("mood_logs").select("*").eq("user_id", uid)
        .gte("created_at", today + "T00:00:00Z")
        .order("created_at", { ascending: false }).limit(1).maybeSingle()
        .then(({ data: m }) => { if (m) setMood(m.mood as MoodKey); });

      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      supabase.from("mood_logs").select("*").eq("user_id", uid)
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false }).limit(7)
        .then(({ data: h }) => { if (h) setMoodHistory(h); });

      supabase.from("weight_logs").select("*").eq("user_id", uid)
        .order("created_at", { ascending: false }).limit(6)
        .then(({ data: w }) => { if (w) setWeightLogs(w); });
    });
  }, []);

  async function saveMood(m: MoodKey) {
    setMood(m);
    if (!userId) return;
    const { data } = await supabase.from("mood_logs")
      .insert({ user_id: userId, mood: m }).select().single();
    if (data) setMoodHistory(prev => [data, ...prev.slice(0, 6)]);
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "Humeur enregistrée",
      body: `Votre humeur du jour : ${m === "bien" ? "😊 Bien" : m === "moyen" ? "😐 Moyen" : "😔 Difficile"}`,
      type: "success", is_read: false,
    }).catch(() => {});
  }

  async function addMed() {
    if (!newMed.name.trim() || !userId) return;
    const { data } = await supabase.from("medications")
      .insert({ user_id: userId, ...newMed, is_active: true }).select().single();
    if (data) {
      setMeds(m => [...m, data]);
      await supabase.from("notifications").insert({
        user_id: userId,
        title: `Rappel ARV activé : ${newMed.name}`,
        body: `Rappel configuré à ${newMed.reminder_time}.`,
        type: "alert", is_read: false,
      }).catch(() => {});
    }
    setShowAddMed(false);
    setNewMed({ name: "", dosage: "", frequency: "daily", reminder_time: "08:00" });
  }

  async function deleteMed(id: string) {
    await supabase.from("medications").update({ is_active: false }).eq("id", id);
    setMeds(m => m.filter(med => med.id !== id));
    setConfirmDeleteId(null);
  }

  function requestDeleteMed(id: string) {
    if (confirmDeleteId === id) {
      deleteMed(id);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(c => c === id ? null : c), 3000);
    }
  }

  async function addWeight() {
    const w = parseFloat(newWeight);
    if (!userId || isNaN(w) || w < 20 || w > 300) return;
    const { data } = await supabase.from("weight_logs")
      .insert({ user_id: userId, weight_kg: w }).select().single();
    if (data) setWeightLogs(prev => [data, ...prev.slice(0, 5)]);
    setNewWeight(""); setShowAddWeight(false);
  }

  const apptDate = nextAppt ? new Date(nextAppt.appointment_date) : null;
  const latestWeight = weightLogs[0]?.weight_kg;
  const prevWeight = weightLogs[1]?.weight_kg;
  const weightDiff = latestWeight && prevWeight ? (latestWeight - prevWeight).toFixed(1) : null;
  const avgAdherence = Math.round(history.reduce((a, d) => a + d.pct, 0) / history.length);
  const todayStr = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="flex flex-col min-h-full bg-[#F8FAFC] pb-28 font-sans">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&display=swap');
        .sora { font-family: 'Sora', sans-serif; }

        @keyframes pp-fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pp-fu  { animation: pp-fadeUp 0.5s ease forwards; }
        .pp-fu1 { animation: pp-fadeUp 0.5s ease forwards 0.08s; opacity: 0; }
        .pp-fu2 { animation: pp-fadeUp 0.5s ease forwards 0.16s; opacity: 0; }
        .pp-fu3 { animation: pp-fadeUp 0.5s ease forwards 0.24s; opacity: 0; }
        .pp-fu4 { animation: pp-fadeUp 0.5s ease forwards 0.32s; opacity: 0; }

        @keyframes pp-flame {
          0%,100% { transform: scale(1) rotate(-3deg); }
          50%      { transform: scale(1.15) rotate(3deg); }
        }
        .pp-flame { animation: pp-flame 1.6s ease-in-out infinite; }

        @keyframes pp-glow {
          0%,100% { opacity: 0.4; transform: scale(1); }
          50%      { opacity: 0.12; transform: scale(1.1); }
        }
        .pp-glow { animation: pp-glow 3.5s ease-in-out infinite; }

        @keyframes pp-bar {
          from { transform: scaleY(0); opacity: 0; }
          to   { transform: scaleY(1); opacity: 1; }
        }
        .pp-bar { animation: pp-bar 0.5s cubic-bezier(.34,1.56,.64,1) forwards; transform-origin: bottom; }

        @keyframes pp-check {
          0%   { transform: scale(0) rotate(-20deg); }
          60%  { transform: scale(1.25) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .pp-check { animation: pp-check 0.35s cubic-bezier(.34,1.56,.64,1) forwards; }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HERO — dark gradient + circular ring
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div
        className="relative overflow-hidden px-5 pt-6 pb-12"
        style={{ background: "linear-gradient(155deg, #091525 0%, #0D2137 55%, #0E2D24 100%)" }}
      >
        {/* Ambient glow orbs */}
        <div className="pp-glow absolute top-6 right-4 w-52 h-52 rounded-full bg-[#1DD1A1]/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-32 h-32 rounded-full bg-[#FF9F43]/10 blur-2xl pointer-events-none" />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between mb-7 pp-fu">
          <div>
            <p className="text-[10px] font-black text-white/35 uppercase tracking-[0.18em]">Mon Suivi</p>
            <p className="text-sm font-semibold text-white/60 capitalize mt-0.5">{todayStr}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-white/8 border border-white/10 backdrop-blur-sm px-3 py-1.5 rounded-2xl">
            <Flame className={`w-4 h-4 pp-flame ${loginStreak >= 7 ? "text-orange-400" : loginStreak >= 3 ? "text-amber-400" : "text-white/30"}`} />
            <span className="sora text-lg font-black text-white leading-none">{loginStreak}</span>
            <span className="text-[10px] font-bold text-white/40">j</span>
            {isNewStreak && loginStreak > 1 && (
              <span className="ml-1 text-[9px] font-black text-orange-400 bg-orange-400/15 px-1.5 py-0.5 rounded-full">+1🔥</span>
            )}
          </div>
        </div>

        {/* Circular adherence ring */}
        <div className="pp-fu1 flex flex-col items-center">
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* Soft conic glow behind ring */}
            <div
              className="absolute inset-0 rounded-full blur-xl"
              style={{ background: `conic-gradient(rgba(29,209,161,0.18) ${pct * 3.6}deg, transparent ${pct * 3.6}deg)` }}
            />
            <div className="absolute inset-0"><AdherenceRing pct={pct} /></div>
            {/* Center text */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="flex items-end gap-0.5 leading-none">
                <span className="sora text-[52px] font-black text-white leading-none">{pct}</span>
                <span className="text-xl font-bold text-white/45 mb-2">%</span>
              </div>
              <span className="text-[10px] font-bold text-white/35 uppercase tracking-widest mt-1">{done}/{total} tâches</span>
            </div>
          </div>

          <p className="mt-4 text-sm font-semibold text-white/55 text-center leading-snug">
            {pct >= 100 ? "🎉 Journée parfaite — bravo !"
             : pct >= 75 ? "Excellente régularité aujourd'hui"
             : pct >= 50 ? "Bonne progression, continuez !"
             : pct > 0   ? "Vous avez commencé — courage !"
             : "Commencez votre programme du jour"}
          </p>
        </div>

        {/* 7-day mini bars */}
        <div className="pp-fu2 flex items-end justify-center gap-2.5 mt-6">
          {history.map((day, i) => {
            const h = Math.max((day.pct / 100) * 30, 3);
            const isToday = i === history.length - 1;
            const bg = day.pct >= 75 ? "#1DD1A1" : day.pct >= 50 ? "#FF9F43" : day.pct > 0 ? "#FF6B6B" : "rgba(255,255,255,0.1)";
            const glow = day.pct >= 75 && isToday ? "0 0 8px rgba(29,209,161,0.6)" : "none";
            return (
              <div key={i} className="flex flex-col items-center gap-1.5" style={{ minWidth: 24 }}>
                <div
                  className="w-1.5 rounded-full pp-bar"
                  style={{ height: h, background: bg, boxShadow: glow, animationDelay: `${0.3 + i * 0.05}s`, opacity: 0 }}
                />
                <span className={`text-[8px] font-bold capitalize ${isToday ? "text-[#1DD1A1]" : "text-white/25"}`}>
                  {day.date}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Curved lift ── */}
      <div style={{ marginTop: -18, borderRadius: "20px 20px 0 0", background: "#F8FAFC", paddingTop: 20, minHeight: 400 }}>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PROGRAMME DU JOUR
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="px-5 mb-5 pp-fu3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-extrabold text-gray-800 tracking-tight">Programme du jour</h3>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-20 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: "linear-gradient(90deg, #1DD1A1, #10AC84)" }}
                />
              </div>
              <span className="text-xs font-bold text-[#10AC84]">{done}/{total}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {tasks.map((task) => {
              const Icon = ICON_MAP[task.icon] || Sun;
              return (
                <button
                  key={task.id}
                  onClick={() => toggle(task.id)}
                  className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all active:scale-[0.98] text-left w-full ${
                    task.done
                      ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100"
                      : "bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${task.done ? "bg-[#10AC84]" : task.bg}`}>
                    {task.done
                      ? <CheckCircle2 className="w-5 h-5 text-white pp-check" />
                      : <Icon className={`w-5 h-5 ${task.color}`} />
                    }
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-bold transition-all ${task.done ? "text-emerald-600 line-through decoration-emerald-300 opacity-70" : "text-gray-800"}`}>
                      {task.title}
                    </p>
                    <p className="text-[10px] font-semibold text-gray-400 mt-0.5">{task.time}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${task.done ? "bg-[#10AC84] border-[#10AC84]" : "border-gray-200"}`}>
                    {task.done && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>

          {pct === 100 && (
            <div
              className="mt-3 rounded-2xl p-3.5 flex items-center gap-3 shadow-lg"
              style={{ background: "linear-gradient(135deg, #10AC84 0%, #1DD1A1 100%)", boxShadow: "0 8px 24px rgba(16,172,132,0.25)" }}
            >
              <Sparkles className="w-5 h-5 text-white shrink-0" />
              <p className="text-sm font-bold text-white">Journée parfaite — toutes les tâches validées !</p>
            </div>
          )}
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            OBSERVANCE CHART
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="px-5 mb-5 pp-fu4">
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-gray-800">Observance — 7 jours</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#10AC84]" />
                <span className="text-xs font-bold text-[#10AC84]">Moy. {avgAdherence}%</span>
              </div>
            </div>
            <div className="flex items-end gap-2 h-24">
              {history.map((day, i) => {
                const height = day.pct > 0 ? Math.max((day.pct / 100) * 80, 8) : 4;
                const isToday = i === history.length - 1;
                let bg: string;
                if (day.pct >= 75) bg = isToday ? "linear-gradient(180deg,#1DD1A1,#10AC84)" : "rgba(29,209,161,0.35)";
                else if (day.pct >= 50) bg = isToday ? "linear-gradient(180deg,#FFB74D,#FF9F43)" : "rgba(255,159,67,0.35)";
                else if (day.pct > 0)  bg = isToday ? "linear-gradient(180deg,#FF7474,#FF6B6B)" : "rgba(255,107,107,0.35)";
                else bg = "rgba(0,0,0,0.05)";
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full flex items-end justify-center" style={{ height: 84 }}>
                      <div
                        className={`w-full rounded-xl pp-bar ${isToday ? "shadow-sm" : ""}`}
                        style={{
                          height,
                          background: bg,
                          animationDelay: `${i * 0.06}s`,
                          opacity: 0,
                          boxShadow: isToday && day.pct >= 75 ? "0 4px 12px rgba(29,209,161,0.25)" : undefined,
                        }}
                      />
                    </div>
                    <span className={`text-[9px] font-bold capitalize ${isToday ? "text-[#10AC84]" : "text-gray-400"}`}>
                      {day.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            HUMEUR DU JOUR
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="px-5 mb-5">
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-gray-800">Comment vous sentez-vous ?</h3>
              {moodHistory.length > 0 && (
                <button onClick={() => setShowMoodHistory(v => !v)}
                  className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-colors">
                  <History className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {(Object.entries(MOOD_CONFIG) as [MoodKey, typeof MOOD_CONFIG[MoodKey]][]).map(([key, m]) => (
                <button
                  key={key}
                  onClick={() => saveMood(key)}
                  className={`flex flex-col items-center gap-2 py-4 rounded-2xl transition-all active:scale-95 border-2 ${
                    mood === key ? `${m.activeBg} border-transparent shadow-lg` : `${m.bg} border-transparent hover:border-gray-200`
                  }`}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className={`text-xs font-bold ${mood === key ? "text-white" : "text-gray-600"}`}>{m.label}</span>
                </button>
              ))}
            </div>
            {mood && (
              <div className="mt-3 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10AC84] shrink-0" />
                <p className="text-xs font-semibold text-gray-600">
                  {mood === "bien" ? "Super ! Continuez comme ça."
                   : mood === "moyen" ? "Pensez à vous reposer aujourd'hui."
                   : "N'hésitez pas à contacter votre soignant."}
                </p>
              </div>
            )}
            {showMoodHistory && moodHistory.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">7 derniers jours</p>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {moodHistory.map((entry, i) => {
                    const cfg = MOOD_CONFIG[entry.mood as MoodKey];
                    if (!cfg) return null;
                    return (
                      <div key={entry.id || i} className={`flex flex-col items-center gap-1.5 shrink-0 ${cfg.bg} rounded-xl p-2.5 min-w-[52px]`}>
                        <span className="text-lg">{cfg.emoji}</span>
                        <span className="text-[8px] font-bold text-gray-500">
                          {new Date(entry.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SUIVI DU POIDS
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="px-5 mb-5">
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-gray-800 flex items-center gap-2">
                <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Scale className="w-4 h-4 text-purple-600" />
                </div>
                Suivi du poids
              </h3>
              <button onClick={() => setShowAddWeight(v => !v)}
                className="flex items-center gap-1.5 text-xs font-bold text-purple-500 bg-purple-50 px-2.5 py-1.5 rounded-xl">
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </button>
            </div>

            {latestWeight ? (
              <div className="flex items-center gap-3 mb-3">
                <div>
                  <span className="sora text-3xl font-black text-purple-700">{latestWeight}</span>
                  <span className="text-sm font-bold text-purple-400"> kg</span>
                </div>
                {weightDiff !== null && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                    parseFloat(weightDiff) > 0 ? "text-orange-600 bg-orange-50"
                    : parseFloat(weightDiff) < 0 ? "text-emerald-600 bg-emerald-50"
                    : "text-gray-600 bg-gray-50"
                  }`}>
                    {parseFloat(weightDiff) > 0 ? "▲" : parseFloat(weightDiff) < 0 ? "▼" : "="} {Math.abs(parseFloat(weightDiff))} kg
                  </span>
                )}
                <span className="text-[10px] font-medium text-gray-400 ml-auto">
                  {new Date(weightLogs[0].created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </span>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-3 font-medium">Aucune mesure enregistrée.</p>
            )}

            {weightLogs.length > 1 && (
              <div className="mt-1 mb-3 px-1">
                <WeightChart logs={weightLogs} />
              </div>
            )}

            {showAddWeight && (
              <div className="flex gap-2 mt-2">
                <input
                  type="number"
                  value={newWeight}
                  onChange={e => setNewWeight(e.target.value)}
                  placeholder="Poids en kg (ex: 72.5)"
                  className="flex-1 bg-gray-50 border border-gray-200 text-sm font-medium rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-purple-400/30 focus:border-purple-300"
                  step="0.1" min="20" max="300"
                />
                <button onClick={addWeight} disabled={!newWeight}
                  className="px-4 py-2.5 bg-purple-500 text-white text-sm font-bold rounded-xl shadow-sm disabled:opacity-40 hover:bg-purple-600 transition-colors">
                  OK
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            MES ARV
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="px-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-extrabold text-gray-800 flex items-center gap-2">
              <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center">
                <Pill className="w-4 h-4 text-[#FF9F43]" />
              </div>
              Mes ARV
            </h3>
            {!showAddMed && (
              <button onClick={() => setShowAddMed(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-[#FF9F43] bg-orange-50 px-2.5 py-1.5 rounded-xl">
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </button>
            )}
          </div>

          {meds.length === 0 && !showAddMed && (
            <button onClick={() => setShowAddMed(true)}
              className="w-full py-5 rounded-2xl border-2 border-dashed border-orange-200 flex flex-col items-center justify-center gap-2 bg-orange-50/40 text-[#FF9F43] font-bold text-sm">
              <Pill className="w-6 h-6 opacity-50" />
              <span>Ajouter votre premier ARV</span>
            </button>
          )}

          <div className="flex flex-col gap-2.5">
            {meds.map(m => (
              <div
                key={m.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm flex overflow-hidden"
                style={{ borderLeft: "3.5px solid #FF9F43" }}
              >
                <div className="flex-1 flex items-center gap-3 p-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center shrink-0">
                    <Pill className="w-5 h-5 text-[#FF9F43]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-900">{m.name}</p>
                    <p className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-1 flex-wrap">
                      {m.dosage && <span>{m.dosage} ·</span>}
                      <span>{m.frequency === "daily" ? "1×/jour" : m.frequency === "twice_daily" ? "2×/jour" : "Hebdo"}</span>
                      {m.reminder_time && <span className="flex items-center gap-0.5"><Bell className="w-3 h-3" />{m.reminder_time}</span>}
                    </p>
                  </div>
                  {confirmDeleteId === m.id ? (
                    <button
                      onClick={() => requestDeleteMed(m.id)}
                      aria-label="Confirmer la suppression"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-500 text-white text-[10px] font-bold shrink-0"
                    >
                      <AlertTriangle className="w-3 h-3" /> Confirmer
                    </button>
                  ) : (
                    <button
                      onClick={() => requestDeleteMed(m.id)}
                      aria-label="Supprimer ce médicament"
                      className="p-2.5 rounded-full hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {showAddMed && (
            <div className="mt-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900">Nouveau médicament ARV</h3>
                <button onClick={() => setShowAddMed(false)} className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Nom du médicament</label>
                <input value={newMed.name} onChange={e => setNewMed({ ...newMed, name: e.target.value })} placeholder="ex: TDF/3TC/EFV" className={inp} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Dosage</label>
                <input value={newMed.dosage} onChange={e => setNewMed({ ...newMed, dosage: e.target.value })} placeholder="ex: 300mg" className={inp} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Fréquence</label>
                <select value={newMed.frequency} onChange={e => setNewMed({ ...newMed, frequency: e.target.value })} className={inp}>
                  <option value="daily">1×/jour</option>
                  <option value="twice_daily">2×/jour</option>
                  <option value="weekly">Hebdomadaire</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Heure du rappel</label>
                <input type="time" value={newMed.reminder_time} onChange={e => setNewMed({ ...newMed, reminder_time: e.target.value })} className={inp} />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowAddMed(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-500">Annuler</button>
                <button onClick={addMed} disabled={!newMed.name.trim()}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-md disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #FF9F43, #FF6B6B)" }}>
                  Enregistrer
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PROCHAIN RDV
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="px-5 mb-4">
          {apptDate ? (
            <div
              className="rounded-3xl p-4 flex items-center justify-between overflow-hidden relative"
              style={{ background: "linear-gradient(135deg, #0A1628 0%, #1B2647 100%)" }}
            >
              <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-[0.07]">
                <CalendarDays className="w-24 h-24 text-white" />
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="flex flex-col items-center justify-center w-12 h-14 bg-white/10 rounded-2xl border border-white/10">
                  <span className="text-[9px] font-black text-white/50 uppercase tracking-wider leading-none">
                    {apptDate.toLocaleDateString("fr-FR", { month: "short" })}
                  </span>
                  <span className="sora text-2xl font-black text-white leading-tight">{apptDate.getDate()}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{nextAppt.cta_name || "Consultation médicale"}</p>
                  <p className="text-xs font-medium text-white/45 mt-0.5">
                    {apptDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · Prochain RDV
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 relative z-10">
                <ChevronRight className="w-4 h-4 text-white/50" />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                <CalendarDays className="w-5 h-5 text-gray-300" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500">Aucun rendez-vous prévu</p>
                <p className="text-xs text-gray-400 font-medium">Planifiez depuis votre profil</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-200 ml-auto" />
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
