import { useState } from "react";
import {
  Home, Compass, Smile, Zap, User, Flame, Heart,
  Share2, X, Moon, Sun, Check, ChevronRight, Star,
  Award, Calendar, BookOpen,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type Tab    = "home" | "explore" | "mood" | "challenges" | "profile";
type MoodK  = "radieux" | "bien" | "neutre" | "triste" | "difficile";
type Theme  = "light" | "dark";

// ── Data ─────────────────────────────────────────────────────────────────────
const MOODS: { key: MoodK; emoji: string; label: string; color: string; bg: string; darkBg: string }[] = [
  { key: "radieux",   emoji: "🌟", label: "Radieux",   color: "#EF9F27", bg: "#FEF3C7", darkBg: "#3D2A00" },
  { key: "bien",      emoji: "😊", label: "Bien",      color: "#1D9E75", bg: "#D1FAE5", darkBg: "#013D2A" },
  { key: "neutre",    emoji: "😐", label: "Neutre",    color: "#8B9E98", bg: "#F0F4F2", darkBg: "#1A2A26" },
  { key: "triste",    emoji: "😔", label: "Triste",    color: "#5B8FCC", bg: "#DBEAFE", darkBg: "#0D1F3C" },
  { key: "difficile", emoji: "😤", label: "Difficile", color: "#D85A30", bg: "#FEE2E2", darkBg: "#3D1000" },
];
const moodOf = (k: MoodK) => MOODS.find(m => m.key === k)!;

const AFFS = [
  { text: "Je mérite la paix intérieure et la joie qui m'appartiennent.", cat: "Sérénité",   g1: "#1D9E75", g2: "#04342C" },
  { text: "Chaque jour porte en lui une graine nouvelle de croissance.", cat: "Croissance",  g1: "#EF9F27", g2: "#C2440E" },
  { text: "Je suis capable de traverser toutes les tempêtes de la vie.",  cat: "Résilience", g1: "#04342C", g2: "#1D9E75" },
  { text: "Je choisis délibérément la gratitude plutôt que la peur.",    cat: "Gratitude",  g1: "#5B8FCC", g2: "#04342C" },
];

const CHALLENGES = [
  {
    icon: "🌬️", title: "Respiration 4-7-8", duration: "5 min", cat: "Pleine conscience", color: "#1D9E75",
    steps: ["Installez-vous confortablement, dos droit", "Inspirez par le nez 4 secondes", "Retenez votre souffle 7 secondes", "Expirez lentement par la bouche 8 secondes", "Répétez 4 cycles avec intention"],
  },
  {
    icon: "💌", title: "Lettre de gratitude", duration: "10 min", cat: "Journaling", color: "#EF9F27",
    steps: ["Prenez un carnet ou ouvrez une note", "Écrivez 3 choses pour lesquelles vous êtes reconnaissant(e)", "Expliquez pourquoi chacune compte pour vous", "Relisez à voix haute et ressentez"],
  },
  {
    icon: "🧘", title: "Scan corporel", duration: "8 min", cat: "Méditation", color: "#5B8FCC",
    steps: ["Allongez-vous ou asseyez-vous", "Fermez les yeux et respirez profondément", "Portez attention à chaque partie de votre corps", "Relâchez les tensions que vous trouvez"],
  },
];

const WEEKLY: { day: string; mood: MoodK; today?: boolean }[] = [
  { day: "L", mood: "bien" },
  { day: "M", mood: "radieux" },
  { day: "M", mood: "neutre" },
  { day: "J", mood: "bien" },
  { day: "V", mood: "difficile" },
  { day: "S", mood: "triste" },
  { day: "D", mood: "radieux", today: true },
];

const BADGES = [
  { icon: "🌱", label: "Premier pas",  earned: true },
  { icon: "🔥", label: "7 jours",      earned: true },
  { icon: "💎", label: "30 jours",     earned: false },
  { icon: "🌟", label: "Défi master",  earned: true },
  { icon: "🧘", label: "Zen mode",     earned: false },
  { icon: "💌", label: "Gratitude",    earned: true },
];

// ── Decorative SVG leaf ──────────────────────────────────────────────────────
function Leaf({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 80 100" className={className} style={style} fill="currentColor">
      <path d="M40 5 C10 20 5 55 20 80 C30 95 50 98 60 85 C75 65 75 30 40 5Z" opacity="0.6" />
      <path d="M40 5 Q40 50 30 85" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4" />
    </svg>
  );
}

function Blob({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 200" className={className} style={style}>
      <path fill="currentColor" d="M42,-65C53,-57,60,-44,66,-30C72,-17,78,-3,76,10C74,23,65,36,55,49C44,61,31,73,16,77C1,82,-17,80,-33,73C-49,65,-63,53,-69,38C-76,22,-75,3,-69,-13C-63,-30,-52,-44,-39,-52C-26,-60,-13,-63,1,-64C15,-66,31,-73,42,-65Z" transform="translate(100 100)" />
    </svg>
  );
}

// ── Progress ring SVG ────────────────────────────────────────────────────────
function Ring({ pct, color, size = 72, stroke = 7 }: { pct: number; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" }} />
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function PosPlus() {
  const [tab, setTab]                 = useState<Tab>("home");
  const [theme, setTheme]             = useState<Theme>("light");
  const [mood, setMood]               = useState<MoodK | null>(null);
  const [affIdx, setAffIdx]           = useState(0);
  const [liked, setLiked]             = useState(AFFS.map(() => false));
  const [activeChallenge, setActive]  = useState<number | null>(null);
  const [step, setStep]               = useState(0);
  const [done, setDone]               = useState(false);
  const [journalText, setJournal]     = useState("");
  const [moodSaved, setMoodSaved]     = useState(false);
  const [completedChallenges, setCC]  = useState<number[]>([]);

  const dk = theme === "dark";

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const C = {
    bg:       dk ? "#04342C" : "#F1EFE8",
    surface:  dk ? "#0A4A38" : "#FFFFFF",
    surface2: dk ? "#0E5540" : "#F8F6F0",
    text:     dk ? "#E8F5EF" : "#1A2E26",
    muted:    dk ? "#7BB89E" : "#5A7A6E",
    border:   dk ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
    primary:  "#1D9E75",
    accent:   "#EF9F27",
    deep:     "#04342C",
    error:    "#D85A30",
  };

  // ── Nav items ─────────────────────────────────────────────────────────────
  const TABS: { key: Tab; icon: any; label: string }[] = [
    { key: "home",       icon: Home,     label: "Accueil" },
    { key: "explore",    icon: Compass,  label: "Explorer" },
    { key: "mood",       icon: Smile,    label: "Humeur" },
    { key: "challenges", icon: Zap,      label: "Défis" },
    { key: "profile",    icon: User,     label: "Profil" },
  ];

  // ── Screen renderers ──────────────────────────────────────────────────────

  /* HOME */
  function renderHome() {
    const dayMood = mood ? moodOf(mood) : null;
    return (
      <div className="flex flex-col min-h-full pb-24">
        {/* Dark header */}
        <div className="relative overflow-hidden pt-8 pb-16 px-5" style={{ background: `linear-gradient(145deg, ${C.deep} 0%, #0E5540 100%)` }}>
          <Leaf className="absolute top-4 right-4 w-16 h-20 text-white/10" />
          <Blob className="absolute -bottom-8 -left-8 w-40 h-40 text-white/5" />
          <div className="relative z-10 flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Positif Plus</p>
              <h1 className="text-2xl font-black text-white mt-1 leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Bonjour, Alex 👋
              </h1>
              <p className="text-sm text-white/55 mt-0.5 font-medium">
                {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            <button onClick={() => setTheme(t => t === "light" ? "dark" : "light")}
              className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
              {dk ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-white" />}
            </button>
          </div>
          {/* Quick mood strip */}
          <div className="relative z-10 flex gap-2">
            {MOODS.map(m => (
              <button key={m.key} onClick={() => { setMood(m.key); setMoodSaved(false); }}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl border transition-all ${mood === m.key ? "bg-white/20 border-white/30 scale-105" : "border-white/10 hover:bg-white/10"}`}>
                <span className="text-lg">{m.emoji}</span>
                <span className="text-[8px] font-bold text-white/60">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Curved lift */}
        <div className="flex flex-col gap-4 px-5 pb-4" style={{ marginTop: -20, borderRadius: "20px 20px 0 0", background: C.bg, paddingTop: 24 }}>

          {/* Current mood feedback */}
          {dayMood && (
            <div className="rounded-2xl px-4 py-3 flex items-center gap-3 border"
              style={{ background: dk ? dayMood.darkBg : dayMood.bg, borderColor: `${dayMood.color}30` }}>
              <span className="text-2xl">{dayMood.emoji}</span>
              <div>
                <p className="text-xs font-bold" style={{ color: dayMood.color }}>Humeur enregistrée</p>
                <p className="text-xs font-medium" style={{ color: C.muted }}>
                  {dayMood.key === "radieux" ? "Excellente journée en vue !"
                   : dayMood.key === "bien" ? "Vous rayonnez aujourd'hui."
                   : dayMood.key === "neutre" ? "C'est OK d'être dans l'entre-deux."
                   : dayMood.key === "triste" ? "Prenez soin de vous — un café ?"
                   : "Respirez. Ça passera."}
                </p>
              </div>
            </div>
          )}

          {/* Streak + stats row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl p-4 flex items-center gap-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#FEF3C7" }}>
                <Flame className="w-6 h-6 text-[#EF9F27] pp-flame" />
              </div>
              <div>
                <p className="text-2xl font-black leading-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.text }}>14</p>
                <p className="text-[10px] font-bold" style={{ color: C.muted }}>jours de suite</p>
              </div>
            </div>
            <div className="rounded-3xl p-4 flex items-center gap-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#D1FAE5" }}>
                <Award className="w-6 h-6 text-[#1D9E75]" />
              </div>
              <div>
                <p className="text-2xl font-black leading-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.text }}>23</p>
                <p className="text-[10px] font-bold" style={{ color: C.muted }}>défis complétés</p>
              </div>
            </div>
          </div>

          {/* Quote card */}
          <div className="rounded-3xl p-5 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${C.deep}, #1D9E75)` }}>
            <Leaf className="absolute -top-4 -right-4 w-20 h-24 text-white/15 rotate-12" />
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Citation du jour</p>
            <p className="text-sm font-bold text-white leading-relaxed italic pr-8">
              "La force ne vient pas de ce que tu peux faire. Elle vient de surmonter ce que tu pensais ne pas pouvoir faire."
            </p>
            <p className="text-[10px] font-bold text-white/50 mt-2">— Rikki Rogers</p>
          </div>

          {/* Today's challenge */}
          <button onClick={() => { setActive(0); setStep(0); setDone(false); }}
            className="rounded-3xl p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-all"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: `${C.primary}18` }}>
              🌬️
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: C.primary }}>Défi du jour</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: C.text }}>Respiration 4-7-8</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: C.muted }}>Pleine conscience · 5 min</p>
            </div>
            <ChevronRight className="w-5 h-5 shrink-0" style={{ color: C.muted }} />
          </button>

          {/* Affirmation preview */}
          <button onClick={() => setTab("explore")}
            className="rounded-3xl p-5 text-left active:scale-[0.98] transition-all"
            style={{ background: `linear-gradient(135deg, ${AFFS[affIdx].g1}, ${AFFS[affIdx].g2})` }}>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Affirmation</p>
            <p className="text-sm font-bold text-white leading-relaxed">{AFFS[affIdx].text}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[10px] font-black text-white/50 bg-white/10 px-2 py-0.5 rounded-full">{AFFS[affIdx].cat}</span>
              <span className="text-[10px] font-bold text-white/40 ml-auto">Swiper →</span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  /* EXPLORE — Affirmation cards */
  function renderExplore() {
    const aff = AFFS[affIdx];
    return (
      <div className="flex flex-col h-full" style={{ background: C.bg }}>
        <div className="px-5 pt-6 pb-3 flex items-center justify-between">
          <h2 className="text-lg font-black" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.text }}>Affirmations</h2>
          <button onClick={() => setTheme(t => t === "light" ? "dark" : "light")}
            className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: C.surface }}>
            {dk ? <Sun className="w-4 h-4" style={{ color: C.muted }} /> : <Moon className="w-4 h-4" style={{ color: C.muted }} />}
          </button>
        </div>

        {/* Full-bleed card */}
        <div className="mx-5 flex-1 relative overflow-hidden rounded-[2rem]"
          style={{ background: `linear-gradient(145deg, ${aff.g1}, ${aff.g2})`, minHeight: 340 }}>
          <Blob className="absolute -top-8 -right-8 w-48 h-48 text-white/10" />
          <Leaf className="absolute bottom-4 -left-4 w-24 h-28 text-white/10 -rotate-12" />
          <div className="absolute inset-0 flex flex-col justify-between p-6 z-10">
            <div>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{aff.cat}</span>
              <p className="text-xl font-black text-white leading-snug mt-3"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                "{aff.text}"
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {AFFS.map((_, i) => (
                  <button key={i} onClick={() => setAffIdx(i)}
                    className="transition-all rounded-full"
                    style={{ width: i === affIdx ? 20 : 7, height: 7, background: i === affIdx ? "white" : "rgba(255,255,255,0.3)" }} />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { const n = [...liked]; n[affIdx] = !n[affIdx]; setLiked(n); }}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center border border-white/20 transition-all"
                  style={{ background: liked[affIdx] ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)" }}>
                  <Heart className={`w-5 h-5 ${liked[affIdx] ? "fill-white text-white" : "text-white"}`} />
                </button>
                <button className="w-10 h-10 rounded-2xl flex items-center justify-center border border-white/20"
                  style={{ background: "rgba(255,255,255,0.1)" }}>
                  <Share2 className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 px-5 pt-4 pb-28">
          <button onClick={() => setAffIdx(i => (i - 1 + AFFS.length) % AFFS.length)}
            className="flex-1 py-3 rounded-2xl text-sm font-bold border" style={{ color: C.muted, borderColor: C.border, background: C.surface }}>
            ← Précédente
          </button>
          <button onClick={() => setAffIdx(i => (i + 1) % AFFS.length)}
            className="flex-1 py-3 rounded-2xl text-sm font-bold text-white"
            style={{ background: C.primary }}>
            Suivante →
          </button>
        </div>
      </div>
    );
  }

  /* MOOD TRACKER */
  function renderMood() {
    return (
      <div className="flex flex-col min-h-full pb-28 px-5 pt-6" style={{ background: C.bg }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.text }}>Comment vous sentez-vous ?</h2>
        </div>

        {/* Big mood orbs */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          {MOODS.map(m => (
            <button key={m.key} onClick={() => { setMood(m.key); setMoodSaved(false); }}
              className="flex flex-col items-center gap-2 py-3 rounded-2xl transition-all active:scale-95"
              style={{
                background: mood === m.key ? (dk ? m.darkBg : m.bg) : C.surface,
                border: `2px solid ${mood === m.key ? m.color : C.border}`,
                transform: mood === m.key ? "scale(1.05)" : "scale(1)",
                boxShadow: mood === m.key ? `0 8px 20px ${m.color}30` : "none",
              }}>
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-[9px] font-bold" style={{ color: mood === m.key ? m.color : C.muted }}>{m.label}</span>
            </button>
          ))}
        </div>

        {/* Journal */}
        <div className="rounded-3xl p-4 mb-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <p className="text-xs font-bold mb-2" style={{ color: C.muted }}>Note du jour (optionnel)</p>
          <textarea
            value={journalText}
            onChange={e => setJournal(e.target.value)}
            placeholder="Qu'est-ce qui influence votre humeur aujourd'hui ?"
            rows={3}
            className="w-full resize-none text-sm font-medium focus:outline-none bg-transparent leading-relaxed"
            style={{ color: C.text, caretColor: C.primary }}
          />
        </div>

        {/* Save button */}
        {mood && !moodSaved && (
          <button onClick={() => setMoodSaved(true)}
            className="w-full py-4 rounded-2xl text-sm font-bold text-white mb-4 transition-all active:scale-98"
            style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.deep})` }}>
            Enregistrer mon humeur
          </button>
        )}
        {moodSaved && (
          <div className="flex items-center gap-2 justify-center py-3 rounded-2xl mb-4"
            style={{ background: "#D1FAE5" }}>
            <Check className="w-4 h-4 text-[#1D9E75]" />
            <span className="text-sm font-bold text-[#1D9E75]">Humeur enregistrée !</span>
          </div>
        )}

        {/* Weekly recap */}
        <div className="rounded-3xl p-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <p className="text-xs font-bold mb-3" style={{ color: C.muted }}>7 derniers jours</p>
          <div className="flex gap-1.5">
            {WEEKLY.map((w, i) => {
              const m = moodOf(w.mood);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full aspect-square rounded-xl flex items-center justify-center text-sm"
                    style={{
                      background: dk ? m.darkBg : m.bg,
                      border: w.today ? `2px solid ${m.color}` : "none",
                      boxShadow: w.today ? `0 4px 12px ${m.color}30` : "none",
                    }}>
                    {w.emoji || m.emoji}
                  </div>
                  <span className="text-[9px] font-bold" style={{ color: w.today ? C.primary : C.muted }}>{w.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* CHALLENGES */
  function renderChallenges() {
    return (
      <div className="flex flex-col min-h-full pb-28 px-5 pt-6" style={{ background: C.bg }}>
        <h2 className="text-lg font-black mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.text }}>Défis du jour</h2>
        <div className="flex flex-col gap-3">
          {CHALLENGES.map((ch, i) => (
            <button key={i} onClick={() => { setActive(i); setStep(0); setDone(false); }}
              className="rounded-3xl p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-all"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="w-14 h-14 rounded-2xl text-2xl flex items-center justify-center shrink-0"
                style={{ background: `${ch.color}18` }}>
                {ch.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold" style={{ color: C.text }}>{ch.title}</p>
                  {completedChallenges.includes(i) && (
                    <span className="w-5 h-5 rounded-full bg-[#1D9E75] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-semibold mt-0.5" style={{ color: C.muted }}>{ch.cat} · {ch.duration}</p>
                {completedChallenges.includes(i) && (
                  <div className="h-1.5 w-full rounded-full mt-2" style={{ background: `${ch.color}25` }}>
                    <div className="h-full rounded-full" style={{ background: ch.color, width: "100%" }} />
                  </div>
                )}
              </div>
              <ChevronRight className="w-4 h-4 shrink-0" style={{ color: C.muted }} />
            </button>
          ))}
        </div>

        {/* Progress summary */}
        <div className="rounded-3xl p-4 mt-4 flex items-center gap-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <Ring pct={Math.round((completedChallenges.length / CHALLENGES.length) * 100)} color={C.primary} size={64} stroke={6} />
          <div>
            <p className="text-sm font-bold" style={{ color: C.text }}>{completedChallenges.length}/{CHALLENGES.length} défis complétés</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: C.muted }}>
              {completedChallenges.length === 0 ? "Commencez votre premier défi !"
               : completedChallenges.length === CHALLENGES.length ? "Journée parfaite 🎉"
               : "Continuez — vous y êtes presque !"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* PROFILE */
  function renderProfile() {
    return (
      <div className="flex flex-col min-h-full pb-28" style={{ background: C.bg }}>
        {/* Header */}
        <div className="px-5 pt-8 pb-8 relative overflow-hidden"
          style={{ background: `linear-gradient(145deg, ${C.deep}, #1D9E75)` }}>
          <Leaf className="absolute top-2 right-2 w-16 h-20 text-white/10" />
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
                style={{ background: "rgba(255,255,255,0.15)", border: "3px solid rgba(255,255,255,0.3)" }}>
                🌿
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#EF9F27] flex items-center justify-center border-2 border-white">
                <Star className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Alex Martin</p>
              <p className="text-xs text-white/50 font-medium">Membre depuis mars 2025</p>
            </div>
            {/* Big stats */}
            <div className="flex gap-4 mt-1">
              {[{ val: "14", label: "Jours série" }, { val: "89%", label: "Régularité" }, { val: "23", label: "Défis" }].map(s => (
                <div key={s.label} className="text-center px-3">
                  <p className="text-xl font-black text-white leading-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.val}</p>
                  <p className="text-[9px] font-bold text-white/40 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-5 pt-5">
          {/* Progress rings */}
          <div className="rounded-3xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: C.muted }}>Progression</p>
            <div className="flex justify-around">
              {[
                { pct: 78, color: C.primary, label: "Humeur", sub: "14/18 jours" },
                { pct: 65, color: C.accent,  label: "Défis",  sub: "23/35 défis" },
                { pct: 90, color: "#5B8FCC", label: "Mindful", sub: "9/10 sem." },
              ].map(r => (
                <div key={r.label} className="flex flex-col items-center gap-2">
                  <div className="relative flex items-center justify-center">
                    <Ring pct={r.pct} color={r.color} size={68} stroke={6} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-black" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.text }}>{r.pct}%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold" style={{ color: C.text }}>{r.label}</p>
                    <p className="text-[9px] font-medium" style={{ color: C.muted }}>{r.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="rounded-3xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: C.muted }}>Badges obtenus</p>
            <div className="grid grid-cols-3 gap-3">
              {BADGES.map((b, i) => (
                <div key={i} className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all ${b.earned ? "" : "opacity-35"}`}
                  style={{ background: b.earned ? (dk ? "rgba(29,158,117,0.15)" : "#E8F8F2") : C.surface2 }}>
                  <span className="text-xl">{b.icon}</span>
                  <p className="text-[10px] font-bold text-center leading-tight" style={{ color: b.earned ? C.primary : C.muted }}>{b.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Settings row */}
          {[
            { icon: Calendar,  label: "Historique",       sub: "Voir tous vos enregistrements" },
            { icon: BookOpen,  label: "Journal personnel", sub: "Vos notes et réflexions" },
            { icon: Star,      label: "Abonnement",       sub: "Positif Plus Premium" },
          ].map((item, i) => (
            <button key={i} className="rounded-2xl p-4 flex items-center gap-3 text-left active:scale-[0.99] transition-all"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${C.primary}15` }}>
                <item.icon className="w-5 h-5" style={{ color: C.primary }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: C.text }}>{item.label}</p>
                <p className="text-xs font-medium" style={{ color: C.muted }}>{item.sub}</p>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: C.muted }} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* CHALLENGE MODAL */
  function renderChallengeModal() {
    if (activeChallenge === null) return null;
    const ch = CHALLENGES[activeChallenge];
    return (
      <div className="absolute inset-0 z-50 flex flex-col"
        style={{ background: `linear-gradient(160deg, ${C.deep} 0%, ${ch.color} 100%)` }}>
        <Blob className="absolute top-0 right-0 w-48 h-48 text-white/10" />
        <div className="relative z-10 flex flex-col h-full p-5 pb-10">
          {/* Header */}
          <div className="flex items-center justify-between pt-2 mb-6">
            <button onClick={() => setActive(null)}
              className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="flex gap-1">
              {ch.steps.map((_, i) => (
                <div key={i} className="rounded-full transition-all"
                  style={{ width: i <= step ? 20 : 7, height: 7, background: i <= step ? "white" : "rgba(255,255,255,0.3)" }} />
              ))}
            </div>
            <div className="w-9" />
          </div>

          {/* Icon + title */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl mb-4"
              style={{ background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.2)" }}>
              {ch.icon}
            </div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{ch.cat}</p>
            <h2 className="text-xl font-black text-white mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{ch.title}</h2>
            <p className="text-sm text-white/50 font-medium mt-0.5">{ch.duration}</p>
          </div>

          {/* Step content */}
          {!done ? (
            <>
              <div className="flex-1 flex flex-col justify-center">
                <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-wider mb-3">Étape {step + 1} / {ch.steps.length}</p>
                  <p className="text-lg font-bold text-white leading-snug" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {ch.steps[step]}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (step < ch.steps.length - 1) { setStep(s => s + 1); }
                  else { setDone(true); setCC(prev => prev.includes(activeChallenge) ? prev : [...prev, activeChallenge]); }
                }}
                className="w-full py-4 rounded-2xl text-sm font-bold transition-all active:scale-98 mt-6"
                style={{ background: "white", color: ch.color }}>
                {step < ch.steps.length - 1 ? "Étape suivante →" : "Terminer le défi ✓"}
              </button>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl"
                style={{ background: "rgba(255,255,255,0.2)" }}>
                🎉
              </div>
              <h3 className="text-2xl font-black text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Bravo !</h3>
              <p className="text-sm text-white/70 font-medium leading-relaxed max-w-xs">
                Vous avez complété le défi <strong className="text-white">{ch.title}</strong>. Chaque petit pas compte !
              </p>
              <button onClick={() => setActive(null)}
                className="mt-4 px-8 py-4 rounded-2xl text-sm font-bold"
                style={{ background: "rgba(255,255,255,0.9)", color: ch.color }}>
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Layout ────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto w-full max-w-md h-[100dvh] flex flex-col relative overflow-hidden font-sans sm:shadow-2xl sm:rounded-[2.5rem]"
      style={{ background: C.bg }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&display=swap');

        @keyframes pp2-flame {
          0%,100% { transform: scale(1) rotate(-4deg); }
          50%      { transform: scale(1.18) rotate(4deg); }
        }
        .pp-flame { animation: pp2-flame 1.5s ease-in-out infinite; }

        @keyframes pp2-fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pp2-fu { animation: pp2-fadeUp 0.4s ease forwards; }

        @keyframes pp2-pop {
          0%  { transform: scale(0.8); opacity: 0; }
          70% { transform: scale(1.05); }
          100%{ transform: scale(1); opacity: 1; }
        }
        .pp2-pop { animation: pp2-pop 0.35s cubic-bezier(.34,1.56,.64,1) forwards; }

        .pp2-scroll::-webkit-scrollbar { display: none; }
        .pp2-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Main scrollable content */}
      <main className="flex-1 overflow-y-auto pp2-scroll relative">
        <div className="pp2-fu">
          {tab === "home"       && renderHome()}
          {tab === "explore"    && renderExplore()}
          {tab === "mood"       && renderMood()}
          {tab === "challenges" && renderChallenges()}
          {tab === "profile"    && renderProfile()}
        </div>
        {renderChallengeModal()}
      </main>

      {/* ── Bottom Navigation ── */}
      <nav className="shrink-0 px-3 pb-4 pt-2 border-t" style={{ background: C.surface, borderColor: C.border }}>
        <div className="flex items-center justify-around relative">
          {TABS.map(t => {
            const active = tab === t.key;
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all relative"
                style={{ background: active ? `${C.primary}18` : "transparent" }}>
                {t.key === "mood" ? (
                  /* Center FAB */
                  <div className="w-12 h-12 rounded-full flex items-center justify-center -mt-6 shadow-lg transition-all"
                    style={{ background: active ? `linear-gradient(135deg, ${C.primary}, ${C.deep})` : C.primary, boxShadow: `0 8px 20px ${C.primary}40` }}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                ) : (
                  <Icon className="w-5 h-5 transition-colors"
                    style={{ color: active ? C.primary : C.muted, strokeWidth: active ? 2.5 : 1.5 }} />
                )}
                <span className="text-[9px] font-bold transition-colors"
                  style={{ color: active ? C.primary : C.muted, marginTop: t.key === "mood" ? -2 : 0 }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
