import { useState } from 'react';
import type { TaskItem } from '../../utils/stageCalculator';
import { useI18n } from '../../i18n/I18nContext';

type Phase = 'confirm' | 'done';

interface Props {
  tasks: TaskItem[];
  currentStage: number;
  isCompleted: boolean;
  /** 今日の記録を確定・保存する */
  onFinalize: () => Promise<unknown>;
  /** 確認画面でキャンセル（今日はまだ終わらない） */
  onCancel: () => void;
  /** 次の日を始める（Setup画面に戻る） */
  onBeginNextDay: () => void;
}

export function EndDayModal({ tasks, currentStage, isCompleted, onFinalize, onCancel, onBeginNextDay }: Props) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>('confirm');

  const doneCount = tasks.filter((x) => x.done).length;
  const totalCount = tasks.length;

  async function handleEnd() {
    await onFinalize();
    setPhase('done');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="flex flex-col gap-6 rounded-[2rem] border border-[#d4af37]/40 shadow-2xl"
        style={{ background: 'rgba(30,30,30,0.95)', padding: '40px 48px', minWidth: 380, maxWidth: 480 }}
      >

        {/* ── Confirm ── */}
        {phase === 'confirm' && (
          <>
            <h2 className="text-center text-xl tracking-[0.15em] text-[#f5e6d3] uppercase">
              {isCompleted ? t('end_complete_h') : t('end_session')}
            </h2>
            <p className="text-center text-sm text-[#f5e6d3]/60 tracking-widest leading-relaxed">
              {isCompleted ? t('end_complete_p') : t('end_ready')}<br />
              {doneCount} / {totalCount} {t('tasks_word')} · {t('stage_word')} {currentStage}
            </p>

            <div className="flex flex-col gap-3 mt-2">
              <button
                onClick={handleEnd}
                className="w-full py-4 rounded-full border border-[#d4af37]/70 text-[#f5e6d3] tracking-[0.2em] text-sm uppercase transition-all hover:bg-[#d4af37]/15 font-serif"
              >
                {t('end_session')}
              </button>

              <button
                onClick={onCancel}
                className="w-full py-2 text-[#f5e6d3]/30 tracking-widest text-xs uppercase transition-all hover:text-[#f5e6d3]/60 font-serif"
              >
                {t('cancel')}
              </button>
            </div>
          </>
        )}

        {/* ── Done → begin next day ── */}
        {phase === 'done' && (
          <>
            <h2 className="text-center text-xl tracking-[0.15em] text-[#f5e6d3] uppercase">
              {t('session_ended')}
            </h2>

            <button
              onClick={onBeginNextDay}
              className="w-full py-4 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/55 text-[#f5e6d3] tracking-[0.2em] text-sm uppercase transition-all hover:bg-[#d4af37]/25 font-serif mt-1"
            >
              {t('start_next_day')}
            </button>
          </>
        )}

      </div>
    </div>
  );
}
