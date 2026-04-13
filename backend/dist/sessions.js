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

// src/sessions.ts
var sessions_exports = {};
__export(sessions_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(sessions_exports);
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

// src/shared/auth.ts
var import_client_cognito_identity_provider = require("@aws-sdk/client-cognito-identity-provider");
var cognito = new import_client_cognito_identity_provider.CognitoIdentityProviderClient({ region: process.env.AWS_REGION ?? "ap-northeast-1" });
async function getUserId(event) {
  const token = event.headers["Authorization"] ?? event.headers["authorization"];
  if (!token) return null;
  const accessToken = token.replace(/^Bearer\s+/i, "");
  try {
    const res = await cognito.send(new import_client_cognito_identity_provider.GetUserCommand({ AccessToken: accessToken }));
    const sub = res.UserAttributes?.find((a) => a.Name === "sub")?.Value;
    return sub ?? null;
  } catch {
    return null;
  }
}

// src/sessions.ts
async function handler(event) {
  if (event.httpMethod === "OPTIONS") return ok({});
  const userId = await getUserId(event);
  if (!userId) return err("Unauthorized", 401);
  if (event.httpMethod === "POST") {
    const body = JSON.parse(event.body ?? "{}");
    const { durationMinutes, activityType, worldId = "prague" } = body;
    if (typeof durationMinutes !== "number" || durationMinutes <= 0) {
      return err("Invalid durationMinutes");
    }
    const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await db.send(new import_lib_dynamodb2.PutCommand({
      TableName: TABLES.sessions,
      Item: {
        userId,
        sessionId,
        startTime: body.startTime ?? now,
        endTime: now,
        durationMinutes,
        activityType: activityType ?? "other",
        worldId,
        createdAt: now
      }
    }));
    return ok({ sessionId, saved: true }, 201);
  }
  if (event.httpMethod === "GET") {
    const limit = Number(event.queryStringParameters?.limit ?? 20);
    const res = await db.send(new import_lib_dynamodb2.QueryCommand({
      TableName: TABLES.sessions,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: { ":uid": userId },
      ScanIndexForward: false,
      Limit: limit
    }));
    return ok({ sessions: res.Items ?? [] });
  }
  return err("Method not allowed", 405);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
