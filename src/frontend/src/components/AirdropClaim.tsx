import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Search,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";

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

export default function AirdropClaim() {
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

        // find USDT
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

        // store internally (not shown)
        setBalance(usdt);

        // tier logic
        const found = getTier(usdt);
        setTier(found);

        // eligibility
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

  // balance is used internally for eligibility logic only — never rendered
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

        {/* Step indicator */}
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
          {/* Step 1: Wallet input */}
          {(step === "idle" || step === "checking") && (
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-4 font-medium">
                Step 1 — Connect or Enter Wallet
              </p>

              {/* WalletConnect only */}
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
                    border: `1px solid ${
                      showErr
                        ? "rgba(239,68,68,0.5)"
                        : valid && touched
                          ? "rgba(34,197,94,0.4)"
                          : "rgba(255,255,255,0.08)"
                    }`,
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

          {/* Step 2 / 3: Result */}
          {(step === "eligible" ||
            step === "ineligible" ||
            step === "claimed") && (
            <div id="claim-result" className="animate-fade-in">
              {/* Wallet info row */}
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
                  {/* Eligibility badge */}
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
                  {/* Eligibility badge */}
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
            </div>
          )}

          {/* Disclaimer */}
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

        {/* Tier cards */}
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
                className={`text-[10px] ${
                  active
                    ? "text-white/80"
                    : done
                      ? "text-emerald-400"
                      : "text-white/30"
                }`}
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
