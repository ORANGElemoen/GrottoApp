'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '../lib/supabase';

export default function RouteViewer({ routeId, onBack }: { routeId: string; onBack: () => void }) {
  const [markers, setMarkers] = useState<any[]>([]);
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: routeData } = await supabase.from('routes').select('*').eq('id', routeId).single();
      setRoute(routeData);

      const { data: markerData } = await supabase.from('markers').select('*').eq('route_id', routeId);
      setMarkers(markerData || []);
      setLoading(false);
    }
    fetchData();
  }, [routeId]);

  // Get a list of unique wall IDs used in this route
  const uniqueWalls = Array.from(new Set(markers.map((m) => m.wall_id))).sort();

  if (loading) return <div className="text-white p-4">Loading route...</div>;

  return (
    <div className="w-full flex flex-col items-center p-4">
      <button onClick={onBack} className="fixed top-4 left-4 bg-gray-700 text-white p-2 rounded z-50">← Back</button>
      <h2 className="text-white text-2xl font-bold mb-4">{route?.name} ({route?.grade})</h2>
      
      {uniqueWalls.map((wallId) => (
        <div key={wallId} className="mb-8 w-full max-w-md">
          <h3 className="text-white text-xl mb-2">Wall {wallId}</h3>
          <div className="relative w-full h-[50vh]">
            <Image src={`/wall${wallId}.jpg`} alt={`Wall ${wallId}`} fill className="object-contain" />
            {markers.filter(m => m.wall_id === wallId).map((m, i) => (
              <div key={i} className="absolute rounded-full border-2 border-white opacity-80"
                style={{ 
                  left: `${m.x}%`, top: `${m.y}%`, 
                  width: `${m.radius * 2}%`, height: `${m.radius * 2}%`, 
                  marginLeft: `-${m.radius}%`, marginTop: `-${m.radius}%`, 
                  backgroundColor: m.type === 'start' ? '#16a34a' : m.type === 'foot' ? '#eab308' : m.type === 'hold' ? '#dc2626' : '#2563eb' 
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}