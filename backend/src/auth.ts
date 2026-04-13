import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { db, TABLES, ok, err } from './shared/db';

const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION ?? 'ap-northeast-1' });
const CLIENT_ID = process.env.USER_POOL_CLIENT_ID ?? '';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') return ok({});

  const body = JSON.parse(event.body ?? '{}');
  const { action } = body;

  try {
    switch (action) {
      case 'signUp': {
        const { email, password } = body;
        const res = await cognito.send(new SignUpCommand({
          ClientId: CLIENT_ID,
          Username: email,
          Password: password,
          UserAttributes: [{ Name: 'email', Value: email }],
        }));
        return ok({ userSub: res.UserSub, confirmed: res.UserConfirmed });
      }

      case 'confirmSignUp': {
        const { email, code } = body;
        await cognito.send(new ConfirmSignUpCommand({
          ClientId: CLIENT_ID,
          Username: email,
          ConfirmationCode: code,
        }));
        return ok({ confirmed: true });
      }

      case 'signIn': {
        const { email, password } = body;
        const res = await cognito.send(new InitiateAuthCommand({
          ClientId: CLIENT_ID,
          AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
          AuthParameters: { USERNAME: email, PASSWORD: password },
        }));
        const tokens = res.AuthenticationResult;
        if (!tokens) return err('Authentication failed');

        // Users テーブルにユーザー登録（初回ログイン時）
        const sub = parseJwtSub(tokens.IdToken ?? '');
        if (sub) {
          await db.send(new PutCommand({
            TableName: TABLES.users,
            Item: { userId: sub, email, createdAt: new Date().toISOString(), currentWorld: 'prague' },
            ConditionExpression: 'attribute_not_exists(userId)',
          })).catch(() => {/* already exists */});
        }

        return ok({
          accessToken: tokens.AccessToken,
          idToken: tokens.IdToken,
          refreshToken: tokens.RefreshToken,
          expiresIn: tokens.ExpiresIn,
        });
      }

      case 'forgotPassword': {
        const { email } = body;
        await cognito.send(new ForgotPasswordCommand({ ClientId: CLIENT_ID, Username: email }));
        return ok({ sent: true });
      }

      case 'confirmForgotPassword': {
        const { email, code, newPassword } = body;
        await cognito.send(new ConfirmForgotPasswordCommand({
          ClientId: CLIENT_ID,
          Username: email,
          ConfirmationCode: code,
          Password: newPassword,
        }));
        return ok({ reset: true });
      }

      default:
        return err('Unknown action', 400);
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal error';
    return err(message, 500);
  }
}

function parseJwtSub(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
