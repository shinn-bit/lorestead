import type { Lang } from '../i18n/dict';

interface Props {
  onSelect: (lang: Lang) => void;
}

/**
 * 初回起動時のみ表示する言語選択画面。Setup より前に出る。
 * まだ言語が決まっていないため、文言は英日併記の固定テキスト。
 */
export function LanguageSelectScreen({ onSelect }: Props) {
  return (
    <div className="scr-setup scr-langselect parchment">
      <main className="page">
        <span className="corner tl" /><span className="corner tr" />
        <span className="corner bl" /><span className="corner br" />

        <div className="eyebrow">LORESTEAD</div>
        <h1>Choose your language</h1>
        <p className="sub">言語を選択してください</p>
        <div className="divider"><span className="line" /><span className="mark">✦</span><span className="line r" /></div>

        <div className="langpaths">
          <button className="langpath" onClick={() => onSelect('en')}>English</button>
          <button className="langpath" onClick={() => onSelect('ja')}>日本語</button>
        </div>
      </main>
    </div>
  );
}
