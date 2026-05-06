import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import {
  Users, Calendar, MessageCircle, Search, AlertTriangle,
  CheckCircle2, Clock, X, ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router";

type Patient = {
  id: string;
  pseudo: string;
  cta_id?: string;
  region?: string;
  last_mood?: string;
  last_mood_at?: string;
};

const MOOD_CFG = {
  bien:      { emoji: "😊", label: "Bien",      color: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  moyen:     { emoji: "😐", label: "Moyen",     color: "text-orange-700",  bg: "bg-orange-50",  dot: "bg-orange-400" },
  difficile: { emoji: "😔", label: "Difficile", color: "text-red-700",     bg: "bg-red-50",     dot: "bg-red-500"   },
} as const;

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

/* ── Modal RDV ───────────────────────────────────────────────────────────── */
function RdvModal({ patient, onClose, soignantCta }: {
  patient: Patient; onClose: () => void; soignantCta: string;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const inp = "w-full bg-gray-100 text-sm font-medium rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-transparent";

  async function save() {
    if (!date) return;
    setSaving(true);
    const dt = new Date(`${date}T${time}:00`);
    await supabase.from("appointments").insert({
      patient_id: patient.id,
      appointment_date: dt.toISOString(),
      cta_name: soignantCta || "CTA Sénégal",
    }).catch(() => {});
    setSaving(false);
    setDone(true);
    setTimeout(onClose, 1400);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={onClose}>
      <div className="bg-white rounded-t-3xl w-full max-w-md p-6 pb-10" onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-extrabold text-gray-900 text-base">Planifier un rendez-vous</h3>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Patient card */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">{patient.pseudo.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="font-bold text-sm text-blue-900">{patient.pseudo}</p>
            <p className="text-xs text-blue-600 font-medium">{patient.cta_id || "CTA Sénégal"}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Date du rendez-vous</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)} className={inp} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Heure</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inp} />
          </div>
          <button onClick={save} disabled={!date || saving || done}
            className="w-full mt-1 py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ background: done ? "#10AC84" : "linear-gradient(135deg, #1565C0 0%, #1976D2 100%)" }}>
            {done
              ? <><CheckCircle2 className="w-4 h-4" /> RDV planifié — le patient est notifié</>
              : saving
              ? "Enregistrement..."
              : <><Calendar className="w-4 h-4" /> Confirmer le rendez-vous</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Carte patient ───────────────────────────────────────────────────────── */
function PatientCard({ patient, onRdv, onContact }: {
  patient: Patient;
  onRdv: (p: Patient) => void;
  onContact: (p: Patient) => void;
}) {
  const moodCfg = patient.last_mood ? MOOD_CFG[patient.last_mood as keyof typeof MOOD_CFG] : null;
  const daysAgo  = patient.last_mood_at ? daysSince(patient.last_mood_at) : null;
  const isInactive = !patient.last_mood_at || (daysAgo !== null && daysAgo >= 3);
  const isDifficile = patient.last_mood === "difficile";

  const borderColor = isDifficile
    ? "border-red-200"
    : isInactive ? "border-amber-200"
    : "border-gray-100";

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${borderColor}`}>
      <div className="flex items-center gap-3 p-3.5">
        {/* Avatar + dot */}
        <div className="relative shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
            <span className="text-white font-bold">{patient.pseudo.charAt(0).toUpperCase()}</span>
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${moodCfg ? moodCfg.dot : "bg-gray-300"}`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-900">{patient.pseudo}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {moodCfg ? (
              <span className={`text-[10px] font-bold ${moodCfg.bg} ${moodCfg.color} px-2 py-0.5 rounded-lg`}>
                {moodCfg.emoji} {moodCfg.label}
              </span>
            ) : (
              <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg">Pas de données</span>
            )}
            {daysAgo !== null && (
              <span className="text-[10px] font-medium text-gray-400 flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                {daysAgo === 0 ? "Aujourd'hui" : `Il y a ${daysAgo}j`}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 shrink-0">
          <button onClick={() => onContact(patient)}
            className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center hover:bg-blue-100 transition-colors"
            title="Envoyer un message">
            <MessageCircle className="w-4 h-4 text-blue-600" />
          </button>
          <button onClick={() => onRdv(patient)}
            className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center hover:bg-indigo-100 transition-colors"
            title="Planifier un RDV">
            <Calendar className="w-4 h-4 text-indigo-600" />
          </button>
        </div>
      </div>

      {/* Warning banner */}
      {isDifficile && (
        <div className="bg-red-50 px-3.5 py-1.5 border-t border-red-100 flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-red-700">🔴 Humeur difficile — contact prioritaire recommandé</span>
        </div>
      )}
      {!isDifficile && isInactive && (
        <div className="bg-amber-50 px-3.5 py-1.5 border-t border-amber-100 flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-amber-700">
            ⚠️ {patient.last_mood_at ? `Inactif depuis ${daysAgo}j` : "Aucune activité enregistrée"} — suivi recommandé
          </span>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════════════════════════ */
export function SoignantPatients({ soignantCta }: { soignantCta: string }) {
  const navigate = useNavigate();
  const [patients, setPatients]   = useState<Patient[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState<"all" | "difficile" | "inactif">("all");
  const [rdvPatient, setRdvPatient] = useState<Patient | null>(null);

  useEffect(() => {
    async function load() {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, pseudo, cta_id, region")
        .eq("is_soignant", false)
        .order("pseudo")
        .limit(60);

      if (!profiles || profiles.length === 0) { setLoading(false); return; }

      const { data: moods } = await supabase
        .from("mood_logs")
        .select("user_id, mood, created_at")
        .in("user_id", profiles.map(p => p.id))
        .order("created_at", { ascending: false });

      // Garder seulement le mood le plus récent par patient
      const moodMap: Record<string, { mood: string; created_at: string }> = {};
      (moods || []).forEach(m => {
        if (!moodMap[m.user_id]) moodMap[m.user_id] = m;
      });

      setPatients(profiles.map(p => ({
        ...p,
        last_mood:    moodMap[p.id]?.mood,
        last_mood_at: moodMap[p.id]?.created_at,
      })));
      setLoading(false);
    }
    load();
  }, []);

  const atRisk = patients.filter(p =>
    p.last_mood === "difficile" ||
    !p.last_mood_at ||
    (p.last_mood_at && daysSince(p.last_mood_at) >= 3)
  ).length;

  const filtered = patients
    .filter(p => !search || p.pseudo.toLowerCase().includes(search.toLowerCase()))
    .filter(p => {
      if (filter === "difficile") return p.last_mood === "difficile";
      if (filter === "inactif")   return !p.last_mood_at || daysSince(p.last_mood_at) >= 3;
      return true;
    });

  function handleContact(p: Patient) {
    navigate("/app/echanges");
  }

  return (
    <div className="flex flex-col font-sans pb-6">

      {/* Alerte patients à risque */}
      {!loading && atRisk > 0 && (
        <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900">
              {atRisk} patient{atRisk > 1 ? "s" : ""} à surveiller
            </p>
            <p className="text-xs text-amber-700 font-medium">Humeur difficile ou inactivité ≥ 3 jours</p>
          </div>
          <button
            onClick={() => setFilter(f => f === "inactif" ? "all" : "inactif")}
            className="text-[10px] font-bold text-amber-700 bg-amber-200 px-2.5 py-1.5 rounded-full shrink-0 flex items-center gap-1">
            Voir <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Barre de recherche + filtres */}
      <div className="px-4 pt-4 pb-2 flex flex-col gap-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un patient..."
            className="w-full bg-gray-100 text-sm font-medium rounded-xl py-2.5 pl-9 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
          />
        </div>

        <div className="flex gap-2">
          {([
            { key: "all",       label: "Tous" },
            { key: "difficile", label: "😔 Difficile" },
            { key: "inactif",   label: "⚠️ Inactifs" },
          ] as const).map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                filter === f.key ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Compteur */}
      {!loading && (
        <div className="px-4 pb-2">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
            {filtered.length} patient{filtered.length !== 1 ? "s" : ""}
            {patients.filter(p => p.last_mood === "bien").length > 0 &&
              ` · ${patients.filter(p => p.last_mood === "bien").length} en bonne forme`}
          </p>
        </div>
      )}

      {/* Liste */}
      <div className="flex flex-col gap-2.5 px-4">
        {loading && [1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
        ))}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-14 text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Aucun patient trouvé</p>
            <p className="text-xs mt-1">
              {search ? "Essayez un autre nom" : "Aucun patient inscrit pour l'instant"}
            </p>
          </div>
        )}

        {filtered.map(patient => (
          <PatientCard
            key={patient.id}
            patient={patient}
            onRdv={p => setRdvPatient(p)}
            onContact={handleContact}
          />
        ))}
      </div>

      {/* Modal RDV */}
      {rdvPatient && (
        <RdvModal
          patient={rdvPatient}
          onClose={() => setRdvPatient(null)}
          soignantCta={soignantCta}
        />
      )}
    </div>
  );
}
