import { Lock, Send, ArrowLeft, Phone, Bot, Shield, ShieldCheck, Flag, X, Mic, Square, Play, Pause, BarChart3, Plus, Trash2, Clock, Timer, Check, CheckCheck } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabaseClient";
import { aiService } from "../../services/aiService";

type Tab = "soignants" | "patients" | "groupes" | "ia";

interface Contact {
  id: string;
  name: string;
  initials: string;
  role: string;
  last: string;
  time: string;
  gradient: string;
  isReal?: boolean;
}

interface Msg {
  id: string;
  text: string;
  sent: boolean;
  time: string;
  pending?: boolean;
  isRead?: boolean;
  mediaUrl?: string;
  audioDuration?: number;
  expiresAt?: string;
}

function timeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "expiré";
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}

const GRADIENTS = [
  "from-[#FF6B6B] to-[#FF9F43]",
  "from-[#1DD1A1] to-[#10AC84]",
  "from-purple-400 to-pink-400",
  "from-blue-400 to-cyan-500",
  "from-amber-400 to-orange-400",
  "from-indigo-400 to-purple-500",
  "from-teal-400 to-emerald-400",
  "from-pink-400 to-rose-400",
];

function getInitials(pseudo: string): string {
  const words = pseudo.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return pseudo.slice(0, 2).toUpperCase();
}

function getGradient(id: string): string {
  const sum = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return GRADIENTS[sum % GRADIENTS.length];
}

function profileToContact(p: any): Contact {
  return {
    id: p.id,
    name: p.pseudo,
    initials: getInitials(p.pseudo),
    role: [p.specialite, p.cta_id].filter(Boolean).join(" · ") || "Professionnel CTA",
    last: "Démarrez la conversation",
    time: "",
    gradient: getGradient(p.id),
    isReal: true,
  };
}

function timeStr() {
  return new Date().toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" });
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}

