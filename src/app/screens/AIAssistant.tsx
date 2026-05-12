import { Bot, Send, Phone, Stethoscope, BarChart3, ShieldCheck, AlertTriangle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { aiService } from "../../services/aiService";
import { useProfile } from "../../hooks/useProfile";

// ── Suggestions selon le rôle ────────────────────────────────────────────────
const PATIENT_SUGGESTIONS = [
  "Effets secondaires ARV", "Trouver un CTA", "Observance traitement",
  "Nutrition et VIH", "Soutien psychologique",
];

const SOIGNANT_SUGGESTIONS = [
  "Calculer un score PDV", "Logique d'intervention graduée",
  "Zones à risque Sénégal 2023", "Cryptage et anonymat",
  "Protocole de recherche active", "Profils mobilité transfrontalière",
];

export function AIAssistant() {
  const { isSoignant, profile, loading: profileLoading } = useProfile();

  const initialMsg = isSoignant
    ? `Bonjour Dr. ${profile?.pseudo ?? ""}. Je suis votre assistant expert e-Health / PDV pour Positif+. Je dispose des données CNLS 2023 et de la matrice de score de risque PDV. Comment puis-je vous aider ?`
    : "Bonjour ! Je suis l'assistant médical de Positif+, spécialisé VIH/Sénégal. Je peux répondre à vos questions sur les traitements ARV, les CTA, la nutrition et le soutien psychologique. Comment puis-je vous aider ?";

  const [messages, setMessages] = useState([
    { role: "assistant" as const, content: initialMsg },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Recharger le message d'accueil dès que le profil est connu
  useEffect(() => {
    if (!profileLoading) {
      setMessages([{
        role: "assistant" as const,
        content: isSoignant
          ? `Bonjour${profile?.pseudo ? ` ${profile.pseudo}` : ""}. Je suis votre assistant expert e-Health / PDV pour Positif+. Je dispose des données CNLS 2023 et de la matrice de score de risque PDV. Comment puis-je vous aider ?`
          : "Bonjour ! Je suis l'assistant médical de Positif+, spécialisé VIH/Sénégal. Je peux répondre à vos questions sur les traitements ARV, les CTA, la nutrition et le soutien psychologique. Comment puis-je vous aider ?",
      }]);
    }
  }, [profileLoading, isSoignant]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(text?: string) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(m => [...m, { role: "user" as const, content: msg }]);
    setLoading(true);
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const reply = await aiService.sendMessage(history, msg, isSoignant);
      setMessages(m => [...m, { role: "assistant" as const, content: reply }]);
    } catch {
      setMessages(m => [...m, {
        role: "assistant" as const,
        content: "Désolé, une erreur est survenue. Pour toute urgence : Ligne Gindima 200 365.",
      }]);
    }
    setLoading(false);
  }

  const suggestions = isSoignant ? SOIGNANT_SUGGESTIONS : PATIENT_SUGGESTIONS;

  // ── Couleurs selon le rôle ──
  const accent = isSoignant ? "bg-blue-500" : "bg-purple-600";
  const accentLight = isSoignant ? "bg-blue-50" : "bg-purple-100";
  const accentText = isSoignant ? "text-blue-600" : "text-purple-600";
  const accentRing = isSoignant ? "focus:ring-blue-500/50" : "focus:ring-purple-500/50";
  const userBubble = isSoignant ? "bg-blue-500" : "bg-[#10AC84]";

  return (
    <div className="flex flex-col h-full font-sans bg-gray-50">

      {/* ── Header ── */}
      <div className="bg-white px-5 py-4 border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl ${accentLight} flex items-center justify-center shadow-sm`}>
            {isSoignant
              ? <BarChart3 className={`w-6 h-6 ${accentText}`} />
              : <Bot className="w-6 h-6 text-purple-600" />
            }
          </div>
          <div className="flex-1">
            <h2 className="text-base font-extrabold text-gray-900">
              {isSoignant ? "Assistant Expert PDV" : "Assistant IA Médical"}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-[#10AC84]" />
              <span className="text-xs font-medium text-gray-500">
                {isSoignant
                  ? "Llama 3.1 · e-Health · Données CNLS 2023"
                  : "Llama 3.1 · VIH/Sénégal · Non substitut médical"}
              </span>
            </div>
          </div>
          {/* Badge rôle */}
          {isSoignant && (
            <span className="flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
              <Stethoscope className="w-3 h-3" /> Expert
            </span>
          )}
        </div>

        {/* Bandeau soignant */}
        {isSoignant && (
          <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
            <p className="text-[11px] font-bold text-blue-800 leading-snug">
              Mode professionnel — Matrice PDV, données épidémiologiques, protocoles d'intervention
            </p>
          </div>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4 pb-32">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2 items-end`}>
            {m.role === "assistant" && (
              <div className={`w-8 h-8 rounded-full ${accentLight} flex items-center justify-center shrink-0`}>
                {isSoignant
                  ? <BarChart3 className={`w-4 h-4 ${accentText}`} />
                  : <Bot className="w-4 h-4 text-purple-600" />}
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${
              m.role === "user"
                ? `${userBubble} text-white rounded-br-sm`
                : "bg-white text-gray-800 rounded-bl-sm border border-gray-100"
            }`}>
              <p style={{ whiteSpace: "pre-wrap" }}>{m.content}</p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-2 items-end">
            <div className={`w-8 h-8 rounded-full ${accentLight} flex items-center justify-center shrink-0`}>
              {isSoignant
                ? <BarChart3 className={`w-4 h-4 ${accentText}`} />
                : <Bot className="w-4 h-4 text-purple-600" />}
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* ── Suggestions rapides ── */}
      {messages.length < 3 && (
        <div className="px-4 pb-2 flex gap-2 flex-wrap">
          {suggestions.map(s => (
            <button key={s} onClick={() => send(s)}
              className={`shrink-0 bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-gray-50 transition-colors`}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Bandeau urgence ── */}
      <div className="px-4 pb-2">
        <div className={`rounded-xl p-2.5 flex items-center gap-2 ${isSoignant ? "bg-blue-50 border border-blue-100" : "bg-rose-50 border border-rose-100"}`}>
          {isSoignant
            ? <AlertTriangle className="w-4 h-4 text-blue-500 shrink-0" />
            : <Phone className="w-4 h-4 text-rose-500 shrink-0" />}
          <span className={`text-xs font-bold ${isSoignant ? "text-blue-700" : "text-rose-700"}`}>
            {isSoignant
              ? "Urgence patient : activer protocole PDV · Ligne Gindima 200 365"
              : "Urgence : Ligne Gindima 200 365 (gratuit, 24h/24)"}
          </span>
        </div>
      </div>

      {/* ── Input ── */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 flex gap-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder={isSoignant ? "Score PDV, matrice de risque, protocole…" : "Posez votre question médicale…"}
          className={`flex-1 bg-gray-100 text-sm font-medium rounded-xl py-3 px-4 focus:outline-none focus:ring-2 ${accentRing} transition-shadow`}
        />
        <button
          onClick={() => send()} disabled={loading}
          className={`w-12 h-12 ${accent} rounded-xl flex items-center justify-center shadow-md disabled:opacity-50 transition-opacity`}
        >
          <Send className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
}
