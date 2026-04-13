import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authApi, progressApi } from '../api/client';

interface AuthState {
  accessToken: string | null;
  isLoggedIn: boolean;
  totalMinutes: number; // サーバー由来の累積時間
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsConfirm: boolean }>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  signOut: () => void;
  syncProgress: (addMinutes: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'lorestead_access_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY)
  );
  const [totalMinutes, setTotalMinutes] = useState(0);

  // トークンがあればサーバーから進捗を取得
  useEffect(() => {
    if (!accessToken) return;
    progressApi.get(accessToken)
      .then((p) => {
        setTotalMinutes(p.accumulatedMinutes);
        localStorage.setItem('lorestead_total_minutes', String(p.accumulatedMinutes));
      })
      .catch(() => {
        // トークン期限切れなど
        setAccessToken(null);
        localStorage.removeItem(TOKEN_KEY);
      });
  }, [accessToken]);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await authApi.signIn(email, password);
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    setAccessToken(res.accessToken);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const res = await authApi.signUp(email, password);
    return { needsConfirm: !res.confirmed };
  }, []);

  const confirmSignUp = useCallback(async (email: string, code: string) => {
    await authApi.confirmSignUp(email, code);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setAccessToken(null);
    setTotalMinutes(0);
  }, []);

  // セッション終了時にサーバーへ同期
  const syncProgress = useCallback(async (addMinutes: number) => {
    if (!accessToken || addMinutes <= 0) return;
    const res = await progressApi.update(accessToken, addMinutes);
    setTotalMinutes(res.accumulatedMinutes);
    localStorage.setItem('lorestead_total_minutes', String(res.accumulatedMinutes));
  }, [accessToken]);

  return (
    <AuthContext.Provider value={{
      accessToken,
      isLoggedIn: !!accessToken,
      totalMinutes,
      signIn,
      signUp,
      confirmSignUp,
      signOut,
      syncProgress,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
