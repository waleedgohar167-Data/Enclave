'use client'

import { useState } from 'react'
import { Cpu, Settings, X, ToggleLeft, ToggleRight, Shield, Wifi, WifiOff } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface HostAgent {
    id: number
    deviceName: string
    os: 'Windows' | 'Linux' | 'macOS'
    ipAddress: string
    sensorVersion: string
    status: 'Online' | 'Offline' | 'Defective' | 'Isolated'
    lastSeen: string
    isolated: boolean
}

interface AIAgent {
    id: number
    name: string
    desc: string
    metric: string
    last: string
    autonomy: number
    logs: string[]
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const hostAgents: HostAgent[] = [
    { id: 1, deviceName: 'WS-FIN-12', os: 'Windows', ipAddress: '10.10.1.42', sensorVersion: '4.2.1', status: 'Online', lastSeen: '1 min ago', isolated: false },
    { id: 2, deviceName: 'WS-ENG-047', os: 'Linux', ipAddress: '10.10.2.47', sensorVersion: '4.2.1', status: 'Online', lastSeen: '2 min ago', isolated: false },
    { id: 3, deviceName: 'SRV-DB-PROD-01', os: 'Linux', ipAddress: '10.10.3.10', sensorVersion: '4.1.9', status: 'Online', lastSeen: '30 sec ago', isolated: false },
    { id: 4, deviceName: 'DEV-SRV-04', os: 'Linux', ipAddress: '10.10.4.4', sensorVersion: '4.2.1', status: 'Isolated', lastSeen: '5 min ago', isolated: true },
    { id: 5, deviceName: 'LAPTOP-CFO-01', os: 'macOS', ipAddress: '10.10.1.88', sensorVersion: '4.2.1', status: 'Online', lastSeen: '4 min ago', isolated: false },
    { id: 6, deviceName: 'WS-HR-08', os: 'Windows', ipAddress: '10.10.5.21', sensorVersion: '4.0.7', status: 'Defective', lastSeen: '2 hours ago', isolated: false },
    { id: 7, deviceName: 'SRV-WEB-PROD-02', os: 'Linux', ipAddress: '10.10.3.22', sensorVersion: '4.2.1', status: 'Online', lastSeen: '1 min ago', isolated: false },
    { id: 8, deviceName: 'VPN-GW-01', os: 'Linux', ipAddress: '192.168.0.1', sensorVersion: '4.2.1', status: 'Online', lastSeen: '20 sec ago', isolated: false },
]

const aiAgents: AIAgent[] = [
    { id: 1, name: 'Orchestrator', desc: 'Coordinates all agents and dispatches tasks', metric: '47 coordination events', last: 'Dispatched Investigator to Case #2851', autonomy: 90, logs: ['14:23 — Dispatched Investigator', '12:10 — Scheduled nightly hunt'] },
    { id: 2, name: 'Sentinel', desc: 'Behavioral monitoring across all endpoints and users', metric: '847,293 events processed', last: 'Anomaly detected — Sarah Chen 2h ago', autonomy: 70, logs: ['14:21 — Anomaly flagged: sarah.chen', '11:43 — Unusual login detected'] },
    { id: 3, name: 'Alert Optimizer', desc: 'Reduces noise and prioritizes actionable alerts', metric: '2,847 → 4 (99.9% filtered)', last: 'Grouped 23 auth failures → 1 case', autonomy: 95, logs: ['14:00 — 23 events grouped', '10:00 — 1,200 auto-closed'] },
    { id: 4, name: 'Investigator', desc: 'Automated investigation and dossier compilation', metric: '3 investigations completed', last: 'Case #2851 dossier completed 2h ago', autonomy: 75, logs: ['14:23 — Case #2851 dossier compiled'] },
    { id: 5, name: 'Responder', desc: 'Automated response within defined policy', metric: '2 autonomous actions taken', last: 'IP blocked — 185.234.xx.xx at 02:14', autonomy: 60, logs: ['02:14 — IP 185.234.xx.xx blocked'] },
    { id: 6, name: 'Guardian', desc: 'Continuous compliance monitoring and gap detection', metric: '97% compliance maintained', last: '3 evidence records filed 14m ago', autonomy: 85, logs: ['14:46 — 3 evidence records auto-filed'] },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function OSBadge({ os }: { os: HostAgent['os'] }) {
    const colors: Record<HostAgent['os'], { bg: string; text: string }> = {
        Windows: { bg: '#1E3A5F', text: '#93C5FD' },
        Linux: { bg: '#064E3B', text: '#6EE7B7' },
        macOS: { bg: '#374151', text: '#9CA3AF' },
    }
    const c = colors[os]
    return (
        <span className="text-xs px-2 py-0.5 rounded font-mono"
            style={{ background: c.bg, color: c.text }}>{os}</span>
    )
}

function HostStatusBadge({ status }: { status: HostAgent['status'] }) {
    const map: Record<HostAgent['status'], { bg: string; text: string }> = {
        Online: { bg: '#064E3B', text: '#10B981' },
        Offline: { bg: '#7F1D1D', text: '#FCA5A5' },
        Defective: { bg: '#78350F', text: '#FCD34D' },
        Isolated: { bg: '#1E3A5F', text: '#93C5FD' },
    }
    const c = map[status]
    return (
        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: c.bg, color: c.text }}>● {status}</span>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgentsPage() {
    const [view, setView] = useState<'hosts' | 'ai'>('hosts')
    const [isolationState, setIsolationState] = useState<Record<number, boolean>>(
        Object.fromEntries(hostAgents.map(a => [a.id, a.isolated]))
    )
    const [selectedAI, setSelectedAI] = useState<AIAgent | null>(null)
    const [autonomyLevels, setAutonomyLevels] = useState<Record<number, number>>({})
    const [aiEnabled, setAiEnabled] = useState<Record<number, boolean>>({})

    const getAutonomy = (a: AIAgent) => autonomyLevels[a.id] ?? a.autonomy
    const isEnabled = (a: AIAgent) => aiEnabled[a.id] !== false

    const summary = {
        total: hostAgents.length,
        online: hostAgents.filter(a => !isolationState[a.id] && a.status !== 'Offline' && a.status !== 'Defective').length,
        defective: hostAgents.filter(a => a.status === 'Defective').length,
        isolated: Object.values(isolationState).filter(Boolean).length,
    }

    return (
        <div className="p-6">
            {/* Summary bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Agents', value: summary.total, color: '#F9FAFB' },
                    { label: 'Online', value: summary.online, color: '#10B981' },
                    { label: 'Defective', value: summary.defective, color: '#F59E0B' },
                    { label: 'Isolated', value: summary.isolated, color: '#93C5FD' },
                ].map(m => (
                    <div key={m.label} className="p-4 rounded-lg border"
                        style={{ background: '#1F2937', borderColor: '#374151' }}>
                        <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>{m.label}</div>
                        <div className="text-3xl font-bold" style={{ color: m.color }}>{m.value}</div>
                    </div>
                ))}
            </div>

            {/* View toggle */}
            <div className="flex gap-1 mb-5">
                {(['hosts', 'ai'] as const).map(v => (
                    <button key={v} onClick={() => setView(v)}
                        className="px-4 py-2 rounded-md text-sm font-medium transition-all"
                        style={{ background: view === v ? '#3B82F6' : '#1F2937', color: view === v ? 'white' : '#9CA3AF', border: '1px solid', borderColor: view === v ? '#3B82F6' : '#374151' }}>
                        {v === 'hosts' ? 'Host Endpoints' : 'AI Agent Network'}
                    </button>
                ))}
            </div>

            {/* Hosts table */}
            {view === 'hosts' && (
                <div className="rounded-lg border overflow-hidden" style={{ background: '#1F2937', borderColor: '#374151' }}>
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ background: '#111827' }}>
                                {['Device Name', 'OS', 'IP Address', 'Sensor Version', 'Status', 'Last Seen', 'Network Isolate'].map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                                        style={{ color: '#6B7280', borderBottom: '1px solid #374151' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {hostAgents.map((agent, i) => (
                                <tr key={agent.id} className="hover:bg-white/5 transition-colors"
                                    style={{ background: i % 2 === 0 ? '#1F2937' : '#111827', borderBottom: '1px solid #374151' }}>
                                    <td className="px-4 py-3 font-mono text-xs font-medium" style={{ color: '#F9FAFB' }}>{agent.deviceName}</td>
                                    <td className="px-4 py-3"><OSBadge os={agent.os} /></td>
                                    <td className="px-4 py-3 font-mono text-xs" style={{ color: '#9CA3AF' }}>{agent.ipAddress}</td>
                                    <td className="px-4 py-3 font-mono text-xs" style={{ color: '#9CA3AF' }}>{agent.sensorVersion}</td>
                                    <td className="px-4 py-3"><HostStatusBadge status={isolationState[agent.id] ? 'Isolated' : agent.status} /></td>
                                    <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{agent.lastSeen}</td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => setIsolationState(p => ({ ...p, [agent.id]: !p[agent.id] }))}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                                            style={{
                                                background: isolationState[agent.id] ? '#1E3A5F' : '#374151',
                                                color: isolationState[agent.id] ? '#93C5FD' : '#9CA3AF',
                                            }}>
                                            {isolationState[agent.id]
                                                ? <><WifiOff size={12} />Isolated</>
                                                : <><Wifi size={12} />Isolate</>}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* AI Agents grid */}
            {view === 'ai' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {aiAgents.map(agent => (
                        <div key={agent.id} className="rounded-lg border p-5 transition-all hover:border-blue-500/40"
                            style={{ background: '#1F2937', borderColor: '#374151' }}>
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ background: '#1E3A5F' }}>
                                        <Cpu size={16} style={{ color: '#3B82F6' }} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{agent.name}</h3>
                                        <span className="text-xs font-medium" style={{ color: isEnabled(agent) ? '#10B981' : '#6B7280' }}>
                                            ● {isEnabled(agent) ? 'Online' : 'Disabled'}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={() => setAiEnabled(p => ({ ...p, [agent.id]: !isEnabled(agent) }))}>
                                    {isEnabled(agent)
                                        ? <ToggleRight size={22} style={{ color: '#10B981' }} />
                                        : <ToggleLeft size={22} style={{ color: '#6B7280' }} />}
                                </button>
                            </div>
                            <p className="text-xs mb-3" style={{ color: '#6B7280' }}>{agent.desc}</p>
                            <div className="p-2 rounded-md mb-3" style={{ background: '#111827' }}>
                                <div className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{agent.metric}</div>
                                <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Last: {agent.last}</div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setSelectedAI(agent)}
                                    className="flex-1 py-1.5 text-xs rounded-md font-medium"
                                    style={{ background: '#3B82F6', color: 'white' }}>
                                    View Details
                                </button>
                                <button onClick={() => setSelectedAI(agent)}
                                    className="px-3 py-1.5 text-xs rounded-md"
                                    style={{ background: '#374151', color: '#9CA3AF' }}>
                                    <Settings size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* AI Agent detail drawer */}
            {selectedAI && (
                <div className="fixed inset-0 z-50 flex justify-end"
                    style={{ background: 'rgba(0,0,0,0.6)' }}
                    onClick={() => setSelectedAI(null)}>
                    <div className="h-full overflow-y-auto"
                        style={{ background: '#1F2937', width: '480px', borderLeft: '1px solid #374151' }}
                        onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                                        style={{ background: '#1E3A5F' }}>
                                        <Cpu size={20} style={{ color: '#3B82F6' }} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold" style={{ color: '#F9FAFB' }}>{selectedAI.name}</h2>
                                        <span className="text-xs" style={{ color: '#10B981' }}>● Online</span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedAI(null)}
                                    className="p-2 rounded-md hover:bg-white/10" style={{ color: '#9CA3AF' }}>
                                    <X size={18} />
                                </button>
                            </div>
                            <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>{selectedAI.desc}</p>
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold mb-3" style={{ color: '#F9FAFB' }}>Autonomy Level</h3>
                                <div className="flex items-center gap-3">
                                    <input type="range" min="0" max="100"
                                        value={getAutonomy(selectedAI)}
                                        onChange={e => setAutonomyLevels(p => ({ ...p, [selectedAI.id]: Number(e.target.value) }))}
                                        className="flex-1" style={{ accentColor: '#3B82F6' }} />
                                    <span className="text-lg font-bold" style={{ color: '#3B82F6' }}>{getAutonomy(selectedAI)}%</span>
                                </div>
                                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Higher = more autonomous actions without human review</p>
                            </div>
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold mb-3" style={{ color: '#F9FAFB' }}>Performance</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Uptime', value: '99.9%', color: '#10B981' },
                                        { label: 'Avg latency', value: '12ms', color: '#10B981' },
                                        { label: 'Queue depth', value: '0', color: '#10B981' },
                                        { label: 'Actions today', value: selectedAI.metric.split(' ')[0], color: '#3B82F6' },
                                    ].map(m => (
                                        <div key={m.label} className="p-3 rounded-lg" style={{ background: '#111827' }}>
                                            <div className="text-xs" style={{ color: '#6B7280' }}>{m.label}</div>
                                            <div className="text-lg font-bold mt-0.5" style={{ color: m.color }}>{m.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold mb-3" style={{ color: '#F9FAFB' }}>Recent Activity</h3>
                                <div className="space-y-2">
                                    {selectedAI.logs.map((log, i) => (
                                        <div key={i} className="text-xs p-2 rounded"
                                            style={{ background: '#111827', color: '#9CA3AF' }}>{log}</div>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={() => setAiEnabled(p => ({ ...p, [selectedAI.id]: !isEnabled(selectedAI) }))}
                                className="w-full py-2 text-sm rounded-md font-medium"
                                style={{ background: isEnabled(selectedAI) ? '#7F1D1D' : '#064E3B', color: isEnabled(selectedAI) ? '#FCA5A5' : '#10B981' }}>
                                {isEnabled(selectedAI) ? 'Disable Agent' : 'Enable Agent'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}