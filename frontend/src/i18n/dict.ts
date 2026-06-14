/* ════════════════════════════════════════════════
   LORESTEAD · i18n dictionary (EN ⇄ 日本語)
   Brand "LORESTEAD" and screen names stay English —
   only body copy is translated.
   ════════════════════════════════════════════════ */

export type Lang = 'en' | 'ja';

type Entry = { en: string; ja: string };

export const dict = {
  /* ── Home ── */
  tagline:         { en: 'Build a world, one focused hour at a time', ja: '集中した時間が、ひとつの世界を育てていく' },
  medieval_town:   { en: 'MEDIEVAL TOWN', ja: '中世の街' },
  phase_label:     { en: 'PHASE', ja: 'フェーズ' },
  sub_screen:      { en: 'SUB SCREEN', ja: 'サブ画面' },
  start:           { en: 'START', ja: 'スタート' },
  pause:           { en: 'PAUSE', ja: '一時停止' },
  end_session:     { en: 'END SESSION', ja: 'セッションを終える' },
  restart_world:   { en: 'Restart World', ja: '世界をリセット' },
  paused:          { en: 'PAUSED', ja: '一時停止中' },

  /* ── Setup ── */
  how_it_works:    { en: 'How it works', ja: '使い方' },
  setup_eyebrow:   { en: 'A New Endeavour', ja: '新たな営み' },
  setup_h1:        { en: 'How will your world grow?', ja: 'どんなふうに世界を育てる？' },
  setup_sub:       { en: 'Choose a goal — the town rises as you labour.', ja: '目標を選ぼう——働くほどに、街は育っていく。' },
  tab_time:        { en: 'By Time', ja: '時間で' },
  tab_task:        { en: 'By Tasks', ja: 'タスクで' },
  time_hint:       { en: 'Your goal time is split into five stages. Reach it to complete the town.', ja: '目標時間は5つの段階に分かれます。到達すれば街が完成します。' },
  custom:          { en: 'Custom', ja: 'カスタム' },
  hours:           { en: 'hours', ja: '時間' },
  begin:           { en: 'Begin', ja: 'はじめる' },
  tasks_word:      { en: 'Tasks', ja: 'タスク' },
  task_hint:       { en: "List what you'll do. Completing them all builds the whole town.", ja: 'やることを書き出そう。すべて終えれば街がまるごと完成します。' },
  add_task:        { en: '+ Add task', ja: '＋ タスクを追加' },
  task_ph:         { en: 'Task', ja: 'タスク' },
  just_start:      { en: 'Just start →', ja: 'とりあえず始める →' },
  just_start_note: { en: 'No goal · grows every hour', ja: '目標なし · 1時間ごとに育つ' },

  /* ── Setup · first-run explanation ── */
  explain_eyebrow: { en: 'Before you begin', ja: 'はじめる前に' },
  explain_h2:      { en: 'Three ways to grow your world', ja: '世界の育て方は3通り' },
  explain_lead:    { en: "Your focused time builds the town. Choose how you'd like to set it — you can change this anytime.", ja: '集中した時間が街を築きます。進め方を選んでください——あとからいつでも変えられます。' },
  way_time_h:      { en: 'By Time', ja: '時間で' },
  way_time_p:      { en: "Set a goal in hours — a 1–8h preset or your own custom length. It's split into five build phases; reach your goal and the town is complete.", ja: '目標を時間で設定します。1〜8時間のプリセット、または好きな長さを入力。5つの建設フェーズに分かれ、目標に達すると街が完成します。' },
  way_task_h:      { en: 'By Tasks', ja: 'タスクで' },
  way_task_p:      { en: "List what you'll work through. Each task you finish pushes the build forward, and clearing them all raises the whole town.", ja: '取り組むことを書き出します。タスクを終えるたびに建設が進み、すべて片づければ街がまるごと立ち上がります。' },
  way_free_h:      { en: 'Free', ja: 'フリー' },
  way_free_p:      { en: 'No goal, no pressure. Begin right away — your world grows a little for every hour you stay focused.', ja: '目標もプレッシャーもなし。すぐに始められて、集中した1時間ごとに世界が少しずつ育ちます。' },
  explain_begin:   { en: 'Begin setup', ja: '設定をはじめる' },

  /* ── History · Chronicle ── */
  hist_eyebrow:    { en: 'The Record of Your Labour', ja: '営みの記録' },
  hist_h1:         { en: 'Your Chronicle', ja: 'あなたの年代記' },
  hist_sub:        { en: 'Every town you raised, kept as a timelapse to share.', ja: '築き上げた街を、共有できるタイムラプスとして残しています。' },
  hist_empty_h:    { en: 'Your Chronicle', ja: 'あなたの年代記' },
  hist_empty_p:    { en: 'No timelapses yet.<br>Finish a session and generate one to see it here.', ja: 'まだタイムラプスはありません。<br>セッションを終えて作成すると、ここに表示されます。' },
  status_done:     { en: 'Done', ja: '完了' },
  status_active:   { en: 'Active', ja: '進行中' },
  save_word:       { en: 'Save', ja: '保存' },
  mode_time:       { en: 'Time', ja: '時間' },
  mode_tasks:      { en: 'Tasks', ja: 'タスク' },
  mode_free:       { en: 'Free', ja: 'フリー' },
  stage_word:      { en: 'Stage', ja: 'ステージ' },

  /* ── Loading / misc ── */
  loading:         { en: 'Loading...', ja: '読み込み中...' },
} satisfies Record<string, Entry>;

export type I18nKey = keyof typeof dict;
