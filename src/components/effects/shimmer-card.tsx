'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ShimmerCardProps {
  children: React.ReactNode;
  className?: string;
  enabled?: boolean;
}

// ─── Keyframe styles (injected once) ─────────────────────────────────────────

const keyframes = `
@keyframes shimmer-glow {
  0%, 100% {
    box-shadow: 0 0 8px rgba(16,185,129,0.05), 0 0 32px rgba(16,185,129,0.02);
  }
  50% {
    box-shadow: 0 0 18px rgba(16,185,129,0.14), 0 0 52px rgba(16,185,129,0.06);
  }
}

@keyframes shimmer-slide {
  0% {
    background-position: 200% 0%;
  }
  100% {
    background-position: -50% 0%;
  }
}
`;

// ─── Component ───────────────────────────────────────────────────────────────

export function ShimmerCard({ children, className, enabled = true }: ShimmerCardProps) {
  const [shimmerKey, setShimmerKey] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    // Bump key to force remount & replay the one-shot shimmer animation
    setShimmerKey((k) => k + 1);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: keyframes }} />

      <div
        className={cn('group relative overflow-hidden rounded-xl', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Glow border — pulses gently around the card */}
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 rounded-xl border transition-all duration-700',
            isHovered
              ? 'border-emerald-500/40'
              : 'border-emerald-500/0'
          )}
          style={{
            animation: 'shimmer-glow 3s ease-in-out infinite',
          }}
        />

        {/* Shimmer overlay — diagonal emerald gradient that sweeps on hover */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-xl"
        >
          <div
            key={shimmerKey}
            className="absolute inset-[-100%]"
            style={{
              background: `linear-gradient(
                110deg,
                transparent 25%,
                rgba(16, 185, 129, 0.07) 37%,
                rgba(52, 211, 153, 0.15) 50%,
                rgba(16, 185, 129, 0.07) 63%,
                transparent 75%
              )`,
              backgroundSize: '250% 250%',
              backgroundPosition: '200% 0%',
              animation: `shimmer-slide 1.5s ease-in-out forwards`,
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.3s ease 0s',
            }}
          />
        </div>

        {/* Card content */}
        <div className="relative z-20">{children}</div>
      </div>
    </>
  );
}
