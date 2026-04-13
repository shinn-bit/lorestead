const API_URL = import.meta.env.VITE_API_URL as string;

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Auth ──────────────────────────────────────────────
export const authApi = {
  signUp: (email: string, password: string) =>
    request<{ userSub: string; confirmed: boolean }>('/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'signUp', email, password }),
    }),

  confirmSignUp: (email: string, code: string) =>
    request<{ confirmed: boolean }>('/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'confirmSignUp', email, code }),
    }),

  signIn: (email: string, password: string) =>
    request<{ accessToken: string; idToken: string; refreshToken: string; expiresIn: number }>('/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'signIn', email, password }),
    }),
};

// ── Progress ──────────────────────────────────────────
export const progressApi = {
  get: (token: string) =>
    request<{ accumulatedMinutes: number; currentStage: number; isCompleted: boolean }>(
      '/progress?worldId=prague', {}, token
    ),

  update: (token: string, addMinutes: number) =>
    request<{ accumulatedMinutes: number; currentStage: number; isCompleted: boolean }>(
      '/progress', {
        method: 'PUT',
        body: JSON.stringify({ addMinutes, worldId: 'prague' }),
      }, token
    ),
};

// ── Sessions ──────────────────────────────────────────
export const sessionsApi = {
  save: (token: string, durationMinutes: number, activityType: string, startTime: string) =>
    request<{ sessionId: string; saved: boolean }>('/sessions', {
      method: 'POST',
      body: JSON.stringify({ durationMinutes, activityType, startTime, worldId: 'prague' }),
    }, token),
};
