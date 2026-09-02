'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

/* -------------------------------------------------- */
/* 3D Cursor Follower with glowing trail               */
/* -------------------------------------------------- */

const TRAIL_LENGTH = 12;
const SPRING_STIFFNESS = 150;
const SPRING_DAMPING = 15;

interface TrailDot {
  x: number;
  y: number;
  opacity: number;
  scale: number;
  hue: number;
}

export default function CursorTrail() {
  const [visible, setVisible] = useState(false);
  const [trail, setTrail] = useState<TrailDot[]>([]);

  // Raw cursor position
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Smoothed cursor for the main follower
  const smoothX = useSpring(cursorX, { stiffness: SPRING_STIFFNESS, damping: SPRING_DAMPING });
  const smoothY = useSpring(cursorY, { stiffness: SPRING_STIFFNESS, damping: SPRING_DAMPING });

  // 3D rotation based on cursor velocity
  const rotateX = useTransform(smoothY, [0, 900], [10, -10]);
  const rotateY = useTransform(smoothX, [0, 1440], [-10, 10]);

  // Trail ring scales based on cursor speed (faster = bigger)
  const ringScale = useSpring(1, { stiffness: 200, damping: 20 });

  // ── Derived transforms for the three layers (top-level, never conditional) ──

  // Inner orb
  const orbX = useTransform(smoothX, (v) => v - 20);
  const orbY = useTransform(smoothY, (v) => v - 20);

  // Outer ring
  const ringX = useTransform(smoothX, (v) => v - 24);
  const ringY = useTransform(smoothY, (v) => v - 24);
  const ringRotateX = useTransform(rotateX, (v) => v * 0.5);
  const ringRotateY = useTransform(rotateY, (v) => v * 0.5);

  // Ground shadow
  const shadowX = useTransform(smoothX, (v) => v - 16);
  const shadowY = useTransform(smoothY, (v) => v + 12);
  const shadowOpacity = useTransform(smoothY, [0, 400, 800], [0.15, 0.1, 0.05]);

  useEffect(() => {
    // Check for reduced motion preference
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;

    let animFrame: number;
    const positions: { x: number; y: number }[] = [];

    function handleMouseMove(e: MouseEvent) {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      setVisible(true);

      positions.push({ x: e.clientX, y: e.clientY });
      if (positions.length > 4) positions.shift();

      // Calculate speed for ring scaling
      if (positions.length >= 2) {
        const dx = positions[positions.length - 1].x - positions[0].x;
        const dy = positions[positions.length - 1].y - positions[0].y;
        const speed = Math.sqrt(dx * dx + dy * dy);
        ringScale.set(1 + Math.min(speed / 200, 1.5));
      }
    }

    function handleMouseLeave() {
      setVisible(false);
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    // Trail update loop
    let lastUpdate = 0;
    const TRAIL_INTERVAL = 30; // ms between trail point captures

    function updateTrail(timestamp: number) {
      if (timestamp - lastUpdate > TRAIL_INTERVAL) {
        lastUpdate = timestamp;
        const x = cursorX.get();
        const y = cursorY.get();

        setTrail((prev) => {
          const next = [
            ...prev,
            {
              x,
              y,
              opacity: 1,
              scale: 1,
              hue: 140 + (x / (typeof window !== 'undefined' ? window.innerWidth : 1440)) * 40,
            },
          ];
          return next.slice(-TRAIL_LENGTH);
        });
      }
      animFrame = requestAnimationFrame(updateTrail);
    }

    animFrame = requestAnimationFrame(updateTrail);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animFrame);
    };
  }, [cursorX, cursorY, ringScale]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none">
      {/* Trail dots */}
      {trail.map((dot, i) => {
        const progress = i / trail.length;
        const opacity = progress * 0.5;
        const scale = 0.3 + progress * 0.7;
        const size = 4 + progress * 8;

        return (
          <motion.div
            key={`${i}-${dot.x}-${dot.y}`}
            className="absolute rounded-full"
            initial={{ opacity: opacity, scale: scale }}
            animate={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              width: size,
              height: size,
              left: dot.x - size / 2,
              top: dot.y - size / 2,
              background: `hsl(${dot.hue}, 70%, 55%)`,
              boxShadow: `0 0 ${6 + progress * 8}px ${2 + progress * 4}px hsl(${dot.hue}, 70%, 55%, ${opacity * 0.6})`,
              transformStyle: 'preserve-3d',
              transform: `translateZ(${progress * 30}px)`,
            }}
          />
        );
      })}

      {/* Main cursor follower — glowing orb */}
      <motion.div
        className="absolute"
        style={{
          x: orbX,
          y: orbY,
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          perspective: 600,
        }}
      >
        {/* Inner glow */}
        <div
          className="w-10 h-10 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(52, 211, 153, 0.4) 0%, rgba(16, 185, 129, 0.1) 50%, transparent 70%)',
            boxShadow: '0 0 20px 8px rgba(52, 211, 153, 0.2), 0 0 40px 16px rgba(16, 185, 129, 0.1)',
          }}
        />
      </motion.div>

      {/* Outer ring — expands with speed */}
      <motion.div
        className="absolute"
        style={{
          x: ringX,
          y: ringY,
          scale: ringScale,
          rotateX: ringRotateX,
          rotateY: ringRotateY,
          transformStyle: 'preserve-3d',
          perspective: 800,
        }}
      >
        <div
          className="w-12 h-12 rounded-full border"
          style={{
            borderColor: 'rgba(52, 211, 153, 0.25)',
            boxShadow: '0 0 12px 4px rgba(52, 211, 153, 0.08), inset 0 0 8px 2px rgba(52, 211, 153, 0.05)',
          }}
        />
      </motion.div>

      {/* 3D shadow beneath cursor */}
      <motion.div
        className="absolute"
        style={{
          x: shadowX,
          y: shadowY,
          opacity: shadowOpacity,
        }}
      >
        <div
          className="w-8 h-3 rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
            filter: 'blur(4px)',
            transform: 'scaleY(0.4)',
          }}
        />
      </motion.div>
    </div>
  );
}
