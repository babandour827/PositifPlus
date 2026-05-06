import { useState } from "react";
import { Users, MessageCircle, Bot, UserRound } from "lucide-react";
import { Community } from "./Community";
import Chat from "./Chat";
import { AIAssistant } from "./AIAssistant";
import { SoignantPatients } from "./SoignantPatients";
import { useProfile } from "../../hooks/useProfile";

type PatientTab = "forum" | "messages" | "ia";
type SoignantTab = "patients" | "forum" | "messages" | "ia";

const PATIENT_TABS: { key: PatientTab; label: string; icon: React.ElementType }[] = [
  { key: "forum",    label: "Forum",        icon: Users },
  { key: "messages", label: "Messages",     icon: MessageCircle },
  { key: "ia",       label: "Assistant IA", icon: Bot },
];

const SOIGNANT_TABS: { key: SoignantTab; label: string; icon: React.ElementType }[] = [
  { key: "patients", label: "Mes Patients", icon: UserRound },
  { key: "forum",    label: "Forum",        icon: Users },
  { key: "messages", label: "Messages",     icon: MessageCircle },
  { key: "ia",       label: "Assistant IA", icon: Bot },
];

export function Echanges() {
  const { isSoignant, profile } = useProfile();
  const [patientTab, setPatientTab] = useState<PatientTab>("forum");
  const [soignantTab, setSoignantTab] = useState<SoignantTab>("patients");

  /* ── VUE SOIGNANT ──────────────────────────────────────────────────────── */
  if (isSoignant) {
    return (
      <div className="flex flex-col h-full font-sans bg-gray-50">
        {/* Tab switcher soignant */}
        <div className="bg-white px-4 pt-3 pb-3 border-b border-gray-100 shadow-sm shrink-0 sticky top-0 z-20">
          {/* Badge rôle */}
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Interface Soignant
            </span>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {SOIGNANT_TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSoignantTab(key)}
                className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                  soignantTab === key
                    ? key === "patients"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto">
          {soignantTab === "patients"  && (
            <SoignantPatients soignantCta={profile?.cta_id ?? "CTA Sénégal"} />
          )}
          {soignantTab === "forum"    && <Community />}
          {soignantTab === "messages" && <Chat />}
          {soignantTab === "ia"       && <AIAssistant />}
        </div>
      </div>
    );
  }

  /* ── VUE PATIENT ───────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-full font-sans bg-gray-50">
      <div className="bg-white px-4 pt-3 pb-3 border-b border-gray-100 shadow-sm shrink-0 sticky top-0 z-20">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {PATIENT_TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setPatientTab(key)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                patientTab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {patientTab === "forum"    && <Community />}
        {patientTab === "messages" && <Chat />}
        {patientTab === "ia"       && <AIAssistant />}
      </div>
    </div>
  );
}
