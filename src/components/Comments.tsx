'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function RouteComments({ routeId }: { routeId: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userName, setUserName] = useState("");
  const [sending, setSending] = useState(false);
  const [isSetter, setIsSetter] = useState(false);
  
  // Track which comments this specific device has upvoted
  const [votedIds, setVotedIds] = useState<string[]>([]);

  useEffect(() => {
    const setterStatus = sessionStorage.getItem('isSetter') === 'true';
    setIsSetter(setterStatus);

    // Load previously cast votes from local storage
    const savedVotes = localStorage.getItem('climber_votes');
    if (savedVotes) {
      setVotedIds(JSON.parse(savedVotes));
    }

    fetchComments();
  }, [routeId]);

  async function fetchComments() {
    const { data } = await supabase
      .from('route_comments')
      .select('*')
      .eq('route_id', routeId)
      .order('upvotes', { ascending: false })
      .order('created_at', { ascending: false });
    setComments(data || []);
  }

  // --- UPDATED UPVOTE LOGIC WITH LIMITER ---
  async function handleUpvote(commentId: string, currentUpvotes: number) {
    // 1. Check if the user has already voted for this specific comment
    if (votedIds.includes(commentId)) return;

    // 2. Optimistic UI update
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, upvotes: (c.upvotes || 0) + 1 } : c
    ));

    // 3. Update Local Storage so they can't vote again
    const newVotedIds = [...votedIds, commentId];
    setVotedIds(newVotedIds);
    localStorage.setItem('climber_votes', JSON.stringify(newVotedIds));

    // 4. Update the Database
    const { error } = await supabase
      .from('route_comments')
      .update({ upvotes: (currentUpvotes || 0) + 1 })
      .eq('id', commentId);

    if (error) fetchComments(); // Revert on error
  }

  async function postComment() {
    if (!newComment.trim()) return;
    setSending(true);
    const { error } = await supabase.from('route_comments').insert([
      { route_id: routeId, comment_text: newComment, user_name: userName.trim() || 'Anonymous Climber' }
    ]);
    if (!error) {
      setNewComment("");
      fetchComments();
    }
    setSending(false);
  }

  async function deleteComment(id: string) {
    if (confirm("Delete this beta?")) {
      const { error } = await supabase.from('route_comments').delete().eq('id', id);
      if (!error) setComments(comments.filter(c => c.id !== id));
    }
  }

  return (
    <div className="mt-12 w-full max-w-md border-t border-white/10 pt-8 px-4">
      <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 text-blue-500 italic px-2">Beta Board</h3>
      
      {/* Input Section */}
      <div className="bg-gray-900/80 backdrop-blur-sm p-5 rounded-[2.5rem] mb-8 border border-white/5 shadow-2xl">
        <input 
          placeholder="Your name..."
          className="w-full bg-black/40 p-3 rounded-2xl mb-3 text-sm text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
        <textarea 
          placeholder="Leave a tip..."
          className="w-full bg-black/40 p-4 rounded-2xl text-sm text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-600 h-24 resize-none mb-3"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <button onClick={postComment} disabled={sending || !newComment.trim()} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-30 transition-all shadow-lg active:scale-95">
          {sending ? 'Syncing...' : 'Post Beta'}
        </button>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {comments.map((c) => {
          const hasVoted = votedIds.includes(c.id);
          
          return (
            <div key={c.id} className="bg-gray-800/40 p-5 rounded-[2rem] border border-white/5 relative flex flex-col gap-2 transition-all">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">{c.user_name}</span>
                  <span className="text-[8px] font-bold text-gray-600 uppercase">{new Date(c.created_at).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* --- VOTE BUTTON WITH CONDITIONAL STYLING --- */}
                  <button 
                    onClick={() => handleUpvote(c.id, c.upvotes)}
                    disabled={hasVoted}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all border ${
                      hasVoted 
                      ? 'bg-blue-500/20 border-blue-500/40 opacity-100' 
                      : 'bg-white/5 hover:bg-white/10 border-white/5 active:scale-90'
                    }`}
                  >
                    <span className="text-xs">{hasVoted ? '✅' : '🚀'}</span>
                    <span className={`text-xs font-black ${hasVoted ? 'text-blue-400' : 'text-white'}`}>
                      {c.upvotes || 0}
                    </span>
                  </button>

                  {isSetter && (
                    <button onClick={() => deleteComment(c.id)} className="text-[8px] font-black uppercase text-red-500/50 hover:text-red-500 transition-colors">
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed font-medium pr-4">{c.comment_text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}