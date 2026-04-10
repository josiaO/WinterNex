'use client';

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Particle {
  id: number;
  x: number;
  y: number;
  originX: number;
  originY: number;
  size: number;
  hue: number;
  saturation: number;
  lightness: number;
  vx: number;
  vy: number;
  opacity: number;
  createdAt: number;
  lifetime: number;
  glowIntensity: number;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  hue: number;
  createdAt: number;
  lifetime: number;
  lineWidth: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_PARTICLES = 60;
const CURSOR_DOT_SIZE = 10;
const CURSOR_RING_SIZE = 36;
const LERP_FACTOR = 0.12;
const PARTICLE_LIFETIME_MIN = 800;
const PARTICLE_LIFETIME_MAX = 1600;
const RIPPLE_LIFETIME = 700;
const RIPPLE_MAX_RADIUS = 80;
const THROTTLE_INTERVAL = 24; // ~40fps for spawning (animation still runs at 60fps)
const PARTICLES_PER_SPAWN_MIN = 2;
const PARTICLES_PER_SPAWN_MAX = 4;
const MAGNETIC_STRENGTH = 0.02;
const MAGNETIC_RADIUS = 120;
const HUE_CYCLE_SPEED = 0.4; // degrees per frame
const GLOW_PULSE_SPEED = 0.003;

// ─── External store helpers ──────────────────────────────────────────────────

const emptySubscribe = () => () => {};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function getIsTouch(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Map a cycling hue to one of our target color ranges:
// Emerald (~150-165), Teal (~170-185), Amber (~30-50), Rose (~340-360)
function getTargetHue(cycleOffset: number): number {
  // Cycle through: emerald → teal → amber → rose → emerald ...
  // Using a smooth piecewise mapping
  const t = ((cycleOffset % 360) + 360) % 360;
  const segment = t / 90; // 0-4 segments
  const seg = Math.floor(segment) % 4;
  const frac = segment - Math.floor(segment);

  switch (seg) {
    case 0: return 150 + frac * 15;   // emerald (150 → 165)
    case 1: return 170 + frac * 15;   // teal (170 → 185)
    case 2: return 30 + frac * 20;    // amber (30 → 50)
    case 3: return 340 + frac * 20;   // rose (340 → 360)
    default: return 150;
  }
}

// ─── Animation frame loop ────────────────────────────────────────────────────

type SetParticlesFn = React.Dispatch<React.SetStateAction<Particle[]>>;
type SetRipplesFn = React.Dispatch<React.SetStateAction<Ripple[]>>;

function startAnimationLoop(
  cursorPos: React.MutableRefObject<{ x: number; y: number }>,
  cursorDisplay: React.MutableRefObject<{ x: number; y: number }>,
  isHoveringInteractive: React.MutableRefObject<boolean>,
  hueOffset: React.MutableRefObject<number>,
  glowPhase: React.MutableRefObject<number>,
  setParticles: SetParticlesFn,
  setRipples: SetRipplesFn
): number {
  function tick() {
    const now = performance.now();

    // Advance color cycle and glow pulse
    hueOffset.current = (hueOffset.current + HUE_CYCLE_SPEED) % 360;
    glowPhase.current += GLOW_PULSE_SPEED;

    // Smooth lerp cursor position
    cursorDisplay.current.x +=
      (cursorPos.current.x - cursorDisplay.current.x) * LERP_FACTOR;
    cursorDisplay.current.y +=
      (cursorPos.current.y - cursorDisplay.current.y) * LERP_FACTOR;

    const cx = cursorDisplay.current.x;
    const cy = cursorDisplay.current.y;

    // Update cursor DOM elements
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    const glow = document.getElementById('cursor-glow');

    if (dot) {
      const isHover = isHoveringInteractive.current;
      const scale = isHover ? 1.6 : 1;
      const currentHue = getTargetHue(hueOffset.current);
      dot.style.transform = `translate(${cx - CURSOR_DOT_SIZE / 2}px, ${cy - CURSOR_DOT_SIZE / 2}px) scale(${scale})`;
      dot.style.backgroundColor = `hsl(${currentHue}, 80%, 60%)`;
      dot.style.boxShadow = `0 0 ${isHover ? 16 : 8}px hsla(${currentHue}, 90%, 65%, 0.8), 0 0 ${isHover ? 32 : 16}px hsla(${currentHue}, 90%, 55%, 0.4)`;
    }

    if (ring) {
      const isHover = isHoveringInteractive.current;
      const targetSize = isHover ? 1.4 : 1;
      const currentHue = getTargetHue(hueOffset.current);
      ring.style.transform = `translate(${cx - CURSOR_RING_SIZE / 2}px, ${cy - CURSOR_RING_SIZE / 2}px) scale(${targetSize})`;
      ring.style.opacity = String(isHover ? 0.6 : 0.35);
      ring.style.borderColor = `hsla(${currentHue}, 80%, 65%, ${isHover ? 0.8 : 0.5})`;
      ring.style.borderWidth = isHover ? '2px' : '1.5px';
    }

    if (glow) {
      const pulseScale = 1 + Math.sin(glowPhase.current) * 0.15;
      const currentHue = getTargetHue(hueOffset.current);
      const glowSize = (isHoveringInteractive.current ? 50 : 30) * pulseScale;
      glow.style.transform = `translate(${cx - glowSize / 2}px, ${cy - glowSize / 2}px)`;
      glow.style.width = `${glowSize}px`;
      glow.style.height = `${glowSize}px`;
      glow.style.background = `radial-gradient(circle, hsla(${currentHue}, 90%, 65%, 0.15) 0%, hsla(${currentHue}, 90%, 55%, 0.05) 40%, transparent 70%)`;
    }

    // Update particles with magnetic attraction
    setParticles((prev) => {
      if (prev.length === 0) return prev;
      const updated: Particle[] = [];
      for (const p of prev) {
        const progress = (now - p.createdAt) / p.lifetime;
        if (progress >= 1) continue;

        // Magnetic attraction toward cursor
        const dx = cx - p.x;
        const dy = cy - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let magnetX = 0;
        let magnetY = 0;
        if (dist < MAGNETIC_RADIUS && dist > 1) {
          const force = MAGNETIC_STRENGTH * (1 - dist / MAGNETIC_RADIUS);
          magnetX = (dx / dist) * force * 60;
          magnetY = (dy / dist) * force * 60;
        }

        const eased = progress * progress;
        const newX = p.x + p.vx * (1 + progress * 1.5) + magnetX;
        const newY = p.y + p.vy + magnetY;

        updated.push({
          ...p,
          x: newX,
          y: newY,
          opacity: (1 - eased) * 0.85,
          size: p.size * (1 - eased * 0.3),
          hue: p.hue + progress * 15, // subtle hue shift over lifetime
          glowIntensity: (1 - eased) * 0.6,
        });
      }
      return updated;
    });

    // Update ripples
    setRipples((prev) => {
      if (prev.length === 0) return prev;
      const updated: Ripple[] = [];
      for (const r of prev) {
        const progress = (now - r.createdAt) / r.lifetime;
        if (progress >= 1) continue;
        const eased = 1 - Math.pow(1 - progress, 3);
        updated.push({
          ...r,
          radius: r.maxRadius * eased,
          opacity: 0.6 * (1 - progress),
          lineWidth: 2.5 * (1 - progress),
        });
      }
      return updated;
    });

    return requestAnimationFrame(tick);
  }

  return requestAnimationFrame(tick);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CursorBubbles() {
  // Use useSyncExternalStore for safe SSR hydration
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const isTouch = useSyncExternalStore(emptySubscribe, getIsTouch, () => true);

  const [particles, setParticles] = useState<Particle[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const cursorPos = useRef({ x: -100, y: -100 });
  const cursorDisplay = useRef({ x: -100, y: -100 });
  const isHoveringInteractive = useRef(false);
  const hueOffset = useRef(0);
  const glowPhase = useRef(0);
  const animationRef = useRef<number>(0);
  const nextId = useRef(0);
  const lastSpawnTime = useRef(0);

  // ─── Spawn particles ───────────────────────────────────────────────────

  const spawnParticles = useCallback(
    (x: number, y: number, count?: number, isClick?: boolean) => {
      const num = count ?? Math.floor(randomRange(PARTICLES_PER_SPAWN_MIN, PARTICLES_PER_SPAWN_MAX + 1));

      setParticles((prev) => {
        const toAdd = Math.min(num, MAX_PARTICLES - prev.length);
        if (toAdd <= 0) return prev;

        const now = performance.now();
        const newParticles: Particle[] = [];
        for (let i = 0; i < toAdd; i++) {
          const baseHue = getTargetHue(hueOffset.current + i * 30);
          const hue = baseHue + randomRange(-10, 10);
          const sat = randomRange(70, 90);
          const light = randomRange(55, 70);

          if (isClick) {
            // Radial burst for click
            const angle = (Math.PI * 2 * i) / toAdd + randomRange(-0.3, 0.3);
            const speed = randomRange(2, 5);
            newParticles.push({
              id: nextId.current++,
              x: x + randomRange(-3, 3),
              y: y + randomRange(-3, 3),
              originX: x,
              originY: y,
              size: randomRange(5, 11),
              hue,
              saturation: sat,
              lightness: light,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed - 0.5,
              opacity: 1,
              createdAt: now,
              lifetime: randomRange(PARTICLE_LIFETIME_MIN * 0.7, PARTICLE_LIFETIME_MAX * 0.8),
              glowIntensity: 0.8,
            });
          } else {
            // Normal trail
            newParticles.push({
              id: nextId.current++,
              x: x + randomRange(-5, 5),
              y: y + randomRange(-5, 5),
              originX: x,
              originY: y,
              size: randomRange(3, 10),
              hue,
              saturation: sat,
              lightness: light,
              vx: randomRange(-0.6, 0.6),
              vy: randomRange(-1.8, -0.3),
              opacity: 1,
              createdAt: now,
              lifetime: randomRange(PARTICLE_LIFETIME_MIN, PARTICLE_LIFETIME_MAX),
              glowIntensity: randomRange(0.3, 0.7),
            });
          }
        }
        return [...prev, ...newParticles];
      });
    },
    []
  );

  // ─── Spawn ripples on click ────────────────────────────────────────────

  const spawnRipples = useCallback((x: number, y: number) => {
    const now = performance.now();
    const baseHue = getTargetHue(hueOffset.current);

    setRipples((prev) => [
      ...prev,
      // Outer ring
      {
        id: nextId.current++,
        x,
        y,
        radius: 0,
        maxRadius: RIPPLE_MAX_RADIUS,
        opacity: 0.6,
        hue: baseHue,
        createdAt: now,
        lifetime: RIPPLE_LIFETIME,
        lineWidth: 2.5,
      },
      // Inner ring (faster, smaller)
      {
        id: nextId.current++,
        x,
        y,
        radius: 0,
        maxRadius: RIPPLE_MAX_RADIUS * 0.5,
        opacity: 0.4,
        hue: (baseHue + 40) % 360,
        createdAt: now,
        lifetime: RIPPLE_LIFETIME * 0.6,
        lineWidth: 1.5,
      },
    ]);
  }, []);

  // ─── Start animation loop on mount ─────────────────────────────────────

  useEffect(() => {
    if (isTouch) return;

    animationRef.current = startAnimationLoop(
      cursorPos,
      cursorDisplay,
      isHoveringInteractive,
      hueOffset,
      glowPhase,
      setParticles,
      setRipples
    );

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isTouch]);

  // ─── Mouse event handlers ──────────────────────────────────────────────

  useEffect(() => {
    if (!mounted || isTouch) return;

    const handleMouseMove = (e: MouseEvent) => {
      cursorPos.current = { x: e.clientX, y: e.clientY };

      const now = performance.now();
      if (now - lastSpawnTime.current >= THROTTLE_INTERVAL) {
        lastSpawnTime.current = now;
        spawnParticles(e.clientX, e.clientY);
      }
    };

    const handleMouseEnter = () => {
      const dot = document.getElementById('cursor-dot');
      const ring = document.getElementById('cursor-ring');
      const glow = document.getElementById('cursor-glow');
      if (dot) dot.style.opacity = '1';
      if (ring) ring.style.opacity = '0.35';
      if (glow) glow.style.opacity = '1';
    };

    const handleMouseLeave = () => {
      const dot = document.getElementById('cursor-dot');
      const ring = document.getElementById('cursor-ring');
      const glow = document.getElementById('cursor-glow');
      if (dot) dot.style.opacity = '0';
      if (ring) ring.style.opacity = '0';
      if (glow) glow.style.opacity = '0';
    };

    const handleMouseDown = (e: MouseEvent) => {
      spawnRipples(e.clientX, e.clientY);
      spawnParticles(e.clientX, e.clientY, 10, true);
    };

    const isInteractiveTarget = (el: Element | null): boolean => {
      if (!el) return false;
      const tag = (el as HTMLElement).tagName;
      return (
        tag === 'A' ||
        tag === 'BUTTON' ||
        el.closest('a') !== null ||
        el.closest('button') !== null ||
        el.closest('[role="button"]') !== null ||
        el.closest('input') !== null ||
        el.closest('textarea') !== null ||
        el.closest('select') !== null ||
        el.closest('[data-cursor-hover]') !== null ||
        window.getComputedStyle(el).cursor === 'pointer'
      );
    };

    const handleMouseOver = (e: MouseEvent) => {
      if (isInteractiveTarget(e.target as HTMLElement)) {
        isHoveringInteractive.current = true;
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      if (isInteractiveTarget(e.target as HTMLElement)) {
        isHoveringInteractive.current = false;
      }
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseenter', handleMouseEnter, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    document.addEventListener('mousedown', handleMouseDown, { passive: true });
    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mouseout', handleMouseOut, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, [mounted, isTouch, spawnParticles, spawnRipples]);

  // ─── Don't render on server or touch devices ────────────────────────────

  if (!mounted || isTouch) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {/* Glow aura behind cursor */}
      <div
        id="cursor-glow"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 30,
          height: 30,
          borderRadius: '50%',
          opacity: 0,
          willChange: 'transform, width, height',
          pointerEvents: 'none',
          filter: 'blur(4px)',
        }}
      />

      {/* Glowing dot cursor */}
      <div
        id="cursor-dot"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: CURSOR_DOT_SIZE,
          height: CURSOR_DOT_SIZE,
          borderRadius: '50%',
          opacity: 0,
          willChange: 'transform, background-color, box-shadow',
          pointerEvents: 'none',
        }}
      />

      {/* Ring cursor */}
      <div
        id="cursor-ring"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: CURSOR_RING_SIZE,
          height: CURSOR_RING_SIZE,
          borderRadius: '50%',
          border: '1.5px solid transparent',
          opacity: 0,
          willChange: 'transform, opacity, border-color, border-width',
          pointerEvents: 'none',
          transition: 'border-width 0.2s ease',
        }}
      />

      {/* Color-shifting trail particles */}
      {particles.map((p) => {
        const color = `hsl(${p.hue}, ${p.saturation}%, ${p.lightness}%)`;
        const glowColor = `hsla(${p.hue}, ${p.saturation}%, ${p.lightness}%, ${p.glowIntensity})`;
        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: p.x - p.size / 2,
              top: p.y - p.size / 2,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: color,
              opacity: p.opacity,
              willChange: 'transform, opacity',
              pointerEvents: 'none',
              boxShadow: `0 0 ${p.size * 0.8}px ${glowColor}`,
            }}
          />
        );
      })}

      {/* Click ripple rings */}
      {ripples.map((r) => {
        const color = `hsla(${r.hue}, 80%, 65%, ${r.opacity})`;
        return (
          <div
            key={r.id}
            style={{
              position: 'absolute',
              left: r.x - r.radius,
              top: r.y - r.radius,
              width: r.radius * 2,
              height: r.radius * 2,
              borderRadius: '50%',
              border: `${r.lineWidth}px solid ${color}`,
              opacity: r.opacity,
              willChange: 'transform, opacity',
              pointerEvents: 'none',
            }}
          />
        );
      })}
    </div>
  );
}
