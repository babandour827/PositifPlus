import { useState } from "react";
import { useNavigate } from "react-router";
import { useAppLock } from "../hooks/useAppLock";

const DIGITS = [
  ["1","2","3"],
  ["4","5","6"],
  ["7","8","9"],
  ["",  "0","⌫"],
];

export function PinLockOverlay() {
  const { locked, covered, tryUnlock } = useAppLock();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();

  // Couverture opaque (app-switcher privacy) — pas de PIN affiché
  if (covered && !locked) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
        style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e293b 100%)" }}>
        <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 flex items-center justify-center mb-4">
          <svg viewBox="0 0 48 48" fill="none" className="w-9 h-9">
            <path d="M24 8V40" stroke="#FF6B6B" strokeWidth="5" strokeLinecap="round"/>
            <path d="M8 24H40" stroke="#FF9F43" strokeWidth="5" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="text-white/40 text-xs font-bold tracking-widest uppercase">Positif+</p>
      </div>
    );
  }

  if (!locked) return null;

  function pressDigit(d: string) {
    if (d === "⌫") {
      setPin(p => p.slice(0, -1));
      setError(false);
      return;
    }
    if (!d) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      if (!tryUnlock(next)) {
        setShake(true);
        setError(true);
        setTimeout(() => { setShake(false); setPin(""); }, 600);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[9998] flex flex-col items-center justify-center font-sans select-none"
      style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e293b 100%)" }}>

      {/* Logo */}
      <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 flex items-center justify-center mb-8">
        <svg viewBox="0 0 48 48" fill="none" className="w-9 h-9">
          <path d="M24 8V40" stroke="#FF6B6B" strokeWidth="5" strokeLinecap="round"/>
          <path d="M8 24H40" stroke="#FF9F43" strokeWidth="5" strokeLinecap="round"/>
        </svg>
      </div>

      <h2 className="text-white font-extrabold text-xl mb-1">Positif+</h2>
      <p className="text-white/50 text-sm font-medium mb-10">Entrez votre code PIN</p>

      {/* Indicateur points */}
      <div className={`flex gap-4 mb-10 ${shake ? "animate-[shake_.5s_ease]" : ""}`}>
        <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
        {[0,1,2,3].map(i => (
          <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
            i < pin.length
              ? error ? "bg-red-400 border-red-400" : "bg-white border-white"
              : "bg-transparent border-white/30"
          }`} />
        ))}
      </div>

      {error && (
        <p className="text-red-400 text-sm font-bold mb-6 -mt-6">Code incorrect</p>
      )}

      {/* Pavé numérique */}
      <div className="flex flex-col gap-3">
        {DIGITS.map((row, ri) => (
          <div key={ri} className="flex gap-3">
            {row.map((d, ci) => (
              <button key={ci} onClick={() => pressDigit(d)}
                disabled={pin.length >= 4 && d !== "⌫"}
                className={`w-20 h-20 rounded-2xl text-2xl font-bold transition-all active:scale-95 ${
                  d === ""
                    ? "pointer-events-none"
                    : d === "⌫"
                    ? "bg-white/10 text-white/60 hover:bg-white/20"
                    : "bg-white/10 text-white hover:bg-white/20 active:bg-white/30"
                }`}>
                {d}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Lien mot de passe oublié */}
      <button onClick={() => { navigate("/auth"); }}
        className="mt-10 text-white/30 text-xs font-bold hover:text-white/60 transition-colors">
        Code oublié · Reconnexion
      </button>
    </div>
  );
}
