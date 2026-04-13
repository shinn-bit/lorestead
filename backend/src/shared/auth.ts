import { APIGatewayProxyEvent } from 'aws-lambda';
import { CognitoIdentityProviderClient, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';

const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION ?? 'ap-northeast-1' });

/** Authorization ヘッダーからuserIdを取得する */
export async function getUserId(event: APIGatewayProxyEvent): Promise<string | null> {
  const token = event.headers['Authorization'] ?? event.headers['authorization'];
  if (!token) return null;
  const accessToken = token.replace(/^Bearer\s+/i, '');
  try {
    const res = await cognito.send(new GetUserCommand({ AccessToken: accessToken }));
    const sub = res.UserAttributes?.find((a) => a.Name === 'sub')?.Value;
    return sub ?? null;
  } catch {
    return null;
  }
}
