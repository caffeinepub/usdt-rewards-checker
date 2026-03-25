import { Shield, Zap } from "lucide-react";

export default function Footer() {
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
