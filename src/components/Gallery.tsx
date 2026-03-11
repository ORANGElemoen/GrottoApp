'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Gallery({ onSelectRoute }: { onSelectRoute: (id: string) => void }) {
  const [routes, setRoutes] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("All");

  useEffect(() => {
    async function fetchRoutes() {
      let query = supabase.from('routes').select('*');
      if (search) query = query.ilike('name', `%${search}%`);
      if (gradeFilter !== "All") query = query.eq('grade', gradeFilter);
      const { data } = await query;
      setRoutes(data || []);
    }
    fetchRoutes();
  }, [search, gradeFilter]);

  return (
    <div className="p-4 text-white">
      <div className="flex gap-2 mb-4">
        {/* Changed background to gray-700 and text to white for high contrast */}
        <input 
          placeholder="Search..." 
          className="p-2 rounded bg-gray-700 text-white placeholder-gray-300 flex-1 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" 
          onChange={(e) => setSearch(e.target.value)} 
        />
        {/* Same styling for the grade filter */}
        <select 
          className="p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none" 
          onChange={(e) => setGradeFilter(e.target.value)}
        >
          <option value="All">All Grades</option>
          <option value="5a">5a</option>
          <option value="5b">5b</option>
          <option value="5c">5c</option>
          <option value="6a">6a</option>
          <option value="6b">6b</option>
          <option value="6c">6c</option>
          <option value="7a">7a</option>
          <option value="7b">7b</option>
          <option value="7c">7c</option>
          <option value="X">X</option>
        </select>
      </div>
      
      <div className="grid gap-4">
        {routes.map((r) => (
          <div key={r.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center border border-gray-700">
            <div>
              <h3 className="font-bold text-lg">{r.name}</h3>
              <p className="text-sm text-gray-400">Grade: {r.grade}</p>
            </div>
            <button 
              onClick={() => onSelectRoute(r.id)} 
              className="bg-blue-600 hover:bg-blue-500 transition-colors px-4 py-2 rounded font-medium"
            >
              View
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}