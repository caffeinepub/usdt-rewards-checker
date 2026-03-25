import { CheckCircle2, Search, Wallet } from "lucide-react";

const STEPS = [
  {
    icon: <Wallet className="w-6 h-6" />,
    num: "01",
    title: "Connect Your Wallet",
    desc: "Use TronLink, WalletConnect, or manually enter your TRON TRC20 wallet address. No permissions or approvals needed.",
    color: "#a78bfa",
    bg: "rgba(139,92,246,0.1)",
  },
  {
    icon: <Search className="w-6 h-6" />,
    num: "02",
    title: "Verify Eligibility",
    desc: "We query the public Tronscan API to read your USDT TRC20 balance on-chain. Instant verification — no wallet signing required.",
    color: "#22d3ee",
    bg: "rgba(6,182,212,0.1)",
  },
  {
    icon: <CheckCircle2 className="w-6 h-6" />,
    num: "03",
    title: "Claim Your Reward",
    desc: "If eligible, choose your tier and submit your claim. Your USDT airdrop will be sent directly to your wallet within 24 hours.",
    color: "#34d399",
    bg: "rgba(52,211,153,0.1)",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <p className="text-xs text-white/40 uppercase tracking-widest font-medium mb-3">
            Simple Process
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold">
            How It <span className="gradient-text">Works</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {STEPS.map((step) => (
            <div
              key={step.num}
              className="glass rounded-2xl p-6 gradient-border relative overflow-hidden group hover:scale-[1.02] transition-transform duration-200"
            >
              <div
                className="absolute top-3 right-4 text-5xl font-extrabold"
                style={{ color: `${step.color}10` }}
              >
                {step.num}
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: step.bg, color: step.color }}
              >
                {step.icon}
              </div>
              <h3 className="font-bold text-white mb-3">{step.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
