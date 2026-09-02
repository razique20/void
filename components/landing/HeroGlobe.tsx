'use client';

import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef } from 'react';

/* -------------------------------------------------- */
/* 3D Wireframe Globe with CSS perspective transforms */
/* -------------------------------------------------- */

const LATITUDE_COUNT = 7;
const LONGITUDE_COUNT = 12;
const GLOBE_RADIUS = 140; // px

/** Generate points along a latitude circle at a given angle (degrees) */
function latitudeRing(latDeg: number, segments: number) {
  const latRad = (latDeg * Math.PI) / 180;
  const r = GLOBE_RADIUS * Math.cos(latRad);
  const y = GLOBE_RADIUS * Math.sin(latRad);
  const points: string[] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    const x = r * Math.cos(angle);
    const z = r * Math.sin(angle);
    points.push(`${x},${y},${z}`);
  }
  return points;
}

/** Generate points along a longitude half-circle */
function longitudeArc(lonDeg: number, segments: number) {
  const lonRad = (lonDeg * Math.PI) / 180;
  const points: string[] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    const x = GLOBE_RADIUS * Math.cos(angle) * Math.cos(lonRad);
    const y = GLOBE_RADIUS * Math.sin(angle);
    const z = GLOBE_RADIUS * Math.cos(angle) * Math.sin(lonRad);
    points.push(`${x},${y},${z}`);
  }
  return points;
}

/** Dot positions at grid intersections */
const DOTS: { lat: number; lon: number }[] = [];
const latitudes = [-50, -25, 0, 25, 50];
const longitudes = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
for (const lat of latitudes) {
  for (const lon of longitudes) {
    DOTS.push({ lat, lon });
  }
}

function dotPosition(latDeg: number, lonDeg: number) {
  const latRad = (latDeg * Math.PI) / 180;
  const lonRad = (lonDeg * Math.PI) / 180;
  return {
    x: GLOBE_RADIUS * Math.cos(latRad) * Math.cos(lonRad),
    y: GLOBE_RADIUS * Math.sin(latRad),
    z: GLOBE_RADIUS * Math.cos(latRad) * Math.sin(lonRad),
  };
}

