'use client'

import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import React, { useEffect, useRef, useState, useCallback } from 'react'

// ---------------------------------------------------------------------------
// AnimatedSection — fades + slides children into view on scroll
// ---------------------------------------------------------------------------

interface AnimatedSectionProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
}

export function AnimatedSection({
  children,
  className,
  delay = 0,
  direction = 'up',
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const directionOffset: Record<string, { x: number; y: number }> = {
    up: { x: 0, y: 50 },
    down: { x: 0, y: -50 },
    left: { x: 50, y: 0 },
    right: { x: -50, y: 0 },
  }

  const offset = directionOffset[direction]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      animate={
        isInView
          ? { opacity: 1, x: 0, y: 0 }
          : { opacity: 0, x: offset.x, y: offset.y }
      }
      transition={{
        duration: 0.6,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// CountUp — animated number counter triggered on scroll
// ---------------------------------------------------------------------------

interface CountUpProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}

export function CountUp({
  value,
  duration = 2,
  prefix = '',
  suffix = '',
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const [displayValue, setDisplayValue] = useState(0)

  const animateCount = useCallback(() => {
    const startTime = performance.now()
    const durationMs = duration * 1000

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / durationMs, 1)

      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.round(eased * value))

      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }

    requestAnimationFrame(step)
  }, [value, duration])

  useEffect(() => {
    if (isInView) {
      animateCount()
    }
  }, [isInView, animateCount])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  )
}

// ---------------------------------------------------------------------------
// ParallaxSection — vertical translation based on scroll position
// ---------------------------------------------------------------------------

interface ParallaxSectionProps {
  children: React.ReactNode
  speed?: number
  className?: string
}

export function ParallaxSection({
  children,
  speed = 0.3,
  className,
}: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], ['-10%', '10%'])
  const adjustedY = useTransform(y, (v) => `translateY(${parseFloat(v) * speed}px)`)

  return (
    <div ref={ref} style={{ position: 'relative', overflow: 'hidden' }}>
      <motion.div style={{ y: adjustedY }} className={className}>
        {children}
      </motion.div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// GradientText — animated gradient text using background-clip
// ---------------------------------------------------------------------------

interface GradientTextProps {
  children: React.ReactNode
  className?: string
  animate?: boolean
}

export function GradientText({
  children,
  className,
  animate = true,
}: GradientTextProps) {
  const gradientColors = 'from-emerald-500 via-teal-400 via-amber-400 to-rose-500'

  return (
    <motion.span
      className={[
        'inline-block bg-gradient-to-r bg-clip-text text-transparent',
        gradientColors,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      animate={
        animate
          ? {
              backgroundPosition: ['0% 50%', '50% 50%', '100% 50%', '50% 50%', '0% 50%'],
            }
          : undefined
      }
      transition={
        animate
          ? {
              duration: 6,
              ease: 'linear',
              repeat: Infinity,
              repeatType: 'loop',
            }
          : undefined
      }
      style={{ backgroundSize: '300% 300%' }}
    >
      {children}
    </motion.span>
  )
}

// ---------------------------------------------------------------------------
// FloatElement — gentle up-and-down floating animation
// ---------------------------------------------------------------------------

interface FloatElementProps {
  children: React.ReactNode
  className?: string
  amplitude?: number
  duration?: number
}

export function FloatElement({
  children,
  className,
  amplitude = 10,
  duration = 4,
}: FloatElementProps) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -amplitude, 0] }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: 'loop',
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  )
}
