import { useState } from 'react';
import { Home as HomeIcon, History } from 'lucide-react';
import { MainPage } from './pages/MainPage';
import { HistoryPage } from './pages/HistoryPage';
import { DebugPage } from './pages/DebugPage';

export type View = 'home' | 'history';

// canvas.js の Button コンポーネント
export const Button = ({ children, onClick, className = '', variant = 'outline' }: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'outline' | 'solid' | 'ghost';
}) => {
  const base = "px-6 py-2 rounded-full font-serif tracking-widest transition-all duration-300 flex items-center justify-center gap-2 uppercase cursor-pointer";
  const variants = {
    outline: "border border-[#d4af37]/60 text-[#f5e6d3] hover:bg-[#d4af37]/10",
    solid:   "bg-[#d4af37]/80 text-[#1a1c20] hover:bg-[#d4af37] font-semibold",
    ghost:   "text-[#f5e6d3]/60 hover:text-[#f5e6d3] hover:bg-white/5",
  };
  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');

  // 開発用デバッグ画面：URLが /debug または末尾 #debug のとき表示
  // (通常UIには露出しないので一般ユーザーには見えない)
  if (window.location.pathname === '/debug' || window.location.hash === '#debug') {
    return <DebugPage />;
  }

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-[#15171a] text-[#f5e6d3]">

      {/* 100%確実に効く！App.tsx専用の埋め込み強制CSS */}
      <style>{`
        .nav-wrapper-custom {
          position: absolute !important;
          top: 28px !important;
          right: 40px !important;
          z-index: 999 !important; /* 絶対に一番手前に来るように設定 */
          display: flex !important;
          gap: 8px !important;
          background-color: rgba(26, 28, 32, 0.8) !important;
          padding: 6px !important;
          border-radius: 9999px !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
          backdrop-filter: blur(8px) !important;
        }
        .nav-btn-active {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          padding: 8px 24px !important;
          border-radius: 9999px !important;
          font-size: 14px !important;
          font-family: 'Cinzel', serif !important;
          letter-spacing: 0.15em !important;
          text-transform: uppercase !important;
          background-color: rgba(212, 175, 55, 0.15) !important;
          border: 1px solid rgba(212, 175, 55, 0.5) !important;
          color: #f5e6d3 !important;
          cursor: pointer !important;
          transition: all 0.2s ease-in-out !important;
        }
        .nav-btn-inactive {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          padding: 8px 24px !important;
          border-radius: 9999px !important;
          font-size: 14px !important;
          font-family: 'Cinzel', serif !important;
          letter-spacing: 0.15em !important;
          text-transform: uppercase !important;
          background-color: transparent !important;
          border: 1px solid transparent !important;
          color: rgba(245, 230, 211, 0.4) !important;
          cursor: pointer !important;
          transition: all 0.2s ease-in-out !important;
        }
        .nav-btn-inactive:hover {
          color: #f5e6d3 !important;
          background-color: rgba(255, 255, 255, 0.05) !important;
        }
      `}</style>

      {/* ── MainPage は常時マウント（タイマー・キャプチャ・設定をセッション中保持） ── */}
      <div className="absolute inset-0">
        <MainPage />
      </div>

      {/* ── History：不透明オーバーレイ（MainPage を覆う） ── */}
      {currentView === 'history' && (
        <div className="absolute inset-0" style={{ zIndex: 100, background: '#15171a' }}>
          <HistoryPage />
        </div>
      )}

      {/* ── LORESTEAD タイトル（左上オーバーレイ） ── */}
      <div className="absolute top-7 left-10 pointer-events-none" style={{ zIndex: 998 }}>
        <h1
          className="text-4xl tracking-[0.2em] text-[#d4af37] font-light"
          style={{ textShadow: '0 0 20px rgba(212,175,55,0.4)', fontFamily: "'Cinzel', serif" }}
        >
          LORESTEAD
        </h1>
      </div>

      {/* ── HOME / HISTORY ナビ（右上オーバーレイ：埋め込みCSS管理） ── */}
      <nav className="nav-wrapper-custom">
        <button
          onClick={() => setCurrentView('home')}
          className={currentView === 'home' ? 'nav-btn-active' : 'nav-btn-inactive'}
        >
          <HomeIcon size={15} />
          HOME
        </button>
        <button
          onClick={() => setCurrentView('history')}
          className={currentView === 'history' ? 'nav-btn-active' : 'nav-btn-inactive'}
        >
          <History size={15} />
          HISTORY
        </button>
      </nav>

    </div>
  );
}
