import { useState } from 'react';
import { getGoal, setGoal, clearGoal, daysUntil, type Goal } from '../../utils/goalStore';
import { useI18n } from '../../i18n/I18nContext';

/** 目標日の表示・編集用ピル（World画面のトップバーに置く軽量ポップオーバー） */
export function GoalPill() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [goal, setGoalState] = useState<Goal | null>(() => getGoal());
  const [dateInput, setDateInput] = useState(goal?.date ?? '');
  const [labelInput, setLabelInput] = useState(goal?.label ?? '');

  function openEditor() {
    setDateInput(goal?.date ?? '');
    setLabelInput(goal?.label ?? '');
    setOpen((o) => !o);
  }

  function save() {
    if (dateInput) {
      setGoal(dateInput, labelInput);
      setGoalState({ date: dateInput, label: labelInput.trim() });
    }
    setOpen(false);
  }
  function clear() {
    clearGoal();
    setGoalState(null);
    setDateInput('');
    setLabelInput('');
    setOpen(false);
  }

  const days = goal ? daysUntil(goal.date) : null;

  let label = t('goal_edit_link');
  if (days !== null && goal) {
    const prefix = goal.label ? `${goal.label} · ` : '';
    if (days > 0) label = `${prefix}${days} ${t('goal_days_left_suffix')}`;
    else if (days === 0) label = `${prefix}${t('goal_today_label')}`;
    else label = `${prefix}${t('goal_overdue_label')}`;
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="howlink"
        onClick={openEditor}
        style={{ whiteSpace: 'nowrap' }}
      >
        {label}
      </button>
      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 60, width: 240,
            display: 'flex', flexDirection: 'column', gap: 10, padding: 14,
            background: 'rgba(20,13,8,0.92)', border: '1px solid rgba(240,164,74,0.3)',
            borderRadius: 14, backdropFilter: 'blur(8px)',
          }}
        >
          <label style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(247,236,216,0.6)' }}>
            {t('goal_input_label')}
          </label>
          <input
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(240,164,74,0.3)',
              borderRadius: 8, padding: '8px 10px', color: 'var(--h-ink)', fontSize: 13, colorScheme: 'dark',
            }}
          />
          <label style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(247,236,216,0.6)' }}>
            {t('goal_label_input')}
          </label>
          <input
            type="text"
            value={labelInput}
            placeholder={t('goal_label_ph')}
            onChange={(e) => setLabelInput(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(240,164,74,0.3)',
              borderRadius: 8, padding: '8px 10px', color: 'var(--h-ink)', fontSize: 13,
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={save}
              disabled={!dateInput}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 9999, background: 'rgba(240,164,74,0.18)',
                border: '1px solid rgba(240,164,74,0.5)', color: 'var(--h-ink)', fontFamily: "'Cinzel', serif",
                fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
                opacity: dateInput ? 1 : 0.4,
              }}
            >
              {t('goal_save')}
            </button>
            {goal && (
              <button
                onClick={clear}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 9999, background: 'transparent',
                  border: '1px solid rgba(247,236,216,0.2)', color: 'rgba(247,236,216,0.6)', fontFamily: "'Cinzel', serif",
                  fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                {t('goal_clear')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
