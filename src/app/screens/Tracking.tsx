import {
  CalendarDays, CheckCircle2, ChevronRight, Activity, Pill, Moon, Sun,
  Utensils, HeartPulse, Plus, X, Smile, Meh, Frown, Flame, Droplets,
  TrendingUp, Scale, History
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useStreak } from "../../hooks/useStreak";
import { useDailyTasks } from "../../hooks/useDailyTasks";
import { ObservanceChart } from "../components/ObservanceChart";

const ICON_MAP: Record<string, any> = { Sun, Droplets, Utensils, Moon };

const MOOD_CONFIG = {
  bien:      { icon: Smile, label: "Bien",      color: "text-[#10AC84]",  activeBg: "bg-[#10AC84]",  bg: "bg-[#1DD1A1]/10" },
  moyen:     { icon: Meh,   label: "Moyen",     color: "text-[#FF9F43]",  activeBg: "bg-[#FF9F43]",  bg: "bg-orange-50" },
  difficile: { icon: Frown, label: "Difficile", color: "text-rose-500",   activeBg: "bg-rose-500",   bg: "bg-rose-50" },
} as const;

type MoodKey = keyof typeof MOOD_CONFIG;

function MoodEmoji({ mood }: { mood: MoodKey }) {
  const Icon = MOOD_CONFIG[mood].icon;
  return <Icon className="w-4 h-4" />;
}

