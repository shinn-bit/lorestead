/* ════════════════════════════════════════════════
   LORESTEAD · i18n dictionary (EN ⇄ 日本語)
   Brand "LORESTEAD" and screen names stay English —
   only body copy is translated.
   ════════════════════════════════════════════════ */

export type Lang = 'en' | 'ja';

type Entry = { en: string; ja: string };

export const dict = {
  /* ── Home ── */
  tagline:         { en: 'Build a world, one finished task at a time', ja: '終えたタスクが、ひとつの世界を育てていく' },
  medieval_town:   { en: 'MEDIEVAL TOWN', ja: '中世の街' },
  phase_label:     { en: 'PHASE', ja: 'フェーズ' },
  sub_screen:      { en: 'SUB SCREEN', ja: 'サブ画面' },
  end_session:     { en: 'END TODAY', ja: '今日を終える' },

  /* ── Home · Hide UI ── */
  hide_ui:         { en: 'Hide UI', ja: '表示を隠す' },
  hide_ui_hint:    { en: 'Click anywhere to bring the interface back', ja: '画面をクリックすると表示が戻ります' },

  /* ── Home · clock (decorative, optional) ── */
  clock_label:     { en: 'Clock', ja: '時計' },

  /* ── Home · guided tour ── */
  how_to_use:      { en: 'How to use', ja: '使い方' },
  home_tour_1:     { en: 'Tap <b>Sub Screen</b> to shrink the world down to a small floating window — perfect for keeping it visible while you work elsewhere.', ja: '<b>サブ画面</b>をタップすると、世界を小さなウィンドウとして表示できます。他の作業をしながらでも見ていられます。' },
  home_tour_2:     { en: 'Tap <b>Hide UI</b> to clear away the title and buttons, leaving just the looping world. Click anywhere on the screen to bring everything back.', ja: '<b>表示を隠す</b>をタップすると、タイトルやボタンなどが消えて、ループ動画だけが表示されます。画面のどこかをクリックすると元の表示に戻ります。' },
  home_tour_preview: { en: 'This is how the sub screen looks', ja: 'サブ画面のイメージはこちら' },
  home_tour_m1:    { en: 'Tap <b>Tasks</b> to open today’s list. Every task you finish builds the town — clear them all and it stands complete.', ja: '<b>タスク</b>をタップすると今日の一覧が開きます。終えるたびに街の建設が進み、すべて片づけると完成します。' },
  home_tour_m2:    { en: 'The menu holds <b>Hide UI</b>, language, and your chronicle of past days.', ja: 'メニューには<b>表示を隠す</b>・言語切替・これまでの記録があります。' },

  /* ── Setup · goal date (optional first-run step, editable anytime) ── */
  how_it_works:    { en: 'How it works', ja: '使い方' },
  goal_edit_link:  { en: 'Goal', ja: '目標日' },
  goal_step_eyebrow: { en: 'A New Endeavour', ja: '新たな営み' },
  goal_step_h:     { en: 'Goal Day', ja: 'ゴールの日' },
  goal_step_p:     { en: 'Optional. A certification exam, a thesis, a test — whatever you’re counting down to. Change it anytime.', ja: '任意です。資格試験でも、卒論でも、テストでも——自分だけのカウントダウンを刻めます。あとからいつでも変更できます。' },
  goal_input_label:{ en: 'Goal date', ja: '目標日' },
  goal_label_input:{ en: 'For', ja: '目的' },
  goal_label_ph:   { en: 'e.g. Certification exam, Thesis, Test', ja: '例：資格試験、卒論、テスト' },
  goal_continue:   { en: 'Continue', ja: '次へ' },
  goal_save:       { en: 'Save', ja: '保存' },
  goal_clear:      { en: 'Clear', ja: '解除' },
  goal_none_label: { en: 'No goal set', ja: '目標未設定' },
  goal_days_left_suffix: { en: 'days to go', ja: '日後' },
  goal_today_label:{ en: 'Goal day is today', ja: '目標日は今日' },
  goal_overdue_label: { en: 'Goal day has passed', ja: '目標日を過ぎました' },
  studied_days_suffix: { en: 'days studied', ja: '日勉強した' },

  /* ── Setup · today's tasks ── */
  task_step_eyebrow: { en: "Today's Endeavour", ja: '今日の営み' },
  task_step_h:       { en: 'What will you do today?', ja: '今日は何をする？' },
  task_hint:         { en: "List what you'll do. Completing them all builds the whole town.", ja: 'やることを書き出そう。すべて終えれば街がまるごと完成します。' },
  add_task:          { en: '+ Add task', ja: '＋ タスクを追加' },
  task_ph:           { en: 'Task', ja: 'タスク' },
  begin:             { en: 'Begin', ja: 'はじめる' },
  tasks_word:        { en: 'Tasks', ja: 'タスク' },
  menu_label:        { en: 'Menu', ja: 'メニュー' },

  /* ── Setup · guided tour ── */
  tour_skip:       { en: 'Skip', ja: 'スキップ' },
  tour_back:       { en: 'Back', ja: '戻る' },
  tour_next:       { en: 'Next', ja: '次へ' },
  tour_done:       { en: 'Got it', ja: 'はじめる' },
  tour_task:       { en: 'List what you’ll do today — finishing each one raises the town, and clearing them all completes it.', ja: '今日やることを書き出します。終えるたびに建設が進み、すべて片づければ街が完成します。' },
  tour_begin:      { en: 'Seal it and begin — the town rises as you check tasks off today.', ja: 'あとは始めるだけ——タスクを終えるたびに街が育っていきます。' },

  /* ── History · Chronicle ── */
  hist_eyebrow:    { en: 'The Record of Your Labour', ja: '営みの記録' },
  hist_h1:         { en: 'Your Chronicle', ja: 'あなたの年代記' },
  hist_sub:        { en: 'Every day you showed up, kept as a record.', ja: '積み重ねた日々を、記録として残しています。' },
  stage_word:      { en: 'Stage', ja: 'ステージ' },

  /* ── Chronicle · progress calendar ── */
  cal_legend_done:    { en: 'Completed', ja: '完成' },
  cal_legend_partial: { en: 'Studied', ja: '勉強した' },
  cal_legend_blank:   { en: 'No progress', ja: '未進行' },

  /* ── World · sub screen ── */
  close_sub_screen: { en: 'Close Sub Screen', ja: 'サブ画面を閉じる' },
  cancel:           { en: 'Cancel', ja: 'キャンセル' },

  /* ── End day modal ── */
  end_ready:        { en: 'Ready to end today?', ja: '今日を終えますか？' },
  session_ended:    { en: 'Today, wrapped up.', ja: '今日はここまで。' },
  start_next_day:   { en: 'Begin Next Day', ja: '次の日を始める' },
} satisfies Record<string, Entry>;

export type I18nKey = keyof typeof dict;
