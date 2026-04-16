import { useState, useRef } from "react";

const CITIES = [
  { name: "Dakar",       temp: 32, hum: 68, wind: 14, icon: "☀️" },
  { name: "Thiès",       temp: 34, hum: 55, wind: 18, icon: "🌤️" },
  { name: "Saint-Louis", temp: 38, hum: 44, wind: 22, icon: "☀️" },
  { name: "Ziguinchor",  temp: 29, hum: 82, wind: 9,  icon: "🌦️" },
  { name: "Kaolack",     temp: 36, hum: 50, wind: 16, icon: "⛅" },
];

const FORECAST = [
  { day: "Lun", icon: "☀️",  hi: 33, lo: 24 },
  { day: "Mar", icon: "🌤️", hi: 31, lo: 23 },
  { day: "Mer", icon: "⛅",  hi: 29, lo: 22 },
  { day: "Jeu", icon: "🌦️", hi: 28, lo: 21 },
  { day: "Ven", icon: "☀️",  hi: 34, lo: 25 },
];

const SECRET_TAPS = 5;
const TAP_WINDOW_MS = 3000;

export function StealthScreen({ onUnlock }: { onUnlock: () => void }) {
  const [city, setCity] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSecretTap() {
    const next = tapCount + 1;
    setTapCount(next);
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (next >= SECRET_TAPS) {
      setTapCount(0);
      onUnlock();
      return;
    }
    tapTimer.current = setTimeout(() => setTapCount(0), TAP_WINDOW_MS);
  }

  const c = CITIES[city];

  return (
    <div className="mx-auto w-full max-w-md h-[100dvh] flex flex-col font-sans overflow-hidden"
      style={{ background: "linear-gradient(180deg, #1a6db5 0%, #5ba3dc 40%, #d4eaf7 100%)" }}>

      {/* Status bar fake */}
      <div className="flex justify-between items-center px-5 pt-4 pb-1">
        <span className="text-white/80 text-xs font-bold">9:41</span>
        <span className="text-white/80 text-xs font-bold">📶 🔋</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-2">
        <h1 className="text-white font-extrabold text-xl tracking-tight">Météo Sénégal</h1>
        {/* ← Secret tap target: the cloud icon in the corner */}
        <button
          onClick={handleSecretTap}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 active:bg-white/20 transition-colors"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <span className="text-xl select-none">
            {tapCount > 0 ? ["🌤️","⛅","🌥️","☁️","🔓"][tapCount - 1] : "☁️"}
          </span>
        </button>
      </div>

      {/* City selector */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
        {CITIES.map((ct, i) => (
          <button key={ct.name} onClick={() => setCity(i)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${city === i ? "bg-white text-blue-700 shadow-md" : "bg-white/20 text-white"}`}>
            {ct.name}
          </button>
        ))}
      </div>

      {/* Main weather card */}
      <div className="mx-4 bg-white/20 backdrop-blur-md rounded-3xl p-6 flex flex-col items-center border border-white/30 shadow-xl">
        <p className="text-white/80 text-sm font-semibold mb-1">{c.name}, Sénégal</p>
        <div className="text-7xl my-2 select-none">{c.icon}</div>
        <div className="text-white font-black text-7xl leading-none">{c.temp}°</div>
        <p className="text-white/70 font-bold mt-2 text-base">Ensoleillé</p>

        <div className="flex gap-6 mt-5 w-full justify-around">
          <div className="flex flex-col items-center">
            <span className="text-white/60 text-xs font-bold">Humidité</span>
            <span className="text-white font-extrabold text-lg">{c.hum}%</span>
          </div>
          <div className="w-px bg-white/20" />
          <div className="flex flex-col items-center">
            <span className="text-white/60 text-xs font-bold">Vent</span>
            <span className="text-white font-extrabold text-lg">{c.wind} km/h</span>
          </div>
          <div className="w-px bg-white/20" />
          <div className="flex flex-col items-center">
            <span className="text-white/60 text-xs font-bold">UV</span>
            <span className="text-white font-extrabold text-lg">Élevé</span>
          </div>
        </div>
      </div>

      {/* 5-day forecast */}
      <div className="mx-4 mt-4 bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
        <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">Prévisions 5 jours</p>
        <div className="flex justify-between">
          {FORECAST.map(f => (
            <div key={f.day} className="flex flex-col items-center gap-1">
              <span className="text-white/60 text-[11px] font-bold">{f.day}</span>
              <span className="text-lg">{f.icon}</span>
              <span className="text-white font-bold text-xs">{f.hi}°</span>
              <span className="text-white/50 text-[10px]">{f.lo}°</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom hint: invisible */}
      <div className="flex-1 flex items-end justify-center pb-8">
        <p className="text-white/20 text-[10px] font-medium tracking-widest">
          Données météo · ANACIM Sénégal
        </p>
      </div>
    </div>
  );
}
