import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabaseClient";
import { Logo } from "../components/Logo";
import { Eye, EyeOff, Shield, Stethoscope, Users, CheckCircle2, ChevronRight, AlertTriangle } from "lucide-react";
import i18n from "../../i18n/i18n";

const LANGS = [
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "wo", flag: "🇸🇳", label: "Wolof" },
  { code: "en", flag: "🇬🇧", label: "English" },
];

const SPECIALITES = [
  "Médecin infectiologue",
  "Médecin généraliste",
  "Infirmier(e) CTA",
  "Pair-éducateur / Médiateur",
  "Pharmacien(ne)",
  "Psychologue clinicien",
  "Sage-femme",
  "Assistant social",
  "Autre professionnel de santé",
];

const CTA_LIST = [
  "CTA Hôpital de Fann — Dakar",
  "CTA Hôpital Principal — Dakar",
  "CTA Hôpital Aristide Le Dantec — Dakar",
  "CTA Hôpital de Ziguinchor",
  "CTA Hôpital Régional de Saint-Louis",
  "CTA Hôpital Régional de Kaolack",
  "CTA Hôpital Régional de Thiès",
  "CTA Hôpital Régional de Kolda",
  "CTA Hôpital Régional de Tambacounda",
  "CTA Hôpital Régional de Kédougou",
  "Autre CTA / Structure",
];

type Role = "patient" | "soignant" | null;

