import { useState, useEffect } from "react";
import { Calendar, Clock, User, X, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

interface RDV {
  id: string;
  appointment_date: string;
  cta_name: string;
  status: string;
  notes: string | null;
  patient: { id: string; pseudo: string } | null;
}

type DayGroup = { label: string; date: string; rdvs: RDV[] };

function statusCfg(status: string) {
  if (status === "confirme")  return { label: "Confirmé",   bg: "bg-emerald-50",  text: "text-[#10AC84]",    icon: CheckCircle2 };
  if (status === "annule")    return { label: "Annulé",     bg: "bg-red-50",      text: "text-rose-400",     icon: X };
  return                             { label: "En attente", bg: "bg-orange-50",   text: "text-[#FF9F43]",    icon: AlertCircle };
}

function groupByDay(rdvs: RDV[]): DayGroup[] {
  const map = new Map<string, RDV[]>();
  rdvs.forEach(r => {
    const d = new Date(r.appointment_date);
    const key = d.toISOString().slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  return Array.from(map.entries()).map(([date, items]) => {
    const d = new Date(date);
    let label: string;
    if (d.getTime() === today.getTime())    label = "Aujourd'hui";
    else if (d.getTime() === tomorrow.getTime()) label = "Demain";
    else label = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    label = label.charAt(0).toUpperCase() + label.slice(1);
    return { label, date, rdvs: items };
  });
}

export function SoignantAgenda() {
  const [groups, setGroups]   = useState<DayGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("appointments")
        .select("id, appointment_date, cta_name, status, notes, patient:patient_id(id, pseudo)")
        .eq("soignant_id", user.id)
        .neq("status", "annule")
        .gte("appointment_date", new Date().toISOString())
        .order("appointment_date", { ascending: true });

      setGroups(groupByDay((data as any) || []));
      setLoading(false);
    }
    load();
  }, []);

  async function cancelRDV(id: string) {
    setCancelling(id);
    await supabase.from("appointments").update({ status: "annule" }).eq("id", id);
    setGroups(prev =>
      prev.map(g => ({ ...g, rdvs: g.rdvs.filter(r => r.id !== id) }))
          .filter(g => g.rdvs.length > 0)
    );
    setCancelling(null);
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50 font-sans">

      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-3 border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-gray-900 leading-tight">Agenda</h2>
            <p className="text-[11px] text-gray-400 font-medium">Vos prochains rendez-vous</p>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 px-4 py-4 flex flex-col gap-5">

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}

        {!loading && groups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center">
              <Calendar className="w-8 h-8 text-blue-300" />
            </div>
            <p className="text-sm font-bold text-gray-600">Aucun rendez-vous à venir</p>
            <p className="text-xs text-gray-400 text-center max-w-[200px] leading-relaxed">
              Planifiez des RDV depuis la fiche de vos patients.
            </p>
          </div>
        )}

        {groups.map(group => (
          <div key={group.date}>
            {/* Séparateur jour */}
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest shrink-0">
                {group.label}
              </span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <div className="flex flex-col gap-2.5">
              {group.rdvs.map(rdv => {
                const cfg = statusCfg(rdv.status);
                const StatusIcon = cfg.icon;
                const heure = new Date(rdv.appointment_date)
                  .toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

                return (
                  <div key={rdv.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-start gap-3">
                      {/* Heure */}
                      <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs font-extrabold text-blue-600 leading-tight">{heure}</span>
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shrink-0">
                            <User className="w-3 h-3 text-white" />
                          </div>
                          <p className="font-extrabold text-sm text-gray-900 truncate">
                            {rdv.patient?.pseudo || "Patient inconnu"}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400 font-medium truncate">{rdv.cta_name}</p>
                        {rdv.notes && (
                          <p className="text-[11px] text-gray-500 mt-1 italic leading-snug line-clamp-2">
                            {rdv.notes}
                          </p>
                        )}
                      </div>

                      {/* Statut + annuler */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                        <button
                          onClick={() => cancelRDV(rdv.id)}
                          disabled={cancelling === rdv.id}
                          className="text-[10px] font-bold text-rose-400 hover:text-rose-600 transition-colors disabled:opacity-40"
                        >
                          {cancelling === rdv.id ? "..." : "Annuler"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Compteur total */}
        {!loading && groups.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 py-2">
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <p className="text-xs text-gray-400 font-medium">
              {groups.reduce((acc, g) => acc + g.rdvs.length, 0)} rendez-vous à venir
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
