'use client';
import { useState, useEffect } from 'react';
import ClimbingCarousel from '@/components/ClimbingCarousel';
import Gallery from '@/components/Gallery';
import RouteViewer from '@/components/RouteViewer';

export default function Home() {
  const [view, setView] = useState<'gallery' | 'create' | 'view'>('gallery');
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check status on load
    const adminStatus = sessionStorage.getItem('isSetter');
    setIsAdmin(adminStatus === 'true');
  }, []);

  const handleAdminLogin = () => {
    const code = prompt("Enter Setter Code:");
    if (code === "1234") {
      sessionStorage.setItem('isSetter', 'true');
      setIsAdmin(true);
    } else {
      alert("Invalid Code");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isSetter');
    setIsAdmin(false);
    // CRITICAL: Force a full reload to reset all component states 
    // and remove administrative buttons from the DOM entirely.
    window.location.reload();
  };

  return (
    <main className="min-h-screen bg-black">
      <nav className="flex justify-between p-4 border-b border-gray-700 items-center">
        <h1 className="text-white font-bold text-xl">TheGrottoBeta</h1>
        <div className="flex gap-4">
          {!isAdmin ? (
            <button 
              onClick={handleAdminLogin} 
              className="text-gray-400 text-sm hover:text-white transition-colors"
            >
              Setter Login
            </button>
          ) : (
            <button 
              onClick={handleLogout} 
              className="text-red-400 text-sm hover:text-red-300 transition-colors"
            >
              Logout
            </button>
          )}
        </div>
      </nav>

      {/* Main View Controller */}
      {view === 'gallery' && (
        <Gallery onSelectRoute={(id) => { setActiveRouteId(id); setView('view'); }} />
      )}
      
      {view === 'view' && activeRouteId && (
        <RouteViewer 
          routeId={activeRouteId} 
          onBack={() => {
            setView('gallery');
            setActiveRouteId(null);
          }} 
        />
      )}
      
      {/* 'New Route' button only appears if Admin is logged in */}
      {isAdmin && view === 'gallery' && (
        <button 
          onClick={() => setView('create')} 
          className="fixed bottom-6 right-6 bg-green-700 text-white p-4 rounded-full shadow-lg z-50 font-bold hover:bg-green-600 transition-all"
        >
          + New Route
        </button>
      )}
      
      {view === 'create' && <ClimbingCarousel />}
    </main>
  );
}