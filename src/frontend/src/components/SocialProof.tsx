import { useEffect, useRef, useState } from "react";

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

export default function SocialProof() {
  const [items] = useState<ClaimItem[]>(makeItems);
  const tickerRef = useRef<HTMLDivElement>(null);

  // duplicate for seamless loop
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
        {/* Fade edges */}
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
