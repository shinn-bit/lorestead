import { useRef, useEffect, useState } from 'react';

export interface HistoryItem {
  id: string;
  date: string;
  totalMinutes: number;
  sessionMinutes: number;
  stage: number;
  isCompleted: boolean;
  timelapseUrl?: string;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function StageThumbnail({ stage }: { stage: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.src = `/assets/worlds/prague/stage_0${stage}.mp4`;

    video.addEventListener('loadedmetadata', () => {
      video.currentTime = Math.min(1.0, video.duration * 0.3);
    }, { once: true });

    video.addEventListener('seeked', () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }, { once: true });

    video.addEventListener('error', () => {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#1e2128');
      grad.addColorStop(1, '#0f1114');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, { once: true });

    video.load();
  }, [stage]);

  return (
    <canvas ref={canvasRef} width={440} height={440} className="history-card-thumb" />
  );
}

interface Props {
  items: HistoryItem[];
  loading: boolean;
  isLoggedIn: boolean;
  onResume: (totalMinutes: number) => void;
  onDelete: (id: string) => void;
  onSignIn: () => void;
}

export function HistoryPage({ items, loading, isLoggedIn, onResume, onDelete, onSignIn }: Props) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  function handleDownload(item: HistoryItem) {
    if (!item.timelapseUrl) return;
    const a = document.createElement('a');
    a.href = item.timelapseUrl;
    a.download = `lorestead_${item.date.replace(/[/ :]/g, '-')}.mp4`;
    a.click();
  }

  // ローディング中
  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <p style={{ fontFamily: "'Cinzel', serif", fontSize: '13px', color: 'rgba(245,230,211,0.4)', letterSpacing: '0.2em' }}>
          Loading...
        </p>
      </div>
    );
  }

  // 未ログイン
  if (!isLoggedIn) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <p style={{
            fontFamily: "'Cinzel', serif",
            fontSize: '18px',
            color: '#f5e6d3',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}>
            Your History
          </p>
          <p style={{
            fontFamily: 'sans-serif',
            fontSize: '13px',
            color: 'rgba(245,230,211,0.45)',
            letterSpacing: '0.05em',
            textAlign: 'center',
            lineHeight: '1.6',
          }}>
            Sign in to save your sessions<br />and track your world's growth over time.
          </p>
        </div>
        <button
          onClick={onSignIn}
          style={{
            background: 'rgba(212,175,55,0.12)',
            border: '1px solid rgba(212,175,55,0.5)',
            color: '#f5e6d3',
            fontFamily: "'Cinzel', serif",
            fontSize: '12px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            padding: '14px 36px',
            borderRadius: '9999px',
            cursor: 'pointer',
          }}
        >
          Sign In
        </button>
      </div>
    );
  }

  // データなし
  if (items.length === 0) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <p style={{ fontFamily: "'Cinzel', serif", fontSize: '13px', color: 'rgba(245,230,211,0.4)', letterSpacing: '0.15em' }}>
          No sessions yet. Start your first session.
        </p>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 overflow-y-auto custom-scrollbar"
      style={{ padding: '96px 40px 0' }}
    >
      <div className="history-grid">
        {items.map((item) => (
          <div key={item.id} className="history-card">

            {/* ── サムネイルカード ── */}
            <div className="history-card-image">
              <StageThumbnail stage={item.stage} />

              {/* 削除ボタン */}
              <button
                className="history-card-delete"
                onClick={(e) => { e.stopPropagation(); setConfirmingId(item.id); }}
                title="Delete"
              >
                ×
              </button>

              {/* 削除確認オーバーレイ */}
              {confirmingId === item.id && (
                <div className="history-card-confirm">
                  <p>Delete this session?</p>
                  <div className="history-confirm-btns">
                    <button
                      className="history-confirm-cancel"
                      onClick={() => setConfirmingId(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className="history-confirm-delete"
                      onClick={() => { onDelete(item.id); setConfirmingId(null); }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}

              {/* ホバー時アクションオーバーレイ（確認中は非表示） */}
              {confirmingId !== item.id && (
                <div className="history-card-overlay">
                  {item.isCompleted ? (
                    <button
                      className="history-card-action history-card-action-download"
                      onClick={() => handleDownload(item)}
                    >
                      Download Timelapse
                    </button>
                  ) : (
                    <button
                      className="history-card-action history-card-action-resume"
                      onClick={() => onResume(item.totalMinutes)}
                    >
                      Resume Session
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── メタ情報 ── */}
            <div className="history-card-meta">
              <div className="history-card-date">{item.date}</div>
              <div className="history-card-info">
                <span className="history-card-stage">
                  Stage {item.stage} · {formatDuration(item.sessionMinutes)}
                </span>
                <span className={`history-card-status ${item.isCompleted ? 'history-status-complete' : 'history-status-active'}`}>
                  {item.isCompleted ? 'Done' : 'Active'}
                </span>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
