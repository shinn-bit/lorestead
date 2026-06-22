import { useState } from 'react';
import { MainPage } from './pages/MainPage';
import { HistoryPage } from './pages/HistoryPage';
import { DebugPage } from './pages/DebugPage';
import { LaunchSplash } from './components/LaunchSplash';

export type View = 'home' | 'history';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');

  // 開発用デバッグ画面：URLが /debug または末尾 #debug のとき表示
  if (window.location.pathname === '/debug' || window.location.hash === '#debug') {
    return <DebugPage />;
  }

  return (
    <div className="relative w-full h-dvh overflow-hidden">
      {/* World/Home は常時マウント（タイマー・キャプチャ・設定をセッション中保持） */}
      <MainPage onNavigate={setCurrentView} />

      {/* History（Chronicle）：羊皮紙オーバーレイ */}
      {currentView === 'history' && <HistoryPage onNavigate={setCurrentView} />}

      {/* 起動スプラッシュ（セッション初回のみ） */}
      <LaunchSplash />
    </div>
  );
}
