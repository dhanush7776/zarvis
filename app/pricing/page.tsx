import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParticleBackground } from "@/components/shared/particle-background";
import { PublicNav } from "@/components/layout/public-nav";
import { PublicFooter } from "@/components/layout/public-footer";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Try Zarvis with everyday essentials.",
    features: [
      "Unlimited text chat",
      "Wake word & double-clap voice activation",
      "5 document uploads / month",
      "20 image analyses / month",
      "Standard response speed",
    ],
    cta: "Start free",
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "per month",
    description: "For people who use Zarvis every day.",
    features: [
      "Everything in Free",
      "Unlimited document uploads",
      "Unlimited image analyses",
      "Priority streaming speed",
      "Extended memory retention",
      "Regenerate & pin unlimited chats",
    ],
    cta: "Upgrade to Pro",
    href: "/signup",
    highlighted: true,
  },
  {
    name: "Ultra",
    price: "$49",
    period: "per month",
    description: "For power users and small teams.",
    features: [
      "Everything in Pro",
      "Custom wake word",
      "Advanced code assistant modes",
      "Semantic search across all documents",
      "Priority support",
    ],
    cta: "Upgrade to Ultra",
    href: "/signup",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <ParticleBackground count={30} />
      <PublicNav />

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-8 text-center">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">Simple, transparent pricing</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Start free. Upgrade whenever Zarvis becomes part of your daily routine.
        </p>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "gradient-border glass flex flex-col rounded-2xl p-8 text-left",
                plan.highlighted && "glass-strong scale-[1.03] neon-ring",
              )}
            >
              {plan.highlighted && (
                <span className="mb-4 inline-block w-fit rounded-full bg-gradient-to-r from-zarvis-cyan to-zarvis-violet px-3 py-1 text-xs font-semibold text-black">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-semibold">{plan.price}</span>
                <span className="text-sm text-muted-foreground">/ {plan.period}</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-zarvis-cyan" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-8 w-full" variant={plan.highlighted ? "default" : "outline"}>
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
