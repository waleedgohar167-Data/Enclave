'use client'

import { useState } from 'react'
import { Eye, EyeOff, Copy, CheckCircle, Plus, Trash2 } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiKey {
    id: number; name: string; key: string; created: string; lastUsed: string; permissions: string
}
interface AgentProfile {
    id: number; name: string; os: 'Windows' | 'Linux' | 'macOS'; scanInterval: number; isolated: boolean; version: string
}
interface UserRole {
    id: number; name: string; email: string; role: 'admin' | 'analyst' | 'viewer'; lastLogin: string; mfa: boolean
}
interface Webhook {
    id: number; name: string; url: string; events: string[]; active: boolean
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const initialApiKeys: ApiKey[] = [
    { id: 1, name: 'SIEM Integration', key: 'tiq_live_sk_a3f2c1d9e4b7f8g9h0i1j2k3l4m5n6', created: 'Jan 15, 2026', lastUsed: '2 hours ago', permissions: 'read:alerts, write:cases' },
    { id: 2, name: 'Reporting Dashboard', key: 'tiq_live_sk_b7d108f3a91c2d3e4f5g6h7i8j9k0l1', created: 'Feb 1, 2026', lastUsed: 'Today 08:00', permissions: 'read:reports' },
    { id: 3, name: 'CI/CD Pipeline', key: 'tiq_live_sk_c9e4f2a71b3d4e5f6g7h8i9j0k1l2m3', created: 'Mar 10, 2026', lastUsed: '3 days ago', permissions: 'read:compliance' },
]

const initialAgentProfiles: AgentProfile[] = [
    { id: 1, name: 'Windows Workstation', os: 'Windows', scanInterval: 60, isolated: false, version: '4.2.1' },
    { id: 2, name: 'Linux Server', os: 'Linux', scanInterval: 30, isolated: false, version: '4.2.1' },
    { id: 3, name: 'macOS Laptop', os: 'macOS', scanInterval: 120, isolated: false, version: '4.2.0' },
]

const initialUsers: UserRole[] = [
    { id: 1, name: 'Alex Chen', email: 'alex.chen@company.com', role: 'admin', lastLogin: '2 hours ago', mfa: true },
    { id: 2, name: 'Jamie Park', email: 'jamie.park@company.com', role: 'analyst', lastLogin: '1 day ago', mfa: true },
    { id: 3, name: 'Sarah Miles', email: 'sarah.miles@company.com', role: 'analyst', lastLogin: '3 hours ago', mfa: true },
    { id: 4, name: 'Tom Brown', email: 'tom.brown@company.com', role: 'viewer', lastLogin: '1 week ago', mfa: false },
]

const initialWebhooks: Webhook[] = [
    { id: 1, name: 'Slack #security-alerts', url: 'https://hooks.slack.com/services/T0…', events: ['alert.high', 'case.opened'], active: true },
    { id: 2, name: 'PagerDuty Integration', url: 'https://events.pagerduty.com/…', events: ['alert.critical'], active: true },
    { id: 3, name: 'Splunk HEC', url: 'https://splunk.company.com:8088/…', events: ['audit.log'], active: false },
]

const TABS = ['API Keys', 'Agent Profiles', 'Access Control', 'Webhooks', 'General'] as const
type SettingsTab = typeof TABS[number]

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: UserRole['role'] }) {
    const map: Record<UserRole['role'], { bg: string; text: string }> = {
        admin: { bg: '#1E3A5F', text: '#93C5FD' },
        analyst: { bg: '#064E3B', text: '#6EE7B7' },
        viewer: { bg: '#374151', text: '#9CA3AF' },
    }
    const c = map[role]
    return (
        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: c.bg, color: c.text }}>{role}</span>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('API Keys')
    const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys)
    const [agentProfiles, setAgentProfiles] = useState<AgentProfile[]>(initialAgentProfiles)
    const [users, setUsers] = useState<UserRole[]>(initialUsers)
    const [webhooks, setWebhooks] = useState<Webhook[]>(initialWebhooks)
    const [visibleKeys, setVisibleKeys] = useState<Record<number, boolean>>({})
    const [copiedKey, setCopiedKey] = useState<number | null>(null)
    const [saved, setSaved] = useState(false)
    const [orgSettings, setOrgSettings] = useState({
        orgName: 'FinServCo', industry: 'Financial Services',
        timezone: 'Europe/London', alertEmail: 'security@finservco.com',
        mfaRequired: true, autoResponse: true, notifications: true,
    })

    const copyKey = (id: number, key: string) => {
        navigator.clipboard.writeText(key)
        setCopiedKey(id); setTimeout(() => setCopiedKey(null), 2000)
    }

    const toggleVisibility = (id: number) =>
        setVisibleKeys(p => ({ ...p, [id]: !p[id] }))

    const maskKey = (key: string) =>
        key.slice(0, 16) + '•'.repeat(20) + key.slice(-4)

    const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

    const updateUserRole = (id: number, role: UserRole['role']) =>
        setUsers(us => us.map(u => u.id === id ? { ...u, role } : u))

    const toggleWebhook = (id: number) =>
        setWebhooks(ws => ws.map(w => w.id === id ? { ...w, active: !w.active } : w))

    const updateScanInterval = (id: number, val: number) =>
        setAgentProfiles(ps => ps.map(p => p.id === id ? { ...p, scanInterval: val } : p))

    const cardStyle = { background: '#1F2937', borderColor: '#374151' }
    const inputStyle = { background: '#111827', border: '1px solid #374151', color: '#F9FAFB' }

    return (
        <div className="p-6 max-w-5xl">
            {/* Tabs */}
            <div className="flex gap-1 mb-6 flex-wrap">
                {TABS.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className="px-4 py-2 rounded-md text-sm font-medium transition-all"
                        style={{ background: activeTab === tab ? '#3B82F6' : '#1F2937', color: activeTab === tab ? 'white' : '#9CA3AF', border: '1px solid', borderColor: activeTab === tab ? '#3B82F6' : '#374151' }}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* API Keys */}
            {activeTab === 'API Keys' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-base font-semibold" style={{ color: '#F9FAFB' }}>API Keys</h2>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium"
                            style={{ background: '#3B82F6', color: 'white' }}>
                            <Plus size={12} />New Key
                        </button>
                    </div>
                    {apiKeys.map(k => (
                        <div key={k.id} className="rounded-lg border p-4" style={cardStyle}>
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{k.name}</h3>
                                    <div className="flex gap-4 text-xs mt-0.5" style={{ color: '#6B7280' }}>
                                        <span>Created: {k.created}</span>
                                        <span>Last used: {k.lastUsed}</span>
                                    </div>
                                </div>
                                <button onClick={() => setApiKeys(ks => ks.filter(x => x.id !== k.id))}
                                    className="p-1.5 rounded hover:bg-red-900/30" style={{ color: '#6B7280' }}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <div className="flex items-center gap-2 p-2.5 rounded-md mb-2" style={{ background: '#111827' }}>
                                <code className="flex-1 text-xs font-mono truncate"
                                    style={{ color: '#10B981' }}>
                                    {visibleKeys[k.id] ? k.key : maskKey(k.key)}
                                </code>
                                <button onClick={() => toggleVisibility(k.id)} style={{ color: '#6B7280' }}>
                                    {visibleKeys[k.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                                <button onClick={() => copyKey(k.id, k.key)} style={{ color: '#6B7280' }}>
                                    {copiedKey === k.id ? <CheckCircle size={14} style={{ color: '#10B981' }} /> : <Copy size={14} />}
                                </button>
                            </div>
                            <div className="text-xs" style={{ color: '#6B7280' }}>
                                Permissions: <span style={{ color: '#9CA3AF' }}>{k.permissions}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Agent Profiles */}
            {activeTab === 'Agent Profiles' && (
                <div className="space-y-4">
                    <h2 className="text-base font-semibold mb-2" style={{ color: '#F9FAFB' }}>Endpoint Agent Configuration Profiles</h2>
                    {agentProfiles.map(p => (
                        <div key={p.id} className="rounded-lg border p-4" style={cardStyle}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{p.name}</h3>
                                    <span className="text-xs px-2 py-0.5 rounded"
                                        style={{ background: '#1E3A5F', color: '#93C5FD' }}>{p.os}</span>
                                    <span className="text-xs font-mono" style={{ color: '#6B7280' }}>v{p.version}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium block mb-1" style={{ color: '#6B7280' }}>
                                        Scan Interval (seconds): <strong style={{ color: '#3B82F6' }}>{p.scanInterval}s</strong>
                                    </label>
                                    <input type="range" min="10" max="300" value={p.scanInterval}
                                        onChange={e => updateScanInterval(p.id, Number(e.target.value))}
                                        className="w-full" style={{ accentColor: '#3B82F6' }} />
                                    <div className="flex justify-between text-xs mt-1" style={{ color: '#6B7280' }}>
                                        <span>10s (aggressive)</span><span>300s (passive)</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {[
                                        { label: 'File integrity monitoring', key: 'fim', default: true },
                                        { label: 'Network traffic capture', key: 'net', default: true },
                                        { label: 'Process monitoring', key: 'proc', default: true },
                                    ].map(opt => (
                                        <div key={opt.key} className="flex items-center justify-between py-1">
                                            <span className="text-xs" style={{ color: '#9CA3AF' }}>{opt.label}</span>
                                            <div className="relative w-9 h-5 rounded-full cursor-pointer"
                                                style={{ background: '#3B82F6' }}>
                                                <span className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Access Control */}
            {activeTab === 'Access Control' && (
                <div>
                    <h2 className="text-base font-semibold mb-4" style={{ color: '#F9FAFB' }}>Role-Based Access Control</h2>
                    {/* Role definitions */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                        {[
                            { role: 'admin', perms: 'Full access, user management, API keys, agent config', color: '#93C5FD' },
                            { role: 'analyst', perms: 'Alert triage, investigations, reports, read-only settings', color: '#6EE7B7' },
                            { role: 'viewer', perms: 'Dashboard and reports read-only, no alert actions', color: '#9CA3AF' },
                        ].map(r => (
                            <div key={r.role} className="p-3 rounded-lg border" style={cardStyle}>
                                <RoleBadge role={r.role as UserRole['role']} />
                                <p className="text-xs mt-2" style={{ color: '#6B7280' }}>{r.perms}</p>
                            </div>
                        ))}
                    </div>
                    {/* Users table */}
                    <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#374151' }}>
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ background: '#111827' }}>
                                    {['User', 'Email', 'Role', 'Last Login', 'MFA', 'Actions'].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                                            style={{ color: '#6B7280', borderBottom: '1px solid #374151' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u, i) => (
                                    <tr key={u.id} style={{ background: i % 2 === 0 ? '#1F2937' : '#111827', borderBottom: '1px solid #374151' }}>
                                        <td className="px-4 py-3 font-medium" style={{ color: '#F9FAFB' }}>{u.name}</td>
                                        <td className="px-4 py-3 text-xs" style={{ color: '#9CA3AF' }}>{u.email}</td>
                                        <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                                        <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{u.lastLogin}</td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs font-medium" style={{ color: u.mfa ? '#10B981' : '#EF4444' }}>
                                                {u.mfa ? '✓ Enabled' : '✗ Disabled'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <select value={u.role} onChange={e => updateUserRole(u.id, e.target.value as UserRole['role'])}
                                                className="px-2 py-1 rounded text-xs"
                                                style={{ background: '#111827', border: '1px solid #374151', color: '#F9FAFB' }}>
                                                <option value="admin">admin</option>
                                                <option value="analyst">analyst</option>
                                                <option value="viewer">viewer</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Webhooks */}
            {activeTab === 'Webhooks' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-base font-semibold" style={{ color: '#F9FAFB' }}>Webhook Targets</h2>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium"
                            style={{ background: '#3B82F6', color: 'white' }}>
                            <Plus size={12} />Add Webhook
                        </button>
                    </div>
                    {webhooks.map(w => (
                        <div key={w.id} className="rounded-lg border p-4" style={cardStyle}>
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{w.name}</h3>
                                    <code className="text-xs mt-0.5 block" style={{ color: '#9CA3AF' }}>{w.url}</code>
                                </div>
                                <button onClick={() => toggleWebhook(w.id)}
                                    className="relative w-10 h-5 rounded-full flex-shrink-0 ml-4"
                                    style={{ background: w.active ? '#3B82F6' : '#374151' }}>
                                    <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                                        style={{ left: w.active ? '22px' : '2px' }} />
                                </button>
                            </div>
                            <div className="flex gap-1 flex-wrap">
                                {w.events.map(ev => (
                                    <span key={ev} className="text-xs font-mono px-2 py-0.5 rounded"
                                        style={{ background: '#111827', color: '#9CA3AF', border: '1px solid #374151' }}>{ev}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* General */}
            {activeTab === 'General' && (
                <div className="space-y-4">
                    <div className="rounded-lg border p-4" style={cardStyle}>
                        <h2 className="text-base font-semibold mb-4" style={{ color: '#F9FAFB' }}>Organization</h2>
                        {[
                            { label: 'Organization Name', key: 'orgName', type: 'text' },
                            { label: 'Industry', key: 'industry', type: 'text' },
                            { label: 'Timezone', key: 'timezone', type: 'text' },
                            { label: 'Alert Email', key: 'alertEmail', type: 'email' },
                        ].map(field => (
                            <div key={field.key} className="mb-3">
                                <label className="text-xs font-medium block mb-1" style={{ color: '#6B7280' }}>{field.label}</label>
                                <input type={field.type}
                                    value={orgSettings[field.key as keyof typeof orgSettings] as string}
                                    onChange={e => setOrgSettings(p => ({ ...p, [field.key]: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-md text-sm outline-none"
                                    style={inputStyle} />
                            </div>
                        ))}
                    </div>
                    <div className="rounded-lg border p-4" style={cardStyle}>
                        <h2 className="text-base font-semibold mb-4" style={{ color: '#F9FAFB' }}>Platform Preferences</h2>
                        {[
                            { label: 'Enable automatic response actions', key: 'autoResponse' },
                            { label: 'Require MFA for analyst login', key: 'mfaRequired' },
                            { label: 'Email notifications for High+ alerts', key: 'notifications' },
                        ].map(s => (
                            <div key={s.key} className="flex items-center justify-between py-2.5 border-b"
                                style={{ borderColor: '#374151' }}>
                                <span className="text-sm" style={{ color: '#F9FAFB' }}>{s.label}</span>
                                <button
                                    onClick={() => setOrgSettings(p => ({ ...p, [s.key]: !p[s.key as keyof typeof orgSettings] }))}
                                    className="relative w-10 h-5 rounded-full transition-colors"
                                    style={{ background: orgSettings[s.key as keyof typeof orgSettings] ? '#3B82F6' : '#374151' }}>
                                    <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                                        style={{ left: orgSettings[s.key as keyof typeof orgSettings] ? '22px' : '2px' }} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleSave}
                        className="px-6 py-2.5 rounded-md text-sm font-medium"
                        style={{ background: saved ? '#064E3B' : '#3B82F6', color: saved ? '#10B981' : 'white' }}>
                        {saved ? '✓ Settings Saved' : 'Save Settings'}
                    </button>
                </div>
            )}
        </div>
    )
}