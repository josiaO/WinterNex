'use client';

import React from 'react';

// ─── Aurora Gradient ─────────────────────────────────────────────────────────
// A full-screen gradient that slowly shifts through emerald, teal, purple, and amber.

// ─── Floating Geometric Shapes ───────────────────────────────────────────────
// Small rotating shapes that drift across the screen at different speeds.

interface GeometricShape {
  shape: 'square' | 'triangle' | 'circle';
  size: number;
  x: string;
  y: string;
  color: string;
  opacity: number;
  rotation: number;
  animation: string;
  duration: number;
  delay: number;
}

const GEOMETRIC_SHAPES: GeometricShape[] = [
  // Squares
  { shape: 'square', size: 6, x: '12%', y: '20%', color: '#34d399', opacity: 0.08, rotation: 45, animation: 'geo-float-1', duration: 28, delay: 0 },
  { shape: 'square', size: 8, x: '78%', y: '35%', color: '#2dd4bf', opacity: 0.07, rotation: 30, animation: 'geo-float-2', duration: 32, delay: -5 },
  { shape: 'square', size: 5, x: '45%', y: '80%', color: '#fbbf24', opacity: 0.06, rotation: 60, animation: 'geo-float-3', duration: 26, delay: -10 },
  { shape: 'square', size: 7, x: '92%', y: '60%', color: '#c084fc', opacity: 0.06, rotation: 15, animation: 'geo-float-4', duration: 30, delay: -7 },
  { shape: 'square', size: 4, x: '30%', y: '5%', color: '#34d399', opacity: 0.07, rotation: 50, animation: 'geo-float-5', duration: 24, delay: -3 },
  { shape: 'square', size: 6, x: '60%', y: '90%', color: '#fb923c', opacity: 0.05, rotation: 35, animation: 'geo-float-1', duration: 29, delay: -12 },

  // Triangles
  { shape: 'triangle', size: 8, x: '20%', y: '55%', color: '#2dd4bf', opacity: 0.07, rotation: 0, animation: 'geo-float-6', duration: 34, delay: -2 },
  { shape: 'triangle', size: 6, x: '85%', y: '15%', color: '#fbbf24', opacity: 0.06, rotation: 120, animation: 'geo-float-7', duration: 27, delay: -8 },
  { shape: 'triangle', size: 10, x: '50%', y: '30%', color: '#c084fc', opacity: 0.05, rotation: 60, animation: 'geo-float-8', duration: 31, delay: -4 },
  { shape: 'triangle', size: 5, x: '5%', y: '75%', color: '#34d399', opacity: 0.08, rotation: 180, animation: 'geo-float-2', duration: 25, delay: -11 },
  { shape: 'triangle', size: 7, x: '70%', y: '70%', color: '#fb923c', opacity: 0.06, rotation: 90, animation: 'geo-float-3', duration: 33, delay: -6 },

  // Circles
  { shape: 'circle', size: 5, x: '35%', y: '25%', color: '#34d399', opacity: 0.09, rotation: 0, animation: 'geo-float-9', duration: 22, delay: -1 },
  { shape: 'circle', size: 4, x: '65%', y: '50%', color: '#c084fc', opacity: 0.07, rotation: 0, animation: 'geo-float-10', duration: 26, delay: -9 },
  { shape: 'circle', size: 6, x: '15%', y: '90%', color: '#fbbf24', opacity: 0.06, rotation: 0, animation: 'geo-float-4', duration: 30, delay: -5 },
  { shape: 'circle', size: 3, x: '88%', y: '85%', color: '#2dd4bf', opacity: 0.08, rotation: 0, animation: 'geo-float-1', duration: 20, delay: -13 },
  { shape: 'circle', size: 5, x: '40%', y: '60%', color: '#fb923c', opacity: 0.06, rotation: 0, animation: 'geo-float-5', duration: 28, delay: -7 },
];

// ─── Shooting Stars ──────────────────────────────────────────────────────────
// Occasional diagonal streaks that fly across the background.

interface ShootingStar {
  x: string;
  y: string;
  angle: number;
  length: number;
  animation: string;
  duration: number;
  delay: number;
  opacity: number;
}

