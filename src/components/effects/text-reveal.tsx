'use client';

import React from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TextRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Delay before the first character starts animating (seconds). @default 0 */
  delay?: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CHAR_STAGGER = 0.03; // seconds between each character
const CHAR_DURATION = 0.35; // duration of each character's entrance
const SHIMMER_DELAY_FACTOR = 0.03; // per-char factor to compute shimmer start

// ─── Character spring variant ────────────────────────────────────────────────

const charVariants = {
  hidden: {
    opacity: 0,
    y: 16,
    filter: 'blur(4px)',
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: CHAR_DURATION,
      ease: [0.25, 0.46, 0.45, 0.94],
      delay: i * CHAR_STAGGER,
    },
  }),
};

// ─── Shimmer sweep that runs after all chars are revealed ────────────────────

function ShimmerSweep({
  totalChars,
  baseDelay,
  className,
}: {
  totalChars: number;
  baseDelay: number;
  className?: string;
}) {
  const shimmerStart = baseDelay + totalChars * CHAR_STAGGER + 0.15;
  const shimmerDuration = 0.6;

  return (
    <motion.span
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{
        background:
          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 45%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.35) 55%, transparent 100%)',
        backgroundSize: '200% 100%',
      }}
      initial={{ backgroundPosition: '200% 0%', opacity: 0 }}
      animate={{
        backgroundPosition: '-100% 0%',
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration: shimmerDuration,
        ease: 'easeInOut',
        delay: shimmerStart,
        times: [0, 0.1, 0.85, 1],
      }}
    />
  );
}

// ─── Render helpers ──────────────────────────────────────────────────────────

function isStringChildren(children: React.ReactNode): children is string {
  return typeof children === 'string';
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function TextReveal({ children, className, delay = 0 }: TextRevealProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  // ── String children: split into characters ──

  if (isStringChildren(children)) {
    const chars = children.split('');
    const total = chars.length;

    return (
      <span ref={ref} className={cn('relative inline', className)}>
        <ShimmerSweep totalChars={total} baseDelay={delay} />

        <span className="relative z-10 inline">
          {chars.map((char, i) => (
            <motion.span
              key={`${char}-${i}`}
              custom={i}
              variants={charVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              style={{ display: 'inline-block', whiteSpace: 'pre' }}
              aria-hidden="true"
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
          {/* Accessible hidden text for screen readers */}
          <span className="sr-only">{children}</span>
        </span>
      </span>
    );
  }

  // ── Non-string children (React nodes): simple fade + slide ──

  return (
    <span ref={ref} className={cn('relative inline', className)}>
      <ShimmerSweep totalChars={8} baseDelay={delay} className="rounded-md" />

      <motion.span
        className="relative z-10 inline-block"
        initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
        animate={
          isInView
            ? { opacity: 1, y: 0, filter: 'blur(0px)' }
            : { opacity: 0, y: 16, filter: 'blur(4px)' }
        }
        transition={{
          duration: CHAR_DURATION * 1.6,
          ease: [0.25, 0.46, 0.45, 0.94],
          delay: delay,
        }}
      >
        {children}
      </motion.span>
    </span>
  );
}
