import { Badge } from "@/components/ui/badge";
import { Languages, Scale, ShieldCheck, Sparkles, Star, WandSparkles } from "lucide-react";
import Link from "next/link";

const roadmap = [
  { href: "/compare", icon: Scale, title: "Compare cities", text: "Put weather, scale, money and travel signals side by side." },
  { href: "/events", icon: WandSparkles, title: "Live events", text: "Track sport, music, nightlife and cultural event signals." },
  { href: "/translate", icon: Languages, title: "Local phrases", text: "Translate short phrases and build a practical pocket set." },
  { href: "/essentials", icon: ShieldCheck, title: "Travel essentials", text: "See emergency reference numbers and nearby medical help." },
  { href: "/planner", icon: Sparkles, title: "Trip builder", text: "Save itinerary cards, use the calendar and export events." },
  { href: "/stories", icon: Star, title: "Stories & notes", text: "Read an animated city journal and save honest personal notes." },
];

export function RoadmapSection() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="max-w-2xl">
        <Badge variant="outline">Architecture runway</Badge>
        <h2 className="mt-5 text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Built for the trip after the first trip.</h2>
        <p className="mt-4 text-pretty leading-7 text-muted-foreground">The normalized place model, source adapters, and cache boundary make these additions incremental—not a rewrite.</p>
      </div>
      <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border/65 bg-border/65 sm:grid-cols-2 lg:grid-cols-3">
        {roadmap.map((item) => (
          <Link href={item.href} key={item.title} className="group bg-background/95 p-6 transition hover:bg-card">
            <item.icon className="size-5 text-primary" />
            <h3 className="mt-5 font-medium transition group-hover:text-primary">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
