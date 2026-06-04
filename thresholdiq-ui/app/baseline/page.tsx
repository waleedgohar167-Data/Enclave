'use client'

import { useState } from 'react'
import { X, TrendingUp } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserBaseline {
    name: string; dept: string; age: string; confidence: string; score: number | null; status: string
}
interface DeviceBaseline {
    name: string; type: string; age: string; confidence: string; score: number; status: string
}
interface ServiceAccount {
    name: string; dept: string; age: string; lastUsed: string; status: string; note: string
}
interface NetworkSegment {
    name: string; baseline: number; current: number; status: string
}
interface Benchmark {
    name: string; score: number; target: number; color: string; controls: number
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const users: UserBaseline[] = [
    { name: 'Sarah Chen', dept: 'Finance', age: '94 days', confidence: 'High', score: 89, status: 'review' },
    { name: 'James Liu', dept: 'Engineering', age: '94 days', confidence: 'High', score: 12, status: 'normal' },
    { name: 'Maria Santos', dept: 'HR', age: '94 days', confidence: 'High', score: 8, status: 'normal' },
    { name: 'David Park', dept: 'IT', age: '90 days', confidence: 'High', score: 24, status: 'normal' },
    { name: 'Emma Wilson', dept: 'Finance', age: '94 days', confidence: 'High', score: 11, status: 'normal' },
    { name: 'Lisa Zhang', dept: 'Engineering', age: '45 days', confidence: 'Medium', score: 19, status: 'normal' },
    { name: 'New Hire 1', dept: 'Sales', age: '12 days', confidence: 'LOW', score: null, status: 'learning' },
]

const devices: DeviceBaseline[] = [
    { name: 'WS-FIN-12', type: 'Workstation', age: '94 days', confidence: 'High', score: 14, status: 'normal' },
    { name: 'WS-ENG-047', type: 'Workstation', age: '94 days', confidence: 'High', score: 34, status: 'review' },
    { name: 'SRV-DB-PROD-01', type: 'Server', age: '94 days', confidence: 'High', score: 5, status: 'normal' },
    { name: 'DEV-SRV-04', type: 'Dev Server', age: '94 days', confidence: 'High', score: 41, status: 'review' },
    { name: 'LAPTOP-CFO-01', type: 'Laptop', age: '90 days', confidence: 'High', score: 8, status: 'normal' },
]

const serviceAccounts: ServiceAccount[] = [
    { name: 'SA-DBBackup01', dept: 'IT', age: '94 days', lastUsed: '47 days ago', status: 'review', note: 'Unused 47 days' },
    { name: 'SA-ReportingService', dept: 'Finance', age: '94 days', lastUsed: 'Today', status: 'normal', note: '' },
    { name: 'SA-MonitoringAgent', dept: 'IT', age: '94 days', lastUsed: '2 hours ago', status: 'normal', note: '' },
    { name: 'SA-APIGateway', dept: 'Engineering', age: '94 days', lastUsed: '15 min ago', status: 'normal', note: '' },
]

const networkSegments: NetworkSegment[] = [
    { name: 'Corporate LAN', baseline: 85, current: 88, status: 'normal' },
    { name: 'Finance VLAN', baseline: 45, current: 52, status: 'review' },
    { name: 'Dev Network', baseline: 70, current: 74, status: 'normal' },
    { name: 'DMZ', baseline: 20, current: 21, status: 'normal' },
    { name: 'VPN Gateway', baseline: 30, current: 38, status: 'review' },
]

const benchmarks: Benchmark[] = [
    { name: 'CIS Benchmark L1', score: 91, target: 100, color: '#10B981', controls: 153 },
    { name: 'CIS Benchmark L2', score: 84, target: 100, color: '#3B82F6', controls: 74 },
    { name: 'File Integrity', score: 97, target: 100, color: '#10B981', controls: 312 },
    { name: 'STIG Compliance', score: 78, target: 100, color: '#F59E0B', controls: 229 },
]

const TABS = ['Users', 'Devices', 'Service Accounts', 'Network', 'Benchmarks'] as const
type Tab = typeof TABS[number]

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreCell({ score }: { score: number | null }) {
    if (score === null) return <span style={{ color: '#6B7280' }}>—</span>
    const color = score > 50 ? '#EF4444' : score > 25 ? '#F59E0B' : '#10B981'
    return <span className="font-semibold" style={{ color }}>{score}</span>
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { bg: string; text: string }> = {
        review: { bg: '#78350F', text: '#FCD34D' },
        normal: { bg: '#064E3B', text: '#6EE7B7' },
        learning: { bg: '#1F2937', text: '#6B7280' },
    }
    const c = map[status] ?? map.normal
    return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{ background: c.bg, color: c.text }}>{status}</span>
    )
}