export function Auth() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "register">("login");

  // Champs communs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lang, setLang] = useState(localStorage.getItem("language") || "fr");

  // Champs inscription
  const [role, setRole] = useState<Role>(null);
  const [pseudo, setPseudo] = useState("");
  const [nomPro, setNomPro] = useState("");
  const [specialite, setSpecialite] = useState("");
  const [cta, setCta] = useState("");
  const [phone, setPhone] = useState("");
  const [soignantId, setSoignantId] = useState("");
  const [soignantsList, setSoignantsList] = useState<{ id: string; pseudo: string; specialite: string | null; cta_id: string | null }[]>([]);
  const [soignantsLoading, setSoignantsLoading] = useState(false);
  const [soignantsLoaded, setSoignantsLoaded] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/app", { replace: true });
    });
    // Précharger la liste des soignants pour le formulaire d'inscription patient
    loadSoignants();
  }, [navigate]);

  function switchLang(code: string) {
    setLang(code);
    i18n.changeLanguage(code);
    localStorage.setItem("language", code);
  }

  function resetRegister() {
    setRole(null); setPseudo(""); setNomPro(""); setSpecialite(""); setCta(""); setPhone("");
    setSoignantId(""); setSoignantsList([]); setSoignantsLoaded(false);
    setEmail(""); setPassword(""); setError("");
  }

  async function loadSoignants() {
    setSoignantsLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, pseudo, specialite, cta_id")
      .eq("is_soignant", true)
      .eq("is_verified", true)
      .order("pseudo");
    setSoignantsList(data || []);
    setSoignantsLoading(false);
    setSoignantsLoaded(true);
  }

  async function handleLogin() {
    if (!email || !password) { setError("Remplissez tous les champs."); return; }
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError("Email ou mot de passe incorrect."); return; }
    navigate("/app", { replace: true });
  }

  async function handleRegister() {
    if (!role) { setError("Choisissez votre profil."); return; }
    if (!email || !password) { setError("Remplissez email et mot de passe."); return; }
    if (password.length < 6) { setError("Mot de passe : 6 caractères minimum."); return; }
    if (role === "patient" && !pseudo.trim()) { setError("Choisissez un pseudo anonyme."); return; }
    if (role === "soignant" && !nomPro.trim()) { setError("Renseignez votre nom professionnel."); return; }

    setLoading(true); setError("");
    const displayName = role === "soignant" ? nomPro : pseudo;
    const { data, error: err } = await supabase.auth.signUp({
      email, password, options: { data: { pseudo: displayName } },
    });
    if (err) { setLoading(false); setError(err.message); return; }
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        pseudo: displayName,
        langue: lang,
        is_soignant: role === "soignant",
        is_verified: false,
        specialite: role === "soignant" ? specialite : null,
        cta_id: role === "soignant" ? cta : null,
        contact_phone: phone.trim() || null,
        soignant_id: role === "patient" && soignantId ? soignantId : null,
      });
    }
    setLoading(false);
    localStorage.setItem("pp_profile_cache", JSON.stringify({
      pseudo: displayName,
      is_soignant: role === "soignant",
      specialite: role === "soignant" ? specialite : null,
      cta_id: role === "soignant" ? cta : null,
    }));
    navigate(!localStorage.getItem("pp_onboarded") ? "/onboarding" : "/app", { replace: true });
  }

  const inp = "w-full bg-gray-50 border border-gray-200 text-sm font-medium rounded-xl py-3.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/50 focus:border-transparent transition-shadow";
  const canSubmit = role === "patient" ? pseudo.trim().length >= 2 : (role === "soignant" ? nomPro.trim().length >= 2 : false);

  return (
    <div className="mx-auto w-full max-w-md min-h-[100dvh] bg-white flex flex-col font-sans sm:shadow-2xl sm:border sm:border-gray-200 sm:rounded-[2rem]">

      {/* Header */}
      <div className="bg-gradient-to-br from-[#FF6B6B] to-[#FF9F43] px-5 pt-12 pb-9 flex flex-col items-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-3 right-3 w-24 h-24 rounded-full bg-white/50 blur-2xl" />
          <div className="absolute bottom-0 left-5 w-16 h-16 rounded-full bg-white/50 blur-xl" />
        </div>
        <Logo variant="full" />
        <p className="text-white/90 text-sm font-medium mt-2 text-center">Votre espace santé sécurisé · Sénégal</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 mx-5 mt-5 rounded-xl p-1">
        <button
          onClick={() => { setTab("login"); setError(""); }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === "login" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
        >
          Connexion
        </button>
        <button
          onClick={() => { setTab("register"); resetRegister(); }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === "register" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
        >
          Inscription
        </button>
      </div>

      <div className="flex-1 px-5 pt-5 flex flex-col gap-4 overflow-y-auto pb-8">

        {/* ── CONNEXION ─────────────────────────────────────── */}
        {tab === "login" && (
          <>
            <input id="login-email" name="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Email" className={inp} autoComplete="email" />
            <div className="relative">
              <input
                id="login-password" name="password"
                type={showPwd ? "text" : "password"} value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="Mot de passe" className={inp + " pr-12"}
                autoComplete="current-password"
              />
              <button onClick={() => setShowPwd(!showPwd)} type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </>
        )}

        {/* ── INSCRIPTION ───────────────────────────────────── */}
        {tab === "register" && (
          <>
            {/* 1. Sélecteur de rôle */}
            <div>
              <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Je suis…</p>
              <div className="grid grid-cols-2 gap-3">
                {/* Patient */}
                <button
                  onClick={() => setRole("patient")}
                  className={`relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                    role === "patient"
                      ? "border-[#10AC84] bg-emerald-50 shadow-md shadow-[#10AC84]/10"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  {role === "patient" && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#10AC84] flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </span>
                  )}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${role === "patient" ? "bg-[#10AC84]" : "bg-gray-100"}`}>
                    <Users className={`w-6 h-6 ${role === "patient" ? "text-white" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${role === "patient" ? "text-[#10AC84]" : "text-gray-800"}`}>Patient PVVIH</p>
                    <p className="text-[10px] font-medium text-gray-400 mt-0.5 leading-tight">
                      Communauté de soutien anonyme
                    </p>
                  </div>
                </button>

                {/* Soignant */}
                <button
                  onClick={() => setRole("soignant")}
                  className={`relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                    role === "soignant"
                      ? "border-blue-500 bg-blue-50 shadow-md shadow-blue-500/10"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  {role === "soignant" && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </span>
                  )}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${role === "soignant" ? "bg-blue-500" : "bg-gray-100"}`}>
                    <Stethoscope className={`w-6 h-6 ${role === "soignant" ? "text-white" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${role === "soignant" ? "text-blue-600" : "text-gray-800"}`}>Professionnel</p>
                    <p className="text-[10px] font-medium text-gray-400 mt-0.5 leading-tight">
                      Médecin, infirmier, CTA…
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* 2a. Champs PATIENT */}
            {role === "patient" && (
              <div className="flex flex-col gap-3 animate-[fadeIn_.2s_ease]">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#10AC84] shrink-0" />
                  <p className="text-[11px] font-bold text-emerald-800">Votre vrai nom n'est jamais affiché.</p>
                </div>
                <input
                  id="register-pseudo" name="pseudo"
                  value={pseudo} onChange={e => setPseudo(e.target.value)}
                  placeholder="Pseudo anonyme (ex: Soleil2024)"
                  className={inp} autoComplete="off" maxLength={30}
                />
                <p className="text-[10px] text-gray-400 -mt-2">{pseudo.length}/30 caractères · min. 2</p>
                <select
                  id="register-soignant" name="soignant"
                  value={soignantId}
                  onChange={e => setSoignantId(e.target.value)}
                  disabled={soignantsLoading}
                  className={inp + " appearance-none"}
                >
                  <option value="">
                    {soignantsLoading
                      ? "Chargement des soignants…"
                      : soignantsLoaded && soignantsList.length === 0
                        ? "Aucun soignant disponible pour l'instant"
                        : "Mon médecin / soignant référent… (optionnel)"}
                  </option>
                  {soignantsList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.pseudo}{s.specialite ? ` — ${s.specialite}` : ""}{s.cta_id ? ` · ${s.cta_id}` : ""}
                    </option>
                  ))}
                </select>

                {/* Avertissement si soignants disponibles mais aucun sélectionné */}
                {soignantsLoaded && soignantsList.length > 0 && !soignantId && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 -mt-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold text-amber-800 leading-snug">
                      Choisir un soignant permet un suivi personnalisé. Vous pourrez le modifier dans votre profil.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 2b. Champs SOIGNANT */}
            {role === "soignant" && (
              <div className="flex flex-col gap-3 animate-[fadeIn_.2s_ease]">
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-blue-500 shrink-0" />
                  <p className="text-[11px] font-bold text-blue-800">
                    Votre profil sera vérifié par l'équipe Positif+.
                  </p>
                </div>
                <input
                  id="register-nom-pro" name="nom_pro"
                  value={nomPro} onChange={e => setNomPro(e.target.value)}
                  placeholder="Nom professionnel (ex: Dr. Fatou Diallo)"
                  className={inp} autoComplete="off"
                />
                <select
                  id="register-specialite" name="specialite"
                  value={specialite} onChange={e => setSpecialite(e.target.value)}
                  className={inp + " appearance-none"}
                >
                  <option value="">Spécialité / Fonction…</option>
                  {SPECIALITES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                  id="register-cta" name="cta"
                  value={cta} onChange={e => setCta(e.target.value)}
                  className={inp + " appearance-none"}
                >
                  <option value="">CTA de rattachement…</option>
                  {CTA_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

            {/* 3. Champs communs */}
            {role && (
              <div className="flex flex-col gap-3">
                <input id="register-email" name="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Email" className={inp} autoComplete="email" />
                <input id="register-phone" name="tel" type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="Téléphone (optionnel, ex: +221 77 000 00 00)"
                  className={inp} autoComplete="tel" />
                <div className="relative">
                  <input
                    id="register-password" name="password"
                    type={showPwd ? "text" : "password"} value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleRegister()}
                    placeholder="Mot de passe (min. 6 caractères)"
                    className={inp + " pr-12"} autoComplete="new-password"
                  />
                  <button onClick={() => setShowPwd(!showPwd)} type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Erreur */}
        {error && (
          <p className="text-xs text-rose-600 font-medium bg-rose-50 px-3 py-2 rounded-lg border border-rose-100">
            {error}
          </p>
        )}

        {/* Bouton principal */}
        <button
          onClick={tab === "login" ? handleLogin : handleRegister}
          disabled={loading || (tab === "register" && !canSubmit)}
          className={`w-full py-4 text-white font-bold rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg transition-all ${
            tab === "register" && role === "soignant"
              ? "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-blue-500/20"
              : "bg-gradient-to-r from-[#FF6B6B] to-[#FF9F43] shadow-[#FF6B6B]/20"
          }`}
        >
          {loading ? "Chargement…" : tab === "login" ? "Se connecter" : "Créer mon compte"}
          {!loading && <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Badge sécurité */}
        <div className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
          <Shield className="w-4 h-4 text-[#10AC84] shrink-0" />
          <span className="text-[11px] font-bold text-emerald-800">100% anonyme · Chiffrement E2E · RGPD · Loi n°2008-12</span>
        </div>

        {/* Langue */}
        <div className="flex justify-center gap-2">
          {LANGS.map(l => (
            <button key={l.code} onClick={() => switchLang(l.code)}
              className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${lang === l.code ? "border-[#FF6B6B] bg-rose-50 text-[#FF6B6B]" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
              {l.flag} {l.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
