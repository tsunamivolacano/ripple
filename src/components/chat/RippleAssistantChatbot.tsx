import React, { useState, useRef, useEffect } from 'react';
import { useRipple } from '@/context/RippleContext';
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

const KNOWLEDGE_BASE: { keywords: string[]; answer: string; chips?: string[] }[] = [
  {
    keywords: ['doomsday', 'gauge', 'dial', 'ring', 'circle', 'buffer'],
    answer: "The **Doomsday Gauge** is RIPPLE's multi-ring risk dial:\n\n1. **Outer Ring**: Shows your remaining time buffer vs. estimated task work time.\n2. **Academic Ring (Red)**: Grade weight & teacher strictness risk.\n3. **Social Ring (Yellow)**: Commitment & team impact.\n4. **Physical Ring (Purple)**: Sleep & energy penalty.\n\n• **Green**: Healthy buffer ratio (> 3.0x)\n• **Yellow**: Tight schedule (1.5x - 3.0x)\n• **Red / Pulsing**: Critical doomsday warning (< 1.5x)",
    chips: ['What is Coach vs Doomsday Mode?', 'How do I start a Focus Sprint?']
  },
  {
    keywords: ['mode', 'intensity', 'coach', 'doomsday mode', 'standard'],
    answer: "RIPPLE offers **3 AI Intensity Modes** (selectable in top navbar):\n\n• **Coach Mode**: Gentle, supportive micro-goals and encouraging feedback. Perfect when feeling overwhelmed or stressed.\n• **Standard Mode**: Objective, balanced consequence forecasts.\n• **Doomsday Mode**: Vivid, high-urgency narratives to break deadline paralysis.",
    chips: ['How does the Doomsday Gauge work?', 'What is Procrastination Debt?']
  },
  {
    keywords: ['debt', 'ledger', 'compounding', 'behind', 'score'],
    answer: "The **Procrastination Debt Ledger** tracks the hidden costs of task delays:\n\n• **Compounding Score (0-100)**: Rises when you delay or renegotiate deadlines.\n• **Total Hours Behind**: Calculated backlog of work.\n• **Streak**: Consecutive days completing tasks on time.\n\n*Tip*: Completing tasks or running 20-min catch-up sprints lowers your debt score!",
    chips: ['How do I renegotiate a deadline?', 'What are Evidence Case Files?']
  },
  {
    keywords: ['timeline', 'split', 'simulator', 'scenario', 'predict', 'consequence'],
    answer: "Clicking **Predict Consequence** on any task launches the **Split-Timeline Simulator**:\n\n• **Timeline A (Start Now)**: Shows avoided stress, grade protection, and free evening downtime.\n• **Timeline B (Delay 2 Hours)**: Simulates the late-night panic cascade, fatigue penalties, and strict teacher reactions side-by-side.",
    chips: ['How do Focus Sprints work?', 'What are Teacher Strictness Tags?']
  },
  {
    keywords: ['teacher', 'strictness', 'tag', 'stakes', 'cold call', 'notebook'],
    answer: "Teacher tags personalize AI predictions based on real human behaviors:\n\n• **Spot Cold-Calls**: Teacher puts unprepared students on the spot in class.\n• **Checks Notebook Copies**: Manual inspection at class start.\n• **Strict Locks Doors**: Strict arrival policy.\n• **Public Scolder**: Public feedback on missing work.\n\nAdding these in the **Timetable & Context** tab automatically increases risk scores for strict classes!",
    chips: ['How do I add a Timetable class?', 'What is the Evidence Log?']
  },
  {
    keywords: ['renegotiate', 'extend', 'delay', 'deadline', 'reason'],
    answer: "If you physically cannot finish a task in time, click **Predict Consequence** -> **Renegotiate Task Buffer**:\n\n1. Select an honest reason (underestimated time, burnout, or emergency).\n2. Choose a new window (+12h, +24h, +48h).\n3. RIPPLE resets the Doomsday Dial while adding a transparent +0.5h debt entry so you avoid deadline ghosting.",
    chips: ['What is Procrastination Debt?', 'How do Focus Sprints work?']
  },
  {
    keywords: ['focus', 'sprint', 'pomodoro', 'timer', 'start now'],
    answer: "Clicking **Start Now** opens **Focus Sprint Mode**:\n\n• Built-in 25-minute Pomodoro timer.\n• Live completion percentage slider.\n• When finished, triggers a **Positive Counter-Loop** celebrating avoided consequences!",
    chips: ['What is the Split-Timeline Simulator?', 'How do I log an Evidence Case File?']
  },
  {
    keywords: ['evidence', 'case file', 'log', 'rating', 'accuracy'],
    answer: "The **Evidence Case File Log** helps calibrate RIPPLE's AI accuracy:\n\n1. After a deadline passes, log the actual real-world outcome.\n2. Rate AI forecast accuracy from 1 to 5 stars.\n3. RIPPLE adjusts its personal velocity multiplier so future estimates match your actual working pace!",
    chips: ['How does Velocity Multiplier work?', 'What is Procrastination Debt?']
  },
  {
    keywords: ['calendar', 'local', 'timezone', 'month', 'week', 'day'],
    answer: "The **Live Calendar** tab combines your real-world timetable classes and task deadlines in your exact local device timezone. You can toggle between Month, Week, and Day views or filter between Tasks vs. Classes.",
    chips: ['How do I add a new task?', 'How do I add a Timetable class?']
  },
  {
    keywords: ['add', 'new task', 'create', 'assignment'],
    answer: "To add a new task:\n\n1. Click the **+ New Task** button in the top navbar.\n2. Choose **Academic Task** or **Personal / Life Goal**.\n3. Enter the title, estimated hours, and deadline.\n4. Optionally link it to a timetable class for strictness tracking!",
    chips: ['How do Teacher Strictness Tags work?', 'What is Coach vs Doomsday Mode?']
  }
];

