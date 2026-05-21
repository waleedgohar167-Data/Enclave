'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Alert {
    id: number
    severity: string
    status: string
    title: string
    source: string
    assets: string
    impact: string
    confidence: number
    time: string
    assignee?: string | null
    closedBy?: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const alerts: Alert[] = [
    {
        id: 2851,
        severity: 'HIGH',
        status: 'NEW',
        title: 'Unusual access pattern — Finance user outside business hours',
        source: 'Sentinel + Investigator',
        assets: 'Finance database, Payroll system',
        impact: 'HIGH',
        confidence: 89,
        time: '2 hours ago',
        assignee: null,
    },
    {
        id: 2850,
        severity: 'MEDIUM',
        status: 'IN PROGRESS',
        title: 'New external connection from dev server',
        source: 'Sentinel',
        assets: 'DEV-SRV-04',
        impact: 'MEDIUM',
        confidence: 72,
        time: '5 hours ago',
        assignee: 'Alex Chen',
    },
    {
        id: 2849,
        severity: 'LOW',
        status: 'NEW',
        title: 'Multiple failed auth attempts — single source IP',
        source: 'Alert Optimizer (grouped 23 events)',
        assets: 'VPN Gateway',
        impact: 'LOW',
        confidence: 61,
        time: '8 hours ago',
        assignee: null,
    },
    {
        id: 2848,
        severity: 'INFO',
        status: 'CLOSED',
        title: 'Scheduled scan activity — IT team',
        source: 'Alert Optimizer',
        assets: 'None',
        impact: 'NONE',
        confidence: 99,
        time: 'Yesterday',
        closedBy: 'Alert Optimizer (auto)',
        assignee: null,
    },
]

const evidence = [
    { time: '11:43pm', desc: 'Login from 82.xx.xx.xx (Manchester)' },
    { time: '11:44pm', desc: 'Finance DB accessed (normal for role)' },
    { time: '11:47pm', desc: 'Payroll table queried (unusual query)' },
    { time: '11:52pm', desc: 'Session ended, no data exported' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function SeverityDot({ severity }: { severity: string }) {
    const colors: Record<string, string> = {
        HIGH: '#F59E0B', MEDIUM: '#3B82F6', LOW: '#9CA3AF',
        INFO: '#6B7280', CRITICAL: '#EF4444',
    }
    return (
        <span
            className="w-2 h-2 rounded-full inline-block mr-2"
            style={{ background: colors[severity] ?? '#6B7280' }}
        />
    )
}

function StatusBadge({ severity }: { severity: string }) {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
        critical: { bg: '#7F1D1D', text: '#FCA5A5', label: 'Critical' },
        high: { bg: '#78350F', text: '#FCD34D', label: 'High' },
        medium: { bg: '#1E3A5F', text: '#93C5FD', label: 'Medium' },
        low: { bg: '#1F2937', text: '#9CA3AF', label: 'Low' },
        info: { bg: '#1F2937', text: '#6B7280', label: 'Info' },
        new: { bg: '#1E3A5F', text: '#93C5FD', label: 'New' },
        'in progress': { bg: '#78350F', text: '#FCD34D', label: 'In Progress' },
        closed: { bg: '#064E3B', text: '#6EE7B7', label: 'Closed' },
    }
    const key = severity?.toLowerCase()
    const config = configs[key] ?? configs.info
    return (
        <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{ background: config.bg, color: config.text }}
        >
            {config.label}
        </span>
    )
}

