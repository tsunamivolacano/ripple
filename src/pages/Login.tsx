import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { PERSONAS_MAP } from '@/data/ripplePersonaData';
import { useRipple } from '@/context/RippleContext';
import { Zap, ArrowRight, ShieldCheck, UserCheck, Flame, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { seedDemoPersona } = useRipple();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);

    if (error) {
      showError(error.message || 'Failed to sign in.');
    } else if (data.session) {
      showSuccess('Signed in successfully!');
      navigate('/');
    }
  };

  const handleDemoLogin = async (demoKey: 'riya' | 'aman' | 'kabir') => {
    setLoading(true);
    const persona = PERSONAS_MAP[demoKey];
    const demoEmail = `${demoKey}.demo@ripple.app`;
    const demoPassword = `${demoKey.charAt(0).toUpperCase() + demoKey.slice(1)}@2026`;

    try {
      // Attempt Sign In
      let { data, error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword
      });

      // If user doesn't exist yet, sign up
      if (error) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: demoEmail,
          password: demoPassword,
          options: {
            data: {
              name: persona.name,
              role: persona.role
            }
          }
        });

        if (signUpError) {
          showError(`Demo Login error: ${signUpError.message}`);
          setLoading(false);
          return;
        }

        data = signUpData as any;
      }

      if (data?.session || data?.user) {
        showSuccess(`Welcome! Logged in as ${persona.name}`);
        navigate('/');
      } else {
        showSuccess(`Logged in as ${persona.name}`);
        navigate('/');
      }
    } catch (e: any) {
      showError(e?.message || 'Error signing in to demo persona');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-500 flex items-center justify-center mx-auto shadow-xl shadow-rose-950">
            <Zap className="w-7 h-7 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            RIPPLE
          </h1>
          <p className="text-xs text-slate-400">
            Consequence-Aware AI Task Manager
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white">Sign In to Your Account</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Access your real-time doomsday timers, schedule, and evidence log.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-300">Email Address</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs text-white placeholder:text-slate-600 h-10"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-300">Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs text-white placeholder:text-slate-600 h-10"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-10 shadow-lg shadow-rose-950"
            >
              {loading ? 'Signing in...' : 'Log In'}
            </Button>
          </form>

          {/* Quick Demo Login Buttons */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block text-center">
              Quick Demo One-Click Login
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('riya')}
                disabled={loading}
                className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 hover:border-rose-500/60 transition-all text-left space-y-1 group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-base">🎓</span>
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <div className="font-bold text-xs text-rose-200 truncate">Riya</div>
                <div className="text-[9px] text-slate-400 truncate">Student</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('aman')}
                disabled={loading}
                className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30 hover:border-blue-500/60 transition-all text-left space-y-1 group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-base">💼</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="font-bold text-xs text-blue-200 truncate">Aman</div>
                <div className="text-[9px] text-slate-400 truncate">Corporate</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('kabir')}
                disabled={loading}
                className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-500/60 transition-all text-left space-y-1 group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-base">🚀</span>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="font-bold text-xs text-emerald-200 truncate">Kabir</div>
                <div className="text-[9px] text-slate-400 truncate">Class 7</div>
              </button>
            </div>
          </div>

          {/* Footer Link */}
          <div className="text-center pt-2 text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-rose-400 font-semibold hover:underline">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;