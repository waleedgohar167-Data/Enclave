'use client'

import { useState } from 'react'
import { Shield, AlertTriangle, Globe, Hash, Cpu } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface IntelFeed {
  name: string; type: string; status: 'Active' | 'Stale'; lastUpdate: string; indicators: string
}
interface MaliciousIP { ip: string; country: string; category: string; confidence: number; firstSeen: string }
interface BlacklistedHash { hash: string; malware: string; severity: string; campaigns: string }
interface MitreTag { id: string; name: string; tactic: string; relevance: 'High' | 'Medium' | 'Low' }

// ─── Data ─────────────────────────────────────────────────────────────────────

const feeds: IntelFeed[] = [
  { name: 'MITRE ATT&CK', type: 'Framework', status: 'Active', lastUpdate: '2 hours ago', indicators: '—' },
  { name: 'AlienVault OTX', type: 'IOC Feed', status: 'Active', lastUpdate: '15 min ago', indicators: '4,821' },
  { name: 'Shodan Monitor', type: 'External Exposure', status: 'Active', lastUpdate: '1 hour ago', indicators: '3' },
  { name: 'CIRCL CVE', type: 'Vulnerability', status: 'Active', lastUpdate: '4 hours ago', indicators: '12,440' },
  { name: 'Spamhaus', type: 'IP Reputation', status: 'Active', lastUpdate: '30 min ago', indicators: '892,441' },
  { name: 'PhishTank', type: 'Phishing URLs', status: 'Active', lastUpdate: '1 hour ago', indicators: '22,891' },
  { name: 'CISA Alerts', type: 'Government Advisory', status: 'Active', lastUpdate: '6 hours ago', indicators: '12' },
  { name: 'VirusTotal', type: 'File Hash Intel', status: 'Active', lastUpdate: '5 min ago', indicators: '2.1M+' },
]

const maliciousIPs: MaliciousIP[] = [
  { ip: '185.234.219.x', country: 'RU', category: 'C2 Server', confidence: 97, firstSeen: '3 days ago' },
  { ip: '45.134.26.x', country: 'CN', category: 'Brute Force', confidence: 88, firstSeen: '1 week ago' },
  { ip: '194.165.16.x', country: 'IR', category: 'Ransomware', confidence: 94, firstSeen: '2 days ago' },
  { ip: '91.215.153.x', country: 'UA', category: 'Phishing', confidence: 79, firstSeen: '5 days ago' },
]

const blacklistedHashes: BlacklistedHash[] = [
  { hash: 'a3f2c1d9e4b7…9c4e', malware: 'LockBit 3.0', severity: 'Critical', campaigns: 'FinServCo sector campaign 2024' },
  { hash: 'b7d108f3a91c…2a8f', malware: 'Cobalt Strike', severity: 'High', campaigns: 'APT29 attributed' },
  { hash: 'c9e4f2a71b3d…5b1a', malware: 'Mimikatz v2.2', severity: 'High', campaigns: 'Generic credential theft' },
]

const mitreTags: MitreTag[] = [
  { id: 'T1078', name: 'Valid Accounts', tactic: 'Initial Access', relevance: 'High' },
  { id: 'T1110', name: 'Brute Force', tactic: 'Credential Access', relevance: 'High' },
  { id: 'T1071', name: 'Application Layer Proto', tactic: 'C&C', relevance: 'Medium' },
  { id: 'T1486', name: 'Data Encrypted', tactic: 'Impact', relevance: 'Medium' },
  { id: 'T1055', name: 'Process Injection', tactic: 'Defense Evasion', relevance: 'Low' },
  { id: 'T1059', name: 'Command-Line Interface', tactic: 'Execution', relevance: 'Low' },
]

