import {
  User, Settings, ShieldCheck, HeartPulse, ChevronRight, LogOut,
  FileText, Bell, Lock, Plus, Pill, Calendar, X, ArrowLeft,
  Upload, Trash2, Eye, EyeOff, Save, Check, Globe, Moon, Sun,
  Smartphone, Mail, Key, AlertTriangle, TrendingUp, Activity,
  ToggleLeft, ToggleRight, ChevronDown, UserPlus, Phone, Search,
} from "lucide-react";
import { Logo } from "../components/Logo";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabaseClient";
import { lockSettings } from "../hooks/useAppLock";

// ─── SOUS-VUES ────────────────────────────────────────────────────────────────

type Section = "documents" | "historique" | "notifications" | "securite" | "parametres" | "connexions" | null;

function SectionHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <button onClick={onBack} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
        <ArrowLeft className="w-4 h-4 text-gray-700" />
      </button>
      <h3 className="font-extrabold text-base text-gray-900">{title}</h3>
    </div>
  );
}

// Documents médicaux
function DocumentsSection({ onBack, userId }: { onBack: () => void; userId: string | null }) {
  const [docs, setDocs] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newDoc, setNewDoc] = useState({ name: "", type: "Bilan", date: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    setNewDoc({ name: nameWithoutExt, type: "Autre", date: new Date().toISOString().split("T")[0] });
    setShowAdd(true);
    e.target.value = "";
  }

  useEffect(() => {
    if (!userId) { setLoadingDocs(false); return; }
    supabase.from("user_documents").select("*").eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setDocs(data || []); setLoadingDocs(false); });
  }, [userId]);

  const inp = "w-full bg-gray-100 text-sm font-medium rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#10AC84]/50";
  const typeColors: Record<string, string> = {
    "Bilan": "bg-blue-100 text-blue-700",
    "Ordonnance": "bg-teal-100 text-teal-700",
    "Compte-rendu": "bg-purple-100 text-purple-700",
    "Autre": "bg-gray-100 text-gray-600",
  };

  async function addDoc() {
    if (!newDoc.name.trim() || !newDoc.date || !userId) return;
    const { data } = await supabase.from("user_documents").insert({
      user_id: userId,
      name: newDoc.name,
      type: newDoc.type,
      doc_date: newDoc.date,
    }).select().single();
    if (data) setDocs(d => [data, ...d]);
    setShowAdd(false);
    setNewDoc({ name: "", type: "Bilan", date: "" });
  }

  async function deleteDoc(id: string) {
    setDocs(d => d.filter(x => x.id !== id));
    await supabase.from("user_documents").delete().eq("id", id);
  }

  return (
    <div>
      <SectionHeader title="Mes documents médicaux" onBack={onBack} />
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 flex gap-2 mb-4">
        <FileText className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs font-medium text-blue-700 leading-relaxed">
          Conservez ici vos bilans, ordonnances et comptes-rendus. Vos documents sont chiffrés et accessibles uniquement par vous.
        </p>
      </div>

      {loadingDocs && (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}

      <div className="flex flex-col gap-3 mb-4">
        {docs.map(doc => (
          <div key={doc.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-tight truncate">{doc.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${typeColors[doc.type] || "bg-gray-100 text-gray-600"}`}>{doc.type}</span>
                {doc.doc_date && (
                  <span className="text-[10px] font-medium text-gray-400">
                    {new Date(doc.doc_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => deleteDoc(doc.id)} className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAdd ? (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3 mb-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-gray-900">Ajouter un document</h4>
            <button onClick={() => setShowAdd(false)} className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <input id="doc-name" name="doc-name" value={newDoc.name} onChange={e => setNewDoc({ ...newDoc, name: e.target.value })} placeholder="Nom du document" className={inp} />
          <select id="doc-type" name="doc-type" value={newDoc.type} onChange={e => setNewDoc({ ...newDoc, type: e.target.value })} className={inp}>
            <option value="Bilan">Bilan biologique</option>
            <option value="Ordonnance">Ordonnance</option>
            <option value="Compte-rendu">Compte-rendu médical</option>
            <option value="Autre">Autre</option>
          </select>
          <input id="doc-date" name="doc-date" type="date" value={newDoc.date} onChange={e => setNewDoc({ ...newDoc, date: e.target.value })} className={inp} />
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600">Annuler</button>
            <button onClick={addDoc} className="flex-1 py-3 rounded-xl bg-[#10AC84] text-white text-sm font-bold shadow-md">Enregistrer</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-[#10AC84] font-bold text-sm flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Ajouter un document
        </button>
      )}

      <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileSelect} />
      <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 rounded-2xl border border-gray-200 text-gray-600 font-bold text-sm flex items-center justify-center gap-2 mt-2">
        <Upload className="w-4 h-4" /> Importer depuis l'appareil
      </button>
    </div>
  );
}

// Historique de santé
function HistoriqueSection({ onBack, userId }: { onBack: () => void; userId: string | null }) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({ record_date: "", cd4: "", viral_load: "", weight: "", note: "" });
  const [saving, setSaving] = useState(false);

  const inp = "w-full bg-gray-100 text-sm font-medium rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#10AC84]/50";

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    supabase.from("health_records").select("*").eq("user_id", userId)
      .order("record_date", { ascending: false })
      .then(({ data }) => { setEntries(data || []); setLoading(false); });
  }, [userId]);

  async function addEntry() {
    if (!newEntry.record_date || !userId) return;
    setSaving(true);
    const { data } = await supabase.from("health_records").insert({
      user_id: userId,
      record_date: newEntry.record_date,
      cd4: newEntry.cd4 ? parseInt(newEntry.cd4) : null,
      viral_load: newEntry.viral_load.trim() || null,
      weight: newEntry.weight ? parseFloat(newEntry.weight) : null,
      note: newEntry.note.trim() || null,
    }).select().single();
    if (data) setEntries(e => [data, ...e]);
    setShowAdd(false);
    setNewEntry({ record_date: "", cd4: "", viral_load: "", weight: "", note: "" });
    setSaving(false);
  }

  async function deleteEntry(id: string) {
    setEntries(e => e.filter(x => x.id !== id));
    await supabase.from("health_records").delete().eq("id", id);
  }

  const latest = entries[0];
  const cd4Entries = entries.filter(e => e.cd4 != null);
  const maxCd4 = cd4Entries.length > 0 ? Math.max(...cd4Entries.map(e => e.cd4)) : 1;

  return (
    <div>
      <SectionHeader title="Historique de santé" onBack={onBack} />

      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-[#10AC84] rounded-full animate-spin" />
        </div>
      )}

      {!loading && entries.length === 0 && !showAdd && (
        <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 mb-4">
          <HeartPulse className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-500">Aucune donnée de santé enregistrée.</p>
          <p className="text-xs text-gray-400 mt-1">Ajoutez vos résultats après chaque consultation.</p>
        </div>
      )}

      {/* Stats résumé — seulement si données */}
      {!loading && latest && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Dernier CD4",    value: latest.cd4 != null ? `${latest.cd4}` : "—",           unit: "/mm³",  color: "text-[#10AC84]", bg: "bg-emerald-50" },
            { label: "Charge virale",  value: latest.viral_load ?? "—",                              unit: "cp/mL", color: "text-blue-600",  bg: "bg-blue-50" },
            { label: "Poids actuel",   value: latest.weight != null ? `${latest.weight}` : "—",     unit: "kg",    color: "text-purple-600",bg: "bg-purple-50" },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center`}>
              <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
              <p className="text-[9px] font-bold text-gray-500">{s.unit}</p>
              <p className="text-[10px] font-medium text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Graphe CD4 — seulement si ≥2 entrées avec CD4 */}
      {!loading && cd4Entries.length >= 2 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#10AC84]" /> Évolution des CD4
          </h4>
          <div className="flex items-end gap-2 h-20">
            {cd4Entries.slice(0, 6).slice().reverse().map((e, i) => {
              const height = (e.cd4 / maxCd4) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t-lg transition-all ${e.cd4 >= 500 ? "bg-[#10AC84]" : e.cd4 >= 350 ? "bg-amber-400" : "bg-red-400"}`}
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[8px] font-medium text-gray-400 truncate w-full text-center">
                    {new Date(e.record_date).toLocaleDateString("fr-FR", { month: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500"><span className="w-2.5 h-2.5 rounded-full bg-[#10AC84] inline-block" /> ≥500 (Bon)</span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> 350–499</span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> &lt;350</span>
          </div>
        </div>
      )}

      {/* Formulaire ajout */}
      {showAdd ? (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3 mb-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-gray-900">Nouvelle entrée</h4>
            <button onClick={() => setShowAdd(false)} className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <input id="record-date" name="record-date" type="date" value={newEntry.record_date} onChange={e => setNewEntry({ ...newEntry, record_date: e.target.value })} className={inp} />
          <input id="record-cd4" name="record-cd4" type="number" value={newEntry.cd4} onChange={e => setNewEntry({ ...newEntry, cd4: e.target.value })} placeholder="CD4 (/mm³) — optionnel" className={inp} />
          <input id="record-viral-load" name="record-viral-load" value={newEntry.viral_load} onChange={e => setNewEntry({ ...newEntry, viral_load: e.target.value })} placeholder="Charge virale (ex: <50, 87) — optionnel" className={inp} />
          <input id="record-weight" name="record-weight" type="number" step="0.1" value={newEntry.weight} onChange={e => setNewEntry({ ...newEntry, weight: e.target.value })} placeholder="Poids (kg) — optionnel" className={inp} />
          <textarea id="record-note" name="record-note" value={newEntry.note} onChange={e => setNewEntry({ ...newEntry, note: e.target.value })} placeholder="Note du médecin ou observation — optionnel" className={inp + " resize-none"} rows={2} />
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600">Annuler</button>
            <button onClick={addEntry} disabled={!newEntry.record_date || saving} className="flex-1 py-3 rounded-xl bg-[#10AC84] text-white text-sm font-bold shadow-md disabled:opacity-50">
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-[#10AC84] font-bold text-sm flex items-center justify-center gap-2 mb-4">
          <Plus className="w-4 h-4" /> Ajouter une consultation
        </button>
      )}

      {/* Timeline */}
      {!loading && entries.length > 0 && (
        <>
          <h4 className="text-sm font-bold text-gray-900 mb-3">Consultations enregistrées</h4>
          <div className="flex flex-col gap-3">
            {entries.map(e => (
              <div key={e.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs font-bold text-gray-500">
                    {new Date(e.record_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <div className="flex items-center gap-2">
                    {e.cd4 != null && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${e.cd4 >= 500 ? "bg-emerald-100 text-emerald-700" : e.cd4 >= 350 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                        {e.cd4 >= 500 ? "Stable" : e.cd4 >= 350 ? "Attention" : "À surveiller"}
                      </span>
                    )}
                    <button onClick={() => deleteEntry(e.id)} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="text-center bg-gray-50 rounded-xl p-2">
                    <p className="text-sm font-black text-gray-800">{e.cd4 ?? "—"}</p>
                    <p className="text-[9px] font-medium text-gray-400">CD4/mm³</p>
                  </div>
                  <div className="text-center bg-gray-50 rounded-xl p-2">
                    <p className="text-sm font-black text-gray-800">{e.viral_load ?? "—"}</p>
                    <p className="text-[9px] font-medium text-gray-400">Charge virale</p>
                  </div>
                  <div className="text-center bg-gray-50 rounded-xl p-2">
                    <p className="text-sm font-black text-gray-800">{e.weight != null ? `${e.weight} kg` : "—"}</p>
                    <p className="text-[9px] font-medium text-gray-400">Poids</p>
                  </div>
                </div>
                {e.note && <p className="text-xs font-medium text-gray-500 bg-gray-50 rounded-xl px-3 py-2 leading-relaxed">{e.note}</p>}
              </div>
            ))}
          </div>
        </>
      )}

      <p className="text-[10px] font-medium text-gray-400 text-center mt-4">
        Les données affichées sont basées sur vos consultations enregistrées. Pour un historique complet, consultez votre médecin.
      </p>
    </div>
  );
}

const NOTIF_PREFS_KEY = "pp_notif_prefs";
const DEFAULT_PREFS = {
  rappelARV: true, rappelRDV: true, resultatsLabo: true,
  actualites: false, messages: true, objectifs: true, urgences: true,
};

function NotificationsSection({ onBack }: { onBack: () => void }) {
  const [prefs, setPrefs] = useState(() => {
    try {
      const stored = localStorage.getItem(NOTIF_PREFS_KEY);
      return stored ? { ...DEFAULT_PREFS, ...JSON.parse(stored) } : DEFAULT_PREFS;
    } catch { return DEFAULT_PREFS; }
  });
  const [saved, setSaved] = useState(false);

  function toggle(key: keyof typeof prefs) {
    setPrefs(p => ({ ...p, [key]: !p[key] }));
  }

  function save() {
    localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const items = [
    { key: "rappelARV" as const, label: "Rappels de prise d'ARV", desc: "Notification quotidienne à l'heure de votre traitement", icon: Pill, color: "text-[#FF9F43]", bg: "bg-orange-50", critical: true },
    { key: "rappelRDV" as const, label: "Rappels de rendez-vous", desc: "Notification 24h et 1h avant chaque RDV médical", icon: Calendar, color: "text-[#10AC84]", bg: "bg-emerald-50", critical: true },
    { key: "resultatsLabo" as const, label: "Résultats de laboratoire", desc: "Alerte quand de nouveaux résultats sont disponibles", icon: Activity, color: "text-blue-500", bg: "bg-blue-50", critical: false },
    { key: "messages" as const, label: "Messages & Chat", desc: "Notifications pour les nouveaux messages de la communauté", icon: Mail, color: "text-purple-500", bg: "bg-purple-50", critical: false },
    { key: "objectifs" as const, label: "Objectifs & Streaks", desc: "Encouragements et rappels pour maintenir votre suivi quotidien", icon: TrendingUp, color: "text-teal-500", bg: "bg-teal-50", critical: false },
    { key: "actualites" as const, label: "Actualités & Articles", desc: "Nouveaux articles et ressources publiés sur l'appli", icon: FileText, color: "text-gray-500", bg: "bg-gray-100", critical: false },
    { key: "urgences" as const, label: "Alertes d'urgence", desc: "Informations critiques de santé publique et rappels médicaments", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50", critical: true },
  ];

  return (
    <div>
      <SectionHeader title="Préférences de notification" onBack={onBack} />

      <div className="flex flex-col gap-3 mb-5">
        {items.map(item => {
          const Icon = item.icon;
          const isOn = prefs[item.key];
          return (
            <div key={item.key} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-gray-900">{item.label}</p>
                  {item.critical && <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md">Recommandé</span>}
                </div>
                <p className="text-xs font-medium text-gray-500 leading-tight mt-0.5">{item.desc}</p>
              </div>
              <button onClick={() => toggle(item.key)} className="shrink-0">
                <div className={`w-12 h-6 rounded-full transition-colors relative ${isOn ? "bg-[#10AC84]" : "bg-gray-200"}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isOn ? "translate-x-7" : "translate-x-1"}`} />
                </div>
              </button>
            </div>
          );
        })}
      </div>

      <button onClick={save} className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${saved ? "bg-emerald-500 text-white" : "bg-[#10AC84] text-white"}`}>
        {saved ? <><Check className="w-4 h-4" /> Préférences enregistrées</> : <><Save className="w-4 h-4" /> Enregistrer les préférences</>}
      </button>
    </div>
  );
}

// Sécurité & Mot de passe
function SecuriteSection({ onBack, userEmail }: { onBack: () => void; userEmail: string }) {
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const inp = "w-full bg-gray-100 text-sm font-medium rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#10AC84]/50";

  async function changePassword() {
    if (!newPwd || newPwd !== confirmPwd) {
      setMessage({ type: "error", text: "Les mots de passe ne correspondent pas." });
      return;
    }
    if (newPwd.length < 8) {
      setMessage({ type: "error", text: "Le mot de passe doit contenir au moins 8 caractères." });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Mot de passe mis à jour avec succès." });
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    }
  }

  async function changeEmail() {
    if (!newEmail || !newEmail.includes("@")) {
      setMessage({ type: "error", text: "Veuillez saisir une adresse email valide." });
      return;
    }
    setEmailLoading(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setEmailLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Un email de confirmation a été envoyé à votre nouvelle adresse." });
      setNewEmail("");
    }
  }

  return (
    <div>
      <SectionHeader title="Sécurité & Mot de passe" onBack={onBack} />

      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 ${message.type === "success" ? "bg-emerald-50 border border-emerald-100 text-emerald-800" : "bg-red-50 border border-red-100 text-red-700"}`}>
          {message.type === "success" ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <p className="text-xs font-medium">{message.text}</p>
        </div>
      )}

      {/* Compte actuel */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
        <p className="text-xs font-bold text-gray-500 mb-1">Compte actuel</p>
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-400" />
          <p className="text-sm font-bold text-gray-800">{userEmail}</p>
          <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md ml-auto">Vérifié</span>
        </div>
      </div>

      {/* Changer email */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Mail className="w-4 h-4 text-blue-500" /> Changer d'adresse email
        </h4>
        <div className="flex flex-col gap-3">
          <input
            id="change-email"
            name="email"
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            placeholder="Nouvelle adresse email"
            className={inp}
            autoComplete="email"
          />
          <button
            onClick={changeEmail}
            disabled={emailLoading}
            className="w-full py-3 rounded-xl bg-blue-500 text-white text-sm font-bold shadow-md disabled:opacity-50"
          >
            {emailLoading ? "Envoi en cours..." : "Mettre à jour l'email"}
          </button>
        </div>
      </div>

      {/* Changer mot de passe */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Key className="w-4 h-4 text-purple-500" /> Changer le mot de passe
        </h4>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <input
              id="new-password"
              name="new-password"
              type={showNewPwd ? "text" : "password"}
              value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
              placeholder="Nouveau mot de passe (min. 8 caractères)"
              className={inp + " pr-10"}
              autoComplete="new-password"
            />
            <button onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <input
            id="confirm-password"
            name="confirm-password"
            type="password"
            value={confirmPwd}
            onChange={e => setConfirmPwd(e.target.value)}
            placeholder="Confirmer le nouveau mot de passe"
            className={inp}
            autoComplete="new-password"
          />
          {newPwd && confirmPwd && newPwd !== confirmPwd && (
            <p className="text-xs font-bold text-red-500 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Les mots de passe ne correspondent pas
            </p>
          )}
          {newPwd.length >= 8 && newPwd === confirmPwd && (
            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <Check className="w-3 h-3" /> Mot de passe valide
            </p>
          )}
          <button
            onClick={changePassword}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#10AC84] text-white text-sm font-bold shadow-md disabled:opacity-50"
          >
            {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
          </button>
        </div>
      </div>

      {/* Conseils sécurité */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
        <h4 className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" /> Conseils de sécurité
        </h4>
        <ul className="space-y-1.5">
          {[
            "Utilisez un mot de passe unique pour Positif+",
            "Ne partagez jamais vos identifiants",
            "Activez le verrouillage automatique de votre téléphone",
            "Déconnectez-vous si vous utilisez un appareil partagé",
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <Check className="w-3 h-3 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs font-medium text-amber-800">{tip}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Paramètres généraux
function ParametresSection({ onBack, userId }: { onBack: () => void; userId: string | null }) {
  const [language, setLanguage] = useState<string>(() => localStorage.getItem("pp_language") || "fr");
  const [theme, setTheme] = useState<"light" | "auto">(() => (localStorage.getItem("pp_theme") as "light" | "auto") || "light");
  const [units, setUnits] = useState<"metric" | "imperial">(() => (localStorage.getItem("pp_units") as "metric" | "imperial") || "metric");
  const [fontSize, setFontSize] = useState<"normal" | "large">(() => (localStorage.getItem("pp_fontsize") as "normal" | "large") || "normal");
  const [contactPhone, setContactPhone] = useState("");
  const [saved, setSaved] = useState(false);
  const [stealthMode, setStealthMode] = useState(localStorage.getItem("pp_stealth_enabled") === "true");
  const [lockEnabled, setLockEnabled] = useState(lockSettings.isEnabled());
  const [lockDelay, setLockDelay]     = useState(lockSettings.getDelay());
  const [pinStep, setPinStep]         = useState<"idle"|"enter"|"confirm">("idle");
  const [pinA, setPinA]               = useState("");
  const [pinB, setPinB]               = useState("");
  const [pinError, setPinError]       = useState("");

  const inp = "w-full bg-gray-100 text-sm font-medium rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#10AC84]/50";

  useEffect(() => {
    if (!userId) return;
    supabase.from("profiles").select("contact_phone, preferences").eq("id", userId).single()
      .then(({ data }) => {
        if (data?.contact_phone) setContactPhone(data.contact_phone);
        // Restaurer préférences depuis Supabase (priorité sur localStorage)
        const prefs = data?.preferences as Record<string, string> | null;
        if (prefs) {
          if (prefs.language) { setLanguage(prefs.language); localStorage.setItem("pp_language", prefs.language); }
          if (prefs.theme)    { setTheme(prefs.theme as "light" | "auto"); localStorage.setItem("pp_theme", prefs.theme); }
          if (prefs.units)    { setUnits(prefs.units as "metric" | "imperial"); localStorage.setItem("pp_units", prefs.units); }
          if (prefs.fontSize) { setFontSize(prefs.fontSize as "normal" | "large"); localStorage.setItem("pp_fontsize", prefs.fontSize); }
        }
      });
  }, [userId]);

  // Appliquer la taille de police immédiatement quand elle change
  useEffect(() => {
    document.documentElement.style.fontSize = fontSize === "large" ? "18px" : "16px";
  }, [fontSize]);

  async function save() {
    const prefs = { language, theme, units, fontSize };
    localStorage.setItem("pp_language", language);
    localStorage.setItem("pp_theme", theme);
    localStorage.setItem("pp_units", units);
    localStorage.setItem("pp_fontsize", fontSize);
    document.documentElement.style.fontSize = fontSize === "large" ? "18px" : "16px";
    if (userId) {
      await supabase.from("profiles").update({
        contact_phone: contactPhone.trim() || null,
        preferences: prefs,
      }).eq("id", userId);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <SectionHeader title="Paramètres généraux" onBack={onBack} />

      <div className="flex flex-col gap-4 mb-5">

        {/* Langue */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <Globe className="w-4 h-4 text-blue-500" />
            </div>
            <h4 className="text-sm font-bold text-gray-900">Langue de l'application</h4>
          </div>
          <div className="flex gap-2">
            {[{ code: "fr", label: "Français", flag: "🇫🇷" }, { code: "wo", label: "Wolof", flag: "🇸🇳" }, { code: "en", label: "English", flag: "🇬🇧" }].map(l => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${language === l.code ? "bg-blue-500 text-white border-blue-500 shadow-sm" : "bg-white text-gray-600 border-gray-200"}`}
              >
                <span>{l.flag}</span> {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Thème */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
              <Sun className="w-4 h-4 text-amber-500" />
            </div>
            <h4 className="text-sm font-bold text-gray-900">Thème visuel</h4>
          </div>
          <div className="flex gap-2">
            {[{ val: "light", label: "Clair", icon: "☀️" }, { val: "auto", label: "Automatique", icon: "🌓" }].map(t => (
              <button
                key={t.val}
                onClick={() => setTheme(t.val as "light" | "auto")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${theme === t.val ? "bg-amber-500 text-white border-amber-500 shadow-sm" : "bg-white text-gray-600 border-gray-200"}`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Unités */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center">
              <Activity className="w-4 h-4 text-teal-500" />
            </div>
            <h4 className="text-sm font-bold text-gray-900">Unités de mesure</h4>
          </div>
          <div className="flex gap-2">
            {[{ val: "metric", label: "Métrique (kg, cm)" }, { val: "imperial", label: "Impérial (lbs, in)" }].map(u => (
              <button
                key={u.val}
                onClick={() => setUnits(u.val as "metric" | "imperial")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${units === u.val ? "bg-teal-500 text-white border-teal-500 shadow-sm" : "bg-white text-gray-600 border-gray-200"}`}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        {/* Taille de police */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-purple-500" />
            </div>
            <h4 className="text-sm font-bold text-gray-900">Taille de police</h4>
          </div>
          <div className="flex gap-2">
            {[{ val: "normal", label: "Normal" }, { val: "large", label: "Grand" }].map(f => (
              <button
                key={f.val}
                onClick={() => setFontSize(f.val as "normal" | "large")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${fontSize === f.val ? "bg-purple-500 text-white border-purple-500 shadow-sm" : "bg-white text-gray-600 border-gray-200"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Profil de contact */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center">
              <Phone className="w-4 h-4 text-[#FF6B6B]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Profil de contact</h4>
              <p className="text-[10px] font-medium text-gray-400">Pour être trouvable par vos amis</p>
            </div>
          </div>
          <input
            id="contact-phone"
            name="contact-phone"
            type="tel"
            value={contactPhone}
            onChange={e => setContactPhone(e.target.value)}
            placeholder="Numéro de téléphone (ex: +221 77 000 00 00)"
            className={inp}
            autoComplete="tel"
          />
        </div>

        {/* Verrou PIN */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Verrou PIN</h4>
                <p className="text-[10px] font-medium text-gray-400">Protège l'app après mise en veille</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (!lockEnabled) {
                  if (!lockSettings.hasPin()) { setPinStep("enter"); setPinA(""); setPinB(""); setPinError(""); }
                  else { lockSettings.setEnabled(true); setLockEnabled(true); }
                } else {
                  lockSettings.setEnabled(false); setLockEnabled(false);
                }
              }}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${lockEnabled ? "bg-[#10AC84]" : "bg-gray-200"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${lockEnabled ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>

          {/* Délai */}
          {lockEnabled && (
            <div className="mb-3">
              <p className="text-[11px] font-bold text-gray-500 mb-2">Verrouiller après</p>
              <div className="flex gap-2">
                {[{v:"0",l:"Immédiat"},{v:"60",l:"1 min"},{v:"300",l:"5 min"}].map(d => (
                  <button key={d.v} onClick={() => { setLockDelay(d.v); lockSettings.setDelay(d.v); }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${lockDelay === d.v ? "bg-slate-700 text-white border-slate-700" : "bg-white text-gray-600 border-gray-200"}`}>
                    {d.l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Changer PIN */}
          {lockEnabled && lockSettings.hasPin() && pinStep === "idle" && (
            <button onClick={() => { setPinStep("enter"); setPinA(""); setPinB(""); setPinError(""); }}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 underline underline-offset-2">
              Changer le code PIN
            </button>
          )}

          {/* Saisie PIN */}
          {pinStep !== "idle" && (
            <div className="mt-2">
              <p className="text-xs font-bold text-gray-700 mb-1">
                {pinStep === "enter" ? "Nouveau code PIN (4 chiffres)" : "Confirmer le code PIN"}
              </p>
              <input
                id="pin-input"
                name="pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pinStep === "enter" ? pinA : pinB}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g,"");
                  if (pinStep === "enter") setPinA(val);
                  else setPinB(val);
                }}
                placeholder="••••"
                autoComplete="off"
                className="w-full bg-gray-100 text-center text-lg font-bold tracking-[1rem] rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-slate-400/50 mb-2"
              />
              {pinError && <p className="text-xs text-red-500 font-bold mb-2">{pinError}</p>}
              <div className="flex gap-2">
                <button onClick={() => setPinStep("idle")}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500">
                  Annuler
                </button>
                <button
                  onClick={() => {
                    if (pinStep === "enter") {
                      if (pinA.length < 4) { setPinError("4 chiffres requis"); return; }
                      setPinStep("confirm"); setPinError("");
                    } else {
                      if (pinB !== pinA) { setPinError("Les codes ne correspondent pas"); setPinB(""); return; }
                      lockSettings.setPin(pinA);
                      lockSettings.setEnabled(true);
                      setLockEnabled(true);
                      setPinStep("idle"); setPinError("");
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-700 text-white text-xs font-bold">
                  {pinStep === "enter" ? "Suivant" : "Confirmer"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mode discret */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-lg">🌤️</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Mode discret</h4>
                <p className="text-[10px] font-medium text-gray-400">L'app se déguise en app météo au démarrage</p>
              </div>
            </div>
            <button
              onClick={() => {
                const next = !stealthMode;
                setStealthMode(next);
                localStorage.setItem("pp_stealth_enabled", String(next));
                if (!next) sessionStorage.removeItem("pp_stealth_unlocked");
              }}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${stealthMode ? "bg-[#10AC84]" : "bg-gray-200"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${stealthMode ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>
          {stealthMode && (
            <p className="mt-2.5 text-[11px] font-bold text-sky-600 bg-sky-50 rounded-xl px-3 py-2">
              Geste secret : appuyer <strong>5 fois</strong> sur l'icône ☁️ en haut à droite de l'écran météo
            </p>
          )}
        </div>

        {/* Version & infos */}
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <h4 className="text-xs font-bold text-gray-500 mb-2">Informations</h4>
          {[
            { label: "Version de l'application", value: "v1.0.0" },
            { label: "Dernière mise à jour", value: "Janvier 2026" },
            { label: "Plateforme", value: "iOS & Android" },
          ].map(info => (
            <div key={info.label} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
              <p className="text-xs font-medium text-gray-600">{info.label}</p>
              <p className="text-xs font-bold text-gray-800">{info.value}</p>
            </div>
          ))}
        </div>
      </div>

      <button onClick={save} className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${saved ? "bg-emerald-500 text-white" : "bg-[#10AC84] text-white"}`}>
        {saved ? <><Check className="w-4 h-4" /> Paramètres enregistrés</> : <><Save className="w-4 h-4" /> Enregistrer les paramètres</>}
      </button>
    </div>
  );
}

// Connexions / Amis
function ConnectionsSection({ onBack, userId }: { onBack: () => void; userId: string | null }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingIn, setPendingIn] = useState<any[]>([]);
  const [pendingOut, setPendingOut] = useState<any[]>([]);
  const [loadingConn, setLoadingConn] = useState(true);

  useEffect(() => {
    if (!userId) { setLoadingConn(false); return; }
    loadConnections();
  }, [userId]);

  async function loadConnections() {
    if (!userId) return;
    setLoadingConn(true);
    const [{ data: accepted }, { data: incoming }, { data: outgoing }] = await Promise.all([
      supabase.from("friendships")
        .select("*, requester:requester_id(pseudo,is_soignant,is_verified), addressee:addressee_id(pseudo,is_soignant,is_verified)")
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq("status", "accepted"),
      supabase.from("friendships")
        .select("*, requester:requester_id(pseudo,is_soignant,is_verified)")
        .eq("addressee_id", userId).eq("status", "pending"),
      supabase.from("friendships")
        .select("*, addressee:addressee_id(pseudo,is_soignant,is_verified)")
        .eq("requester_id", userId).eq("status", "pending"),
    ]);
    setFriends(accepted || []);
    setPendingIn(incoming || []);
    setPendingOut(outgoing || []);
    setLoadingConn(false);
  }

  async function search(query?: string) {
    const q = (query ?? searchQuery).trim();
    if (!q || !userId) return;
    setSearching(true); setSearchError(""); setSearchResult(null);
    const { data, error } = await supabase.rpc("search_user_by_contact", { search_query: q });
    if (error || !data || (data as any[]).length === 0) {
      setSearchError("Aucun membre trouvé avec cet email ou ce numéro.");
    } else {
      setSearchResult((data as any[])[0]);
    }
    setSearching(false);
  }

  async function pickFromContacts() {
    if (!("contacts" in navigator) || !("ContactsManager" in window)) {
      setSearchError("L'accès aux contacts n'est pas disponible sur ce navigateur (fonctionne sur Android Chrome).");
      return;
    }
    try {
      const contacts = await (navigator as any).contacts.select(["tel"], { multiple: true });
      if (!contacts || contacts.length === 0) return;
      for (const contact of contacts) {
        const tel = contact.tel?.[0];
        if (tel) {
          setSearchQuery(tel);
          await search(tel);
          return;
        }
      }
    } catch {
      setSearchError("Accès aux contacts refusé.");
    }
  }

  async function sendRequest(toId: string) {
    if (!userId) return;
    await supabase.from("friendships").insert({ requester_id: userId, addressee_id: toId, status: "pending" });
    setSearchResult(null); setSearchQuery("");
    loadConnections();
  }

  async function acceptRequest(id: string) {
    await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
    loadConnections();
  }

  async function declineRequest(id: string) {
    await supabase.from("friendships").delete().eq("id", id);
    loadConnections();
  }

  async function removeFriend(id: string) {
    await supabase.from("friendships").delete().eq("id", id);
    loadConnections();
  }

  function getOther(f: any) {
    return f.requester_id === userId ? f.addressee : f.requester;
  }

  const inp = "flex-1 bg-gray-100 text-sm font-medium rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#10AC84]/50";

  return (
    <div>
      <SectionHeader title="Mes connexions" onBack={onBack} />

      {/* Recherche */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
        <h4 className="text-sm font-bold text-gray-900 mb-1">Ajouter un ami</h4>
        <p className="text-xs font-medium text-gray-400 mb-3">Par adresse email ou numéro de téléphone</p>
        <div className="flex gap-2">
          <input
            id="friend-search"
            name="friend-search"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setSearchResult(null); setSearchError(""); }}
            onKeyDown={e => e.key === "Enter" && search()}
            placeholder="Email ou téléphone..."
            className={inp}
            autoComplete="off"
          />
          <button
            onClick={() => search()}
            disabled={searching || !searchQuery.trim()}
            className="px-4 py-2.5 bg-[#10AC84] text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={pickFromContacts}
          className="mt-2 w-full py-2.5 rounded-xl border border-dashed border-gray-200 text-xs font-bold text-gray-500 flex items-center justify-center gap-2 hover:bg-gray-50"
        >
          <Phone className="w-3.5 h-3.5" /> Depuis mes contacts
        </button>
        {searchError && <p className="text-xs font-medium text-rose-500 mt-2">{searchError}</p>}
        {searchResult && (
          <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FF9F43] flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{searchResult.pseudo}</p>
                <p className="text-[10px] font-medium text-gray-500">
                  {searchResult.is_soignant ? "Professionnel de santé" : "Membre PVVIH"}
                  {searchResult.is_verified && " · ✓ Vérifié"}
                </p>
              </div>
            </div>
            <button onClick={() => sendRequest(searchResult.id)} className="px-3 py-1.5 bg-[#10AC84] text-white text-xs font-bold rounded-full shadow-sm">
              Inviter
            </button>
          </div>
        )}
      </div>

      {/* Invitations reçues */}
      {pendingIn.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Invitations reçues ({pendingIn.length})
          </p>
          <div className="flex flex-col gap-2">
            {pendingIn.map(f => (
              <div key={f.id} className="bg-white rounded-2xl p-3 shadow-sm border border-orange-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{f.requester?.pseudo}</p>
                  <p className="text-[10px] text-gray-400">Souhaite se connecter avec vous</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => acceptRequest(f.id)} className="px-2.5 py-1.5 bg-[#10AC84] text-white text-xs font-bold rounded-full">Oui</button>
                  <button onClick={() => declineRequest(f.id)} className="px-2.5 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">Non</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liste amis */}
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
        Mes connexions ({friends.length})
      </p>
      {loadingConn && (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-[#10AC84] rounded-full animate-spin" />
        </div>
      )}
      {!loadingConn && friends.length === 0 && pendingIn.length === 0 && (
        <div className="text-center py-8 bg-white rounded-2xl border border-gray-100">
          <UserPlus className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-500">Pas encore de connexion</p>
          <p className="text-xs text-gray-400 mt-1">Recherchez un membre par email ou téléphone</p>
        </div>
      )}
      <div className="flex flex-col gap-2">
        {friends.map(f => {
          const other = getOther(f);
          return (
            <div key={f.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FF9F43] flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">{other?.pseudo}</p>
                <p className="text-[10px] font-medium text-gray-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  {other?.is_soignant ? "Professionnel" : "Membre PVVIH"}
                  {other?.is_verified && " · ✓"}
                </p>
              </div>
              <button onClick={() => removeFriend(f.id)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-400 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Invitations envoyées */}
      {pendingOut.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Invitations envoyées</p>
          {pendingOut.map(f => (
            <div key={f.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3 border border-gray-100 mb-2">
              <span className="text-sm font-medium text-gray-700">{f.addressee?.pseudo}</span>
              <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">En attente</span>
            </div>
          ))}
        </div>
      )}

      {/* Info: rendre son profil trouvable */}
      <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-3 flex items-start gap-2">
        <Phone className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-[11px] font-medium text-blue-700 leading-relaxed">
          Pour être trouvable, renseignez votre email de contact ou téléphone dans{" "}
          <strong>Paramètres → Profil de contact</strong>.
        </p>
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [meds, setMeds] = useState<any[]>([]);
  const [rdvList, setRdvList] = useState<any[]>([]);
  const [showAddMed, setShowAddMed] = useState(false);
  const [showAddRDV, setShowAddRDV] = useState(false);
  const [newMed, setNewMed] = useState({ name: "", dosage: "", frequency: "daily", reminder_time: "08:00" });
  const [newRDV, setNewRDV] = useState({ soignant_id: "", appointment_date: "", cta_name: "" });
  const [activeTab, setActiveTab] = useState<"compte" | "arv" | "rdv">("compte");
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>(null);

  const inp = "w-full bg-gray-100 text-sm font-medium rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#10AC84]/50";

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setUser(data.user);
      const uid = data.user.id;

      supabase.from("profiles").select("*").eq("id", uid).single().then(({ data: p }) => {
        if (p) setProfile(p);
      });

      supabase.from("medications").select("*").eq("user_id", uid).eq("is_active", true).then(({ data: d }) => {
        setMeds(d || []);
      });

      supabase.from("appointments")
        .select("*, soignant:soignant_id(id, pseudo, specialite)")
        .eq("patient_id", uid)
        .gte("appointment_date", new Date().toISOString())
        .order("appointment_date", { ascending: true })
        .then(({ data: a }) => { setRdvList(a || []); });
    });
  }, []);

  async function addMed() {
    if (!newMed.name.trim() || !user) return;
    const { data } = await supabase
      .from("medications")
      .insert({ user_id: user.id, ...newMed, is_active: true })
      .select()
      .single();
    if (data) setMeds(m => [...m, data]);
    setShowAddMed(false);
    setNewMed({ name: "", dosage: "", frequency: "daily", reminder_time: "08:00" });
  }

  async function deleteMed(id: string) {
    await supabase.from("medications").update({ is_active: false }).eq("id", id);
    setMeds(m => m.filter(med => med.id !== id));
  }

  async function addRDV() {
    if (!newRDV.appointment_date || !user) return;
    const { data } = await supabase
      .from("appointments")
      .insert({
        patient_id:       user.id,
        soignant_id:      profile?.soignant_id ?? null,
        appointment_date: new Date(newRDV.appointment_date).toISOString(),
        cta_name:         newRDV.cta_name || "CTA à définir",
        status:           "planifie",
      })
      .select("*, soignant:soignant_id(id, pseudo, specialite)")
      .single();
    if (data) setRdvList(r => [...r, data]);
    setShowAddRDV(false);
    setNewRDV({ soignant_id: "", appointment_date: "", cta_name: "" });
  }

  async function cancelRDV(id: string) {
    await supabase.from("appointments").update({ status: "annule" }).eq("id", id);
    setRdvList(r => r.filter(rdv => rdv.id !== id));
  }

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  }

  const displayName = profile?.pseudo || user?.email?.split("@")[0] || "Utilisateur";
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : null;
  const daysAsMember = user?.created_at
    ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000)
    : 0;
  const badgeProgresContinue = daysAsMember >= 7 && meds.length > 0;
  const badgeSuperMembre = daysAsMember >= 30;

  const menuItems = [
    { key: "connexions" as Section, icon: UserPlus, label: "Mes connexions & amis", color: "text-[#FF6B6B]", bg: "bg-rose-50" },
    { key: "documents" as Section, icon: FileText, label: "Mes documents médicaux", color: "text-blue-500", bg: "bg-blue-50" },
    { key: "historique" as Section, icon: HeartPulse, label: "Historique de santé", color: "text-[#10AC84]", bg: "bg-emerald-50" },
    { key: "notifications" as Section, icon: Bell, label: "Préférences de notification", color: "text-[#FF9F43]", bg: "bg-orange-50" },
    { key: "securite" as Section, icon: Lock, label: "Sécurité & Mot de passe", color: "text-purple-500", bg: "bg-purple-50" },
    { key: "parametres" as Section, icon: Settings, label: "Paramètres généraux", color: "text-gray-500", bg: "bg-gray-100" },
  ];

  return (
    <div className="flex flex-col min-h-full font-sans bg-gray-50 pb-28">
      {/* Header */}
      <div className="bg-white px-5 pt-8 pb-6 shadow-sm rounded-b-[2rem] relative z-10">
        <div className="flex justify-between items-start mb-6">
          <Logo variant="icon" />
          <button
            onClick={() => setActiveSection(activeSection ? null : "parametres")}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FF9F43] p-1 shadow-lg shadow-[#FF6B6B]/20">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-gray-400" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">{displayName}</h2>
            {memberSince && <p className="text-sm font-medium text-gray-500">Membre depuis {memberSince}</p>}
            {(badgeProgresContinue || badgeSuperMembre) && (
              <div className="flex gap-2 mt-2">
                {badgeProgresContinue && (
                  <span className="bg-[#1DD1A1]/10 text-[#10AC84] text-[10px] font-bold px-2 py-1 rounded-md border border-[#1DD1A1]/20">Progrès continu</span>
                )}
                {badgeSuperMembre && (
                  <span className="bg-purple-50 text-purple-600 text-[10px] font-bold px-2 py-1 rounded-md border border-purple-100">Super membre</span>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Tabs — masqués si sous-section active */}
        {!activeSection && (
          <div className="flex bg-gray-100 rounded-xl p-1">
            {(["compte", "arv", "rdv"] as const).map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
              >
                {t === "compte" ? "Compte" : t === "arv" ? "Mes ARV" : "RDV"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col gap-5">

        {/* ── Sous-sections ── */}
        {activeSection === "connexions" && (
          <ConnectionsSection onBack={() => setActiveSection(null)} userId={user?.id || null} />
        )}
        {activeSection === "documents" && (
          <DocumentsSection onBack={() => setActiveSection(null)} userId={user?.id || null} />
        )}
        {activeSection === "historique" && (
          <HistoriqueSection onBack={() => setActiveSection(null)} userId={user?.id || null} />
        )}
        {activeSection === "notifications" && (
          <NotificationsSection onBack={() => setActiveSection(null)} />
        )}
        {activeSection === "securite" && (
          <SecuriteSection onBack={() => setActiveSection(null)} userEmail={user?.email || ""} />
        )}
        {activeSection === "parametres" && (
          <ParametresSection onBack={() => setActiveSection(null)} userId={user?.id || null} />
        )}

        {/* ── Onglet Compte ── */}
        {!activeSection && activeTab === "compte" && (
          <>
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-start gap-4 shadow-sm">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-emerald-100">
                <ShieldCheck className="w-5 h-5 text-[#10AC84]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-900">Confidentialité garantie</h3>
                <p className="text-xs font-medium text-emerald-800/80 leading-relaxed mt-1">
                  Vos données médicales sont chiffrées de bout en bout et stockées en toute sécurité. Vous seul avez le contrôle sur vos informations.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100">
              {menuItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSection(item.key)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${item.bg}`}>
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <span className="text-sm font-bold text-gray-800">{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-400 transition-colors" />
                </button>
              ))}
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center justify-center gap-2 text-rose-500 font-bold text-sm p-4 bg-white rounded-2xl border border-rose-100 shadow-sm hover:bg-rose-50 transition-colors disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              {loggingOut ? "Déconnexion..." : "Se déconnecter"}
            </button>
            <div className="text-center mt-2">
              <Logo variant="icon" className="justify-center grayscale opacity-50 scale-75 mb-2" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ensemble, on est plus forts</p>
              <p className="text-[10px] font-medium text-gray-400 mt-1">Positif+ © 2026 · v1.0.0</p>
            </div>
          </>
        )}

        {/* ── Onglet ARV ── */}
        {!activeSection && activeTab === "arv" && (
          <div className="flex flex-col gap-3">
            {meds.length === 0 && !showAddMed && (
              <div className="text-center text-gray-400 py-10 bg-white rounded-2xl border border-gray-100">
                <Pill className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                <p className="text-sm font-medium">Aucun ARV enregistré.<br />Ajoutez votre traitement.</p>
              </div>
            )}
            {meds.map(m => (
              <div key={m.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                  <Pill className="w-5 h-5 text-[#FF9F43]" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-900">{m.name}</p>
                  <p className="text-xs text-gray-500 font-medium">
                    {m.dosage} · {m.frequency === "daily" ? "1×/jour" : m.frequency === "twice_daily" ? "2×/jour" : "Hebdo"} · {m.reminder_time}
                  </p>
                </div>
                <button onClick={() => deleteMed(m.id)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {showAddMed ? (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-gray-900">Ajouter un médicament</h3>
                  <button onClick={() => setShowAddMed(false)} className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <input id="profile-med-name" name="med-name" value={newMed.name} onChange={e => setNewMed({ ...newMed, name: e.target.value })} placeholder="Nom (ex: TDF/3TC/EFV)" className={inp} />
                <input id="profile-med-dosage" name="med-dosage" value={newMed.dosage} onChange={e => setNewMed({ ...newMed, dosage: e.target.value })} placeholder="Dosage (ex: 300mg)" className={inp} />
                <select id="profile-med-frequency" name="med-frequency" value={newMed.frequency} onChange={e => setNewMed({ ...newMed, frequency: e.target.value })} className={inp}>
                  <option value="daily">1×/jour</option>
                  <option value="twice_daily">2×/jour</option>
                  <option value="weekly">Hebdomadaire</option>
                </select>
                <input id="profile-med-reminder" name="med-reminder" type="time" value={newMed.reminder_time} onChange={e => setNewMed({ ...newMed, reminder_time: e.target.value })} className={inp} />
                <div className="flex gap-2">
                  <button onClick={() => setShowAddMed(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600">Annuler</button>
                  <button onClick={addMed} className="flex-1 py-3 rounded-xl bg-[#10AC84] text-white text-sm font-bold shadow-md">Enregistrer</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddMed(true)} className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-[#10AC84] font-bold text-sm flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Ajouter un ARV
              </button>
            )}
          </div>
        )}

        {/* ── Onglet RDV ── */}
        {!activeSection && activeTab === "rdv" && (
          <div className="flex flex-col gap-3">
            {rdvList.length === 0 && !showAddRDV && (
              <div className="text-center text-gray-400 py-10 bg-white rounded-2xl border border-gray-100">
                <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                <p className="text-sm font-medium">Aucun rendez-vous planifié.</p>
              </div>
            )}
            {rdvList.map((r, i) => (
              <div key={r.id || i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900">{r.cta_name || "CTA"}</p>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                      {r.soignant?.pseudo
                        ? `${r.soignant.pseudo}${r.soignant.specialite ? ` · ${r.soignant.specialite}` : ""}`
                        : "Soignant à confirmer"}
                    </p>
                    {r.notes && <p className="text-xs text-gray-400 mt-1 italic">{r.notes}</p>}
                  </div>
                  <span className={`ml-2 px-2 py-1 rounded-md text-[10px] font-bold shrink-0 ${
                    r.status === "confirme" ? "bg-emerald-50 text-[#10AC84]" :
                    r.status === "annule"   ? "bg-red-50 text-red-400" :
                    "bg-orange-50 text-[#FF9F43]"
                  }`}>
                    {r.status === "confirme" ? "Confirmé" : r.status === "annule" ? "Annulé" : "En attente"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#10AC84]" />
                      <span className="text-xs font-medium text-gray-600">
                        {new Date(r.appointment_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-gray-500">
                        {new Date(r.appointment_date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  {r.status !== "annule" && (
                    <button
                      onClick={() => cancelRDV(r.id)}
                      className="text-[10px] font-bold text-rose-400 hover:text-rose-600 transition-colors px-2 py-1 rounded-lg hover:bg-rose-50"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </div>
            ))}
            {showAddRDV ? (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-gray-900">Prendre un rendez-vous</h3>
                  <button onClick={() => setShowAddRDV(false)} className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <input
                  id="rdv-cta-name"
                  name="rdv-cta-name"
                  value={newRDV.cta_name}
                  onChange={e => setNewRDV({ ...newRDV, cta_name: e.target.value })}
                  placeholder="Nom du CTA (ex: CTA Hôpital de Fann)"
                  className={inp}
                />
                <input
                  id="rdv-date"
                  name="rdv-date"
                  type="datetime-local"
                  value={newRDV.appointment_date}
                  onChange={e => setNewRDV({ ...newRDV, appointment_date: e.target.value })}
                  className={inp}
                  min={new Date().toISOString().slice(0, 16)}
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowAddRDV(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600">Annuler</button>
                  <button onClick={addRDV} className="flex-1 py-3 rounded-xl bg-[#10AC84] text-white text-sm font-bold shadow-md">Enregistrer</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddRDV(true)}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-[#10AC84] font-bold text-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Prendre un nouveau RDV
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
