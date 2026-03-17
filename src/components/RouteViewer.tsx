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
    isSent: boolean; // NEW
  };
  onUpdateSettings: (key: string, val: any) => void;
  onToggleSent: () => void; // NEW
}

export default function RouteViewer({ routeId, onBack, settings, onUpdateSettings, onToggleSent }: ViewerProps) {
  const [markers, setMarkers] = useState<any[]>([]);
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSetter, setIsSetter] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedType, setSelectedType] = useState('hold');
  const [showSettings, setShowSettings] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  const accentColor = settings.highContrast ? 'text-orange-500' : 'text-blue-500';
  const accentBg = settings.highContrast ? 'bg-orange-600' : 'bg-blue-600';
  const accentBorder = settings.highContrast ? 'border-orange-500' : 'border-blue-500';

  useEffect(() => {
    const setterStatus = sessionStorage.getItem('isSetter') === 'true';
    setIsSetter(setterStatus);

    async function fetchData() {
      const { data: routeData } = await supabase.from('routes').select('*').eq('id', routeId).single();
      setRoute(routeData);
      const { data: markerData } = await supabase.from('markers').select('*').eq('route_id', routeId);
      setMarkers(markerData || []);
      setLoading(false);
    }
    fetchData();
  }, [routeId]);

  const wallSequence = useMemo(() => {
    if (markers.length === 0) return [1, 2, 3, 4, 5, 6, 7];
    const startMarker = markers.find(m => m.type === 'start');
    const topMarker = markers.find(m => m.type === 'top');
    if (!startMarker || !topMarker) return [1, 2, 3, 4, 5, 6, 7];
    const startWall = startMarker.wall_id;
    const endWall = topMarker.wall_id;
    const sequence = [];
    if (startWall <= endWall) {
      for (let i = startWall; i <= endWall; i++) sequence.push(i);
    } else {
      for (let i = startWall; i >= endWall; i--) sequence.push(i);
    }
    return sequence;
  }, [markers]);

  const handleAddMarker = async (e: React.MouseEvent<HTMLDivElement>, wallId: number) => {
    if (!editMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const newMarker = { route_id: routeId, wall_id: wallId, x, y, type: selectedType, radius: 2.5 };
    const { data } = await supabase.from('markers').insert([newMarker]).select();
    if (data) setMarkers([...markers, data[0]]);
  };

  const handleDeleteMarker = async (e: React.MouseEvent, markerId: string) => {
    if (!editMode) return;
    e.stopPropagation();
    const { error } = await supabase.from('markers').delete().eq('id', markerId);
    if (!error) setMarkers(markers.filter((m) => m.id !== markerId));
  };

  if (loading) return <div className="text-white p-4 text-center font-bold animate-pulse uppercase">Syncing Route Data...</div>;

  return (
    <div className="w-full flex flex-col items-center p-4 pb-32">
      
      {/* Settings Overlay */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-white/10 p-6 rounded-[2.5rem] w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-black uppercase text-xs tracking-[0.3em]">View Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-500 font-bold">✕</button>
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-2xl">
                <p className="text-white text-[10px] font-bold uppercase">High Contrast</p>
                <button 
                  onClick={() => onUpdateSettings('highContrast', !settings.highContrast)}
                  className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${settings.highContrast ? 'bg-orange-500' : 'bg-gray-700'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-all ${settings.highContrast ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex justify-between items-center p-3 bg-white/5 rounded-2xl">
                <p className="text-white text-[10px] font-bold uppercase">Focus Mode</p>
                <button 
                  onClick={() => setFocusMode(!focusMode)}
                  className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${focusMode ? 'bg-green-600' : 'bg-gray-700'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-all ${focusMode ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div>
                <p className="text-gray-500 text-[10px] font-bold uppercase mb-3">Marker Style</p>
                <div className="flex bg-black p-1 rounded-2xl border border-white/5">
                  {['solid', 'translucent', 'outline'].map((s) => (
                    <button 
                      key={s} 
                      onClick={() => onUpdateSettings('markerStyle', s)}
                      className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-xl transition-all ${settings.markerStyle === s ? `${accentBg} text-white` : 'text-gray-600'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-gray-500 text-[10px] font-bold uppercase mb-3 flex justify-between">
                  Size <span>{Math.round(settings.markerSize * 100)}%</span>
                </p>
                <input 
                  type="range" min="0.5" max="2.0" step="0.1" 
                  value={settings.markerSize} 
                  onChange={(e) => onUpdateSettings('markerSize', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="fixed top-4 left-4 right-4 flex justify-between items-center z-50">
        <button onClick={onBack} className="bg-gray-800/90 backdrop-blur text-white px-5 py-2 rounded-xl shadow-lg active:scale-95">← Back</button>
        <div className="flex gap-2">
          <button onClick={() => setShowSettings(true)} className="bg-gray-800/90 backdrop-blur text-white p-2 rounded-xl shadow-lg border border-white/5">⚙️</button>
          {isSetter && (
            <button onClick={() => setEditMode(!editMode)} className={`${editMode ? 'bg-green-600' : accentBg} text-white px-5 py-2 rounded-xl shadow-lg font-bold transition-all`}>
              {editMode ? 'Finish' : 'Edit'}
            </button>
          )}
        </div>
      </div>

      {/* Header Info */}
      <div className="text-center mt-16 mb-6 w-full max-w-md px-4">
        <h2 className="text-white text-4xl font-black uppercase tracking-tighter leading-tight">{route?.name}</h2>
        {!focusMode && <span className={`${accentColor} text-2xl font-bold tracking-widest uppercase`}>{route?.grade}</span>}
      </div>

      {/* NEW: THE "SENT IT" TOGGLE BUTTON */}
      {!editMode && (
        <div className="flex flex-col items-center gap-2 mb-10 animate-in fade-in zoom-in duration-500">
          <button 
            onClick={onToggleSent}
            className={`flex items-center gap-3 px-10 py-4 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.25em] transition-all active:scale-90 ${
              settings.isSent 
                ? 'bg-green-600 text-white shadow-[0_0_40px_rgba(22,163,74,0.4)] ring-4 ring-green-500/20' 
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            {settings.isSent ? (
              <><span className="text-lg">✓</span> ROUTE SENT</>
            ) : (
              'MARK AS SENT'
            )}
          </button>
          {settings.isSent && (
            <p className="text-green-500 text-[8px] font-black uppercase tracking-widest animate-pulse">
              Added to your tick list
            </p>
          )}
        </div>
      )}

      {/* Legend */}
      {settings.showLegend && !editMode && !focusMode && (
        <div className="flex flex-wrap justify-center gap-6 p-4 bg-gray-900/60 rounded-2xl mb-10 border border-white/10 w-full max-w-md backdrop-blur-md">
          {ROUTE_LEGEND.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Image Sections */}
      {(editMode ? [1, 2, 3, 4, 5, 6, 7] : wallSequence).map((wallId) => (
        <div key={wallId} className="mb-14 w-full max-w-md flex flex-col items-center px-2">
          <h3 className={`text-white/70 text-[10px] font-black mb-3 self-start ml-4 uppercase tracking-[0.4em] border-l-2 ${accentBorder} pl-3`}>Section {wallId}</h3>
          <div onClick={(e) => handleAddMarker(e, wallId)} className={`relative w-full rounded-[2.5rem] overflow-hidden border-2 shadow-2xl transition-all duration-300 bg-black ${editMode ? accentBorder : 'border-white/5'}`}>
            <img src={`/wall${wallId}.jpg`} alt={`Wall ${wallId}`} className="w-full h-auto block pointer-events-none opacity-90" />
            {markers.filter(m => m.wall_id === wallId).map((m) => {
              const markerColor = m.type === 'start' ? '#16a34a' : m.type === 'foot' ? '#eab308' : m.type === 'hold' ? '#dc2626' : '#2563eb';
              
              return (
                <div 
                  key={m.id} 
                  onClick={(e) => handleDeleteMarker(e, m.id)} 
                  className={`absolute rounded-full shadow-lg transition-all ${editMode ? 'ring-4 ring-red-500/40 animate-pulse' : ''}`}
                  style={{ 
                    left: `${m.x}%`, 
                    top: `${m.y}%`, 
                    width: `${m.radius * 2 * settings.markerSize}%`, 
                    aspectRatio: '1/1', 
                    transform: 'translate(-50%, -50%)', 
                    backgroundColor: settings.markerStyle === 'outline' && !editMode ? 'transparent' : markerColor,
                    border: settings.highContrast ? `5px solid white` : (settings.markerStyle === 'outline' ? `4px solid ${markerColor}` : '2px solid white'),
                    opacity: editMode ? 0.6 : (settings.markerStyle === 'translucent' ? 0.5 : 0.95),
                    zIndex: 10 
                  }} 
                />
              );
            })}
          </div>
        </div>
      ))}

      {!editMode && !focusMode && <RouteComments routeId={routeId} />}
    </div>
  );
}