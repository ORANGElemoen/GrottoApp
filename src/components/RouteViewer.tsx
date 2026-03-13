'use client';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { supabase } from '../lib/supabase';

const ROUTE_LEGEND = [
  { type: 'start', label: 'Start', color: '#16a34a' },
  { type: 'hold', label: 'Hold', color: '#dc2626' },
  { type: 'foot', label: 'Foot', color: '#eab308' },
  { type: 'top', label: 'Top', color: '#2563eb' },
];

export default function RouteViewer({ routeId, onBack }: { routeId: string; onBack: () => void }) {
  const [markers, setMarkers] = useState<any[]>([]);
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isSetter, setIsSetter] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedType, setSelectedType] = useState('hold');

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

  // --- DYNAMIC WALL ORDER LOGIC ---
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

  const updateRouteName = async (newName: string) => {
    setRoute({ ...route, name: newName });
    await supabase.from('routes').update({ name: newName }).eq('id', routeId);
  };

  const updateRouteGrade = async (newGrade: string) => {
    setRoute({ ...route, grade: newGrade });
    await supabase.from('routes').update({ grade: newGrade }).eq('id', routeId);
  };

  const handleAddMarker = async (e: React.MouseEvent<HTMLDivElement>, wallId: number) => {
    if (!editMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newMarker = {
      route_id: routeId,
      wall_id: wallId,
      x,
      y,
      type: selectedType,
      radius: 2.5,
    };

    const { data } = await supabase.from('markers').insert([newMarker]).select();
    if (data) setMarkers([...markers, data[0]]);
  };

  const handleDeleteMarker = async (e: React.MouseEvent, markerId: string) => {
    if (!editMode) return;
    e.stopPropagation();
    const { error } = await supabase.from('markers').delete().eq('id', markerId);
    if (!error) setMarkers(markers.filter((m) => m.id !== markerId));
  };

  if (loading) return <div className="text-white p-4 text-center font-bold tracking-widest animate-pulse">Loading Route...</div>;

  return (
    <div className="w-full flex flex-col items-center p-4 pb-32">
      {/* Navigation & Action Controls */}
      <div className="fixed top-4 left-4 right-4 flex justify-between items-center z-50">
        <button 
          onClick={onBack} 
          className="bg-gray-800/90 backdrop-blur text-white px-5 py-2 rounded-xl shadow-lg hover:bg-gray-700 transition-all active:scale-95"
        >
          ← Back
        </button>
        {isSetter && (
          <button 
            onClick={() => setEditMode(!editMode)} 
            className={`${editMode ? 'bg-green-600' : 'bg-blue-600'} text-white px-5 py-2 rounded-xl shadow-lg font-bold transition-all hover:scale-105 active:scale-95`}
          >
            {editMode ? 'Finish Editing' : 'Edit Route'}
          </button>
        )}
      </div>

      {/* Title & Grade Header */}
      <div className="text-center mt-16 mb-6 w-full max-w-md">
        {editMode ? (
          <div className="flex flex-col gap-2 px-4">
            <input type="text" value={route?.name || ''} onChange={(e) => updateRouteName(e.target.value)} className="bg-gray-900 text-white text-3xl font-black text-center rounded-xl border border-blue-500/50 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            <input type="text" value={route?.grade || ''} onChange={(e) => updateRouteGrade(e.target.value)} className="bg-gray-900 text-blue-400 text-xl font-bold text-center rounded-xl border border-blue-500/50 p-1 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
        ) : (
          <>
            <h2 className="text-white text-4xl font-black tracking-tighter">{route?.name}</h2>
            <span className="text-blue-500 text-2xl font-bold tracking-widest uppercase">{route?.grade}</span>
          </>
        )}
      </div>

      {/* --- ROUTE LEGEND (Only visible in View Mode) --- */}
      {!editMode && (
        <div className="flex flex-wrap justify-center gap-6 p-4 bg-gray-900/60 rounded-2xl mb-10 border border-white/10 w-full max-w-md backdrop-blur-md">
          {ROUTE_LEGEND.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)]" style={{ backgroundColor: item.color }} />
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Setter Toolbox */}
      {editMode && (
        <div className="fixed bottom-6 z-50 bg-gray-900/95 backdrop-blur border border-blue-500 p-4 rounded-3xl shadow-2xl flex flex-col items-center gap-3 w-[92%] max-w-sm animate-in slide-in-from-bottom-5 duration-500">
          <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em]">Select Marker Type</p>
          <div className="flex justify-around w-full">
            {ROUTE_LEGEND.map((item) => (
              <button 
                key={item.type} 
                onClick={() => setSelectedType(item.type)} 
                className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${selectedType === item.type ? 'bg-white/10 ring-2 ring-white/20 scale-110 shadow-xl' : 'opacity-40 grayscale'}`}
              >
                <div className="w-8 h-8 rounded-full border-2 border-white shadow-lg" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] text-white font-black">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Walls Rendering */}
      {(editMode ? [1, 2, 3, 4, 5, 6, 7] : wallSequence).map((wallId) => (
        <div key={wallId} className="mb-14 w-full max-w-md flex flex-col items-center px-2">
          {/* Readable Wall Header with accent line */}
          <h3 className="text-white/70 text-[10px] font-black mb-3 self-start ml-4 uppercase tracking-[0.4em] border-l-2 border-blue-600 pl-3">
            Section {wallId}
          </h3>
          
          <div 
            onClick={(e) => handleAddMarker(e, wallId)}
            className={`relative w-full rounded-[2.5rem] overflow-hidden border-2 shadow-2xl transition-all duration-300 bg-black ${
              editMode ? 'border-blue-500/50 shadow-blue-500/20 cursor-crosshair' : 'border-white/5'
            }`}
          >
            <img 
              src={`/wall${wallId}.jpg`} 
              alt={`Wall ${wallId}`} 
              className="w-full h-auto block pointer-events-none opacity-90" 
            />
            
            {markers.filter(m => m.wall_id === wallId).map((m) => (
              <div 
                key={m.id} 
                onClick={(e) => handleDeleteMarker(e, m.id)}
                className={`absolute rounded-full border-2 border-white/90 shadow-lg transition-all ${
                  editMode ? 'hover:scale-150 cursor-pointer ring-4 ring-red-500/40 animate-pulse' : 'scale-100'
                }`}
                style={{ 
                  left: `${m.x}%`, 
                  top: `${m.y}%`, 
                  width: `${m.radius * 2}%`, 
                  height: 'auto',
                  aspectRatio: '1/1',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: m.type === 'start' ? '#16a34a' : m.type === 'foot' ? '#eab308' : m.type === 'hold' ? '#dc2626' : '#2563eb',
                  opacity: 0.95,
                  zIndex: 10
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}