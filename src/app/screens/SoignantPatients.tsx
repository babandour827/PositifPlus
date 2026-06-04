import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { aiService } from "../../services/aiService";
import {
  Users, Calendar, MessageCircle, Search, AlertTriangle, AlertOctagon,
  CheckCircle2, Clock, X, ChevronRight, Smile, Meh, Frown,
  ShieldCheck, ShieldAlert, Zap, Bot, Loader2, UserRound, BarChart3,
  TrendingUp, Activity, Filter,
} from "lucide-react";
import { useNavigate } from "react-router";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════════════════ */
type Patient = {
  id: string;
  pseudo: string;
  specialite?: string;
  cta_id?: string;
  region?: string;
  last_mood?: string;
  last_mood_at?: string;
  score?: number;
};

type RiskLevel = "faible" | "modéré" | "élevé" | "critique";

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════════ */
const MOOD_CFG = {
  bien:      { Icon: Smile,  label: "Bien",      color: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-500", iconColor: "text-emerald-600" },
  moyen:     { Icon: Meh,    label: "Moyen",     color: "text-orange-700",  bg: "bg-orange-50",  dot: "bg-orange-400",  iconColor: "text-orange-500"  },
  difficile: { Icon: Frown,  label: "Difficile", color: "text-red-700",     bg: "bg-red-50",     dot: "bg-red-500",     iconColor: "text-red-600"     },
} as const;

const RISK_CFG: Record<RiskLevel, {
  Icon: React.ElementType; label: string; color: string; bg: string;
  border: string; textColor: string; dotColor: string;
}> = {
  faible:   { Icon: ShieldCheck,  label: "Faible",   color: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200", textColor: "text-emerald-700", dotColor: "bg-emerald-500" },
  "modéré": { Icon: ShieldAlert,  label: "Modéré",   color: "text-orange-700",  bg: "bg-orange-50",   border: "border-orange-200",  textColor: "text-orange-700",  dotColor: "bg-orange-400"  },
  élevé:    { Icon: AlertTriangle,label: "Élevé",    color: "text-red-700",     bg: "bg-red-50",      border: "border-red-200",     textColor: "text-red-700",     dotColor: "bg-red-500"     },
  critique: { Icon: AlertOctagon, label: "Critique", color: "text-purple-700",  bg: "bg-purple-50",   border: "border-purple-300",  textColor: "text-purple-700",  dotColor: "bg-purple-600"  },
};

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

/** Matrice de score PDV simplifiée basée sur les données disponibles */
function computeScore(p: Patient): number {
  let score = 0;
  const days = p.last_mood_at ? daysSince(p.last_mood_at) : null;

  // Humeur (comportemental)
  if (!p.last_mood)           score += 25; // pas de données
  else if (p.last_mood === "difficile") score += 35;
  else if (p.last_mood === "moyen")     score += 15;

  // Inactivité app (comportemental)
  if (days === null)    score += 25;
  else if (days >= 14)  score += 25;
  else if (days >= 7)   score += 15;
  else if (days >= 3)   score += 10;

  // Zone géographique (contextuel)
  const r = (p.region ?? "").toLowerCase();
  if (r.includes("kolda") || r.includes("ziguinchor")) score += 15;
  else if (["kaffrine","tambacounda","kédougou","kedougou"].some(z => r.includes(z))) score += 8;

  return Math.min(score, 100);
}

function getRiskLevel(score: number): RiskLevel {
  if (score < 30)  return "faible";
  if (score < 55)  return "modéré";
  if (score < 75)  return "élevé";
  return "critique";
}

/* ═══════════════════════════════════════════════════════════════════════════
   MODAL RDV
═══════════════════════════════════════════════════════════════════════════ */
function RdvModal({ patient, onClose, soignantCta, soignantId }: {
  patient: Patient; onClose: () => void; soignantCta: string; soignantId: string;
}) {
  const [date, setDate]     = useState("");
  const [time, setTime]     = useState("09:00");
  const [notes, setNotes]   = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone]     = useState(false);
  const [error, setError]   = useState("");
  const inp = "w-full bg-gray-100 text-sm font-medium rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-400/30";

  async function save() {
    if (!date) return;
    setSaving(true);
    setError("");
    const { error: err } = await supabase.from("appointments").insert({
      patient_id:       patient.id,
      soignant_id:      soignantId,
      appointment_date: new Date(`${date}T${time}:00`).toISOString(),
      cta_name:         soignantCta || "CTA Sénégal",
      status:           "confirme",
      notes:            notes.trim() || null,
    });
    setSaving(false);
    if (err) { setError("Erreur lors de l'enregistrement. Réessayez."); return; }
    setDone(true);
    setTimeout(onClose, 1400);
  }

  const score = computeScore(patient);
  const risk  = getRiskLevel(score);
  const rcfg  = RISK_CFG[risk];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={onClose}>
      <div className="bg-white rounded-t-3xl w-full max-w-md p-6 pb-10" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        <div className="flex items-center justify-between mb-5">
          <h3 className="font-extrabold text-gray-900">Planifier un rendez-vous</h3>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Patient + score */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3.5 flex items-center gap-3 mb-5">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-white font-bold">{patient.pseudo.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm text-blue-900">{patient.pseudo}</p>
            <p className="text-xs text-blue-600 font-medium">{patient.cta_id || "CTA Sénégal"}</p>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl ${rcfg.bg}`}>
            <rcfg.Icon className={`w-3.5 h-3.5 ${rcfg.color}`} />
            <span className={`text-[10px] font-black ${rcfg.textColor}`}>{score}/100</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)} className={inp} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Heure</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inp} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Notes (optionnel)</label>
            <input value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Ex : bilan CD4, renouvellement ARV…" className={inp} />
          </div>
          {error && (
            <p className="text-xs text-rose-600 font-medium bg-rose-50 px-3 py-2 rounded-lg">{error}</p>
          )}
          <button onClick={save} disabled={!date || saving || done}
            className="w-full mt-1 py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: done ? "#10AC84" : "linear-gradient(135deg,#1565C0,#1976D2)" }}>
            {done ? <><CheckCircle2 className="w-4 h-4" /> RDV planifié</> :
             saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</> :
             <><Calendar className="w-4 h-4" /> Confirmer le rendez-vous</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CARTE PATIENT
═══════════════════════════════════════════════════════════════════════════ */
function PatientCard({ patient, onRdv, onContact }: {
  patient: Patient;
  onRdv: (p: Patient) => void;
  onContact: (p: Patient) => void;
}) {
  const [aiAnalysis, setAiAnalysis]   = useState<string | null>(null);
  const [aiLoading, setAiLoading]     = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const score  = computeScore(patient);
  const risk   = getRiskLevel(score);
  const rcfg   = RISK_CFG[risk];
  const mcfg   = patient.last_mood ? MOOD_CFG[patient.last_mood as keyof typeof MOOD_CFG] : null;
  const daysAgo = patient.last_mood_at ? daysSince(patient.last_mood_at) : null;

  async function analyse() {
    if (aiAnalysis) { setShowAnalysis(v => !v); return; }
    setAiLoading(true);
    setShowAnalysis(true);
    const prompt = `Patient PVVIH sur Positif+ :
- Pseudonyme : ${patient.pseudo}
- Score de risque PDV : ${score}/100 → niveau ${risk}
- Humeur : ${patient.last_mood ?? "non renseignée"} (${daysAgo !== null ? `il y a ${daysAgo}j` : "jamais enregistrée"})
- CTA : ${patient.cta_id ?? "non précisé"} | Région : ${patient.region ?? "non précisée"}

Donne une recommandation d'intervention courte (3 phrases max) selon la matrice PDV Positif+. Sois précis et concret.`;
    const res = await aiService.sendMessage([], prompt, true);
    setAiAnalysis(res);
    setAiLoading(false);
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${rcfg.border}`}>
      <div className="flex items-center gap-3 p-3.5">

        {/* Avatar + dot humeur */}
        <div className="relative shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-base">{patient.pseudo.charAt(0).toUpperCase()}</span>
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${mcfg ? mcfg.dot : "bg-gray-300"}`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm text-gray-900 truncate">{patient.pseudo}</p>
            {/* Score badge */}
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg ${rcfg.bg} shrink-0`}>
              <rcfg.Icon className={`w-2.5 h-2.5 ${rcfg.color}`} />
              <span className={`text-[9px] font-black ${rcfg.textColor}`}>{score}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {/* Humeur */}
            {mcfg ? (
              <div className={`flex items-center gap-1 ${mcfg.bg} px-2 py-0.5 rounded-lg`}>
                <mcfg.Icon className={`w-3 h-3 ${mcfg.iconColor}`} />
                <span className={`text-[10px] font-bold ${mcfg.color}`}>{mcfg.label}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-lg">
                <UserRound className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] font-bold text-gray-500">Pas de données</span>
              </div>
            )}
            {/* Inactivité */}
            {daysAgo !== null && (
              <div className="flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5 text-gray-400" />
                <span className="text-[10px] font-medium text-gray-400">
                  {daysAgo === 0 ? "Aujourd'hui" : `${daysAgo}j`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 shrink-0">
          <button onClick={analyse}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${showAnalysis ? "bg-indigo-600" : "bg-indigo-50 hover:bg-indigo-100"}`}
            title="Analyse IA">
            <Bot className={`w-4 h-4 ${showAnalysis ? "text-white" : "text-indigo-600"}`} />
          </button>
          <button onClick={() => onContact(patient)}
            className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center hover:bg-blue-100 transition-colors"
            title="Contacter">
            <MessageCircle className="w-4 h-4 text-blue-600" />
          </button>
          <button onClick={() => onRdv(patient)}
            className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center hover:bg-teal-100 transition-colors"
            title="Planifier RDV">
            <Calendar className="w-4 h-4 text-teal-600" />
          </button>
        </div>
      </div>

      {/* Banière risque */}
      {(risk === "critique" || risk === "élevé") && (
        <div className={`px-3.5 py-2 border-t flex items-center gap-2 ${
          risk === "critique" ? "bg-purple-50 border-purple-100" : "bg-red-50 border-red-100"
        }`}>
          <rcfg.Icon className={`w-3.5 h-3.5 shrink-0 ${rcfg.color}`} />
          <p className={`text-[10px] font-bold ${rcfg.textColor}`}>
            {risk === "critique"
              ? "Protocole d'urgence — contact sous 24h requis"
              : "Alerte — orienter vers CTA ou pair-éducateur sous 48h"}
          </p>
        </div>
      )}
      {risk === "modéré" && !patient.last_mood && (
        <div className="bg-amber-50 px-3.5 py-2 border-t border-amber-100 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <p className="text-[10px] font-bold text-amber-700">
            {daysAgo !== null && daysAgo >= 3
              ? `Inactif depuis ${daysAgo} jours — suivi recommandé`
              : "Aucune activité — suivi recommandé"}
          </p>
        </div>
      )}

      {/* Analyse IA */}
      {showAnalysis && (
        <div className="border-t border-indigo-100 bg-indigo-50 p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">Recommandation IA — Matrice PDV</p>
          </div>
          {aiLoading ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
              <span className="text-xs text-indigo-600 font-medium">Analyse en cours...</span>
            </div>
          ) : (
            <p className="text-xs text-indigo-900 leading-relaxed font-medium">{aiAnalysis}</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════════════════════════════════════ */
export function SoignantPatients({ soignantCta }: { soignantCta: string }) {
  const navigate = useNavigate();
  const [patients, setPatients]     = useState<Patient[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filter, setFilter]         = useState<"all" | "difficile" | "inactif" | "critique">("all");
  const [rdvPatient, setRdvPatient] = useState<Patient | null>(null);
  const [soignantUserId, setSoignantUserId] = useState<string | null>(null);

  // Rapport IA global
  const [rapport, setRapport]         = useState<string | null>(null);
  const [rapportLoading, setRapportLoading] = useState(false);
  const [showRapport, setShowRapport]   = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setSoignantUserId(user.id);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, pseudo, specialite, cta_id, region")
        .eq("soignant_id", user.id)
        .order("pseudo")
        .limit(60);

      if (!profiles?.length) { setLoading(false); return; }

      const { data: moods } = await supabase
        .from("mood_logs")
        .select("user_id, mood, created_at")
        .in("user_id", profiles.map(p => p.id))
        .order("created_at", { ascending: false });

      const moodMap: Record<string, { mood: string; created_at: string }> = {};
      (moods || []).forEach(m => { if (!moodMap[m.user_id]) moodMap[m.user_id] = m; });

      const enriched = profiles.map(p => ({
        ...p,
        last_mood:    moodMap[p.id]?.mood,
        last_mood_at: moodMap[p.id]?.created_at,
      }));
      // Trier par score décroissant (plus à risque en premier)
      enriched.sort((a, b) => computeScore(b) - computeScore(a));
      setPatients(enriched);
      setLoading(false);
    }
    load();
  }, []);

  async function genererRapport() {
    setShowRapport(true);
    if (rapport) return;
    setRapportLoading(true);
    const total     = patients.length;
    const critique  = patients.filter(p => getRiskLevel(computeScore(p)) === "critique").length;
    const eleve     = patients.filter(p => getRiskLevel(computeScore(p)) === "élevé").length;
    const difficile = patients.filter(p => p.last_mood === "difficile").length;
    const inactifs  = patients.filter(p => !p.last_mood_at || daysSince(p.last_mood_at) >= 7).length;
    const avgScore  = Math.round(patients.reduce((s, p) => s + computeScore(p), 0) / (total || 1));

    const prompt = `Situation hebdomadaire des patients sur Positif+ (${soignantCta}) :
- Total patients inscrits : ${total}
- Score PDV moyen : ${avgScore}/100
- Niveau critique (>75) : ${critique} patient(s)
- Niveau élevé (55-75) : ${eleve} patient(s)
- Humeur difficile signalée : ${difficile} patient(s)
- Inactifs depuis 7 jours ou plus : ${inactifs} patient(s)

Rédige un rapport de synthèse en 4 phrases maximum avec 3 actions prioritaires concrètes à mener cette semaine selon les protocoles PDV du CNLS Sénégal.`;

    const res = await aiService.sendMessage([], prompt, true);
    setRapport(res);
    setRapportLoading(false);
  }

  const filtered = patients
    .filter(p => !search || p.pseudo.toLowerCase().includes(search.toLowerCase()))
    .filter(p => {
      if (filter === "difficile") return p.last_mood === "difficile";
      if (filter === "inactif")   return !p.last_mood_at || daysSince(p.last_mood_at) >= 3;
      if (filter === "critique")  return getRiskLevel(computeScore(p)) === "critique" || getRiskLevel(computeScore(p)) === "élevé";
      return true;
    });

  const atRiskCount = patients.filter(p => {
    const r = getRiskLevel(computeScore(p));
    return r === "critique" || r === "élevé";
  }).length;

  return (
    <div className="flex flex-col font-sans pb-8">

      {/* Alerte globale */}
      {!loading && atRiskCount > 0 && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <AlertOctagon className="w-4.5 h-4.5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-red-900">
              {atRiskCount} patient{atRiskCount > 1 ? "s" : ""} en zone élevée ou critique
            </p>
            <p className="text-xs text-red-700 font-medium">Score PDV ≥ 55 — intervention recommandée</p>
          </div>
          <button onClick={() => setFilter(f => f === "critique" ? "all" : "critique")}
            className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-200 px-2.5 py-1.5 rounded-full shrink-0">
            Filtrer <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Rapport IA */}
      <div className="mx-4 mt-3">
        <button onClick={genererRapport}
          className={`w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            showRapport
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "bg-indigo-50 text-indigo-700 border border-indigo-200"
          }`}>
          {rapportLoading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Génération du rapport...</>
            : <><Bot className="w-4 h-4" />{showRapport ? "Masquer le rapport IA" : "Rapport IA hebdomadaire"}</>}
        </button>

        {showRapport && !rapportLoading && rapport && (
          <div className="mt-2 bg-white border border-indigo-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                <BarChart3 className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-xs font-black text-indigo-700 uppercase tracking-wider">Analyse PDV — Matrice CNLS Sénégal</p>
            </div>
            <p className="text-sm text-gray-800 leading-relaxed font-medium">{rapport}</p>
          </div>
        )}
      </div>

      {/* Stats rapides */}
      {!loading && (
        <div className="grid grid-cols-3 gap-2.5 px-4 mt-3">
          {[
            { label: "Patients",  value: patients.length,  Icon: Users,     bg: "bg-blue-50",    color: "text-blue-600" },
            { label: "À risque",  value: atRiskCount,      Icon: TrendingUp,bg: "bg-red-50",     color: "text-red-600" },
            { label: "En forme",  value: patients.filter(p => p.last_mood === "bien").length, Icon: Activity, bg: "bg-emerald-50", color: "text-emerald-600" },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-3 flex flex-col gap-1`}>
              <s.Icon className={`w-4 h-4 ${s.color}`} />
              <p className="text-xl font-black text-gray-900 leading-none">{s.value}</p>
              <p className={`text-[10px] font-bold ${s.color}`}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recherche + filtres */}
      <div className="px-4 pt-3 pb-2 flex flex-col gap-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un patient..."
            className="w-full bg-gray-100 text-sm font-medium rounded-xl py-2.5 pl-9 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-400/30" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {([
            { key: "all",       Icon: Filter,        label: "Tous" },
            { key: "critique",  Icon: AlertOctagon,  label: "Urgents" },
            { key: "difficile", Icon: Frown,         label: "Difficile" },
            { key: "inactif",   Icon: Clock,         label: "Inactifs" },
          ] as const).map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                filter === f.key ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600"
              }`}>
              <f.Icon className="w-3 h-3" />
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      <div className="flex flex-col gap-2.5 px-4">
        {loading && [1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
        ))}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-14">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-bold text-gray-500">Aucun patient trouvé</p>
            <p className="text-xs text-gray-400 mt-1">
              {search ? "Essayez un autre nom" : "Aucun patient inscrit"}
            </p>
          </div>
        )}

        {filtered.map(patient => (
          <PatientCard
            key={patient.id}
            patient={patient}
            onRdv={p => setRdvPatient(p)}
            onContact={(p) => navigate("/app/echanges", {
              state: { openContact: { id: p.id, pseudo: p.pseudo, specialite: p.specialite ?? null, cta_id: p.cta_id } }
            })}
          />
        ))}
      </div>

      {rdvPatient && soignantUserId && (
        <RdvModal
          patient={rdvPatient}
          onClose={() => setRdvPatient(null)}
          soignantCta={soignantCta}
          soignantId={soignantUserId}
        />
      )}

      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  );
}
