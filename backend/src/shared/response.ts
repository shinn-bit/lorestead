export function ok(body: unknown, statusCode = 200) {
  return { statusCode, headers: cors(), body: JSON.stringify(body) };
}

export function err(message: string, statusCode = 400) {
  return { statusCode, headers: cors(), body: JSON.stringify({ error: message }) };
}

export function cors() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.CORS_ALLOWED_ORIGIN ?? 'https://lorestead.vercel.app',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD',
  };
}
