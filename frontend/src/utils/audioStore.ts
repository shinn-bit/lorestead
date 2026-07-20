const KEY = 'lorestead_audio_allowed';

/** マイクボタンで音声を許可しているか（既定はオフ） */
export function isAudioAllowed(): boolean {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}

export function setAudioAllowed(allowed: boolean): void {
  try { localStorage.setItem(KEY, allowed ? '1' : '0'); } catch { /* ignore */ }
}
