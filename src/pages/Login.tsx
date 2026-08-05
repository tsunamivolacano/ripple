import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRipple } from '@/context/RippleContext';
import { Zap, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { showSuccess, showError } from '@/utils/toast';

const DEMO_USERS = [
  { id: 'riya', name: 'Riya Verma', role: 'Student (Class 11)', badge: '🎓', email: 'riya.demo@ripple.app', password: 'Riya@2026' },
  { id: 'aman', name: 'Aman Verma', role: 'Corporate Analyst', badge: '💼', email: 'aman.demo@ripple.app', password: 'Aman@2026' },
  { id: 'kabir', name: 'Kabir Mehta', role: 'School Kid (Class 7)', badge: '🚀', email: 'kabir.demo@ripple.app', password: 'Kabir@2026' }
];

export default function Login() {
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useRipple();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isLoadingAuth && user) {
      navigate('/');
    }
  }, [user, isLoadingAuth, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return showError('Please enter both email and password.');

    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);

    if (error) showError(error.message);
    else showSuccess('Welcome back to RIPPLE!');
  };

  const handleDemoLogin = async (demo: typeof DEMO_USERS[0]) => {
    setIsLoading(true);
    let { error } = await supabase.auth.signInWithPassword({ email: demo.email, password: demo.password });

    if (error && error.message.includes('Invalid login credentials')) {
      const { error: signUpError } = await supabase.auth.signUp({
        email: demo.email,
        password: demo.password,
        options: { data: { full_name: demo.name, role: demo.id === 'aman' ? 'corporate' : 'student' } }
      });
      if (!signUpError) {
        const { error: secondTryError } = await supabase.auth.signInWithPassword({ email: demo.email, password: demo.password });
        error = secondTryError;
      }
    }

    setIsLoading(false);
    if (error) showError(`Demo login error: ${error.message}`);
    else showSuccess(`Logged in as ${demo.name}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="text-center mb-8 space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-500 shadow-xl mb-2">
          <Zap className="w-7 h-7 text-white fill-white" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">RIPPLE</h1>
        <p className="text-xs text-slate-400 font-medium max-w-sm">Consequence-Aware AI Task Manager</p>
      </div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white">Sign In</h2>
          <p className="text-xs text-slate-400 mt-1">Access your personalized timetable and AI predictions.</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Quick Demo Login
          </span>
          <div className="grid grid-cols-1 gap-2">
            {DEMO_USERS.map((demo) => (
              <button key={demo.id} onClick={() => handleDemoLogin(demo)} disabled={isLoading} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left group">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{demo.badge}</span>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-rose-300">{demo.name}</h4>
                    <p className="text-[10px] text-slate-400">{demo.role}</p>
                  </div>
                </div>
                <ArrowRight className="w-3 h-3 text-rose-400 opacity-80 group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" />Email Address</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-slate-950 border-slate-800 text-xs text-white" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-slate-400" />Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-slate-950 border-slate-800 text-xs text-white" />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5">{isLoading ? 'Signing In...' : 'Log In'}</Button>
        </form>

        <p className="text-center text-xs text-slate-400 pt-2">Don't have an account? <Link to="/signup" className="text-rose-400 font-bold hover:underline">Sign Up</Link></p>
      </div>
    </div>
  );
}