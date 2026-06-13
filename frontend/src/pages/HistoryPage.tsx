import { useEffect, useState } from 'react';
import { listTimelapses, deleteTimelapse, type TimelapseRecord } from '../utils/timelapseStore';
import { downloadBlob } from '../utils/timelapse';

interface CardData extends TimelapseRecord {
  url: string; // object URL（描画用）
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())}  ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const MODE_LABEL: Record<TimelapseRecord['mode'], string> = {
  time: 'Time',
  task: 'Tasks',
  free: 'Free',
};

export function HistoryPage() {
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
    const date = formatDate(card.createdAt).replace(/[/ :]/g, '-');
    const ext = card.blob.type.includes('mp4') ? 'mp4' : 'webm';
    downloadBlob(card.blob, `lorestead_${date}.${ext}`);
  }

  async function handleDelete(id: string) {
    try {
      await deleteTimelapse(id);
    } catch (e) {
      console.error('Failed to delete timelapse', e);
    }
    setCards((prev) => {
      const target = prev?.find((c) => c.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev ? prev.filter((c) => c.id !== id) : prev;
    });
    setConfirmingId(null);
  }

  // ローディング中
  if (cards === null) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <p style={{ fontFamily: "'Cinzel', serif", fontSize: '13px', color: 'rgba(245,230,211,0.4)', letterSpacing: '0.2em' }}>
          Loading...
        </p>
      </div>
    );
  }

  // データなし
  if (cards.length === 0) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <p style={{ fontFamily: "'Cinzel', serif", fontSize: '15px', color: 'rgba(245,230,211,0.6)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Your Timelapses
        </p>
        <p style={{ fontFamily: 'sans-serif', fontSize: '13px', color: 'rgba(245,230,211,0.4)', letterSpacing: '0.04em', textAlign: 'center', lineHeight: 1.6 }}>
          No timelapses yet.<br />Finish a session and generate one to see it here.
        </p>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 overflow-y-auto custom-scrollbar"
      style={{ padding: '96px 40px 40px' }}
    >
      <div className="history-grid">
        {cards.map((card) => (
          <div key={card.id} className="history-card">

            {/* ── 動画プレビュー ── */}
            <div className="history-card-image">
              <video
                src={card.url}
                muted
                loop
                autoPlay
                playsInline
                className="history-card-thumb"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* 削除ボタン */}
              <button
                className="history-card-delete"
                onClick={(e) => { e.stopPropagation(); setConfirmingId(card.id); }}
                title="Delete"
              >
                ×
              </button>

              {/* 削除確認オーバーレイ */}
              {confirmingId === card.id && (
                <div className="history-card-confirm">
                  <p>Delete this timelapse?</p>
                  <div className="history-confirm-btns">
                    <button className="history-confirm-cancel" onClick={() => setConfirmingId(null)}>
                      Cancel
                    </button>
                    <button className="history-confirm-delete" onClick={() => handleDelete(card.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              )}

              {/* ホバー時アクション（確認中は非表示） */}
              {confirmingId !== card.id && (
                <div className="history-card-overlay">
                  <button
                    className="history-card-action history-card-action-download"
                    onClick={() => handleDownload(card)}
                  >
                    Download Timelapse
                  </button>
                </div>
              )}
            </div>

            {/* ── メタ情報 ── */}
            <div className="history-card-meta">
              <div className="history-card-date">{formatDate(card.createdAt)}</div>
              <div className="history-card-info">
                <span className="history-card-stage">
                  {MODE_LABEL[card.mode]} · Stage {card.stage} · {formatDuration(card.durationMinutes)}
                </span>
                <span className={`history-card-status ${card.isCompleted ? 'history-status-complete' : 'history-status-active'}`}>
                  {card.isCompleted ? 'Done' : 'Active'}
                </span>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
