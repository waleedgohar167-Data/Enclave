'use client'

import { useState } from 'react'
import { Download, CheckCircle, Play, Copy } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditLogEntry {
  timestamp: string; user: string; process: string; action: string
  target: string; result: 'Success' | 'Failure' | 'Blocked'
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info'
  ipAddress: string
}

interface ComplianceCard { name: string; score: number; gaps: number; color: string }
interface ComplianceGap { id: string; name: string; autofix: string }
interface AuditReport { name: string; generated: string; coverage: string }

// ─── Data ─────────────────────────────────────────────────────────────────────

const auditLogs: AuditLogEntry[] = [
  { timestamp: '2026-06-04 14:47:02', user: 'sarah.chen', process: 'explorer.exe', action: 'FILE_MODIFY', target: '/fin/payroll/Q2.xlsx', result: 'Success', riskLevel: 'High', ipAddress: '10.10.1.42' },
  { timestamp: '2026-06-04 14:32:18', user: 'SYSTEM', process: 'crond', action: 'CRON_MODIFY', target: '/etc/cron.d/backup', result: 'Success', riskLevel: 'Critical', ipAddress: '10.10.3.10' },
  { timestamp: '2026-06-04 13:55:44', user: 'david.park', process: 'regedit.exe', action: 'REGISTRY_WRITE', target: 'HKCU\\Software\\MS\\Run', result: 'Success', riskLevel: 'High', ipAddress: '10.10.1.88' },
  { timestamp: '2026-06-04 13:20:10', user: 'james.liu', process: 'psql', action: 'DB_PERMISSION', target: 'pg_hba.conf', result: 'Success', riskLevel: 'Medium', ipAddress: '10.10.2.47' },
  { timestamp: '2026-06-04 12:41:33', user: 'api-gateway', process: 'nginx', action: 'AUTH_SUCCESS', target: '/api/v2/accounts', result: 'Success', riskLevel: 'Low', ipAddress: '82.x.x.x' },
  { timestamp: '2026-06-04 12:10:55', user: 'unknown', process: 'sshd', action: 'AUTH_FAILURE', target: 'SRV-DB-PROD-01:22', result: 'Blocked', riskLevel: 'Critical', ipAddress: '185.234.x.x' },
  { timestamp: '2026-06-04 11:02:09', user: 'maria.santos', process: 'Word', action: 'FILE_READ', target: '/hr/contracts/2026/', result: 'Success', riskLevel: 'Low', ipAddress: '10.10.5.21' },
  { timestamp: '2026-06-04 09:44:55', user: 'SYSTEM', process: 'iptables', action: 'RULE_DELETE', target: 'OUTPUT chain (2 rules)', result: 'Success', riskLevel: 'High', ipAddress: '192.168.0.1' },
  { timestamp: '2026-06-04 08:30:00', user: 'alex.chen', process: 'ThresholdIQ', action: 'CASE_CREATED', target: 'Case #2851', result: 'Success', riskLevel: 'Info', ipAddress: '10.10.1.77' },
  { timestamp: '2026-06-04 08:00:12', user: 'backup-svc', process: 'rsync', action: 'BACKUP_COMPLETE', target: 'DB-PROD-01 → S3/backups/', result: 'Success', riskLevel: 'Info', ipAddress: '10.10.3.10' },
]

const complianceCards: ComplianceCard[] = [
  { name: 'ISO 27001', score: 97, gaps: 3, color: '#10B981' },
  { name: 'SOC 2 II', score: 94, gaps: 6, color: '#3B82F6' },
  { name: 'PCI DSS v4', score: 89, gaps: 11, color: '#F59E0B' },
  { name: 'GDPR Art.32', score: 98, gaps: 2, color: '#10B981' },
]

const isoGaps: ComplianceGap[] = [
  { id: 'A.9.2.6', name: 'Access rights review overdue: 8 service accounts (47 days, policy: 30)', autofix: 'Auto-generate review' },
  { id: 'A.12.6.1', name: 'Vulnerability disclosure process not formally documented', autofix: 'Generate from template' },
  { id: 'A.18.1.3', name: 'GDPR processing records: 2 new data flows not documented', autofix: 'Document now' },
]

const auditReports: AuditReport[] = [
  { name: 'ISO 27001 Surveillance Audit Package', generated: '2 weeks ago', coverage: 'Complete' },
  { name: 'SOC 2 Type II Evidence Package', generated: '1 month ago', coverage: '94%' },
  { name: 'Monthly Compliance Summary', generated: 'Yesterday', coverage: 'Complete' },
]

const TABS = ['Activity Log', 'Compliance Gaps', 'Audit Simulator', 'Reports'] as const
type AuditTab = typeof TABS[number]

