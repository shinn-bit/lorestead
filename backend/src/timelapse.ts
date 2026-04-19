import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as nodePath from 'path';
import type { Readable } from 'stream';
import { getUserId } from './shared/auth';
import { ok, err } from './shared/db';

const s3 = new S3Client({ region: process.env.AWS_REGION ?? 'ap-northeast-1' });
const FRAMES_BUCKET = process.env.FRAMES_BUCKET ?? 'lorestead-frames';
const STAGE_DURATION = 1.4; // seconds to show each frame in the timelapse

// GET /timelapse/upload-url?sessionId=xxx&frameIndex=N
async function handleUploadUrl(
  userId: string,
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  const { sessionId, frameIndex } = event.queryStringParameters ?? {};
  if (!sessionId || frameIndex === undefined) {
    return err('Missing sessionId or frameIndex');
  }

  const key = `frames/${userId}/${sessionId}/frame_${String(frameIndex).padStart(4, '0')}.jpg`;
  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: FRAMES_BUCKET, Key: key, ContentType: 'image/jpeg' }),
    { expiresIn: 300 }, // 5 minutes
  );

  return ok({ uploadUrl, key });
}

// POST /timelapse/generate
async function handleGenerate(
  userId: string,
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body ?? '{}');
  const { sessionId, frameCount, totalMinutes, sessionSeconds } = body as {
    sessionId: string;
    frameCount: number;
    totalMinutes: number;
    sessionSeconds: number;
  };

  if (!sessionId || !frameCount) return err('Missing required fields');

  const tmpDir = `/tmp/${sessionId}`;
  fs.mkdirSync(tmpDir, { recursive: true });

  // Download frames from S3 to /tmp
  const frameFiles: string[] = [];
  for (let i = 0; i < frameCount; i++) {
    const key = `frames/${userId}/${sessionId}/frame_${String(i).padStart(4, '0')}.jpg`;
    try {
      const res = await s3.send(new GetObjectCommand({ Bucket: FRAMES_BUCKET, Key: key }));
      const filePath = nodePath.join(tmpDir, `frame_${String(i).padStart(4, '0')}.jpg`);
      const chunks: Buffer[] = [];
      for await (const chunk of res.Body as Readable) chunks.push(chunk as Buffer);
      fs.writeFileSync(filePath, Buffer.concat(chunks));
      frameFiles.push(filePath);
    } catch {
      console.warn(`Frame ${i} not found, skipping`);
    }
  }

  if (frameFiles.length === 0) return err('No frames found in S3');

  // Create FFmpeg concat list
  const concatFile = nodePath.join(tmpDir, 'frames.txt');
  const concatContent = frameFiles
    .map((f) => `file '${f}'\nduration ${STAGE_DURATION}`)
    .join('\n');
  fs.writeFileSync(concatFile, concatContent);

  // Build text overlay for the last 2 seconds
  const sH = Math.floor(sessionSeconds / 3600);
  const sM = Math.floor((sessionSeconds % 3600) / 60);
  const tH = Math.floor(totalMinutes / 60);
  const tM = Math.floor(totalMinutes % 60);
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const outputPath = nodePath.join(tmpDir, 'output.mp4');
  const ffmpeg = fs.existsSync('/opt/bin/ffmpeg') ? '/opt/bin/ffmpeg' : 'ffmpeg';
  const totalDuration = frameFiles.length * STAGE_DURATION;
  const textStart = totalDuration - 2;

  execSync(
    [
      ffmpeg, '-y',
      '-f concat -safe 0',
      `-i "${concatFile}"`,
      '-vf',
      [
        'scale=1080:1080:force_original_aspect_ratio=decrease',
        'pad=1080:1080:(ow-iw)/2:(oh-ih)/2',
        'fps=30',
        // Date + session info overlay in final 2 seconds
        `drawtext=text='${dateStr}':fontsize=44:fontcolor=white:x=(w-tw)/2:y=h*0.72:enable='gte(t,${textStart})'`,
        `drawtext=text='Today  ${sH}h ${sM}m':fontsize=34:fontcolor=#C9A84C:x=(w-tw)/2:y=h*0.80:enable='gte(t,${textStart})'`,
        `drawtext=text='Total  ${tH}h ${tM}m / 20h':fontsize=30:fontcolor=white:x=(w-tw)/2:y=h*0.87:enable='gte(t,${textStart})'`,
      ].join(','),
      '-c:v libx264 -preset fast -pix_fmt yuv420p',
      `"${outputPath}"`,
    ].join(' '),
    { stdio: 'pipe' },
  );

  // Upload result to S3
  const outputKey = `timelapse/${userId}/${sessionId}/output.mp4`;
  await s3.send(new PutObjectCommand({
    Bucket: FRAMES_BUCKET,
    Key: outputKey,
    Body: fs.readFileSync(outputPath),
    ContentType: 'video/mp4',
  }));

  // Presigned download URL (1 hour)
  const downloadUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: FRAMES_BUCKET, Key: outputKey }),
    { expiresIn: 3600 },
  );

  // Cleanup /tmp
  fs.rmSync(tmpDir, { recursive: true, force: true });

  return ok({ downloadUrl });
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') return ok({});

  const userId = await getUserId(event);
  if (!userId) return err('Unauthorized', 401);

  const subPath = event.path.replace(/.*\/timelapse/, '');

  if (event.httpMethod === 'GET' && subPath === '/upload-url') {
    return handleUploadUrl(userId, event);
  }
  if (event.httpMethod === 'POST' && subPath === '/generate') {
    return handleGenerate(userId, event);
  }

  return err('Not found', 404);
}
