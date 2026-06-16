import Link from 'next/link'
import { ArrowRight, Calendar, Activity, Box, Shield, FileText, Database } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

const FEATURES = [
  {
    icon: Calendar,
    title: '12-Week Roadmap',
    desc: 'Structured weekly path from networking basics to distributed system mastery.',
  },
  {
    icon: Activity,
    title: 'DSA Tracking',
    desc: 'Log problems, track mistakes, and schedule automated revisits by pattern.',
  },
  {
    icon: Box,
    title: '12 Case Studies',
    desc: 'Deep-dive architectures: URL shorteners, chat apps, feeds, and more.',
  },
  {
    icon: Shield,
    title: 'Daily Streak',
    desc: 'Hit 70% of daily tasks to keep your streak alive and stay accountable.',
  },
  {
    icon: FileText,
    title: 'Mock Logger',
    desc: 'Track mock interview scores, strengths, and improvement areas.',
  },
  {
    icon: Database,
    title: 'Readiness Score',
    desc: 'Live 0–100 score based on your completion and consistency.',
  },
]

const WEEKS = [
  { week: 1, title: 'Internet & Backend Basics', month: 1 },
  { week: 2, title: 'Scalability Fundamentals', month: 1 },
  { week: 3, title: 'Databases from Scratch', month: 1 },
  { week: 4, title: 'Caching & Performance', month: 1 },
  { week: 5, title: 'Message Queues & Async', month: 2 },
  { week: 6, title: 'Distributed Trade-offs', month: 2 },
  { week: 7, title: 'Observability & Production', month: 2 },
  { week: 8, title: 'System: URL Shortener', month: 2 },
  { week: 9, title: 'System: Social Feed', month: 3 },
  { week: 10, title: 'System: Chat App', month: 3 },
  { week: 11, title: 'System: E-Commerce', month: 3 },
  { week: 12, title: 'Interview Readiness', month: 3 },
]

const STATS = [
  { value: '90', label: 'Days' },
  { value: '12', label: 'Case Studies' },
  { value: '150+', label: 'DSA Problems' },
  { value: '10', label: 'Readiness Tiers' },
]

function MonthLabel({ month }: { month: number }) {
  const colors = ['text-[#E8A838]', 'text-[#D4761C]', 'text-emerald-500']
  return (
    <span className={`text-[10px] font-mono uppercase tracking-[0.15em] ${colors[month - 1]}`}>
      Month {month}
    </span>
  )
}

/* ─── MonthCard ─── */
type MonthCardProps = {
  monthLabel: string
  phase: string
  description: string
  color: string
  colorFaint: string
  colorBadge: string
  textClass: string
  glowClass: string
  weeks: { week: number; title: string }[]
}

