'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown, ArrowRight, CheckCircle } from 'lucide-react'

// ─── Data ────────────────────────────────────────────────────────────────────

const weekData = [
  { day: 'Mon', total: 720000, blocked: 715000, investigated: 4800, threats: 3 },
  { day: 'Tue', total: 890000, blocked: 885000, investigated: 4200, threats: 1 },
  { day: 'Wed', total: 650000, blocked: 645000, investigated: 4900, threats: 2 },
  { day: 'Thu', total: 980000, blocked: 973000, investigated: 6800, threats: 4 },
  { day: 'Fri', total: 750000, blocked: 745000, investigated: 4100, threats: 0 },
  { day: 'Sat', total: 420000, blocked: 418000, investigated: 1800, threats: 0 },
  { day: 'Sun', total: 847293, blocked: 843000, investigated: 4280, threats: 1 },
]

const sparkData = [750, 762, 771, 765, 780, 795, 810, 820, 835, 840, 845, 851]

const agents = [
  { name: 'Orchestrator', action: 'Dispatched Investigator to Case #2851', events: '47 coord. events' },
  { name: 'Sentinel', action: 'Anomaly detected — Sarah Chen', events: '847,293 events' },
  { name: 'Investigator', action: '3 cases closed today', events: '3 closed' },
  { name: 'Responder', action: '2 autonomous actions taken', events: '2 actions' },
  { name: 'Hunter', action: 'Nightly hunt complete, 0 threats', events: '0 threats found' },
  { name: 'Guardian', action: 'Compliance 97% — 2 gaps flagged', events: '97% compliance' },
  { name: 'Oracle', action: '47 threat intel feeds active', events: '47 feeds' },
  { name: 'Architect', action: 'Posture score 851/1000', events: '851/1000' },
  { name: 'Alert Optimizer', action: '2,847 → 4 actionable alerts', events: '99.9% filtered' },
  { name: 'Drift Monitor', action: 'No critical drift detected', events: '3 entities monitored' },
  { name: 'Audit Engine', action: 'Evidence vault current', events: '14,847 records' },
]

