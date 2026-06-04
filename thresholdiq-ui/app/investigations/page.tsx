'use client'

import { useState } from 'react'
import { ChevronRight, X } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Investigation {
    id: number
    title: string
    severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL'
    status: string
    analyst: string
    opened: string
    confidence: number
    subject: string
    cve?: string
}

interface AuditEntry {
    time: string
    actor: string
    action: string
}

interface EvidenceItem {
    time: string
    source: string
    desc: string
    raw: string
}

interface Action {
    label: string
    type: 'neutral' | 'warning' | 'high' | 'safe' | 'critical'
    reversible: boolean
    notify: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const investigations: Investigation[] = [
    { id: 2851, title: 'Unusual access pattern — Finance user', severity: 'HIGH', status: 'IN PROGRESS', analyst: 'Alex Chen', opened: '2 hours ago', confidence: 89, subject: 'sarah.chen@company.com', cve: 'CVE-2024-3182' },
    { id: 2850, title: 'New external connection from dev server', severity: 'MEDIUM', status: 'IN PROGRESS', analyst: 'Alex Chen', opened: '5 hours ago', confidence: 72, subject: 'DEV-SRV-04', cve: 'CVE-2024-2891' },
    { id: 2844, title: 'Lateral movement detected — SRV cluster', severity: 'CRITICAL', status: 'UNDER ANALYSIS', analyst: 'Jamie Park', opened: '1 day ago', confidence: 95, subject: 'SRV-DB-PROD-01', cve: 'CVE-2024-4471' },
    { id: 2839, title: 'Phishing attempt — exec mailbox', severity: 'HIGH', status: 'UNDER ANALYSIS', analyst: 'Sarah Miles', opened: '2 days ago', confidence: 80, subject: 'cfo@company.com' },
    { id: 2830, title: 'Scheduled scan activity — IT team', severity: 'LOW', status: 'RESOLVED', analyst: 'System', opened: '3 days ago', confidence: 99, subject: 'IT Operations' },
]

const auditTrail: AuditEntry[] = [
    { time: '14:23', actor: 'Investigator Agent', action: 'Case #2851 created and dossier compiled' },
    { time: '14:25', actor: 'Alex Chen', action: 'Case reviewed — marked as High priority' },
    { time: '14:30', actor: 'Alert Optimizer', action: 'Related events correlated (23 total)' },
    { time: '14:45', actor: 'Alex Chen', action: 'Assigned to self for investigation' },
]

const evidence: EvidenceItem[] = [
    { time: '11:43pm', source: 'Sentinel', desc: 'Login from 82.xx.xx.xx (Manchester)', raw: '{"ip":"82.x.x.x","user":"sarah.chen","geo":"Manchester,UK","risk":0.89}' },
    { time: '11:44pm', source: 'Sentinel', desc: 'Finance DB accessed (normal for role)', raw: '{"db":"fin_prod","user":"sarah.chen","query_type":"SELECT","table":"accounts"}' },
    { time: '11:47pm', source: 'Investigator', desc: 'Payroll table queried (unusual query)', raw: '{"db":"fin_prod","table":"payroll","rows_returned":847,"baseline_avg":12}' },
    { time: '11:52pm', source: 'Sentinel', desc: 'Session ended, no data exported', raw: '{"session_end":true,"data_exfil":false,"session_duration":"9m"}' },
]

const actions: Action[] = [
    { label: 'Verify with user — draft message ready', type: 'neutral', reversible: true, notify: 'sarah.chen@company.com' },
    { label: 'Restrict to known locations — 24 hours', type: 'warning', reversible: true, notify: 'IT Security' },
    { label: 'Escalate to CISO', type: 'high', reversible: false, notify: 'CISO + Security team' },
    { label: 'Close as false positive', type: 'safe', reversible: false, notify: 'Case log only' },
    { label: 'Open full incident', type: 'critical', reversible: false, notify: 'Full incident team' },
]

const TABS = ['Summary', 'Evidence', 'Context', 'Actions', 'Audit Trail'] as const
type Tab = typeof TABS[number]

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ severity, label }: { severity: string; label?: string }) {
    const map: Record<string, { bg: string; text: string }> = {
        critical: { bg: '#7F1D1D', text: '#FCA5A5' },
        high: { bg: '#78350F', text: '#FCD34D' },
        medium: { bg: '#1E3A5F', text: '#93C5FD' },
        low: { bg: '#1F2937', text: '#9CA3AF' },
        'in progress': { bg: '#78350F', text: '#FCD34D' },
        'under analysis': { bg: '#1E3A5F', text: '#93C5FD' },
        resolved: { bg: '#064E3B', text: '#6EE7B7' },
        info: { bg: '#1F2937', text: '#6B7280' },
    }
    const key = severity?.toLowerCase()
    const cfg = map[key] ?? map.info
    return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{ background: cfg.bg, color: cfg.text }}>
            {label ?? severity}
        </span>
    )
}

