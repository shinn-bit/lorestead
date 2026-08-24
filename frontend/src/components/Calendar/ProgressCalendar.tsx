import { useEffect, useMemo, useState } from 'react';
import { listDailyRecords, type DailyRecord } from '../../utils/dailyRecordStore';
import { getStillSrc } from '../../utils/stageCalculator';
import { todayLocalDateStr } from '../../utils/dateUtils';
import { useI18n } from '../../i18n/I18nContext';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

const ChevronLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
);
const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
);

/** その日の記録の到達ステージを、静止画サムネイルとして表示する（未用意なら簡易プレースホルダー） */
function DayThumb({ record }: { record: DailyRecord }) {
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);
  const src = getStillSrc(record.worldId, record.stage);

  return (
    <div className="cal-thumb">
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <span className="cal-thumb-fallback">{t('stage_word')} {record.stage}</span>
      )}
      <span className={`cal-badge ${record.isCompleted ? 'done' : record.studied ? 'partial' : 'blank'}`} />
    </div>
  );
}

export function ProgressCalendar() {
  const { t, lang } = useI18n();
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  useEffect(() => {
    listDailyRecords().then(setRecords).catch(() => {});
  }, []);

  const byDate = useMemo(() => {
    const m = new Map<string, DailyRecord>();
    for (const r of records) m.set(r.date, r);
    return m;
  }, [records]);

  const first = new Date(viewYear, viewMonth, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr = todayLocalDateStr();

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // 最終週も7列そろえて、グリッド罫線がきれいに閉じるようにする
  while (cells.length % 7 !== 0) cells.push(null);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); } else { setViewMonth((m) => m - 1); }
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); } else { setViewMonth((m) => m + 1); }
  }

  const monthLabel = first.toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-US', { year: 'numeric', month: 'long' });
  const weekdayLabels = Array.from({ length: 7 }, (_, i) =>
    new Date(2023, 0, 1 + i).toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-US', { weekday: 'short' }),
  );

  return (
    <div className="cal">
      <div className="cal-head">
        <button className="cal-nav" onClick={prevMonth} aria-label="Previous month"><ChevronLeft /></button>
        <span className="cal-month">{monthLabel}</span>
        <button className="cal-nav" onClick={nextMonth} aria-label="Next month"><ChevronRight /></button>
      </div>

      <div className="cal-grid">
        {weekdayLabels.map((w) => (
          <div className="cal-wd" key={w}>{w}</div>
        ))}
        {cells.map((day, i) => {
          if (day == null) return <div className="cal-cell empty" key={i} />;
          const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
          const rec = byDate.get(dateStr);
          const isToday = dateStr === todayStr;
          return (
            <div
              key={i}
              className={`cal-cell ${isToday ? 'today' : ''}`}
              title={rec ? `${t('stage_word')} ${rec.stage} · ${rec.tasks.filter((x) => x.done).length}/${rec.tasks.length}` : undefined}
            >
              <span className="cal-daynum">{day}</span>
              {rec && <DayThumb record={rec} />}
            </div>
          );
        })}
      </div>

      <div className="cal-legend">
        <span className="cal-legend-item"><span className="cal-dot done" /> {t('cal_legend_done')}</span>
        <span className="cal-legend-item"><span className="cal-dot partial" /> {t('cal_legend_partial')}</span>
        <span className="cal-legend-item"><span className="cal-dot blank" /> {t('cal_legend_blank')}</span>
      </div>
    </div>
  );
}