export default function HeroGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Scroll drives extra rotation speed and tilt
  const scrollRotateY = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const scrollRotateX = useTransform(scrollYProgress, [0, 0.5], [0, 25]);
  const smoothRotateY = useSpring(scrollRotateY, { stiffness: 40, damping: 20 });
  const smoothRotateX = useSpring(scrollRotateX, { stiffness: 40, damping: 20 });

  const latitudes_ring = Array.from({ length: LATITUDE_COUNT }, (_, i) => {
    const latDeg = -60 + (120 / (LATITUDE_COUNT - 1)) * i;
    return latDeg;
  });

  const longitudes_ring = Array.from({ length: LONGITUDE_COUNT }, (_, i) => {
    return (i / LONGITUDE_COUNT) * 180;
  });

  return (
    <div ref={containerRef} className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Outer glow */}
      <div className="absolute w-[400px] h-[400px] bg-emerald-500/[0.08] rounded-full blur-[100px]" />

      {/* 3D perspective container */}
      <div
        className="relative"
        style={{
          width: GLOBE_RADIUS * 2 + 60,
          height: GLOBE_RADIUS * 2 + 60,
          perspective: '900px',
          perspectiveOrigin: '50% 50%',
        }}
      >
        {/* Rotating globe group */}
        <motion.div
          className="absolute inset-0"
          style={{
            transformStyle: 'preserve-3d',
            rotateY: smoothRotateY,
            rotateX: smoothRotateX,
          }}
        >
          {/* Latitude rings */}
          {latitudes_ring.map((latDeg) => {
            const ringPoints = latitudeRing(latDeg, 64);
            const pathD = `M ${ringPoints.join(' L ')}`;
            return (
              <svg
                key={`lat-${latDeg}`}
                className="absolute inset-0"
                width={GLOBE_RADIUS * 2 + 60}
                height={GLOBE_RADIUS * 2 + 60}
                viewBox={`${-GLOBE_RADIUS - 30} ${-GLOBE_RADIUS - 30} ${GLOBE_RADIUS * 2 + 60} ${GLOBE_RADIUS * 2 + 60}`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <path
                  d={pathD}
                  fill="none"
                  stroke="rgba(16, 185, 129, 0.18)"
                  strokeWidth="0.8"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            );
          })}

          {/* Longitude arcs */}
          {longitudes_ring.map((lonDeg) => {
            const arcPoints = longitudeArc(lonDeg, 64);
            const pathD = `M ${arcPoints.join(' L ')}`;
            return (
              <svg
                key={`lon-${lonDeg}`}
                className="absolute inset-0"
                width={GLOBE_RADIUS * 2 + 60}
                height={GLOBE_RADIUS * 2 + 60}
                viewBox={`${-GLOBE_RADIUS - 30} ${-GLOBE_RADIUS - 30} ${GLOBE_RADIUS * 2 + 60} ${GLOBE_RADIUS * 2 + 60}`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <path
                  d={pathD}
                  fill="none"
                  stroke="rgba(16, 185, 129, 0.14)"
                  strokeWidth="0.6"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            );
          })}

          {/* Intersection dots */}
          {DOTS.map((dot, i) => {
            const pos = dotPosition(dot.lat, dot.lon);
            return (
              <motion.div
                key={`dot-${i}`}
                className="absolute rounded-full bg-emerald-400/60"
                style={{
                  width: 3,
                  height: 3,
                  left: '50%',
                  top: '50%',
                  transformStyle: 'preserve-3d',
                  transform: `translate3d(${pos.x - 1.5}px, ${pos.y - 1.5}px, ${pos.z}px)`,
                }}
                animate={{
                  opacity: [0.3, 0.8, 0.3],
                  scale: [1, 1.6, 1],
                }}
                transition={{
                  duration: 3 + (i % 5) * 0.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: (i % 7) * 0.4,
                }}
              />
            );
          })}

          {/* Equator highlight ring */}
          <svg
            className="absolute inset-0"
            width={GLOBE_RADIUS * 2 + 60}
            height={GLOBE_RADIUS * 2 + 60}
            viewBox={`${-GLOBE_RADIUS - 30} ${-GLOBE_RADIUS - 30} ${GLOBE_RADIUS * 2 + 60} ${GLOBE_RADIUS * 2 + 60}`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <defs>
              <linearGradient id="equator-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(16, 185, 129, 0.0)" />
                <stop offset="30%" stopColor="rgba(16, 185, 129, 0.5)" />
                <stop offset="50%" stopColor="rgba(52, 211, 153, 0.7)" />
                <stop offset="70%" stopColor="rgba(16, 185, 129, 0.5)" />
                <stop offset="100%" stopColor="rgba(16, 185, 129, 0.0)" />
              </linearGradient>
            </defs>
            <circle
              cx="0"
              cy="0"
              r={GLOBE_RADIUS}
              fill="none"
              stroke="url(#equator-gradient)"
              strokeWidth="1.5"
            />
          </svg>

          {/* Glowing equator path (latitude 0) */}
          {(() => {
            const eqPoints = latitudeRing(0, 64);
            return (
              <svg
                className="absolute inset-0"
                width={GLOBE_RADIUS * 2 + 60}
                height={GLOBE_RADIUS * 2 + 60}
                viewBox={`${-GLOBE_RADIUS - 30} ${-GLOBE_RADIUS - 30} ${GLOBE_RADIUS * 2 + 60} ${GLOBE_RADIUS * 2 + 60}`}
                style={{ transformStyle: 'preserve-3d', filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.4))' }}
              >
                <path
                  d={`M ${eqPoints.join(' L ')}`}
                  fill="none"
                  stroke="rgba(52, 211, 153, 0.35)"
                  strokeWidth="1.5"
                />
              </svg>
            );
          })()}
        </motion.div>

        {/* Orbiting particle */}
        <motion.div
          className="absolute"
          style={{
            width: 6,
            height: 6,
            left: '50%',
            top: '50%',
            marginLeft: -3,
            marginTop: -3,
            transformStyle: 'preserve-3d',
          }}
          animate={{
            rotateY: [0, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <div
            className="w-2 h-2 rounded-full bg-emerald-400"
            style={{
              transform: `translateZ(${GLOBE_RADIUS + 15}px)`,
              boxShadow: '0 0 12px 4px rgba(52, 211, 153, 0.6)',
            }}
          />
        </motion.div>

        {/* Second orbiting particle (opposite direction) */}
        <motion.div
          className="absolute"
          style={{
            width: 4,
            height: 4,
            left: '50%',
            top: '50%',
            marginLeft: -2,
            marginTop: -2,
            transformStyle: 'preserve-3d',
          }}
          animate={{
            rotateY: [360, 0],
            rotateX: [20, 20],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full bg-cyan-400"
            style={{
              transform: `translateZ(${GLOBE_RADIUS + 25}px) translateY(${GLOBE_RADIUS * 0.3}px)`,
              boxShadow: '0 0 8px 3px rgba(34, 211, 238, 0.4)',
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
