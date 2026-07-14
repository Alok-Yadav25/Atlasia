"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface SectionCardProps {
  id?: string;
  title: string;
  eyebrow: string;
  icon: LucideIcon;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function SectionCard({
  id,
  title,
  eyebrow,
  icon: Icon,
  children,
  action,
  className,
  contentClassName,
}: SectionCardProps) {
  return (
    <motion.div
      id={id}
      className={cn("scroll-mt-28", className)}
      initial={{ opacity: 0, y: 28 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true, margin: "-80px" }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <Card className="h-full overflow-hidden border-white/8 bg-card/72 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.75)] backdrop-blur-xl">
        <CardHeader className="flex-row items-start justify-between gap-4 px-5 pb-1 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
              <Icon className="size-4.5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                {eyebrow}
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
            </div>
          </div>
          {action}
        </CardHeader>
        <CardContent className={cn("px-5 pt-4 sm:px-6", contentClassName)}>{children}</CardContent>
      </Card>
    </motion.div>
  );
}
