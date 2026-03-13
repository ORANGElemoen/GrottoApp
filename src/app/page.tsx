'use client';
import { useState, useEffect } from 'react';
import ClimbingCarousel from '@/components/ClimbingCarousel';
import Gallery from '@/components/Gallery';
import RouteViewer from '@/components/RouteViewer';

export default function Home() {
  const [view, setView] = useState<'gallery' | 'create' | 'view'>('gallery');
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLaunching, setIsLaunching] = useState(true);

  useEffect(() => {
    // 1. Check admin status on load
    const adminStatus = sessionStorage.getItem('isSetter');
    setIsAdmin(adminStatus === 'true');

    // 2. Splash Screen Timeout
    const timer = setTimeout(() => {
      setIsLaunching(false);
    }, 2000);

    return () => clearTimeout(timer);
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
    window.location.reload();
  };

  // --- WELCOME LOADING SCREEN ---
  if (isLaunching) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-1000">
        <div className="relative flex flex-col items-center">
          {/* Subtle ambient glow */}
          <div className="absolute inset-0 bg-blue-600/10 blur-[100px] rounded-full animate-pulse" />
          
          <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.5em] mb-4 z-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
            Welcome to
          </p>
          
          <h1 className="text-white text-5xl font-black tracking-tighter mb-4 z-10">
            THE <span className="text-blue-600">GROTTO</span>
          </h1>
          
          <div className="flex items-center gap-3 z-10 opacity-50">
            <div className="h-[1px] w-8 bg-gray-800"></div>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.4em]">
              Beta v1.0
            </p>
            <div className="h-[1px] w-8 bg-gray-800"></div>
          </div>
          
          {/* Progress bar animation */}
          <div className="mt-12 w-48 h-[2px] bg-gray-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-[2000ms] ease-out" 
              style={{ width: isLaunching ? '100%' : '0%' }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black animate-in fade-in duration-1000">
      <nav className="flex justify-between p-4 border-b border-gray-800 items-center">
        <h1 className="text-white font-bold text-xl tracking-tight">
          THE <span className="text-blue-500 font-black">GROTTO</span>
        </h1>
        <div className="flex gap-4">
          {!isAdmin ? (
            <button 
              onClick={handleAdminLogin} 
              className="text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
            >
              Setter Login
            </button>
          ) : (
            <button 
              onClick={handleLogout} 
              className="text-red-500 text-xs font-bold uppercase tracking-widest hover:text-red-400 transition-colors"
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
          className="fixed bottom-8 right-8 bg-blue-600 text-white w-14 h-14 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.3)] z-50 flex items-center justify-center hover:bg-blue-500 transition-all hover:scale-110 active:scale-95"
        >
          <span className="text-2xl font-light">+</span>
        </button>
      )}
      
      {view === 'create' && <ClimbingCarousel />}
    </main>
  );
}