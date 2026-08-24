import { useEffect, useRef, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import { MainPage } from './pages/MainPage';
import { HistoryPage } from './pages/HistoryPage';
import { DebugPage } from './pages/DebugPage';
import { LaunchSplash } from './components/LaunchSplash';
import { useI18n } from './i18n/I18nContext';
import { runBackHandlers } from './utils/backButton';

export type View = 'home' | 'history';

export default function App() {
  const { t } = useI18n();
  const [currentView, setCurrentView] = useState<View>('home');
  // バックキーが最後まで処理されなかったとき、1回目は終了予告だけ出す
  const [exitHint, setExitHint] = useState(false);
  const viewRef = useRef(currentView);
  viewRef.current = currentView;

  /**
   * Android のバックキー。各画面が useBackHandler で登録したハンドラを先に試し、
   * どこも処理しなければ「もう一度押すと終了」を2秒だけ出す。Webでは発火しない。
   */
  useEffect(() => {
    let armed = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const listener = CapApp.addListener('backButton', () => {
      if (viewRef.current === 'history') { setCurrentView('home'); return; }
      if (runBackHandlers()) return;
      if (armed) { void CapApp.exitApp(); return; }
      armed = true;
      setExitHint(true);
      timer = setTimeout(() => { armed = false; setExitHint(false); }, 2000);
    });
    return () => {
      if (timer) clearTimeout(timer);
      void listener.then((l) => l.remove());
    };
  }, []);

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

      {/* バックキー1回目の終了予告（Androidのみ） */}
      {exitHint && <div className="exit-hint">{t('exit_hint')}</div>}
    </div>
  );
}
