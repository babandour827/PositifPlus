import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabaseClient";
import { ChevronRight, MapPin, Globe, ShieldCheck, HeartPulse, Lock, CheckSquare, Square, FileText } from "lucide-react";

const REGIONS = ["Dakar","Thiès","Saint-Louis","Ziguinchor","Kaolack","Diourbel","Fatick","Kaffrine","Kédougou","Kolda","Louga","Matam","Sédhiou","Tambacounda"];
const CTA_LIST = ["CTA Hôpital de Fann","CTA Hôpital Principal","CTA Hôpital Le Dantec","CTA Ziguinchor","CTA Saint-Louis","CTA Kaolack","CTA Thiès"];
const LANGUES = [
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "wo", flag: "🇸🇳", label: "Wolof" },
  { code: "en", flag: "🇬🇧", label: "English" },
];

// Step 0 = RGPD consent, Step 1 = pseudo, Step 2 = localisation, Step 3 = langue
const STEPS = [
  { title: "Confidentialité",   sub: "Votre vie privée est notre priorité absolue" },
  { title: "Votre identité",    sub: "Commençons par personnaliser votre espace" },
  { title: "Votre localisation",sub: "Pour vous connecter au CTA le plus proche" },
  { title: "Votre langue",      sub: "L'app s'adapte à votre préférence" },
];

const RGPD_ITEMS = [
  {
    id: "anon",
    icon: "🔒",
    title: "Anonymat total",
    desc: "Votre vrai nom n'est jamais requis ni stocké. Votre pseudonyme est la seule identité visible.",
  },
  {
    id: "data",
    icon: "🛡️",
    title: "Données protégées",
    desc: "Vos données de santé sont chiffrées et hébergées conformément à la Loi n° 2008-12 sur la protection des données personnelles au Sénégal.",
  },
  {
    id: "share",
    icon: "🤝",
    title: "Aucun partage sans consentement",
    desc: "Vos informations ne sont jamais vendues ni partagées avec des tiers sans votre accord explicite.",
  },
  {
    id: "delete",
    icon: "🗑️",
    title: "Droit à l'effacement",
    desc: "Vous pouvez supprimer l'intégralité de votre compte et de vos données à tout moment depuis Paramètres.",
  },
];

