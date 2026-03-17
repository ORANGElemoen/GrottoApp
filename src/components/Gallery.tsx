'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';

interface GalleryProps {
  onSelectRoute: (id: string) => void;
  activeFilter: string;
  completedIds: string[];
}

export default function Gallery({ onSelectRoute, activeFilter, completedIds }: GalleryProps) {
  const [routes, setRoutes] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isSetter, setIsSetter] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('isSetter') === 'true';
    }
    return false;
  });

  useEffect(() => {
    const checkSetter = () => {
      const status = sessionStorage.getItem('isSetter') === 'true';
      if (status !== isSetter) setIsSetter(status);
    };
    window.addEventListener('focus', checkSetter);
    const interval = setInterval(checkSetter, 1000);
    return () => {
      window.removeEventListener('focus', checkSetter);
      clearInterval(interval);
    };
  }, [isSetter]);

  useEffect(() => {
    async function fetchRoutes() {
      setLoading(true);
      let query = supabase
        .from('routes')
        .select('*')
        .eq('is_archived', showArchived);

      const { data, error } = await query;
      if (!error) setRoutes(data || []);
      setLoading(false);
    }
    fetchRoutes();
  }, [showArchived]);

  // UPDATED FILTERING LOGIC: Reverted to granular matching
  const displayRoutes = useMemo(() => {
    return routes.filter(r => {
      // 1. Search Filter
      const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;

      // 2. Tab/Grade Filter
      if (activeFilter === 'All') return true;
      
      // Handle "Sent" filter specifically
      if (activeFilter === 'Sent') return completedIds.includes(r.id);

      // Match the grade exactly (e.g., "5a", "6b", "7c")
      return r.grade.toLowerCase() === activeFilter.toLowerCase();
    });
  }, [routes, search, activeFilter, completedIds]);

  return (
    <div className="p-4 text-white max-w-2xl mx-auto">
      {/* Header Section */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">
            {activeFilter === 'Sent' ? 'My Sends' : showArchived ? 'The Archive' : 'The Gallery'}
          </h2>
          <p className="text-blue-500 text-[10px] font-black tracking-[0.3em] uppercase mt-2">
            {displayRoutes.length} Routes Found
          </p>
        </div>

        {isSetter && (
          <button 
            onClick={() => setShowArchived(!showArchived)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              showArchived 
                ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20' 
                : 'bg-gray-800 border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            {showArchived ? 'View Live' : 'View Archive'}
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative mb-8">
        <input 
          placeholder="Search route name..." 
          className="w-full p-4 pl-12 rounded-[1.5rem] bg-gray-900 text-white placeholder-gray-500 border border-white/5 focus:outline-none focus:border-blue-500/50 transition-all text-sm font-bold" 
          onChange={(e) => setSearch(e.target.value)} 
        />
        <span className="absolute left-5 top-1/2 -translate-y-1/2 opacity-30 text-lg">🔍</span>
      </div>
      
      {/* List Section */}
      <div className="grid gap-3">
        {loading ? (
          <div className="py-10 text-center animate-pulse text-gray-600 font-black tracking-widest uppercase text-xs">Syncing Database...</div>
        ) : (
          <>
            {displayRoutes.length === 0 && (
              <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
                <p className="text-gray-600 font-bold uppercase tracking-widest text-[10px]">No {activeFilter} routes found</p>
              </div>
            )}
            {displayRoutes.map((r) => {
              const isSent = completedIds.includes(r.id);
              return (
                <div 
                  key={r.id} 
                  onClick={() => onSelectRoute(r.id)}
                  className={`group bg-gray-900/50 p-5 rounded-[2rem] flex justify-between items-center border transition-all duration-300 active:scale-[0.98] cursor-pointer ${
                    isSent ? 'border-green-500/30' : 'border-white/5 hover:border-blue-500/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-10 rounded-full transition-colors ${isSent ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-gray-800'}`} />
                    
                    <div>
                      <h3 className="font-black text-lg tracking-tight uppercase flex items-center gap-2">
                        {r.name}
                        {isSent && <span className="text-green-500 text-sm">✓</span>}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-blue-500 font-black tracking-widest uppercase">
                          {r.grade}
                        </span>
                        {r.is_archived && (
                          <span className="text-[8px] bg-red-900/40 text-red-500 px-2 py-0.5 rounded font-black uppercase">
                            Stored
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                     {isSent && (
                        <span className="hidden sm:block text-[8px] font-black text-green-600 uppercase tracking-widest bg-green-500/10 px-2 py-1 rounded-lg">
                          Sent
                        </span>
                     )}
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-600 transition-all">
                      <span className="text-white text-xs">→</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}