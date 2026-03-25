import AirdropClaim from "@/components/AirdropClaim";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import Navbar from "@/components/Navbar";
import SocialProof from "@/components/SocialProof";
import { Toaster } from "@/components/ui/sonner";

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
