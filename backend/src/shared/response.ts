export function ok(body: unknown, statusCode = 200) {
  return { statusCode, headers: cors(), body: JSON.stringify(body) };
}

export function err(message: string, statusCode = 400) {
  return { statusCode, headers: cors(), body: JSON.stringify({ error: message }) };
}

export function cors() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };
}
