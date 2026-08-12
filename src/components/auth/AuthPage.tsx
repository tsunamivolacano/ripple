import React, { useState } from "react";
import { useRipple } from "@/context/RippleContext";
import { ALL_PERSONAS } from "@/data/ripplePersonaData";
import { Zap, Mail, Lock, ArrowRight, UserPlus, LogIn, AlertCircle, ShieldCheck, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const AuthPage: React.FC = () => {
  const { loginWithEmail, signUpWithEmail, loginDemoAccount } = useRipple();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMessage("Please provide both email and password.");
      return;
    }

    setIsLoading(true);
    const result = await loginWithEmail(loginEmail, loginPassword);
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || "Authentication failed. Please check your credentials.");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    if (!signUpEmail.trim() || !signUpPassword.trim()) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (signUpPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    const result = await signUpWithEmail(signUpEmail, signUpPassword);
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || "Registration failed. Please try again.");
    } else if (result.requiresEmailConfirmation) {
      setInfoMessage(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-6 z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-500 shadow-xl shadow-rose-900/30 mb-2">
            <Zap className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            RIPPLE
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Consequence-Aware AI Task Management System
          </p>
        </div>

        <Card className="bg-slate-900/90 border-slate-800 text-white shadow-2xl rounded-2xl backdrop-blur-md">
          <Tabs defaultValue="login" className="w-full" onValueChange={() => { setErrorMessage(null); setInfoMessage(null); }}>
            <CardHeader className="pb-3 border-b border-slate-800/80">
              <TabsList className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <TabsTrigger value="login" className="text-xs font-semibold data-[state=active]:bg-rose-600 data-[state=active]:text-white rounded-lg">
                  <LogIn className="w-3.5 h-3.5 mr-1.5" />
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="text-xs font-semibold data-[state=active]:bg-rose-600 data-[state=active]:text-white rounded-lg">
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                  Create Account
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 flex items-center gap-2 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {infoMessage && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex items-center gap-2 text-emerald-300 text-xs">
                  <MailCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{infoMessage}</span>
                </div>
              )}

              <TabsContent value="login" className="m-0 space-y-4">
                <form onSubmit={handleLogin} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-rose-400" />
                      Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="bg-slate-950 border-slate-800 text-xs text-white h-10 rounded-xl focus-visible:ring-rose-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                      Password
                    </label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="bg-slate-950 border-slate-800 text-xs text-white h-10 rounded-xl focus-visible:ring-rose-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-10 rounded-xl gap-2 shadow-lg shadow-rose-950"
                  >
                    {isLoading ? "Authenticating..." : "Sign In"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="m-0 space-y-4">
                <form onSubmit={handleSignUp} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-rose-400" />
                      Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      required
                      className="bg-slate-950 border-slate-800 text-xs text-white h-10 rounded-xl focus-visible:ring-rose-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                      Password
                    </label>
                    <Input
                      type="password"
                      placeholder="Min. 6 characters"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      required
                      className="bg-slate-950 border-slate-800 text-xs text-white h-10 rounded-xl focus-visible:ring-rose-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-10 rounded-xl gap-2 shadow-lg shadow-rose-950"
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
              </TabsContent>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-widest">
                  <span className="bg-slate-900 px-3 text-slate-400">
                    OR EXPLORE WITH DEMO PERSONA
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                {ALL_PERSONAS.map((persona) => (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => loginDemoAccount(persona.id)}
                    className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                        {persona.avatarBadge}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors">
                            {persona.name}
                          </h4>
                          <Badge variant="outline" className="text-[9px] border-indigo-500/30 text-indigo-300 bg-indigo-950/30 px-1.5 py-0">
                            Demo
                          </Badge>
                        </div>
                        <p className="text-[10px] text-slate-400">{persona.role}</p>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Tabs>
        </Card>

        <p className="text-[11px] text-center text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Secured with Supabase Auth session tokens & Row-Level Security.
        </p>
      </div>
    </div>
  );
};