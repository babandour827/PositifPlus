import { useState, useEffect, useRef } from "react";
import {
  Users, MessageCircle, Bot, User, Bell, Shield,
  Pill, Calendar, ChevronRight, Send, Lock,
  Activity, Baby, Leaf, Brain, LogOut, Phone,
  CheckCircle, Plus, Search, Settings, Globe,
  Newspaper, X, Clock, Home, TrendingUp,
  BookOpen, MapPin, Download, ChevronDown,
  Info, Heart, Smile, Frown, Meh, FileText,
  Star, Filter, HeartPulse, BookOpenCheck,
  Dumbbell, Droplets, Utensils, Moon, LogIn,
  ArrowRight, AlertCircle
} from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import { huggingFaceService } from "./services/huggingFaceService";
import logo from "./assets/positif_plus_logo.png";

// ─── DESIGN TOKENS (Figma exact) ────────────────────────────
const C = {
  bg:        "#FFFFFF",
  bgSoft:    "#F9FAFB",
  bgGray:    "#F3F4F6",
  border:    "#E5E7EB",
  borderMid: "#D1D5DB",

  text:      "#111827",
  textMid:   "#374151",
  textSub:   "#6B7280",
  textLight: "#9CA3AF",

  green:     "#10B981",
  greenDark: "#059669",
  greenBg:   "#ECFDF5",
  greenBorder:"#A7F3D0",

  orange:    "#F97316",
  orangeBg:  "#FFF7ED",
  orangeBorder:"#FED7AA",

  coral:     "#EF4444",
  coralBg:   "#FEF2F2",

  purple:    "#7C3AED",
  purpleBg:  "#F5F3FF",
  purpleBorder:"#DDD6FE",

  blue:      "#3B82F6",
  blueBg:    "#EFF6FF",

  gindima1:  "#FF6B6B",
  gindima2:  "#F97316",
};

// ─── TYPES ─────────────────────────────────────────────────
type Tab = "accueil"|"communaute"|"messagerie"|"tracking"|"ressources"|"profil"|"notifications"|"ia";
interface Group { id:string; name:string; description:string; category:string; member_count:number; }
interface ChatMsg { role:"user"|"assistant"; content:string; }

// ─── DONNÉES ───────────────────────────────────────────────
const CAT: Record<string,{icon:typeof Globe;color:string;bg:string;label:string}> = {
  general:   {icon:Globe,      color:C.green,  bg:C.greenBg,  label:"Général"},
  traitement:{icon:Pill,       color:C.blue,   bg:C.blueBg,   label:"Traitement"},
  nutrition: {icon:Utensils,   color:C.orange, bg:C.orangeBg, label:"Nutrition"},
  mental:    {icon:Heart,      color:C.purple, bg:C.purpleBg, label:"Mental"},
  jeunes:    {icon:Star,       color:C.coral,  bg:C.coralBg,  label:"Jeunes"},
};

// ─── HELPERS ───────────────────────────────────────────────
const card: React.CSSProperties = {
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: 16,
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};
const inp: React.CSSProperties = {
  width:"100%", padding:"12px 14px", borderRadius:12,
  border:`1.5px solid ${C.border}`, background:C.bgSoft,
  color:C.text, fontSize:14, outline:"none", boxSizing:"border-box",
};

// ─── SPLASH ────────────────────────────────────────────────
function Splash({onDone}:{onDone:()=>void}) {
  useEffect(()=>{const t=setTimeout(onDone,2400);return()=>clearTimeout(t);},[]);
  return (
    <div style={{position:"fixed",inset:0,background:`linear-gradient(160deg,${C.greenBg},${C.bg})`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:24,zIndex:999}}>
      <style>{`@keyframes pop{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}@keyframes rise{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}@keyframes dot{0%,80%,100%{opacity:.2}40%{opacity:1}}`}</style>
      <div style={{animation:"pop 2s ease infinite"}}>
        <img src={logo} alt="Positif+" style={{width:110,height:110,objectFit:"contain",filter:"drop-shadow(0 8px 24px rgba(16,185,129,.3))"}}/>
      </div>
      <div style={{textAlign:"center",animation:"rise .6s ease .3s both"}}>
        <h1 style={{fontSize:36,fontWeight:900,color:C.text,letterSpacing:-1,margin:0}}>Positif<span style={{color:C.orange}}>+</span></h1>
        <p style={{color:C.textSub,fontSize:14,marginTop:8,fontWeight:500}}>Ensemble, on est plus forts</p>
      </div>
      <div style={{display:"flex",gap:6,animation:"rise .6s ease .7s both"}}>
        {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:C.green,animation:`dot 1.4s ease ${i*.2}s infinite`}}/>)}
      </div>
    </div>
  );
}