function MonthCard({
  monthLabel,
  phase,
  description,
  color,
  colorFaint,
  colorBadge,
  textClass,
  glowClass,
  weeks,
}: MonthCardProps) {
  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-[#1F1F1F] bg-[#111111] transition-all duration-300 hover:border-[${color}30] ${glowClass}`}
    >
      {/* Colored top bar */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}55)` }} />

      {/* Card header */}
      <div className="px-7 pb-5 pt-6">
        <span
          className={`mb-3 inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${textClass}`}
          style={{ background: colorBadge }}
        >
          {monthLabel}
        </span>
        <h3 className="mb-2 text-xl font-semibold tracking-tight text-[#F0EDED]">{phase}</h3>
        <p className="text-sm leading-relaxed text-[#5C5757]">{description}</p>
      </div>

      {/* Divider */}
      <div className="mx-7 border-t border-[#1A1A1A]" />

      {/* Week rows */}
      <div className="flex flex-col px-4 py-3">
        {weeks.map(({ week, title }) => (
          <div
            key={week}
            className="group/row flex items-center gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-[#161616]"
          >
            {/* Week number badge */}
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold tabular-nums ${textClass}`}
              style={{ background: colorFaint }}
            >
              {String(week).padStart(2, '0')}
            </span>
            {/* Connector dot + title */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full opacity-40"
                style={{ background: color }}
              />
              <span className="truncate text-sm font-medium text-[#9A9494] transition-colors group-hover/row:text-[#E8E4E4]">
                {title}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* Safe content container — max 1280px, always 24px gutters on each side */
function Wide({
  children,
  className = '',
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      className={`mx-auto w-full max-w-[1280px] ${className}`}
      style={{ paddingLeft: '24px', paddingRight: '24px', ...style }}
    >
      {children}
    </div>
  )
}

/* ─── Orbit Visual: moving elliptical solar-system style, pure SVG ─── */
function OrbitVisual() {
  const WIDTH = 800
  const HEIGHT = 560
  const cx = 400
  const cy = 280
  const ORBIT_DURATION = 72

  const ellipsePath = (rx: number, ry: number, rotation: number) => {
    const a = (rotation * Math.PI) / 180
    const sx = cx + rx * Math.cos(a)
    const sy = cy + rx * Math.sin(a)
    const ex = cx - rx * Math.cos(a)
    const ey = cy - rx * Math.sin(a)

    return [
      `M ${sx.toFixed(2)} ${sy.toFixed(2)}`,
      `A ${rx} ${ry} ${rotation} 0 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`,
      `A ${rx} ${ry} ${rotation} 0 1 ${sx.toFixed(2)} ${sy.toFixed(2)}`,
    ].join(' ')
  }

  const rings = [
    { id: 'sysd-orbit-inner', rx: 150, ry: 62, rot: -10, opacity: 0.34, dash: '9 12' },
    { id: 'sysd-orbit-mid', rx: 225, ry: 98, rot: -10, opacity: 0.24, dash: '10 15' },
    { id: 'sysd-orbit-outer', rx: 305, ry: 140, rot: -10, opacity: 0.17, dash: '11 17' },
  ].map((ring) => ({ ...ring, path: ellipsePath(ring.rx, ring.ry, ring.rot) }))

  const topics = [
    { label: 'Networking', color: '#60A5FA', ring: 1, offset: 0.75 },
    { label: 'Databases', color: '#34D399', ring: 2, offset: 0.875 },
    { label: 'Caching', color: '#A78BFA', ring: 1, offset: 0.0 },
    { label: 'Load Balancing', color: '#FB923C', ring: 2, offset: 0.125 },
    { label: 'Scalability', color: '#F472B6', ring: 1, offset: 0.25 },
    { label: 'Message Queues', color: '#FACC15', ring: 2, offset: 0.375 },
    { label: 'Distributed Systems', color: '#38BDF8', ring: 1, offset: 0.5 },
    { label: 'Observability', color: '#86EFAC', ring: 2, offset: 0.625 },
  ] as const

  const sparks = [
    { ring: 0, duration: 24, offset: 0.08, size: 3.1 },
    { ring: 1, duration: 32, offset: 0.44, size: 2.7 },
    { ring: 2, duration: 42, offset: 0.72, size: 2.4 },
  ]

  return (
    <div
      className="pointer-events-none select-none"
      style={{
        width: 'clamp(660px, 51vw, 790px)',
        maxWidth: '100%',
        flexShrink: 0,
        overflow: 'visible',
        transform: 'translateX(-58px)',
      }}
    >
      <svg
        width="100%"
        height="auto"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ overflow: 'visible', display: 'block' }}
        role="img"
        aria-label="Moving 90-day system design orbit roadmap"
      >
        <defs>
          <radialGradient id="sysd-orbit-ambient" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#E8A838" stopOpacity="0.075" />
            <stop offset="42%" stopColor="#E8A838" stopOpacity="0.025" />
            <stop offset="100%" stopColor="#E8A838" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="sysd-orbit-core" cx="38%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FAD15B" />
            <stop offset="48%" stopColor="#E8A838" />
            <stop offset="100%" stopColor="#C45E0A" />
          </radialGradient>

          <filter id="sysd-orbit-soft-glow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="5.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="sysd-orbit-core-glow" x="-140%" y="-140%" width="380%" height="380%">
            <feGaussianBlur stdDeviation="14" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {rings.map((ring) => (
            <path key={`path-${ring.id}`} id={ring.id} d={ring.path} fill="none" />
          ))}
        </defs>

        {/* Soft transparent glow only. No box/card/square background. */}
        <ellipse cx={cx} cy={cy} rx="365" ry="215" fill="url(#sysd-orbit-ambient)" />

        {/* Clean tilted elliptical orbit rings */}
        {rings.map((ring, index) => (
          <path
            key={`visible-${ring.id}`}
            d={ring.path}
            fill="none"
            stroke="#E8A838"
            strokeWidth="1.35"
            strokeOpacity={ring.opacity}
            strokeDasharray={ring.dash}
            strokeLinecap="round"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to={index % 2 === 0 ? '-150' : '150'}
              dur={`${38 + index * 14}s`}
              repeatCount="indefinite"
            />
          </path>
        ))}

        {/* Small gold particles moving on the orbit paths */}
        {sparks.map((spark, index) => {
          const ring = rings[spark.ring]!

          return (
            <circle
              key={`spark-${index}`}
              r={spark.size}
              fill="#E8A838"
              fillOpacity="0.92"
              filter="url(#sysd-orbit-soft-glow)"
            >
              <animateMotion
                dur={`${spark.duration}s`}
                begin={`${-(spark.duration * spark.offset).toFixed(2)}s`}
                repeatCount="indefinite"
                rotate="0"
              >
                <mpath href={`#${ring.id}`} xlinkHref={`#${ring.id}`} />
              </animateMotion>
            </circle>
          )
        })}

        {/* Topic planets actually orbit. Labels stay horizontal because rotate is 0. */}
        {topics.map((topic, index) => {
          const ring = rings[topic.ring]!
          const begin = -(ORBIT_DURATION * topic.offset)

          return (
            <g key={topic.label}>
              <animateMotion
                dur={`${ORBIT_DURATION}s`}
                begin={`${begin.toFixed(2)}s`}
                repeatCount="indefinite"
                rotate="0"
              >
                <mpath href={`#${ring.id}`} xlinkHref={`#${ring.id}`} />
              </animateMotion>

              <circle r="22" fill={topic.color} fillOpacity="0.10" filter="url(#sysd-orbit-soft-glow)" />
              <circle r="11" fill={topic.color} fillOpacity="0.96" filter="url(#sysd-orbit-soft-glow)">
                <animate attributeName="r" values="9.5;12.8;9.5" dur={`${3.2 + index * 0.16}s`} repeatCount="indefinite" />
                <animate attributeName="fill-opacity" values="0.82;1;0.82" dur={`${3.2 + index * 0.16}s`} repeatCount="indefinite" />
              </circle>

              <text
                x="0"
                y="-27"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12.5"
                fontWeight="850"
                fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
                letterSpacing="0.01em"
                fill="none"
                stroke="#0C0C0C"
                strokeWidth="5"
                strokeLinejoin="round"
              >
                {topic.label}
              </text>
              <text
                x="0"
                y="-27"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12.5"
                fontWeight="850"
                fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
                letterSpacing="0.01em"
                fill={topic.color}
                fillOpacity="0.98"
              >
                {topic.label}
              </text>
            </g>
          )
        })}

        {/* Center 90-day core */}
        <circle cx={cx} cy={cy} r="68" fill="#050505" fillOpacity="0.92" filter="url(#sysd-orbit-core-glow)" />
        <circle cx={cx} cy={cy} r="57" fill="url(#sysd-orbit-core)" />
        <circle cx={cx} cy={cy} r="72" fill="none" stroke="#E8A838" strokeOpacity="0.30" strokeWidth="1.7">
          <animate attributeName="r" values="62;86;62" dur="4.4s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="0.38;0;0.38" dur="4.4s" repeatCount="indefinite" />
        </circle>
        <text
          x={cx}
          y={cy - 9}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="33"
          fontWeight="950"
          fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
          fill="#0C0C0C"
          letterSpacing="-0.06em"
        >
          90
        </text>
        <text
          x={cx}
          y={cy + 23}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="8.5"
          fontWeight="950"
          fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
          fill="rgba(12,12,12,0.70)"
          letterSpacing="0.18em"
        >
          DAYS
        </text>
      </svg>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-[#0C0C0C] text-[#9A9494] font-sans selection:bg-[#E8A83830] selection:text-[#E8A838] dot-grid">

      {/* ═══ Navigation ═══ */}
      <nav className="sticky top-0 z-50 w-full border-b border-[#1F1F1F] bg-[#0C0C0C]/80 backdrop-blur-xl">
        <div
          className="mx-auto flex h-20 w-full max-w-[1280px] items-center justify-between"
          style={{ paddingLeft: '24px', paddingRight: '24px' }}
        >
          <Link href="/" className="flex items-center gap-3 group">
            <div
              className="flex items-center justify-center font-black text-[#0C0C0C] tracking-tighter"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '9px',
                background: 'linear-gradient(135deg, #E8A838, #D4761C)',
                fontSize: '12px',
                boxShadow: '0 2px 10px rgba(232,168,56,0.30)',
              }}
            >
              90
            </div>
            <span className="font-semibold text-[#F0EDED] tracking-tight" style={{ fontSize: '15px', letterSpacing: '-0.01em' }}>Orbit90</span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/login" className="text-sm font-medium text-[#9A9494] hover:text-[#F0EDED] transition-colors">
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold text-[#0C0C0C] transition-all duration-200 hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #E8A838, #D4761C)',
                padding: '8px 20px',
                borderRadius: '8px',
                outline: 'none',
                boxShadow: '0 2px 12px rgba(232,168,56,0.20)',
              }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ Hero Section ═══ */}
      <section className="w-full" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <Wide
          className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-12"
          style={{ paddingTop: '56px', paddingBottom: '64px', minHeight: 'calc(100vh - 80px)' }}
        >
          {/* ── Left: Text + CTAs ── */}
          <div className="flex flex-col items-start text-left" style={{ maxWidth: '540px', flex: '1 1 0' }}>
            <span
              className="inline-block animate-fade-up font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#E8A838]"
              style={{
                marginBottom: '28px',
                background: 'rgba(232,168,56,0.09)',
                padding: '6px 16px',
                borderRadius: '999px',
              }}
            >
              90-Day Protocol
            </span>

            <h1
              className="animate-fade-up-1 font-semibold text-[#F0EDED] tracking-tight leading-[1.08]"
              style={{ marginBottom: '24px', fontSize: 'clamp(2.2rem, 5vw, 3.75rem)' }}
            >
              Architect your career.
              <br />
              <span className="gradient-text">Ship yourself.</span>
            </h1>

            <p
              className="animate-fade-up-2 text-base md:text-lg text-[#9A9494] leading-relaxed"
              style={{ marginBottom: '40px', maxWidth: '460px' }}
            >
              A structured 12-week operating system for engineers who want to master system design, crush DSA, and land the job.
            </p>

            <div className="animate-fade-up-3 flex flex-col sm:flex-row items-start" style={{ gap: '14px' }}>
              <Link
                href="/signup"
                className="flex items-center gap-2.5 font-semibold text-[#0C0C0C] text-base transition-all duration-200 hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #E8A838, #D4761C)',
                  padding: '12px 32px',
                  borderRadius: '10px',
                  outline: 'none',
                  boxShadow: '0 4px 20px rgba(232,168,56,0.25)',
                }}
              >
                Begin Protocol
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2.5 font-semibold text-[#F0EDED] text-base transition-all duration-200 hover:bg-[#141414]"
                style={{
                  border: '1px solid #2A2A2A',
                  padding: '12px 32px',
                  borderRadius: '10px',
                  outline: 'none',
                }}
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* ── Right: Orbit Visual ── */}
          <div
            className="animate-fade-up-2 hidden lg:flex items-center justify-center"
            style={{ flex: '0 1 660px', minWidth: '460px', marginLeft: '-48px', marginRight: '-12px' }}
          >
            <OrbitVisual />
          </div>
        </Wide>
      </section>

      {/* ═══ Stats Section ═══ */}
      <section className="w-full" style={{ paddingTop: '64px', paddingBottom: '96px' }}>
        <Wide>
          <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map(({ value, label }) => (
              <div
                key={label}
                className="landing-card flex w-full flex-col items-center justify-center p-8 text-center"
                style={{ minHeight: '160px' }}
              >
                <span className="mb-3 text-3xl font-semibold text-[#F0EDED] md:text-4xl lg:text-5xl">{value}</span>
                <span className="text-xs font-mono uppercase tracking-[0.15em] text-[#5C5757]">{label}</span>
              </div>
            ))}
          </div>
        </Wide>
      </section>

      {/* ═══ Features Section ═══ */}
      <section className="w-full" style={{ paddingTop: '80px', paddingBottom: '96px' }}>
        <Wide>
          <div className="flex flex-col items-center text-center" style={{ marginBottom: '72px' }}>
            <div className="accent-line" style={{ marginBottom: '24px' }} />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-[#F0EDED] tracking-tight" style={{ marginBottom: '16px' }}>
              A system, not a list.
            </h2>
            <p className="text-[#9A9494] text-lg" style={{ maxWidth: '600px' }}>
              Everything you need to stay structured and accountable.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="landing-card flex w-full flex-col items-center justify-center p-8 text-center"
                style={{ minHeight: '240px' }}
              >
                <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-xl border border-[#E8A83820] bg-[#E8A83812] text-[#E8A838]">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="mb-3.5 text-lg font-semibold text-[#F0EDED]">{title}</h3>
                <p className="text-sm leading-relaxed text-[#9A9494]">{desc}</p>
              </div>
            ))}
          </div>
        </Wide>
      </section>

      {/* ═══ Curriculum Section ═══ */}
      <section className="w-full" style={{ paddingTop: '80px', paddingBottom: '96px' }}>
        <Wide>
          <div className="flex flex-col items-center text-center" style={{ marginBottom: '72px' }}>
            <div className="accent-line" style={{ marginBottom: '24px' }} />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-[#F0EDED] tracking-tight" style={{ marginBottom: '16px' }}>
              The Curriculum
            </h2>
            <p className="text-[#9A9494] text-lg" style={{ maxWidth: '640px' }}>
              Start with backend fundamentals, build toward distributed systems, then finish with real case studies.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-8 xl:grid-cols-3">
            <MonthCard
              monthLabel="Month 1"
              phase="Foundation"
              description="Build the backend base: internet, scalability, databases, caching, and performance."
              color="#E8A838"
              colorFaint="rgba(232,168,56,0.10)"
              colorBadge="rgba(232,168,56,0.12)"
              textClass="text-[#E8A838]"
              glowClass="hover:shadow-[0_0_40px_rgba(232,168,56,0.06)]"
              weeks={WEEKS.filter(w => w.month === 1)}
            />
            <MonthCard
              monthLabel="Month 2"
              phase="Depth"
              description="Move into distributed systems: queues, async processing, trade-offs, observability, and production thinking."
              color="#D4761C"
              colorFaint="rgba(212,118,28,0.10)"
              colorBadge="rgba(212,118,28,0.12)"
              textClass="text-[#D4761C]"
              glowClass="hover:shadow-[0_0_40px_rgba(212,118,28,0.06)]"
              weeks={WEEKS.filter(w => w.month === 2)}
            />
            <MonthCard
              monthLabel="Month 3"
              phase="Mastery"
              description="Practice real case studies and prepare to explain complete system designs in interviews."
              color="#10b981"
              colorFaint="rgba(16,185,129,0.10)"
              colorBadge="rgba(16,185,129,0.12)"
              textClass="text-emerald-500"
              glowClass="hover:shadow-[0_0_40px_rgba(16,185,129,0.06)]"
              weeks={WEEKS.filter(w => w.month === 3)}
            />
          </div>
        </Wide>
      </section>

      {/* ═══ CTA Section ═══ */}
      <section className="w-full" style={{ paddingTop: '80px', paddingBottom: '96px' }}>
        <Wide>
          {/* Ambient glow behind the card */}
          <div className="relative">
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{
                background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(232,168,56,0.10) 0%, transparent 70%)',
                filter: 'blur(24px)',
                transform: 'scale(1.08)',
              }}
            />

            <div
              className="relative flex w-full flex-col items-center overflow-hidden rounded-3xl text-center"
              style={{
                background: '#111111',
                border: 'none',
                boxShadow: '0 0 60px rgba(232,168,56,0.07), inset 0 1px 0 rgba(232,168,56,0.10)',
              }}
            >
              {/* Top gradient bar */}
              <div
                className="h-[3px] w-full"
                style={{ background: 'linear-gradient(90deg, transparent, #E8A838, #D4761C, transparent)' }}
              />

              <div className="flex flex-col items-center px-8 py-20 md:px-20">
                {/* Badge */}
                <span
                  className="mb-8 inline-block rounded-full border border-[#E8A83830] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#E8A838]"
                  style={{ background: 'rgba(232,168,56,0.07)' }}
                >
                  Free Forever
                </span>

                {/* Headline */}
                <h2
                  className="text-4xl font-semibold tracking-tight text-[#F0EDED] md:text-5xl lg:text-6xl"
                  style={{ marginBottom: '20px', lineHeight: '1.1' }}
                >
                  Stop grinding aimlessly.
                  <br />
                  <span className="gradient-text">Start architecting.</span>
                </h2>

                {/* Subtext */}
                <p
                  className="text-base text-[#6B6767] md:text-lg"
                  style={{ marginBottom: '48px', maxWidth: '520px', lineHeight: '1.7' }}
                >
                  Join the protocol today. Built for engineers who are serious about levelling up.
                </p>

                {/* CTA button */}
                <Link
                  href="/signup"
                  className="cta-btn group flex items-center gap-3 rounded-xl font-semibold text-[#0C0C0C] transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, #E8A838, #D4761C)',
                    padding: '14px 40px',
                    fontSize: '15px',
                    boxShadow: '0 4px 24px rgba(232,168,56,0.25)',
                  }}
                >
                  Create Your Account
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </Wide>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="w-full border-t border-[#1F1F1F]" style={{ paddingTop: '40px', paddingBottom: '40px', marginTop: '32px' }}>
        <Wide className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <span className="text-xs font-mono text-[#5C5757] tracking-wider">Orbit90</span>
          <span className="text-xs text-[#5C5757]">Built for engineering excellence.</span>
        </Wide>
      </footer>
    </div>
  )
}

