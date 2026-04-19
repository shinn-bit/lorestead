import React, { useState, useEffect } from 'react';
import { Play, Square, History, Home as HomeIcon, Download, Settings } from 'lucide-react';

// --- Types ---
type View = 'home' | 'history';

// --- Mock Data ---
// 履歴画面用のダミーデータ（仕様書のタイムラプス動画やスナップショットを想定）
const HISTORY_ITEMS = [
  { id: 1, date: '2026/04/09 20:00:00', image: 'https://images.unsplash.com/photo-1599939571322-792a326cbda7?auto=format&fit=crop&q=80&w=400' },
  { id: 2, date: '2026/04/13 20:00:00', image: 'https://images.unsplash.com/photo-1599939571322-792a326cbda7?auto=format&fit=crop&q=80&w=400' },
  { id: 3, date: '2026/04/18 08:00:00', image: 'https://images.unsplash.com/photo-1599939571322-792a326cbda7?auto=format&fit=crop&q=80&w=400' },
  { id: 4, date: '2026/04/18 12:00:00', image: 'https://images.unsplash.com/photo-1599939571322-792a326cbda7?auto=format&fit=crop&q=80&w=400' },
  { id: 5, date: '2026/04/19 09:00:00', image: 'https://images.unsplash.com/photo-1599939571322-792a326cbda7?auto=format&fit=crop&q=80&w=400' },
  { id: 6, date: '2026/04/19 14:00:00', image: 'https://images.unsplash.com/photo-1599939571322-792a326cbda7?auto=format&fit=crop&q=80&w=400' },
  { id: 7, date: '2026/04/19 18:00:00', image: 'https://images.unsplash.com/photo-1599939571322-792a326cbda7?auto=format&fit=crop&q=80&w=400' },
  { id: 8, date: '2026/04/20 08:00:00', image: 'https://images.unsplash.com/photo-1599939571322-792a326cbda7?auto=format&fit=crop&q=80&w=400' },
];

