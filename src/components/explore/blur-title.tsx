"use client";

import { motion } from "motion/react";

export function BlurTitle({ children, className = "" }: { children: string; className?: string }) {
  return (
    <h1 className={className} aria-label={children}>
      {children.split(" ").map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          initial={{ opacity: 0, y: 28, filter: "blur(14px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: index * 0.065, duration: 0.68, ease: [0.22, 1, 0.36, 1] }}
          className="mr-[0.22em] inline-block"
        >
          {word}{index < children.split(" ").length - 1 ? " " : ""}
        </motion.span>
      ))}
    </h1>
  );
}
