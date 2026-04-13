# CLAUDE.md - 集中作業Webアプリ プロジェクト設定

## このファイルについて
Claude Codeがこのプロジェクトを理解するための設定ファイルです。
開発を始める前に必ずこのファイルを読んでください。

---

## プロジェクト概要

### 何を作るか
**作業時間がそのまま「世界の成長」になる集中可視化Webアプリ**

- タイマーをスタートすると、アイソメトリック視点の中世プラハ風世界がリアルタイムに育っていく
- 世界はループ動画（MP4）で表現される。作業時間に応じて段階が切り替わる
- YouTube Study With Me動画の完全上位互換を目指す
- 「自分の作業時間が世界を育てる」という体験が核心

### ターゲットユーザー
- PCまたはタブレットで長時間勉強・作業をする20代
- Study With Me動画を流したことがある学生・社会人・リモートワーカー
- グローバル展開前提（英語UI基本）

### 使用シーン
- PCで作業しながら、タブレットのサブ画面でアプリを流す
- タブレット2画面運用（片方でテキスト・もう片方でアプリ）

---

## 技術スタック

### フロントエンド
- **言語**: TypeScript + React
- **スタイル**: Tailwind CSS
- **世界表示**: videoタグでMP4ループ動画を再生・段階に応じて切り替え
- **タイムラプス生成**: 各段階の静止画（PNG）をつなげてMP4出力
- **状態管理**: React Context または Zustand（シンプルな方を選ぶ）

### バックエンド（AWS構成）
```
ユーザー認証    : AWS Cognito
API            : AWS API Gateway + Lambda（Node.js / TypeScript）
データ保存      : AWS DynamoDB
ファイル保存    : AWS S3（ループ動画・静止画・タイムラプス動画）
フロント配信    : AWS S3 + CloudFront
```

### インフラ方針
- サーバーレス構成を優先（Lambda + DynamoDB）
- 固定費を最小化（MVP段階はほぼ無料枠内で運用）
- IaCはAWS CDKを使用（将来的に）

---

## グラフィック仕様（重要）

### 世界の表示方式
**ループ動画切り替え方式**を採用する。Canvas APIによる描画は使わない。

```
各段階ごとにMP4ループ動画が1本存在する
　→ videoタグでautoPlay・loop・mutedで再生
　→ 作業累積時間に応じて動画ファイルを切り替える
　→ 切り替え時はクロスフェードで自然につなぐ
```

### 動画ファイル一覧（9段階）
```
/assets/worlds/prague/
  stage_01.mp4  ← 更地（0時間〜）
  stage_02.mp4  ← 基礎掘削・資材搬入（累積2時間〜）
  stage_03.mp4  ← 基礎完成・低層壁（累積4時間〜）
  stage_04.mp4  ← 外壁中層・足場（累積6時間〜）
  stage_05.mp4  ← 外壁高層・クレーン（累積9時間〜）
  stage_06.mp4  ← 屋根骨組み・内部工事（累積12時間〜）
  stage_07.mp4  ← 屋根完成・尖塔工事（累積15時間〜）
  stage_08.mp4  ← 尖塔完成・仕上げ（累積18時間〜）
  stage_09.mp4  ← 完成（累積20時間）
```

### 静止画ファイル一覧（タイムラプス用）
```
/assets/worlds/prague/stills/
  stage_01.png 〜 stage_09.png
  各段階の代表フレームをPNGで保存
  → タイムラプス動画生成に使用
```

### 動画の仕様
```
形式    : MP4（H.264）
長さ    : 3〜5秒のシームレスループ（逆再生でループ）
解像度  : 1080x1080（正方形）
背景    : 黒（#000000）
音声    : なし（muted）
```

### 段階の切り替えロジック
```javascript
const STAGE_THRESHOLDS = [
  { stage: 1, minutes: 0 },
  { stage: 2, minutes: 120 },   // 2時間
  { stage: 3, minutes: 240 },   // 4時間
  { stage: 4, minutes: 360 },   // 6時間
  { stage: 5, minutes: 540 },   // 9時間
  { stage: 6, minutes: 720 },   // 12時間
  { stage: 7, minutes: 900 },   // 15時間
  { stage: 8, minutes: 1080 },  // 18時間
  { stage: 9, minutes: 1200 },  // 20時間（完成）
];

function getCurrentStage(totalMinutes: number): number {
  const stage = STAGE_THRESHOLDS
    .filter(t => totalMinutes >= t.minutes)
    .pop();
  return stage?.stage ?? 1;
}
```

### 動画切り替えの実装方針
```
切り替え時はクロスフェード（0.5〜1秒）
　→ 2つのvideoタグを重ねてopacityをアニメーション
　→ 切り替え完了後に古い動画を停止

非アクティブ時
　→ video.playbackRate = 0.3（スローにする）
　→ またはCSSでbrightness(0.5)に暗くする

復帰時
　→ video.playbackRate = 1.0に戻す
　→ フェードインで再開
```

---

## MVPスコープ

### 必ず作るもの（MVP必須）
- [ ] タイマー機能（25・45・60・90分プリセット＋カスタム入力）
- [ ] 中世プラハの街ワールド（9段階のループ動画切り替え）
- [ ] 作業累積時間に応じた段階切り替え（クロスフェード）
- [ ] 非アクティブ検知（visibilitychange API）
- [ ] 活動タイプ選択（勉強・仕事・クリエイティブ・その他）
- [ ] 作業ログ・累積時間の保存（DynamoDB）
- [ ] タイムラプス動画生成・ダウンロード（15秒・MP4）
- [ ] ユーザー認証（Cognito・メール登録）