// --- Common Components ---
const Button = ({ children, onClick, className = '', variant = 'outline' }: any) => {
  const baseStyle = "px-6 py-2 rounded-full font-serif tracking-widest transition-all duration-300 flex items-center justify-center gap-2 uppercase";
  const variants = {
    outline: "border border-[#d4af37]/60 text-[#f5e6d3] hover:bg-[#d4af37]/10",
    solid: "bg-[#d4af37]/80 text-[#1a1a1c] hover:bg-[#d4af37] font-semibold",
    ghost: "text-[#f5e6d3]/60 hover:text-[#f5e6d3] hover:bg-white/5",
  };
  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}>
      {children}
    </button>
  );
};

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');

  return (
    <div className="min-h-screen bg-[#15171a] text-[#f5e6d3] font-serif overflow-hidden flex flex-col">
      {/* Global CSS for custom scrollbar and utilities */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212, 175, 55, 0.4); }
        .iso-transform { transform: rotateX(60deg) rotateZ(45deg); }
      `}</style>

      {/* Header Navigation */}
      <header className="p-6 flex justify-between items-center relative z-20">
        <h1 className="text-3xl tracking-[0.2em] text-[#d4af37] font-light" style={{ textShadow: '0 0 15px rgba(212, 175, 55, 0.3)' }}>
          LORESTEAD
        </h1>
        <nav className="flex gap-2 bg-[#1a1c20]/80 p-1.5 rounded-full border border-white/5 backdrop-blur-sm">
          <Button 
            variant={currentView === 'home' ? 'outline' : 'ghost'} 
            onClick={() => setCurrentView('home')} 
            className="!px-4 !py-1.5 text-xs !border-transparent aria-selected:!border-[#d4af37]/40 aria-selected:bg-[#d4af37]/10"
            aria-selected={currentView === 'home'}
          >
            <HomeIcon size={16} />
            <span className="hidden sm:inline">HOME</span>
          </Button>
          <Button 
            variant={currentView === 'history' ? 'outline' : 'ghost'} 
            onClick={() => setCurrentView('history')} 
            className="!px-4 !py-1.5 text-xs !border-transparent aria-selected:!border-[#d4af37]/40 aria-selected:bg-[#d4af37]/10"
            aria-selected={currentView === 'history'}
          >
            <History size={16} />
            <span className="hidden sm:inline">HISTORY</span>
          </Button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
        {currentView === 'home' ? <HomeView /> : <HistoryView />}
      </main>
    </div>
  );
}

// --- Views ---

function HomeView() {
  // Session Timer State (Right Panel)
  const [sessionTimeLeft, setSessionTimeLeft] = useState(25 * 60);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionType, setSessionType] = useState<'ACTIVE' | 'REST'>('ACTIVE');
  
  // Total Accumulation State (Left Panel)
  const [totalAccumulatedTime, setTotalAccumulatedTime] = useState(1 * 3600 + 25 * 60); // 01:25:00
  const [isMainRunning, setIsMainRunning] = useState(false);

  // --- Phase & Image Logic based on total accumulated time ---
  const WORLD_PHASES = [
    { hours: 0, name: 'Foundation', image: '2.jpg' },
    { hours: 1, name: 'Stone Square', image: '3.jpg' },
    { hours: 3, name: 'Houses', image: '4.jpg' },
    { hours: 5, name: 'Market', image: '5.jpg' },
    { hours: 8, name: 'Tavern', image: '5.jpg' }, // 以降の画像はプレースホルダーとして5.jpgを流用
    { hours: 12, name: 'Church', image: '5.jpg' },
    { hours: 16, name: 'City Walls', image: '5.jpg' },
    { hours: 20, name: 'Prague Castle', image: 'home.jpg' },
  ];

  const currentPhaseIndex = WORLD_PHASES.reduce((acc, phase, index) => 
    (totalAccumulatedTime / 3600) >= phase.hours ? index : acc, 0
  );
  const currentPhase = WORLD_PHASES[currentPhaseIndex];
  const nextPhase = WORLD_PHASES[currentPhaseIndex + 1] || currentPhase;
  
  // 次のフェーズへの進捗率 (0 - 100%)
  const phaseProgress = currentPhase === nextPhase ? 100 : 
    (((totalAccumulatedTime / 3600) - currentPhase.hours) / (nextPhase.hours - currentPhase.hours)) * 100;

  // Session Timer Logic
  useEffect(() => {
    let interval: any = null;
    if (isSessionActive && sessionTimeLeft > 0) {
      interval = setInterval(() => {
        setSessionTimeLeft((time) => time - 1);
      }, 1000);
    } else if (sessionTimeLeft === 0) {
      setIsSessionActive(false);
    }
    return () => clearInterval(interval);
  }, [isSessionActive, sessionTimeLeft]);

  // Main Accumulation Timer Logic
  useEffect(() => {
    let interval: any = null;
    if (isMainRunning) {
      interval = setInterval(() => {
        setTotalAccumulatedTime((time) => time + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isMainRunning]);

  const resetSessionTimer = (minutes: number) => {
    setIsSessionActive(false);
    setSessionTimeLeft(minutes * 60);
  };

  const formatTime = (seconds: number, showHours = false) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (showHours || h > 0) {
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      
      {/* Background / Isometric Canvas Mockup */}
      <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
         {/* MVP：中世プラハの街 (Canvas APIのプレースホルダー) */}
         <div className="relative w-[600px] h-[600px] flex items-center justify-center opacity-90 transition-transform duration-1000 hover:scale-105">
             <div className="absolute inset-0 bg-[#d4af37]/10 blur-[100px] rounded-full"></div>
             
             {/* アイソメトリックな街のモック画像（実際のアプリではここにCanvasがレンダリングされる） */}
             <div className="relative z-10 w-full h-full flex items-center justify-center">
                 <img 
                    key={currentPhase.image} // 画像切り替え時のアニメーション用
                    src={currentPhase.image} 
                    alt={`Medieval Town Render - ${currentPhase.name}`} 
                    className="w-[80%] h-[80%] object-cover iso-transform shadow-2xl shadow-black/50 rounded-lg mix-blend-luminosity opacity-80 transition-all duration-1000 animate-in fade-in zoom-in-95"
                    onError={(e) => {
                        // プレビュー環境等で画像が見つからない場合のフォールバック
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1599939571322-792a326cbda7?auto=format&fit=crop&q=80&w=800";
                    }}
                 />
                 {/* 光の演出（作業中は街が明るくなる等） */}
                 <div className={`absolute inset-0 bg-gradient-to-t from-[#d4af37]/30 to-transparent mix-blend-overlay rounded-full transition-opacity duration-1000 ${isMainRunning ? 'opacity-100' : 'opacity-20'}`}></div>
             </div>
             
             {/* 開発者用ガイドラベル */}
             <div className="absolute bottom-10 text-center w-full text-[10px] tracking-widest text-white/20 font-sans">
                [CANVAS RENDER AREA: MEDIEVAL TOWN]
             </div>
         </div>
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 p-8 flex justify-between items-end pointer-events-none z-10">
        
        {/* Left Panel: 累積時間と全体の制御 */}
        <div className="flex flex-col gap-6 pointer-events-auto w-72 mb-12 ml-4">
          <div className="space-y-3">
            <div className="flex justify-between text-sm tracking-widest font-semibold text-[#f5e6d3]/90 uppercase">
              <span>{currentPhase.name}</span>
              <span className="text-[#d4af37]">PHASE {currentPhaseIndex + 1}</span>
            </div>
            {/* ProgressBar */}
            <div className="h-3 w-full bg-[#2a2d33] flex items-center p-0.5">
              <div 
                className="h-full bg-[#f5e6d3] transition-all duration-1000"
                style={{ width: `${phaseProgress}%` }}
              ></div>
            </div>
          </div>

          <div className="text-6xl font-light tracking-wider text-[#f5e6d3] flex items-end gap-4" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
            {formatTime(totalAccumulatedTime, true)}
            {/* デバッグ用ボタン：テスト時に時間を進める */}
            <button 
                onClick={() => setTotalAccumulatedTime(t => t + 3600)} 
                className="text-xs text-[#d4af37]/40 hover:text-[#d4af37] tracking-widest mb-2 border border-[#d4af37]/30 px-2 py-1 rounded transition-colors"
                title="Add 1 Hour (Test)"
            >
                +1H
            </button>
          </div>

          <div className="flex flex-col gap-4 mt-2">
            <Button 
                onClick={() => setIsMainRunning(!isMainRunning)}
                className={`!py-4 text-xl tracking-[0.3em] ${isMainRunning ? 'border-red-500/50 text-red-200 hover:bg-red-500/10' : ''}`}
            >
              {isMainRunning ? 'PAUSE' : 'START'}
            </Button>
            <Button className="!py-3 text-sm tracking-widest text-[#f5e6d3]/70 border-[#f5e6d3]/20">
              END SESSION
            </Button>
          </div>
        </div>

        {/* Right Panel: サブタイマー (ポモドーロ) */}
        <div className="pointer-events-auto self-start mt-8 mr-4">
            <div className="bg-[#2a2d33]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-2xl flex flex-col items-center gap-4 w-64 border border-white/5">
                
                {/* Active / Rest Toggle */}
                <div className="flex gap-2 w-full justify-center">
                    <button 
                        onClick={() => { setSessionType('ACTIVE'); resetSessionTimer(25); }}
                        className={`px-4 py-2 rounded-full text-xs tracking-widest transition-all ${sessionType === 'ACTIVE' ? 'bg-[#f5e6d3]/20 text-[#f5e6d3]' : 'text-[#f5e6d3]/40 hover:text-[#f5e6d3]/80'}`}
                    >
                        ACTIVE
                    </button>
                    <button 
                        onClick={() => { setSessionType('REST'); resetSessionTimer(5); }}
                        className={`px-4 py-2 rounded-full text-xs tracking-widest transition-all ${sessionType === 'REST' ? 'bg-[#f5e6d3]/20 text-[#f5e6d3]' : 'text-[#f5e6d3]/40 hover:text-[#f5e6d3]/80'}`}
                    >
                        REST
                    </button>
                </div>

                {/* Session Time Display */}
                <div className="text-5xl font-light tracking-tight text-[#f5e6d3] my-2">
                    {formatTime(sessionTimeLeft)}
                </div>

                {/* Session Control */}
                <Button 
                    onClick={() => setIsSessionActive(!isSessionActive)} 
                    className="w-full !py-2.5 text-sm"
                >
                    {isSessionActive ? 'PAUSE' : 'START'}
                </Button>

                {/* Session Presets (MVP要件 + Rest用分岐) */}
                {!isSessionActive && (
                    <div className="flex gap-1.5 w-full mt-2">
                        {(sessionType === 'ACTIVE' ? [25, 45, 60, 90] : [5, 10, 15]).map(mins => (
                            <button 
                                key={mins}
                                onClick={() => resetSessionTimer(mins)}
                                className="flex-1 py-1.5 text-[10px] font-sans border border-white/10 rounded-lg text-[#f5e6d3]/50 hover:bg-white/10 hover:text-[#f5e6d3] transition-colors"
                            >
                                {mins}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}

function HistoryView() {
  return (
    <div className="absolute inset-0 overflow-y-auto p-8 pt-4 custom-scrollbar">
      <div className="max-w-6xl mx-auto pb-20">
        
        {/* グリッドレイアウト */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {HISTORY_ITEMS.map((item) => (
            <div key={item.id} className="flex flex-col gap-4 group">
              {/* スナップショットカード（角丸とゴールド枠線） */}
              <div className="relative aspect-square rounded-[2rem] overflow-hidden border border-[#d4af37] bg-[#1a1c20] cursor-pointer shadow-lg transition-transform duration-500 hover:-translate-y-1 hover:shadow-[#d4af37]/20">
                  
                  {/* 画像ラッパー (アイソメトリック風の配置を再現) */}
                  <div className="absolute inset-0 flex items-center justify-center p-6">
                     <div className="relative w-full h-full iso-transform transition-transform duration-700 group-hover:scale-110">
                        <img 
                            src={item.image} 
                            alt="Session Snapshot" 
                            className="w-full h-full object-cover mix-blend-luminosity opacity-80 group-hover:mix-blend-normal group-hover:opacity-100 transition-all duration-500"
                        />
                     </div>
                  </div>
                  
                  {/* ダウンロードアイコン（オーバーレイ） */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="bg-[#d4af37] p-3 rounded-full text-black transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                        <Download size={20} />
                    </div>
                  </div>
              </div>
              
              {/* 日時表示 */}
              <div className="text-center font-sans text-sm text-[#f5e6d3]/60 tracking-widest font-light">
                {item.date}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}