const SHOOTING_STARS: ShootingStar[] = [
  { x: '20%', y: '5%', angle: -35, length: 120, animation: 'shoot-1', duration: 12, delay: 0, opacity: 0.12 },
  { x: '70%', y: '8%', angle: -40, length: 100, animation: 'shoot-2', duration: 15, delay: -4, opacity: 0.10 },
  { x: '45%', y: '2%', angle: -30, length: 90, animation: 'shoot-3', duration: 18, delay: -9, opacity: 0.08 },
  { x: '85%', y: '12%', angle: -45, length: 80, animation: 'shoot-4', duration: 14, delay: -6, opacity: 0.09 },
  { x: '10%', y: '15%', angle: -25, length: 110, animation: 'shoot-5', duration: 16, delay: -11, opacity: 0.07 },
  { x: '55%', y: '6%', angle: -38, length: 95, animation: 'shoot-1', duration: 20, delay: -14, opacity: 0.06 },
];

// ─── Glow Orbs ───────────────────────────────────────────────────────────────
// 18 softly colored orbs that drift in organic paths using different keyframe animations.

interface OrbConfig {
  size: number;
  color: string;
  opacity: number;
  blur: number;
  x: string;
  y: string;
  animation: string;
  duration: number;
  delay: number;
}

const GLOW_ORBS: OrbConfig[] = [
  // Background atmosphere (large, very faint)
  { size: 220, color: 'rgb(52 211 153 / var(--orb-o))', opacity: 0.035, blur: 130, x: '8%', y: '12%', animation: 'orb-drift-1', duration: 38, delay: 0 },
  { size: 200, color: 'rgb(45 212 191 / var(--orb-o))', opacity: 0.03, blur: 140, x: '72%', y: '58%', animation: 'orb-drift-2', duration: 42, delay: -5 },
  { size: 190, color: 'rgb(251 191 36 / var(--orb-o))', opacity: 0.025, blur: 130, x: '48%', y: '78%', animation: 'orb-drift-3', duration: 40, delay: -10 },
  { size: 210, color: 'rgb(16 185 129 / var(--orb-o))', opacity: 0.03, blur: 145, x: '22%', y: '42%', animation: 'orb-drift-4', duration: 37, delay: -8 },
  { size: 195, color: 'rgb(192 132 252 / var(--orb-o))', opacity: 0.025, blur: 135, x: '82%', y: '18%', animation: 'orb-drift-5', duration: 44, delay: -12 },

  // Mid-ground (medium, slightly visible)
  { size: 130, color: 'rgb(52 211 153 / var(--orb-o))', opacity: 0.06, blur: 85, x: '14%', y: '68%', animation: 'orb-drift-6', duration: 28, delay: -3 },
  { size: 110, color: 'rgb(94 234 212 / var(--orb-o))', opacity: 0.055, blur: 80, x: '62%', y: '22%', animation: 'orb-drift-7', duration: 30, delay: -7 },
  { size: 140, color: 'rgb(253 186 116 / var(--orb-o))', opacity: 0.05, blur: 85, x: '33%', y: '8%', animation: 'orb-drift-1', duration: 32, delay: -14 },
  { size: 120, color: 'rgb(45 212 191 / var(--orb-o))', opacity: 0.06, blur: 75, x: '87%', y: '48%', animation: 'orb-drift-3', duration: 27, delay: -2 },
  { size: 125, color: 'rgb(251 191 36 / var(--orb-o))', opacity: 0.045, blur: 80, x: '43%', y: '52%', animation: 'orb-drift-8', duration: 34, delay: -9 },
  { size: 115, color: 'rgb(16 185 129 / var(--orb-o))', opacity: 0.055, blur: 78, x: '3%', y: '28%', animation: 'orb-drift-2', duration: 29, delay: -6 },

  // Foreground accents (small, more saturated)
  { size: 65, color: 'rgb(52 211 153 / var(--orb-o))', opacity: 0.09, blur: 50, x: '18%', y: '83%', animation: 'orb-drift-9', duration: 22, delay: -1 },
  { size: 55, color: 'rgb(253 186 116 / var(--orb-o))', opacity: 0.085, blur: 48, x: '77%', y: '13%', animation: 'orb-drift-10', duration: 24, delay: -4 },
  { size: 60, color: 'rgb(94 234 212 / var(--orb-o))', opacity: 0.09, blur: 52, x: '91%', y: '68%', animation: 'orb-drift-6', duration: 20, delay: -8 },
  { size: 50, color: 'rgb(192 132 252 / var(--orb-o))', opacity: 0.075, blur: 45, x: '55%', y: '4%', animation: 'orb-drift-4', duration: 21, delay: -5 },
  { size: 45, color: 'rgb(251 146 60 / var(--orb-o))', opacity: 0.08, blur: 42, x: '38%', y: '88%', animation: 'orb-drift-7', duration: 23, delay: -11 },
  { size: 40, color: 'rgb(45 212 191 / var(--orb-o))', opacity: 0.09, blur: 38, x: '67%', y: '38%', animation: 'orb-drift-1', duration: 19, delay: -2 },
  { size: 48, color: 'rgb(251 191 36 / var(--orb-o))', opacity: 0.08, blur: 40, x: '8%', y: '52%', animation: 'orb-drift-8', duration: 21, delay: -7 },
];