### MVPには入れないもの（後回し）
- 音楽・環境音
- タスク管理機能
- ソーシャル機能（フレンドなど）
- 3D回転表示
- オフライン対応
- 複数端末リアルタイム同期
- 課金機能（Stripe連携）
- 2つ目以降のワールド

### 絶対にやらないこと
- サブスクリプション課金（買い切りのみ）
- アプリ内広告
- 課金を頻繁に促すUI・ポップアップ
- 既存機能の後からの制限

---

## タイムラプス動画生成

### 仕組み
```
各段階の静止画（PNG）を順番につなげる
　stage_01.png → stage_02.png → ... → stage_09.png
　↓
ffmpeg.wasmまたはMediaRecorder APIでMP4化
　↓
テキストオーバーレイを追加
　↓
ユーザーがダウンロード・SNSシェア
```

### 動画構成（15秒）
```
0〜12秒: 各段階の静止画を順番に表示（段階ごと約1.3秒）
12〜14秒: テキスト表示
　　　　　「今日の集中時間 + 日付」
　　　　　「累積時間 XX時間 / 20時間」
14〜15秒: アプリ名 + ハッシュタグ
```

---

## コアループ設計

### 成長の単位
| 条件 | 変化 |
|------|------|
| タイマースタート | 現在の段階のループ動画が再生される |
| 累積時間が閾値を超える | 次の段階にクロスフェードで切り替わる |
| 累積20時間 | stage_09（完成）になる |

### 世界の状態
| 状態 | 演出 |
|------|------|
| アクティブ | ループ動画が通常速度で再生 |
| 非アクティブ（5〜15秒猶予） | 動画がスローになる・画面がわずかに暗くなる |
| 離脱後 | brightness(0.5)で暗くなる |
| 復帰時 | フェードインで通常再生に戻る |

### 非アクティブ検知の実装方針
```javascript
// visibilitychangeを主軸にする
// blurは補助
// beforeunloadは保存補助のみ（モバイルで信頼性低い）
// 5〜15秒の猶予を必ず入れる（誤判定防止）
// ペナルティより演出変化を中心にする
```

---

## DynamoDBデータ設計

### テーブル構成
```
Users テーブル
  PK: userId（Cognito sub）
  属性: email, createdAt, currentWorld, totalMinutes

Sessions テーブル
  PK: userId
  SK: sessionId（タイムスタンプ）
  属性: startTime, endTime, durationMinutes, activityType, worldId

WorldProgress テーブル
  PK: userId
  SK: worldId
  属性: accumulatedMinutes, currentStage(1-9), completedAt, isCompleted
```

---

## ファイル構成（推奨）

```
/
├── CLAUDE.md
├── frontend/
│   ├── public/
│   │   └── assets/
│   │       └── worlds/
│   │           └── prague/
│   │               ├── stage_01.mp4 〜 stage_09.mp4
│   │               └── stills/
│   │                   └── stage_01.png 〜 stage_09.png
│   ├── src/
│   │   ├── components/
│   │   │   ├── Timer/
│   │   │   ├── World/
│   │   │   │   ├── WorldPlayer.tsx    ← videoタグ管理・切り替え
│   │   │   │   └── useWorldStage.ts  ← 段階計算ロジック
│   │   │   ├── ShareVideo/
│   │   │   │   └── TimelapseGenerator.tsx
│   │   │   └── Auth/
│   │   ├── hooks/
│   │   │   ├── useTimer.ts
│   │   │   ├── useVisibility.ts
│   │   │   └── useWorldProgress.ts
│   │   ├── utils/
│   │   │   ├── stageCalculator.ts
│   │   │   └── timelapse.ts
│   │   └── App.tsx
│   └── package.json
├── backend/
│   ├── functions/
│   │   ├── sessions/
│   │   ├── progress/
│   │   └── auth/
│   └── package.json
└── infrastructure/
```

---

## 開発方針

### コード品質
- TypeScriptを使う（型安全を優先）
- コンポーネントは小さく保つ
- videoタグの管理はWorldPlayerコンポーネントに集約する
- API呼び出しはエラーハンドリングを必ず入れる

### パフォーマンス
- ループ動画は事前にプリロードする（次の段階の動画を先読み）
- タイムラプス生成は非同期で行いUIをブロックしない
- 動画ファイルはCloudFront経由で配信（低レイテンシ）

### セキュリティ
- AWS Cognitoのトークンを適切に管理する
- S3バケットは直接公開しない（CloudFront経由）
- DynamoDBのアクセスはLambdaからのみ

### UX方針
- 初回起動から30秒以内に世界が動き始める
- 余計な説明・チュートリアルを最小化する
- タイマー起動→世界のループ動画が再生される、これだけで伝わる設計
- 課金を促すUIは一切入れない

---

## 参考情報

### 競合
- Forest：スマホ断ち型・課金設計で信頼失墜中
- Finch：TikTok戦略で月収$290万・コミュニティ重視
- Flocus：lofi音楽＋タイマー・100万ユーザー
- BetterBuildBetter：【要警戒】ドット絵×バイオーム・未リリース

### 詳細仕様
app_specification.docxを参照してください。

---

## 質問があれば
このCLAUDE.mdに書いていない判断が必要な場合は、
**必ず開発者に確認してから実装してください。**
特に以下は勝手に決めないこと：
- 課金に関わる機能
- ワールドのビジュアルデザイン
- SNSシェアのテキスト内容
- 新機能の追加
- 動画ファイルの仕様変更