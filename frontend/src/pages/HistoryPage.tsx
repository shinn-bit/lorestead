import { useEffect, useState } from 'react';
import { listTimelapses, deleteTimelapse, type TimelapseRecord } from '../utils/timelapseStore';
import { downloadBlob } from '../utils/timelapse';
import { useI18n } from '../i18n/I18nContext';
import { LangToggle } from '../components/LangToggle';
import type { View } from '../App';
import type { I18nKey } from '../i18n/dict';

interface CardData extends TimelapseRecord {
  url: string;
}

const MODE_KEY: Record<TimelapseRecord['mode'], I18nKey> = {
  time: 'mode_time',
  task: 'mode_tasks',
  free: 'mode_free',
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()} / ${p(d.getMonth() + 1)} / ${p(d.getDate())} · ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
);
const ScrollIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><polyline points="12 7 12 12 15 15" /></svg>
);
const SaveIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
);

interface Props {
  onNavigate: (view: View) => void;
}

export function HistoryPage({ onNavigate }: Props) {
  const { t } = useI18n();
  const [cards, setCards] = useState<CardData[] | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    const urls: string[] = [];
    let cancelled = false;

    listTimelapses()
      .then((records) => {
        if (cancelled) return;
        const data = records.map((r) => {
          const url = URL.createObjectURL(r.blob);
          urls.push(url);
          return { ...r, url };
        });
        setCards(data);
      })
      .catch((e) => {
        console.error('Failed to load timelapses', e);
        if (!cancelled) setCards([]);
      });

    return () => {
      cancelled = true;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  function handleDownload(card: CardData) {
    const date = formatDate(card.createdAt).replace(/[/ :·]/g, '-').replace(/-+/g, '-');
    const ext = card.blob.type.includes('mp4') ? 'mp4' : 'webm';
    downloadBlob(card.blob, `lorestead_${date}.${ext}`);
  }

  async function handleDelete(id: string) {
    try { await deleteTimelapse(id); } catch (e) { console.error('Failed to delete timelapse', e); }
    setCards((prev) => {
      const target = prev?.find((c) => c.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev ? prev.filter((c) => c.id !== id) : prev;
    });
    setConfirmingId(null);
  }

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

      {/* Loading */}
      {cards === null && (
        <div className="empty"><p>{t('loading')}</p></div>
      )}

      {/* Empty */}
      {cards !== null && cards.length === 0 && (
        <div className="empty">
          <h2>{t('hist_empty_h')}</h2>
          <p dangerouslySetInnerHTML={{ __html: t('hist_empty_p') }} />
        </div>
      )}

      {/* Grid */}
      {cards !== null && cards.length > 0 && (
        <div className="grid">
          {cards.map((card) => (
            <div key={card.id} className="card">
              <div className="frame">
                <video src={card.url} muted loop autoPlay playsInline />
                <div className={`status ${card.isCompleted ? 'done' : 'active'}`}>
                  {card.isCompleted ? t('status_done') : t('status_active')}
                </div>
                <button className="del" title="Delete" onClick={(e) => { e.stopPropagation(); setConfirmingId(card.id); }}>×</button>
                <div className="play"><span>▶</span></div>

                {confirmingId === card.id && (
                  <div className="confirm" onClick={(e) => e.stopPropagation()}>
                    <p>{t('hist_delete_confirm')}</p>
                    <div className="confirm-btns">
                      <button className="cancel" onClick={() => setConfirmingId(null)}>{t('cancel')}</button>
                      <button className="del2" onClick={() => handleDelete(card.id)}>{t('delete_word')}</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="meta">
                <div className="date">{formatDate(card.createdAt)}</div>
                <div className="info">
                  <span className="desc">{t(MODE_KEY[card.mode])} · {t('stage_word')} {card.stage} · {formatDuration(card.durationMinutes)}</span>
                  <button className="dl" onClick={() => handleDownload(card)}><SaveIcon /><span>{t('save_word')}</span></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
