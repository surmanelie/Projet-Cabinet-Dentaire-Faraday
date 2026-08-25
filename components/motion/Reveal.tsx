"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

/**
 * Révélation douce au scroll (fade + léger déplacement vertical). Primitif
 * unique réutilisé partout au lieu d'animations ad hoc par page.
 */
export default function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "li";
}) {
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: EASE_PREMIUM }}
    >
      {children}
    </Comp>
  );
}
