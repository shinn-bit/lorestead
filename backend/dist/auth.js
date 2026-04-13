"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/auth.ts
var auth_exports = {};
__export(auth_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(auth_exports);
var import_client_cognito_identity_provider = require("@aws-sdk/client-cognito-identity-provider");
var import_lib_dynamodb2 = require("@aws-sdk/lib-dynamodb");

// src/shared/db.ts
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var client = new import_client_dynamodb.DynamoDBClient({ region: process.env.AWS_REGION ?? "ap-northeast-1" });
var db = import_lib_dynamodb.DynamoDBDocumentClient.from(client);
var TABLES = {
  users: process.env.USERS_TABLE ?? "lorestead-users",
  sessions: process.env.SESSIONS_TABLE ?? "lorestead-sessions",
  worldProgress: process.env.WORLD_PROGRESS_TABLE ?? "lorestead-world-progress"
};
function ok(body, statusCode = 200) {
  return {
    statusCode,
    headers: cors(),
    body: JSON.stringify(body)
  };
}
function err(message, statusCode = 400) {
  return {
    statusCode,
    headers: cors(),
    body: JSON.stringify({ error: message })
  };
}
function cors() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  };
}

// src/auth.ts
var cognito = new import_client_cognito_identity_provider.CognitoIdentityProviderClient({ region: process.env.AWS_REGION ?? "ap-northeast-1" });
var CLIENT_ID = process.env.USER_POOL_CLIENT_ID ?? "";
async function handler(event) {
  if (event.httpMethod === "OPTIONS") return ok({});
  const body = JSON.parse(event.body ?? "{}");
  const { action } = body;
  try {
    switch (action) {
      case "signUp": {
        const { email, password } = body;
        const res = await cognito.send(new import_client_cognito_identity_provider.SignUpCommand({
          ClientId: CLIENT_ID,
          Username: email,
          Password: password,
          UserAttributes: [{ Name: "email", Value: email }]
        }));
        return ok({ userSub: res.UserSub, confirmed: res.UserConfirmed });
      }
      case "confirmSignUp": {
        const { email, code } = body;
        await cognito.send(new import_client_cognito_identity_provider.ConfirmSignUpCommand({
          ClientId: CLIENT_ID,
          Username: email,
          ConfirmationCode: code
        }));
        return ok({ confirmed: true });
      }
      case "signIn": {
        const { email, password } = body;
        const res = await cognito.send(new import_client_cognito_identity_provider.InitiateAuthCommand({
          ClientId: CLIENT_ID,
          AuthFlow: import_client_cognito_identity_provider.AuthFlowType.USER_PASSWORD_AUTH,
          AuthParameters: { USERNAME: email, PASSWORD: password }
        }));
        const tokens = res.AuthenticationResult;
        if (!tokens) return err("Authentication failed");
        const sub = parseJwtSub(tokens.IdToken ?? "");
        if (sub) {
          await db.send(new import_lib_dynamodb2.PutCommand({
            TableName: TABLES.users,
            Item: { userId: sub, email, createdAt: (/* @__PURE__ */ new Date()).toISOString(), currentWorld: "prague" },
            ConditionExpression: "attribute_not_exists(userId)"
          })).catch(() => {
          });
        }
        return ok({
          accessToken: tokens.AccessToken,
          idToken: tokens.IdToken,
          refreshToken: tokens.RefreshToken,
          expiresIn: tokens.ExpiresIn
        });
      }
      case "forgotPassword": {
        const { email } = body;
        await cognito.send(new import_client_cognito_identity_provider.ForgotPasswordCommand({ ClientId: CLIENT_ID, Username: email }));
        return ok({ sent: true });
      }
      case "confirmForgotPassword": {
        const { email, code, newPassword } = body;
        await cognito.send(new import_client_cognito_identity_provider.ConfirmForgotPasswordCommand({
          ClientId: CLIENT_ID,
          Username: email,
          ConfirmationCode: code,
          Password: newPassword
        }));
        return ok({ reset: true });
      }
      default:
        return err("Unknown action", 400);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal error";
    return err(message, 500);
  }
}
function parseJwtSub(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