// ─── GINDIMA BANNER ────────────────────────────────────────
function GindimaBanner() {
  return (
    <div style={{background:`linear-gradient(135deg,${C.gindima1},${C.gindima2})`,padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <Phone size={18} color="#fff"/>
        <span style={{color:"#fff",fontWeight:700,fontSize:14}}>Ligne Gindima · 800 00 30 30</span>
      </div>
      <button style={{background:"rgba(255,255,255,.25)",border:"none",borderRadius:20,padding:"5px 14px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Appeler</button>
    </div>
  );
}

// ─── P+ HEADER ─────────────────────────────────────────────
function AppHeader({onNotif,notifCount=0}:{onNotif:()=>void;notifCount?:number}) {
  return (
    <div style={{background:C.bg,padding:"14px 20px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.border}`}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:40,height:40,borderRadius:12,background:C.orange,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{color:"#fff",fontWeight:900,fontSize:15}}>P+</span>
        </div>
        <div>
          <span style={{color:C.text,fontWeight:800,fontSize:17}}>Positif<span style={{color:C.orange}}>+</span></span>
          <div style={{color:C.textSub,fontSize:12}}>Bonjour, Sarah</div>
        </div>
      </div>
      <button onClick={onNotif} style={{position:"relative",background:C.bgGray,border:"none",borderRadius:12,width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
        <Bell size={20} color={C.textMid}/>
        {notifCount>0&&<div style={{position:"absolute",top:6,right:6,width:9,height:9,borderRadius:"50%",background:C.coral,border:`2px solid ${C.bg}`}}/>}
      </button>
    </div>
  );
}

// ─── AUTH ──────────────────────────────────────────────────
function Auth({onAuth}:{onAuth:()=>void}) {
  const [mode,setMode]=useState<"login"|"register">("login");
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [pseudo,setPseudo]=useState(""); const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  async function submit(){
    setLoading(true); setError("");
    try {
      if(mode==="login"){const{error:e}=await supabase.auth.signInWithPassword({email,password});if(e)throw e;}
      else{const{data,error:e}=await supabase.auth.signUp({email,password});if(e)throw e;if(data.user)await supabase.from("profiles").insert({id:data.user.id,pseudo:pseudo||email.split("@")[0],langue:"fr",is_soignant:false,is_verified:false,notifications_enabled:true});}
      onAuth();
    }catch(e:any){setError(e.message);}finally{setLoading(false);}
  }
  return(
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${C.greenBg} 0%,${C.bg} 60%)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <img src={logo} alt="Positif+" style={{width:90,height:90,objectFit:"contain",marginBottom:16}}/>
          <h1 style={{fontSize:30,fontWeight:900,color:C.text,letterSpacing:-1,margin:0}}>Positif<span style={{color:C.orange}}>+</span></h1>
          <p style={{color:C.textSub,fontSize:14,marginTop:6}}>Votre espace santé sécurisé au Sénégal</p>
        </div>
        <div style={{...card,padding:24}}>
          <div style={{display:"flex",background:C.bgGray,borderRadius:12,padding:4,marginBottom:20}}>
            {(["login","register"] as const).map(m=><button key={m} onClick={()=>setMode(m)} style={{flex:1,padding:"10px 0",borderRadius:9,border:"none",background:mode===m?C.bg:"transparent",color:mode===m?C.text:C.textSub,fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:mode===m?"0 1px 4px rgba(0,0,0,.1)":"none"}}>
              {m==="login"?"Connexion":"Inscription"}
            </button>)}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {mode==="register"&&<input value={pseudo} onChange={e=>setPseudo(e.target.value)} style={inp} placeholder="Pseudo anonyme (ex: Espoir237)"/>}
            <input value={email} onChange={e=>setEmail(e.target.value)} style={inp} type="email" placeholder="Adresse email"/>
            <input value={password} onChange={e=>setPassword(e.target.value)} style={inp} type="password" placeholder="Mot de passe"/>
            {error&&<div style={{background:C.coralBg,border:`1px solid #FECACA`,borderRadius:10,padding:"10px 14px",color:C.coral,fontSize:13}}>{error}</div>}
            <button onClick={submit} disabled={loading} style={{width:"100%",padding:"14px 0",borderRadius:12,border:"none",background:loading?C.greenBg:`linear-gradient(135deg,${C.orange},${C.gindima1})`,color:"#fff",fontSize:16,fontWeight:800,cursor:"pointer",marginTop:4}}>
              {loading?"...":(mode==="login"?"Se connecter":"Créer mon compte")}
            </button>
          </div>
          <div style={{marginTop:16,background:C.greenBg,borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}>
            <Shield size={15} color={C.green}/><span style={{color:C.greenDark,fontSize:12,fontWeight:500}}>100% anonyme · Chiffrement E2E · RGPD</span>
          </div>
        </div>
        <button onClick={onAuth} style={{width:"100%",padding:"12px 0",borderRadius:12,border:`1.5px solid ${C.border}`,background:C.bg,color:C.textSub,fontSize:14,cursor:"pointer",marginTop:12}}>Continuer en démo</button>
      </div>
    </div>
  );
}

// ─── ACCUEIL ───────────────────────────────────────────────
function PageAccueil({onNav}:{onNav:(t:Tab)=>void}) {
  const actions=[
    {label:"Communauté",sub:"Groupes pair-à-pair",icon:Users,color:C.orange,bg:C.orangeBg,tab:"communaute" as Tab},
    {label:"Messagerie",sub:"Soignants CTA",icon:MessageCircle,color:C.blue,bg:C.blueBg,tab:"messagerie" as Tab},
    {label:"Assistant IA",sub:"Questions médicales",icon:Bot,color:C.purple,bg:C.purpleBg,tab:"ia" as Tab},
    {label:"Mon Suivi",sub:"Observance ARV",icon:TrendingUp,color:C.green,bg:C.greenBg,tab:"tracking" as Tab},
    {label:"Ressources",sub:"CTA & docs CNLS",icon:BookOpen,color:C.blue,bg:C.blueBg,tab:"ressources" as Tab},
    {label:"Notifications",sub:"Rappels & alertes",icon:Bell,color:C.coral,bg:C.coralBg,tab:"notifications" as Tab},
  ];
  return(
    <div style={{background:C.bgSoft,minHeight:"100vh"}}>
      <div style={{padding:"20px 20px 16px",background:C.bg}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div>
            <h2 style={{color:C.text,fontSize:22,fontWeight:900,margin:0}}>Bienvenue 👋</h2>
            <p style={{color:C.textSub,fontSize:14,margin:"4px 0 0"}}>Comment allez-vous aujourd'hui ?</p>
          </div>
          <button onClick={()=>onNav("notifications")} style={{position:"relative",background:C.bgGray,border:"none",borderRadius:12,width:42,height:42,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
            <Bell size={20} color={C.textMid}/>
            <div style={{position:"absolute",top:8,right:8,width:8,height:8,borderRadius:"50%",background:C.coral}}/>
          </button>
        </div>
        {/* Stats cards */}
        <div style={{display:"flex",gap:10}}>
          {[
            {label:"Membres",value:"2 847",color:C.green,bg:C.greenBg},
            {label:"CTA actifs",value:"23",color:C.blue,bg:C.blueBg},
            {label:"Messages",value:"156",color:C.purple,bg:C.purpleBg},
          ].map(s=>(
            <div key={s.label} style={{flex:1,background:s.bg,borderRadius:14,padding:"12px 10px",textAlign:"center"}}>
              <div style={{color:s.color,fontSize:18,fontWeight:800}}>{s.value}</div>
              <div style={{color:C.textSub,fontSize:11,marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Urgence banner */}
      <div style={{padding:"12px 16px"}}>
        <div style={{background:`linear-gradient(135deg,${C.gindima1},${C.gindima2})`,borderRadius:18,padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,borderRadius:12,background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center"}}><Phone size={22} color="#fff"/></div>
            <div>
              <p style={{color:"#fff",fontWeight:700,fontSize:13,margin:0,opacity:.9}}>Urgence VIH · Ligne Gindima</p>
              <p style={{color:"#fff",fontSize:20,fontWeight:900,margin:"2px 0 0",letterSpacing:.5}}>800 00 30 30</p>
            </div>
          </div>
          <button style={{background:"rgba(255,255,255,.25)",border:"none",borderRadius:20,padding:"8px 16px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Appeler</button>
        </div>
      </div>

      {/* Accès rapide */}
      <div style={{padding:"4px 16px 24px"}}>
        <h3 style={{color:C.textMid,fontSize:13,fontWeight:700,letterSpacing:.5,marginBottom:14}}>ACCÈS RAPIDE</h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {actions.map(a=>(
            <button key={a.label} onClick={()=>onNav(a.tab)} style={{...card,padding:"16px 14px",textAlign:"left",cursor:"pointer",border:`1px solid ${C.border}`}}>
              <div style={{width:44,height:44,borderRadius:13,background:a.bg,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12}}><a.icon size={22} color={a.color}/></div>
              <div style={{color:C.text,fontSize:14,fontWeight:700}}>{a.label}</div>
              <div style={{color:C.textSub,fontSize:12,marginTop:3}}>{a.sub}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── COMMUNAUTÉ ────────────────────────────────────────────
function PageCommunaute() {
  const [groups,setGroups]=useState<Group[]>([]); const [activeGroup,setActiveGroup]=useState<Group|null>(null);
  const [posts,setPosts]=useState<any[]>([]); const [newPost,setNewPost]=useState("");
  const [filter,setFilter]=useState("Tout"); const [loading,setLoading]=useState(true);
  const filters=["Tout","Témoignages","Experts","Questions"];
  useEffect(()=>{supabase.from("groups").select("*").order("member_count",{ascending:false}).then(({data})=>{if(data)setGroups(data);setLoading(false);});},[]);
  async function loadPosts(g:Group){setActiveGroup(g);const{data}=await supabase.from("posts").select("*").eq("group_id",g.id).order("created_at",{ascending:false}).limit(30);setPosts(data||[]);}
  async function sendPost(){
    if(!newPost.trim()||!activeGroup)return;
    const{data:{user}}=await supabase.auth.getUser();
    if(!user){setPosts(p=>[{id:Date.now(),content:newPost,is_anonymous:true,created_at:new Date().toISOString()},...p]);setNewPost("");return;}
    const{data}=await supabase.from("posts").insert({group_id:activeGroup.id,author_id:user.id,content:newPost,is_anonymous:true}).select().single();
    if(data)setPosts(p=>[data,...p]); setNewPost("");
  }
  const avatarColors=[C.orange,C.green,C.blue,C.purple,C.coral];
  if(activeGroup)return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:C.bgSoft}}>
      <div style={{background:C.bg,padding:"16px 20px",borderBottom:`1px solid ${C.border}`}}>
        <button onClick={()=>setActiveGroup(null)} style={{background:"none",border:"none",color:C.green,fontSize:14,cursor:"pointer",padding:0,marginBottom:8,fontWeight:600}}>← Retour</button>
        <h2 style={{color:C.text,fontSize:17,fontWeight:800,margin:0}}>{activeGroup.name}</h2>
        <p style={{color:C.textSub,fontSize:12,margin:"4px 0 0"}}>Anonyme · Sécurisé · Pair-à-pair</p>
      </div>
      <div style={{background:C.greenBg,padding:"10px 20px",display:"flex",alignItems:"center",gap:8,borderBottom:`1px solid ${C.greenBorder}`}}>
        <Shield size={14} color={C.green}/><span style={{color:C.greenDark,fontSize:12,fontWeight:500}}>Espace bienveillant · La confidentialité est notre priorité</span>
      </div>
      <div style={{flex:1,overflow:"auto",padding:16,display:"flex",flexDirection:"column",gap:12}}>
        {posts.length===0&&<div style={{textAlign:"center",color:C.textSub,padding:40}}><MessageCircle size={40} color={C.border} style={{marginBottom:12}}/><p>Sois le premier à partager.</p></div>}
        {posts.map((p,i)=>{
          const col=avatarColors[i%avatarColors.length];
          const initials="AN";
          return(
            <div key={p.id} style={{...card,padding:16}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:col+"22",border:`2px solid ${col}`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:col,fontSize:12,fontWeight:700}}>{initials}</span></div>
                <div><div style={{color:C.text,fontSize:14,fontWeight:600}}>Membre anonyme</div><div style={{color:C.textSub,fontSize:11}}>{new Date(p.created_at).toLocaleDateString("fr")}</div></div>
                <div style={{marginLeft:"auto",background:C.purpleBg,color:C.purple,fontSize:11,padding:"3px 10px",borderRadius:20,fontWeight:600}}>Témoignage</div>
              </div>
              <p style={{color:C.textMid,fontSize:14,margin:0,lineHeight:1.65}}>{p.content}</p>
            </div>
          );
        })}
      </div>
      <div style={{padding:"12px 16px",background:C.bg,borderTop:`1px solid ${C.border}`,display:"flex",gap:10}}>
        <input value={newPost} onChange={e=>setNewPost(e.target.value)} placeholder="Partage anonymement..." style={{...inp,flex:1}}/>
        <button onClick={sendPost} style={{width:46,height:46,borderRadius:13,border:"none",background:C.orange,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}><Send size={18} color="#fff"/></button>
      </div>
    </div>
  );
  return(
    <div style={{background:C.bgSoft,minHeight:"100vh"}}>
      <div style={{background:C.bg,padding:"20px 20px 16px",borderBottom:`1px solid ${C.border}`}}>
        <h2 style={{color:C.text,fontSize:22,fontWeight:900,margin:"0 0 2px"}}>Communauté <Users size={20} color={C.orange} style={{verticalAlign:"middle"}}/></h2>
        <p style={{color:C.textSub,fontSize:13,margin:"0 0 16px"}}>Ensemble, on est plus forts</p>
        <div style={{display:"flex",alignItems:"center",background:C.bgGray,borderRadius:12,padding:"10px 14px",gap:10,marginBottom:12}}>
          <Search size={16} color={C.textSub}/><input placeholder="Rechercher un sujet..." style={{flex:1,background:"none",border:"none",color:C.text,fontSize:14,outline:"none"}}/>
          <Filter size={16} color={C.green}/>
        </div>
        <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:2}}>
          {filters.map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"7px 16px",borderRadius:20,border:"none",background:filter===f?C.coral:"transparent",color:filter===f?"#fff":C.textSub,fontSize:13,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,boxShadow:filter===f?"0 2px 8px rgba(239,68,68,.3)":"none"}}>{f}</button>)}
        </div>
      </div>
      <div style={{background:C.greenBg,padding:"12px 20px",borderBottom:`1px solid ${C.greenBorder}`,display:"flex",alignItems:"center",gap:10}}>
        <Shield size={16} color={C.green}/><span style={{color:C.greenDark,fontSize:13,fontWeight:500}}>Espace bienveillant — La confidentialité et le respect sont nos priorités.</span>
      </div>
      <div style={{padding:"16px"}}>
        {loading?<div style={{textAlign:"center",color:C.textSub,padding:40}}>Chargement...</div>:(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {groups.map(g=>{const c=CAT[g.category]||CAT.general;const Icon=c.icon;return(
              <button key={g.id} onClick={()=>loadPosts(g)} style={{...card,padding:16,textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:14,width:"100%"}}>
                <div style={{width:52,height:52,borderRadius:16,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon size={26} color={c.color}/></div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:C.text,fontSize:15,fontWeight:700,marginBottom:3}}>{g.name}</div>
                  <div style={{color:C.textSub,fontSize:12,lineHeight:1.4}}>{g.description?.slice(0,65)}...</div>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6}}>
                    <span style={{background:c.bg,color:c.color,fontSize:11,padding:"2px 8px",borderRadius:20,fontWeight:600}}>{c.label}</span>
                    <span style={{color:C.textLight,fontSize:11}}>{g.member_count} membres</span>
                  </div>
                </div>
                <ChevronRight size={18} color={C.textLight}/>
              </button>
            );})}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MESSAGERIE ────────────────────────────────────────────
function PageMessagerie() {
  const [activeChat,setActiveChat]=useState<any>(null);
  const [msgs,setMsgs]=useState<{text:string;mine:boolean;time:string}[]>([]);
  const [input,setInput]=useState("");
  const contacts=[
    {name:"Dr. Fatou Diallo",role:"CTA Hôpital de Fann · Dakar",last:"Votre prochain RDV est confirmé ✓",time:"10h30",unread:1,color:C.green,initials:"FD"},
    {name:"Inf. Moussa Sarr",role:"CTA Hôpital Principal · Dakar",last:"N'oubliez pas votre traitement ARV",time:"Hier",unread:0,color:C.blue,initials:"MS"},
    {name:"Dr. Aminata Cissé",role:"CTA Ziguinchor",last:"Résultats d'analyses disponibles",time:"Lun.",unread:2,color:C.purple,initials:"AC"},
  ];
  function send(){
    if(!input.trim())return;
    setMsgs(m=>[...m,{text:input,mine:true,time:new Date().toLocaleTimeString("fr",{hour:"2-digit",minute:"2-digit"})}]);
    setInput("");
    setTimeout(()=>setMsgs(m=>[...m,{text:"Merci pour votre message. Je reviens vers vous rapidement.",mine:false,time:new Date().toLocaleTimeString("fr",{hour:"2-digit",minute:"2-digit"})}]),1200);
  }
  if(activeChat)return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:C.bgSoft}}>
      <div style={{background:C.bg,padding:"16px 20px",borderBottom:`1px solid ${C.border}`}}>
        <button onClick={()=>setActiveChat(null)} style={{background:"none",border:"none",color:C.green,fontSize:14,cursor:"pointer",padding:0,marginBottom:10,fontWeight:600}}>← Retour</button>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:46,height:46,borderRadius:"50%",background:activeChat.color+"22",border:`2px solid ${activeChat.color}`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:activeChat.color,fontSize:15,fontWeight:800}}>{activeChat.initials}</span></div>
          <div><div style={{color:C.text,fontWeight:700,fontSize:16}}>{activeChat.name}</div><div style={{color:C.textSub,fontSize:12}}>{activeChat.role}</div></div>
        </div>
      </div>
      <div style={{background:C.greenBg,padding:"8px 20px",borderBottom:`1px solid ${C.greenBorder}`,display:"flex",alignItems:"center",gap:8}}><Lock size={13} color={C.green}/><span style={{color:C.greenDark,fontSize:12,fontWeight:500}}>Messages chiffrés de bout en bout</span></div>
      <div style={{flex:1,overflow:"auto",padding:16,display:"flex",flexDirection:"column",gap:10}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.mine?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"78%",background:m.mine?C.green:C.bg,border:m.mine?"none":`1px solid ${C.border}`,borderRadius:m.mine?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:"12px 14px",boxShadow:"0 1px 2px rgba(0,0,0,.06)"}}>
              <p style={{color:m.mine?"#fff":C.text,fontSize:14,margin:"0 0 4px",lineHeight:1.6}}>{m.text}</p>
              <span style={{color:m.mine?"rgba(255,255,255,.7)":C.textLight,fontSize:10}}>{m.time}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{padding:"12px 16px",background:C.bg,borderTop:`1px solid ${C.border}`,display:"flex",gap:10}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Votre message..." style={{...inp,flex:1}}/>
        <button onClick={send} style={{width:46,height:46,borderRadius:13,border:"none",background:C.green,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}><Send size={18} color="#fff"/></button>
      </div>
    </div>
  );
  return(
    <div style={{background:C.bgSoft,minHeight:"100vh"}}>
      <div style={{background:C.bg,padding:"20px 20px 0",borderBottom:`1px solid ${C.border}`}}>
        <h2 style={{color:C.text,fontSize:22,fontWeight:900,margin:"0 0 4px"}}>Messagerie</h2>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}><Lock size={13} color={C.green}/><span style={{color:C.textSub,fontSize:13}}>Chiffrement bout-en-bout · Soignants CTA</span></div>
      </div>
      {contacts.map((c,i)=>(
        <div key={i} onClick={()=>{setActiveChat(c);setMsgs([]);}} style={{background:C.bg,padding:"16px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:14,cursor:"pointer"}}>
          <div style={{position:"relative"}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:c.color+"15",border:`2px solid ${c.color}`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:c.color,fontSize:16,fontWeight:800}}>{c.initials}</span></div>
            <div style={{position:"absolute",bottom:2,right:2,width:11,height:11,borderRadius:"50%",background:C.green,border:`2px solid ${C.bg}`}}/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{color:C.text,fontSize:15,fontWeight:700}}>{c.name}</span><span style={{color:C.textLight,fontSize:12}}>{c.time}</span></div>
            <div style={{color:C.textSub,fontSize:12}}>{c.role}</div>
            <div style={{color:C.textLight,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.last}</div>
          </div>
          {c.unread>0&&<div style={{width:22,height:22,borderRadius:"50%",background:C.coral,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:800,flexShrink:0}}>{c.unread}</div>}
        </div>
      ))}
      <div style={{padding:"20px 16px"}}><button style={{width:"100%",padding:"15px 0",borderRadius:14,border:`1.5px dashed ${C.border}`,background:C.bg,color:C.green,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Plus size={18}/> Contacter un soignant CTA</button></div>
    </div>
  );
}

// ─── TRACKING ──────────────────────────────────────────────
function PageTracking() {
  const [humeur,setHumeur]=useState<string|null>(null);
  const programme=[
    {label:"Prise du matin",time:"08:00",done:true,icon:Pill,color:C.orange},
    {label:"Hydratation (1.5L)",time:"Continue",done:true,icon:Droplets,color:C.blue},
    {label:"Repas équilibré",time:"13:00",done:false,icon:Utensils,color:C.green},
    {label:"Repos · 8h de sommeil",time:"22:00",done:false,icon:Moon,color:C.purple},
  ];
  const semaine=[
    {j:"L",done:true},{j:"M",done:true},{j:"M",done:false},
    {j:"J",done:true},{j:"V",done:true},{j:"S",done:true},{j:"D",done:false},
  ];
  return(
    <div style={{background:C.bgSoft,minHeight:"100vh",paddingBottom:24}}>
      <div style={{background:C.bg,padding:"20px 20px 16px",borderBottom:`1px solid ${C.border}`}}>
        <h2 style={{color:C.text,fontSize:22,fontWeight:900,margin:"0 0 2px"}}>Mon Suivi <HeartPulse size={20} color={C.coral} style={{verticalAlign:"middle"}}/></h2>
        <p style={{color:C.textSub,fontSize:13,margin:0}}>L'observance est la clé de la réussite.</p>
      </div>
      <div style={{padding:"16px"}}>
        {/* Score cards */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          <div style={{background:`linear-gradient(135deg,${C.green},${C.greenDark})`,borderRadius:18,padding:"20px 18px",boxShadow:`0 4px 20px ${C.green}40`}}>
            <div style={{color:"rgba(255,255,255,.8)",fontSize:11,fontWeight:700,letterSpacing:1,marginBottom:8}}>SCORE</div>
            <div style={{color:"#fff",fontSize:38,fontWeight:900,lineHeight:1}}>92<span style={{fontSize:20}}>%</span></div>
            <div style={{color:"rgba(255,255,255,.85)",fontSize:12,marginTop:6,fontWeight:500}}>Excellente régularité cette semaine</div>
          </div>
          <div style={{...card,padding:"20px 18px"}}>
            <div style={{color:C.textSub,fontSize:11,fontWeight:700,letterSpacing:1,marginBottom:8}}>JOURS</div>
            <div style={{color:C.text,fontSize:38,fontWeight:900,lineHeight:1}}>14</div>
            <div style={{color:C.textSub,fontSize:12,marginTop:6}}>Jours consécutifs validés</div>
          </div>
        </div>

        {/* Programme du jour */}
        <div style={{...card,padding:20,marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h3 style={{color:C.text,fontSize:16,fontWeight:700,margin:0}}>Programme du jour</h3>
            <span style={{color:C.green,fontSize:13,fontWeight:700}}>50% Complété</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {programme.map((p,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:36,height:36,borderRadius:"50%",border:`2px solid ${p.done?p.color:C.border}`,background:p.done?p.color+"22":C.bgGray,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {p.done?<CheckCircle size={18} color={p.color}/>:<p.icon size={16} color={p.done?p.color:C.textLight}/>}
                </div>
                <div style={{flex:1}}>
                  <div style={{color:p.done?C.text:C.textMid,fontSize:14,fontWeight:p.done?600:400,textDecoration:p.done?"none":"none"}}>{p.label}</div>
                  <div style={{color:C.textSub,fontSize:12}}>{p.time}</div>
                </div>
                {p.done&&<CheckCircle size={16} color={C.green}/>}
              </div>
            ))}
          </div>
        </div>

        {/* Semaine */}
        <div style={{...card,padding:20,marginBottom:16}}>
          <h3 style={{color:C.text,fontSize:15,fontWeight:700,margin:"0 0 14px"}}>Cette semaine</h3>
          <div style={{display:"flex",gap:8}}>
            {semaine.map((s,i)=>(
              <div key={i} style={{flex:1,textAlign:"center"}}>
                <div style={{color:C.textSub,fontSize:11,marginBottom:7,fontWeight:500}}>{s.j}</div>
                <div style={{width:"100%",aspectRatio:"1",borderRadius:10,background:s.done?C.greenBg:C.coralBg,border:`2px solid ${s.done?C.green:C.coral}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {s.done?<CheckCircle size={13} color={C.green}/>:<X size={12} color={C.coral}/>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Humeur */}
        <div style={{...card,padding:20}}>
          <h3 style={{color:C.text,fontSize:15,fontWeight:700,margin:"0 0 14px"}}>Comment vous sentez-vous ?</h3>
          <div style={{display:"flex",gap:10}}>
            {[{icon:Smile,label:"Bien",color:C.green},{icon:Meh,label:"Moyen",color:C.orange},{icon:Frown,label:"Difficile",color:C.coral}].map(h=>(
              <button key={h.label} onClick={()=>setHumeur(h.label)} style={{flex:1,padding:"14px 0",borderRadius:14,border:`2px solid ${humeur===h.label?h.color:C.border}`,background:humeur===h.label?h.color+"15":C.bg,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                <h.icon size={28} color={h.color}/>
                <span style={{color:h.color,fontSize:12,fontWeight:600}}>{h.label}</span>
              </button>
            ))}
          </div>
          {humeur&&<p style={{color:C.green,fontSize:13,textAlign:"center",marginTop:12,fontWeight:500}}>✓ Humeur enregistrée</p>}
        </div>
      </div>
    </div>
  );
}

// ─── RESSOURCES ────────────────────────────────────────────
function PageRessources() {
  const [search,setSearch]=useState("");
  const categories=[
    {label:"Traitements",icon:Pill,color:C.green},
    {label:"Activité Physique",icon:Dumbbell,color:C.blue},
    {label:"Nutrition",icon:Utensils,color:C.orange},
    {label:"Santé mentale",icon:Brain,color:C.purple},
  ];
  const ctas=[
    {nom:"CTA Hôpital de Fann",region:"Dakar",tel:"+221 33 869 15 15",color:C.green},
    {nom:"CTA Hôpital Principal",region:"Dakar",tel:"+221 33 839 50 50",color:C.blue},
    {nom:"CTA de Ziguinchor",region:"Ziguinchor",tel:"+221 33 991 22 00",color:C.purple},
    {nom:"CTA Hôpital de Thiès",region:"Thiès",tel:"+221 33 951 10 10",color:C.orange},
  ];
  return(
    <div style={{background:C.bgSoft,minHeight:"100vh",paddingBottom:24}}>
      <div style={{background:C.bg,padding:"20px 20px 16px",borderBottom:`1px solid ${C.border}`}}>
        <h2 style={{color:C.text,fontSize:22,fontWeight:900,margin:"0 0 2px"}}>Ressources <BookOpenCheck size={20} color={C.blue} style={{verticalAlign:"middle"}}/></h2>
        <p style={{color:C.textSub,fontSize:13,margin:"0 0 16px"}}>Informez-vous pour mieux agir.</p>
        <div style={{display:"flex",alignItems:"center",background:C.bgGray,borderRadius:12,padding:"10px 14px",gap:10}}>
          <Search size={16} color={C.textSub}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un article, une vidéo..." style={{flex:1,background:"none",border:"none",color:C.text,fontSize:14,outline:"none"}}/>
        </div>
      </div>
      <div style={{padding:16}}>
        {/* Catégories */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          {categories.map(c=>(
            <button key={c.label} style={{...card,padding:"14px 16px",textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",border:`1px solid ${C.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <c.icon size={18} color={c.color}/>
                <span style={{color:c.color,fontSize:14,fontWeight:700}}>{c.label}</span>
              </div>
              <ArrowRight size={16} color={c.color}/>
            </button>
          ))}
        </div>

        {/* Quiz card */}
        <div style={{background:C.purpleBg,border:`1px solid ${C.purpleBorder}`,borderRadius:18,padding:20,marginBottom:16,display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:52,height:52,borderRadius:14,background:C.purple+"22",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Star size={26} color={C.purple} fill={C.purple}/></div>
          <div style={{flex:1}}>
            <div style={{color:C.purple,fontSize:15,fontWeight:700,marginBottom:4}}>Testez vos connaissances</div>
            <div style={{color:C.textSub,fontSize:12,marginBottom:12}}>Gagnez des badges en répondant à notre quiz santé de la semaine.</div>
            <button style={{background:C.purple,border:"none",borderRadius:20,padding:"8px 20px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Commencer</button>
          </div>
        </div>

        {/* Centres CTA */}
        <h3 style={{color:C.textMid,fontSize:13,fontWeight:700,letterSpacing:.5,marginBottom:12}}>CENTRES DE TRAITEMENT (CTA)</h3>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {ctas.map((c,i)=>(
            <div key={i} style={{...card,padding:16,display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:46,height:46,borderRadius:13,background:c.color+"15",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><MapPin size={22} color={c.color}/></div>
              <div style={{flex:1}}>
                <div style={{color:C.text,fontSize:14,fontWeight:700}}>{c.nom}</div>
                <div style={{color:C.textSub,fontSize:12,marginTop:2}}>{c.region}</div>
                <div style={{color:c.color,fontSize:13,fontWeight:600,marginTop:3}}>{c.tel}</div>
              </div>
              <ChevronRight size={16} color={C.textLight}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── NOTIFICATIONS ─────────────────────────────────────────
function PageNotifications({onBack}:{onBack:()=>void}) {
  const [notifs,setNotifs]=useState([
    {id:1,titre:"Rappel ARV — 08h00",body:"Il est l'heure de prendre votre TDF/3TC/EFV 300mg.",time:"Il y a 5 min",lu:false,color:C.orange,icon:Pill},
    {id:2,titre:"Message de Dr. Fatou Diallo",body:"Votre prochain rendez-vous est confirmé pour le 15 avril à 9h00.",time:"Il y a 1h",lu:false,color:C.green,icon:MessageCircle},
    {id:3,titre:"Résultats disponibles",body:"Vos résultats d'analyse sont disponibles.",time:"Aujourd'hui, 10h30",lu:true,color:C.blue,icon:Activity},
    {id:4,titre:"Nouvelle actualité CNLS",body:"Nouveaux ARV disponibles dans les CTA du Sénégal.",time:"Hier",lu:true,color:C.purple,icon:Newspaper},
    {id:5,titre:"Rappel — RDV CTA demain",body:"Rendez-vous demain à 9h00 au CTA Hôpital de Fann.",time:"Hier",lu:true,color:C.green,icon:Calendar},
  ]);
  const unread=notifs.filter(n=>!n.lu).length;
  return(
    <div style={{height:"100vh",display:"flex",flexDirection:"column",background:C.bgSoft}}>
      <div style={{background:C.bg,padding:"16px 20px",borderBottom:`1px solid ${C.border}`}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:C.green,fontSize:14,cursor:"pointer",padding:0,marginBottom:10,fontWeight:600}}>← Retour</button>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><h2 style={{color:C.text,fontSize:20,fontWeight:900,margin:0}}>Notifications</h2>{unread>0&&<p style={{color:C.textSub,fontSize:12,margin:"3px 0 0"}}>{unread} non lue{unread>1?"s":""}</p>}</div>
          {unread>0&&<button onClick={()=>setNotifs(n=>n.map(x=>({...x,lu:true})))} style={{padding:"7px 14px",borderRadius:20,border:`1px solid ${C.border}`,background:C.bg,color:C.green,fontSize:12,cursor:"pointer",fontWeight:600}}>Tout lire</button>}
        </div>
      </div>
      <div style={{flex:1,overflow:"auto"}}>
        {notifs.map(n=>(
          <div key={n.id} onClick={()=>setNotifs(ns=>ns.map(x=>x.id===n.id?{...x,lu:true}:x))} style={{background:!n.lu?C.greenBg:C.bg,padding:"16px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"flex-start",gap:14,cursor:"pointer"}}>
            <div style={{position:"relative",flexShrink:0}}>
              <div style={{width:46,height:46,borderRadius:14,background:n.color+"15",display:"flex",alignItems:"center",justifyContent:"center"}}><n.icon size={22} color={n.color}/></div>
              {!n.lu&&<div style={{position:"absolute",top:-2,right:-2,width:10,height:10,borderRadius:"50%",background:C.coral,border:`2px solid ${C.bg}`}}/>}
            </div>
            <div style={{flex:1}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{color:C.text,fontSize:14,fontWeight:n.lu?500:700}}>{n.titre}</span><span style={{color:C.textLight,fontSize:11,flexShrink:0,marginLeft:8}}>{n.time}</span></div>
              <p style={{color:C.textSub,fontSize:13,margin:0,lineHeight:1.5}}>{n.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ASSISTANT IA ──────────────────────────────────────────
function PageIA({onBack}:{onBack:()=>void}) {
  const [messages,setMessages]=useState<ChatMsg[]>([{role:"assistant",content:"Bonjour ! Je suis l'assistant médical de Positif+, spécialisé VIH/Sénégal. Je peux répondre à vos questions sur les traitements ARV, les CTA, la nutrition et le soutien psychologique."}]);
  const [input,setInput]=useState(""); const [loading,setLoading]=useState(false);
  const endRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);
  const suggestions=["Effets secondaires ARV","Trouver un CTA","Observance traitement","Nutrition et VIH","Soutien psychologique"];
  async function send(text?:string){
    const msg=text||input; if(!msg.trim()||loading)return;
    setInput(""); setMessages(m=>[...m,{role:"user",content:msg}]); setLoading(true);
    try{const reply=await huggingFaceService.sendMessage(messages.map(m=>({role:m.role,content:m.content})),msg);setMessages(m=>[...m,{role:"assistant",content:reply}]);}
    catch{setMessages(m=>[...m,{role:"assistant",content:"Désolé, une erreur est survenue. Appelez la ligne Gindima : 800 00 30 30."}]);}
    setLoading(false);
  }
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:C.bgSoft}}>
      <div style={{background:C.bg,padding:"16px 20px",borderBottom:`1px solid ${C.border}`}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:C.green,fontSize:14,cursor:"pointer",padding:0,marginBottom:10,fontWeight:600}}>← Retour</button>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:46,height:46,borderRadius:14,background:C.purpleBg,display:"flex",alignItems:"center",justifyContent:"center"}}><Bot size={24} color={C.purple}/></div>
          <div><h2 style={{color:C.text,fontSize:17,fontWeight:800,margin:0}}>Assistant IA Médical</h2><div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}><div style={{width:7,height:7,borderRadius:"50%",background:C.green}}/><span style={{color:C.textSub,fontSize:12}}>Mixtral · VIH/Sénégal · Non substitut médical</span></div></div>
        </div>
      </div>
      <div style={{flex:1,overflow:"auto",padding:16,display:"flex",flexDirection:"column",gap:14}}>
        {messages.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",gap:10,alignItems:"flex-end"}}>
            {m.role==="assistant"&&<div style={{width:32,height:32,borderRadius:"50%",background:C.purpleBg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Bot size={16} color={C.purple}/></div>}
            <div style={{maxWidth:"80%",background:m.role==="user"?C.green:C.bg,border:m.role==="assistant"?`1px solid ${C.border}`:"none",borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:"12px 14px",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
              <p style={{color:m.role==="user"?"#fff":C.text,fontSize:14,margin:0,lineHeight:1.65,whiteSpace:"pre-wrap"}}>{m.content}</p>
            </div>
          </div>
        ))}
        {loading&&<div style={{display:"flex",gap:10,alignItems:"center"}}><div style={{width:32,height:32,borderRadius:"50%",background:C.purpleBg,display:"flex",alignItems:"center",justifyContent:"center"}}><Bot size={16} color={C.purple}/></div><div style={{...card,padding:"14px 18px"}}><style>{`@keyframes db{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style><div style={{display:"flex",gap:5}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:C.green,animation:`db 1s ease ${i*.15}s infinite`}}/>)}</div></div></div>}
        <div ref={endRef}/>
      </div>
      {messages.length<3&&<div style={{padding:"0 16px 10px",display:"flex",gap:8,flexWrap:"wrap"}}>{suggestions.map(s=><button key={s} onClick={()=>send(s)} style={{padding:"8px 14px",borderRadius:20,border:`1px solid ${C.border}`,background:C.bg,color:C.textMid,fontSize:12,cursor:"pointer",fontWeight:500}}>{s}</button>)}</div>}
      <div style={{padding:"12px 16px",background:C.bg,borderTop:`1px solid ${C.border}`,display:"flex",gap:10}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Posez votre question médicale..." style={{...inp,flex:1}}/>
        <button onClick={()=>send()} disabled={loading} style={{width:46,height:46,borderRadius:13,border:"none",background:C.purple,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}><Send size={18} color="#fff"/></button>
      </div>
    </div>
  );
}

// ─── PROFIL ────────────────────────────────────────────────
function PageProfil() {
  const [user,setUser]=useState<any>(null);
  useEffect(()=>{supabase.auth.getUser().then(({data})=>setUser(data.user));},[]);
  const menuItems=[
    {icon:FileText,label:"Mes documents médicaux",color:C.blue},
    {icon:HeartPulse,label:"Historique de santé",color:C.green},
    {icon:Pill,label:"Mes médicaments ARV",color:C.orange},
    {icon:Calendar,label:"Mes rendez-vous CTA",color:C.purple},
    {icon:Bell,label:"Préférences de notification",color:C.coral},
    {icon:Lock,label:"Sécurité & Mot de passe",color:C.textSub},
    {icon:Settings,label:"Paramètres généraux",color:C.textSub},
  ];
  return(
    <div style={{background:C.bgSoft,minHeight:"100vh",paddingBottom:24}}>
      <div style={{background:C.bg,padding:"20px 20px 24px",borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
          <button style={{width:38,height:38,borderRadius:10,background:C.bgGray,border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Settings size={18} color={C.textSub}/></button>
        </div>
        {/* Avatar section */}
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:16}}>
          <div style={{width:72,height:72,borderRadius:"50%",border:`3px solid ${C.orange}`,background:C.orangeBg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{color:C.orange,fontSize:22,fontWeight:800}}>SM</span>
          </div>
          <div>
            <h2 style={{color:C.text,fontSize:20,fontWeight:800,margin:"0 0 4px"}}>{user?user.email?.split("@")[0]:"Sarah M."}</h2>
            <p style={{color:C.textSub,fontSize:13,margin:"0 0 8px"}}>Membre depuis Jan 2026</p>
            <div style={{display:"flex",gap:8}}>
              <span style={{background:C.greenBg,color:C.greenDark,fontSize:11,padding:"3px 10px",borderRadius:20,fontWeight:600}}>Progrès continu</span>
              <span style={{background:C.purpleBg,color:C.purple,fontSize:11,padding:"3px 10px",borderRadius:20,fontWeight:600}}>Super membre</span>
            </div>
          </div>
        </div>
        {/* Confidentialité card */}
        <div style={{background:C.greenBg,border:`1px solid ${C.greenBorder}`,borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"flex-start",gap:12}}>
          <Shield size={20} color={C.green} style={{flexShrink:0,marginTop:1}}/>
          <div>
            <div style={{color:C.greenDark,fontSize:14,fontWeight:700,marginBottom:4}}>Confidentialité garantie</div>
            <div style={{color:C.green,fontSize:12,lineHeight:1.5}}>Vos données médicales sont chiffrées de bout en bout et stockées en toute sécurité. Vous seul avez le contrôle sur vos informations.</div>
          </div>
        </div>
      </div>
      {/* Menu items */}
      <div style={{padding:"16px 16px 0"}}>
        <div style={{...card,overflow:"hidden",marginBottom:16}}>
          {menuItems.map((item,i)=>(
            <div key={i} style={{padding:"16px 18px",display:"flex",alignItems:"center",gap:14,borderBottom:i<menuItems.length-1?`1px solid ${C.border}`:"none",cursor:"pointer",background:C.bg}}>
              <div style={{width:38,height:38,borderRadius:10,background:item.color+"15",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><item.icon size={18} color={item.color}/></div>
              <span style={{flex:1,color:C.text,fontSize:14,fontWeight:500}}>{item.label}</span>
              <ChevronRight size={16} color={C.textLight}/>
            </div>
          ))}
        </div>
        {/* Déconnexion */}
        <div style={{...card,overflow:"hidden",marginBottom:20}}>
          <button onClick={()=>supabase.auth.signOut()} style={{width:"100%",padding:"16px 18px",display:"flex",alignItems:"center",justifyContent:"center",gap:10,border:"none",background:C.bg,cursor:"pointer"}}>
            <LogIn size={18} color={C.coral}/>
            <span style={{color:C.coral,fontSize:14,fontWeight:700}}>Se déconnecter</span>
          </button>
        </div>
        {/* Footer */}
        <div style={{textAlign:"center",paddingTop:8}}>
          <div style={{width:40,height:40,borderRadius:12,background:C.bgGray,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px"}}><Plus size={20} color={C.textLight}/></div>
          <p style={{color:C.textLight,fontSize:11,letterSpacing:1,fontWeight:600,margin:0}}>ENSEMBLE, ON EST PLUS FORTS</p>
          <p style={{color:C.textLight,fontSize:11,margin:"4px 0 0"}}>Positif+ © 2026 · v1.0.0</p>
        </div>
      </div>
    </div>
  );
}

// ─── NAV BAR (Figma style) ──────────────────────────────────
function NavBar({active,onNav}:{active:Tab;onNav:(t:Tab)=>void}) {
  const tabs=[
    {key:"accueil" as Tab,label:"Accueil",icon:Home},
    {key:"communaute" as Tab,label:"Communauté",icon:Users},
    {key:"tracking" as Tab,label:"Suivi",icon:HeartPulse,fab:true},
    {key:"ressources" as Tab,label:"Ressources",icon:BookOpen},
    {key:"profil" as Tab,label:"Profil",icon:User},
  ];
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,maxWidth:430,margin:"0 auto",background:C.bg,borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-around",alignItems:"center",padding:"8px 0 18px",zIndex:100,boxShadow:"0 -2px 12px rgba(0,0,0,.06)"}}>
      {tabs.map(t=>{
        const isActive=active===t.key;
        if(t.fab)return(
          <button key={t.key} onClick={()=>onNav(t.key)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,border:"none",background:"none",cursor:"pointer"}}>
            <div style={{width:56,height:56,borderRadius:"50%",background:isActive?C.green:C.green,boxShadow:`0 4px 16px ${C.green}66`,display:"flex",alignItems:"center",justifyContent:"center",marginTop:-20}}>
              <t.icon size={26} color="#fff"/>
            </div>
            <span style={{fontSize:10,fontWeight:700,color:C.green,marginTop:2}}>{t.label}</span>
          </button>
        );
        return(
          <button key={t.key} onClick={()=>onNav(t.key)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,border:"none",background:"none",cursor:"pointer",padding:"4px 0"}}>
            <t.icon size={22} color={isActive?C.orange:C.textLight}/>
            <span style={{fontSize:10,fontWeight:isActive?700:400,color:isActive?C.orange:C.textLight}}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── APP ───────────────────────────────────────────────────
export default function App() {
  const [phase,setPhase]=useState<"splash"|"auth"|"app">("splash");
  const [tab,setTab]=useState<Tab>("accueil");
  const fullscreen=["ia","messagerie","notifications"].includes(tab);
  return(
    <div style={{background:C.bgSoft,minHeight:"100vh",maxWidth:430,margin:"0 auto",fontFamily:"'Segoe UI',system-ui,sans-serif",overflowX:"hidden"}}>
      {phase==="splash"&&<Splash onDone={()=>setPhase("auth")}/>}
      {phase==="auth"&&<Auth onAuth={()=>setPhase("app")}/>}
      {phase==="app"&&(
        <>
          {!fullscreen&&<GindimaBanner/>}
          <div style={{paddingBottom:fullscreen?0:82}}>
            {tab==="accueil"    &&<PageAccueil onNav={setTab}/>}
            {tab==="communaute" &&<PageCommunaute/>}
            {tab==="messagerie" &&<PageMessagerie/>}
            {tab==="tracking"   &&<PageTracking/>}
            {tab==="ressources" &&<PageRessources/>}
            {tab==="profil"     &&<PageProfil/>}
            {tab==="ia"         &&<PageIA onBack={()=>setTab("accueil")}/>}
            {tab==="notifications"&&<PageNotifications onBack={()=>setTab("accueil")}/>}
          </div>
          {!fullscreen&&<NavBar active={tab} onNav={setTab}/>}
        </>
      )}
    </div>
  );
}