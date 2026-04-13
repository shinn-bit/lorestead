import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

type Screen = 'signIn' | 'signUp' | 'confirm';

interface Props {
  onClose: () => void;
}

export function AuthModal({ onClose }: Props) {
  const { signIn, signUp, confirmSignUp } = useAuth();
  const [screen, setScreen] = useState<Screen>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async () => {
    setError('');
    setLoading(true);
    try {
      if (screen === 'signIn') {
        await signIn(email, password);
        onClose();
      } else if (screen === 'signUp') {
        const { needsConfirm } = await signUp(email, password);
        if (needsConfirm) setScreen('confirm');
        else onClose();
      } else {
        await confirmSignUp(email, code);
        await signIn(email, password);
        onClose();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="flex flex-col gap-4 p-6 rounded-2xl w-full max-w-xs"
        style={{
          background: 'rgba(12,12,16,0.95)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-white text-sm font-medium">
            {screen === 'signIn' ? 'Sign In' : screen === 'signUp' ? 'Create Account' : 'Verify Email'}
          </h2>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-xs">✕</button>
        </div>

        {screen !== 'confirm' ? (
          <>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-sm text-white"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handle()}
              className="px-3 py-2.5 rounded-xl text-sm text-white"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }}
            />
          </>
        ) : (
          <input
            type="text"
            placeholder="Verification code (check email)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handle()}
            className="px-3 py-2.5 rounded-xl text-sm text-white"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }}
          />
        )}

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <button
          onClick={handle}
          disabled={loading}
          className="py-3 rounded-xl text-sm font-medium transition-all"
          style={{ background: loading ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.9)', color: '#000' }}
        >
          {loading ? '...' : screen === 'signIn' ? 'Sign In' : screen === 'signUp' ? 'Create Account' : 'Verify'}
        </button>

        {screen === 'signIn' && (
          <button onClick={() => setScreen('signUp')} className="text-xs text-white/30 hover:text-white/60 transition-colors">
            No account? Sign up
          </button>
        )}
        {screen === 'signUp' && (
          <button onClick={() => setScreen('signIn')} className="text-xs text-white/30 hover:text-white/60 transition-colors">
            Already have an account? Sign in
          </button>
        )}
      </div>
    </div>
  );
}
