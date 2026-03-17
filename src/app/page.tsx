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

  // --- SETTINGS & TICK LIST STATE ---
  const [markerStyle, setMarkerStyle] = useState<'solid' | 'translucent' | 'outline'>('solid');
  const [markerSize, setMarkerSize] = useState(1.0);
  const [showLegend, setShowLegend] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  
  // Updated Ticking & Filtering State
  const [gradeFilter, setGradeFilter] = useState('All');
  const [completedRoutes, setCompletedRoutes] = useState<string[]>([]);

  useEffect(() => {
    const adminStatus = sessionStorage.getItem('isSetter');
    setIsAdmin(adminStatus === 'true');

    // Load user preferences
    const savedStyle = localStorage.getItem('grotto_marker_style');
    const savedSize = localStorage.getItem('grotto_marker_size');
    const savedContrast = localStorage.getItem('grotto_high_contrast');
    const savedTicks = localStorage.getItem('grotto_ticks');

    if (savedStyle) setMarkerStyle(savedStyle as any);
    if (savedSize) setMarkerSize(parseFloat(savedSize));
    if (savedContrast) setHighContrast(savedContrast === 'true');
    if (savedTicks) {
      try {
        setCompletedRoutes(JSON.parse(savedTicks));
      } catch (e) {
        setCompletedRoutes([]);
      }
    }

    const timer = setTimeout(() => {
      setIsLaunching(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const toggleSent = (id: string) => {
    const newTicks = completedRoutes.includes(id)
      ? completedRoutes.filter(rid => rid !== id)
      : [...completedRoutes, id];
    
    setCompletedRoutes(newTicks);
    localStorage.setItem('grotto_ticks', JSON.stringify(newTicks));
    
    // Haptic feedback for "The Send"
    if (typeof window !== 'undefined' && window.navigator.vibrate) {
      window.navigator.vibrate(25);
    }
  };

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

  if (isLaunching) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-1000">
        <div className="relative flex flex-col items-center">
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
      {view === 'gallery' && (
        <>
          <nav className="flex justify-between p-4 border-b border-gray-800 items-center bg-black/80 backdrop-blur-md sticky top-0 z-50">
            <h1 className="text-white font-bold text-xl tracking-tight">
              THE <span className="text-blue-500 font-black">GROTTO</span>
            </h1>
            <div className="flex gap-4">
              {!isAdmin ? (
                <button onClick={handleAdminLogin} className="text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
                  Setter Login
                </button>
              ) : (
                <button onClick={handleLogout} className="text-red-500 text-xs font-bold uppercase tracking-widest hover:text-red-400 transition-colors">
                  Logout
                </button>
              )}
            </div>
          </nav>

          {/* GRANULAR GRADE FILTER BAR */}
          <div className="flex gap-2 overflow-x-auto p-4 no-scrollbar bg-black/50 sticky top-[61px] z-40 backdrop-blur-md border-b border-white/5">
            {['All', '5a', '5b', '5c', '6a', '6b', '6c', '7a', '7b', '7c', 'X', 'Sent'].map((grade) => (
              <button
                key={grade}
                onClick={() => setGradeFilter(grade)}
                className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                  gradeFilter === grade 
                    ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
                    : 'bg-gray-900 border-white/5 text-gray-500 hover:text-gray-300'
                }`}
              >
                {grade === 'Sent' ? 'Sent ✓' : grade}
              </button>
            ))}
          </div>

          <Gallery 
            onSelectRoute={(id) => { setActiveRouteId(id); setView('view'); }} 
            activeFilter={gradeFilter}
            completedIds={completedRoutes}
            onGradeFilterChange={setGradeFilter}
          />
        </>
      )}
      
      {view === 'view' && activeRouteId && (
        <RouteViewer 
          routeId={activeRouteId} 
          onBack={() => {
            setView('gallery');
            setActiveRouteId(null);
          }} 
          settings={{ 
            markerStyle, 
            markerSize, 
            showLegend, 
            highContrast,
            isSent: completedRoutes.includes(activeRouteId) 
          }}
          onUpdateSettings={(key, val) => {
            if (key === 'markerStyle') {
              setMarkerStyle(val);
              localStorage.setItem('grotto_marker_style', val);
            }
            if (key === 'markerSize') {
              setMarkerSize(val);
              localStorage.setItem('grotto_marker_size', val.toString());
            }
            if (key === 'showLegend') setShowLegend(val);
            if (key === 'highContrast') {
              setHighContrast(val);
              localStorage.setItem('grotto_high_contrast', val.toString());
            }
          }}
          onToggleSent={() => toggleSent(activeRouteId)}
        />
      )}
      
      {view === 'create' && (
        <div className="flex flex-col min-h-screen">
          <div className="p-4 flex items-center justify-between border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50">
            <button 
              onClick={() => setView('gallery')} 
              className="bg-gray-800/90 text-white px-5 py-2 rounded-xl shadow-lg hover:bg-gray-700 transition-all active:scale-95 border border-white/5 text-xs font-bold"
            >
              ← Back
            </button>
            <h2 className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em]">
              New Route Setup
            </h2>
            <div className="w-[80px]"></div>
          </div>
          <div className="flex-1 animate-in slide-in-from-bottom-4 duration-500">
            <ClimbingCarousel />
          </div>
        </div>
      )}
      
      {isAdmin && view === 'gallery' && (
        <button 
          onClick={() => setView('create')} 
          className="fixed bottom-8 right-8 bg-blue-600 text-white w-14 h-14 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.3)] z-50 flex items-center justify-center hover:bg-blue-500 transition-all hover:scale-110 active:scale-95"
        >
          <span className="text-2xl font-light">+</span>
        </button>
      )}
    </main>
  );
}