const priorities = [
  {
    id: 1, severity: 'HIGH', color: '#F59E0B', bg: '#78350F',
    title: 'Unusual access pattern — finance user, non-business hours',
    action: 'Investigate →', actionPath: '/investigations',
  },
  {
    id: 2, severity: 'MEDIUM', color: '#3B82F6', bg: '#1E3A5F',
    title: 'Drift detected: patch compliance dropped 4% (87% → 83%)',
    action: 'View Details →', actionPath: '/drift',
  },
  {
    id: 3, severity: 'LOW', color: '#9CA3AF', bg: '#1F2937',
    title: 'Compliance gap: access review overdue for 8 service accounts',
    action: 'Remediate →', actionPath: '/audit',
  },
  {
    id: 4, severity: 'INFO', color: '#6B7280', bg: '#111827',
    title: 'Monthly audit report ready for review',
    action: 'Download →', actionPath: '/reports',
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function Card({
  children,
  style = {},
  onClick,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
  onClick?: () => void
}) {
  return (
    <div
      className={`rounded-lg border ${onClick ? 'cursor-pointer hover:border-blue-500/40 transition-colors' : ''}`}
      style={{ background: '#1F2937', borderColor: '#374151', padding: '24px', ...style }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

function MetricNumber({ value, color }: { value: string; color?: string }) {
  return (
    <div className="text-5xl font-bold leading-none" style={{ color: color ?? '#F9FAFB' }}>
      {value}
    </div>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border p-3 text-xs" style={{ background: '#1F2937', borderColor: '#374151' }}>
      <p className="font-semibold mb-2" style={{ color: '#F9FAFB' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: '#9CA3AF' }}>{p.name}:</span>
          <span style={{ color: '#F9FAFB' }}>{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const [hoveredAgent, setHoveredAgent] = useState<number | null>(null)

  return (
    <div className="p-6 space-y-6">
      {/* Morning briefing */}
      <div
        className="rounded-lg border p-5"
        style={{ background: '#1F2937', borderColor: '#374151', borderLeft: '4px solid #3B82F6' }}
      >
        <p className="text-sm leading-relaxed" style={{ color: '#F9FAFB' }}>
          <span className="font-semibold text-base">Good morning, Alex.</span>{' '}
          ThresholdIQ processed{' '}
          <span className="font-semibold" style={{ color: '#3B82F6' }}>847,293 events</span> overnight.{' '}
          <span className="font-semibold" style={{ color: '#F59E0B' }}>4 items</span> require your attention today.{' '}
          Security posture:{' '}
          <span className="font-semibold" style={{ color: '#10B981' }}>851/1000</span> — new high this week.
        </p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Security Posture */}
        <Card>
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
              Security Posture Score
            </p>
            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#10B981' }}>
              <TrendingUp size={12} /> +12
            </span>
          </div>
          <MetricNumber value="851" color="#F9FAFB" />
          <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>Top 22% globally</p>
          <div className="mt-3 flex gap-0.5 items-end h-8">
            {sparkData.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${((v - 740) / (860 - 740)) * 100}%`,
                  background: i === sparkData.length - 1 ? '#3B82F6' : '#374151',
                  minHeight: '2px',
                }}
              />
            ))}
          </div>
        </Card>

        {/* Alerts Today */}
        <Card>
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
              Alerts Today
            </p>
            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#10B981' }}>
              <TrendingDown size={12} /> Low
            </span>
          </div>
          <MetricNumber value="4" color="#10B981" />
          <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>Down from 2,847 raw (99.9% filtered)</p>
          <div className="mt-3 flex gap-1 items-end h-8">
            {[8, 6, 12, 4, 9, 7, 4].map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${(v / 12) * 100}%`,
                  background: i === 6 ? '#10B981' : '#374151',
                  minHeight: '2px',
                }}
              />
            ))}
          </div>
        </Card>

        {/* Active Investigations */}
        <Card onClick={() => router.push('/investigations')} style={{ cursor: 'pointer' }}>
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
              Active Investigations
            </p>
            <ArrowRight size={14} style={{ color: '#3B82F6' }} />
          </div>
          <MetricNumber value="2" color="#F59E0B" />
          <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>1 high priority / 1 medium</p>
          <p className="text-xs mt-1" style={{ color: '#3B82F6' }}>Click to view →</p>
        </Card>

        {/* Dwell Time */}
        <Card>
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
              Estimated Dwell Time
            </p>
            <CheckCircle size={14} style={{ color: '#10B981' }} />
          </div>
          <MetricNumber value="0 days" color="#10B981" />
          <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>No undetected threats estimated</p>
          <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Industry avg: 194 days</p>
        </Card>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Agent Status Panel */}
        <div className="lg:col-span-3">
          <Card style={{ padding: '20px' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
              <h3 className="font-semibold" style={{ color: '#F9FAFB' }}>11 Agents — All Online</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {agents.map((agent, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-all"
                  style={{
                    background: hoveredAgent === i ? '#111827' : 'transparent',
                    borderColor: hoveredAgent === i ? '#3B82F6' : '#374151',
                  }}
                  onMouseEnter={() => setHoveredAgent(i)}
                  onMouseLeave={() => setHoveredAgent(null)}
                >
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#10B981' }} />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{agent.name}</div>
                    <div className="text-xs mt-0.5 truncate" style={{ color: '#9CA3AF' }}>{agent.action}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{agent.events}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Priority Actions */}
        <div className="lg:col-span-2">
          <Card style={{ padding: '20px' }}>
            <h3 className="font-semibold mb-4" style={{ color: '#F9FAFB' }}>Today's Focus</h3>
            <div className="space-y-3">
              {priorities.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-md border"
                  style={{ background: '#111827', borderColor: '#374151' }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: item.bg, color: item.color }}
                    >
                      {item.severity}
                    </span>
                  </div>
                  <p className="text-xs mb-2" style={{ color: '#9CA3AF' }}>{item.title}</p>
                  <button
                    onClick={() => router.push(item.actionPath)}
                    className="text-xs font-medium hover:underline"
                    style={{ color: '#3B82F6' }}
                  >
                    {item.action}
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Event chart */}
      <Card style={{ padding: '20px' }}>
        <h3 className="font-semibold mb-4" style={{ color: '#F9FAFB' }}>Security Events — Last 7 Days</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="day" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={{ stroke: '#374151' }} />
            <YAxis
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              axisLine={{ stroke: '#374151' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#9CA3AF', fontSize: 12 }} />
            <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} dot={false} name="Total events" />
            <Line type="monotone" dataKey="blocked" stroke="#10B981" strokeWidth={2} dot={false} name="Blocked/benign" />
            <Line type="monotone" dataKey="investigated" stroke="#F59E0B" strokeWidth={2} dot={false} name="Investigated" />
            <Line type="monotone" dataKey="threats" stroke="#EF4444" strokeWidth={2} dot={false} name="Confirmed threats" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}