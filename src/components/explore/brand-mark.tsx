"use client";

import { Compass } from "lucide-react";
import { motion } from "motion/react";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex shrink-0 items-center gap-2.5" aria-label="Atlasia">
      <motion.span
        initial={{ scale: 0, rotate: -120 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        whileHover={{ rotate: 22, scale: 1.06 }}
        className="grid size-9 place-items-center rounded-full bg-foreground text-background shadow-[0_0_30px_color-mix(in_oklab,var(--primary)_35%,transparent)]"
      >
        <Compass className="size-4.5" />
      </motion.span>
      {!compact && (
        <span className="hidden overflow-hidden sm:block">
          <motion.span
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.18, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="block whitespace-nowrap text-sm font-semibold tracking-[-0.02em]"
          >
            Atlasia
          </motion.span>
        </span>
      )}
    </span>
  );
}
