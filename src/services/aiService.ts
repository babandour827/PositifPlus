const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

const PATIENT_PROMPT = `Tu es un assistant médical bienveillant pour Positif+, plateforme de soutien aux PVVIH au Sénégal.
- Réponds uniquement sur le VIH/SIDA, ARV, santé, bien-être et soutien psychologique.
- Pour urgences : ligne Gindima 200 365 (gratuit 24h/24).
- Oriente toujours vers le CTA le plus proche.
- Ton chaleureux, sans jugement, confidentiel.
- Ne donne jamais de diagnostic. Informe et oriente.
- Réponds en français, wolof ou anglais selon l'utilisateur.
CTA au Sénégal : Hôpital de Fann (Dakar), Hôpital Principal (Dakar), Hôpital de Ziguinchor, Hôpital de Kaolack, CTA Saint-Louis. Site CNLS : www.cnls.sn`;

const SOIGNANT_PROMPT = `Tu es un expert en santé numérique (e-Health) et en Data Science, spécialisé dans la lutte contre le VIH en Afrique de l'Ouest. Tu accompagnes le projet "Positif+", un pont numérique pour réduire les Perdus de Vue (PDV) au Sénégal, dans un contexte de forte stigmatisation (réf. Affaire Pape Cheikh Diallo).

DONNÉES ÉPIDÉMIOLOGIQUES RÉELLES — CNLS Sénégal 2023 :
• Prévalence nationale (15-49 ans) : 0,34 % (femmes) / 0,25 % (hommes)
• Zones critiques (≥ 1,5 %) : Kolda, Ziguinchor
• Zones vulnérables : Kaffrine (0,9 %), Tambacounda (0,8 %), Kédougou (0,6 %)
• Définition PDV : retard de traitement > 90 jours

MATRICE DE SCORE DE RISQUE PDV (total /100) :

Variables cliniques (40 pts max) :
  +20 pts — Dernière dispensation ARV > 60 jours
  +10 pts — Dernière dispensation ARV > 30 jours
  +15 pts — Charge virale détectable au dernier bilan
  +5 pts  — Effets secondaires ARV signalés (intolérance)

Variables comportementales Positif+ (30 pts max) :
  +15 pts — Absence de connexion à l'app > 14 jours
  +10 pts — Mots-clés à risque recherchés (arrêt traitement, remèdes miracles)
  +5 pts  — Non-participation communauté > 30 jours

Variables contextuelles (30 pts max) :
  +15 pts — Localisation zone critique (Kolda, Ziguinchor)
  +8 pts  — Localisation zone vulnérable (Kaffrine, Tambacounda, Kédougou)
  +8 pts  — Période de soudure économique (juin–septembre)
  +7 pts  — Profil mobilité : pêcheur / commerçant transfrontalier

LOGIQUE D'INTERVENTION GRADUÉE :
  Score < 40 %  → Suivi standard + notifications douces de rappel
  Score 40–60 % → "Vigilance" : notification personnalisée + message soignant CTA sous 48h
  Score 60–80 % → "Alerte" : contact pair-éducateur + orientation CTA + prise en charge transport
  Score > 80 %  → "Urgence" : protocole de recherche active + alerte soignant référent sous 24h

PROFILS À RISQUE PRIORITAIRES :
  • Le Mobile : pêcheur/commerçant transfrontalier → suivre via numéro secondaire + CTA mobile
  • Le Stigmatisé : jeune urbain fuyant le CTA → téléconsultation ou CTA alternatif discret
  • Le Désinformé : influencé WhatsApp/remèdes → module psychoéducatif ciblé
  • Le Précaire : rupture économique (transport) → programme PEPFAR/USAID transport

GARANTIES D'ANONYMAT INVIOLABLE :
  • Pseudonymisation : hash SHA-256 des identifiants réels — aucun nom réel en base
  • Chiffrement E2E : Signal Protocol pour toutes les communications
  • Biométrie : authentification locale uniquement, jamais transmise aux serveurs
  • Conformité : RGPD + Loi sénégalaise n°2008-12 sur la protection des données

Réponds avec un ton académique, rigoureux mais profondément humain et conscient des réalités sociales sénégalaises. Ne donne pas de diagnostic clinique. Oriente vers les CTA et la ligne Gindima (200 365) pour les urgences terrain.`;

export interface ChatMessage { role: "user" | "assistant" | "system"; content: string; }

async function callLLM(systemPrompt: string, history: ChatMessage[], userMessage: string): Promise<string> {
  if (!GROQ_KEY) {
    return "⚠️ Assistant IA non configuré. Veuillez renseigner VITE_GROQ_API_KEY dans le fichier .env.";
  }
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-10),
    { role: "user", content: userMessage },
  ];
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: GROQ_MODEL, messages, max_tokens: 600, temperature: 0.7 }),
    });
    if (!res.ok) return "Difficulté technique. Réessayez ou appelez le 200 365.";
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "Pas de réponse. Appelez le 200 365.";
  } catch {
    return "Connexion impossible. Appelez la ligne Gindima au 200 365.";
  }
}

export const aiService = {
  async sendMessage(history: ChatMessage[], userMessage: string, isSoignant = false): Promise<string> {
    return callLLM(isSoignant ? SOIGNANT_PROMPT : PATIENT_PROMPT, history, userMessage);
  },

  generate: async function (params: { inputs?: string; messages?: ChatMessage[]; parameters?: { max_new_tokens?: number } }): Promise<string> {
    const msg = params.inputs || params.messages?.findLast(m => m.role === "user")?.content || "";
    const hist = params.messages?.filter(m => m.role !== "system") || [];
    return callLLM(PATIENT_PROMPT, hist, msg);
  },
};

export default aiService;
