import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Zap, GraduationCap, Briefcase, User, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'corporate' | 'other'>('student');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      showError('Please enter a valid email address.');
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

    setLoading(true);

    // Default intensity mode based on role selection
    const defaultIntensity = role === 'corporate' ? 'standard' : role === 'student' ? 'doomsday' : 'coach';

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role
        }
      }
    });

    if (error) {
      showError(error.message || 'Failed to create account.');
      setLoading(false);
      return;
    }

    if (data.user) {
      // Upsert profile and user_settings
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name,
        role
      });

      await supabase.from('user_settings').upsert({
        user_id: data.user.id,
        intensity_mode: defaultIntensity,
        is_minor_profile: role === 'student',
        weekly_digest_only: false,
        personal_velocity_multiplier: 1.0
      });

      showSuccess('Account created! Welcome to RIPPLE.');
      // Redirect new users into onboarding/timetable setup first!
      navigate('/?tab=timetable');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-500 flex items-center justify-center mx-auto shadow-xl shadow-rose-950">
            <Zap className="w-7 h-7 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Create Your Account
          </h1>
          <p className="text-xs text-slate-400">
            Start tracking deadlines with real consequence forecasts.
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-300">Full Name</Label>
              <Input
                type="text"
                placeholder="e.g. Alex Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs text-white placeholder:text-slate-600 h-10"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-300">Email Address</Label>
              <Input
                type="email"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs text-white placeholder:text-slate-600 h-10"
                required
              />
            </div>

            {/* Role Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-300">Select Profile Focus</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'student', label: 'Student', icon: GraduationCap },
                  { id: 'corporate', label: 'Corporate', icon: Briefcase },
                  { id: 'other', label: 'Other', icon: User }
                ].map((r) => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                        isSelected
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[11px] font-semibold">{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">Password</Label>
                <Input
                  type="password"
                  placeholder="Min 6 chars"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs text-white placeholder:text-slate-600 h-10"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">Confirm Password</Label>
                <Input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs text-white placeholder:text-slate-600 h-10"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-10 shadow-lg shadow-rose-950 mt-2"
            >
              {loading ? 'Creating Account...' : 'Sign Up & Set Up Timetable'}
            </Button>
          </form>

          <div className="text-center pt-2 text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-rose-400 font-semibold hover:underline">
              Log In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;