'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

/* ─── Types ─── */
export interface PlanetModule {
  id: string
  label: string
  emoji: string
  href: string
  progress: number      // 0–100
  status: string
  color: string         // accent color hex
}

interface OrbitSystemProps {
  currentDay: number    // 1–90
  daysRemaining: number
  planets: PlanetModule[]
  size?: number         // px width of the container
}

/* ─── Helpers ─── */
function toRad(deg: number) { return (deg * Math.PI) / 180 }

/** Position a point on an ellipse. rx/ry are semi-axes. */
function ellipsePoint(cx: number, cy: number, rx: number, ry: number, angleDeg: number) {
  const a = toRad(angleDeg - 90) // 0° = top
  return {
    x: cx + rx * Math.cos(a),
    y: cy + ry * Math.sin(a),
  }
}

/* ─── Planet angles (fixed positions around orbit) ─── */
const PLANET_ANGLES = [45, 130, 200, 270, 340]

/* ─── OrbitSystem ─── */
export default function OrbitSystem({ currentDay, daysRemaining, planets, size = 460 }: OrbitSystemProps) {
  const router = useRouter()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const cx = size / 2
  const cy = size / 2

  /* Orbit radii — three rings, slightly elliptical */
  const rings = [
    { rx: size * 0.14, ry: size * 0.10 },
    { rx: size * 0.22, ry: size * 0.16 },
    { rx: size * 0.34, ry: size * 0.26 },
  ]
  const outerRing = rings[2]

  /* Spacecraft position on outermost ring */
  const progressAngle = (currentDay / 90) * 360
  const craft = ellipsePoint(cx, cy, outerRing.rx, outerRing.ry, progressAngle)

  /* Planet positions */
  const planetPoints = PLANET_ANGLES.map(ang =>
    ellipsePoint(cx, cy, outerRing.rx * 1.32, outerRing.ry * 1.35, ang)
  )

  /* Planet size & glow based on progress */
  function planetStyle(pct: number, color: string) {
    const opacity = 0.25 + (pct / 100) * 0.75
    const glowSize = pct > 75 ? 18 : pct > 40 ? 10 : pct > 10 ? 5 : 0
    const r = pct > 80 ? 14 : pct > 40 ? 12 : 10
    return { opacity, glowSize, r, color }
  }

  return (
    <div className="relative select-none" style={{ width: size, height: size }}>

      {/* ── SVG layer: rings + spacecraft + planet cores ── */}
      <svg
        ref={svgRef}
        width={size}
        height={size}
        className="absolute inset-0"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Amber gradient for orbit rings */}
          <linearGradient id="orbit-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E8A838" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#D4761C" stopOpacity="0.05" />
          </linearGradient>
          {/* Core glow filter */}
          <filter id="core-glow">
            <feGaussianBlur stdDeviation="8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Planet glow filter */}
          <filter id="planet-glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Craft glow */}
          <filter id="craft-glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Orbit rings */}
        {rings.map((ring, i) => (
          <ellipse
            key={i}
            cx={cx} cy={cy}
            rx={ring.rx} ry={ring.ry}
            fill="none"
            stroke="#E8A838"
            strokeWidth={i === 2 ? 1.2 : 0.7}
            strokeOpacity={i === 2 ? 0.22 : 0.10}
            strokeDasharray={i === 2 ? '4 6' : '2 8'}
          />
        ))}

        {/* Spacecraft trail (short arc behind the craft) */}
        {(() => {
          const trailLength = 28
          const trailStart = progressAngle - trailLength
          const points: string[] = []
          for (let a = trailStart; a <= progressAngle; a += 3) {
            const p = ellipsePoint(cx, cy, outerRing.rx, outerRing.ry, a)
            points.push(`${p.x},${p.y}`)
          }
          return (
            <polyline
              points={points.join(' ')}
              fill="none"
              stroke="#E8A838"
              strokeWidth="2"
              strokeOpacity="0.50"
              strokeLinecap="round"
            />
          )
        })()}

        {/* Spacecraft dot */}
        <circle
          cx={craft.x} cy={craft.y} r={5}
          fill="#E8A838"
          filter="url(#craft-glow)"
          style={{ opacity: 0.95 }}
        />
        <circle
          cx={craft.x} cy={craft.y} r={2.5}
          fill="#FFFFFF"
          opacity="0.9"
        />

        {/* Planet cores (SVG circles) */}
        {planets.map((planet, i) => {
          const pt = planetPoints[i]
          if (!pt) return null
          const { opacity, glowSize, r, color } = planetStyle(planet.progress, planet.color)
          const isHovered = hoveredId === planet.id

          return (
            <g
              key={planet.id}
              style={{ cursor: 'pointer', opacity }}
              onMouseEnter={() => {
                setHoveredId(planet.id)
                setTooltipPos({ x: pt.x, y: pt.y })
              }}
              onMouseLeave={() => { setHoveredId(null); setTooltipPos(null) }}
              onClick={() => router.push(planet.href)}
            >
              {/* Outer glow ring when hovered or high progress */}
              {(isHovered || planet.progress > 30) && (
                <circle
                  cx={pt.x} cy={pt.y}
                  r={r + (isHovered ? 8 : glowSize / 2)}
                  fill={color}
                  opacity={isHovered ? 0.18 : 0.08}
                />
              )}
              {/* Planet body */}
              <circle
                cx={pt.x} cy={pt.y} r={r}
                fill={color}
                opacity={isHovered ? 1 : 0.85}
                filter={planet.progress > 20 ? 'url(#planet-glow)' : undefined}
                style={{ transition: 'r 0.2s ease' }}
              />
              {/* Planet inner highlight */}
              <circle
                cx={pt.x - r * 0.25} cy={pt.y - r * 0.25}
                r={r * 0.35}
                fill="white"
                opacity={0.20}
              />
            </g>
          )
        })}
      </svg>

      {/* ── Planet labels (HTML — positioned absolutely) ── */}
      {planets.map((planet, i) => {
        const pt = planetPoints[i]
        if (!pt) return null

        /* Push label outward from planet center */
        const angle = toRad(PLANET_ANGLES[i] - 90)
        const labelOffset = 24
        const lx = pt.x + Math.cos(angle) * labelOffset
        const ly = pt.y + Math.sin(angle) * labelOffset

        /* Anchor text left/right/center based on angle */
        const ang = PLANET_ANGLES[i] % 360
        const textAlign = ang > 180 && ang < 360 ? 'right' : ang === 180 || ang === 0 ? 'center' : 'left'

        return (
          <div
            key={planet.id}
            className="absolute pointer-events-none"
            style={{
              left: lx,
              top: ly,
              transform: textAlign === 'right'
                ? 'translate(-100%, -50%)'
                : textAlign === 'center'
                ? 'translate(-50%, -50%)'
                : 'translate(0, -50%)',
            }}
          >
            <div
              className="text-[11px] font-semibold whitespace-nowrap"
              style={{
                color: planet.progress > 10 ? planet.color : '#3A3A3A',
                opacity: 0.25 + (planet.progress / 100) * 0.75,
              }}
            >
              {planet.label}
            </div>
            {planet.progress > 0 && (
              <div
                className="text-[9px] font-mono"
                style={{ color: '#5C5757', textAlign }}
              >
                {planet.progress}%
              </div>
            )}
          </div>
        )
      })}

      {/* ── Center core (HTML absolute) ── */}
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{
          width: size * 0.185,
          height: size * 0.185,
          left: cx - (size * 0.185) / 2,
          top: cy - (size * 0.185) / 2,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #F5C355, #D4761C)',
          boxShadow: '0 0 32px 8px rgba(232,168,56,0.30), 0 0 60px 16px rgba(232,168,56,0.12)',
          animation: 'core-pulse 3s ease-in-out infinite',
        }}
      >
        <span
          className="font-black leading-none"
          style={{ color: '#0C0C0C', fontSize: size * 0.048 }}
        >
          {currentDay}
        </span>
        <span
          className="font-bold tracking-widest uppercase leading-none"
          style={{ color: 'rgba(0,0,0,0.55)', fontSize: size * 0.022 }}
        >
          / 90
        </span>
      </div>

      {/* ── Hover tooltip (HTML absolute) ── */}
      {hoveredId && tooltipPos && (() => {
        const planet = planets.find(p => p.id === hoveredId)
        if (!planet) return null
        const pt = tooltipPos

        /* Position tooltip away from center */
        const angle = toRad(PLANET_ANGLES[planets.findIndex(p => p.id === hoveredId)] - 90)
        const tipX = pt.x + Math.cos(angle) * 52
        const tipY = pt.y + Math.sin(angle) * 52

        /* Keep tooltip inside container */
        const tipLeft = Math.max(0, Math.min(tipX, size - 160))
        const tipTop = Math.max(0, Math.min(tipY, size - 120))

        return (
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              left: tipLeft,
              top: tipTop,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className="px-4 py-3 rounded-xl"
              style={{
                background: '#111111',
                border: `1px solid ${planet.color}30`,
                boxShadow: `0 8px 32px rgba(0,0,0,0.50), 0 0 16px ${planet.color}18`,
                minWidth: 148,
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm">{planet.emoji}</span>
                <span className="text-sm font-bold" style={{ color: '#F0EDED' }}>{planet.label}</span>
              </div>
              {/* Mini progress bar */}
              <div className="h-1 rounded-full mb-1.5 overflow-hidden" style={{ background: '#1F1F1F' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${planet.progress}%`, background: planet.color }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: '#5C5757' }}>{planet.status}</span>
                <span className="text-xs font-bold" style={{ color: planet.color }}>{planet.progress}%</span>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Days remaining badge ── */}
      <div
        className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full"
        style={{
          background: 'rgba(232,168,56,0.07)',
          border: '1px solid rgba(232,168,56,0.15)',
        }}
      >
        <span className="text-xs font-bold" style={{ color: '#E8A838' }}>
          {daysRemaining} days remaining
        </span>
      </div>
    </div>
  )
}
