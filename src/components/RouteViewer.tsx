'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '../lib/supabase';

// Legend data defined outside to keep the component clean
const ROUTE_LEGEND = [
  { label: 'Start', color: '#16a34a' }, // Green
  { label: 'Hold', color: '#dc2626' },  // Red
  { label: 'Foot', color: '#eab308' },  // Yellow
  { label: 'Top', color: '#2563eb' },   // Blue
];

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
      {/* Back Button */}
      <button onClick={onBack} className="fixed top-4 left-4 bg-gray-700 text-white p-2 rounded z-50 shadow-md hover:bg-gray-600 transition-colors">
        ← Back
      </button>

      {/* Header with Title and Grade */}
      <div className="text-center mb-2">
        <h2 className="text-white text-3xl font-bold">{route?.name}</h2>
        <span className="text-gray-400 text-xl font-medium">{route?.grade}</span>
      </div>

      {/* Color Legend Section */}
      <div className="flex flex-wrap justify-center gap-6 p-3 bg-gray-900/60 rounded-xl mb-8 border border-white/10 w-full max-w-md shadow-lg">
        {ROUTE_LEGEND.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)] border border-white/20" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Walls Rendering */}
      {uniqueWalls.map((wallId) => (
        <div key={wallId} className="mb-12 w-full max-w-md">
          <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="text-white text-xl font-semibold">Wall {wallId}</h3>
          </div>
          
          <div className="relative w-full h-[60vh] rounded-2xl overflow-hidden border border-white/5 shadow-2xl bg-black/20">
            <Image 
              src={`/wall${wallId}.jpg`} 
              alt={`Wall ${wallId}`} 
              fill 
              className="object-contain" 
              priority
            />
            
            {/* Markers Logic */}
            {markers.filter(m => m.wall_id === wallId).map((m, i) => (
              <div key={i} className="absolute rounded-full border-2 border-white/90 shadow-lg"
                style={{ 
                  left: `${m.x}%`, 
                  top: `${m.y}%`, 
                  width: `${m.radius * 2}%`, 
                  height: `${m.radius * 2}%`, 
                  marginLeft: `-${m.radius}%`, 
                  marginTop: `-${m.radius}%`, 
                  backgroundColor: m.type === 'start' ? '#16a34a' : m.type === 'foot' ? '#eab308' : m.type === 'hold' ? '#dc2626' : '#2563eb',
                  opacity: 0.85
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}