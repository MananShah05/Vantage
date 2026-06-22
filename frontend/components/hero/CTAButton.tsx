"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface CTAButtonProps {
  href: string;
  primary?: boolean;
  children: ReactNode;
}

export default function CTAButton({ href, primary = false, children }: CTAButtonProps) {
  return (
    <motion.a
      href={href}
      whileHover={primary ? { scale: 1.02, filter: "brightness(1.08)" } : { scale: 1.0 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1, ease: [0.23, 1, 0.32, 1] }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px 22px",
        borderRadius: 8,
        fontFamily: "var(--font-inter)",
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: "-0.01em",
        cursor: "pointer",
        ...(primary
          ? {
              background: "var(--ac-primary)",
              color: "oklch(0.10 0.01 262)",
              border: "1px solid transparent",
            }
          : {
              background: "transparent",
              color: "var(--tx-secondary)",
              border: "1px solid var(--bg-raised)",
            }),
      }}
      className={primary ? "" : "cta-ghost"}
    >
      {children}
    </motion.a>
  );
}
