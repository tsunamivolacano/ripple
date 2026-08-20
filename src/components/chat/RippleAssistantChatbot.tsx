import React, { useState, useRef, useEffect } from 'react';
import { useRipple } from '@/context/RippleContext';
import { computeDailyStudySummaries } from '@/utils/studyDebtUtils';
import { 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  HelpCircle, 
  ChevronRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  actionKey?: string;
  chips?: string[];
}

const DEFAULT_CHIPS = [
  'What is my study debt status today?',
  'Explain the Case File',
  'How does the Debt Ledger work?',
  'What is my recommended study goal tomorrow?',
  'How does the Doomsday Gauge work?'
];

export const RippleAssistantChatbot: React.FC = () => {
  const { 
    startTutorial, 
    studyLogs, 
    tasks, 
    debt, 
    evidenceEntries, 
    settings 
  } = useRipple();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-msg',
      sender: 'bot',
      text: "👋 Hi! I'm **RIPPLE AI**, your study and consequence awareness coach. I track your real study hours in Supabase, your **Case File** study context, and your **Debt Ledger** study deficit.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      chips: DEFAULT_CHIPS
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Compute live user stats
  const totalStudyMinutes = studyLogs.reduce((acc, l) => acc + (Number(l.durationMinutes) || 0), 0);
  const totalStudyHours = (totalStudyMinutes / 60).toFixed(1);
  const dailyTarget = settings.dailyStudyTargetHours || 3.0;

  const { summaries, totalWeekCompletedHours, totalWeekShortfall, recommendedNextDayTarget } = computeDailyStudySummaries(
    studyLogs,
    dailyTarget
  );

  const activeTasksCount = tasks.filter((t) => t.status !== 'completed').length;
  const criticalTasksCount = tasks.filter((t) => t.status === 'critical' || t.status === 'too_late').length;

  const generateDataDrivenReply = (query: string): string => {
    const q = query.toLowerCase();

    // 1. Case File explanation
    if (q.includes('case file') || q.includes('evidence') || q.includes('context')) {
      const entriesCount = evidenceEntries.length;
      const onTimeCount = evidenceEntries.filter((e) => e.wasOnTime).length;
      const accuracyRate = entriesCount > 0 ? Math.round((onTimeCount / entriesCount) * 100) : 100;

      return `📁 **The Case File is your comprehensive study context dossier:**\n\n` +
        `• **What it is**: It records your overall academic context, past assignment deadlines, predicted AI consequences vs. actual outcomes, and personal teacher strictness factors.\n` +
        `• **Your Live Case File Status**: You have **${entriesCount} logged case file entries** with an **on-time rate of ${accuracyRate}%**.\n` +
        `• **Purpose**: It calibrates your personal velocity multiplier so RIPPLE knows your realistic pace and prevents deadline blindspots.`;
    }

    // 2. Debt Ledger explanation
    if (q.includes('debt') || q.includes('ledger') || q.includes('deficit') || q.includes('shortfall') || q.includes('behind')) {
      return `📉 **The Debt Ledger tracks unfinished study time and task shortfalls (NOT financial debt!):**\n\n` +
        `• **Your Total Hours Behind**: **${debt.totalHoursBehind} hours**\n` +
        `• **7-Day Study Shortfall**: **${totalWeekShortfall} hours** behind your daily ${dailyTarget}h goal\n` +
        `• **Compounding Risk Score**: **${debt.compoundingScore} / 100**\n\n` +
        `💡 **How to Reduce It**: Whenever you complete Focus Sprints or study extra, this deficit reduces in real time!`;
    }

    // 3. Recommended Study Goal / Plan
    if (q.includes('recommend') || q.includes('tomorrow') || q.includes('target') || q.includes('goal')) {
      return `🎯 **Your Personalized Study Plan & Target Recommendation:**\n\n` +
        `• **Standard Daily Goal**: ${dailyTarget} hours\n` +
        `• **Past 7-Day Completed Study**: ${totalWeekCompletedHours} hours across ${studyLogs.length} sessions\n` +
        `• **Current Shortfall Deficit**: ${totalWeekShortfall} hours\n` +
        `• **Adaptive Recommendation Tomorrow**: **${recommendedNextDayTarget} hours**\n\n` +
        `*Why this recommendation?* Instead of forcing you to make up all ${totalWeekShortfall} hours at once, RIPPLE gently adds +${(recommendedNextDayTarget - dailyTarget).toFixed(1)}h to gradually clear debt without burnout.`;
    }

    // 4. Doomsday Gauge / War Room
    if (q.includes('doomsday') || q.includes('gauge') || q.includes('war room') || q.includes('ring')) {
      return `⏰ **The Doomsday Gauge is your multi-ring deadline buffer dial:**\n\n` +
        `• **Outer Ring**: Remaining time buffer ratio (Time Left ÷ Estimated Work).\n` +
        `• **Academic Ring**: Teacher strictness risk & grade weight penalty.\n` +
        `• **Physical Ring**: Sleep and late-night exhaustion penalty.\n\n` +
        `You currently have **${activeTasksCount} active tasks** (${criticalTasksCount} in critical buffer status).`;
    }

    // 5. Total study hours / status
    if (q.includes('study') || q.includes('hours') || q.includes('log') || q.includes('time')) {
      return `📊 **Your Persistent Supabase Study Record:**\n\n` +
        `• **All-Time Logged Study**: **${totalStudyHours} hours** (${studyLogs.length} recorded sessions)\n` +
        `• **This Week Completed**: **${totalWeekCompletedHours} hours**\n` +
        `• **Daily Goal**: **${dailyTarget} hours/day**\n\n` +
        `Every session logged from Focus Sprints or manual entry is permanently saved and will never be lost on reload!`;
    }

    // Fallback overview
    return `👋 **RIPPLE AI Study Assistant Summary:**\n\n` +
      `• **Total Study Recorded in Supabase**: ${totalStudyHours} hrs\n` +
      `• **Current Study Deficit in Debt Ledger**: ${totalWeekShortfall} hrs\n` +
      `• **Recommended Study Target Tomorrow**: ${recommendedNextDayTarget} hrs\n` +
      `• **Case File Entries**: ${evidenceEntries.length} entries\n\n` +
      `Ask me about your **Case File**, **Debt Ledger**, **Doomsday Gauges**, or **Study Recommendations**!`;
  };

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');

    setTimeout(() => {
      const lower = query.toLowerCase();

      if (lower.includes('tour') || lower.includes('tutorial') || lower.includes('walkthrough')) {
        startTutorial();
        const botReply: Message = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: "🚀 I've launched the **Interactive Guided Tour** for you! Follow the highlighted steps on your screen.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          chips: DEFAULT_CHIPS
        };
        setMessages((prev) => [...prev, botReply]);
        return;
      }

      const answer = generateDataDrivenReply(query);
      const botReply: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        chips: DEFAULT_CHIPS
      };
      setMessages((prev) => [...prev, botReply]);
    }, 250);
  };

  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={idx} className={line === '' ? 'h-2' : 'mb-1 leading-relaxed'}>
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-extrabold text-white">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className="fixed bottom-5 right-5 z-50" data-tour="ai-chatbot">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 px-5 rounded-full bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white font-bold text-xs shadow-2xl shadow-rose-950 flex items-center gap-2.5 transition-all hover:scale-105 group border border-white/20"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="tracking-wide">Ask RIPPLE AI</span>
          <Badge className="bg-amber-400 text-slate-950 text-[10px] font-mono px-1.5 py-0 font-bold ml-1">
            Live Data
          </Badge>
        </Button>
      )}

      {/* Expandable Chat Dialog Window */}
      {isOpen && (
        <div
          className={`bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col transition-all duration-300 overflow-hidden ${
            isExpanded
              ? 'w-[90vw] sm:w-[600px] h-[80vh] max-h-[700px]'
              : 'w-[92vw] sm:w-[420px] h-[520px]'
          }`}
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-white">RIPPLE AI Coach</h3>
                  <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-400 bg-emerald-950/40">
                    Supabase Live
                  </Badge>
                </div>
                <p className="text-[10px] text-slate-400">Context-aware study intelligence & deficit tracker</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-slate-400 hover:text-white h-8 w-8 rounded-lg"
                title={isExpanded ? 'Minimize' : 'Maximize'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white h-8 w-8 rounded-lg"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-slate-950/90">
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isBot ? 'justify-start' : 'justify-end'}`}
                >
                  {isBot && (
                    <div className="w-7 h-7 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div className={`max-w-[85%] space-y-2`}>
                    <div
                      className={`p-3.5 rounded-2xl text-xs ${
                        isBot
                          ? 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm shadow-md'
                          : 'bg-rose-600 text-white font-medium rounded-tr-sm shadow-lg shadow-rose-950'
                      }`}
                    >
                      {renderFormattedText(msg.text)}
                      <span
                        className={`text-[9px] block text-right mt-1.5 ${
                          isBot ? 'text-slate-500' : 'text-rose-200'
                        }`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>

                    {/* Quick Suggestion Chips */}
                    {isBot && msg.chips && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.chips.map((chip, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() => handleSend(chip)}
                            className="text-[10px] font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 px-2.5 py-1 rounded-full transition-all flex items-center gap-1 group"
                          >
                            <span>{chip}</span>
                            <ChevronRight className="w-3 h-3 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {!isBot && (
                    <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips Bar */}
          <div className="px-3 py-1.5 bg-slate-900/90 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleSend('Explain the Case File')}
              className="text-[10px] text-indigo-300 hover:text-white bg-indigo-950/60 px-2 py-1 rounded-lg border border-indigo-500/40 shrink-0 font-semibold"
            >
              📁 Case File
            </button>

            <button
              onClick={() => handleSend('How does the Debt Ledger work?')}
              className="text-[10px] text-purple-300 hover:text-white bg-purple-950/60 px-2 py-1 rounded-lg border border-purple-500/40 shrink-0 font-semibold"
            >
              📉 Debt Ledger
            </button>

            <button
              onClick={() => handleSend('What is my recommended study goal tomorrow?')}
              className="text-[10px] text-emerald-300 hover:text-white bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-500/40 shrink-0 font-semibold"
            >
              🎯 Adaptive Goal
            </button>
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
          >
            <Input
              placeholder="Ask about your study history, Case File, or Debt..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="bg-slate-950 border-slate-800 text-xs text-white h-10 rounded-xl focus-visible:ring-rose-500"
            />
            <Button
              type="submit"
              disabled={!inputValue.trim()}
              className="bg-rose-600 hover:bg-rose-700 text-white h-10 w-10 p-0 rounded-xl shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};