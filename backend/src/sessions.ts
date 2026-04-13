import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { db, TABLES, ok, err } from './shared/db';
import { getUserId } from './shared/auth';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') return ok({});

  const userId = await getUserId(event);
  if (!userId) return err('Unauthorized', 401);

  // POST /sessions - セッション保存
  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body ?? '{}');
    const { durationMinutes, activityType, worldId = 'prague' } = body;

    if (typeof durationMinutes !== 'number' || durationMinutes <= 0) {
      return err('Invalid durationMinutes');
    }

    const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const now = new Date().toISOString();

    await db.send(new PutCommand({
      TableName: TABLES.sessions,
      Item: {
        userId,
        sessionId,
        startTime: body.startTime ?? now,
        endTime: now,
        durationMinutes,
        activityType: activityType ?? 'other',
        worldId,
        createdAt: now,
      },
    }));

    return ok({ sessionId, saved: true }, 201);
  }

  // GET /sessions - セッション一覧取得
  if (event.httpMethod === 'GET') {
    const limit = Number(event.queryStringParameters?.limit ?? 20);
    const res = await db.send(new QueryCommand({
      TableName: TABLES.sessions,
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
      ScanIndexForward: false,
      Limit: limit,
    }));
    return ok({ sessions: res.Items ?? [] });
  }

  return err('Method not allowed', 405);
}
