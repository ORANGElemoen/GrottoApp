'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import RouteComments from './Comments';

const ROUTE_LEGEND = [
  { type: 'start', label: 'Start', color: '#16a34a' },
  { type: 'hold', label: 'Hold', color: '#dc2626' },
  { type: 'foot', label: 'Foot', color: '#eab308' },
  { type: 'top', label: 'Top', color: '#2563eb' },
];

interface ViewerProps {
  routeId: string;
  onBack: () => void;
  settings: { 
    markerStyle: string; 
    markerSize: number; 
    showLegend: boolean; 
    highContrast: boolean;
    isSent: boolean; 
  };
  onUpdateSettings: (key: string, val: any) => void;
  onToggleSent: () => void; 
}

export default function RouteViewer({ routeId, onBack, settings, onUpdateSettings, onToggleSent }: ViewerProps) {
  const [markers, setMarkers] = useState<any[]>([]);
  const [route, setRoute] = useState<any>(null);
  const [snapshots, setSnapshots] = useState<Record<number, string>>({}); 
  const [loading, setLoading] = useState(true);
  const [isSetter, setIsSetter] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedType, setSelectedType] = useState('hold');
  const [showSettings, setShowSettings] = useState(false);
  const [isUploading, setIsUploading] = useState<number | null>(null);

  const [editName, setEditName] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editSetter, setEditSetter] = useState(''); // State for Setter updates

  const accentColor = settings.highContrast ? 'text-orange-500' : 'text-blue-500';
  const accentBg = settings.highContrast ? 'bg-orange-600' : 'bg-blue-600';

  const fetchData = async () => {
    try {
      const { data: routeData } = await supabase.from('routes').select('*').eq('id', routeId).single();
      if (routeData) {
        setRoute(routeData);
        setEditName(routeData.name);
        setEditGrade(routeData.grade);
        setEditSetter(routeData.setter_name || ''); // Populate Setter from DB
      }

      const { data: markerData } = await supabase.from('markers').select('*').eq('route_id', routeId);
      setMarkers(markerData || []);

      const { data: snapshotData } = await supabase
        .from('wall_snapshots')
        .select('wall_number, image_url')
        .eq('route_id', routeId);

      const snapshotMap: Record<number, string> = {};
      snapshotData?.forEach(s => {
        snapshotMap[s.wall_number] = s.image_url;
      });
      setSnapshots(snapshotMap);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const setterStatus = sessionStorage.getItem('isSetter') === 'true';
    setIsSetter(setterStatus);
    fetchData();
  }, [routeId]);

  const handleWallUpload = async (event: React.ChangeEvent<HTMLInputElement>, wallId: number) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsUploading(wallId);
      const fileExt = file.name.split('.').pop();
      const fileName = `route-${routeId}-wall-${wallId}-${Date.now()}.${fileExt}`;

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
          wall_number: wallId, 
          image_url: publicUrl,
          updated_at: new Date().toISOString()
        }, { onConflict: 'route_id, wall_number' });

      if (dbError) throw dbError;

      fetchData(); 
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setIsUploading(null);
    }
  };

  const saveRouteDetails = async () => {
    const { error } = await supabase
      .from('routes')
      .update({ 
        name: editName, 
        grade: editGrade, 
        setter_name: editSetter // Persist Setter Name changes
      })
      .eq('id', routeId);

    if (!error) {
      setRoute({ ...route, name: editName, grade: editGrade, setter_name: editSetter });
      setEditMode(false);
    }
  };

  const toggleArchive = async () => {
    if (!route) return;
    const newStatus = !route.is_archived;
    const { error } = await supabase
      .from('routes')
      .update({ is_archived: newStatus })
      .eq('id', routeId);

    if (!error) {
      setRoute({ ...route, is_archived: newStatus });
    }
  };

  const wallSequence = useMemo(() => {
    if (markers.length === 0) return [route?.wall_number || 1];
    const startMarkers = markers.filter(m => m.type === 'start');
    const topMarkers = markers.filter(m => m.type === 'top');

    const startWall = startMarkers.length > 0 
      ? Math.min(...startMarkers.map(m => Number(m.wall_id))) 
      : Math.min(...markers.map(m => Number(m.wall_id)));

    let endWall: number;
    if (topMarkers.length > 0) {
      const isDescending = startMarkers.length > 0 && startWall > Math.max(...topMarkers.map(m => Number(m.wall_id)));
      endWall = isDescending 
        ? Math.min(...topMarkers.map(m => Number(m.wall_id))) 
        : Math.max(...topMarkers.map(m => Number(m.wall_id)));
    } else {
      const allWallIds = markers.map(m => Number(m.wall_id));
      const minWall = Math.min(...allWallIds);
      const maxWall = Math.max(...allWallIds);
      endWall = Math.abs(startWall - minWall) > Math.abs(startWall - maxWall) ? minWall : maxWall;
    }

    const sequence = [];
    const step = startWall <= endWall ? 1 : -1;
    let current = startWall;
    while (true) {
      sequence.push(current);
      if (current === endWall) break;
      current += step;
    }
    return sequence;
  }, [markers, route]);

  const handleAddMarker = async (e: React.MouseEvent<HTMLDivElement>, wallId: number) => {
    if (!editMode) return;
    if ((e.target as HTMLElement).closest('.marker-item')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const { data, error } = await supabase.from('markers').insert([{ 
      route_id: routeId, 
      wall_id: wallId, 
      x: x, 
      y: y, 
      type: selectedType, 
      radius: 2.5 
    }]).select();
    
    if (data) {
        setMarkers(prev => [...prev, data[0]]);
    } else if (error) {
        console.error("Marker insertion failed!", error);
    }
  };

  const handleDeleteMarker = async (e: React.MouseEvent, markerId: string) => {
    if (!editMode) return;
    e.stopPropagation();
    const { error } = await supabase.from('markers').delete().eq('id', markerId);
    if (!error) {
        setMarkers(prev => prev.filter((m) => m.id !== markerId));
    }
  };

  if (loading) return <div className="text-white p-20 text-center font-black animate-pulse uppercase tracking-[0.3em]">Syncing Route...</div>;

  return (
    <div className="w-full flex flex-col items-center p-4 pb-32 bg-black min-h-screen text-white">
      
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
            <div className="bg-gray-900 border border-white/10 p-8 rounded-[3rem] w-full max-w-sm shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-white font-black uppercase text-[10px] tracking-[0.4em]">Preferences</h3>
                    <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-white transition-colors">✕</button>
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-white text-[10px] font-black uppercase tracking-widest">High Contrast</p>
                        <button onClick={() => onUpdateSettings('highContrast', !settings.highContrast)} className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${settings.highContrast ? 'bg-orange-500' : 'bg-gray-700'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${settings.highContrast ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-white text-[10px] font-black uppercase tracking-widest mb-4">Marker Size</p>
                        <input type="range" min="0.5" max="2.5" step="0.1" value={settings.markerSize} onChange={(e) => onUpdateSettings('markerSize', parseFloat(e.target.value))} className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                    </div>
                </div>
            </div>
        </div>
      )}

      <div className="fixed top-6 left-6 right-6 flex justify-between items-center z-50 pointer-events-none">
        <button onClick={onBack} className="pointer-events-auto bg-gray-900/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">← Back</button>
        <div className="flex gap-2 pointer-events-auto">
          <button onClick={() => setShowSettings(true)} className="bg-gray-900/90 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-white/10 active:rotate-90 transition-all">⚙️</button>
          {isSetter && (
            <button 
              onClick={() => editMode ? saveRouteDetails() : setEditMode(true)} 
              className={`${editMode ? 'bg-green-600' : accentBg} text-white px-6 py-3 rounded-2xl shadow-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95`}
            >
              {editMode ? 'Save' : 'Edit'}
            </button>
          )}
        </div>
      </div>

      <div className="text-center mt-24 mb-6 w-full max-w-md px-6">
        {editMode ? (
          <div className="flex flex-col gap-4">
            <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Route Name" className="bg-white/5 border-b-2 border-white/10 p-2 text-white text-4xl font-black uppercase text-center focus:border-blue-500 outline-none transition-all" />
            <input value={editSetter} onChange={(e) => setEditSetter(e.target.value)} placeholder="Setter Name" className="bg-white/5 border-b-2 border-white/10 p-1 text-gray-400 text-sm font-black uppercase text-center focus:border-blue-500 outline-none transition-all" />
            <input value={editGrade} onChange={(e) => setEditGrade(e.target.value)} placeholder="Grade (e.g. 6B)" className={`bg-white/5 border-b-2 border-white/10 p-2 ${accentColor} text-2xl font-black uppercase text-center focus:border-blue-500 outline-none transition-all`} />
          </div>
        ) : (
          <>
            <h2 className="text-white text-5xl font-black uppercase tracking-tighter leading-none mb-2">{route?.name}</h2>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] mb-4">Set by {route?.setter_name || 'The Grotto'}</p>
            <div className="inline-block px-4 py-1 rounded-full bg-white/5 border border-white/10">
              <span className={`${accentColor} text-sm font-black tracking-[0.3em] uppercase`}>{route?.grade}</span>
            </div>
          </>
        )}
      </div>

      {isSetter && (
          <button onClick={toggleArchive} className={`mb-8 px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${route?.is_archived ? 'bg-red-600 border-red-400 text-white animate-pulse' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}>
            {route?.is_archived ? '● Archived' : '○ Archive Route'}
          </button>
      )}

      {!editMode && (
        <button onClick={onToggleSent} className={`mb-16 px-12 py-5 rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.3em] transition-all duration-500 active:scale-95 ${settings.isSent ? 'bg-green-600 text-white shadow-[0_0_30px_rgba(22,163,74,0.3)]' : 'bg-white/5 text-gray-500 border border-white/10 hover:border-white/20'}`}>
            {settings.isSent ? '✓ COMPLETED' : 'MARK AS COMPLETED'}
        </button>
      )}

      {editMode && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex gap-4 bg-gray-900/95 p-4 rounded-3xl border border-white/10 backdrop-blur-xl z-[60] shadow-2xl">
          {ROUTE_LEGEND.map((t) => (
            <button key={t.type} onClick={() => setSelectedType(t.type)} className={`flex flex-col items-center gap-2 p-2 rounded-2xl transition-all ${selectedType === t.type ? 'bg-white/10 ring-1 ring-white/20' : 'opacity-30'}`}>
              <div className="w-6 h-6 rounded-full shadow-inner" style={{ backgroundColor: t.color }} />
              <span className="text-[7px] font-black uppercase text-white tracking-tighter">{t.label}</span>
            </button>
          ))}
        </div>
      )}

      {(editMode ? [1, 2, 3, 4, 5, 6, 7] : wallSequence).map((wallId) => (
        <div key={wallId} className="mb-2 w-full max-w-md flex flex-col items-center">
          <div className="w-full flex justify-between items-center px-6 mb-4">
            <h3 className="text-white/40 text-[9px] font-black uppercase tracking-[0.5em]">Section {wallId}</h3>
            {editMode && (
              <label className="text-[9px] font-black text-blue-500 uppercase tracking-widest cursor-pointer hover:text-white bg-blue-500/10 px-3 py-1.5 rounded-full transition-all active:scale-90">
                {isUploading === wallId ? 'Uploading...' : '📸 Swap Photo'}
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleWallUpload(e, wallId)} disabled={!!isUploading} />
              </label>
            )}
          </div>

          <div 
            onClick={(e) => handleAddMarker(e, wallId)} 
            className={`relative w-full overflow-hidden transition-all duration-500 bg-zinc-950 cursor-crosshair ${editMode ? 'ring-2 ring-blue-500 ring-offset-4 ring-offset-black rounded-[2.5rem] mb-12' : 'border-y border-white/5'}`}
          >
            <img 
              src={snapshots[wallId] || `/wall${wallId}.jpg`} 
              alt={`Wall ${wallId}`} 
              className={`w-full h-auto block pointer-events-none transition-opacity duration-700 ${isUploading === wallId ? 'opacity-20' : 'opacity-100'}`} 
            />
            
            {markers.filter(m => Number(m.wall_id) === wallId).map((m) => {
              const markerColor = ROUTE_LEGEND.find(l => l.type === m.type)?.color || '#fff';
              const xPos = m.x ?? m.x_position; 
              const yPos = m.y ?? m.y_position;

              return (
                <div 
                  key={m.id} 
                  onClick={(e) => handleDeleteMarker(e, m.id)} 
                  className="marker-item absolute rounded-full transition-all"
                  style={{ 
                    left: `${xPos}%`, 
                    top: `${yPos}%`, 
                    width: `${m.radius * 2 * settings.markerSize}%`, 
                    aspectRatio: '1/1', 
                    transform: 'translate(-50%, -50%)', 
                    backgroundColor: settings.markerStyle === 'outline' && !editMode ? 'transparent' : markerColor,
                    border: settings.highContrast ? `4px solid white` : (settings.markerStyle === 'outline' ? `3px solid ${markerColor}` : '2px solid rgba(255,255,255,0.8)'),
                    opacity: editMode ? 0.8 : (settings.markerStyle === 'translucent' ? 0.5 : 0.95),
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    zIndex: 10,
                    cursor: editMode ? 'pointer' : 'default'
                  }} 
                />
              );
            })}
          </div>
        </div>
      ))}

      {!editMode && (
        <div className="w-full max-w-md mt-10">
          <RouteComments routeId={routeId} />
        </div>
      )}
    </div>
  );
}