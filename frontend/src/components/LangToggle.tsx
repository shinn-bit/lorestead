import { useI18n } from '../i18n/I18nContext';

/**
 * EN / 日本語 トグル。見た目は各画面スコープ(.scr-setup / .scr-world / .scr-chronicle)の
 * CSS (.langtoggle) で切り替わる。
 */
export function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="langtoggle">
      <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
      <button className={lang === 'ja' ? 'on' : ''} onClick={() => setLang('ja')}>日本語</button>
    </div>
  );
}
