'use client';
import { useState, useEffect } from 'react';
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
  
  // Edit States
  const [isSetter, setIsSetter] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedType, setSelectedType] = useState('hold');

  useEffect(() => {
    // SECURITY: Switched from localStorage to sessionStorage.
    // This ensures editing rights expire as soon as the browser tab is closed.
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

  if (loading) return <div className="text-white p-4 text-center">Loading route...</div>;

  return (
    <div className="w-full flex flex-col items-center p-4 pb-32">
      {/* Navigation & Edit Controls */}
      <div className="fixed top-4 left-4 right-4 flex justify-between items-center z-50">
        <button 
          onClick={onBack} 
          className="bg-gray-800/90 backdrop-blur text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition-colors"
        >
          ← Back
        </button>
        
        {/* Only rendered if isSetter is true in sessionStorage */}
        {isSetter && (
          <button 
            onClick={() => setEditMode(!editMode)}
            className={`${editMode ? 'bg-green-600' : 'bg-blue-600'} text-white px-4 py-2 rounded-lg shadow-lg font-bold transition-all hover:scale-105`}
          >
            {editMode ? 'Finish Editing' : 'Edit Route'}
          </button>
        )}
      </div>

      {/* Header with Title and Grade */}
      <div className="text-center mt-16 mb-6 w-full max-w-md">
        {editMode ? (
          <div className="flex flex-col gap-2 px-4">
            <input 
              type="text" 
              value={route?.name || ''} 
              onChange={(e) => updateRouteName(e.target.value)}
              className="bg-gray-800 text-white text-3xl font-bold text-center rounded border border-blue-500 p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="Route Name"
            />
            <input 
              type="text" 
              value={route?.grade || ''} 
              onChange={(e) => updateRouteGrade(e.target.value)}
              className="bg-gray-800 text-gray-400 text-xl font-medium text-center rounded border border-blue-500 p-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="Grade (e.g. 6B)"
            />
          </div>
        ) : (
          <>
            <h2 className="text-white text-4xl font-bold">{route?.name}</h2>
            <span className="text-blue-400 text-2xl font-semibold tracking-wide uppercase">{route?.grade}</span>
          </>
        )}
      </div>

      {/* Editor Toolbox - ONLY VISIBLE IN EDIT MODE */}
      {editMode && (
        <div className="fixed bottom-6 z-50 bg-gray-900/95 backdrop-blur border border-blue-500 p-4 rounded-2xl shadow-2xl flex flex-col items-center gap-3 w-[90%] max-w-sm">
          <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">Marker Type</p>
          <div className="flex justify-around w-full">
            {ROUTE_LEGEND.map((item) => (
              <button
                key={item.type}
                onClick={() => setSelectedType(item.type)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${selectedType === item.type ? 'bg-white/10 ring-2 ring-white/20 scale-110' : 'opacity-30 grayscale-[50%]'}`}
              >
                <div className="w-8 h-8 rounded-full border-2 border-white shadow-lg" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] text-white font-bold">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Standard Legend - HIDDEN IN EDIT MODE */}
      {!editMode && (
        <div className="flex flex-wrap justify-center gap-6 p-4 bg-gray-900/60 rounded-xl mb-10 border border-white/5 w-full max-w-md">
          {ROUTE_LEGEND.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Walls Rendering */}
      {[1, 2, 3, 4, 5, 6, 7]
        .filter((wallId) => editMode || markers.some((m) => m.wall_id === wallId))
        .map((wallId) => (
          <div key={wallId} className="mb-14 w-full max-w-md">
            <h3 className="text-white/20 text-[10px] font-black mb-2 ml-4 uppercase tracking-[0.3em]">Section {wallId}</h3>
            <div 
              onClick={(e) => handleAddMarker(e, wallId)}
              className={`relative w-full h-[65vh] rounded-[2.5rem] overflow-hidden border-2 shadow-2xl transition-all duration-300 bg-black/40 ${editMode ? 'border-blue-500 shadow-blue-500/20 cursor-crosshair' : 'border-transparent'}`}
            >
              <Image src={`/wall${wallId}.jpg`} alt={`Wall ${wallId}`} fill className="object-contain pointer-events-none" priority />
              {markers.filter(m => m.wall_id === wallId).map((m) => (
                <div 
                  key={m.id} 
                  onClick={(e) => handleDeleteMarker(e, m.id)}
                  className={`absolute rounded-full border-2 border-white/90 shadow-lg transition-all ${editMode ? 'hover:scale-150 cursor-pointer ring-4 ring-red-500/40 animate-pulse' : ''}`}
                  style={{ 
                    left: `${m.x}%`, 
                    top: `${m.y}%`, 
                    width: `${m.radius * 2}%`, 
                    height: `${m.radius * 2}%`, 
                    marginLeft: `-${m.radius}%`, 
                    marginTop: `-${m.radius}%`, 
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