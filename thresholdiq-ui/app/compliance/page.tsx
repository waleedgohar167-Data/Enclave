'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Framework {
    name: string; score: number; gaps: number; color: string; controls: number
    category: 'Privacy' | 'Security' | 'Financial' | 'General'
    lastAudit: string; nextAudit: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const frameworks: Framework[] = [
    { name: 'ISO 27001', score: 97, gaps: 3, color: '#10B981', controls: 114, category: 'Security', lastAudit: 'Jan 2026', nextAudit: 'Jul 2026' },
    { name: 'SOC 2 Type II', score: 94, gaps: 6, color: '#3B82F6', controls: 64, category: 'Security', lastAudit: 'Mar 2026', nextAudit: 'Sep 2026' },
    { name: 'PCI DSS v4.0', score: 89, gaps: 11, color: '#F59E0B', controls: 239, category: 'Financial', lastAudit: 'Feb 2026', nextAudit: 'Aug 2026' },
    { name: 'GDPR Art. 32', score: 98, gaps: 2, color: '#10B981', controls: 42, category: 'Privacy', lastAudit: 'Apr 2026', nextAudit: 'Oct 2026' },
    { name: 'HIPAA', score: 92, gaps: 7, color: '#3B82F6', controls: 75, category: 'Privacy', lastAudit: 'Mar 2026', nextAudit: 'Sep 2026' },
    { name: 'CIS Controls', score: 91, gaps: 8, color: '#3B82F6', controls: 153, category: 'Security', lastAudit: 'Apr 2026', nextAudit: 'Oct 2026' },
    { name: 'NIST CSF 2.0', score: 93, gaps: 5, color: '#10B981', controls: 106, category: 'General', lastAudit: 'Jan 2026', nextAudit: 'Jul 2026' },
    { name: 'DORA', score: 85, gaps: 14, color: '#F59E0B', controls: 89, category: 'Financial', lastAudit: 'Feb 2026', nextAudit: 'Aug 2026' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function GaugeRing({ score, color, size = 80 }: { score: number; color: string; size?: number }) {
    const r = (size / 2) - 8
    const circ = 2 * Math.PI * r
    return (
        <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#374151" strokeWidth="7" />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="7"
                strokeLinecap="round" strokeDasharray={`${(score / 100) * circ} ${circ}`} />
        </svg>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompliancePage() {
    const [selected, setSelected] = useState<string | null>(null)
    const [categoryFilter, setCategoryFilter] = useState<string>('All')

    const categories = ['All', ...Array.from(new Set(frameworks.map(f => f.category)))]
    const filtered = categoryFilter === 'All' ? frameworks : frameworks.filter(f => f.category === categoryFilter)

    const overall = Math.round(frameworks.reduce((s, f) => s + f.score, 0) / frameworks.length)

    return (
        <div className="p-6 space-y-5">
            {/* Overall banner */}
            <div className="p-4 rounded-lg border-l-4"
                style={{ background: '#1F2937', borderColor: '#3B82F6', border: '1px solid #374151', borderLeft: '4px solid #3B82F6' }}>
                <div className="flex items-center justify-between">
                    <p className="text-sm" style={{ color: '#F9FAFB' }}>
                        Overall compliance:{' '}
                        <strong style={{ color: '#10B981' }}>{overall}%</strong> across {frameworks.length} frameworks.
                        Guardian agent is continuously monitoring all controls.
                    </p>
                    <div className="text-right flex-shrink-0 ml-4">
                        <div className="text-3xl font-bold" style={{ color: '#10B981' }}>{overall}%</div>
                        <div className="text-xs" style={{ color: '#6B7280' }}>Avg score</div>
                    </div>
                </div>
            </div>

            {/* Category filter */}
            <div className="flex gap-1 flex-wrap">
                {categories.map(c => (
                    <button key={c} onClick={() => setCategoryFilter(c)}
                        className="px-3 py-1.5 text-xs font-medium rounded-md transition-all"
                        style={{ background: categoryFilter === c ? '#3B82F6' : '#1F2937', color: categoryFilter === c ? 'white' : '#9CA3AF', border: '1px solid', borderColor: categoryFilter === c ? '#3B82F6' : '#374151' }}>
                        {c}
                    </button>
                ))}
            </div>

            {/* Framework cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {filtered.map(f => (
                    <div key={f.name}
                        className="rounded-lg border p-5 cursor-pointer transition-all hover:border-blue-500/40"
                        style={{ background: '#1F2937', borderColor: selected === f.name ? '#3B82F6' : '#374151' }}
                        onClick={() => setSelected(selected === f.name ? null : f.name)}>
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{f.name}</h3>
                                <span className="text-xs px-1.5 py-0.5 rounded mt-1 inline-block"
                                    style={{ background: '#374151', color: '#9CA3AF' }}>{f.category}</span>
                            </div>
                            <div className="relative">
                                <GaugeRing score={f.score} color={f.color} size={60} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-sm font-bold" style={{ color: f.color }}>{f.score}</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-1.5 rounded-full mb-3" style={{ background: '#374151' }}>
                            <div className="h-full rounded-full transition-all"
                                style={{ width: `${f.score}%`, background: f.color }} />
                        </div>
                        <div className="flex justify-between text-xs mb-2" style={{ color: '#6B7280' }}>
                            <span>{f.controls} controls</span>
                            <span style={{ color: f.gaps > 8 ? '#F59E0B' : '#10B981' }}>{f.gaps} gaps</span>
                        </div>
                        {selected === f.name && (
                            <div className="mt-3 pt-3 border-t space-y-1.5" style={{ borderColor: '#374151' }}>
                                {[['Last audit', f.lastAudit], ['Next audit', f.nextAudit]].map(([k, v]) => (
                                    <div key={k} className="flex justify-between text-xs">
                                        <span style={{ color: '#6B7280' }}>{k}</span>
                                        <span style={{ color: '#9CA3AF' }}>{v}</span>
                                    </div>
                                ))}
                                <Link href="/audit" className="mt-2 block text-xs" style={{ color: '#3B82F6' }}>
                                    View gaps in Audit Engine →
                                </Link>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Comparison table */}
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#374151' }}>
                <div className="px-5 py-4 border-b" style={{ background: '#1F2937', borderColor: '#374151' }}>
                    <h2 className="text-base font-semibold" style={{ color: '#F9FAFB' }}>Framework Comparison</h2>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr style={{ background: '#111827' }}>
                            {['Framework', 'Score', 'Gaps', 'Controls', 'Next Audit', 'Health'].map(h => (
                                <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                                    style={{ color: '#6B7280', borderBottom: '1px solid #374151' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {frameworks.map((f, i) => (
                            <tr key={f.name} className="hover:bg-white/5"
                                style={{ background: i % 2 === 0 ? '#1F2937' : '#111827', borderBottom: '1px solid #374151' }}>
                                <td className="px-5 py-3 font-medium" style={{ color: '#F9FAFB' }}>{f.name}</td>
                                <td className="px-5 py-3 font-bold" style={{ color: f.color }}>{f.score}%</td>
                                <td className="px-5 py-3" style={{ color: f.gaps > 8 ? '#F59E0B' : '#10B981' }}>{f.gaps}</td>
                                <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{f.controls}</td>
                                <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{f.nextAudit}</td>
                                <td className="px-5 py-3">
                                    <div className="w-24 h-1.5 rounded-full" style={{ background: '#374151' }}>
                                        <div className="h-full rounded-full" style={{ width: `${f.score}%`, background: f.color }} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}