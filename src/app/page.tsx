'use client';
import { useState, useEffect } from 'react';
import ClimbingCarousel from '@/components/ClimbingCarousel';
import Gallery from '@/components/Gallery';
import RouteViewer from '@/components/RouteViewer';

export default function Home() {
  const [view, setView] = useState<'gallery' | 'create' | 'view'>('gallery');
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Checks for admin status on load using sessionStorage
  useEffect(() => {
    const adminStatus = sessionStorage.getItem('isSetter');
    if (adminStatus === 'true') setIsAdmin(true);
  }, []);

  const handleAdminLogin = () => {
    const code = prompt("Enter Setter Code:");
    if (code === "1234") { // Replace with your actual code
      sessionStorage.setItem('isSetter', 'true');
      setIsAdmin(true);
    } else {
      alert("Invalid Code");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isSetter');
    setIsAdmin(false);
    setView('gallery');
  };

  return (
    <main className="min-h-screen bg-black">
      <nav className="flex justify-between p-4 border-b border-gray-700 items-center">
        <h1 className="text-white font-bold text-xl">RouteBeta</h1>
        <div className="flex gap-4">
          {!isAdmin ? (
            <button onClick={handleAdminLogin} className="text-gray-400 text-sm">Setter Login</button>
          ) : (
            <button onClick={handleLogout} className="text-red-400 text-sm">Logout</button>
          )}
        </div>
      </nav>

      {view === 'gallery' && <Gallery onSelectRoute={(id) => { setActiveRouteId(id); setView('view'); }} />}
      {view === 'view' && activeRouteId && <RouteViewer routeId={activeRouteId} onBack={() => setView('gallery')} />}
      
      {/* 'New Route' button only appears if Admin is logged in */}
      {isAdmin && view === 'gallery' && (
        <button onClick={() => setView('create')} 
          className="fixed bottom-6 right-6 bg-green-700 text-white p-4 rounded-full shadow-lg z-50 font-bold">
          + New Route
        </button>
      )}
      
      {view === 'create' && <ClimbingCarousel />}
    </main>
  );
}