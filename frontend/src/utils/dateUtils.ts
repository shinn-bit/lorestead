/** ローカル日付を 'YYYY-MM-DD' に変換 */
export function localDateStr(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function todayLocalDateStr(): string {
  return localDateStr(new Date());
}

/** 'YYYY-MM-DD' 同士のローカル日数差（target - from）。target が未来なら正の値 */
export function daysBetween(fromDateStr: string, targetDateStr: string): number {
  const from = new Date(`${fromDateStr}T00:00:00`);
  const target = new Date(`${targetDateStr}T00:00:00`);
  return Math.round((target.getTime() - from.getTime()) / 86_400_000);
}