function ConfidenceBar({ value }: { value: number }) {
    const color = value >= 80 ? '#EF4444' : value >= 60 ? '#F59E0B' : '#9CA3AF'
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full" style={{ background: '#374151' }}>
                <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
            </div>
            <span className="text-xs font-medium" style={{ color }}>{value}%</span>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TriagePage() {
    const [selected, setSelected] = useState<Alert | null>(null)
    const [filter, setFilter] = useState({ severity: 'All', status: 'All' })
    const [search, setSearch] = useState('')
    const [actionDone, setActionDone] = useState<Record<string, boolean>>({})

    const filtered = alerts.filter((a) => {
        if (filter.severity !== 'All' && a.severity !== filter.severity) return false
        if (filter.status !== 'All' && a.status !== filter.status) return false
        if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false
        return true
    })

    const handleAction = (id: number, action: string) => {
        setActionDone((prev) => ({ ...prev, [`${id}-${action}`]: true }))
    }

    return (
        <div className="p-6">
            {/* Funnel */}
            <div
                className="rounded-lg border p-5 mb-6"
                style={{ background: '#1F2937', borderColor: '#374151' }}
            >
                <h2 className="text-lg font-semibold mb-1" style={{ color: '#F9FAFB' }}>Alert Queue</h2>
                <p className="text-sm mb-4" style={{ color: '#9CA3AF' }}>
                    Alert Optimizer reduced 2,847 raw alerts to 4 actionable cases today
                </p>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                        <div className="text-3xl font-bold" style={{ color: '#EF4444' }}>2,847</div>
                        <div className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Raw alerts</div>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 h-0.5" style={{ background: '#374151' }} />
                        <div
                            className="px-3 py-1.5 rounded-md text-xs font-medium text-center"
                            style={{ background: '#1E3A5F', color: '#93C5FD' }}
                        >
                            Alert Optimizer<br />
                            <span style={{ color: '#6B7280' }}>99.9% filtered</span>
                        </div>
                        <div className="flex-1 h-0.5" style={{ background: '#374151' }} />
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="text-3xl font-bold" style={{ color: '#10B981' }}>4</div>
                        <div className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Actionable</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex gap-1">
                    {['All', 'Critical', 'High', 'Medium', 'Low'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter((f) => ({ ...f, severity: s }))}
                            className="px-3 py-1.5 text-xs font-medium rounded-md transition-all"
                            style={{
                                background: filter.severity === s ? '#3B82F6' : '#1F2937',
                                color: filter.severity === s ? 'white' : '#9CA3AF',
                                border: '1px solid',
                                borderColor: filter.severity === s ? '#3B82F6' : '#374151',
                            }}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <div className="flex gap-1">
                    {['All', 'NEW', 'IN PROGRESS', 'CLOSED'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter((f) => ({ ...f, status: s }))}
                            className="px-3 py-1.5 text-xs font-medium rounded-md transition-all"
                            style={{
                                background: filter.status === s ? '#374151' : 'transparent',
                                color: filter.status === s ? '#F9FAFB' : '#9CA3AF',
                                border: '1px solid #374151',
                            }}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <input
                    type="text"
                    placeholder="Search cases..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="px-3 py-1.5 rounded-md text-xs outline-none ml-auto"
                    style={{
                        background: '#1F2937',
                        border: '1px solid #374151',
                        color: '#F9FAFB',
                        minWidth: '180px',
                    }}
                />
            </div>

            {/* Alert rows */}
            <div className="space-y-2">
                {filtered.map((alert, idx) => (
                    <div
                        key={alert.id}
                        className="rounded-lg border p-4 cursor-pointer transition-all hover:border-blue-500/40"
                        style={{
                            background: idx % 2 === 0 ? '#1F2937' : '#111827',
                            borderColor: selected?.id === alert.id ? '#3B82F6' : '#374151',
                        }}
                        onClick={() => setSelected(alert)}
                    >
                        <div className="flex flex-wrap items-start gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                    <span className="text-xs font-mono font-semibold" style={{ color: '#6B7280' }}>
                                        CASE #{alert.id}
                                    </span>
                                    <SeverityDot severity={alert.severity} />
                                    <StatusBadge severity={alert.severity} />
                                    <StatusBadge severity={alert.status.toLowerCase()} />
                                </div>
                                <p className="font-medium text-sm mb-2" style={{ color: '#F9FAFB' }}>{alert.title}</p>
                                <div className="flex flex-wrap gap-4 text-xs" style={{ color: '#9CA3AF' }}>
                                    <span><span style={{ color: '#6B7280' }}>Source:</span> {alert.source}</span>
                                    <span><span style={{ color: '#6B7280' }}>Assets:</span> {alert.assets}</span>
                                    <span><span style={{ color: '#6B7280' }}>Impact:</span> {alert.impact}</span>
                                    {alert.assignee && (
                                        <span><span style={{ color: '#6B7280' }}>Assigned:</span> {alert.assignee}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 min-w-[120px]">
                                <span className="text-xs" style={{ color: '#6B7280' }}>{alert.time}</span>
                                <div className="w-24">
                                    <div className="text-xs mb-1" style={{ color: '#6B7280' }}>Confidence</div>
                                    <ConfidenceBar value={alert.confidence} />
                                </div>
                                <div className="flex gap-1 flex-wrap justify-end">
                                    {alert.status !== 'CLOSED' ? (
                                        <>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleAction(alert.id, 'investigate')
                                                    setSelected(alert)
                                                }}
                                                className="px-2 py-1 text-xs rounded font-medium transition-colors"
                                                style={{
                                                    background: actionDone[`${alert.id}-investigate`] ? '#064E3B' : '#3B82F6',
                                                    color: 'white',
                                                }}
                                            >
                                                {actionDone[`${alert.id}-investigate`] ? 'Opened ✓' : 'Investigate'}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleAction(alert.id, 'dismiss')
                                                }}
                                                className="px-2 py-1 text-xs rounded font-medium"
                                                style={{ background: '#374151', color: '#9CA3AF' }}
                                            >
                                                {actionDone[`${alert.id}-dismiss`] ? 'Dismissed ✓' : 'Dismiss'}
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            className="px-2 py-1 text-xs rounded font-medium"
                                            style={{ background: '#374151', color: '#9CA3AF' }}
                                        >
                                            View Details
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Detail drawer */}
            {selected && (
                <div
                    className="fixed inset-0 z-50 flex justify-end"
                    style={{ background: 'rgba(0,0,0,0.6)' }}
                    onClick={() => setSelected(null)}
                >
                    <div
                        className="h-full overflow-y-auto"
                        style={{
                            background: '#1F2937',
                            width: '480px',
                            borderLeft: '1px solid #374151',
                            animation: 'slide-in-right 0.3s ease-out',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-lg font-semibold" style={{ color: '#F9FAFB' }}>
                                        Case #{selected.id}
                                    </h2>
                                    <StatusBadge severity={selected.severity} />
                                </div>
                                <button
                                    onClick={() => setSelected(null)}
                                    className="p-2 rounded-md hover:bg-white/10"
                                    style={{ color: '#9CA3AF' }}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Summary */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold mb-2" style={{ color: '#F9FAFB' }}>Summary</h3>
                                <p
                                    className="text-sm leading-relaxed p-4 rounded-lg"
                                    style={{ background: '#111827', color: '#9CA3AF' }}
                                >
                                    At <strong style={{ color: '#F9FAFB' }}>11:43pm</strong>, user{' '}
                                    <strong style={{ color: '#3B82F6' }}>sarah.chen@company.com</strong> accessed the finance
                                    database from an unusual location. Sarah normally works 8am–6pm from the London office.
                                    This access came from a residential IP in{' '}
                                    <strong style={{ color: '#F9FAFB' }}>Manchester at 11:43pm</strong> — Sarah's first access
                                    outside London in{' '}
                                    <strong style={{ color: '#F9FAFB' }}>18 months</strong> of baseline data.
                                </p>
                            </div>

                            {/* Evidence */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold mb-3" style={{ color: '#F9FAFB' }}>Evidence Chain</h3>
                                <div className="space-y-2">
                                    {evidence.map((ev, i) => (
                                        <div key={i} className="flex gap-3 items-start">
                                            <div className="flex flex-col items-center">
                                                <div
                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                                    style={{ background: '#374151', color: '#9CA3AF' }}
                                                >
                                                    {i + 1}
                                                </div>
                                                {i < evidence.length - 1 && (
                                                    <div className="w-0.5 h-4 mt-1" style={{ background: '#374151' }} />
                                                )}
                                            </div>
                                            <div className="pb-2">
                                                <span className="text-xs font-mono font-semibold" style={{ color: '#3B82F6' }}>
                                                    {ev.time}
                                                </span>
                                                <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{ev.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold mb-3" style={{ color: '#F9FAFB' }}>
                                    Recommended Actions
                                </h3>
                                <div className="space-y-2">
                                    {[
                                        'Verify with Sarah (draft message ready)',
                                        'Flag for investigation',
                                        'Temporarily restrict to known locations',
                                    ].map((action, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleAction(selected.id, action)}
                                            className="w-full text-left px-4 py-3 rounded-md text-sm transition-all"
                                            style={{
                                                background: actionDone[`${selected.id}-${action}`] ? '#064E3B' : '#111827',
                                                border: '1px solid',
                                                borderColor: actionDone[`${selected.id}-${action}`] ? '#10B981' : '#374151',
                                                color: actionDone[`${selected.id}-${action}`] ? '#10B981' : '#F9FAFB',
                                            }}
                                        >
                                            [{i + 1}] {action} {actionDone[`${selected.id}-${action}`] ? '✓' : ''}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Confidence */}
                            <div>
                                <h3 className="text-sm font-semibold mb-3" style={{ color: '#F9FAFB' }}>
                                    Confidence Breakdown
                                </h3>
                                <div className="space-y-2 p-4 rounded-lg" style={{ background: '#111827' }}>
                                    {[
                                        { label: 'Behavioral baseline deviation', value: 'High', color: '#EF4444' },
                                        { label: 'Threat intelligence match', value: 'None', color: '#10B981' },
                                        { label: 'Business context (HR travel)', value: 'No travel logged', color: '#F59E0B' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex justify-between text-xs">
                                            <span style={{ color: '#9CA3AF' }}>{item.label}</span>
                                            <span className="font-medium" style={{ color: item.color }}>{item.value}</span>
                                        </div>
                                    ))}
                                    <div className="pt-2 mt-2 border-t" style={{ borderColor: '#374151' }}>
                                        <div className="flex justify-between text-xs">
                                            <span className="font-medium" style={{ color: '#F9FAFB' }}>Overall confidence</span>
                                            <span className="font-bold" style={{ color: '#EF4444' }}>
                                                89% — requires human review
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}