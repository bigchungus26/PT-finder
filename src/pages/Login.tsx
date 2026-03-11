import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      toast({ title: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(trimmedEmail, trimmedPassword);

      if (error) {
        const msg = (error as { message?: string })?.message ?? '';
        let description = 'Invalid email or password. Please try again.';
        if (msg.includes('Invalid login')) {
          description = 'Invalid email or password.';
        } else if (msg.includes('Email not confirmed')) {
          description = 'Please check your email to confirm your account, then try again.';
        } else if (msg.includes('Too many requests')) {
          description = 'Too many login attempts. Please wait a moment.';
        }
        toast({ title: 'Login failed', description, variant: 'destructive' });
      } else {
        navigate('/home', { replace: true });
      }
    } catch {
      toast({ title: 'Login failed', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#0A0A0A', paddingTop: 'var(--sat)' }}
    >
      <header className="px-6 py-4">
        <Link to="/" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: '0.1em', color: '#F5F0E8' }}>
          Stackr
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 28, color: '#F5F0E8', marginBottom: 4 }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: '#888', marginBottom: 32 }}>
            Sign in to your account
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#888', marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  height: 48,
                  padding: '0 14px',
                  borderRadius: 12,
                  background: '#111',
                  border: '1px solid #1E1E1E',
                  color: '#F5F0E8',
                  fontSize: 16,
                  fontFamily: "'Manrope', sans-serif",
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#888', marginBottom: 6 }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    height: 48,
                    padding: '0 44px 0 14px',
                    borderRadius: 12,
                    background: '#111',
                    border: '1px solid #1E1E1E',
                    color: '#F5F0E8',
                    fontSize: 16,
                    fontFamily: "'Manrope', sans-serif",
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 touch-target"
                  style={{ color: '#555' }}
                >
                  {showPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 active:scale-[0.96] transition-transform"
              style={{
                height: 52,
                borderRadius: 14,
                background: loading ? 'rgba(22,163,74,0.6)' : '#16A34A',
                color: '#000',
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 16,
                marginTop: 8,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <Loader2 style={{ width: 18, height: 18, animation: 'spinRefresh 600ms linear infinite' }} />
              ) : (
                <>
                  Sign In
                  <ArrowRight style={{ width: 18, height: 18 }} />
                </>
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, color: '#555', marginTop: 24 }}>
            Don't have an account?{' '}
            <Link to="/" style={{ color: '#16A34A', fontWeight: 600 }}>
              Get Started
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