const DEFAULT_CHIPS = [
  'How does the Doomsday Gauge work?',
  'What is Coach vs Doomsday Mode?',
  'How do Teacher Strictness tags work?',
  'What is Procrastination Debt?',
  'How do Focus Sprints work?'
];

export const RippleAssistantChatbot: React.FC = () => {
  const { startTutorial } = useRipple();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-msg',
      sender: 'bot',
      text: "👋 Hi! I'm **RIPPLE Guide**, your AI assistant. Ask me anything about Doomsday Gauges, Intensity Modes, Split Timelines, Teacher Strictness Tags, or Procrastination Debt!",
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

    // Generate intelligent response
    setTimeout(() => {
      const lowerQuery = query.toLowerCase();
      
      if (lowerQuery.includes('tour') || lowerQuery.includes('tutorial') || lowerQuery.includes('walkthrough')) {
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

      const match = KNOWLEDGE_BASE.find((kb) =>
        kb.keywords.some((kw) => lowerQuery.includes(kw))
      );

      if (match) {
        const botReply: Message = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: match.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          chips: match.chips || DEFAULT_CHIPS
        };
        setMessages((prev) => [...prev, botReply]);
      } else {
        const fallbackReply: Message = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `I'm here to help you navigate RIPPLE! Here are key areas you can ask me about:\n\n• **Doomsday Gauge & Buffers**\n• **AI Intensity Modes (Coach, Standard, Doomsday)**\n• **Split-Timeline Scenario Simulator**\n• **Teacher Strictness & Stakes Tags**\n• **Procrastination Debt Ledger**\n• **Focus Sprint Mode**`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          chips: DEFAULT_CHIPS
        };
        setMessages((prev) => [...prev, fallbackReply]);
      }
    }, 300);
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
          <span className="tracking-wide">Ask RIPPLE Assistant</span>
          <Badge className="bg-amber-400 text-slate-950 text-[10px] font-mono px-1.5 py-0 font-bold ml-1">
            AI
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
                  <h3 className="font-extrabold text-sm text-white">RIPPLE AI Assistant</h3>
                  <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-400 bg-emerald-950/40">
                    Online
                  </Badge>
                </div>
                <p className="text-[10px] text-slate-400">Ask any question about RIPPLE features</p>
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

          {/* Quick Actions Bar */}
          <div className="px-3 py-1.5 bg-slate-900/90 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={startTutorial}
              className="text-[10px] font-bold text-indigo-300 bg-indigo-950/50 hover:bg-indigo-900/80 border border-indigo-500/40 px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1"
            >
              <HelpCircle className="w-3 h-3 text-indigo-400" />
              Launch Step-by-Step Tour
            </button>

            <button
              onClick={() => handleSend('How does the Doomsday Gauge work?')}
              className="text-[10px] text-slate-400 hover:text-slate-200 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 shrink-0"
            >
              Doomsday Gauge
            </button>

            <button
              onClick={() => handleSend('What is Coach vs Doomsday Mode?')}
              className="text-[10px] text-slate-400 hover:text-slate-200 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 shrink-0"
            >
              Intensity Modes
            </button>

            <button
              onClick={() => handleSend('How do Teacher Strictness tags work?')}
              className="text-[10px] text-slate-400 hover:text-slate-200 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 shrink-0"
            >
              Teacher Tags
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
              placeholder="Ask a question about RIPPLE..."
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