function ColLabel({ children }: { children: string }) {
    return (
        <span className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: '#6B7280' }}>{children}</span>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InvestigationsPage() {
    const [activeCase, setActiveCase] = useState<Investigation>(investigations[0])
    const [activeTab, setActiveTab] = useState<Tab>('Summary')
    const [actionsDone, setActionsDone] = useState<Record<string, boolean>>({})
    const [evidenceExpanded, setEvidenceExpanded] = useState<Record<number, boolean>>({})

    const doAction = (label: string) => setActionsDone(p => ({ ...p, [label]: true }))

    const typeColors: Record<Action['type'], string> = {
        neutral: '#3B82F6', warning: '#F59E0B', high: '#EF4444', safe: '#10B981', critical: '#EF4444',
    }

    const statusGroups = [
        { label: 'Open Cases', statuses: ['IN PROGRESS'] },
        { label: 'Under Analysis', statuses: ['UNDER ANALYSIS'] },
        { label: 'Resolved', statuses: ['RESOLVED'] },
    ]

    return (
        <div className="p-6 flex gap-4 h-full" style={{ minHeight: 0 }}>
            {/* Left sidebar */}
            <div className="w-72 flex-shrink-0 overflow-y-auto space-y-4" style={{ maxHeight: 'calc(100vh - 80px)' }}>
                {statusGroups.map(group => {
                    const cases = investigations.filter(i => group.statuses.includes(i.status))
                    return (
                        <div key={group.label}>
                            <div className="flex items-center gap-2 mb-2">
                                <ColLabel>{group.label}</ColLabel>
                                <span className="text-xs px-1.5 py-0.5 rounded-full"
                                    style={{ background: '#1F2937', color: '#9CA3AF' }}>{cases.length}</span>
                            </div>
                            {cases.map(inv => (
                                <div
                                    key={inv.id}
                                    className="p-3 rounded-lg border cursor-pointer transition-all mb-1.5"
                                    style={{
                                        background: activeCase?.id === inv.id ? '#1F2937' : '#111827',
                                        borderColor: activeCase?.id === inv.id ? '#3B82F6' : '#374151',
                                    }}
                                    onClick={() => setActiveCase(inv)}
                                >
                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                        <span className="text-xs font-mono" style={{ color: '#6B7280' }}>#{inv.id}</span>
                                        <StatusBadge severity={inv.severity} />
                                        {inv.cve && (
                                            <span className="text-xs font-mono px-1.5 py-0.5 rounded"
                                                style={{ background: '#1E3A5F', color: '#93C5FD' }}>{inv.cve}</span>
                                        )}
                                    </div>
                                    <p className="text-xs font-medium mb-1.5" style={{ color: '#F9FAFB' }}>{inv.title}</p>
                                    <div className="flex justify-between text-xs" style={{ color: '#6B7280' }}>
                                        <span>{inv.analyst}</span><span>{inv.opened}</span>
                                    </div>
                                </div>
                            ))}
                            {cases.length === 0 && (
                                <p className="text-xs px-2" style={{ color: '#4B5563' }}>No cases</p>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Main panel */}
            <div className="flex-1 min-w-0 rounded-lg border overflow-hidden flex flex-col"
                style={{ background: '#1F2937', borderColor: '#374151' }}>
                {/* Header */}
                <div className="px-6 py-4 border-b flex-shrink-0" style={{ borderColor: '#374151' }}>
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                                <h2 className="text-lg font-semibold" style={{ color: '#F9FAFB' }}>Case #{activeCase.id}</h2>
                                <StatusBadge severity={activeCase.severity} />
                                <StatusBadge severity={activeCase.status.toLowerCase()} label={activeCase.status} />
                                {activeCase.cve && (
                                    <span className="text-xs font-mono px-2 py-0.5 rounded"
                                        style={{ background: '#1E3A5F', color: '#93C5FD' }}>{activeCase.cve}</span>
                                )}
                            </div>
                            <p className="text-sm" style={{ color: '#9CA3AF' }}>{activeCase.title}</p>
                        </div>
                        <div className="text-right text-xs flex-shrink-0 ml-4" style={{ color: '#6B7280' }}>
                            <div>Opened {activeCase.opened}</div>
                            <div>Analyst: {activeCase.analyst}</div>
                            <div className="mt-1 font-medium" style={{ color: '#F59E0B' }}>
                                Confidence: {activeCase.confidence}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 px-6 py-3 border-b flex-shrink-0" style={{ borderColor: '#374151' }}>
                    {TABS.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className="px-4 py-1.5 rounded-md text-xs font-medium transition-all"
                            style={{ background: activeTab === tab ? '#3B82F6' : 'transparent', color: activeTab === tab ? 'white' : '#9CA3AF' }}>
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div className="p-6 overflow-y-auto flex-1">

                    {activeTab === 'Summary' && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg" style={{ background: '#111827' }}>
                                <h4 className="text-sm font-semibold mb-2" style={{ color: '#F9FAFB' }}>Plain English Summary</h4>
                                <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>
                                    At <strong style={{ color: '#F9FAFB' }}>11:43pm</strong>, user{' '}
                                    <strong style={{ color: '#3B82F6' }}>{activeCase.subject}</strong> accessed the finance database from an unusual location.
                                    This access deviates significantly from the established 94-day behavioral baseline.
                                </p>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold mb-3" style={{ color: '#F9FAFB' }}>MITRE ATT&CK Mapping</h4>
                                <div className="p-3 rounded-lg border" style={{ background: '#111827', borderColor: '#374151' }}>
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <span className="text-xs font-mono px-2 py-1 rounded"
                                            style={{ background: '#1E3A5F', color: '#93C5FD' }}>T1078</span>
                                        <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>Valid Accounts</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full ml-auto"
                                            style={{ background: '#78350F', color: '#FCD34D' }}>Initial Access</span>
                                    </div>
                                    <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>
                                        Adversaries may obtain and abuse credentials of existing accounts to gain initial access.
                                    </p>
                                    <p className="text-xs font-medium mb-1" style={{ color: '#F9FAFB' }}>Likely next moves:</p>
                                    <ul className="space-y-1">
                                        {['Discovery — enumerate accessible resources', 'Collection — access sensitive documents', 'Exfiltration — transfer data externally'].map((m) => (
                                            <li key={m} className="text-xs flex items-center gap-2" style={{ color: '#9CA3AF' }}>
                                                <ChevronRight size={12} style={{ color: '#F59E0B' }} />{m}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            {/* Threat timeline */}
                            <div>
                                <h4 className="text-sm font-semibold mb-3" style={{ color: '#F9FAFB' }}>Severity Timeline</h4>
                                <div className="flex items-end gap-1 h-16">
                                    {[12, 28, 45, 62, 75, 84, 89].map((v, i) => (
                                        <div key={i} className="flex-1 rounded-t-sm"
                                            style={{ height: `${v}%`, background: v > 70 ? '#EF4444' : v > 40 ? '#F59E0B' : '#3B82F6', opacity: 0.7 + i * 0.04 }} />
                                    ))}
                                </div>
                                <div className="flex justify-between text-xs mt-1" style={{ color: '#6B7280' }}>
                                    <span>T-6h</span><span>Now</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Evidence' && (
                        <div className="space-y-2">
                            {evidence.map((ev, i) => (
                                <div key={i} className="border rounded-lg overflow-hidden" style={{ borderColor: '#374151' }}>
                                    <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/5"
                                        style={{ background: '#111827' }}
                                        onClick={() => setEvidenceExpanded(p => ({ ...p, [i]: !p[i] }))}>
                                        <span className="text-xs font-mono font-semibold" style={{ color: '#3B82F6' }}>{ev.time}</span>
                                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#1F2937', color: '#9CA3AF' }}>{ev.source}</span>
                                        <span className="text-sm flex-1" style={{ color: '#F9FAFB' }}>{ev.desc}</span>
                                        <ChevronRight size={14}
                                            className={`transition-transform ${evidenceExpanded[i] ? 'rotate-90' : ''}`}
                                            style={{ color: '#6B7280' }} />
                                    </div>
                                    {evidenceExpanded[i] && (
                                        <div className="px-3 pb-3" style={{ background: '#111827' }}>
                                            <pre className="text-xs p-2 rounded overflow-auto"
                                                style={{ background: '#0B1120', color: '#10B981' }}>{ev.raw}</pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'Context' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { title: 'User Profile', rows: [['Name', 'Sarah Chen'], ['Role', 'Finance Analyst'], ['Department', 'Finance'], ['Tenure', '2.5 years'], ['Baseline age', '94 days'], ['Risk score (prior)', '12/100']] },
                                    { title: 'HR Context', rows: [['Travel logged', 'None'], ['Annual leave', 'No'], ['Remote work', 'Not requested'], ['Change windows', 'None at 11:43pm'], ['Recent IT tickets', '0']] },
                                ].map(panel => (
                                    <div key={panel.title} className="p-4 rounded-lg" style={{ background: '#111827' }}>
                                        <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>{panel.title}</h4>
                                        {panel.rows.map(([k, v]) => (
                                            <div key={k} className="flex justify-between py-1 text-xs border-b" style={{ borderColor: '#1F2937' }}>
                                                <span style={{ color: '#6B7280' }}>{k}</span>
                                                <span style={{ color: ['None', 'No', 'Not requested'].includes(v as string) ? '#EF4444' : '#F9FAFB' }}>{v}</span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 rounded-lg overflow-x-auto" style={{ background: '#111827' }}>
                                <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>Baseline vs This Session</h4>
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr style={{ color: '#6B7280' }}>
                                            {['Factor', 'Baseline Normal', 'This Session', 'Match'].map(h => (
                                                <th key={h} className="text-left py-2">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            ['Login time', '8am–6pm', '11:43pm', false],
                                            ['Location', 'London Office', 'Manchester (residential)', false],
                                            ['DB access', 'Finance DB', 'Finance DB', true],
                                            ['Table accessed', 'accounts, reports', 'payroll (unusual)', false],
                                            ['Session duration', '45 min avg', '9 minutes', false],
                                        ].map(([factor, baseline, session, match]) => (
                                            <tr key={factor as string} className="border-t" style={{ borderColor: '#1F2937' }}>
                                                <td className="py-2" style={{ color: '#9CA3AF' }}>{factor}</td>
                                                <td className="py-2" style={{ color: '#9CA3AF' }}>{baseline}</td>
                                                <td className="py-2" style={{ color: match ? '#9CA3AF' : '#EF4444' }}>{session}</td>
                                                <td className="py-2">{match ? '✓' : <span style={{ color: '#EF4444' }}>✗</span>}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Actions' && (
                        <div className="space-y-3">
                            {actions.map((action, i) => {
                                const done = actionsDone[action.label]
                                return (
                                    <div key={i} className="p-4 rounded-lg border"
                                        style={{ background: '#111827', borderColor: done ? '#10B981' : '#374151' }}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium mb-1" style={{ color: '#F9FAFB' }}>{action.label}</p>
                                                <div className="flex gap-4 text-xs" style={{ color: '#6B7280' }}>
                                                    <span>Reversible: <span style={{ color: action.reversible ? '#10B981' : '#EF4444' }}>{action.reversible ? 'Yes' : 'No'}</span></span>
                                                    <span>Notifies: {action.notify}</span>
                                                </div>
                                            </div>
                                            <button onClick={() => doAction(action.label)}
                                                className="px-4 py-2 rounded-md text-xs font-medium flex-shrink-0"
                                                style={{ background: done ? '#064E3B' : typeColors[action.type], color: done ? '#10B981' : 'white' }}>
                                                {done ? 'Done ✓' : 'Execute'}
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {activeTab === 'Audit Trail' && (
                        <div className="space-y-2">
                            {auditTrail.map((entry, i) => (
                                <div key={i} className="flex gap-3 p-3 rounded-lg" style={{ background: '#111827' }}>
                                    <span className="text-xs font-mono flex-shrink-0" style={{ color: '#3B82F6' }}>{entry.time}</span>
                                    <div>
                                        <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{entry.actor}</span>
                                        <p className="text-xs" style={{ color: '#F9FAFB' }}>{entry.action}</p>
                                    </div>
                                </div>
                            ))}
                            {Object.keys(actionsDone).map((action, i) => (
                                <div key={`live-${i}`} className="flex gap-3 p-3 rounded-lg" style={{ background: '#111827' }}>
                                    <span className="text-xs font-mono flex-shrink-0" style={{ color: '#10B981' }}>Now</span>
                                    <div>
                                        <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>Alex Chen</span>
                                        <p className="text-xs" style={{ color: '#F9FAFB' }}>{action}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}