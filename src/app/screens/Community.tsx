import {
  MessageCircle, Heart, Share2, Search, ShieldCheck, Flame, Users,
  Sparkles, Send, Shield, Plus, X, ChevronDown, ChevronUp
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";

const AVATAR_GRADIENTS = [
  "from-pink-400 to-rose-400",
  "from-teal-400 to-emerald-400",
  "from-purple-400 to-pink-400",
  "from-blue-400 to-cyan-400",
  "from-orange-400 to-amber-400",
];


function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "Il y a quelques min";
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${Math.floor(h / 24)}j`;
}

export function Community() {
  const [groups, setGroups] = useState<any[]>([]);
  const [activeGroup, setActiveGroup] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");
  const [filter, setFilter] = useState("Tout");
  const [search, setSearch] = useState("");
  const [showFABModal, setShowFABModal] = useState(false);
  const [fabPost, setFabPost] = useState("");
  const [fabGroup, setFabGroup] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  // Likes persistés
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set());
  // Comments
  const [commentMap, setCommentMap] = useState<Record<string, any[]>>({});
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<Set<string>>(new Set());
  const postsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
    supabase.from("groups").select("*").order("member_count", { ascending: false })
      .then(({ data }) => {
        if (data) { setGroups(data); if (data.length > 0) setFabGroup(data[0].id); }
      }).catch(() => {});
    supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(10)
      .then(({ data }) => { if (data) setRecentPosts(data); }).catch(() => {});
  }, []);

  // Realtime nouveaux posts dans le groupe actif
  useEffect(() => {
    if (!activeGroup) return;
    const channel = supabase
      .channel("posts-" + activeGroup.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts", filter: `group_id=eq.${activeGroup.id}` },
        (payload) => setPosts(prev => [payload.new as any, ...prev])
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeGroup]);

  async function loadPosts(g: any) {
    setActiveGroup(g);
    const { data } = await supabase.from("posts").select("*").eq("group_id", g.id)
      .order("created_at", { ascending: false }).limit(30);
    setPosts(data || []);

    // Charger les reactions de l'utilisateur pour ces posts
    if (userId && data && data.length > 0) {
      const postIds = data.map((p: any) => p.id);
      const { data: reactions } = await supabase.from("post_reactions")
        .select("post_id").eq("user_id", userId).in("post_id", postIds);
      if (reactions) setUserReactions(new Set(reactions.map((r: any) => r.post_id)));
    }
  }

  async function sendPost() {
    if (!newPost.trim() || !activeGroup) return;
    const { data: { user } } = await supabase.auth.getUser();
    const payload: any = { group_id: activeGroup.id, content: newPost, is_anonymous: true, likes_count: 0 };
    if (user) payload.author_id = user.id;
    const { data, error } = await supabase.from("posts").insert(payload).select().single();
    if (!error && data) setPosts(p => [data, ...p]);
    else setPosts(p => [{ id: Date.now().toString(), content: newPost, is_anonymous: true, created_at: new Date().toISOString(), likes_count: 0 }, ...p]);
    setNewPost("");
    setTimeout(() => postsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  async function sendFABPost() {
    if (!fabPost.trim()) return;
    const groupId = fabGroup || groups[0]?.id;
    if (!groupId) { setShowFABModal(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const payload: any = { group_id: groupId, content: fabPost, is_anonymous: true, likes_count: 0 };
    if (user) payload.author_id = user.id;
    await supabase.from("posts").insert(payload);
    setFabPost(""); setShowFABModal(false);
  }

  async function toggleLike(postId: string, currentLikes: number) {
    if (!userId) return;
    const isLiked = userReactions.has(postId);
    // Optimistic update
    setUserReactions(prev => {
      const next = new Set(prev);
      isLiked ? next.delete(postId) : next.add(postId);
      return next;
    });
    const newLikes = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;
    setPosts(p => p.map(post => post.id === postId ? { ...post, likes_count: newLikes } : post));

    if (isLiked) {
      await supabase.from("post_reactions").delete().eq("post_id", postId).eq("user_id", userId);
    } else {
      await supabase.from("post_reactions").insert({ post_id: postId, user_id: userId });
    }
    await supabase.from("posts").update({ likes_count: newLikes }).eq("id", postId);
  }

  async function toggleComments(postId: string) {
    const isOpen = openComments.has(postId);
    setOpenComments(prev => {
      const next = new Set(prev);
      isOpen ? next.delete(postId) : next.add(postId);
      return next;
    });
    if (!isOpen && !commentMap[postId]) {
      setLoadingComments(prev => new Set(prev).add(postId));
      const { data } = await supabase.from("post_comments").select("*")
        .eq("post_id", postId).order("created_at", { ascending: true }).limit(20);
      setCommentMap(prev => ({ ...prev, [postId]: data || [] }));
      setLoadingComments(prev => { const next = new Set(prev); next.delete(postId); return next; });
    }
  }

  async function sendComment(postId: string) {
    const content = commentInputs[postId]?.trim();
    if (!content || !userId) return;
    setCommentInputs(prev => ({ ...prev, [postId]: "" }));
    const { data } = await supabase.from("post_comments")
      .insert({ post_id: postId, author_id: userId, content, is_anonymous: true })
      .select().single();
    if (data) {
      setCommentMap(prev => ({ ...prev, [postId]: [...(prev[postId] || []), data] }));
    }
  }

  const filteredGroups = groups.filter(g => search === "" || g.name.toLowerCase().includes(search.toLowerCase()));

  // Vue groupe ouvert
  if (activeGroup) return (
    <div className="flex flex-col min-h-full font-sans bg-gray-50">
      <div className="bg-white px-5 py-4 border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <button onClick={() => setActiveGroup(null)} className="text-[#10AC84] text-sm font-bold mb-2">← Retour</button>
        <h2 className="text-lg font-extrabold text-gray-900">{activeGroup.name}</h2>
        <p className="text-xs font-medium text-gray-500">Anonyme · Sécurisé · Pair-à-pair</p>
      </div>
      <div className="mx-5 mt-4 bg-teal-50 border border-teal-100 p-3 rounded-2xl flex items-center gap-3">
        <div className="bg-[#10AC84] p-1.5 rounded-full text-white shrink-0"><ShieldCheck className="w-4 h-4" /></div>
        <p className="text-xs font-medium text-teal-800">Espace bienveillant · Confidentialité et respect avant tout.</p>
      </div>
      <div className="px-5 mt-4 flex-1 flex flex-col gap-4 pb-48">
        {posts.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <MessageCircle className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium">Sois le premier à partager.</p>
          </div>
        )}
        {posts.map((p, i) => (
          <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]} p-0.5`}>
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                    <span className="font-bold text-[10px] text-gray-600">AN</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Membre anonyme</p>
                  <p className="text-[10px] font-medium text-gray-400">{timeAgo(p.created_at)}</p>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-700 leading-relaxed">{p.content}</p>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
                <button
                  onClick={() => toggleLike(p.id, p.likes_count || 0)}
                  className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${userReactions.has(p.id) ? "text-[#FF6B6B]" : "text-gray-400 hover:text-[#FF6B6B]"}`}
                >
                  <Heart className={`w-4 h-4 ${userReactions.has(p.id) ? "fill-[#FF6B6B]" : ""}`} />
                  {p.likes_count || 0}
                </button>
                <button
                  onClick={() => toggleComments(p.id)}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-[#10AC84] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  {(commentMap[p.id]?.length ?? 0) > 0 ? commentMap[p.id].length : "Commenter"}
                  {openComments.has(p.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Section commentaires */}
            {openComments.has(p.id) && (
              <div className="bg-gray-50 border-t border-gray-100 px-4 py-3 flex flex-col gap-2">
                {loadingComments.has(p.id) && (
                  <p className="text-xs text-gray-400 text-center py-2">Chargement...</p>
                )}
                {!loadingComments.has(p.id) && (commentMap[p.id] || []).map((c, ci) => (
                  <div key={c.id || ci} className="flex items-start gap-2">
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[(ci + 2) % AVATAR_GRADIENTS.length]} flex items-center justify-center shrink-0`}>
                      <span className="text-white text-[9px] font-bold">AN</span>
                    </div>
                    <div className="flex-1 bg-white rounded-xl px-3 py-2 border border-gray-100">
                      <p className="text-xs font-bold text-gray-500 mb-0.5">Anonyme · {timeAgo(c.created_at)}</p>
                      <p className="text-xs font-medium text-gray-700 leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                ))}
                {!loadingComments.has(p.id) && (commentMap[p.id] || []).length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-1">Soyez le premier à commenter.</p>
                )}
                <div className="flex gap-2 mt-1">
                  <input
                    value={commentInputs[p.id] || ""}
                    onChange={e => setCommentInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && sendComment(p.id)}
                    placeholder="Votre commentaire (anonyme)..."
                    className="flex-1 bg-white text-xs font-medium rounded-xl py-2 px-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#10AC84]/30"
                  />
                  <button
                    onClick={() => sendComment(p.id)}
                    disabled={!commentInputs[p.id]?.trim()}
                    className="w-9 h-9 bg-[#10AC84] rounded-xl flex items-center justify-center shadow-sm disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={postsEndRef} />
      </div>
      <div className="fixed bottom-20 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 px-4 py-3 flex gap-3 z-[60]">
        <input
          value={newPost}
          onChange={e => setNewPost(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendPost()}
          placeholder="Partage anonymement..."
          className="flex-1 bg-gray-100 text-sm font-medium rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/50"
        />
        <button onClick={sendPost} className="w-12 h-12 bg-[#FF6B6B] rounded-xl flex items-center justify-center shadow-md shadow-[#FF6B6B]/30">
          <Send className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-full font-sans bg-gray-50 pb-32">
      <div className="bg-white px-5 pt-4 pb-4 border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2 mb-1">
          Communauté <Users className="w-5 h-5 text-[#FF9F43]" />
        </h2>
        <p className="text-sm font-medium text-gray-500 mb-4">Ensemble, on est plus forts</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un groupe..."
              className="w-full bg-gray-100 text-sm font-medium rounded-xl py-2.5 pl-9 pr-4 focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/50"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 no-scrollbar">
          {["Tout", "Témoignages", "Experts", "Questions"].map(f => (
            <span key={f} onClick={() => setFilter(f)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer ${filter === f ? "bg-[#FF6B6B] text-white shadow-md shadow-[#FF6B6B]/20" : "bg-white border border-gray-200 text-gray-600"}`}>
              {f}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-5 mt-5 bg-teal-50 border border-teal-100 p-3 rounded-2xl flex items-center gap-3">
        <div className="bg-[#10AC84] p-1.5 rounded-full text-white shrink-0"><ShieldCheck className="w-4 h-4" /></div>
        <div>
          <h4 className="text-xs font-bold text-teal-900">Espace bienveillant</h4>
          <p className="text-[10px] font-medium text-teal-800/80 leading-tight">Tout le monde ici partage un parcours similaire. Confidentialité et respect avant tout.</p>
        </div>
      </div>

      {/* Groupes */}
      {filteredGroups.length > 0 && (
        <div className="px-5 mt-5">
          <h3 className="font-bold text-gray-800 text-sm mb-3">Groupes de soutien</h3>
          <div className="flex flex-col gap-3 mb-5">
            {filteredGroups.map(g => (
              <button key={g.id} onClick={() => loadPosts(g)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left flex items-center gap-3 hover:shadow-md transition-shadow active:scale-[0.98]">
                <div className="w-10 h-10 rounded-xl bg-[#1DD1A1]/10 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-[#10AC84]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-gray-900 truncate">{g.name}</h4>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{g.member_count} membres · {g.category || "Soutien"}</p>
                </div>
                <span className="text-[#FF9F43] text-xs font-bold shrink-0">Rejoindre →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Posts récents de la communauté */}
      <div className="px-5 mt-2 flex flex-col gap-4">
        {recentPosts.length === 0 && (
          <div className="text-center text-gray-400 py-10">
            <MessageCircle className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium">Aucun post pour l'instant.</p>
            <p className="text-xs mt-1">Rejoignez un groupe pour démarrer la conversation.</p>
          </div>
        )}
        {recentPosts.map((post, i) => {
          const isLiked = userReactions.has(post.id);
          const isCommentsOpen = openComments.has(post.id);
          return (
            <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]} p-0.5 shadow-sm`}>
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                      <span className="font-bold text-[10px] uppercase text-gray-600">AN</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Membre anonyme</p>
                    <p className="text-xs font-medium text-gray-400">{timeAgo(post.created_at)}</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-700 leading-relaxed mb-3">{post.content}</p>
                <div className="flex items-center gap-5 pt-3 border-t border-gray-50">
                  <button
                    onClick={() => toggleLike(post.id, post.likes_count || 0)}
                    className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${isLiked ? "text-[#FF6B6B]" : "text-gray-500 hover:text-[#FF6B6B]"}`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? "fill-[#FF6B6B]" : ""}`} />
                    {isLiked ? (post.likes_count || 0) + 1 : (post.likes_count || 0)}
                  </button>
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#10AC84] transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {(commentMap[post.id]?.length ?? 0) > 0 ? commentMap[post.id].length : "Commenter"}
                    {isCommentsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <button
                    aria-label="Partager ce post"
                    onClick={() => navigator.share?.({ text: post.content }).catch(() => {})}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-500 ml-auto hover:text-[#FF9F43] transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {isCommentsOpen && (
                <div className="bg-gray-50 border-t border-gray-100 px-4 py-3 flex flex-col gap-2">
                  {loadingComments.has(post.id) && <p className="text-xs text-gray-400 text-center py-2">Chargement...</p>}
                  {(commentMap[post.id] || []).map((c: any, ci: number) => (
                    <div key={c.id || ci} className="flex items-start gap-2">
                      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[(ci + 1) % AVATAR_GRADIENTS.length]} flex items-center justify-center shrink-0`}>
                        <span className="text-white text-[9px] font-bold">AN</span>
                      </div>
                      <div className="flex-1 bg-white rounded-xl px-3 py-2 border border-gray-100">
                        <p className="text-xs font-bold text-gray-500 mb-0.5">Anonyme · {timeAgo(c.created_at)}</p>
                        <p className="text-xs font-medium text-gray-700 leading-relaxed">{c.content}</p>
                      </div>
                    </div>
                  ))}
                  {!loadingComments.has(post.id) && (commentMap[post.id] || []).length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-1">Aucun commentaire. Soyez le premier !</p>
                  )}
                  <div className="flex gap-2 mt-1">
                    <input
                      value={commentInputs[post.id] || ""}
                      onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && sendComment(post.id)}
                      placeholder="Votre commentaire (anonyme)..."
                      className="flex-1 bg-white text-xs font-medium rounded-xl py-2 px-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#10AC84]/30"
                    />
                    <button onClick={() => sendComment(post.id)} disabled={!commentInputs[post.id]?.trim()}
                      className="w-9 h-9 bg-[#10AC84] rounded-xl flex items-center justify-center shadow-sm disabled:opacity-40">
                      <Send className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FAB */}
      <button onClick={() => setShowFABModal(true)}
        className="fixed bottom-28 right-5 w-12 h-12 bg-[#FF6B6B] rounded-full shadow-lg shadow-[#FF6B6B]/30 flex items-center justify-center z-[60] hover:scale-110 transition-transform">
        <Plus className="w-5 h-5 text-white" />
      </button>

      {/* Modal créer un post */}
      {showFABModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center max-w-md mx-auto" onClick={() => setShowFABModal(false)}>
          <div className="bg-white rounded-t-3xl w-full p-5 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Partager anonymement</h3>
              <button onClick={() => setShowFABModal(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            {groups.length > 0 && (
              <select value={fabGroup} onChange={e => setFabGroup(e.target.value)}
                className="w-full bg-gray-100 text-sm font-medium rounded-xl py-2.5 px-4 focus:outline-none">
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            )}
            <textarea
              value={fabPost}
              onChange={e => setFabPost(e.target.value)}
              placeholder="Exprimez-vous librement et anonymement..."
              className="w-full bg-gray-50 text-sm font-medium rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/50 min-h-[100px] resize-none border border-gray-200"
              autoFocus
            />
            <div className="flex items-center gap-2 bg-emerald-50 rounded-xl p-2.5">
              <ShieldCheck className="w-4 h-4 text-[#10AC84] shrink-0" />
              <span className="text-xs font-medium text-emerald-700">Votre identité reste totalement anonyme.</span>
            </div>
            <button
              onClick={sendFABPost}
              disabled={!fabPost.trim()}
              className="w-full py-4 rounded-2xl bg-[#FF6B6B] text-white font-bold text-sm shadow-md shadow-[#FF6B6B]/20 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Publier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
