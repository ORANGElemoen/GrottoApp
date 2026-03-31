'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';

interface GalleryProps {
  onSelectRoute: (id: string) => void;
  activeFilter: string;
  completedIds: string[];
  onGradeFilterChange: (grade: string) => void;
}

export default function Gallery({ onSelectRoute, activeFilter, completedIds, onGradeFilterChange }: GalleryProps) {
  const [routes, setRoutes] = useState<any[]>([]);
  const [snapshots, setSnapshots] = useState<Record<string, string>>({}); 
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: routeData, error: routeError } = await supabase
        .from('routes')
        .select('*')
        .eq('is_archived', showArchived);

      if (routeError) throw routeError;

      const { data: snapshotData, error: snapshotError } = await supabase
        .from('wall_snapshots')
        .select('route_id, wall_number, image_url');

      if (snapshotError) throw snapshotError;

      const snapshotMap: Record<string, string> = {};
      snapshotData?.forEach(s => {
        snapshotMap[`${s.route_id}-${s.wall_number}`] = s.image_url;
      });

      setRoutes(routeData || []);
      setSnapshots(snapshotMap);
    } catch (err: any) {
      console.error("Sync Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [showArchived]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, routeId: string, wallNumber: number) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploadingId(routeId);
      const fileExt = file.name.split('.').pop();
      const fileName = `route-${routeId}-wall-${wallNumber}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('wall-snapshots')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('wall-snapshots')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('wall_snapshots')
        .upsert({ 
          route_id: routeId, 
          wall_number: wallNumber, 
          image_url: publicUrl,
          updated_at: new Date().toISOString()
        }, { onConflict: 'route_id, wall_number' });

      if (dbError) throw dbError;

      fetchData(); 
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploadingId(null);
    }
  };

  const displayRoutes = useMemo(() => {
    return routes.filter(r => {
      const searchLower = search.toLowerCase();
      // Updated Search Logic: Matches Name OR Setter Name
      const matchesName = r.name.toLowerCase().includes(searchLower);
      const matchesSetter = (r.setter_name || "").toLowerCase().includes(searchLower);
      
      if (!matchesName && !matchesSetter) return false;
      
      if (activeFilter === 'All') return true;
      if (activeFilter === 'Sent') return completedIds.includes(r.id);
      return r.grade.toLowerCase() === activeFilter.toLowerCase();
    });
  }, [routes, search, activeFilter, completedIds]);

  return (
    <div className="p-4 text-white max-w-2xl mx-auto">
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
              showArchived ? 'bg-blue-600 border-blue-400' : 'bg-gray-800 border-white/10'
            }`}
          >
            {showArchived ? 'View Live' : 'View Archive'}
          </button>
        )}
      </div>

      <div className="relative mb-8">
        <input 
          placeholder="Search by name or setter..." 
          className="w-full p-4 pl-12 rounded-[1.5rem] bg-gray-900 border border-white/5 text-sm font-bold focus:outline-none focus:border-blue-500/50 transition-all" 
          onChange={(e) => setSearch(e.target.value)} 
        />
        <span className="absolute left-5 top-1/2 -translate-y-1/2 opacity-30 text-lg">🔍</span>
      </div>
      
      <div className="grid gap-3">
        {loading ? (
          <div className="py-10 text-center animate-pulse text-gray-600 font-black uppercase text-xs tracking-widest">Syncing Database...</div>
        ) : (
          displayRoutes.map((r) => {
            const isSent = completedIds.includes(r.id);
            const isUploading = uploadingId === r.id;
            const photoUrl = snapshots[`${r.id}-${r.wall_number}`] || `/wall${r.wall_number}.jpg`;

            return (
              <div 
                key={r.id} 
                className={`group bg-gray-900/40 p-4 rounded-[2.5rem] flex justify-between items-center border transition-all duration-300 ${
                  isSent ? 'border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.05)]' : 'border-white/5 hover:border-blue-500/30'
                }`}
              >
                <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => onSelectRoute(r.id)}>
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-black border border-white/10 shrink-0 relative shadow-inner">
                    <img 
                      src={photoUrl} 
                      className={`w-full h-full object-cover transition-opacity duration-500 ${isUploading ? 'opacity-20' : 'opacity-100'}`} 
                      alt={r.name} 
                    />
                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-lg uppercase leading-tight tracking-tight truncate">{r.name}</h3>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-gray-500 font-black tracking-widest uppercase">
                        SET BY {r.setter_name || 'THE GROTTO'}
                      </span>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] text-blue-500 font-black tracking-widest uppercase">
                          Wall {r.wall_number} • {r.grade}
                        </span>
                        {isSent && <span className="text-[8px] bg-green-900/30 text-green-500 px-1.5 py-0.5 rounded font-black uppercase">Sent</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isSetter && (
                    <label className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-blue-600/20 hover:border-blue-500/50 transition-all active:scale-90">
                      <span className="text-sm">📸</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        className="hidden" 
                        onChange={(e) => handleUpload(e, r.id, r.wall_number)}
                        disabled={!!uploadingId}
                      />
                    </label>
                  )}
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-600 transition-all cursor-pointer" onClick={() => onSelectRoute(r.id)}>
                    <span className="text-white text-xs">→</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}