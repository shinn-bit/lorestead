/**
 * 世界の動画・静止画の配信元。
 * VITE_ASSET_BASE にCloudFrontのURL（例: https://xxxx.cloudfront.net）を設定すると
 * S3/CloudFrontから配信し、未設定なら public/ 同梱ファイルを使う。
 * 動画ファイル自体は引き続きリポジトリに残しておく（この環境変数が
 * 未設定・無効な場合でも同梱ファイルへのフォールバックが効くように）。
 */
export const ASSET_BASE: string = (import.meta.env.VITE_ASSET_BASE as string | undefined)?.replace(/\/$/, '') ?? '';
