import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { db, TABLES, ok, err } from './shared/db';
import { getUserId } from './shared/auth';
import { getCurrentStage } from './shared/stageCalculator';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') return ok({});

  const userId = await getUserId(event);
  if (!userId) return err('Unauthorized', 401);

  const worldId = event.queryStringParameters?.worldId ?? 'prague';

  // GET /progress - 進捗取得
  if (event.httpMethod === 'GET') {
    const res = await db.send(new GetCommand({
      TableName: TABLES.worldProgress,
      Key: { userId, worldId },
    }));

    if (!res.Item) {
      // 初回: 0分からスタート
      return ok({ userId, worldId, accumulatedMinutes: 0, currentStage: 1, isCompleted: false });
    }

    return ok(res.Item);
  }

  // PUT /progress - 進捗更新（セッション終了時に呼ぶ）
  if (event.httpMethod === 'PUT') {
    const body = JSON.parse(event.body ?? '{}');
    const { addMinutes } = body;

    if (typeof addMinutes !== 'number' || addMinutes < 0) {
      return err('Invalid addMinutes');
    }

    // 現在の進捗を取得
    const current = await db.send(new GetCommand({
      TableName: TABLES.worldProgress,
      Key: { userId, worldId },
    }));

    const prevMinutes: number = current.Item?.accumulatedMinutes ?? 0;
    const newMinutes = prevMinutes + addMinutes;
    const newStage = getCurrentStage(newMinutes);
    const isCompleted = newStage >= 9;
    const now = new Date().toISOString();

    await db.send(new PutCommand({
      TableName: TABLES.worldProgress,
      Item: {
        userId,
        worldId,
        accumulatedMinutes: newMinutes,
        currentStage: newStage,
        isCompleted,
        updatedAt: now,
        completedAt: isCompleted && !current.Item?.completedAt ? now : (current.Item?.completedAt ?? null),
      },
    }));

    return ok({ accumulatedMinutes: newMinutes, currentStage: newStage, isCompleted });
  }

  return err('Method not allowed', 405);
}
