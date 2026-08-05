"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRipple } from '@/context/RippleContext';
import { Zap, Lock, Mail, User, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { showSuccess, showError } from '@/utils/toast';

export default function SignUp() {
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useRipple();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'corporate' | 'other'>('student');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isLoadingAuth && user) {
      navigate('/');
    }
  }, [user, isLoadingAuth, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !password) {
      showError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      showError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role
          }
        }
      });

      if (error) throw error;
      
      showSuccess('Account created! Welcome to RIPPLE.');
      navigate('/timetable');
    } catch (error: any) {
      showError(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-rose-500 selection:text-white">
      <div className="text-center mb-8 space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-500 shadow-xl shadow-rose-950/50 mb-2">
          <Zap className="w-7 h-7 text-white fill-white" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">RIPPLE</h1>
        <p className="text-xs text-slate-400 font-medium max-w-sm">Consequence-Aware AI Task Manager</p>
      </div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-bold text-white">Create Account</h2>
          <p className="text-xs text-slate-400 mt-1">Join the war room and beat the doomsday clock.</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Full Name
            </label>
            <Input 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              required 
              placeholder="Alex Morgan"
              className="bg-slate-950 border-slate-800 text-xs text-white placeholder:text-slate-600 focus:border-rose-500" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Email Address
            </label>
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="alex@example.com"
              className="bg-slate-950 border-slate-800 text-xs text-white placeholder:text-slate-600 focus:border-rose-500" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Focus Profile</label>
            <Select value={role} onValueChange={(v: any) => setRole(v)}>
              <SelectTrigger className="bg-slate-950 border-slate-800 text-xs text-white focus:border-rose-500">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                <SelectItem value="student">🎓 Student (School / College)</SelectItem>
                <SelectItem value="corporate">💼 Corporate / Professional</SelectItem>
                <SelectItem value="other">⚡ Other / Freelancer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
                className="bg-slate-950 border-slate-800 text-xs text-white placeholder:text-slate-600 focus:border-rose-500" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Confirm</label>
              <Input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
                placeholder="••••••••"
                className="bg-slate-950 border-slate-800 text-xs text-white placeholder:text-slate-600 focus:border-rose-500" 
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading} 
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 shadow-lg shadow-rose-950/50 mt-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <span className="flex items-center gap-2">
                Sign Up & Start Setup <ArrowRight className="w-3.5 h-3.5" />
              </span>
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
          Already have an account? <Link to="/login" className="text-rose-400 font-bold hover:underline">Log In</Link>
        </p>
      </div>
    </div>
  );
}