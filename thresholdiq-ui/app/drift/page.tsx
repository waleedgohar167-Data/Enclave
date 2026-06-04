'use client'

import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { FileText, AlertTriangle, Settings, Binary } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PostureMetric {
  metric: string; current: string; ago: string; trend: string; status: 'amber' | 'green'
}
interface DriftEntity {
  name: string; type: string; velocity: string; start: string; score: number
  history: number[]; velocityColor: string; note?: string
}
interface TimelineEvent {
  ts: string; device: string; type: 'file' | 'registry' | 'binary' | 'config'
  summary: string; severity: 'critical' | 'high' | 'medium' | 'low'
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const postureData = Array.from({ length: 30 }, (_, i) => ({
  day: `May ${i + 1}`,
  score: i < 8 ? 870 + Math.random() * 10 : 870 - (i - 8) * 0.8 + Math.random() * 5,
  patch: i < 8 ? 94 : 94 - (i - 8) * 0.5,
  mfa: 96 + Math.random() * 1.5,
}))

const postureMetrics: PostureMetric[] = [
  { metric: 'Patch Compliance', current: '83%', ago: '94%', trend: '↓ -11%', status: 'amber' },
  { metric: 'MFA Coverage', current: '97%', ago: '96%', trend: '↑ +1%', status: 'green' },
  { metric: 'Configuration Score', current: '91%', ago: '90%', trend: '↑ +1%', status: 'green' },
  { metric: 'Certificate Health', current: '100%', ago: '100%', trend: 'Stable', status: 'green' },
  { metric: 'Access Review Current', current: '78%', ago: '82%', trend: '↓ -4%', status: 'amber' },
]

const driftEntities: DriftEntity[] = [
  { name: 'Sarah Chen', type: 'Access time pattern', velocity: 'Accelerating', start: 'May 15', score: 89, history: [20, 25, 35, 48, 62, 75, 89], velocityColor: '#EF4444' },
  { name: 'WS-Engineering-047', type: 'Network destination', velocity: 'Stable', start: 'May 13', score: 34, history: [10, 20, 30, 33, 34, 34, 34], velocityColor: '#F59E0B', note: 'Possibly related to software update May 13' },
  { name: 'SA-ReportingService', type: 'Access volume', velocity: 'Gradual', start: 'May 5', score: 28, history: [5, 8, 12, 15, 18, 23, 28], velocityColor: '#F59E0B', note: 'Gradual increase in report volume — may be legitimate' },
]

const timelineEvents: TimelineEvent[] = [
  { ts: '14:47:02', device: 'WS-ENG-047', type: 'binary', summary: 'Unexpected process: svchost.exe spawned from explorer.exe', severity: 'high' },
  { ts: '14:32:18', device: 'DEV-SRV-04', type: 'file', summary: '/etc/cron.d/backup — modified (hash mismatch)', severity: 'critical' },
  { ts: '13:55:44', device: 'WS-FIN-12', type: 'registry', summary: 'HKCU\\Software\\Microsoft\\Windows\\Run — new entry added', severity: 'high' },
  { ts: '12:10:31', device: 'SRV-DB-PROD-01', type: 'config', summary: 'PostgreSQL pg_hba.conf — permissions changed 644→777', severity: 'medium' },
  { ts: '11:02:09', device: 'LAPTOP-CFO-01', type: 'file', summary: 'C:\\System32\\drivers\\etc\\hosts — content modified', severity: 'medium' },
  { ts: '09:44:55', device: 'VPN-GW-01', type: 'config', summary: 'iptables ruleset — 2 rules removed from OUTPUT chain', severity: 'high' },
  { ts: 'Yesterday 23:12', device: 'WS-HR-08', type: 'binary', summary: 'Unsigned binary executed: C:\\Temp\\update_v2.exe', severity: 'critical' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function EventTypeIcon({ type }: { type: TimelineEvent['type'] }) {
  const icons = { file: FileText, registry: Settings, binary: Binary, config: AlertTriangle }
  const colors = { file: '#3B82F6', registry: '#F59E0B', binary: '#EF4444', config: '#9CA3AF' }
  const Icon = icons[type]
  return <Icon size={14} style={{ color: colors[type] }} />
}

function SeverityDot({ s }: { s: TimelineEvent['severity'] }) {
  const c = { critical: '#EF4444', high: '#F59E0B', medium: '#3B82F6', low: '#9CA3AF' }[s]
  return <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: c, display: 'inline-block' }} />
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1
  const w = 80, h = 32
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ')
  const last = data[data.length - 1]
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" />
      <circle cx={w} cy={h - ((last - min) / range) * h} r="3" fill={color} />
    </svg>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border p-3 text-xs" style={{ background: '#1F2937', borderColor: '#374151' }}>
      <p className="font-semibold mb-1" style={{ color: '#F9FAFB' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex gap-2">
          <div className="w-2 h-2 rounded-full mt-0.5" style={{ background: p.color }} />
          <span style={{ color: '#9CA3AF' }}>{p.name}:</span>
          <span style={{ color: '#F9FAFB' }}>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DriftMonitorPage() {
  const [entityActions, setEntityActions] = useState<Record<string, boolean>>({})
  const [optimizeScheduled, setOptimizeScheduled] = useState<string | null>(null)
  const [showAffected, setShowAffected] = useState(false)

  const doAction = (entity: string, action: string) =>
    setEntityActions(p => ({ ...p, [`${entity}-${action}`]: true }))

  return (
    <div className="p-6 space-y-6">

      {/* Section 1: Posture chart */}
      <div className="rounded-lg border p-5" style={{ background: '#1F2937', borderColor: '#374151' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#F9FAFB' }}>Posture Components — Last 30 Days</h2>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#111827' }}>
                {['Metric', 'Current', '30 Days Ago', 'Trend', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#6B7280', borderBottom: '1px solid #374151' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {postureMetrics.map((m, i) => (
                <tr key={m.metric} style={{ background: i % 2 === 0 ? '#1F2937' : '#111827', borderBottom: '1px solid #374151' }}>
                  <td className="px-4 py-2.5" style={{ color: '#F9FAFB' }}>{m.metric}</td>
                  <td className="px-4 py-2.5 font-semibold" style={{ color: m.status === 'amber' ? '#F59E0B' : '#10B981' }}>{m.current}</td>
                  <td className="px-4 py-2.5" style={{ color: '#9CA3AF' }}>{m.ago}</td>
                  <td className="px-4 py-2.5" style={{ color: m.trend.startsWith('↓') ? '#EF4444' : m.trend.startsWith('↑') ? '#10B981' : '#9CA3AF' }}>{m.trend}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: m.status === 'amber' ? '#78350F' : '#064E3B', color: m.status === 'amber' ? '#FCD34D' : '#10B981' }}>
                      {m.status === 'amber' ? 'Warning' : 'Good'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={postureData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="day" tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={{ stroke: '#374151' }} tickFormatter={(v, i) => i % 5 === 0 ? v : ''} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={{ stroke: '#374151' }} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x="May 8" stroke="#F59E0B" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={2} dot={false} name="Posture Score" />
            <Line type="monotone" dataKey="patch" stroke="#F59E0B" strokeWidth={1.5} dot={false} name="Patch %" />
            <Line type="monotone" dataKey="mfa" stroke="#10B981" strokeWidth={1.5} dot={false} name="MFA %" />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-3 p-3 rounded-lg border-l-4" style={{ background: '#111827', borderColor: '#F59E0B' }}>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>
            <span style={{ color: '#F59E0B' }}>⚠ </span>Patch compliance declined May 8 — 23 servers missed update cycle
          </p>
          <button onClick={() => setShowAffected(v => !v)} className="mt-1 text-xs" style={{ color: '#3B82F6' }}>
            {showAffected ? 'Hide systems ↑' : 'View affected systems →'}
          </button>
          {showAffected && (
            <div className="mt-2 flex flex-wrap gap-1">
              {Array.from({ length: 23 }, (_, i) => `WS-${String(i + 1).padStart(3, '0')}`).map(s => (
                <span key={s} className="text-xs font-mono px-1.5 py-0.5 rounded"
                  style={{ background: '#1F2937', color: '#F59E0B' }}>{s}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Real-time alteration timeline */}
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#F9FAFB' }}>Real-time Alteration Timeline</h2>
        <div className="rounded-lg border overflow-hidden" style={{ background: '#1F2937', borderColor: '#374151' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#111827' }}>
                {['Timestamp', 'Device', 'Type', 'Change Summary', 'Severity'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#6B7280', borderBottom: '1px solid #374151' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timelineEvents.map((ev, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors"
                  style={{ background: i % 2 === 0 ? '#1F2937' : '#111827', borderBottom: '1px solid #374151' }}>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: '#3B82F6' }}>{ev.ts}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: '#9CA3AF' }}>{ev.device}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <EventTypeIcon type={ev.type} />
                      <span className="text-xs capitalize" style={{ color: '#9CA3AF' }}>{ev.type}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs max-w-xs" style={{ color: '#F9FAFB' }}>{ev.summary}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <SeverityDot s={ev.severity} />
                      <span className="text-xs capitalize" style={{ color: '#9CA3AF' }}>{ev.severity}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Behavioral drift */}
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#F9FAFB' }}>Entities Showing Drift</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {driftEntities.map(entity => (
            <div key={entity.name} className="rounded-lg border p-4"
              style={{ background: '#1F2937', borderColor: '#374151' }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{entity.name}</h3>
                  <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{entity.type}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold"
                    style={{ color: entity.score > 70 ? '#EF4444' : '#F59E0B' }}>{entity.score}</div>
                  <div className="text-xs" style={{ color: '#6B7280' }}>/100</div>
                </div>
              </div>
              <div className="flex items-center justify-between mb-3">
                <MiniSparkline data={entity.history} color={entity.velocityColor} />
                <div className="text-right">
                  <div className="text-xs" style={{ color: entity.velocityColor }}>Velocity: {entity.velocity}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Since {entity.start}</div>
                </div>
              </div>
              {entity.note && (
                <p className="text-xs p-2 rounded mb-3" style={{ background: '#111827', color: '#9CA3AF' }}>{entity.note}</p>
              )}
              <div className="flex gap-1 flex-wrap">
                {['Flag', 'Mark expected', 'Set threshold'].map(action => {
                  const key = `${entity.name}-${action}`
                  return (
                    <button key={action} onClick={() => doAction(entity.name, action)}
                      className="px-2.5 py-1 text-xs rounded-md font-medium"
                      style={{ background: entityActions[key] ? '#064E3B' : '#374151', color: entityActions[key] ? '#10B981' : '#9CA3AF' }}>
                      {entityActions[key] ? '✓' : action}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Model health */}
      <div className="rounded-lg border p-5" style={{ background: '#1F2937', borderColor: '#374151' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#F9FAFB' }}>Fraud Detection Model Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center justify-center p-4 rounded-lg" style={{ background: '#111827' }}>
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#374151" strokeWidth="10" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#F59E0B" strokeWidth="10"
                  strokeLinecap="round" strokeDasharray={`${(76 / 100) * 251} 251`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-bold" style={{ color: '#F59E0B' }}>76</div>
                <div className="text-xs" style={{ color: '#6B7280' }}>/100</div>
              </div>
            </div>
            <div className="mt-2 text-sm font-semibold" style={{ color: '#F59E0B' }}>DEGRADING</div>
          </div>
          <div className="md:col-span-2 space-y-3">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  {['Metric', 'Current', 'Optimal', 'Drift', 'Days to Critical'].map(h => (
                    <th key={h} className="text-left py-2 px-2"
                      style={{ color: '#6B7280', borderBottom: '1px solid #374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { metric: 'Catch Rate', cur: '88.2%', opt: '93.7%', drift: '-5.5%', days: '18 days', dc: '#EF4444' },
                  { metric: 'False Pos Rate', cur: '5.1%', opt: '2.8%', drift: '+2.3%', days: '22 days', dc: '#EF4444' },
                  { metric: 'Model Score Dist', cur: 'Shifting', opt: 'Stable', drift: 'Medium', days: '—', dc: '#F59E0B' },
                ].map((row, i) => (
                  <tr key={row.metric} style={{ background: i % 2 === 0 ? '#111827' : 'transparent', borderBottom: '1px solid #374151' }}>
                    <td className="py-2 px-2" style={{ color: '#F9FAFB' }}>{row.metric}</td>
                    <td className="py-2 px-2" style={{ color: '#F59E0B' }}>{row.cur}</td>
                    <td className="py-2 px-2" style={{ color: '#10B981' }}>{row.opt}</td>
                    <td className="py-2 px-2" style={{ color: row.dc }}>{row.drift}</td>
                    <td className="py-2 px-2" style={{ color: '#9CA3AF' }}>{row.days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex gap-2">
              <button onClick={() => setOptimizeScheduled('now')}
                className="px-4 py-2 text-sm rounded-md font-medium"
                style={{ background: optimizeScheduled === 'now' ? '#064E3B' : '#3B82F6', color: 'white' }}>
                {optimizeScheduled === 'now' ? '✓ Optimization started' : 'Optimize Now'}
              </button>
              <button onClick={() => setOptimizeScheduled('sunday')}
                className="px-4 py-2 text-sm rounded-md font-medium"
                style={{ background: optimizeScheduled === 'sunday' ? '#064E3B' : '#374151', color: optimizeScheduled === 'sunday' ? '#10B981' : '#9CA3AF' }}>
                {optimizeScheduled === 'sunday' ? '✓ Scheduled Sunday 2am' : 'Schedule Sunday 2am'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}