const TABS = ['Feed Overview', 'Active IOCs', 'MITRE ATT&CK', 'Ransomware Tracker'] as const
type IntelTab = typeof TABS[number]

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConfBar({ value }: { value: number }) {
  const c = value >= 90 ? '#EF4444' : value >= 75 ? '#F59E0B' : '#3B82F6'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full" style={{ background: '#374151' }}>
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: c }} />
      </div>
      <span className="text-xs font-medium" style={{ color: c }}>{value}%</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ThreatIntelPage() {
  const [activeTab, setActiveTab] = useState<IntelTab>('Feed Overview')
  const [search, setSearch] = useState('')

  const filteredFeeds = feeds.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.type.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-5">
      {/* Summary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Feeds', value: '47', color: '#10B981', icon: Globe },
          { label: 'IOCs Today', value: '0 new', color: '#10B981', icon: Shield },
          { label: 'Threat Level', value: 'LOW', color: '#10B981', icon: AlertTriangle },
          { label: 'Last Update', value: '5 min ago', color: '#9CA3AF', icon: Cpu },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="p-4 rounded-lg border"
            style={{ background: '#1F2937', borderColor: '#374151' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>{label}</span>
              <Icon size={14} style={{ color: '#374151' }} />
            </div>
            <div className="text-2xl font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-md text-sm font-medium transition-all"
            style={{ background: activeTab === tab ? '#3B82F6' : '#1F2937', color: activeTab === tab ? 'white' : '#9CA3AF', border: '1px solid', borderColor: activeTab === tab ? '#3B82F6' : '#374151' }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Feed Overview */}
      {activeTab === 'Feed Overview' && (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#374151' }}>
          <div className="px-5 py-4 border-b flex items-center justify-between"
            style={{ background: '#1F2937', borderColor: '#374151' }}>
            <h2 className="text-base font-semibold" style={{ color: '#F9FAFB' }}>Active Intelligence Feeds</h2>
            <input type="text" placeholder="Search feeds…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-3 py-1.5 rounded-md text-xs outline-none"
              style={{ background: '#111827', border: '1px solid #374151', color: '#F9FAFB', minWidth: '160px' }} />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#111827' }}>
                {['Feed Name', 'Type', 'Status', 'Last Update', 'Indicators'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#6B7280', borderBottom: '1px solid #374151' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredFeeds.map((f, i) => (
                <tr key={f.name} className="hover:bg-white/5 cursor-pointer"
                  style={{ background: i % 2 === 0 ? '#1F2937' : '#111827', borderBottom: '1px solid #374151' }}>
                  <td className="px-5 py-3 font-medium" style={{ color: '#F9FAFB' }}>{f.name}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-0.5 rounded"
                      style={{ background: '#1F2937', color: '#9CA3AF', border: '1px solid #374151' }}>{f.type}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-medium" style={{ color: '#10B981' }}>● Active</span>
                  </td>
                  <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{f.lastUpdate}</td>
                  <td className="px-5 py-3 font-mono text-xs" style={{ color: '#9CA3AF' }}>{f.indicators}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Active IOCs */}
      {activeTab === 'Active IOCs' && (
        <div className="space-y-4">
          {/* Malicious IPs */}
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#374151' }}>
            <div className="px-5 py-3 border-b flex items-center gap-2"
              style={{ background: '#1F2937', borderColor: '#374151' }}>
              <Globe size={14} style={{ color: '#EF4444' }} />
              <h3 className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Active Malicious IPs</h3>
              <span className="text-xs px-2 py-0.5 rounded-full ml-auto"
                style={{ background: '#7F1D1D', color: '#FCA5A5' }}>{maliciousIPs.length} tracked</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#111827' }}>
                  {['IP Address', 'Country', 'Category', 'Confidence', 'First Seen'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#6B7280', borderBottom: '1px solid #374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {maliciousIPs.map((ip, i) => (
                  <tr key={ip.ip} style={{ background: i % 2 === 0 ? '#1F2937' : '#111827', borderBottom: '1px solid #374151' }}>
                    <td className="px-4 py-2.5 font-mono text-xs" style={{ color: '#EF4444' }}>{ip.ip}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs px-1.5 py-0.5 rounded font-mono"
                        style={{ background: '#374151', color: '#9CA3AF' }}>{ip.country}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: '#F9FAFB' }}>{ip.category}</td>
                    <td className="px-4 py-2.5"><ConfBar value={ip.confidence} /></td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: '#6B7280' }}>{ip.firstSeen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Blacklisted hashes */}
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#374151' }}>
            <div className="px-5 py-3 border-b flex items-center gap-2"
              style={{ background: '#1F2937', borderColor: '#374151' }}>
              <Hash size={14} style={{ color: '#F59E0B' }} />
              <h3 className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Blacklisted File Hashes</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#111827' }}>
                  {['Hash (truncated)', 'Malware Family', 'Severity', 'Campaign'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#6B7280', borderBottom: '1px solid #374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {blacklistedHashes.map((h, i) => (
                  <tr key={h.hash} style={{ background: i % 2 === 0 ? '#1F2937' : '#111827', borderBottom: '1px solid #374151' }}>
                    <td className="px-4 py-2.5 font-mono text-xs" style={{ color: '#9CA3AF' }}>{h.hash}</td>
                    <td className="px-4 py-2.5 text-xs font-medium" style={{ color: '#F9FAFB' }}>{h.malware}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: h.severity === 'Critical' ? '#7F1D1D' : '#78350F', color: h.severity === 'Critical' ? '#FCA5A5' : '#FCD34D' }}>
                        {h.severity}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: '#9CA3AF' }}>{h.campaigns}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MITRE ATT&CK */}
      {activeTab === 'MITRE ATT&CK' && (
        <div>
          <div className="mb-3 p-3 rounded-lg border-l-4"
            style={{ background: '#1F2937', borderColor: '#3B82F6', border: '1px solid #374151', borderLeft: '4px solid #3B82F6' }}>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>
              Techniques mapped based on recent threat intelligence and active investigations in your environment.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {mitreTags.map(t => (
              <div key={t.id} className="p-4 rounded-lg border"
                style={{ background: '#1F2937', borderColor: '#374151' }}>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-mono px-2 py-1 rounded font-semibold"
                    style={{ background: '#1E3A5F', color: '#93C5FD' }}>{t.id}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: t.relevance === 'High' ? '#7F1D1D' : t.relevance === 'Medium' ? '#78350F' : '#1F2937',
                      color: t.relevance === 'High' ? '#FCA5A5' : t.relevance === 'Medium' ? '#FCD34D' : '#9CA3AF',
                    }}>
                    {t.relevance} relevance
                  </span>
                </div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: '#F9FAFB' }}>{t.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded"
                  style={{ background: '#374151', color: '#9CA3AF' }}>{t.tactic}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ransomware Tracker */}
      {activeTab === 'Ransomware Tracker' && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg border-l-4"
            style={{ background: '#1F2937', borderColor: '#EF4444', border: '1px solid #374151', borderLeft: '4px solid #EF4444' }}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={16} style={{ color: '#EF4444' }} />
              <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Active Ransomware Campaign Alert</span>
            </div>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>
              <strong style={{ color: '#EF4444' }}>LockBit 3.0</strong> is actively targeting financial services organisations in the UK.
              12 confirmed victims this month. Your sector is at elevated risk.
            </p>
          </div>
          {[
            { name: 'LockBit 3.0', sector: 'Financial Services', activity: 'High', ttps: ['T1078', 'T1486', 'T1071'], lastSeen: '2 days ago' },
            { name: 'BlackCat/ALPHV', sector: 'Healthcare', activity: 'Medium', ttps: ['T1110', 'T1055'], lastSeen: '1 week ago' },
            { name: 'Cl0p', sector: 'All sectors', activity: 'Medium', ttps: ['T1059', 'T1486'], lastSeen: '3 days ago' },
          ].map(c => (
            <div key={c.name} className="p-4 rounded-lg border"
              style={{ background: '#1F2937', borderColor: '#374151' }}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{c.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: c.activity === 'High' ? '#7F1D1D' : '#78350F', color: c.activity === 'High' ? '#FCA5A5' : '#FCD34D' }}>
                  {c.activity} activity
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs mb-2" style={{ color: '#6B7280' }}>
                <span>Target sector: <span style={{ color: '#9CA3AF' }}>{c.sector}</span></span>
                <span>Last seen: <span style={{ color: '#9CA3AF' }}>{c.lastSeen}</span></span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {c.ttps.map(t => (
                  <span key={t} className="text-xs font-mono px-2 py-0.5 rounded"
                    style={{ background: '#1E3A5F', color: '#93C5FD' }}>{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Environment status */}
      <div className="p-4 rounded-lg border" style={{ background: '#1F2937', borderColor: '#374151' }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10B981' }} />
          <h3 className="font-semibold text-sm" style={{ color: '#F9FAFB' }}>Environment Threat Status</h3>
        </div>
        <p className="text-sm" style={{ color: '#9CA3AF' }}>
          Oracle has checked 47 active feeds against your environment.{' '}
          <strong style={{ color: '#10B981' }}>No new IOCs</strong> match your assets today.
          Last full scan: 5 minutes ago.
        </p>
      </div>
    </div>
  )
}