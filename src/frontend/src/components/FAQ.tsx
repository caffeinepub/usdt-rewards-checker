import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

export default function FAQ() {
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
