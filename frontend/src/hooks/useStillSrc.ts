import { useState } from 'react';
import { getStillSrc, getBundledStillSrc } from '../utils/stageCalculator';
import type { WorldId } from '../utils/worlds';

/**
 * 静止画サムネイルの取得元を CDN → 同梱ファイル の順に試す。
 *
 * 通常は CloudFront（VITE_ASSET_BASE）から取るが、圏外だと当然読めない。
 * ネイティブアプリには stills が同梱されているので、そちらに切り替えれば
 * 通信なしでもサムネイルが出る。両方だめなら src は undefined になり、
 * 呼び出し側のプレースホルダーにフォールバックする。
 */
export function useStillSrc(worldId: WorldId | undefined, stage: number) {
  const [step, setStep] = useState(0);

  const candidates = [getStillSrc(worldId, stage), getBundledStillSrc(worldId, stage)]
    .filter((s): s is string => !!s)
    // VITE_ASSET_BASE 未設定なら両者が同じパスになるので重複を除く
    .filter((s, i, arr) => arr.indexOf(s) === i);

  return {
    src: candidates[step],
    onError: () => setStep((s) => s + 1),
  };
}
