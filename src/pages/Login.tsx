import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ensureDemoUserAndData } from '@/utils/supabaseSeed';
import { showSuccess, showError } from '@/utils/toast';
import { Zap, Mail, Lock, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        showError(error.message);
      } else if (data.user) {
        showSuccess('Logged in successfully!');
        navigate('/');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (personaId: string, emailVal: string, passVal: string, nameVal: string, roleVal: string) => {
    setDemoLoading(personaId);
    try {
      await ensureDemoUserAndData(personaId, emailVal, passVal, nameVal, roleVal);
      showSuccess(`Logged in as demo profile: ${nameVal}`);
      navigate('/');
    } catch (err: any) {
      showError(err.message || 'Demo login failed');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 selection:bg-rose-500 selection:text-white">
      <div className="w-full max-w-md space-y-8">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-500 shadow-xl shadow-rose-950/50">
            <Zap className="w-6 h-6 text-white fill-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Welcome back to RIPPLE
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Consequence-Aware AI Task Management. Sign in to sync your Doomsday Clocks across devices.
          </p>
        </div>

        {/* Quick Demo Logins Section */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Quick Demo Login
            </span>
            <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400 bg-amber-950/30">
              Instant Seed
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={!!demoLoading}
              onClick={() => handleQuickDemo('riya', 'riya.demo@ripple.app', 'Riya@2026', 'Riya Verma', 'Class 11 Student')}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 transition-all text-left space-y-1 group disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <span className="text-base">🎓</span>
                {demoLoading === 'riya' && <Loader2 className="w-3 h-3 text-rose-400 animate-spin" />}
              </div>
              <h4 className="text-xs font-bold text-white group-hover:text-rose-300">Riya</h4>
              <p className="text-[10px] text-slate-400">Class 11</p>
            </button>

            <button
              type="button"
              disabled={!!demoLoading}
              onClick={() => handleQuickDemo('aman', 'aman.demo@ripple.app', 'Aman@2026', 'Aman Verma', 'Product Analyst')}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition-all text-left space-y-1 group disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <span className="text-base">💼</span>
                {demoLoading === 'aman' && <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />}
              </div>
              <h4 className="text-xs font-bold text-white group-hover:text-blue-300">Aman</h4>
              <p className="text-[10px] text-slate-400">Corporate</p>
            </button>

            <button
              type="button"
              disabled={!!demoLoading}
              onClick={() => handleQuickDemo('kabir', 'kabir.demo@ripple.app', 'Kabir@2026', 'Kabir Mehta', 'Class 7 Student')}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all text-left space-y-1 group disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <span className="text-base">🚀</span>
                {demoLoading === 'kabir' && <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" />}
              </div>
              <h4 className="text-xs font-bold text-white group-hover:text-emerald-300">Kabir</h4>
              <p className="text-[10px] text-slate-400">Class 7</p>
            </button>
          </div>
        </div>

        {/* Standard Email/Password Form */}
        <form onSubmit={handleLogin} className="space-y-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Email Address
            </label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-slate-950 border-slate-800 text-xs text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-slate-950 border-slate-800 text-xs text-white"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs py-2.5 gap-2 mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Log In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        {/* Footer Link to Sign Up */}
        <div className="text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/signup" className="text-rose-400 font-semibold hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}