/**
 * Android の物理バックキーの受け口。
 *
 * Capacitor の既定では、戻るキーは履歴がなければアプリを即終了させる。
 * このアプリは画面遷移をReactのstateで持っていて履歴が積まれないため、
 * セットアップ途中でも一発で終了し、入力内容ごと消えてしまっていた。
 *
 * 各画面が `useBackHandler` でハンドラを登録し、後に登録されたもの（＝手前の画面）から
 * 順に呼ぶ。true を返したハンドラがあればそこで処理を打ち切る。
 * どこも処理しなかった場合の最終的な挙動（終了確認）は App 側が持つ。
 */
export type BackHandler = () => boolean;

const handlers: BackHandler[] = [];

export function registerBackHandler(handler: BackHandler): () => void {
  handlers.push(handler);
  return () => {
    const i = handlers.indexOf(handler);
    if (i >= 0) handlers.splice(i, 1);
  };
}

/** 手前の画面から順に処理を試みる。どこかで処理されたら true。 */
export function runBackHandlers(): boolean {
  for (let i = handlers.length - 1; i >= 0; i--) {
    if (handlers[i]()) return true;
  }
  return false;
}
