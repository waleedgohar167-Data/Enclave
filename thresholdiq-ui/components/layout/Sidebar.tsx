'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Bell, Search, Cpu, Activity, TrendingDown,
  ShieldCheck, Globe, Clipboard, BarChart2, Settings,
  Shield, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: Bell, label: 'Alert Queue', path: '/triage', badge: 4 },
  { icon: Search, label: 'Investigations', path: '/investigations' },
  { icon: Cpu, label: 'Agents', path: '/agents', badge: 11 },
  { icon: Activity, label: 'Baseline', path: '/baseline' },
  { icon: TrendingDown, label: 'Drift Monitor', path: '/drift' },
  { icon: ShieldCheck, label: 'Audit Engine', path: '/audit' },
  { icon: Globe, label: 'Threat Intelligence', path: '/threat-intel' },
  { icon: Clipboard, label: 'Compliance', path: '/compliance' },
  { icon: BarChart2, label: 'Reports', path: '/reports' },
  { icon: Settings, label: 'Settings', path: '/settings' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className="flex flex-col h-full border-r transition-all duration-300"
      style={{
        background: '#111827',
        borderColor: '#374151',
        width: collapsed ? '64px' : '220px',
        minWidth: collapsed ? '64px' : '220px',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: '#374151' }}>
        <div
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: '#3B82F6' }}
        >
          <Shield size={16} color="white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-base tracking-tight" style={{ color: '#F9FAFB' }}>
            ThresholdIQ
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto rounded p-1 hover:bg-white/5"
          style={{ color: '#6B7280' }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map(({ icon: Icon, label, path, badge }) => {
          const active = pathname === path
          return (
            <Link key={path} href={path}>
              <div
                className="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-md mb-0.5 cursor-pointer group transition-all"
                style={{
                  background: active ? '#1F2937' : 'transparent',
                  color: active ? '#F9FAFB' : '#9CA3AF',
                }}
              >
                <div className="relative flex-shrink-0">
                  <Icon
                    size={18}
                    style={{ color: active ? '#3B82F6' : '#9CA3AF' }}
                    className="group-hover:text-blue-400 transition-colors"
                  />
                  {badge && (
                    <span
                      className="absolute -top-1.5 -right-1.5 text-white text-xs rounded-full flex items-center justify-center font-medium"
                      style={{
                        background: badge === 11 ? '#10B981' : '#EF4444',
                        fontSize: '9px',
                        minWidth: '14px',
                        height: '14px',
                        padding: '0 3px',
                      }}
                    >
                      {badge}
                    </span>
                  )}
                </div>
                {!collapsed && (
                  <span className="text-sm font-medium truncate group-hover:text-white transition-colors">
                    {label}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t p-3" style={{ borderColor: '#374151' }}>
        {!collapsed && (
          <div
            className="flex items-center gap-2 px-2 py-2 mb-2 rounded-md"
            style={{ background: '#1F2937' }}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#10B981' }} />
            <span className="text-xs" style={{ color: '#9CA3AF' }}>11/11 agents online</span>
          </div>
        )}
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div
            className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
            style={{ background: '#3B82F6' }}
          >
            AC
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-xs font-medium truncate" style={{ color: '#F9FAFB' }}>Alex Chen</div>
              <div className="text-xs truncate" style={{ color: '#6B7280' }}>Lead Analyst</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}