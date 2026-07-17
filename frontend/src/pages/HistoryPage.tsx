import { useI18n } from '../i18n/I18nContext';
import { LangToggle } from '../components/LangToggle';
import { ProgressCalendar } from '../components/Calendar/ProgressCalendar';
import type { View } from '../App';

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
);
const ScrollIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><polyline points="12 7 12 12 15 15" /></svg>
);

interface Props {
  onNavigate: (view: View) => void;
}

export function HistoryPage({ onNavigate }: Props) {
  const { t } = useI18n();

  return (
    <div className="scr-chronicle parchment">
      {/* Top bar */}
      <div className="topbar">
        <div className="wordmark">LORE<b>STEAD</b></div>
        <div className="topbar-right">
          <LangToggle />
          <nav className="nav">
            <button onClick={() => onNavigate('home')}><HomeIcon /> Home</button>
            <button className="active"><ScrollIcon /> Chronicle</button>
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="header">
        <div className="eyebrow">{t('hist_eyebrow')}</div>
        <h1>{t('hist_h1')}</h1>
        <p className="sub">{t('hist_sub')}</p>
        <div className="divider"><span className="line" /><span className="mark">✦</span><span className="line r" /></div>
      </div>

      {/* Progress calendar (daily records) */}
      <div className="cal-wrap">
        <ProgressCalendar />
      </div>
    </div>
  );
}
