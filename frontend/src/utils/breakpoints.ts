/**
 * コンパクト（モバイル）レイアウトの判定。
 *
 * styles/theme.css の
 *   `@media (max-width: 640px), (max-height: 560px) and (max-width: 1024px)`
 * と必ず同じ条件にすること。CSS側だけを変えると、モバイル用のUIが表示されて
 * いるのに JS はデスクトップ用の要素（.info / .ledger など＝display:none）を
 * 掴もうとする、という不整合が起きる（例：ホームのツアーのスポットライト）。
 *
 * 第2条件はスマホの横持ち（幅はあるが高さが無い）。タブレット横（1024×768）は
 * 高さが足りるので該当しない。
 */
export const COMPACT_MEDIA_QUERY = '(max-width: 640px), (max-height: 560px) and (max-width: 1024px)';

export function isCompactLayout(): boolean {
  return window.matchMedia(COMPACT_MEDIA_QUERY).matches;
}