function formatDuration(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

function AudioPlayer({ url, duration, sent }: { url: string; duration?: number; sent: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  function toggle() {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  }

  const total = duration ?? 0;
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2.5 min-w-[160px]">
      <audio ref={audioRef} src={url}
        onTimeUpdate={() => setCurrent(audioRef.current?.currentTime ?? 0)}
        onEnded={() => { setPlaying(false); setCurrent(0); }} />
      <button onClick={toggle}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${sent ? "bg-white/20 hover:bg-white/30" : "bg-[#10AC84]/10 hover:bg-[#10AC84]/20"}`}>
        {playing
          ? <Pause className={`w-4 h-4 ${sent ? "text-white" : "text-[#10AC84]"}`} />
          : <Play  className={`w-4 h-4 ${sent ? "text-white" : "text-[#10AC84]"}`} />}
      </button>
      <div className="flex-1 flex flex-col gap-1.5">
        <div className={`h-1 rounded-full overflow-hidden ${sent ? "bg-white/30" : "bg-gray-200"}`}>
          <div className={`h-1 rounded-full transition-all ${sent ? "bg-white" : "bg-[#10AC84]"}`}
            style={{ width: `${progress}%` }} />
        </div>
        <span className={`text-[10px] font-bold ${sent ? "text-white/70" : "text-gray-400"}`}>
          {playing ? formatDuration(current) : formatDuration(total)}
        </span>
      </div>
    </div>
  );
}

function PollCard({ poll, myVote, onVote, isMine }: {
  poll: any; myVote: number | undefined; onVote: (optIdx: number) => void; isMine: boolean;
}) {
  const totalVotes: number = (poll.vote_counts as number[]).reduce((a: number, b: number) => a + b, 0);
  const voted = myVote !== undefined;

  return (
    <div className={`max-w-[85%] ${isMine ? "self-end" : "self-start"}`}>
      <div className={`bg-white rounded-2xl rounded-bl-sm border border-gray-100 shadow-sm p-4 ${isMine ? "rounded-br-sm rounded-bl-2xl" : ""}`}>
        <div className="flex items-center gap-1.5 mb-2">
          <BarChart3 className="w-3.5 h-3.5 text-[#10AC84]" />
          <span className="text-[10px] font-black text-[#10AC84] uppercase tracking-wide">Sondage anonyme</span>
        </div>
        <p className="font-extrabold text-gray-900 text-sm mb-3 leading-snug">{poll.question}</p>
        <div className="flex flex-col gap-2">
          {(poll.options as string[]).map((opt, i) => {
            const count = (poll.vote_counts as number[])[i] ?? 0;
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const isMyChoice = myVote === i;
            return (
              <button key={i} onClick={() => !voted && onVote(i)} disabled={voted}
                className={`relative w-full rounded-xl overflow-hidden border text-left transition-all ${isMyChoice ? "border-[#10AC84]" : "border-gray-200"} ${!voted ? "hover:border-[#10AC84]/50 active:scale-[.98]" : ""}`}>
                {voted && (
                  <div className="absolute inset-y-0 left-0 bg-[#10AC84]/10 transition-all rounded-xl"
                    style={{ width: `${pct}%` }} />
                )}
                <div className="relative flex items-center justify-between px-3 py-2.5 gap-2">
                  <span className={`text-xs font-bold ${isMyChoice ? "text-[#10AC84]" : "text-gray-700"}`}>{opt}</span>
                  {voted && <span className="text-xs font-extrabold text-gray-500 shrink-0">{pct}%</span>}
                  {!voted && <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${isMyChoice ? "bg-[#10AC84] border-[#10AC84]" : "border-gray-300"}`} />}
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-gray-400 font-medium mt-2.5">
          {totalVotes} vote{totalVotes !== 1 ? "s" : ""} · Anonyme · {new Date(poll.created_at).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

export default function Chat() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("soignants");
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [activeGroup, setActiveGroup] = useState<any>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [groupPosts, setGroupPosts] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [soignants, setSoignants] = useState<Contact[]>([]);
  const [pairs, setPairs] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingSoignants, setLoadingSoignants] = useState(true);
  const [loadingPairs, setLoadingPairs] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [reportTarget, setReportTarget] = useState<Msg | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ephemeralDuration, setEphemeralDuration] = useState<number | null>(null); // secondes
  const [polls, setPolls] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [broadcastMode, setBroadcastMode] = useState(false);
  const [broadcastSelected, setBroadcastSelected] = useState<string[]>([]);
  const [broadcastText, setBroadcastText] = useState("");
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastDone, setBroadcastDone] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [aiMessages, setAiMessages] = useState([
    { role: "assistant" as const, content: "Bonjour ! Je suis l'assistant médical de Positif+. Comment puis-je vous aider ?" }
  ]);
  const endRef = useRef<HTMLDivElement>(null);
  const realtimeRef = useRef<any>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, groupPosts, aiMessages]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (uid) loadPairs(uid);
    });

    // Vrais soignants depuis Supabase
    supabase.from("profiles")
      .select("id, pseudo, cta_id, specialite, is_verified")
      .eq("is_soignant", true)
      .order("is_verified", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setSoignants((data || []).map(profileToContact));
        setLoadingSoignants(false);
      });

    supabase.from("groups").select("*").order("member_count", { ascending: false })
      .then(({ data }) => { setGroups(data || []); setLoadingGroups(false); });

    return () => { if (realtimeRef.current) supabase.removeChannel(realtimeRef.current); };
  }, []);

  // Nettoyage client des messages expirés toutes les 10s
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setMsgs(prev => {
        const alive = prev.filter(m => !m.expiresAt || new Date(m.expiresAt).getTime() > now);
        return alive.length === prev.length ? prev : alive;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadPairs(uid: string) {
    setLoadingPairs(true);
    const { data } = await supabase
      .from("friendships")
      .select("requester_id, addressee_id, requester:requester_id(id, pseudo, is_soignant), addressee:addressee_id(id, pseudo, is_soignant)")
      .or(`requester_id.eq.${uid},addressee_id.eq.${uid}`)
      .eq("status", "accepted");

    const friends = (data || [])
      .map((f: any) => (f.requester_id === uid ? f.addressee : f.requester))
      .filter((p: any) => p && !p.is_soignant)
      .map((p: any, i: number): Contact => ({
        id: p.id,
        name: p.pseudo,
        initials: getInitials(p.pseudo),
        role: "Pair-à-pair · Sénégal",
        last: "Démarrez la conversation",
        time: "",
        gradient: GRADIENTS[i % GRADIENTS.length],
        isReal: true,
      }));

    setPairs(friends);
    setLoadingPairs(false);
  }

  // Charger les vrais messages Supabase quand on ouvre un contact
  async function openContact(contact: Contact) {
    setActiveContact(contact);
    setMsgs([]);
    if (!userId) return;

    setLoadingMsgs(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${contact.id}),and(sender_id.eq.${contact.id},receiver_id.eq.${userId})`)
      .order("created_at", { ascending: true })
      .limit(50);

    const now = Date.now();
    const loaded: Msg[] = (data || [])
      .filter((m: any) => !m.expires_at || new Date(m.expires_at).getTime() > now)
      .map((m: any) => ({
        id: m.id,
        text: m.content,
        sent: m.sender_id === userId,
        time: new Date(m.created_at).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" }),
        isRead: m.is_read,
        mediaUrl: m.media_url ?? undefined,
        audioDuration: m.duration ?? undefined,
        expiresAt: m.expires_at ?? undefined,
      }));
    setMsgs(loaded);
    setLoadingMsgs(false);

    // Supprimer les expirés côté DB
    supabase.from("messages")
      .delete()
      .lt("expires_at", new Date().toISOString())
      .not("expires_at", "is", null);

    // Marquer les messages reçus comme lus
    supabase.from("messages")
      .update({ is_read: true })
      .eq("receiver_id", userId)
      .eq("sender_id", contact.id)
      .eq("is_read", false);

    // Realtime nouveaux messages
    if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
    realtimeRef.current = supabase
      .channel("chat-direct-" + contact.id)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `receiver_id=eq.${userId}`,
      }, (payload: any) => {
        const m = payload.new;
        if (m.sender_id !== contact.id) return;
        if (m.expires_at && new Date(m.expires_at).getTime() <= Date.now()) return;
        setMsgs(prev => [...prev, {
          id: m.id, text: m.content, sent: false,
          time: new Date(m.created_at).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" }),
          isRead: false,
          mediaUrl: m.media_url ?? undefined,
          audioDuration: m.duration ?? undefined,
          expiresAt: m.expires_at ?? undefined,
        }]);
        // Marquer immédiatement comme lu car la conversation est ouverte
        supabase.from("messages").update({ is_read: true }).eq("id", m.id);
      })
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "messages",
        filter: `sender_id=eq.${userId}`,
      }, (payload: any) => {
        const m = payload.new;
        if (m.receiver_id !== contact.id) return;
        if (m.is_read) {
          setMsgs(prev => prev.map(msg => msg.id === m.id ? { ...msg, isRead: true } : msg));
        }
      })
      .subscribe();
  }

  async function sendDirectMsg() {
    if (!input.trim() || !activeContact || !userId) return;
    const text = input.trim();
    setInput("");
    const expiresAt = ephemeralDuration
      ? new Date(Date.now() + ephemeralDuration * 1000).toISOString()
      : undefined;
    const tempId = Date.now().toString();
    const newMsg: Msg = { id: tempId, text, sent: true, time: timeStr(), pending: true, expiresAt };
    setMsgs(m => [...m, newMsg]);

    // Persist to Supabase
    const { data, error } = await supabase.from("messages").insert({
      sender_id: userId,
      receiver_id: activeContact.id,
      content: text,
      is_read: false,
      message_type: "text",
      ...(expiresAt ? { expires_at: expiresAt } : {}),
    }).select().single();

    if (!error && data) {
      setMsgs(m => m.map(msg => msg.id === tempId ? { ...msg, id: data.id, pending: false } : msg));
    }
  }

  async function sendGroupMsg() {
    if (!input.trim() || !activeGroup || !userId) return;
    const text = input.trim();
    setInput("");
    const payload: any = { group_id: activeGroup.id, content: text, is_anonymous: true, likes_count: 0, author_id: userId };
    const { data } = await supabase.from("posts").insert(payload).select().single().catch(() => ({ data: null }));
    if (data) setGroupPosts(p => [...p, data]);
    else setGroupPosts(p => [...p, { id: Date.now(), content: text, is_anonymous: true, created_at: new Date().toISOString() }]);
  }

  async function sendAI() {
    if (!input.trim() || aiLoading) return;
    const msg = input.trim();
    setInput("");
    setAiMessages(m => [...m, { role: "user" as const, content: msg }]);
    setAiLoading(true);
    try {
      const history = aiMessages.map(m => ({ role: m.role, content: m.content }));
      const reply = await aiService.sendMessage(history, msg);
      setAiMessages(m => [...m, { role: "assistant" as const, content: reply }]);
    } catch {
      setAiMessages(m => [...m, { role: "assistant" as const, content: "Désolé, une erreur est survenue. Ligne Gindima : 200 365." }]);
    }
    setAiLoading(false);
  }

  async function openGroup(g: any) {
    setActiveGroup(g);
    const { data } = await supabase.from("posts").select("*").eq("group_id", g.id)
      .order("created_at", { ascending: true }).limit(30);
    setGroupPosts(data || []);
    if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
    realtimeRef.current = supabase.channel("chat-group-" + g.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts", filter: `group_id=eq.${g.id}` },
        (payload: any) => setGroupPosts(prev => [...prev, payload.new]))
      .subscribe();
  }

  function handleSend() {
    if (tab === "ia") sendAI();
    else if (tab === "groupes" && activeGroup) sendGroupMsg();
    else if (activeContact) sendDirectMsg();
  }

  function startLongPress(msg: Msg) {
    longPressTimer.current = setTimeout(() => {
      if (!msg.sent) { setReportTarget(msg); setReportReason(""); setReportSent(false); }
    }, 600);
  }
  function cancelLongPress() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }

  async function submitReport() {
    if (!reportTarget || !reportReason || !userId) return;
    await supabase.from("reports").insert({
      reporter_id: userId,
      message_id: reportTarget.id,
      reason: reportReason,
    });
    setReportSent(true);
    setTimeout(() => setReportTarget(null), 1500);
  }

  async function sendBroadcast() {
    if (!broadcastText.trim() || !userId || broadcastSelected.length === 0) return;
    setBroadcastSending(true);
    const inserts = broadcastSelected.map(receiverId => ({
      sender_id: userId,
      receiver_id: receiverId,
      content: broadcastText.trim(),
      is_read: false,
      message_type: "text",
    }));
    await supabase.from("messages").insert(inserts);
    setBroadcastSending(false);
    setBroadcastDone(true);
    setTimeout(() => {
      setBroadcastMode(false);
      setBroadcastSelected([]);
      setBroadcastText("");
      setBroadcastDone(false);
    }, 1800);
  }

  function toggleBroadcastContact(id: string) {
    setBroadcastSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordSecs(0);
      recordTimerRef.current = setInterval(() => setRecordSecs(s => s + 1), 1000);
    } catch {
      alert("Microphone non autorisé. Vérifiez les permissions du navigateur.");
    }
  }

  function stopRecording(cancel = false) {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setIsRecording(false);
    const duration = recordSecs;
    if (cancel) {
      mr.stop();
      mr.stream.getTracks().forEach(t => t.stop());
      return;
    }
    mr.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      mr.stream.getTracks().forEach(t => t.stop());
      if (duration < 1) return; // trop court
      await sendAudioMsg(blob, duration);
    };
    mr.stop();
  }

  async function sendAudioMsg(blob: Blob, duration: number) {
    if (!userId || !activeContact) return;
    const path = `${userId}/${Date.now()}.webm`;
    const { data: uploadData, error: upErr } = await supabase.storage
      .from("voice-messages")
      .upload(path, blob, { contentType: "audio/webm" });
    if (upErr) return;
    const { data: { publicUrl } } = supabase.storage.from("voice-messages").getPublicUrl(uploadData.path);

    const expiresAt = ephemeralDuration
      ? new Date(Date.now() + ephemeralDuration * 1000).toISOString()
      : undefined;
    const tempId = "tmp-" + Date.now();
    setMsgs(m => [...m, { id: tempId, text: "", sent: true, time: timeStr(), pending: true, mediaUrl: publicUrl, audioDuration: duration, expiresAt }]);

    const { data, error } = await supabase.from("messages").insert({
      sender_id: userId,
      receiver_id: activeContact.id,
      content: "",
      media_url: publicUrl,
      is_read: false,
      message_type: "audio",
      duration,
      ...(expiresAt ? { expires_at: expiresAt } : {}),
    }).select().single();

    if (!error && data) {
      setMsgs(m => m.map(msg => msg.id === tempId ? { ...msg, id: data.id, pending: false } : msg));
    }
  }

  // ── Vue conversation directe ──────────────────────────────────────────────
  if (activeContact && (tab === "soignants" || tab === "patients")) {
    const isDoctor = tab === "soignants";

    // Regroup consecutive messages from the same sender
    type MsgGroup = { sent: boolean; items: Msg[] };
    const groups: MsgGroup[] = [];
    for (const m of msgs) {
      const last = groups[groups.length - 1];
      if (last && last.sent === m.sent) last.items.push(m);
      else groups.push({ sent: m.sent, items: [m] });
    }

    return (
      <div className="flex flex-col h-full font-sans bg-[#F5F7FA]">

        {/* ── Header ── */}
        <div className="bg-white px-4 pt-4 pb-3 border-b border-gray-100 shadow-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setActiveContact(null); setMsgs([]); if (realtimeRef.current) supabase.removeChannel(realtimeRef.current); }}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
              aria-label="Retour"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>

            <div className={`w-11 h-11 bg-gradient-to-br ${activeContact.gradient} rounded-2xl flex items-center justify-center shadow-md shrink-0`}>
              <span className="text-white font-extrabold text-sm">{activeContact.initials}</span>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-extrabold text-gray-900 text-sm leading-tight truncate">{activeContact.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1DD1A1] shrink-0" />
                <p className="text-[11px] text-gray-400 font-medium truncate">{activeContact.role}</p>
              </div>
            </div>

            {isDoctor && (
              <a
                href="tel:200365"
                aria-label="Appeler"
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
              >
                <Phone className="w-4 h-4 text-gray-500" />
              </a>
            )}
          </div>

          {/* Security strip */}
          <div className={`mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${isDoctor ? "bg-[#10AC84]/10" : "bg-purple-50"}`}>
            {isDoctor
              ? <Lock className="w-3 h-3 text-[#10AC84] shrink-0" />
              : <ShieldCheck className="w-3 h-3 text-purple-500 shrink-0" />
            }
            <span className={`text-[10px] font-bold tracking-wide ${isDoctor ? "text-[#10AC84]" : "text-purple-600"}`}>
              {isDoctor ? "Conversation chiffrée · Soignant CTA" : "Identité anonyme · Soutien pair-à-pair"}
            </span>
          </div>
        </div>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-2 pb-28">
          {loadingMsgs && (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-[#10AC84] rounded-full animate-spin" />
            </div>
          )}

          {!loadingMsgs && msgs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className={`w-14 h-14 bg-gradient-to-br ${activeContact.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                <span className="text-white font-extrabold text-lg">{activeContact.initials}</span>
              </div>
              <p className="text-sm font-bold text-gray-700">{activeContact.name}</p>
              <p className="text-xs text-gray-400 text-center max-w-[200px] leading-relaxed">
                {isDoctor ? "Démarrez la conversation en toute confidentialité" : "Échangez de façon anonyme et sécurisée"}
              </p>
            </div>
          )}

          {groups.map((group, gi) => (
            <div key={gi} className={`flex flex-col gap-0.5 ${group.sent ? "items-end" : "items-start"} mb-1`}>
              {/* Pseudonym label above first received bubble */}
              {!group.sent && (
                <span className="text-[10px] font-bold text-gray-400 ml-10 mb-0.5 tracking-wide">
                  {activeContact.name}
                </span>
              )}

              {group.items.map((m, mi) => {
                const isFirst = mi === 0;
                const isLast  = mi === group.items.length - 1;

                // Bubble corner shaping per position in group
                const sentShape  = `rounded-2xl ${isFirst ? "rounded-tr-md" : ""} ${isLast ? "rounded-br-md" : ""} rounded-tl-2xl rounded-bl-2xl`;
                const recvShape  = `rounded-2xl ${isFirst ? "rounded-tl-md" : ""} ${isLast ? "rounded-bl-md" : ""} rounded-tr-2xl rounded-br-2xl`;

                return (
                  <div key={m.id} className={`flex items-end gap-2 w-full ${group.sent ? "flex-row-reverse" : "flex-row"}`}>
                    {/* Avatar — only visible on last bubble of received group */}
                    {!group.sent && (
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${activeContact.gradient} flex items-center justify-center shrink-0 shadow-sm transition-opacity ${isLast ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                        <span className="text-white text-[10px] font-bold">{activeContact.initials}</span>
                      </div>
                    )}

                    <div
                      onTouchStart={() => startLongPress(m)}
                      onTouchEnd={cancelLongPress}
                      onTouchMove={cancelLongPress}
                      onMouseDown={() => startLongPress(m)}
                      onMouseUp={cancelLongPress}
                      onMouseLeave={cancelLongPress}
                      className={`
                        max-w-[76%] px-4 py-2.5 shadow-sm select-none transition-opacity
                        ${group.sent
                          ? `bg-[#10AC84] text-white ${sentShape}`
                          : `bg-white text-gray-900 border border-gray-100 ${recvShape}`
                        }
                        ${m.pending ? "opacity-60" : ""}
                      `}
                    >
                      {m.mediaUrl
                        ? <AudioPlayer url={m.mediaUrl} duration={m.audioDuration} sent={group.sent} />
                        : <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                      }

                      {/* Meta row — only on last bubble of group */}
                      {isLast && (
                        <div className={`flex items-center gap-1.5 mt-1.5 ${group.sent ? "justify-end" : "justify-start"}`}>
                          {m.expiresAt && (
                            <span className={`flex items-center gap-0.5 text-[9px] font-bold ${group.sent ? "text-white/60" : "text-orange-400"}`}>
                              <Timer className="w-2.5 h-2.5" />
                              {timeLeft(m.expiresAt)}
                            </span>
                          )}
                          <span className={`text-[10px] ${group.sent ? "text-white/60" : "text-gray-400"}`}>
                            {m.time}{m.pending ? " · Envoi..." : ""}
                          </span>
                          {group.sent && (
                            m.pending
                              ? <Check className="w-3 h-3 text-white/30" />
                              : m.isRead
                                ? <CheckCheck className="w-3 h-3 text-white" />
                                : <CheckCheck className="w-3 h-3 text-white/50" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* ── Barre durée éphémère ── */}
        <div className="bg-white border-t border-gray-100 px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <span className="text-[10px] font-bold text-gray-400 shrink-0 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Durée :
          </span>
          {([null, 3600, 86400, 604800] as (number|null)[]).map(d => (
            <button
              key={String(d)}
              onClick={() => setEphemeralDuration(d === ephemeralDuration ? null : d)}
              className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold transition-all border flex items-center gap-1 ${
                ephemeralDuration === d && d !== null
                  ? "bg-orange-500 text-white border-orange-500"
                  : d === null
                  ? ephemeralDuration === null
                    ? "bg-gray-200 text-gray-700 border-gray-200"
                    : "bg-gray-100 text-gray-400 border-gray-100"
                  : "bg-gray-100 text-gray-500 border-gray-100 hover:bg-orange-50 hover:text-orange-500"
              }`}
            >
              {d !== null && <Timer className="w-2.5 h-2.5 shrink-0" />}
              {d === null ? "Normal" : d === 3600 ? "1h" : d === 86400 ? "24h" : "7j"}
            </button>
          ))}
        </div>

        {/* ── Zone de saisie ── */}
        <div className="bg-white border-t border-gray-100 px-4 py-3">
          {isRecording ? (
            <div className="flex items-center gap-2.5">
              <div className="flex-1 bg-rose-50 border border-rose-200 rounded-2xl py-3 px-4 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                <span className="text-sm font-bold text-rose-600 flex-1">Enregistrement</span>
                <span className="text-sm font-mono font-bold text-rose-500">{formatDuration(recordSecs)}</span>
              </div>
              <button
                onClick={() => stopRecording(true)}
                className="w-11 h-11 bg-gray-100 rounded-2xl flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => stopRecording(false)}
                className="w-11 h-11 bg-[#10AC84] rounded-2xl flex items-center justify-center shadow-md shadow-[#10AC84]/25 shrink-0"
              >
                <Square className="w-4 h-4 text-white fill-white" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="flex-1 bg-gray-100 rounded-2xl flex items-center px-4 py-2.5 focus-within:ring-2 focus-within:ring-[#10AC84]/30 transition-all">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendDirectMsg()}
                  placeholder="Votre message..."
                  className="flex-1 bg-transparent text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none"
                />
              </div>
              {input.trim() ? (
                <button
                  onClick={sendDirectMsg}
                  className="w-11 h-11 bg-[#10AC84] rounded-2xl flex items-center justify-center shadow-md shadow-[#10AC84]/25 active:scale-95 transition-transform shrink-0"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  className="w-11 h-11 bg-[#10AC84] rounded-2xl flex items-center justify-center shadow-md shadow-[#10AC84]/25 active:scale-95 transition-transform shrink-0"
                >
                  <Mic className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Modal signalement ── */}
        {reportTarget && (
          <div className="fixed inset-0 z-50 flex items-end" onClick={() => setReportTarget(null)}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="relative w-full bg-white rounded-t-3xl px-5 pt-5 pb-8 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-rose-500" />
                  <h3 className="font-extrabold text-gray-900 text-base">Signaler ce message</h3>
                </div>
                <button onClick={() => setReportTarget(null)} aria-label="Fermer" className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4 border border-gray-100">
                <p className="text-xs text-gray-400 font-bold mb-1">Message signalé :</p>
                <p className="text-sm text-gray-700 font-medium line-clamp-2">{reportTarget.text}</p>
              </div>
              {reportSent ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <ShieldCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="font-bold text-green-700">Signalement envoyé</p>
                  <p className="text-xs text-gray-400 mt-1">Notre équipe examinera ce message.</p>
                </div>
              ) : (
                <>
                  <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Raison</p>
                  <div className="flex flex-col gap-2 mb-5">
                    {["Contenu inapproprié", "Harcèlement ou intimidation", "Désinformation médicale", "Autre"].map(r => (
                      <button key={r} onClick={() => setReportReason(r)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold border transition-all ${reportReason === r ? "bg-rose-50 border-rose-300 text-rose-700" : "bg-gray-50 border-gray-100 text-gray-700"}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                  <button onClick={submitReport} disabled={!reportReason}
                    className="w-full py-3.5 bg-rose-500 text-white font-extrabold rounded-2xl disabled:opacity-40 transition-opacity shadow-md shadow-rose-200">
                    Envoyer le signalement
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Vue chat groupe ───────────────────────────────────────────────────────
  if (activeGroup && tab === "groupes") {
    const COLORS = ["from-pink-400 to-rose-400","from-teal-400 to-emerald-400","from-purple-400 to-pink-400","from-blue-400 to-cyan-400","from-amber-400 to-orange-400"];
    return (
      <div className="flex flex-col h-full font-sans bg-gray-50">
        <div className="bg-white px-4 py-3.5 border-b border-gray-100 shadow-sm sticky top-0 z-10">
          <button onClick={() => { setActiveGroup(null); setGroupPosts([]); if (realtimeRef.current) supabase.removeChannel(realtimeRef.current); }}
            className="flex items-center gap-1 text-[#10AC84] text-sm font-bold mb-2">
            <ArrowLeft className="w-4 h-4" /> Groupes
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#1DD1A1]/10 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-[#10AC84]" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{activeGroup.name}</h3>
              <p className="text-[11px] text-gray-500">{activeGroup.member_count} membres · Anonyme</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 pb-24">
          {groupPosts.length === 0 && (
            <div className="text-center text-gray-400 py-10 text-sm font-medium">Soyez le premier à écrire.</div>
          )}
          {groupPosts.map((p, i) => (
            <div key={p.id} className={`flex ${p.author_id === userId ? "justify-end" : "justify-start"}`}>
              {p.author_id !== userId && (
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${COLORS[i % COLORS.length]} flex items-center justify-center mr-2 shrink-0 self-end`}>
                  <span className="text-white text-[10px] font-bold">AN</span>
                </div>
              )}
              <div className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${p.author_id === userId ? "bg-[#10AC84] text-white rounded-br-sm" : "bg-white text-gray-900 rounded-bl-sm border border-gray-100"}`}>
                <p className="text-sm font-medium leading-relaxed">{p.content}</p>
                <p className={`text-[10px] mt-1 ${p.author_id === userId ? "text-white/70" : "text-gray-400"}`}>
                  {new Date(p.created_at).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="bg-white border-t border-gray-100 px-4 py-3 flex gap-3">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendGroupMsg()}
            placeholder="Message anonyme au groupe..."
            className="flex-1 bg-gray-100 text-sm font-medium rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#10AC84]/50" />
          <button onClick={sendGroupMsg} disabled={!input.trim()}
            className="w-12 h-12 bg-[#10AC84] rounded-xl flex items-center justify-center shadow-md disabled:opacity-40">
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    );
  }

  // ── Vue liste ──────────────────────────────────────────────────────────────
  const TABS: { key: Tab; label: string }[] = [
    { key: "soignants", label: "Soignants" },
    { key: "patients",  label: "Pairs" },
    { key: "groupes",   label: "Groupes" },
  ];

  return (
    <div className="flex flex-col h-full font-sans bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-3 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate("/app/echanges")} aria-label="Retour aux échanges" className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <h2 className="text-xl font-extrabold text-gray-900 flex-1">Messages</h2>
          {(tab === "soignants" || tab === "patients") && (
            <button
              onClick={() => { setBroadcastMode(b => !b); setBroadcastSelected([]); setBroadcastText(""); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${broadcastMode ? "bg-[#10AC84] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              <Send className="w-3.5 h-3.5" /> Diffuser
            </button>
          )}
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Panel broadcast ── */}
      {broadcastMode && (
        <div className="bg-white border-b border-gray-100 px-4 py-3 shadow-sm">
          {broadcastDone ? (
            <div className="flex items-center justify-center gap-2 py-1">
              <div className="w-5 h-5 bg-[#10AC84] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-black">✓</span>
              </div>
              <p className="text-sm font-bold text-[#10AC84]">
                Message envoyé à {broadcastSelected.length} contact{broadcastSelected.length > 1 ? "s" : ""}
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs font-bold text-gray-500 mb-2">
                {broadcastSelected.length === 0
                  ? "Sélectionnez des contacts ci-dessous"
                  : `${broadcastSelected.length} contact${broadcastSelected.length > 1 ? "s" : ""} sélectionné${broadcastSelected.length > 1 ? "s" : ""}`}
              </p>
              <div className="flex gap-2">
                <input
                  value={broadcastText}
                  onChange={e => setBroadcastText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendBroadcast()}
                  placeholder="Message à diffuser..."
                  disabled={broadcastSelected.length === 0}
                  className="flex-1 bg-gray-100 text-sm font-medium rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#10AC84]/50 disabled:opacity-50"
                />
                <button
                  onClick={sendBroadcast}
                  disabled={!broadcastText.trim() || broadcastSelected.length === 0 || broadcastSending}
                  className="w-11 h-11 bg-[#10AC84] rounded-xl flex items-center justify-center shadow-md disabled:opacity-40 shrink-0">
                  {broadcastSending
                    ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <Send className="w-4 h-4 text-white" />}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {/* Soignants */}
        {tab === "soignants" && (
          <div className="flex flex-col">
            <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#10AC84]" />
              <p className="text-xs font-bold text-[#10AC84]">Messages chiffrés E2E · Soignants CTA vérifiés</p>
            </div>
            {loadingSoignants && (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-[#10AC84] rounded-full animate-spin" />
              </div>
            )}
            {!loadingSoignants && soignants.length === 0 && (
              <div className="text-center py-12 px-6">
                <p className="text-sm font-medium text-gray-500">Aucun soignant disponible pour l'instant.</p>
                <p className="text-xs text-gray-400 mt-1">Les professionnels CTA apparaîtront ici dès leur inscription.</p>
              </div>
            )}
            {soignants.map(c => (
              <button key={c.id}
                onClick={() => broadcastMode ? toggleBroadcastContact(c.id) : openContact(c)}
                className={`flex items-center gap-3 px-4 py-4 bg-white border-b border-gray-50 transition-colors text-left ${broadcastMode && broadcastSelected.includes(c.id) ? "bg-emerald-50" : "hover:bg-gray-50"}`}>
                {broadcastMode ? (
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${broadcastSelected.includes(c.id) ? "bg-[#10AC84] border-[#10AC84]" : "border-gray-300"}`}>
                    {broadcastSelected.includes(c.id) && <span className="text-white text-xs font-black">✓</span>}
                  </div>
                ) : null}
                <div className={`bg-gradient-to-br ${c.gradient} rounded-full flex items-center justify-center shrink-0 shadow-sm ${broadcastMode ? "w-10 h-10" : "w-12 h-12"}`}>
                  <span className="text-white font-bold text-sm">{c.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className="font-bold text-sm text-gray-900">{c.name}</p>
                    {c.isReal && <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md ml-2 shrink-0">Vérifié</span>}
                  </div>
                  <p className="text-[11px] font-medium text-gray-500 truncate">{c.role}</p>
                  <p className="text-xs font-medium text-gray-400 truncate mt-0.5">{c.last}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Patients pair-à-pair */}
        {tab === "patients" && (
          <div className="flex flex-col">
            <div className="px-4 py-3 bg-purple-50 border-b border-purple-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-500" />
              <p className="text-xs font-bold text-purple-700">Identité anonyme · Soutien pair-à-pair</p>
            </div>
            {loadingPairs && (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-purple-400 rounded-full animate-spin" />
              </div>
            )}
            {!loadingPairs && pairs.length === 0 && (
              <div className="text-center py-12 px-6">
                <p className="text-sm font-medium text-gray-500">Aucune connexion pair-à-pair.</p>
                <p className="text-xs text-gray-400 mt-1">Ajoutez des amis dans Profil → Mes connexions pour discuter ici.</p>
              </div>
            )}
            {pairs.map(c => (
              <button key={c.id}
                onClick={() => broadcastMode ? toggleBroadcastContact(c.id) : openContact(c)}
                className={`flex items-center gap-3 px-4 py-4 bg-white border-b border-gray-50 transition-colors text-left ${broadcastMode && broadcastSelected.includes(c.id) ? "bg-purple-50" : "hover:bg-gray-50"}`}>
                {broadcastMode ? (
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${broadcastSelected.includes(c.id) ? "bg-purple-500 border-purple-500" : "border-gray-300"}`}>
                    {broadcastSelected.includes(c.id) && <span className="text-white text-xs font-black">✓</span>}
                  </div>
                ) : null}
                <div className={`bg-gradient-to-br ${c.gradient} rounded-full flex items-center justify-center shrink-0 shadow-sm ${broadcastMode ? "w-10 h-10" : "w-12 h-12"}`}>
                  <span className="text-white font-bold text-sm">{c.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className="font-bold text-sm text-gray-900">{c.name}</p>
                  </div>
                  <p className="text-[11px] font-medium text-gray-500 truncate">{c.role}</p>
                  <p className="text-xs font-medium text-gray-400 truncate mt-0.5">{c.last}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Groupes */}
        {tab === "groupes" && (
          <div className="flex flex-col gap-1 p-4">
            {loadingGroups && <p className="text-sm text-gray-400 text-center py-8">Chargement des groupes...</p>}
            {!loadingGroups && groups.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Aucun groupe disponible pour l'instant.</p>}
            {groups.map(g => (
              <button key={g.id} onClick={() => openGroup(g)}
                className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 mb-2 text-left hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-2xl bg-[#1DD1A1]/10 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-[#10AC84]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900">{g.name}</p>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{g.member_count} membres · {g.category || "Soutien"}</p>
                </div>
                <span className="text-[#FF9F43] text-xs font-bold">Entrer →</span>
              </button>
            ))}
          </div>
        )}

        {/* IA */}
        {tab === "ia" && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 pb-24">
              {aiMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#10AC84] to-teal-500 flex items-center justify-center mr-2 shrink-0 self-end">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm text-sm font-medium leading-relaxed ${m.role === "user" ? "bg-[#10AC84] text-white rounded-br-sm" : "bg-white text-gray-900 rounded-bl-sm border border-gray-100"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#10AC84] to-teal-500 flex items-center justify-center mr-2 shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 border border-gray-100 flex gap-1 items-center">
                    {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: `${i*150}ms` }} />)}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
            <div className="bg-white border-t border-gray-100 px-4 py-3 flex gap-3">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendAI()}
                placeholder="Posez une question médicale..."
                className="flex-1 bg-gray-100 text-sm font-medium rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#10AC84]/50" />
              <button onClick={sendAI} disabled={!input.trim() || aiLoading}
                className="w-12 h-12 bg-[#10AC84] rounded-xl flex items-center justify-center shadow-md disabled:opacity-40">
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
