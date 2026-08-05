import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Zap, Lock, Mail, ArrowRight, Sparkles, UserCheck, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { showSuccess, showError } from '@/utils/toast';

const DEMO_USERS = [
  {
    id: 'riya',
    name: 'Riya Verma',
    role: 'Student (Class 11)',
    badge: '🎓',
    email: 'riya.demo@ripple.app',
    password: 'Riya@2026'
  },
  {
    id: 'aman',
    name: 'Aman Verma',
    role: 'Corporate Analyst',
    badge: '💼',
    email: 'aman.demo@ripple.app',
    password: 'Aman@2026'
  },
  {
    id: 'kabir',
    name: 'Kabir Mehta',
    role: 'School Kid (Class 7)',
    badge: '🚀',
    email: 'kabir.demo@ripple.app',
    password: 'Kabir@2026'
  }
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeDemoId, setActiveDemoId] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      showError(error.message);
    } else {
      showSuccess('Welcome back to RIPPLE!');
      navigate('/');
    }
  };

  const handleDemoLogin = async (demo: typeof DEMO_USERS[0]) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setActiveDemoId(demo.id);
    setIsLoading(true);

    // Attempt login
    let { data, error } = await supabase.auth.signInWithPassword({
      email: demo.email,
      password: demo.password,
    });

    // If demo account doesn't exist in Supabase auth yet, auto-create it!
    if (error && error.message.includes('Invalid login credentials')) {
      const signUpRes = await supabase.auth.signUp({
        email: demo.email,
        password: demo.password,
        options: {
          data: {
            full_name: demo.name,
            role: demo.id === 'aman' ? 'corporate' : 'student'
          }
        }
      });

      if (!signUpRes.error) {
        // Try sign in again
        const secondTry = await supabase.auth.signInWithPassword({
          email: demo.email,
          password: demo.password,
        });
        error = secondTry.error;
        data = secondTry.data;
      }
    }

    setIsLoading(false);
    setActiveDemoId(null);

    if (error) {
      showError(`Demo login error: ${error.message}`);
    } else {
      showSuccess(`Logged in as ${demo.name} (${demo.role})`);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-rose-500 selection:text-white">
      {/* Brand Header */}
      <div className="text-center mb-8 space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-500 shadow-xl shadow-rose-950/50 mb-2">
          <Zap className="w-7 h-7 text-white fill-white" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          RIPPLE
        </h1>
        <p className="text-xs text-slate-400 font-medium max-w-sm">
          Consequence-Aware AI Task Manager & Schedule Doomsday Clock
        </p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white">Sign In</h2>
          <p className="text-xs text-slate-400 mt-1">
            Access your personalized timetable, tasks, and AI predictions.
          </p>
        </div>

        {/* Quick Demo Login Preset Buttons */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Quick Demo Login
            </span>
            <span className="text-[10px] text-slate-500">1-Click Auto-Fill</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {DEMO_USERS.map((demo) => (
              <button
                key={demo.id}
                type="button"
                onClick={() => handleDemoLogin(demo)}
                disabled={isLoading}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{demo.badge}</span>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors">
                      {demo.name}
                    </h4>
                    <p className="text-[10px] text-slate-400">{demo.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 opacity-80 group-hover:opacity-100">
                  <span>Log In</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <span className="relative px-3 bg-slate-900 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            or sign in with email
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleLogin} className="space-y-4">
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
              className="bg-slate-950 border-slate-800 text-xs text-white placeholder:text-slate-600 focus:border-rose-500"
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
              className="bg-slate-950 border-slate-800 text-xs text-white placeholder:text-slate-600 focus:border-rose-500"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 mt-2 transition-all shadow-lg shadow-rose-950/60"
          >
            {isLoading ? 'Signing In...' : 'Log In'}
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-slate-800/80">
          <p className="text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-rose-400 hover:text-rose-300 font-bold underline underline-offset-4">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}