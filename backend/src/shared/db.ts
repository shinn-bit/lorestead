import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION ?? 'ap-northeast-1' });
export const db = DynamoDBDocumentClient.from(client);

export const TABLES = {
  users: process.env.USERS_TABLE ?? 'lorestead-users',
  sessions: process.env.SESSIONS_TABLE ?? 'lorestead-sessions',
  worldProgress: process.env.WORLD_PROGRESS_TABLE ?? 'lorestead-world-progress',
};

export function ok(body: unknown, statusCode = 200) {
  return {
    statusCode,
    headers: cors(),
    body: JSON.stringify(body),
  };
}

export function err(message: string, statusCode = 400) {
  return {
    statusCode,
    headers: cors(),
    body: JSON.stringify({ error: message }),
  };
}

function cors() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };
}
