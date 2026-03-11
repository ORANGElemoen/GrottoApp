'use client';
import { useState, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import { supabase } from '../lib/supabase';

export default function ClimbingCarousel() {
  const [emblaRef] = useEmblaCarousel({ loop: true });
  const wallNumbers = [7, 6, 5, 4, 3, 2, 1];

  const [isEditing, setIsEditing] = useState(false);
  const [markers, setMarkers] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<'start' | 'foot' | 'hold' | 'top'>('hold');
  const [routeName, setRouteName] = useState("");
  const [grade, setGrade] = useState("");
  const [toolMode, setToolMode] = useState<'place' | 'delete'>('place');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => { 
    if (!isEditing) { setMarkers([]); setRouteName(""); setGrade(""); setToolMode('place'); } 
  }, [isEditing]);

  const undoLast = () => setMarkers(markers.slice(0, -1));

  const saveRoute = async () => {
    if (!routeName || !grade) return alert("Please enter name and grade");
    
    // 1. Save route header
    const { data: route, error: routeError } = await supabase
      .from('routes')
      .insert([{ name: routeName, wall_number: 1, grade: grade }])
      .select().single();

    if (routeError) {
      console.error("FULL ROUTE ERROR:", JSON.stringify(routeError, null, 2));
      return;
    }

    // 2. Save markers
    const { error: markerError } = await supabase
      .from('markers')
      .insert(markers.map(m => ({ 
        route_id: route.id, 
        wall_id: m.wallId,
        x: m.x, 
        y: m.y, 
        radius: m.radius, 
        type: m.type 
      })));

    if (markerError) {
      // THIS WILL REVEAL THE TRUTH
      console.error("FULL MARKER ERROR:", JSON.stringify(markerError, null, 2));
    } else {
      alert("Route Saved!"); 
      setIsEditing(false); 
    }
  };

  // RESTORED INTERACTION LOGIC
  const startDrag = (e: React.MouseEvent, wallNum: number) => {
    if (!isEditing || toolMode !== 'place') return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragStart({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
    setIsDragging(true);
  };

  const endDrag = (e: React.MouseEvent, wallNum: number) => {
    if (!isDragging) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const endX = ((e.clientX - rect.left) / rect.width) * 100;
    const endY = ((e.clientY - rect.top) / rect.height) * 100;
    const radius = Math.sqrt(Math.pow(endX - dragStart.x, 2) + Math.pow(endY - dragStart.y, 2));
    setMarkers([...markers, { ...dragStart, radius: Math.max(radius, 2), type: selectedType, wallId: wallNum }]);
    setIsDragging(false);
  };

  return (
    <div className="w-full flex flex-col items-center p-4">
      <button onClick={() => setIsEditing(!isEditing)} className="fixed bottom-4 right-4 bg-white text-black p-4 rounded-full shadow-lg z-50 font-bold">{isEditing ? '✕' : '+'}</button>
      {isEditing && (
        <div className="bg-gray-800 p-4 rounded-lg w-full max-w-md mb-4 text-white space-y-3">
          <input type="text" placeholder="Route Name" value={routeName} className="w-full p-2 rounded text-white" onChange={(e) => setRouteName(e.target.value)} />
          <input type="text" placeholder="Grade (e.g., 5a)" value={grade} className="w-full p-2 rounded text-white" onChange={(e) => setGrade(e.target.value)} />
          <div className="flex gap-2">
            {(['start', 'foot', 'hold', 'top'] as const).map(t => (
              <button key={t} onClick={() => setSelectedType(t)} className={`p-2 flex-1 rounded capitalize ${selectedType === t ? 'ring-2 ring-white' : ''} ${t === 'start' ? 'bg-green-600' : t === 'foot' ? 'bg-yellow-500' : t === 'hold' ? 'bg-red-600' : 'bg-blue-600'}`}>{t}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setToolMode('place')} className={`flex-1 p-2 rounded ${toolMode === 'place' ? 'bg-white text-black' : 'bg-gray-600'}`}>Place</button>
            <button onClick={() => setToolMode('delete')} className={`flex-1 p-2 rounded ${toolMode === 'delete' ? 'bg-white text-black' : 'bg-gray-600'}`}>Delete</button>
            <button onClick={undoLast} className="flex-1 p-2 rounded bg-gray-600">Undo</button>
            <button onClick={saveRoute} className="flex-1 p-2 rounded bg-green-700 font-bold">Save</button>
          </div>
        </div>
      )}
      <div className="overflow-hidden w-full max-w-md" ref={emblaRef}>
        <div className="flex">
          {wallNumbers.map((num) => (
            <div key={num} className="flex-[0_0_100%] min-w-0 flex flex-col items-center">
              <h2 className="text-white text-2xl font-bold mb-4">Wall {num}</h2>
              {/* RESTORED EVENT HANDLERS */}
              <div className="relative w-full h-[50vh] cursor-crosshair" onMouseDown={(e) => startDrag(e, num)} onMouseUp={(e) => endDrag(e, num)}>
                <Image src={`/wall${num}.jpg`} alt={`Wall ${num}`} fill className="object-contain" />
                {markers.filter((m) => m.wallId === num).map((m, i) => (
                  <div key={i} onClick={() => toolMode === 'delete' && setMarkers(markers.filter((_, idx) => idx !== markers.indexOf(m)))}
                    className="absolute rounded-full border-2 border-white shadow-lg opacity-70 cursor-pointer"
                    style={{ left: `${m.x}%`, top: `${m.y}%`, width: `${m.radius * 2}%`, height: `${m.radius * 2}%`, marginLeft: `-${m.radius}%`, marginTop: `-${m.radius}%`, backgroundColor: m.type === 'start' ? '#16a34a' : m.type === 'foot' ? '#eab308' : m.type === 'hold' ? '#dc2626' : '#2563eb' }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}