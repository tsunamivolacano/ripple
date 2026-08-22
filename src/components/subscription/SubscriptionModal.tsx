import React, { useState } from 'react';
import { 
  Crown, 
  Check, 
  X, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  CreditCard, 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle,
  Clock,
  Flame,
  Bell,
  BookOpen
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { safeGetStorage, safeSetStorage } from '@/utils/storageUtils';
import { showSuccess, showError } from '@/utils/toast';

export type SubscriptionTier = 'free' | 'lite' | 'pro';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PlanDetails {
  id: SubscriptionTier;
  name: string;
  badge: string;
  priceMonthly: number;
  priceAnnualMonthly: number; // discounted rate
  tagline: string;
  popular?: boolean;
  accentColor: string;
  borderColor: string;
  bgGradient: string;
  features: string[];
}

const PLANS: PlanDetails[] = [
  {
    id: 'free',
    name: 'Free Student',
    badge: 'Standard Starter',
    priceMonthly: 0,
    priceAnnualMonthly: 0,
    tagline: 'Core consequence forecasting and daily focus timer.',
    accentColor: 'text-slate-300',
    borderColor: 'border-slate-800',
    bgGradient: 'bg-slate-900/60',
    features: [
      'Up to 10 Active Tasks & Activities',
      'Standard & Coach Intensity Modes',
      '3 Daily AI Consequence Scenario Forecasts',
      '25-Min Pomodoro Focus Timer',
      'Basic Timetable Matrix (Up to 5 slots)',
      'Local Storage & Supabase Sync'
    ]
  },
  {
    id: 'lite',
    name: 'Lite Scholar',
    badge: 'Most Popular',
    priceMonthly: 99,
    priceAnnualMonthly: 79,
    tagline: 'High-urgency Doomsday mode & unlimited background push alerts.',
    popular: true,
    accentColor: 'text-rose-400',
    borderColor: 'border-rose-500/50',
    bgGradient: 'bg-gradient-to-b from-rose-950/40 via-slate-900 to-slate-950',
    features: [
      'Unlimited Tasks, Schedules & Activities',
      'Full Access to High-Urgency Doomsday Mode',
      'Unlimited AI Consequence & Split-Timeline Simulations',
      'Background Web Push & Overdue Deadline Reminders',
      'Comprehensive Evidence Case File Logging',
      'Full Study Tracker & Shortfall Deficit Ledger',
      'Standard Priority Support'
    ]
  },
  {
    id: 'pro',
    name: 'Pro Academic Master',
    badge: 'Complete AI Power',
    priceMonthly: 199,
    priceAnnualMonthly: 159,
    tagline: 'Deep personal velocity calibration & custom AI assistant answers.',
    accentColor: 'text-purple-400',
    borderColor: 'border-purple-500/60',
    bgGradient: 'bg-gradient-to-b from-purple-950/50 via-slate-900 to-slate-950',
    features: [
      'Everything in Lite Scholar',
      'Advanced Personal Velocity Multiplier Calibration',
      'Unlimited RIPPLE AI Study Coach Conversations',
      'Multi-Ring Live Doomsday Widget customizations',
      'Exportable Evidence Case Files & Study Reports (PDF/CSV)',
      'Google Calendar & ICS 2-Way Sync Integration',
      'VIP Direct Priority Support & Early Feature Access'
    ]
  }
];

interface ComparisonRow {
  feature: string;
  category: string;
  free: string | boolean;
  lite: string | boolean;
  pro: string | boolean;
}

const COMPARISON_DATA: ComparisonRow[] = [
  { feature: 'Active Task Limit', category: 'Capacity', free: '10 Tasks', lite: 'Unlimited', pro: 'Unlimited' },
  { feature: 'AI Consequence Forecasts', category: 'AI Intelligence', free: '3 / Day', lite: 'Unlimited', pro: 'Unlimited' },
  { feature: 'Intensity Modes (Coach, Standard)', category: 'AI Intelligence', free: true, lite: true, pro: true },
  { feature: 'Doomsday High-Urgency Framing', category: 'AI Intelligence', free: false, lite: true, pro: true },
  { feature: 'Split-Timeline Simulator', category: 'AI Intelligence', free: 'Basic (1x/day)', lite: 'Unlimited', pro: 'Unlimited' },
  { feature: 'Background Web Push Reminders', category: 'Notifications', free: false, lite: true, pro: true },
  { feature: 'Study Tracker & 00:00:00 Timer', category: 'Focus & Study', free: 'Basic 25m', lite: 'Full Stopwatch + Countdown', pro: 'Custom Presets & Analytics' },
  { feature: 'Debt Ledger Shortfall Recovery', category: 'Focus & Study', free: '7-Day History', lite: '30-Day History', pro: 'All-Time Deep Trend Analysis' },
  { feature: 'Evidence Case File Dossier', category: 'Case File', free: 'Up to 5 Entries', lite: 'Unlimited Entries', pro: 'Unlimited + CSV Export' },
  { feature: 'RIPPLE AI Coach Chatbot', category: 'AI Assistant', free: '10 queries/day', lite: '50 queries/day', pro: 'Unlimited Real-Time AI' },
  { feature: 'Support Level', category: 'Assistance', free: 'Community', lite: 'Priority Email', pro: 'VIP 24/7 Priority Support' }
];

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
  const [currentPlan, setCurrentPlan] = useState<SubscriptionTier>(() => {
    return safeGetStorage<SubscriptionTier>('ripple_subscription_tier', 'free');
  });

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<PlanDetails | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');

  const handleSelectPlan = (plan: PlanDetails) => {
    if (plan.id === currentPlan) {
      showSuccess(`You are currently on the ${plan.name} plan.`);
      return;
    }
    setSelectedPlanForCheckout(plan);
  };

  const handleSimulatePayment = () => {
    if (!selectedPlanForCheckout) return;

    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setCurrentPlan(selectedPlanForCheckout.id);
      safeSetStorage('ripple_subscription_tier', selectedPlanForCheckout.id);
      showSuccess(`🎉 Payment Successful! Upgraded to ${selectedPlanForCheckout.name}.`);
      setSelectedPlanForCheckout(null);
    }, 1200);
  };

  const handleDowngradeToFree = () => {
    setCurrentPlan('free');
    safeSetStorage('ripple_subscription_tier', 'free');
    showSuccess('Switched back to Free plan.');
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-4xl rounded-3xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto no-scrollbar shadow-2xl">
          <DialogHeader className="text-center space-y-2 pb-2">
            <div className="inline-flex items-center justify-center gap-2 mx-auto px-3.5 py-1.5 rounded-full bg-gradient-to-r from-rose-500/20 via-purple-500/20 to-indigo-500/20 border border-purple-500/30">
              <Crown className="w-4 h-4 text-amber-400 animate-bounce" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                RIPPLE Subscription Management
              </span>
            </div>

            <DialogTitle className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Supercharge Your Consequence Intelligence
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Upgrade your academic toolkit with unlimited Doomsday scenario forecasts, continuous background alerts, and deep habit calibration.
            </DialogDescription>

            {/* Monthly / Annual Toggle */}
            <div className="pt-3 flex items-center justify-center gap-3">
              <div className="bg-slate-900 p-1 rounded-2xl border border-slate-800 flex items-center shadow-inner">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Monthly Billing
                </button>

                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    billingCycle === 'annual'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Annual Billing</span>
                  <Badge className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0">
                    SAVE 20%
                  </Badge>
                </button>
              </div>
            </div>
          </DialogHeader>

          {/* 3 Tier Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 my-4">
            {PLANS.map((plan) => {
              const isCurrent = currentPlan === plan.id;
              const displayPrice = billingCycle === 'annual' ? plan.priceAnnualMonthly : plan.priceMonthly;

              return (
                <div
                  key={plan.id}
                  className={`p-5 rounded-3xl border flex flex-col justify-between transition-all duration-300 relative ${plan.bgGradient} ${plan.borderColor} ${
                    plan.popular ? 'ring-2 ring-rose-500/60 shadow-xl shadow-rose-950/40' : 'hover:border-slate-700'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-rose-600 to-purple-600 text-white text-[10px] font-extrabold uppercase px-3 py-0.5 border-none shadow-md shadow-rose-950">
                        {plan.badge}
                      </Badge>
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-extrabold text-lg text-white">
                        {plan.name}
                      </h3>
                      {isCurrent && (
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] font-bold">
                          Active Plan
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 min-h-[32px] mb-4">
                      {plan.tagline}
                    </p>

                    {/* Price Display */}
                    <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 mb-5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white font-mono">
                          ₹{displayPrice}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          / month
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {plan.priceMonthly === 0
                          ? 'Completely free forever for all students'
                          : billingCycle === 'annual'
                          ? `Billed annually at ₹${displayPrice * 12}/yr`
                          : 'Billed monthly, cancel anytime'}
                      </span>
                    </div>

                    {/* Feature List */}
                    <div className="space-y-2.5 text-xs">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        What's Included:
                      </span>
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-tight">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action CTA Button */}
                  <div className="pt-6 mt-6 border-t border-slate-800/80">
                    {isCurrent ? (
                      <Button
                        disabled
                        variant="outline"
                        className="w-full bg-slate-900 border-emerald-500/40 text-emerald-300 font-bold text-xs h-10 rounded-xl cursor-default"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        Current Active Plan
                      </Button>
                    ) : plan.id === 'free' ? (
                      <Button
                        variant="outline"
                        onClick={handleDowngradeToFree}
                        className="w-full border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold h-10 rounded-xl"
                      >
                        Switch to Free
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleSelectPlan(plan)}
                        className={`w-full text-white font-bold text-xs h-10 rounded-xl gap-1.5 shadow-lg ${
                          plan.id === 'lite'
                            ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-950'
                            : 'bg-purple-600 hover:bg-purple-700 shadow-purple-950'
                        }`}
                      >
                        <Zap className="w-4 h-4 fill-white" />
                        <span>Upgrade to {plan.name.split(' ')[0]}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Feature Comparison Matrix Section */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Detailed Feature Comparison Matrix
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  See how the Free, Lite, and Pro tiers compare across all system tools.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar rounded-2xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-300 font-extrabold font-mono">
                    <th className="p-3.5 pl-4">Platform Feature</th>
                    <th className="p-3.5 text-center w-36">Free (₹0)</th>
                    <th className="p-3.5 text-center w-36 text-rose-300 bg-rose-950/20">Lite (₹99/mo)</th>
                    <th className="p-3.5 text-center w-40 text-purple-300 bg-purple-950/20">Pro (₹199/mo)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {COMPARISON_DATA.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 pl-4 font-medium">
                        <div className="flex flex-col">
                          <span className="text-white font-semibold">{row.feature}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{row.category}</span>
                        </div>
                      </td>

                      {/* Free Tier cell */}
                      <td className="p-3.5 text-center font-mono">
                        {typeof row.free === 'boolean' ? (
                          row.free ? (
                            <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-slate-600 mx-auto" />
                          )
                        ) : (
                          <span className="text-slate-400">{row.free}</span>
                        )}
                      </td>

                      {/* Lite Tier cell */}
                      <td className="p-3.5 text-center font-mono bg-rose-950/10">
                        {typeof row.lite === 'boolean' ? (
                          row.lite ? (
                            <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-slate-600 mx-auto" />
                          )
                        ) : (
                          <span className="text-rose-300 font-semibold">{row.lite}</span>
                        )}
                      </td>

                      {/* Pro Tier cell */}
                      <td className="p-3.5 text-center font-mono bg-purple-950/10">
                        {typeof row.pro === 'boolean' ? (
                          row.pro ? (
                            <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-slate-600 mx-auto" />
                          )
                        ) : (
                          <span className="text-purple-300 font-bold">{row.pro}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Student Trust Guarantee Footer */}
          <div className="mt-6 p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Instant activation • 7-day money-back guarantee • Cancel anytime with one tap.</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mock Payment / Checkout Simulation Dialog */}
      <Dialog open={!!selectedPlanForCheckout} onOpenChange={() => setSelectedPlanForCheckout(null)}>
        {selectedPlanForCheckout && (
          <DialogContent className="bg-slate-950 border-purple-500/50 text-white max-w-md rounded-3xl p-6 shadow-2xl">
            <DialogHeader className="space-y-1">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/30 mb-1">
                <CreditCard className="w-5 h-5" />
              </div>
              <DialogTitle className="text-xl font-extrabold text-white">
                Simulated Checkout & Upgrade
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                You are subscribing to <strong>{selectedPlanForCheckout.name}</strong> ({billingCycle === 'annual' ? 'Annual Billing' : 'Monthly Billing'}).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2 text-xs">
              {/* Order Summary Box */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Plan:</span>
                  <span className="font-bold text-white">{selectedPlanForCheckout.name}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Billing Frequency:</span>
                  <span className="capitalize">{billingCycle}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-800 pt-2 text-sm">
                  <span className="font-bold text-white">Total Amount Due:</span>
                  <span className="font-extrabold font-mono text-emerald-400 text-base">
                    ₹{billingCycle === 'annual' ? selectedPlanForCheckout.priceAnnualMonthly * 12 : selectedPlanForCheckout.priceMonthly}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="font-bold text-slate-300 block">Select Payment Method (Demo):</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'upi', label: 'UPI / QR', icon: '⚡' },
                    { id: 'card', label: 'Card', icon: '💳' },
                    { id: 'netbanking', label: 'Net Banking', icon: '🏦' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                        paymentMethod === m.id
                          ? 'bg-purple-600/30 border-purple-500 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-base">{m.icon}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Demo Notice */}
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[11px] text-purple-200">
                💡 <strong>Demo Checkout Sandbox:</strong> Clicking "Make Payment" will instantly upgrade your account in local memory and unlock all tier benefits.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <Button
                variant="ghost"
                onClick={() => setSelectedPlanForCheckout(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </Button>

              <Button
                disabled={isProcessingPayment}
                onClick={handleSimulatePayment}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-5 rounded-xl gap-2 shadow-lg shadow-emerald-950"
              >
                {isProcessingPayment ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Make Payment (₹{billingCycle === 'annual' ? selectedPlanForCheckout.priceAnnualMonthly * 12 : selectedPlanForCheckout.priceMonthly})</span>
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
};