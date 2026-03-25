import { Shield, Zap } from "lucide-react";

export default function Navbar() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 px-4 py-3"
      style={{
        background: "rgba(6, 8, 18, 0.85)",
        backdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="container mx-auto max-w-6xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
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
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.25)",
              color: "#4ade80",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Campaign Live
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