export function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [pseudo, setPseudo] = useState("");
  const [region, setRegion] = useState("");
  const [cta, setCta] = useState("");
  const [langue, setLangue] = useState("fr");
  const [saving, setSaving] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [dataChecked, setDataChecked] = useState(false);

  const inp = "w-full bg-gray-50 border border-gray-200 text-sm font-medium rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/50";

  async function finish() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").upsert({
        id: user.id,
        pseudo: pseudo || `Membre${Math.floor(Math.random() * 9999)}`,
        region,
        cta_id: cta,
        langue,
        is_soignant: false,
        is_verified: false,
      });
    }
    localStorage.setItem("pp_onboarded", "1");
    localStorage.setItem("language", langue);
    localStorage.setItem("pp_rgpd_consent", "1");
    setSaving(false);
    navigate("/app", { replace: true });
  }

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else finish();
  }

  const canNext =
    step === 0 ? consentChecked && dataChecked :
    step === 1 ? pseudo.trim().length >= 2 :
    step === 2 ? true :
    true;

  const stepIcon = [
    <Lock className="w-6 h-6 text-white" />,
    <HeartPulse className="w-6 h-6 text-white" />,
    <MapPin className="w-6 h-6 text-white" />,
    <Globe className="w-6 h-6 text-white" />,
  ][step];

  return (
    <div className="mx-auto w-full max-w-md min-h-[100dvh] bg-white flex flex-col font-sans sm:shadow-2xl">
      {/* Progress */}
      <div className="flex gap-1.5 px-5 pt-8 pb-2">
        {STEPS.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? "bg-[#FF6B6B]" : "bg-gray-200"}`} />
        ))}
      </div>
      <p className="text-center text-[10px] font-bold text-gray-400 pt-1">Étape {step + 1} sur {STEPS.length}</p>

      {/* Header */}
      <div className="px-5 pt-4 pb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B6B] to-[#FF9F43] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#FF6B6B]/20">
          {stepIcon}
        </div>
        <h1 className="text-2xl font-black text-gray-900">{STEPS[step].title}</h1>
        <p className="text-sm font-medium text-gray-500 mt-1">{STEPS[step].sub}</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 flex flex-col gap-4 overflow-y-auto">

        {/* Étape 0 — RGPD Consent */}
        {step === 0 && (
          <>
            <div className="flex flex-col gap-3">
              {RGPD_ITEMS.map(item => (
                <div key={item.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-start gap-3">
                  <span className="text-xl shrink-0">{item.icon}</span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-0.5">{item.title}</h3>
                    <p className="text-[11px] font-medium text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 flex items-start gap-2">
              <FileText className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[11px] font-medium text-blue-700">
                En continuant, vous acceptez nos{" "}
                <span className="font-bold underline cursor-pointer">Conditions d'utilisation</span>{" "}
                et notre{" "}
                <span className="font-bold underline cursor-pointer">Politique de confidentialité</span>.
              </p>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-col gap-3 pb-2">
              <button
                onClick={() => setConsentChecked(v => !v)}
                className="flex items-start gap-3 text-left"
              >
                {consentChecked
                  ? <CheckSquare className="w-5 h-5 text-[#FF6B6B] shrink-0 mt-0.5" />
                  : <Square className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                }
                <span className="text-xs font-semibold text-gray-700 leading-relaxed">
                  J'ai lu et j'accepte les conditions d'utilisation et la politique de confidentialité de Positif+. <span className="text-rose-500">*</span>
                </span>
              </button>

              <button
                onClick={() => setDataChecked(v => !v)}
                className="flex items-start gap-3 text-left"
              >
                {dataChecked
                  ? <CheckSquare className="w-5 h-5 text-[#FF6B6B] shrink-0 mt-0.5" />
                  : <Square className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                }
                <span className="text-xs font-semibold text-gray-700 leading-relaxed">
                  Je comprends que mes données de santé sont traitées de manière confidentielle et ne seront jamais partagées sans mon consentement. <span className="text-rose-500">*</span>
                </span>
              </button>
            </div>
          </>
        )}

        {/* Étape 1 — Pseudo */}
        {step === 1 && (
          <>
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#FF9F43] shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-orange-800 leading-relaxed">
                Votre <strong>vrai nom n'est jamais affiché</strong>. Choisissez un pseudo qui vous représente sans vous identifier.
              </p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1.5 block">Votre pseudo anonyme *</label>
              <input
                value={pseudo}
                onChange={e => setPseudo(e.target.value)}
                placeholder="ex: Soleil2024, ForceÉtoile..."
                className={inp}
                maxLength={30}
                autoFocus
              />
              <p className="text-[10px] text-gray-400 mt-1">{pseudo.length}/30 caractères · min. 2 caractères</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <h3 className="text-sm font-bold text-emerald-900 mb-2">Les 3 piliers de Positif+</h3>
              <div className="flex flex-col gap-2">
                {[
                  { icon: "💬", text: "Communauté pair-à-pair anonyme" },
                  { icon: "🏥", text: "Messagerie sécurisée avec votre CTA" },
                  { icon: "🤖", text: "Assistant IA médical bienveillant" },
                ].map(p => (
                  <div key={p.icon} className="flex items-center gap-2">
                    <span className="text-base">{p.icon}</span>
                    <span className="text-xs font-medium text-emerald-800">{p.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Étape 2 — Région + CTA */}
        {step === 2 && (
          <>
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1.5 block">Votre région <span className="text-gray-400 font-normal">(optionnel)</span></label>
              <select value={region} onChange={e => setRegion(e.target.value)} className={inp}>
                <option value="">Sélectionner votre région...</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1.5 block">Votre CTA habituel <span className="text-gray-400 font-normal">(optionnel)</span></label>
              <select value={cta} onChange={e => setCta(e.target.value)} className={inp}>
                <option value="">Sélectionner votre CTA...</option>
                {CTA_LIST.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3">
              <p className="text-[11px] font-medium text-blue-700">
                Ces informations permettent à l'app de vous suggérer le CTA le plus proche et d'adapter les informations à votre région. Elles restent confidentielles.
              </p>
            </div>
          </>
        )}

        {/* Étape 3 — Langue */}
        {step === 3 && (
          <>
            <div className="flex flex-col gap-3">
              {LANGUES.map(l => (
                <button
                  key={l.code}
                  onClick={() => setLangue(l.code)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${langue === l.code ? "border-[#FF6B6B] bg-rose-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
                >
                  <span className="text-3xl">{l.flag}</span>
                  <span className={`text-base font-bold ${langue === l.code ? "text-[#FF6B6B]" : "text-gray-700"}`}>{l.label}</span>
                  {langue === l.code && (
                    <div className="ml-auto w-5 h-5 rounded-full bg-[#FF6B6B] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-[11px] font-medium text-gray-400 text-center">
              Vous pourrez changer la langue à tout moment dans votre profil.
            </p>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-10 pt-4 shrink-0">
        <button
          onClick={next}
          disabled={!canNext || saving}
          className="w-full py-4 bg-gradient-to-r from-[#FF6B6B] to-[#FF9F43] text-white font-bold rounded-xl shadow-lg shadow-[#FF6B6B]/20 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? "Enregistrement..." : step < STEPS.length - 1 ? "Continuer" : "Commencer Positif+"}
          {!saving && <ChevronRight className="w-4 h-4" />}
        </button>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="w-full mt-2 py-2 text-sm font-medium text-gray-500">
            ← Retour
          </button>
        )}
        {step >= 1 && step < STEPS.length - 1 && (
          <button onClick={finish} className="w-full mt-1 py-2 text-xs font-medium text-gray-400">
            Passer cette étape
          </button>
        )}
      </div>
    </div>
  );
}
