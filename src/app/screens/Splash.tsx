import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabaseClient";
import { StealthScreen } from "./StealthScreen";

// ╔══════════════════════════════════════════════════════════╗
// ║  MODE TEST — AUTH DÉSACTIVÉE                            ║
// ║  Mettre à false pour réactiver la vraie authentification ║
// ╚══════════════════════════════════════════════════════════╝
const TEST_MODE = true;

export function Splash() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");
  const stealthEnabled = localStorage.getItem("pp_stealth_enabled") === "true";
  const stealthUnlocked = sessionStorage.getItem("pp_stealth_unlocked") === "true";
  const [showStealth, setShowStealth] = useState(stealthEnabled && !stealthUnlocked);

  async function redirect() {
    if (TEST_MODE) {
      // MODE TEST : va directement dans l'app sans vérifier la session
      navigate("/app", { replace: true });
      return;
    }
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const onboarded = localStorage.getItem("pp_onboarded");
      navigate(onboarded ? "/app" : "/onboarding", { replace: true });
    } else {
      navigate("/auth", { replace: true });
    }
  }

  useEffect(() => {
    if (showStealth) return; // le splash attend que le mode discret soit déverrouillé
    const t1 = setTimeout(() => setPhase("hold"), 600);
    const t2 = setTimeout(() => setPhase("out"), 2000);
    const t3 = setTimeout(redirect, 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [showStealth]);

  if (showStealth) {
    return (
      <StealthScreen onUnlock={() => {
        sessionStorage.setItem("pp_stealth_unlocked", "true");
        setShowStealth(false);
      }} />
    );
  }

  return (
    <div
      className="mx-auto w-full max-w-md h-[100dvh] relative overflow-hidden font-sans cursor-pointer sm:shadow-2xl sm:rounded-[2.5rem]"
      onClick={redirect}
    >
      <style>{`
        /* ── Fond principal ── */
        @keyframes bgPan {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .splash-bg {
          background: linear-gradient(135deg, #FF6B6B 0%, #FF9F43 30%, #1DD1A1 60%, #FF6B6B 100%);
          background-size: 300% 300%;
          animation: bgPan 6s ease infinite;
        }

        /* ── Orbes décoratifs ── */
        @keyframes floatA {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(20px,-30px) scale(1.1); }
          66%      { transform: translate(-15px,20px) scale(0.95); }
        }
        @keyframes floatB {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(-25px,15px) scale(1.05); }
          66%      { transform: translate(20px,-20px) scale(0.9); }
        }
        .orb-a { animation: floatA 8s ease-in-out infinite; }
        .orb-b { animation: floatB 10s ease-in-out infinite; }

        /* ── Logo ── */
        @keyframes logoPop {
          0%   { opacity:0; transform: scale(0.4) translateY(30px); }
          60%  { opacity:1; transform: scale(1.08) translateY(-6px); }
          80%  { transform: scale(0.96) translateY(2px); }
          100% { transform: scale(1) translateY(0); }
        }
        .logo-pop { animation: logoPop 0.7s cubic-bezier(.34,1.56,.64,1) forwards; }

        /* ── Texte ── */
        @keyframes fadeUp {
          from { opacity:0; transform: translateY(18px); }
          to   { opacity:1; transform: translateY(0); }
        }
        .fade-up-1 { animation: fadeUp 0.5s ease forwards 0.55s; opacity:0; }
        .fade-up-2 { animation: fadeUp 0.5s ease forwards 0.75s; opacity:0; }
        .fade-up-3 { animation: fadeUp 0.5s ease forwards 1.0s;  opacity:0; }

        /* ── Barre de chargement ── */
        @keyframes barFill {
          from { width: 0%; }
          to   { width: 100%; }
        }
        .loading-bar { animation: barFill 1.8s cubic-bezier(.4,0,.2,1) forwards 0.3s; width:0; }

        /* ── Sortie ── */
        @keyframes fadeOut {
          from { opacity:1; transform: scale(1); }
          to   { opacity:0; transform: scale(1.04); }
        }
        .phase-out { animation: fadeOut 0.5s ease forwards; }

        /* ── Particules ── */
        @keyframes particle {
          0%   { opacity:0; transform: translateY(0) scale(0); }
          20%  { opacity:1; }
          100% { opacity:0; transform: translateY(-120px) scale(1.5); }
        }
        .p1 { animation: particle 3s ease-in-out infinite 0.2s; }
        .p2 { animation: particle 3s ease-in-out infinite 0.8s; }
        .p3 { animation: particle 3s ease-in-out infinite 1.5s; }
        .p4 { animation: particle 3s ease-in-out infinite 2.1s; }
        .p5 { animation: particle 3s ease-in-out infinite 0.5s; }

        /* ── Anneau pulsant ── */
        @keyframes ringPulse {
          0%,100% { transform: scale(1);   opacity: 0.4; }
          50%      { transform: scale(1.5); opacity: 0; }
        }
        .ring1 { animation: ringPulse 2s ease-out infinite 0s; }
        .ring2 { animation: ringPulse 2s ease-out infinite 0.6s; }
        .ring3 { animation: ringPulse 2s ease-out infinite 1.2s; }
      `}</style>

      {/* ── Fond animé ── */}
      <div className={`splash-bg absolute inset-0 ${phase === "out" ? "phase-out" : ""}`} />

      {/* ── Orbes de lumière ── */}
      <div className="orb-a absolute top-[-80px] left-[-60px] w-72 h-72 rounded-full bg-white/10 blur-3xl" />
      <div className="orb-b absolute bottom-[-100px] right-[-80px] w-80 h-80 rounded-full bg-black/10 blur-3xl" />
      <div className="absolute top-1/3 right-[-40px] w-48 h-48 rounded-full bg-white/5 blur-2xl" />

      {/* ── Particules flottantes ── */}
      <div className="absolute inset-0 pointer-events-none">
        <span className="p1 absolute bottom-1/3 left-1/4 w-2 h-2 rounded-full bg-white/60" />
        <span className="p2 absolute bottom-1/4 left-1/2 w-1.5 h-1.5 rounded-full bg-white/50" />
        <span className="p3 absolute bottom-2/5 left-3/4 w-2.5 h-2.5 rounded-full bg-white/40" />
        <span className="p4 absolute bottom-1/3 left-1/3 w-1 h-1 rounded-full bg-white/70" />
        <span className="p5 absolute bottom-1/4 left-2/3 w-2 h-2 rounded-full bg-white/55" />
      </div>

      {/* ── Contenu central ── */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center gap-0 ${phase === "out" ? "phase-out" : ""}`}>

        {/* Logo avec anneaux pulsants */}
        <div className="relative flex items-center justify-center mb-8">
          {/* Anneaux */}
          <div className="ring1 absolute w-32 h-32 rounded-full border-2 border-white/30" />
          <div className="ring2 absolute w-32 h-32 rounded-full border-2 border-white/20" />
          <div className="ring3 absolute w-32 h-32 rounded-full border-2 border-white/10" />

          {/* Icône centrale */}
          <div className="logo-pop relative z-10 w-24 h-24 rounded-[2rem] bg-white shadow-2xl shadow-black/30 flex items-center justify-center">
            <svg viewBox="0 0 48 48" fill="none" className="w-14 h-14">
              <path d="M24 8V40" stroke="#FF6B6B" strokeWidth="5" strokeLinecap="round"/>
              <path d="M8 24H40" stroke="#FF9F43" strokeWidth="5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* Nom de l'app */}
        <h1 className="fade-up-1 text-5xl font-black text-white tracking-tight leading-none" style={{ textShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
          Positif<span className="text-white/70">+</span>
        </h1>

        {/* Tagline */}
        <p className="fade-up-2 text-white/80 text-base font-semibold mt-3 tracking-wide">
          Ensemble, on est plus forts
        </p>

        {/* Badges */}
        <div className="fade-up-3 flex items-center gap-2 mt-6">
          {["🔒 Anonyme", "🏥 Sénégal", "💚 PVVIH"].map((b) => (
            <span key={b} className="text-[11px] font-bold text-white/90 bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-1 rounded-full">
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* ── Barre de chargement en bas ── */}
      <div className={`absolute bottom-0 left-0 right-0 ${phase === "out" ? "phase-out" : ""}`}>
        <div className="h-1 bg-white/20">
          <div className="loading-bar h-full bg-white/70 rounded-full" />
        </div>
        <div className="pb-safe bg-gradient-to-t from-black/20 to-transparent flex items-end justify-center pb-8 pt-4">
          <p className="fade-up-3 text-[10px] text-white/50 font-medium tracking-widest uppercase">
            Votre espace santé sécurisé
          </p>
        </div>
      </div>
    </div>
  );
}
