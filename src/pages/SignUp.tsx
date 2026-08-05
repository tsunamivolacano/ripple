import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Zap, Lock, Mail, User, GraduationCap, Briefcase, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { showSuccess, showError } from '@/utils/toast';

export default function SignUp() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'corporate' | 'other'>('student');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !password || !confirmPassword) {
      showError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      showError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    const defaultIntensity = role === 'corporate' ? 'standard' : 'coach';

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          intensity_mode: defaultIntensity
        }
      }
    });

    setIsLoading(false);

    if (error) {
      showError(error.message);
    } else {
      showSuccess('Account created successfully! Let\'s set up your timetable.');
      // Redirect new users to onboarding setup flow
      navigate('/timetable');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-rose-500 selection:text-white">
      {/* Brand Header */}
      <div className="text-center mb-6 space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-500 shadow-xl shadow-rose-950/50 mb-1">
          <Zap className="w-7 h-7 text-white fill-white" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Join RIPPLE
        </h1>
        <p className="text-xs text-slate-400 font-medium max-w-sm">
          Start with a clean slate and never let hidden consequences catch you off guard again.
        </p>
      </div>

      {/* Sign Up Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-5">
        <div>
          <h2 className="text-xl font-bold text-white">Create Your Account</h2>
          <p className="text-xs text-slate-400 mt-1">
            Fresh, empty account — strictly scoped to your private Supabase profile.
          </p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Full Name
            </label>
            <Input
              placeholder="e.g. Alex Morgan"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
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
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-slate-950 border-slate-800 text-xs text-white placeholder:text-slate-600 focus:border-rose-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Profile Role</label>
            <Select value={role} onValueChange={(v: any) => setRole(v)}>
              <SelectTrigger className="bg-slate-950 border-slate-800 text-xs text-white focus:border-rose-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                <SelectItem value="student">🎓 Student (School / College)</SelectItem>
                <SelectItem value="corporate">💼 Corporate / Working Professional</SelectItem>
                <SelectItem value="other">⚡ Other / Freelancer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Password
              </label>
              <Input
                type="password"
                placeholder="Min 6 chars"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-950 border-slate-800 text-xs text-white placeholder:text-slate-600 focus:border-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Confirm
              </label>
              <Input
                type="password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-slate-950 border-slate-800 text-xs text-white placeholder:text-slate-600 focus:border-rose-500"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 mt-2 transition-all shadow-lg shadow-rose-950/60 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Creating Account...' : (
              <>
                <span>Sign Up & Start Setup</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-slate-800/80">
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-rose-400 hover:text-rose-300 font-bold underline underline-offset-4">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}