"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import type { CSSProperties } from "react";

export interface OrbitItem {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  imageUrl?: string | null;
}

export function OrbitShowcase({ place, items, className }: { place: string; items: OrbitItem[]; className?: string }) {
  return (
    <section className={cn("relative", className)} aria-label={`Highlights orbiting ${place}`}>
      <div className="hidden min-h-[44rem] items-center justify-center lg:flex">
        <div className="orbit-stage">
          <div className="orbit-ring" aria-hidden="true" />
          <motion.div initial={{ scale: 0.75, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} className="orbit-core">
            <span className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Around</span>
            <strong className="mt-2 max-w-44 text-balance text-center text-3xl tracking-[-0.05em]">{place}</strong>
            <span className="mt-3 text-xs text-muted-foreground">Drag your curiosity outward</span>
          </motion.div>
          <div className="orbit-track">
            {items.slice(0, 6).map((item, index) => {
              const angle = index * 60;
              return (
                <div key={`${item.title}-${index}`} className="orbit-card-shell" style={{ "--orbit-angle": `${angle}deg` } as CSSProperties}>
                  <article className="orbit-card" style={{ "--orbit-counter-angle": `${-angle}deg` } as CSSProperties}>
                    {item.imageUrl && <div className="h-20 bg-cover bg-center" style={{ backgroundImage: `url(${item.imageUrl})` }} />}
                    <div className="p-4"><item.icon className="size-4 text-primary" /><h3 className="mt-3 truncate font-semibold">{item.title}</h3><p className="mt-1 truncate text-xs text-muted-foreground">{item.subtitle}</p></div>
                  </article>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
        {items.slice(0, 6).map((item, index) => <motion.article key={`${item.title}-${index}`} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="overflow-hidden rounded-2xl border border-border bg-card">{item.imageUrl && <div className="h-28 bg-cover bg-center" style={{ backgroundImage: `url(${item.imageUrl})` }} />}<div className="p-4"><item.icon className="size-4 text-primary" /><h3 className="mt-3 font-semibold">{item.title}</h3><p className="mt-1 text-xs text-muted-foreground">{item.subtitle}</p></div></motion.article>)}
      </div>
    </section>
  );
}