export function Tracking() {
  const { tasks, toggle, done, total, pct } = useDailyTasks();
  const { streak: loginStreak, isNew: isNewStreak } = useStreak();

  const [meds, setMeds] = useState<any[]>([]);
  const [nextAppt, setNextAppt] = useState<any>(null);
  const [mood, setMood] = useState<MoodKey | null>(null);
  const [showAddMed, setShowAddMed] = useState(false);
  const [newMed, setNewMed] = useState({ name: "", dosage: "", frequency: "daily", reminder_time: "08:00" });
  const [userId, setUserId] = useState<string | null>(null);
  // Historique humeur
  const [moodHistory, setMoodHistory] = useState<any[]>([]);
  const [showMoodHistory, setShowMoodHistory] = useState(false);
  // Suivi poids
  const [weightLogs, setWeightLogs] = useState<any[]>([]);
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [newWeight, setNewWeight] = useState("");

  const inp = "w-full bg-gray-100 text-sm font-medium rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#10AC84]/50";

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

      // Vérifier humeur d'aujourd'hui déjà enregistrée
      const today = new Date().toISOString().slice(0, 10);
      supabase.from("mood_logs").select("*").eq("user_id", uid)
        .gte("created_at", today + "T00:00:00Z")
        .order("created_at", { ascending: false }).limit(1).maybeSingle()
        .then(({ data: m }) => { if (m) setMood(m.mood as MoodKey); });

      // Historique humeur 7 derniers jours
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      supabase.from("mood_logs").select("*").eq("user_id", uid)
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false }).limit(7)
        .then(({ data: h }) => { if (h) setMoodHistory(h); });

      // Poids
      supabase.from("weight_logs").select("*").eq("user_id", uid)
        .order("created_at", { ascending: false }).limit(6)
        .then(({ data: w }) => { if (w) setWeightLogs(w); });
    });
  }, []);

  async function saveMood(m: MoodKey) {
    setMood(m);
    if (!userId) return;
    const { data } = await supabase.from("mood_logs")
      .insert({ user_id: userId, mood: m })
      .select().single();
    if (data) setMoodHistory(prev => [data, ...prev.slice(0, 6)]);
    // Notification
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
        body: `Rappel configuré à ${newMed.reminder_time} — ${newMed.frequency === "daily" ? "1×/jour" : newMed.frequency === "twice_daily" ? "2×/jour" : "Hebdomadaire"}.`,
        type: "alert", is_read: false,
      }).catch(() => {});
    }
    setShowAddMed(false);
    setNewMed({ name: "", dosage: "", frequency: "daily", reminder_time: "08:00" });
  }

  async function deleteMed(id: string) {
    await supabase.from("medications").update({ is_active: false }).eq("id", id);
    setMeds(m => m.filter(med => med.id !== id));
  }

  async function addWeight() {
    const w = parseFloat(newWeight);
    if (!userId || isNaN(w) || w < 20 || w > 300) return;
    const { data } = await supabase.from("weight_logs")
      .insert({ user_id: userId, weight_kg: w }).select().single();
    if (data) setWeightLogs(prev => [data, ...prev.slice(0, 5)]);
    setNewWeight("");
    setShowAddWeight(false);
  }

  const apptDate = nextAppt ? new Date(nextAppt.appointment_date) : null;
  const latestWeight = weightLogs[0]?.weight_kg;
  const prevWeight = weightLogs[1]?.weight_kg;
  const weightDiff = latestWeight && prevWeight ? (latestWeight - prevWeight).toFixed(1) : null;

  return (
    <div className="flex flex-col gap-5 p-5 min-h-full font-sans bg-gray-50/50 pb-28">
      <div>
        <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
          Mon Suivi <HeartPulse className="w-5 h-5 text-[#1DD1A1]" />
        </h2>
        <p className="text-sm font-medium text-gray-500 mt-1">L'observance est la clé de la réussite.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-[#1DD1A1] to-[#10AC84] p-4 rounded-3xl text-white shadow-lg shadow-[#1DD1A1]/20 relative overflow-hidden">
          <div className="absolute top-2 right-2 opacity-20"><Activity className="w-16 h-16" /></div>
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-xs font-bold text-teal-50 uppercase tracking-wider">Score</span>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-black leading-none">{pct}</span>
              <span className="text-lg font-bold pb-1">%</span>
            </div>
            <p className="text-xs font-medium text-teal-100 mt-1 leading-tight">
              {pct >= 75 ? "Excellente régularité" : pct >= 50 ? "Bonne progression" : pct > 0 ? "Continuez !" : "Commencez !"}
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-gray-100 flex flex-col justify-between shadow-sm relative overflow-hidden">
          {loginStreak >= 3 && <div className="absolute top-2 right-2 opacity-10"><Flame className="w-14 h-14 text-orange-500" /></div>}
          <div className="relative z-10">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Flame className={`w-3.5 h-3.5 ${loginStreak >= 3 ? "text-orange-500 fill-orange-400" : "text-gray-300"}`} /> Série
            </span>
            <div className="flex items-end gap-1 mt-1">
              <span className={`text-3xl font-black leading-none ${loginStreak >= 7 ? "text-orange-500" : loginStreak >= 3 ? "text-amber-500" : "text-gray-800"}`}>{loginStreak}</span>
              <span className="text-sm font-bold text-gray-400 pb-1">j</span>
            </div>
            <p className="text-xs font-medium text-gray-500 mt-1 leading-tight">
              {loginStreak === 1 ? "Démarrez votre série !" : `${loginStreak} jours d'affilée`}
            </p>
            {isNewStreak && loginStreak > 1 && (
              <span className="text-[9px] font-black text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full mt-1 inline-block">+1 aujourd'hui 🔥</span>
            )}
          </div>
        </div>
      </div>

      {/* Programme du jour */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 text-base">Programme du jour</h3>
          <span className="text-xs font-bold text-[#10AC84] bg-[#1DD1A1]/10 px-2.5 py-1 rounded-lg">{done}/{total} complété{done > 1 ? "s" : ""}</span>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3 relative">
          <div className="absolute left-[33px] top-6 bottom-6 w-0.5 bg-gray-100 z-0" />
          {tasks.map((task) => {
            const Icon = ICON_MAP[task.icon] || Sun;
            return (
              <div key={task.id} onClick={() => toggle(task.id)}
                className="flex items-center gap-3 relative z-10 group cursor-pointer select-none">
                <div className="relative flex items-center justify-center shrink-0">
                  <div className={`w-9 h-9 rounded-full ${task.bg} flex items-center justify-center transition-all group-hover:scale-110 group-active:scale-95`}>
                    {task.done ? <CheckCircle2 className={`w-5 h-5 ${task.color}`} /> : <Icon className={`w-4 h-4 ${task.color}`} />}
                  </div>
                  {!task.done && <div className="absolute inset-0 rounded-full border-2 border-dashed border-gray-200 -z-10 scale-125" />}
                </div>
                <div className={`flex-1 p-3 rounded-2xl border transition-all ${task.done ? "bg-gray-50/50 border-transparent" : "bg-white border-gray-100 shadow-sm"} flex items-center justify-between`}>
                  <div>
                    <h4 className={`text-sm font-bold ${task.done ? "text-gray-400 line-through decoration-gray-300" : "text-gray-800"}`}>{task.title}</h4>
                    <p className="text-[10px] font-bold text-gray-400 mt-0.5">{task.time}</p>
                  </div>
                  {task.done ? <CheckCircle2 className="w-5 h-5 text-[#10AC84]" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Graphique observance */}
      <ObservanceChart />

      {/* Humeur du jour */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 text-sm">Comment vous sentez-vous aujourd'hui ?</h3>
          {moodHistory.length > 0 && (
            <button onClick={() => setShowMoodHistory(!showMoodHistory)}
              className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-gray-600">
              <History className="w-3.5 h-3.5" /> Historique
            </button>
          )}
        </div>
        <div className="flex gap-3">
          {(Object.entries(MOOD_CONFIG) as [MoodKey, typeof MOOD_CONFIG[MoodKey]][]).map(([key, m]) => (
            <button key={key} onClick={() => saveMood(key)}
              className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-2xl border transition-all ${mood === key ? `${m.activeBg} border-transparent shadow-md scale-[0.97]` : `${m.bg} border-transparent hover:scale-105`}`}>
              <m.icon className={`w-6 h-6 ${mood === key ? "text-white" : m.color}`} />
              <span className={`text-xs font-bold ${mood === key ? "text-white" : m.color}`}>{m.label}</span>
            </button>
          ))}
        </div>
        {mood && (
          <p className="text-center text-xs text-gray-500 mt-3 font-medium">
            Humeur enregistrée ✓ · {mood === "bien" ? "Super ! Continuez !" : mood === "moyen" ? "Pensez à vous reposer." : "Contactez votre soignant si besoin."}
          </p>
        )}

        {/* Historique humeur 7 jours */}
        {showMoodHistory && moodHistory.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-50">
            <p className="text-xs font-bold text-gray-500 mb-2">7 derniers jours</p>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {moodHistory.map((entry, i) => {
                const cfg = MOOD_CONFIG[entry.mood as MoodKey];
                if (!cfg) return null;
                const Icon = cfg.icon;
                return (
                  <div key={entry.id || i} className={`flex flex-col items-center gap-1 shrink-0 ${cfg.bg} rounded-xl p-2 min-w-[52px]`}>
                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                    <span className="text-[9px] font-bold text-gray-500">
                      {new Date(entry.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Suivi du poids */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
            <Scale className="w-4 h-4 text-purple-500" /> Suivi du poids
          </h3>
          <button onClick={() => setShowAddWeight(!showAddWeight)}
            className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center">
            <Plus className="w-4 h-4 text-purple-500" />
          </button>
        </div>

        {latestWeight ? (
          <div className="flex items-center gap-4 mb-3">
            <div className="bg-purple-50 rounded-2xl p-3 text-center min-w-[80px]">
              <p className="text-2xl font-black text-purple-700">{latestWeight}</p>
              <p className="text-[10px] font-bold text-purple-400">kg actuel</p>
            </div>
            {weightDiff !== null && (
              <div className={`rounded-2xl p-3 text-center min-w-[70px] ${parseFloat(weightDiff) > 0 ? "bg-orange-50" : parseFloat(weightDiff) < 0 ? "bg-emerald-50" : "bg-gray-50"}`}>
                <p className={`text-lg font-black ${parseFloat(weightDiff) > 0 ? "text-orange-600" : parseFloat(weightDiff) < 0 ? "text-emerald-600" : "text-gray-600"}`}>
                  {parseFloat(weightDiff) > 0 ? "+" : ""}{weightDiff}
                </p>
                <p className="text-[10px] font-bold text-gray-400">vs précédent</p>
              </div>
            )}
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500">Dernière mesure</p>
              <p className="text-xs font-bold text-gray-700">
                {new Date(weightLogs[0].created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4 font-medium">Aucune mesure enregistrée.</p>
        )}

        {/* Mini graphique poids */}
        {weightLogs.length > 1 && (
          <div className="flex items-end gap-1.5 h-12 mb-3">
            {weightLogs.slice().reverse().map((w, i) => {
              const min = Math.min(...weightLogs.map((x: any) => x.weight_kg));
              const max = Math.max(...weightLogs.map((x: any) => x.weight_kg));
              const range = max - min || 1;
              const h = 30 + ((w.weight_kg - min) / range) * 30;
              return (
                <div key={w.id || i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-purple-200 rounded-t-lg" style={{ height: `${h}px` }} />
                  <span className="text-[8px] font-medium text-gray-400">
                    {new Date(w.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {showAddWeight && (
          <div className="flex gap-2 mt-2">
            <input
              type="number"
              value={newWeight}
              onChange={e => setNewWeight(e.target.value)}
              placeholder="Poids en kg (ex: 72.5)"
              className="flex-1 bg-gray-100 text-sm font-medium rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              step="0.1" min="20" max="300"
            />
            <button onClick={addWeight} disabled={!newWeight}
              className="px-4 py-2.5 bg-purple-500 text-white text-sm font-bold rounded-xl shadow-sm disabled:opacity-40">
              Ajouter
            </button>
          </div>
        )}
      </div>

      {/* Médicaments ARV */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
            <Pill className="w-4 h-4 text-[#FF9F43]" /> Mes ARV
          </h3>
          <button onClick={() => setShowAddMed(true)} className="w-7 h-7 bg-[#FF9F43]/10 rounded-lg flex items-center justify-center">
            <Plus className="w-4 h-4 text-[#FF9F43]" />
          </button>
        </div>
        {meds.length === 0 && !showAddMed && (
          <button onClick={() => setShowAddMed(true)}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-[#FF9F43] font-bold text-sm flex items-center justify-center gap-2 bg-white">
            <Plus className="w-4 h-4" /> Ajouter votre premier ARV
          </button>
        )}
        <div className="flex flex-col gap-2">
          {meds.map(m => (
            <div key={m.id} className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                <Pill className="w-5 h-5 text-[#FF9F43]" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-gray-900">{m.name}</p>
                <p className="text-xs text-gray-500 font-medium">
                  {m.dosage} · {m.frequency === "daily" ? "1×/jour" : m.frequency === "twice_daily" ? "2×/jour" : "Hebdo"} · 🔔 {m.reminder_time}
                </p>
              </div>
              <button onClick={() => deleteMed(m.id)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Formulaire ajout ARV */}
      {showAddMed && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900">Ajouter un ARV</h3>
            <button onClick={() => setShowAddMed(false)} className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <input value={newMed.name} onChange={e => setNewMed({ ...newMed, name: e.target.value })} placeholder="Nom (ex: TDF/3TC/EFV)" className={inp} />
          <input value={newMed.dosage} onChange={e => setNewMed({ ...newMed, dosage: e.target.value })} placeholder="Dosage (ex: 300mg)" className={inp} />
          <select value={newMed.frequency} onChange={e => setNewMed({ ...newMed, frequency: e.target.value })} className={inp}>
            <option value="daily">1×/jour</option>
            <option value="twice_daily">2×/jour</option>
            <option value="weekly">Hebdomadaire</option>
          </select>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">🔔 Heure du rappel</label>
            <input type="time" value={newMed.reminder_time} onChange={e => setNewMed({ ...newMed, reminder_time: e.target.value })} className={inp} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAddMed(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600">Annuler</button>
            <button onClick={addMed} disabled={!newMed.name.trim()} className="flex-1 py-3 rounded-xl bg-[#10AC84] text-white text-sm font-bold shadow-md disabled:opacity-50">Enregistrer</button>
          </div>
        </div>
      )}

      {/* Prochain RDV */}
      {apptDate ? (
        <div className="bg-gradient-to-r from-orange-50 to-rose-50 rounded-2xl p-4 border border-orange-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex flex-col items-center justify-center overflow-hidden shrink-0">
              <div className="bg-[#FF9F43] w-full text-[8px] font-black text-white text-center py-0.5 uppercase tracking-wider">
                {apptDate.toLocaleDateString("fr-FR", { month: "short" })}
              </div>
              <div className="text-sm font-black text-gray-800">{apptDate.getDate()}</div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-800">{nextAppt.cta_name || "Consultation"}</h4>
              <p className="text-xs font-medium text-gray-500">{apptDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      ) : (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5 text-gray-300" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-500">Aucun RDV prévu</h4>
              <p className="text-xs text-gray-400 font-medium">Planifiez depuis votre profil</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300" />
        </div>
      )}
    </div>
  );
}