// ─── Sub-components ───────────────────────────────────────────────────────────

function RiskBadge({ level }: { level: AuditLogEntry['riskLevel'] }) {
  const map: Record<AuditLogEntry['riskLevel'], { bg: string; text: string }> = {
    Critical: { bg: '#7F1D1D', text: '#FCA5A5' },
    High: { bg: '#78350F', text: '#FCD34D' },
    Medium: { bg: '#1E3A5F', text: '#93C5FD' },
    Low: { bg: '#1F2937', text: '#9CA3AF' },
    Info: { bg: '#111827', text: '#6B7280' },
  }
  const c = map[level]
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: c.bg, color: c.text }}>{level}</span>
  )
}

function ResultBadge({ result }: { result: AuditLogEntry['result'] }) {
  const c = result === 'Success' ? '#10B981' : result === 'Blocked' ? '#93C5FD' : '#EF4444'
  return <span className="text-xs font-medium" style={{ color: c }}>● {result}</span>
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AuditEnginePage() {
  const [activeTab, setActiveTab] = useState<AuditTab>('Activity Log')
  const [riskFilter, setRiskFilter] = useState<string>('All')
  const [search, setSearch] = useState('')
  const [simRunning, setSimRunning] = useState(false)
  const [simDone, setSimDone] = useState(false)
  const [gapFixed, setGapFixed] = useState<Record<string, boolean>>({})
  const [downloaded, setDownloaded] = useState<Record<string, boolean>>({})
  const [copiedHash, setCopiedHash] = useState<string | null>(null)

  const copyHash = (h: string) => { setCopiedHash(h); setTimeout(() => setCopiedHash(null), 2000) }
  const runSim = () => { setSimRunning(true); setTimeout(() => { setSimRunning(false); setSimDone(true) }, 1500) }

  const filtered = auditLogs.filter(e => {
    if (riskFilter !== 'All' && e.riskLevel !== riskFilter) return false
    if (search && ![e.user, e.action, e.target, e.process].some(f => f.toLowerCase().includes(search.toLowerCase()))) return false
    return true
  })

  return (
    <div className="p-6">
      {/* Compliance scorecards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {complianceCards.map(c => (
          <div key={c.name} className="p-4 rounded-lg border"
            style={{ background: '#1F2937', borderColor: '#374151' }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>{c.name}</div>
            <div className="text-3xl font-bold" style={{ color: c.color }}>{c.score}%</div>
            <div className="h-1.5 rounded-full mt-2 mb-1" style={{ background: '#374151' }}>
              <div className="h-full rounded-full" style={{ width: `${c.score}%`, background: c.color }} />
            </div>
            <div className="text-xs" style={{ color: '#9CA3AF' }}>{c.gaps} gap{c.gaps !== 1 ? 's' : ''}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 flex-wrap">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-md text-sm font-medium transition-all"
            style={{ background: activeTab === tab ? '#3B82F6' : '#1F2937', color: activeTab === tab ? 'white' : '#9CA3AF', border: '1px solid', borderColor: activeTab === tab ? '#3B82F6' : '#374151' }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Activity Log */}
      {activeTab === 'Activity Log' && (
        <div>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex gap-1">
              {['All', 'Critical', 'High', 'Medium', 'Low', 'Info'].map(r => (
                <button key={r} onClick={() => setRiskFilter(r)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md"
                  style={{ background: riskFilter === r ? '#3B82F6' : '#1F2937', color: riskFilter === r ? 'white' : '#9CA3AF', border: '1px solid', borderColor: riskFilter === r ? '#3B82F6' : '#374151' }}>
                  {r}
                </button>
              ))}
            </div>
            <input type="text" placeholder="Search user, action, target..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="px-3 py-1.5 rounded-md text-xs outline-none ml-auto"
              style={{ background: '#1F2937', border: '1px solid #374151', color: '#F9FAFB', minWidth: '200px' }} />
          </div>
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#374151' }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: '#111827' }}>
                  {['Timestamp', 'User / Process', 'Event Action', 'Target System', 'Result', 'Risk', 'IP'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#6B7280', borderBottom: '1px solid #374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors"
                    style={{ background: i % 2 === 0 ? '#1F2937' : '#111827', borderBottom: '1px solid #374151' }}>
                    <td className="px-4 py-3 font-mono" style={{ color: '#3B82F6' }}>{entry.timestamp}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium" style={{ color: '#F9FAFB' }}>{entry.user}</div>
                      <div className="font-mono text-xs" style={{ color: '#6B7280' }}>{entry.process}</div>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold" style={{ color: '#F9FAFB' }}>{entry.action}</td>
                    <td className="px-4 py-3 font-mono max-w-xs truncate" style={{ color: '#9CA3AF' }}>{entry.target}</td>
                    <td className="px-4 py-3"><ResultBadge result={entry.result} /></td>
                    <td className="px-4 py-3"><RiskBadge level={entry.riskLevel} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="font-mono" style={{ color: '#6B7280' }}>{entry.ipAddress}</span>
                        <button onClick={() => copyHash(entry.ipAddress)} style={{ color: '#6B7280' }}>
                          {copiedHash === entry.ipAddress ? <CheckCircle size={10} style={{ color: '#10B981' }} /> : <Copy size={10} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Compliance Gaps */}
      {activeTab === 'Compliance Gaps' && (
        <div className="space-y-3">
          <div className="rounded-lg border p-4" style={{ background: '#1F2937', borderColor: '#374151' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold" style={{ color: '#F9FAFB' }}>ISO 27001 Gaps</h3>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#1E3A5F', color: '#93C5FD' }}>3 gaps</span>
            </div>
            <div className="space-y-2">
              {isoGaps.map(gap => (
                <div key={gap.id} className="p-3 rounded-lg flex items-start justify-between gap-3"
                  style={{ background: '#111827' }}>
                  <div className="flex-1">
                    <span className="text-xs font-mono font-semibold" style={{ color: '#3B82F6' }}>{gap.id}</span>
                    <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{gap.name}</p>
                  </div>
                  <button onClick={() => setGapFixed(p => ({ ...p, [gap.id]: true }))}
                    className="px-3 py-1.5 text-xs rounded-md font-medium flex-shrink-0"
                    style={{ background: gapFixed[gap.id] ? '#064E3B' : '#374151', color: gapFixed[gap.id] ? '#10B981' : '#9CA3AF' }}>
                    {gapFixed[gap.id] ? '✓ Fixed' : gap.autofix}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Audit Simulator */}
      {activeTab === 'Audit Simulator' && (
        <div className="rounded-lg border p-5" style={{ background: '#1F2937', borderColor: '#374151' }}>
          <div className="grid grid-cols-2 gap-4 mb-5">
            {[['Framework', ['ISO 27001', 'SOC 2 Type II', 'PCI DSS v4.0']], ['Scope', ['Full audit', 'Scoped review']]].map(([label, opts]) => (
              <div key={label as string}>
                <label className="text-xs font-medium block mb-1" style={{ color: '#6B7280' }}>{label}</label>
                <select className="w-full mt-1 px-3 py-2 rounded-md text-sm"
                  style={{ background: '#111827', border: '1px solid #374151', color: '#F9FAFB' }}>
                  {(opts as string[]).map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <button onClick={runSim} disabled={simRunning}
            className="flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-medium mb-5"
            style={{ background: '#3B82F6', color: 'white', opacity: simRunning ? 0.7 : 1 }}>
            <Play size={16} />{simRunning ? 'Running…' : 'Run Simulation'}
          </button>
          {simDone && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Questions tested', value: '247', color: '#F9FAFB' },
                  { label: 'Fully answerable', value: '241 (97.6%)', color: '#10B981' },
                  { label: 'Gaps found', value: '6', color: '#F59E0B' },
                  { label: 'Critical gaps', value: '1', color: '#EF4444' },
                ].map(s => (
                  <div key={s.label} className="p-3 rounded-lg text-center" style={{ background: '#111827' }}>
                    <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-lg border-l-4" style={{ background: '#111827', borderColor: '#10B981' }}>
                <div className="text-sm font-semibold" style={{ color: '#10B981' }}>Readiness: 97.6%</div>
                <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Estimated outcome: <strong style={{ color: '#10B981' }}>PASS with minor observations</strong></p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reports */}
      {activeTab === 'Reports' && (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#374151' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#111827' }}>
                {['Report', 'Last Generated', 'Coverage', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#6B7280', borderBottom: '1px solid #374151' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {auditReports.map((r, i) => (
                <tr key={r.name} style={{ background: i % 2 === 0 ? '#1F2937' : '#111827', borderBottom: '1px solid #374151' }}>
                  <td className="px-5 py-3 font-medium" style={{ color: '#F9FAFB' }}>{r.name}</td>
                  <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{r.generated}</td>
                  <td className="px-5 py-3" style={{ color: r.coverage === 'Complete' ? '#10B981' : '#F59E0B' }}>{r.coverage}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => setDownloaded(p => ({ ...p, [r.name]: true }))}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium"
                      style={{ background: downloaded[r.name] ? '#064E3B' : '#3B82F6', color: 'white' }}>
                      <Download size={11} />{downloaded[r.name] ? 'Downloaded ✓' : 'Download'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}