import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { dict, type Lang, type I18nKey } from './dict';

const LS_KEY = 'lorestead_lang';

/** ブラウザの言語設定から初期値を推定する（日本語系ロケールのみ 'ja'、それ以外は 'en'） */
function detectLang(): Lang {
  try {
    const nav = navigator.language ?? (navigator.languages?.[0] ?? '');
    return nav.toLowerCase().startsWith('ja') ? 'ja' : 'en';
  } catch {
    return 'en';
  }
}

function loadLang(): Lang {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored === 'ja' || stored === 'en') return stored;
  } catch { /* ignore */ }
  return detectLang();
}

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: I18nKey) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => loadLang());

  // body.lang-ja で日本語フォントへ切り替え（テーマCSS側で参照）
  useEffect(() => {
    document.documentElement.lang = lang;
    document.body.classList.toggle('lang-ja', lang === 'ja');
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    try { localStorage.setItem(LS_KEY, l); } catch { /* ignore */ }
    setLangState(l);
  }, []);

  const t = useCallback(
    (key: I18nKey) => {
      const entry = dict[key];
      if (!entry) return '';
      return entry[lang] ?? entry.en;
    },
    [lang],
  );

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