// ─── Component ──────────────────────────────────────────────────────────────

const FloatingOrbs: React.FC = React.memo(() => {
  return (
    <>
      {/* ── Keyframe Animations ── */}
      <style>{`
        /* ═══════════════════════════════════════════════════════════════════════
           Aurora Gradient Animations
           ═══════════════════════════════════════════════════════════════════════ */

        @keyframes aurora-shift {
          0% {
            background-position: 0% 50%;
          }
          25% {
            background-position: 50% 0%;
          }
          50% {
            background-position: 100% 50%;
          }
          75% {
            background-position: 50% 100%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes aurora-rotate {
          0% {
            transform: rotate(0deg) scale(1.3);
          }
          50% {
            transform: rotate(180deg) scale(1.5);
          }
          100% {
            transform: rotate(360deg) scale(1.3);
          }
        }

        @keyframes aurora-pulse {
          0%, 100% {
            opacity: 0.35;
          }
          50% {
            opacity: 0.55;
          }
        }

        /* ═══════════════════════════════════════════════════════════════════════
           Geometric Shape Animations
           ═══════════════════════════════════════════════════════════════════════ */

        @keyframes geo-float-1 {
          0%   { transform: translate(0, 0) rotate(0deg) }
          25%  { transform: translate(50px, -30px) rotate(90deg) }
          50%  { transform: translate(-20px, -70px) rotate(180deg) }
          75%  { transform: translate(-60px, 15px) rotate(270deg) }
          100% { transform: translate(0, 0) rotate(360deg) }
        }

        @keyframes geo-float-2 {
          0%   { transform: translate(0, 0) rotate(0deg) }
          25%  { transform: translate(-40px, 40px) rotate(-90deg) }
          50%  { transform: translate(30px, 80px) rotate(-180deg) }
          75%  { transform: translate(60px, -15px) rotate(-270deg) }
          100% { transform: translate(0, 0) rotate(-360deg) }
        }

        @keyframes geo-float-3 {
          0%   { transform: translate(0, 0) rotate(0deg) }
          33%  { transform: translate(25px, 60px) rotate(120deg) }
          66%  { transform: translate(-55px, 30px) rotate(240deg) }
          100% { transform: translate(0, 0) rotate(360deg) }
        }

        @keyframes geo-float-4 {
          0%   { transform: translate(0, 0) rotate(0deg) }
          25%  { transform: translate(-70px, -25px) rotate(-90deg) }
          50%  { transform: translate(-35px, 55px) rotate(-180deg) }
          75%  { transform: translate(45px, 25px) rotate(-270deg) }
          100% { transform: translate(0, 0) rotate(-360deg) }
        }

        @keyframes geo-float-5 {
          0%   { transform: translate(0, 0) rotate(0deg) }
          20%  { transform: translate(40px, 40px) rotate(72deg) }
          40%  { transform: translate(70px, -15px) rotate(144deg) }
          60%  { transform: translate(15px, -55px) rotate(216deg) }
          80%  { transform: translate(-35px, -25px) rotate(288deg) }
          100% { transform: translate(0, 0) rotate(360deg) }
        }

        @keyframes geo-float-6 {
          0%   { transform: translate(0, 0) rotate(0deg) }
          33%  { transform: translate(-65px, 25px) rotate(-120deg) }
          66%  { transform: translate(35px, -55px) rotate(-240deg) }
          100% { transform: translate(0, 0) rotate(-360deg) }
        }

        @keyframes geo-float-7 {
          0%   { transform: translate(0, 0) rotate(0deg) }
          33%  { transform: translate(45px, -65px) rotate(120deg) }
          66%  { transform: translate(-25px, 45px) rotate(240deg) }
          100% { transform: translate(0, 0) rotate(360deg) }
        }

        @keyframes geo-float-8 {
          0%   { transform: translate(0, 0) rotate(0deg) }
          25%  { transform: translate(-35px, -55px) rotate(90deg) }
          50%  { transform: translate(25px, -25px) rotate(180deg) }
          75%  { transform: translate(55px, 45px) rotate(270deg) }
          100% { transform: translate(0, 0) rotate(360deg) }
        }

        @keyframes geo-float-9 {
          0%   { transform: translate(0, 0) }
          20%  { transform: translate(20px, -30px) }
          40%  { transform: translate(-10px, -50px) }
          60%  { transform: translate(-30px, -10px) }
          80%  { transform: translate(-8px, 25px) }
          100% { transform: translate(0, 0) }
        }

        @keyframes geo-float-10 {
          0%   { transform: translate(0, 0) }
          20%  { transform: translate(-25px, 15px) }
          40%  { transform: translate(-45px, 45px) }
          60%  { transform: translate(8px, 35px) }
          80%  { transform: translate(25px, -8px) }
          100% { transform: translate(0, 0) }
        }

        /* ═══════════════════════════════════════════════════════════════════════
           Shooting Star Animations
           ═══════════════════════════════════════════════════════════════════════ */

        @keyframes shoot-1 {
          0% {
            transform: translateX(0) translateY(0);
            opacity: 0;
          }
          2% {
            opacity: 1;
          }
          15% {
            opacity: 1;
          }
          20% {
            transform: translateX(400px) translateY(280px);
            opacity: 0;
          }
          100% {
            transform: translateX(400px) translateY(280px);
            opacity: 0;
          }
        }

        @keyframes shoot-2 {
          0% {
            transform: translateX(0) translateY(0);
            opacity: 0;
          }
          2% {
            opacity: 1;
          }
          12% {
            opacity: 1;
          }
          18% {
            transform: translateX(350px) translateY(300px);
            opacity: 0;
          }
          100% {
            transform: translateX(350px) translateY(300px);
            opacity: 0;
          }
        }

        @keyframes shoot-3 {
          0% {
            transform: translateX(0) translateY(0);
            opacity: 0;
          }
          1.5% {
            opacity: 1;
          }
          10% {
            opacity: 1;
          }
          15% {
            transform: translateX(300px) translateY(200px);
            opacity: 0;
          }
          100% {
            transform: translateX(300px) translateY(200px);
            opacity: 0;
          }
        }

        @keyframes shoot-4 {
          0% {
            transform: translateX(0) translateY(0);
            opacity: 0;
          }
          3% {
            opacity: 1;
          }
          14% {
            opacity: 1;
          }
          20% {
            transform: translateX(280px) translateY(350px);
            opacity: 0;
          }
          100% {
            transform: translateX(280px) translateY(350px);
            opacity: 0;
          }
        }

        @keyframes shoot-5 {
          0% {
            transform: translateX(0) translateY(0);
            opacity: 0;
          }
          2.5% {
            opacity: 1;
          }
          13% {
            opacity: 1;
          }
          17% {
            transform: translateX(420px) translateY(250px);
            opacity: 0;
          }
          100% {
            transform: translateX(420px) translateY(250px);
            opacity: 0;
          }
        }

        /* ═══════════════════════════════════════════════════════════════════════
           Orb Drift Animations
           ═══════════════════════════════════════════════════════════════════════ */

        @keyframes orb-drift-1 {
          0%   { transform: translate(0, 0) }
          25%  { transform: translate(60px, -40px) }
          50%  { transform: translate(-20px, -80px) }
          75%  { transform: translate(-60px, 20px) }
          100% { transform: translate(0, 0) }
        }

        @keyframes orb-drift-2 {
          0%   { transform: translate(0, 0) }
          25%  { transform: translate(-50px, 50px) }
          50%  { transform: translate(40px, 90px) }
          75%  { transform: translate(70px, -10px) }
          100% { transform: translate(0, 0) }
        }

        @keyframes orb-drift-3 {
          0%   { transform: translate(0, 0) }
          25%  { transform: translate(30px, 70px) }
          50%  { transform: translate(-60px, 40px) }
          75%  { transform: translate(-30px, -50px) }
          100% { transform: translate(0, 0) }
        }

        @keyframes orb-drift-4 {
          0%   { transform: translate(0, 0) }
          25%  { transform: translate(-80px, -30px) }
          50%  { transform: translate(-40px, 60px) }
          75%  { transform: translate(50px, 30px) }
          100% { transform: translate(0, 0) }
        }

        @keyframes orb-drift-5 {
          0%   { transform: translate(0, 0) }
          20%  { transform: translate(45px, 45px) }
          40%  { transform: translate(80px, -20px) }
          60%  { transform: translate(20px, -60px) }
          80%  { transform: translate(-40px, -30px) }
          100% { transform: translate(0, 0) }
        }

        @keyframes orb-drift-6 {
          0%   { transform: translate(0, 0) }
          33%  { transform: translate(-70px, 30px) }
          66%  { transform: translate(40px, -60px) }
          100% { transform: translate(0, 0) }
        }

        @keyframes orb-drift-7 {
          0%   { transform: translate(0, 0) }
          33%  { transform: translate(50px, -70px) }
          66%  { transform: translate(-30px, 50px) }
          100% { transform: translate(0, 0) }
        }

        @keyframes orb-drift-8 {
          0%   { transform: translate(0, 0) }
          25%  { transform: translate(-40px, -60px) }
          50%  { transform: translate(30px, -30px) }
          75%  { transform: translate(60px, 50px) }
          100% { transform: translate(0, 0) }
        }

        @keyframes orb-drift-9 {
          0%   { transform: translate(0, 0) }
          20%  { transform: translate(25px, -35px) }
          40%  { transform: translate(-15px, -55px) }
          60%  { transform: translate(-35px, -15px) }
          80%  { transform: translate(-10px, 30px) }
          100% { transform: translate(0, 0) }
        }

        @keyframes orb-drift-10 {
          0%   { transform: translate(0, 0) }
          20%  { transform: translate(-30px, 20px) }
          40%  { transform: translate(-50px, 50px) }
          60%  { transform: translate(10px, 40px) }
          80%  { transform: translate(30px, -10px) }
          100% { transform: translate(0, 0) }
        }

        /* ═══════════════════════════════════════════════════════════════════════
           Shared Classes
           ═══════════════════════════════════════════════════════════════════════ */

        .aurora-gradient {
          position: absolute;
          inset: -30%;
          width: 160%;
          height: 160%;
          background: linear-gradient(
            135deg,
            rgb(52 211 153 / 0.08) 0%,
            rgb(45 212 191 / 0.06) 20%,
            rgb(192 132 252 / 0.05) 40%,
            rgb(251 191 36 / 0.04) 60%,
            rgb(52 211 153 / 0.07) 80%,
            rgb(45 212 191 / 0.06) 100%
          );
          background-size: 400% 400%;
          animation: aurora-shift 45s ease-in-out infinite, aurora-rotate 120s linear infinite;
          pointer-events: none;
          filter: blur(60px);
        }

        .aurora-secondary {
          position: absolute;
          inset: -20%;
          width: 140%;
          height: 140%;
          background: radial-gradient(
            ellipse at 30% 50%,
            rgb(192 132 252 / 0.06) 0%,
            transparent 50%
          ),
          radial-gradient(
            ellipse at 70% 30%,
            rgb(52 211 153 / 0.05) 0%,
            transparent 50%
          ),
          radial-gradient(
            ellipse at 50% 80%,
            rgb(251 191 36 / 0.04) 0%,
            transparent 50%
          );
          animation: aurora-pulse 30s ease-in-out infinite, aurora-shift 60s ease-in-out infinite reverse;
          pointer-events: none;
          filter: blur(50px);
        }

        .geo-shape {
          position: absolute;
          pointer-events: none;
          will-change: transform;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-fill-mode: both;
        }

        .geo-square {
          border-radius: 2px;
        }

        .geo-triangle {
          width: 0 !important;
          height: 0 !important;
          border-left-style: solid;
          border-right-style: solid;
          border-bottom-style: solid;
          border-left-color: transparent;
          border-right-color: transparent;
          background: transparent !important;
        }

        .geo-circle {
          border-radius: 50%;
        }

        .shooting-star {
          position: absolute;
          width: 2px;
          height: 2px;
          background: white;
          border-radius: 50%;
          pointer-events: none;
          will-change: transform, opacity;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .shooting-star::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100px;
          height: 1px;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.6), transparent);
          transform-origin: left center;
        }

        .orb {
          position: absolute;
          border-radius: 9999px;
          pointer-events: none;
          will-change: transform;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-fill-mode: both;
        }
      `}</style>

      {/* ── Container ── */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      >
        {/* ── Layer 1: Aurora Gradients ── */}
        <div className="aurora-gradient" />
        <div className="aurora-secondary" />

        {/* ── Layer 2: Glow Orbs ── */}
        {GLOW_ORBS.map((orb, i) => (
          <span
            key={`orb-${i}`}
            className="orb"
            style={{
              width: orb.size,
              height: orb.size,
              left: orb.x,
              top: orb.y,
              backgroundColor: orb.color,
              '--orb-o': orb.opacity,
              filter: `blur(${orb.blur}px)`,
              opacity: orb.opacity,
              animationName: orb.animation,
              animationDuration: `${orb.duration}s`,
              animationDelay: `${orb.delay}s`,
            } as React.CSSProperties}
          />
        ))}

        {/* ── Layer 3: Floating Geometric Shapes ── */}
        {GEOMETRIC_SHAPES.map((shape, i) => {
          if (shape.shape === 'triangle') {
            return (
              <span
                key={`geo-${i}`}
                className="geo-shape geo-triangle"
                style={{
                  left: shape.x,
                  top: shape.y,
                  borderColor: `${shape.color} transparent transparent transparent`,
                  borderWidth: `0 ${shape.size / 2}px ${shape.size}px ${shape.size / 2}px`,
                  opacity: shape.opacity,
                  animationName: shape.animation,
                  animationDuration: `${shape.duration}s`,
                  animationDelay: `${shape.delay}s`,
                }}
              />
            );
          }

          return (
            <span
              key={`geo-${i}`}
              className={`geo-shape geo-${shape.shape}`}
              style={{
                width: shape.size,
                height: shape.size,
                left: shape.x,
                top: shape.y,
                backgroundColor: shape.color,
                opacity: shape.opacity,
                transform: `rotate(${shape.rotation}deg)`,
                animationName: shape.animation,
                animationDuration: `${shape.duration}s`,
                animationDelay: `${shape.delay}s`,
              }}
            />
          );
        })}

        {/* ── Layer 4: Shooting Stars ── */}
        {SHOOTING_STARS.map((star, i) => (
          <span
            key={`star-${i}`}
            className="shooting-star"
            style={{
              left: star.x,
              top: star.y,
              opacity: star.opacity,
              transform: `rotate(${star.angle}deg)`,
              animationName: star.animation,
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`,
            }}
          >
            <span
              style={{
                display: 'block',
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${star.length}px`,
                height: '1px',
                background: `linear-gradient(90deg, rgba(255, 255, 255, ${star.opacity}), transparent)`,
                transformOrigin: 'left center',
                pointerEvents: 'none',
              }}
            />
          </span>
        ))}
      </div>
    </>
  );
});

FloatingOrbs.displayName = 'FloatingOrbs';

export default FloatingOrbs;
