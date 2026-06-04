'use client'

import { useState } from 'react'
import { Download, Eye, TrendingUp } from 'lucide-react'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Report {
    name: string; type: string; generated: string; size: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const recentReports: Report[] = [
    { name: 'CISO Operations Report — Week 20', type: 'CISO', generated: 'Today 08:00', size: '2.4 MB' },
    { name: 'Threat Intelligence Briefing', type: 'Intel', generated: 'Yesterday 18:00', size: '1.1 MB' },
    { name: 'Monthly Compliance Summary — April', type: 'Compliance', generated: '2 days ago', size: '4.7 MB' },
    { name: 'Incident Summary — Cases #2845–#2850', type: 'Incident', generated: '3 days ago', size: '0.9 MB' },
    { name: 'Board Security Briefing — April 2026', type: 'Board', generated: '2 weeks ago', size: '3.2 MB' },
    { name: 'ISO 27001 Surveillance Audit Package', type: 'Audit', generated: '2 weeks ago', size: '8.1 MB' },
]

const incidentFreqData = [
    { month: 'Nov', total: 14, high: 3 },
    { month: 'Dec', total: 11, high: 2 },
    { month: 'Jan', total: 18, high: 5 },
    { month: 'Feb', total: 9, high: 1 },
    { month: 'Mar', total: 13, high: 4 },
    { month: 'Apr', total: 7, high: 2 },
    { month: 'May', total: 6, high: 1 },
]

const uptimeData = [
    { day: 'Mon', uptime: 100 }, { day: 'Tue', uptime: 99.9 }, { day: 'Wed', uptime: 100 },
    { day: 'Thu', uptime: 100 }, { day: 'Fri', uptime: 99.7 }, { day: 'Sat', uptime: 100 }, { day: 'Sun', uptime: 100 },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="rounded-lg border p-3 text-xs" style={{ background: '#1F2937', borderColor: '#374151' }}>
            <p className="font-semibold mb-1" style={{ color: '#F9FAFB' }}>{label}</p>
            {payload.map((p: any, i: number) => (
                <div key={i} className="flex gap-2">
                    <span style={{ color: '#9CA3AF' }}>{p.name}:</span>
                    <span style={{ color: '#F9FAFB' }}>{p.value}</span>
                </div>
            ))}
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
    const [reportType, setReportType] = useState('Board Security Briefing (monthly)')
    const [generating, setGenerating] = useState(false)
    const [generated, setGenerated] = useState<string | null>(null)
    const [downloaded, setDownloaded] = useState<Record<string, boolean>>({})

    const handleGenerate = () => {
        setGenerating(true)
        setTimeout(() => { setGenerating(false); setGenerated(reportType) }, 2000)
    }

    return (
        <div className="p-6 space-y-5">
            {/* Summary widgets */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Reports Generated', value: '47', sub: 'This month', color: '#3B82F6' },
                    { label: 'Incidents (MTD)', value: '6', sub: '↓ vs last month', color: '#10B981' },
                    { label: 'Avg Response Time', value: '2.1h', sub: 'High severity', color: '#F9FAFB' },
                    { label: 'System Uptime', value: '99.9%', sub: 'Last 7 days', color: '#10B981' },
                ].map(m => (
                    <div key={m.label} className="p-4 rounded-lg border"
                        style={{ background: '#1F2937', borderColor: '#374151' }}>
                        <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>{m.label}</div>
                        <div className="text-3xl font-bold" style={{ color: m.color }}>{m.value}</div>
                        <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{m.sub}</div>
                    </div>
                ))}
            </div>

            {/* Generate report */}
            <div className="rounded-lg border p-5" style={{ background: '#1F2937', borderColor: '#374151' }}>
                <h2 className="text-base font-semibold mb-4" style={{ color: '#F9FAFB' }}>Generate Report</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="text-xs font-medium block mb-1" style={{ color: '#6B7280' }}>Report Type</label>
                        <select value={reportType} onChange={e => setReportType(e.target.value)}
                            className="w-full px-3 py-2 rounded-md text-sm"
                            style={{ background: '#111827', border: '1px solid #374151', color: '#F9FAFB' }}>
                            {['Board Security Briefing (monthly)', 'CISO Operations Report (weekly)', 'Incident Summary', 'Threat Intelligence Briefing', 'Compliance Status Report', 'ROI Report', 'Full Audit Package'].map(t => (
                                <option key={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium block mb-1" style={{ color: '#6B7280' }}>Date Range</label>
                        <select className="w-full px-3 py-2 rounded-md text-sm"
                            style={{ background: '#111827', border: '1px solid #374151', color: '#F9FAFB' }}>
                            {['Last 30 days', 'Last 7 days', 'Last 90 days', 'Custom range'].map(o => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button onClick={handleGenerate} disabled={generating}
                            className="w-full px-4 py-2 text-sm rounded-md font-medium"
                            style={{ background: generating ? '#1E3A5F' : '#3B82F6', color: 'white', opacity: generating ? 0.8 : 1 }}>
                            {generating ? 'Generating…' : 'Generate Report'}
                        </button>
                    </div>
                </div>
                {generated && (
                    <div className="flex items-center justify-between p-3 rounded-lg border"
                        style={{ background: '#111827', borderColor: '#10B981' }}>
                        <div>
                            <p className="text-sm font-medium" style={{ color: '#10B981' }}>✓ Report ready: {generated}</p>
                            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Formats: PDF · CSV · JSON</p>
                        </div>
                        <button onClick={() => setDownloaded(p => ({ ...p, [generated]: true }))}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-md font-medium"
                            style={{ background: downloaded[generated] ? '#064E3B' : '#3B82F6', color: 'white' }}>
                            <Download size={12} />{downloaded[generated] ? 'Downloaded ✓' : 'Download'}
                        </button>
                    </div>
                )}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Incident frequency */}
                <div className="rounded-lg border p-5" style={{ background: '#1F2937', borderColor: '#374151' }}>
                    <h3 className="text-sm font-semibold mb-4" style={{ color: '#F9FAFB' }}>Incident Frequency — 7 Months</h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={incidentFreqData} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={{ stroke: '#374151' }} />
                            <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={{ stroke: '#374151' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="total" fill="#1E3A5F" name="Total incidents" radius={[2, 2, 0, 0]} />
                            <Bar dataKey="high" fill="#EF4444" name="High severity" radius={[2, 2, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* System uptime */}
                <div className="rounded-lg border p-5" style={{ background: '#1F2937', borderColor: '#374151' }}>
                    <h3 className="text-sm font-semibold mb-4" style={{ color: '#F9FAFB' }}>System Uptime — Last 7 Days</h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={uptimeData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="day" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={{ stroke: '#374151' }} />
                            <YAxis domain={[99, 100.1]} tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={{ stroke: '#374151' }} tickFormatter={v => `${v}%`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="uptime" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 3 }} name="Uptime %" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent reports table */}
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#374151' }}>
                <div className="px-5 py-4 border-b" style={{ background: '#1F2937', borderColor: '#374151' }}>
                    <h2 className="text-base font-semibold" style={{ color: '#F9FAFB' }}>Recent Reports</h2>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr style={{ background: '#111827' }}>
                            {['Report', 'Type', 'Generated', 'Size', 'Actions'].map(h => (
                                <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                                    style={{ color: '#6B7280', borderBottom: '1px solid #374151' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {recentReports.map((r, i) => (
                            <tr key={r.name} className="hover:bg-white/5"
                                style={{ background: i % 2 === 0 ? '#1F2937' : '#111827', borderBottom: '1px solid #374151' }}>
                                <td className="px-5 py-3 font-medium" style={{ color: '#F9FAFB' }}>{r.name}</td>
                                <td className="px-5 py-3">
                                    <span className="text-xs px-2 py-0.5 rounded"
                                        style={{ background: '#374151', color: '#9CA3AF', border: '1px solid #374151' }}>{r.type}</span>
                                </td>
                                <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{r.generated}</td>
                                <td className="px-5 py-3" style={{ color: '#6B7280' }}>{r.size}</td>
                                <td className="px-5 py-3">
                                    <div className="flex gap-2">
                                        <button onClick={() => setDownloaded(p => ({ ...p, [r.name]: true }))}
                                            className="flex items-center gap-1 px-3 py-1 text-xs rounded-md"
                                            style={{ background: downloaded[r.name] ? '#064E3B' : '#374151', color: downloaded[r.name] ? '#10B981' : '#9CA3AF' }}>
                                            <Download size={11} />{downloaded[r.name] ? 'Downloaded' : 'Download'}
                                        </button>
                                        <button className="flex items-center gap-1 px-3 py-1 text-xs rounded-md"
                                            style={{ background: '#1E3A5F', color: '#93C5FD' }}>
                                            <Eye size={11} />View
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ROI widget */}
            <div className="rounded-lg border p-5" style={{ background: '#1F2937', borderColor: '#374151' }}>
                <div className="flex items-start justify-between mb-5">
                    <div>
                        <h2 className="text-base font-semibold" style={{ color: '#F9FAFB' }}>ThresholdIQ ROI — Last 30 Days</h2>
                        <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>FinServCo · Financial Services</p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold" style={{ color: '#10B981' }}>29,287%</div>
                        <div className="text-xs" style={{ color: '#6B7280' }}>Return on investment</div>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4 p-4 rounded-lg mb-4" style={{ background: '#111827' }}>
                    {[['ThresholdIQ cost', '£799', '#9CA3AF'], ['Total value delivered', '£234,000+', '#10B981'], ['ROI', '29,287%', '#10B981']].map(([label, val, color]) => (
                        <div key={label} className="text-center">
                            <div className="text-xs mb-1" style={{ color: '#6B7280' }}>{label}</div>
                            <div className="text-xl font-bold" style={{ color }}>{val}</div>
                        </div>
                    ))}
                </div>
                <button className="w-full py-3 text-sm font-semibold rounded-md"
                    style={{ background: '#3B82F6', color: 'white' }}>
                    Generate Board Report
                </button>
            </div>
        </div>
    )
}