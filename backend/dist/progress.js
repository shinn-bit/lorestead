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

// src/progress.ts
var progress_exports = {};
__export(progress_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(progress_exports);
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

// src/shared/stageCalculator.ts
var STAGE_THRESHOLDS = [
  { stage: 1, minutes: 0 },
  { stage: 2, minutes: 120 },
  { stage: 3, minutes: 240 },
  { stage: 4, minutes: 360 },
  { stage: 5, minutes: 540 },
  { stage: 6, minutes: 720 },
  { stage: 7, minutes: 900 },
  { stage: 8, minutes: 1080 },
  { stage: 9, minutes: 1200 }
];
function getCurrentStage(totalMinutes) {
  const stage = STAGE_THRESHOLDS.filter((t) => totalMinutes >= t.minutes).pop();
  return stage?.stage ?? 1;
}

// src/progress.ts
async function handler(event) {
  if (event.httpMethod === "OPTIONS") return ok({});
  const userId = await getUserId(event);
  if (!userId) return err("Unauthorized", 401);
  const worldId = event.queryStringParameters?.worldId ?? "prague";
  if (event.httpMethod === "GET") {
    const res = await db.send(new import_lib_dynamodb2.GetCommand({
      TableName: TABLES.worldProgress,
      Key: { userId, worldId }
    }));
    if (!res.Item) {
      return ok({ userId, worldId, accumulatedMinutes: 0, currentStage: 1, isCompleted: false });
    }
    return ok(res.Item);
  }
  if (event.httpMethod === "PUT") {
    const body = JSON.parse(event.body ?? "{}");
    const { addMinutes } = body;
    if (typeof addMinutes !== "number" || addMinutes < 0) {
      return err("Invalid addMinutes");
    }
    const current = await db.send(new import_lib_dynamodb2.GetCommand({
      TableName: TABLES.worldProgress,
      Key: { userId, worldId }
    }));
    const prevMinutes = current.Item?.accumulatedMinutes ?? 0;
    const newMinutes = prevMinutes + addMinutes;
    const newStage = getCurrentStage(newMinutes);
    const isCompleted = newStage >= 9;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await db.send(new import_lib_dynamodb2.PutCommand({
      TableName: TABLES.worldProgress,
      Item: {
        userId,
        worldId,
        accumulatedMinutes: newMinutes,
        currentStage: newStage,
        isCompleted,
        updatedAt: now,
        completedAt: isCompleted && !current.Item?.completedAt ? now : current.Item?.completedAt ?? null
      }
    }));
    return ok({ accumulatedMinutes: newMinutes, currentStage: newStage, isCompleted });
  }
  return err("Method not allowed", 405);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
