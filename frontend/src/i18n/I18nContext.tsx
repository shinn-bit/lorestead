import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { dict, type Lang, type I18nKey } from './dict';

const LS_KEY = 'lorestead_lang';
const LS_CHOSEN_KEY = 'lorestead_lang_chosen';

function loadLang(): Lang {
  try {
    return localStorage.getItem(LS_KEY) === 'ja' ? 'ja' : 'en';
  } catch {
    return 'en';
  }
}

function loadLangChosen(): boolean {
  try {
    if (localStorage.getItem(LS_CHOSEN_KEY) === '1') return true;
    // 既存ユーザー：既に言語設定が保存されていれば選択済みとみなし、再表示しない
    return localStorage.getItem(LS_KEY) !== null;
  } catch {
    return false;
  }
}

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  langChosen: boolean;
  chooseLang: (l: Lang) => void;
  t: (key: I18nKey) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => loadLang());
  const [langChosen, setLangChosen] = useState<boolean>(() => loadLangChosen());

  // body.lang-ja で日本語フォントへ切り替え（テーマCSS側で参照）
  useEffect(() => {
    document.documentElement.lang = lang;
    document.body.classList.toggle('lang-ja', lang === 'ja');
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    try { localStorage.setItem(LS_KEY, l); } catch { /* ignore */ }
    setLangState(l);
  }, []);

  // 初回起動時の言語選択画面で呼ばれる：言語を確定し、以後は選択画面を表示しない
  const chooseLang = useCallback((l: Lang) => {
    setLang(l);
    try { localStorage.setItem(LS_CHOSEN_KEY, '1'); } catch { /* ignore */ }
    setLangChosen(true);
  }, [setLang]);

  const t = useCallback(
    (key: I18nKey) => {
      const entry = dict[key];
      if (!entry) return '';
      return entry[lang] ?? entry.en;
    },
    [lang],
  );

  return <I18nContext.Provider value={{ lang, setLang, langChosen, chooseLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
