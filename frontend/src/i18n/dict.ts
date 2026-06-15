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
  start_over:      { en: 'Start Over', ja: '最初から' },
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

  /* ── Setup · stepped wizard ── */
  choose_sub:        { en: 'Choose how to begin — you can change it anytime.', ja: '進め方を選ぼう——あとからいつでも変えられます。' },
  nav_back:          { en: 'Back', ja: '戻る' },
  time_step_eyebrow: { en: 'Step 2 · By Time', ja: 'ステップ 2 · 時間で成長' },
  time_step_h:       { en: 'Set your goal', ja: '目標を決める' },
  task_step_eyebrow: { en: 'Step 2 · By Tasks', ja: 'ステップ 2 · タスクで成長' },
  task_step_h:       { en: 'List your tasks', ja: 'タスクを書き出す' },

  /* ── Setup · guided tour ── */
  tour_skip:       { en: 'Skip', ja: 'スキップ' },
  tour_back:       { en: 'Back', ja: '戻る' },
  tour_next:       { en: 'Next', ja: '次へ' },
  tour_done:       { en: 'Got it', ja: 'はじめる' },
  tour_1:          { en: 'First, choose how your world will grow — <b>By Time</b> or <b>By Tasks</b>.', ja: 'まずは育て方を選びます——<b>時間で成長</b> か <b>タスクで成長</b>。' },
  tour_2:          { en: '<b>By Time</b>: set a goal — tap a 1–8h preset, or enter your own length.', ja: '<b>時間で成長</b>：目標を決めます。1〜8時間のプリセットを選ぶか、好きな長さを入力。' },
  tour_task:       { en: '<b>By Tasks</b>: list what you’ll do — finishing each one pushes the build forward, and clearing them all raises the whole town.', ja: '<b>タスクで成長</b>：やることを書き出します。終えるたびに建設が進み、すべて片づければ街がまるごと立ち上がります。' },
  tour_3:          { en: 'Seal it and begin — the town rises as you stay focused.', ja: 'あとは作業を始めるだけ——集中するほど街が育っていきます。' },
  tour_4:          { en: '<b>Just start</b> is always here, on every screen, when you want to skip setup.', ja: '設定を飛ばしたいときは <b>とりあえず始める</b>。どの画面にもあります。' },

  /* ── Setup · first-run explanation (legacy, unused) ── */
  explain_eyebrow: { en: 'Before you begin', ja: 'はじめる前に' },
  explain_h2:      { en: 'Three ways to grow your world', ja: '世界の育て方は3通り' },
  explain_lead:    { en: "Your focused time builds the town. Choose how you'd like to set it — you can change this anytime.", ja: '集中した時間が街を築きます。進め方を選んでください——あとからいつでも変えられます。' },
  way_time_h:      { en: 'By Time', ja: '時間で成長' },
  way_time_p:      { en: "Set a goal in hours — a 1–8h preset or your own custom length. It's split into five build phases; reach your goal and the town is complete.", ja: '目標を時間で設定します。1〜8時間のプリセット、または好きな長さを入力。5つの建設フェーズに分かれ、目標に達すると街が完成します。' },
  way_task_h:      { en: 'By Tasks', ja: 'タスクで成長' },
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

  /* ── World · sub screen / restart / capture ── */
  close_sub_screen: { en: 'Close Sub Screen', ja: 'サブ画面を閉じる' },
  restart_confirm:  { en: 'Reset and choose a new goal?', ja: 'リセットして新しい目標を選びますか？' },
  cancel:           { en: 'Cancel', ja: 'キャンセル' },
  restart:          { en: 'Restart', ja: 'リセット' },
  rec_stop:         { en: 'Stop', ja: '停止' },

  /* ── Screen capture prompt ── */
  screen_prompt_title:  { en: 'Record your screen?', ja: '画面を録画しますか？' },
  screen_prompt_body:   { en: 'Capture your work screen once per minute to create a personalized timelapse. Saved only on this device — never uploaded.', ja: '作業画面を1分に1回キャプチャして、自分だけのタイムラプスを作成します。この端末にのみ保存され、アップロードはされません。' },
  screen_prompt_enable: { en: 'Select screen & record', ja: '画面を選んで録画' },
  skip:                 { en: 'Skip', ja: 'スキップ' },

  /* ── End session modal ── */
  end_ready:        { en: 'Ready to wrap up?', ja: '終了しますか？' },
  end_frames:       { en: 'frames captured — generate your timelapse.', ja: '個のフレームを取得——タイムラプスを作成できます。' },
  end_frames_none:  { en: 'Timer just started — keep going to capture frames.', ja: '計測を始めたばかりです——フレームが貯まるまで続けましょう。' },
  end_generate:     { en: 'Generate Timelapse & End', ja: 'タイムラプスを作成して終了' },
  end_without:      { en: 'End Without Timelapse', ja: 'タイムラプスなしで終了' },
  generating:       { en: 'Generating...', ja: '生成中...' },
  generating_sub:   { en: 'Creating your timelapse', ja: 'タイムラプスを作成しています' },
  complete:         { en: 'Complete', ja: '完成' },
  timelapse_ready:  { en: 'Your timelapse is ready.', ja: 'タイムラプスができました。' },
  download:         { en: 'Download', ja: 'ダウンロード' },
  close:            { en: 'Close', ja: '閉じる' },
  gen_failed:       { en: 'Failed to generate video. Please try again.', ja: '動画の生成に失敗しました。もう一度お試しください。' },

  /* ── Chronicle · delete ── */
  hist_delete_confirm: { en: 'Delete this timelapse?', ja: 'このタイムラプスを削除しますか？' },
  delete_word:         { en: 'Delete', ja: '削除' },

  /* ── Loading / misc ── */
  loading:         { en: 'Loading...', ja: '読み込み中...' },
} satisfies Record<string, Entry>;

export type I18nKey = keyof typeof dict;