function UserDrawer({ user, onClose }: { user: UserBaseline; onClose: () => void }) {
    const heatmap = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        intensity: i === 23 ? 1 : (i >= 8 && i <= 18) ? Math.random() * 0.6 + 0.3 : Math.random() * 0.1,
        anomalous: i === 23,
    }))
    return (
        <div className="fixed inset-0 z-50 flex justify-end"
            style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
            <div className="h-full overflow-y-auto"
                style={{ background: '#1F2937', width: '440px', borderLeft: '1px solid #374151' }}
                onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-semibold" style={{ color: '#F9FAFB' }}>{user.name}</h2>
                            <p className="text-sm" style={{ color: '#9CA3AF' }}>{user.dept}</p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-md hover:bg-white/10"
                            style={{ color: '#9CA3AF' }}><X size={18} /></button>
                    </div>
                    <div className="p-3 rounded-lg mb-4" style={{ background: '#111827' }}>
                        <div className="text-2xl font-bold mb-1"
                            style={{ color: (user.score ?? 0) > 50 ? '#EF4444' : '#10B981' }}>
                            {user.score ?? '—'} <span className="text-sm font-normal" style={{ color: '#6B7280' }}>/ 100</span>
                        </div>
                        <div className="text-xs" style={{ color: '#6B7280' }}>Baseline: {user.age} · Confidence: {user.confidence}</div>
                    </div>
                    <div className="mb-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>Login Activity Heatmap</h4>
                        <div className="flex gap-0.5">
                            {heatmap.map(({ hour, intensity, anomalous }) => (
                                <div key={hour} className="flex-1 rounded-sm" title={`${hour}:00`}
                                    style={{ height: '24px', background: anomalous ? `rgba(239,68,68,${intensity})` : `rgba(59,130,246,${intensity})` }} />
                            ))}
                        </div>
                        <div className="flex justify-between text-xs mt-1" style={{ color: '#6B7280' }}>
                            <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>12am</span>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>Known Locations</h4>
                        {[{ loc: 'London Office (EC2)', freq: '98% of sessions' }, { loc: 'Home VPN (London)', freq: '8 sessions' }].map(l => (
                            <div key={l.loc} className="flex justify-between text-xs py-1.5 border-b" style={{ borderColor: '#374151' }}>
                                <span style={{ color: '#F9FAFB' }}>{l.loc}</span>
                                <span style={{ color: '#6B7280' }}>{l.freq}</span>
                            </div>
                        ))}
                        <div className="flex justify-between text-xs py-1.5">
                            <span style={{ color: '#EF4444' }}>Manchester (residential)</span>
                            <span style={{ color: '#EF4444' }}>ANOMALY</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BaselinePage() {
    const [activeTab, setActiveTab] = useState<Tab>('Users')
    const [selectedUser, setSelectedUser] = useState<UserBaseline | null>(null)
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

    const sortedUsers = [...users].sort((a, b) => {
        const va = a.score ?? -1, vb = b.score ?? -1
        return sortDir === 'desc' ? vb - va : va - vb
    })

    const thStyle = { color: '#6B7280', borderBottom: '1px solid #374151' }
    const trStyle = (i: number) => ({ background: i % 2 === 0 ? '#1F2937' : '#111827', borderBottom: '1px solid #374151' })

    return (
        <div className="p-6">
            {/* Summary */}
            <div className="rounded-lg border p-5 mb-5" style={{ background: '#1F2937', borderColor: '#374151' }}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {[
                        { label: 'Status', value: 'ESTABLISHED', color: '#10B981' },
                        { label: 'Days of Data', value: '94 days', color: '#F9FAFB' },
                        { label: 'Confidence', value: 'HIGH', color: '#10B981' },
                        { label: 'Last Updated', value: '4 min ago', color: '#9CA3AF' },
                    ].map(m => (
                        <div key={m.label}>
                            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>{m.label}</div>
                            <div className="text-sm font-semibold" style={{ color: m.color }}>{m.value}</div>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t" style={{ borderColor: '#374151' }}>
                    {[['247', 'Users profiled'], ['312', 'Devices profiled'], ['89', 'Service accounts']].map(([val, label]) => (
                        <div key={label} className="text-center">
                            <div className="text-2xl font-bold" style={{ color: '#3B82F6' }}>{val}</div>
                            <div className="text-xs" style={{ color: '#6B7280' }}>{label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 flex-wrap">
                {TABS.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className="px-4 py-2 rounded-md text-sm font-medium transition-all"
                        style={{ background: activeTab === tab ? '#3B82F6' : '#1F2937', color: activeTab === tab ? 'white' : '#9CA3AF', border: '1px solid', borderColor: activeTab === tab ? '#3B82F6' : '#374151' }}>
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'Users' && (
                <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#374151' }}>
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ background: '#111827' }}>
                                {['Name', 'Dept', 'Baseline Age', 'Confidence', 'Anomaly Score ↕', 'Status'].map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer"
                                        style={thStyle}
                                        onClick={() => h.includes('Score') && setSortDir(d => d === 'desc' ? 'asc' : 'desc')}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedUsers.map((u, i) => (
                                <tr key={u.name} className="cursor-pointer hover:bg-blue-500/5 transition-colors"
                                    style={trStyle(i)} onClick={() => setSelectedUser(u)}>
                                    <td className="px-4 py-3 font-medium" style={{ color: '#F9FAFB' }}>{u.name}</td>
                                    <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{u.dept}</td>
                                    <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{u.age}</td>
                                    <td className="px-4 py-3 text-xs" style={{ color: u.confidence === 'High' ? '#10B981' : '#F59E0B' }}>{u.confidence}</td>
                                    <td className="px-4 py-3"><ScoreCell score={u.score} /></td>
                                    <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'Devices' && (
                <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#374151' }}>
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ background: '#111827' }}>
                                {['Device', 'Type', 'Baseline Age', 'Confidence', 'Anomaly Score', 'Status'].map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={thStyle}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {devices.map((d, i) => (
                                <tr key={d.name} style={trStyle(i)}>
                                    <td className="px-4 py-3 font-mono text-xs font-medium" style={{ color: '#F9FAFB' }}>{d.name}</td>
                                    <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{d.type}</td>
                                    <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{d.age}</td>
                                    <td className="px-4 py-3 text-xs" style={{ color: '#10B981' }}>{d.confidence}</td>
                                    <td className="px-4 py-3"><ScoreCell score={d.score} /></td>
                                    <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'Service Accounts' && (
                <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#374151' }}>
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ background: '#111827' }}>
                                {['Account', 'Dept', 'Baseline Age', 'Last Used', 'Status', 'Note'].map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={thStyle}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {serviceAccounts.map((sa, i) => (
                                <tr key={sa.name} style={trStyle(i)}>
                                    <td className="px-4 py-3 font-mono text-xs font-medium" style={{ color: '#F9FAFB' }}>{sa.name}</td>
                                    <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{sa.dept}</td>
                                    <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{sa.age}</td>
                                    <td className="px-4 py-3 text-xs" style={{ color: sa.lastUsed.includes('day') ? '#F59E0B' : '#9CA3AF' }}>{sa.lastUsed}</td>
                                    <td className="px-4 py-3"><StatusBadge status={sa.status} /></td>
                                    <td className="px-4 py-3 text-xs" style={{ color: '#F59E0B' }}>{sa.note}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'Network' && (
                <div className="space-y-3">
                    {networkSegments.map(seg => (
                        <div key={seg.name} className="p-4 rounded-lg border"
                            style={{ background: '#1F2937', borderColor: '#374151' }}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{seg.name}</span>
                                <StatusBadge status={seg.status} />
                            </div>
                            <div className="flex gap-6 text-xs mb-2" style={{ color: '#6B7280' }}>
                                <span>Baseline avg: <strong style={{ color: '#9CA3AF' }}>{seg.baseline} Mbps</strong></span>
                                <span>Current: <strong style={{ color: seg.current > seg.baseline * 1.1 ? '#F59E0B' : '#10B981' }}>{seg.current} Mbps</strong></span>
                            </div>
                            <div className="relative h-2 rounded-full" style={{ background: '#374151' }}>
                                <div className="absolute h-full rounded-full opacity-40"
                                    style={{ width: `${seg.baseline}%`, background: '#374151' }} />
                                <div className="absolute h-full rounded-full"
                                    style={{ width: `${seg.current}%`, background: seg.current > seg.baseline * 1.1 ? '#F59E0B' : '#10B981' }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'Benchmarks' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {benchmarks.map(b => (
                        <div key={b.name} className="p-5 rounded-lg border"
                            style={{ background: '#1F2937', borderColor: '#374151' }}>
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{b.name}</h3>
                                <span className="text-2xl font-bold" style={{ color: b.color }}>{b.score}%</span>
                            </div>
                            <div className="h-2.5 rounded-full mb-2" style={{ background: '#374151' }}>
                                <div className="h-full rounded-full" style={{ width: `${b.score}%`, background: b.color }} />
                            </div>
                            <div className="flex justify-between text-xs" style={{ color: '#6B7280' }}>
                                <span>{b.controls} controls monitored</span>
                                <span style={{ color: b.score >= 90 ? '#10B981' : b.score >= 80 ? '#F59E0B' : '#EF4444' }}>
                                    {b.score >= 90 ? 'Compliant' : b.score >= 80 ? 'Needs attention' : 'Critical gaps'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Learning progress */}
            <div className="rounded-lg border p-5 mt-5" style={{ background: '#1F2937', borderColor: '#374151' }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: '#F9FAFB' }}>Baseline Learning Progress</h3>
                <div className="space-y-3">
                    {[{ name: 'New Hire 1', days: 12, total: 30 }, { name: 'Lisa Zhang', days: 45, total: 90 }, { name: 'Alex Chen', days: 94, total: 90 }].map(e => (
                        <div key={e.name} className="flex items-center gap-3">
                            <div className="w-28 text-xs" style={{ color: '#9CA3AF' }}>{e.name}</div>
                            <div className="flex-1 h-2 rounded-full" style={{ background: '#374151' }}>
                                <div className="h-full rounded-full"
                                    style={{ width: `${Math.min((e.days / e.total) * 100, 100)}%`, background: e.days >= e.total ? '#10B981' : '#3B82F6' }} />
                            </div>
                            <div className="text-xs w-20 text-right" style={{ color: '#6B7280' }}>
                                {e.days >= e.total ? 'Established' : `${e.days}/${e.total}d`}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedUser && <UserDrawer user={selectedUser} onClose={() => setSelectedUser(null)} />}
        </div>
    )
}