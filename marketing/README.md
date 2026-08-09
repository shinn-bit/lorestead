# Lorestead — プロモ画像ジェネレーター

実際のアプリのスクリーンショットを、iPad／PCフレームに合成して SNS 投稿用・App Store 掲載用のマーケティング画像を書き出すツールです。配色・タイポグラフィはアプリ本体のデザインシステム（`frontend/src/styles/theme.css`）に準拠しています。

- **世界観**: 動画が主役、UI は写本の余白の書き込み（マルジナリア）。塗り・枠を避け、文字と金のヘアラインで構成
- **パレット**: Hearthlight（深いダーク＋琥珀）＝ダーク版 / Parchment（羊皮紙のクリーム）＝ライト版
- **フォント**: Cinzel（見出し・ワードマーク）/ EB Garamond（英字の running copy）/ Shippori Mincho（和文）

## 使い方

```bash
cd marketing
npm install          # 初回のみ（Puppeteer + Chromium を取得）
npm run render       # 全画像を out/ に書き出し
npm run list         # 画像 ID と最終ピクセルサイズを一覧表示

node render.mjs hero-landscape hero-square   # ID 指定で個別に書き出し
DEBUG_HTML=1 node render.mjs hero-square      # レンダリング前の HTML も out/ に保存（デバッグ用）
```

出力先: `marketing/out/<id>.png`

## 出力一覧

| ID | 用途 | 最終サイズ | パレット |
|----|------|-----------|---------|
| `hero-landscape` | SNS / OG カード（横長） | 2400×1350 | dark |
| `hero-square` | SNS（正方形・Instagram等） | 2400×2400 | dark |
| `appstore-1-world` | App Store: 育つ世界の画面 | 2048×2732 | dark |
| `appstore-2-home` | App Store: 台帳スタイルのタスク | 2048×2732 | dark |
| `appstore-3-growth` | App Store: 更地→完成の5段階 | 2048×2732 | dark |
| `appstore-4-setup` | App Store: 育て方の選択（羊皮紙） | 2048×2732 | light |
| `appstore-5-audience` | App Store: 対象ユーザー訴求（iPad） | 2048×2732 | dark |

App Store の 2048×2732 は 12.9 インチ iPad Pro のスクリーンショット規定サイズです。

## 構成

```
marketing/
├── images.js          ← 全画像の定義（コピー・サイズ・使用スクショ）。ここだけ触れば内容を変えられる
├── render.mjs          ← Puppeteer でレンダリング → PNG 書き出し
├── src/
│   ├── theme.js       ← デザイントークン（theme.css のミラー）
│   ├── frames.js      ← デバイスフレーム（browser / laptop / ipad）
│   ├── template.js    ← レイアウト組版（split / stacked / showcase / sequence）
│   └── assets.js      ← スクショ・静止画を data URI 化して読み込む
└── out/                ← 書き出し先（git 管理外）
```

## よくある編集

- **コピーを変える**: `images.js` の該当 spec の `headline` / `subcopy` / `body` / `eyebrow` を編集。`⟪provided⟫` 印は依頼文からの原文。
- **スクショを差し替える**: `frontend/screenshot/` に新しい PNG を置き、`images.js` の `device.src: shot('ファイル名.png')` を変更。
- **フレームを変える**: spec の `device.type` を `browser` / `laptop` / `ipad` から選ぶ。
- **画像を追加する**: `images.js` の `IMAGES` 配列に spec を1つ足すだけ。`kind` は通常 `standard`、段階フィルムストリップは `sequence`。

### サイズの仕組み

各 spec は「論理サイズ」`width`/`height`（CSS が想定する設計空間、〜1024–1200px 幅）と `scale` を持ちます。Puppeteer は 論理サイズ × scale で描画するため、SNS は @2 で 2400px、App Store は 1024×1366 @2 で 2048×2732（実寸）になります。

## 未対応（スクショ待ち）

依頼の App Store セットのうち、以下はスクリーンショットが未取得のため spec 未作成です。`frontend/screenshot/` に取得後、`images.js` に追加してください。

- 進捗カレンダー（12週）画面 … 例: `05_chronicle.png`
- 目標日カウントダウン＋ラベル画面 … 例: `06_goaldate.png`

## デバイスフレームについて

現在のスクリーンショットは全てワイド（〜2:1）のブラウザ画面のため、既定は **browser フレーム**（PC 上位互換として最も自然）です。`ipad` フレームは横向きで、`appstore-5-audience` で使用しています。縦向き iPad の枠に合わせたい場合は、縦長のスクショを別途取得する必要があります。
