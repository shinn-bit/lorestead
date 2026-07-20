/**
 * 世界の動画・静止画の配信元。
 * VITE_ASSET_BASE にCloudFrontのURL（例: https://xxxx.cloudfront.net）を設定すると
 * S3/CloudFrontから配信し、未設定なら従来どおり public/ 同梱ファイルを使う。
 */
export const ASSET_BASE: string = (import.meta.env.VITE_ASSET_BASE as string | undefined)?.replace(/\/$/, '') ?? '';
