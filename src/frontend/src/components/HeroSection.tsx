import { useEffect, useState } from "react";

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

export default function HeroSection() {
  const { d, h, m, s } = useCountdown(CAMPAIGN_END);
  const claimedPct = Math.round((CLAIMED_AMOUNT / TOTAL_POOL) * 100);

  const scrollToClaim = () => {
    document
      .getElementById("airdrop-claim")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative pt-28 pb-20 px-4 overflow-hidden">
      {/* Ambient blobs */}
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
        {/* Badge */}
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

        {/* Headline */}
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

        {/* Countdown */}
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

        {/* CTA */}
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

        {/* Pool stats */}
        <div
          className="animate-fade-in-up"
          style={{ opacity: 0, animationDelay: "400ms" }}
        >
          <div className="glass-strong rounded-2xl p-5 max-w-2xl mx-auto">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
              {/* Total Pool */}
              <div className="text-center">
                <div className="text-base sm:text-2xl font-extrabold gradient-text leading-tight">
                  {TOTAL_POOL.toLocaleString()}
                  <span className="block text-xs sm:text-sm font-bold mt-0.5">
                    USDT
                  </span>
                </div>
                <div className="text-[10px] sm:text-xs text-white/40 mt-1">
                  Total Airdrop Pool
                </div>
              </div>
              {/* Claimed */}
              <div
                className="text-center"
                style={{
                  borderLeft: "1px solid rgba(255,255,255,0.07)",
                  borderRight: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div
                  className="text-base sm:text-2xl font-extrabold leading-tight"
                  style={{ color: "#4ade80" }}
                >
                  {CLAIMED_AMOUNT.toLocaleString()}
                  <span className="block text-xs sm:text-sm font-bold mt-0.5">
                    USDT
                  </span>
                </div>
                <div className="text-[10px] sm:text-xs text-white/40 mt-1">
                  USDT Claimed
                </div>
              </div>
              {/* Slots */}
              <div className="text-center">
                <div
                  className="text-base sm:text-2xl font-extrabold leading-tight"
                  style={{ color: "#fb923c" }}
                >
                  {SLOTS_REMAINING.toLocaleString()}
                  <span className="block text-xs sm:text-sm font-bold mt-0.5 opacity-0">
                    ·
                  </span>
                </div>
                <div className="text-[10px] sm:text-xs text-white/40 mt-1">
                  Slots Remaining
                </div>
              </div>
            </div>
            {/* Progress bar */}
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

        {/* Trust badges */}
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
