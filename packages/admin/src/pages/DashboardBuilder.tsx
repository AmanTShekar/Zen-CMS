import React, { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Database,
  FileText,
  History,
  ImageIcon,
  Layers,
  Loader2,
  Plus,
  Radio,
  Users,
  XCircle,
  Globe,
  KeyRound,
  Zap,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useTheme } from '../context/ThemeContext'
import { PageHeader } from '../components/ui/PageHeader'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import { DashboardCard } from './dashboard/DashboardCard'
import { WidgetErrorBoundary } from './dashboard/WidgetErrorBoundary'

// ── Types ──────────────────────────────────────────────────────────────────────
interface HealthData {
  status: string
  database: string
  version: string
  environment: string
  uptime: number
  memory: { heapUsed: string; heapTotal: string; rss: string }
}
interface AuditEntry {
  _id: string
  action: string
  collection?: string
  collectionName?: string
  user?: { email?: string }
  userEmail?: string
  timestamp: string
  status?: string
}
interface AuditStats {
  total: number
  failed: number
  success: number
  byAction: Record<string, number>
}
interface CollectionInfo {
  name: string
  label?: string
  count?: number
  drafts?: boolean
  icon?: string
}
interface PresenceMember {
  userId: string
  email?: string
  collection?: string
  documentId?: string
  color?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function timeAgo(ts: string) {
  const secs = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

function uptimeStr(seconds: number) {
  if (seconds == null) return '—'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m ${s}s`
  return `${m}m ${s}s`
}

const ACTION_PALETTE: Record<string, string> = {
  create: 'text-z-active-text bg-z-active-bg',
  update: 'text-z-active-text bg-z-active-bg',
  delete: 'text-rose-400 bg-rose-500/10',
  login: 'text-sky-400 bg-sky-500/10',
  logout: 'text-z-muted bg-z-panel',
}

const INITIALS_COLORS = [
  'bg-z-accent', 'bg-z-accent', 'bg-sky-600',
  'bg-amber-600', 'bg-rose-600', 'bg-z-accent',
]

// ── Stat Pill ─────────────────────────────────────────────────────────────────
const StatPill = React.memo(function StatPill({
  label, value, sub, icon: Icon, accent, loading,
}: {
  label: string; value: string; sub?: string
  icon: React.ElementType; accent?: 'purple' | 'emerald' | 'red'; loading?: boolean
}) {
  const { theme } = useTheme()
  const accentClass =
    accent === 'purple' ? 'text-z-active-text' :
    accent === 'emerald' ? 'text-z-active-text' :
    accent === 'red' ? 'text-rose-400' :
    'text-z-primary'

  return (
    <div className={cn(
      'flex flex-col justify-between gap-2 p-5 border transition-colors z-panel backdrop-blur-md shadow-sm'
    )} style={{ background: 'var(--z-bg-panel)', borderColor: 'var(--z-border)' }}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-z-secondary">{label}</span>
        <Icon size={13} className="text-z-secondary" />
      </div>
      <div>
        <span className={cn('text-2xl font-semibold  leading-none tabular-nums', accentClass)}>
          {loading ? <span className="text-z-secondary text-base">—</span> : value}
        </span>
        {sub && <p className="text-sm text-z-secondary mt-1">{sub}</p>}
      </div>
    </div>
  )
})

// ── Environment Badge ──────────────────────────────────────────────────────────
function EnvBadge({ env }: { env?: string }) {
  if (!env) return null
  const isProd = env === 'production'
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-semibold   border',
      isProd
        ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', isProd ? 'bg-rose-400 animate-pulse' : 'bg-amber-400')} />
      {env}
    </span>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { theme } = useTheme()
  const navigate = useNavigate()

  const [health, setHealth] = useState<HealthData | null>(null)
  const [latency, setLatency] = useState<number | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([])
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null)
  const [collections, setCollections] = useState<CollectionInfo[]>([])
  const [totalRecords, setTotalRecords] = useState<string>('—')
  const [mediaCount, setMediaCount] = useState<number | null>(null)
  const [membersOnline, setMembersOnline] = useState<PresenceMember[]>([])
  const [memberCount, setMemberCount] = useState<number | null>(null)
  const [hoveredUser, setHoveredUser] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Make uptime active
  useEffect(() => {
    const timer = setInterval(() => {
      setHealth(prev => prev && prev.uptime != null ? { ...prev, uptime: prev.uptime + 1 } : prev)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const t0 = performance.now()
      const results = await Promise.allSettled([
        api.get('/system/health'),          // 0
        api.get('/system/audit-logs?limit=8'),  // 1
        api.get('/system/audit-logs/stats'),    // 2
        api.get('/system/schemas'),             // 3 — collections list
        api.get('/system/counts'),              // 4
        api.get('/media?pageSize=1&sort=-createdAt'), // 5 — just for total count
        api.get('/presence'),                   // 6
      ])

      if (results[0].status === 'fulfilled') {
        setLatency(Math.round(performance.now() - t0))
        setHealth(results[0].value.data?.data || null)
      }
      if (results[1].status === 'fulfilled') {
        setAuditLogs(results[1].value.data?.data || [])
      }
      if (results[2].status === 'fulfilled') {
        setAuditStats(results[2].value.data?.data || null)
      }

      // Build collections from schemas + counts
      const counts: Record<string, number> = results[4].status === 'fulfilled'
        ? results[4].value.data?.data || {}
        : {}

      if (results[3].status === 'fulfilled') {
        const schemas = results[3].value.data?.data
        const cols: any[] = schemas?.collections || (Array.isArray(schemas) ? schemas : [])
        setCollections(cols.map((c: any) => ({
          name: c.slug || c.name,
          label: c.label || c.labels?.plural || c.slug || c.name,
          count: counts[c.slug || c.name],
          drafts: !!c.drafts,
          icon: c.admin?.icon,
        })))
        // total records = sum of all counts (excluding internal z_ collections)
        const total = Object.entries(counts)
          .filter(([k]) => !k.startsWith('z_'))
          .reduce((a, [, v]) => a + (v as number), 0)
        setTotalRecords(total > 0 ? total.toLocaleString() : '0')
        // member count from counts
        if (counts['users'] != null) setMemberCount(counts['users'])
        else if (counts['z_users'] != null) setMemberCount(counts['z_users'])
        else if (counts['members'] != null) setMemberCount(counts['members'])
      }

      if (results[5].status === 'fulfilled') {
        const pagination = results[5].value.data?.meta?.pagination
        setMediaCount(pagination?.total ?? results[5].value.data?.data?.length ?? null)
      }
      if (results[6].status === 'fulfilled') {
        setMembersOnline(results[6].value.data?.data || [])
      }
    } catch {
      // partial failures are fine
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    // Dynamic ultra-low resource polling (every 3s) for presence and system health
    const dynamicInterval = setInterval(() => {
      const t0 = performance.now()
      api.get('/system/health').then(r => {
        setLatency(Math.round(performance.now() - t0))
        setHealth(prev => {
          const newData = r.data?.data || null
          // Keep our local ticking uptime if it's ahead or similar to prevent jitter
          if (prev && newData && newData.uptime) {
            return { ...newData, uptime: Math.max(prev.uptime, newData.uptime) }
          }
          return newData
        })
      }).catch(() => {})

      api.get('/presence').then(r => {
        const data = r.data?.data || []
        setMembersOnline(data)
        setMemberCount(prev => prev !== null ? Math.max(prev, data.length) : data.length)
      }).catch(() => {})
    }, 3000)

    return () => clearInterval(dynamicInterval)
  }, [fetchAll])

  // Global presence heartbeat so users just looking at the dashboard appear online
  useEffect(() => {
    const sendHeartbeat = () => {
      api.post('/presence/heartbeat', {
        collection: 'dashboard',
        documentId: 'dashboard',
      }).catch(() => {})
    }
    sendHeartbeat() // initial
    const interval = setInterval(sendHeartbeat, 30000)
    return () => clearInterval(interval)
  }, [])

  const isHealthOk = health?.status === 'ok'
  const isDbOk = health?.database === 'ok'

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4">
        <Loader2 size={26} className="animate-spin text-z-secondary" strokeWidth={1.5} />
        <p className="text-sm font-semibold text-z-secondary animate-pulse">Loading…</p>
      </div>
    )
  }

  const quickActionGlass = theme === 'dark' 
    ? 'bg-z-hover hover:bg-z-panel/[0.08] text-z-secondary border border-z-border shadow-sm' 
    : 'bg-z-panel/65 backdrop-blur-[12px] hover:bg-z-panel/85 text-z-primary border border-z-border shadow-sm';

  const QUICK_ACTIONS = [
    { label: 'New Content', icon: Plus, path: '/collections', color: quickActionGlass },
    { label: 'Media Library', icon: ImageIcon, path: '/media', color: quickActionGlass },
    { label: 'API Explorer', icon: Zap, path: '/settings?tab=api-explorer', color: quickActionGlass },
    { label: 'Schema Builder', icon: Layers, path: '/schema-builder', color: quickActionGlass },
    { label: 'API Keys', icon: KeyRound, path: '/settings?tab=keys', color: quickActionGlass },
    { label: 'Audit Log', icon: History, path: '/audit-log', color: quickActionGlass },
  ]

  return (
    <div className="min-h-full transition-colors duration-300">
      <div className="p-6 space-y-5 max-w-screen-2xl mx-auto">

        {/* Page Header */}
        <PageHeader
          title="Dashboard"
          description="System overview for your Zenith CMS workspace."
          icon={<Activity size={20} />}
          actions={
            <div className="flex items-center gap-2">
              <EnvBadge env={health?.environment} />
              {health?.version && (
                <span className="text-sm font-semibold text-z-secondary">
                  v{health.version}
                </span>
              )}
            </div>
          }
        />

        {/* ── Row 1: Key stats ──────────────────────────────────────────────── */}
        <WidgetErrorBoundary>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatPill label="Content Records" value={totalRecords} icon={FileText} />
            <StatPill label="Collections" value={String(collections.length || '—')} icon={Database} />
            <StatPill
              label="Media Files"
              value={mediaCount != null ? mediaCount.toLocaleString() : '—'}
              icon={ImageIcon}
            />
            <StatPill
              label="Team Members"
              value={memberCount != null ? String(memberCount) : '—'}
              sub={membersOnline.length > 0 ? `${membersOnline.length} online now` : undefined}
              icon={Users}
            />
            <StatPill
              label="API Latency"
              value={latency != null ? `${latency}ms` : '—'}
              sub={health ? (isHealthOk ? 'System Operational' : 'System Degraded') : undefined}
              icon={Radio}
              accent={!health ? undefined : latency != null && latency < 300 ? 'emerald' : 'red'}
            />
            <StatPill
              label="Database"
              value={health?.database || (health ? 'Connected' : '—')}
              sub={isDbOk ? 'Status: Operational' : 'Status: Degraded'}
              icon={Activity}
              accent={!health ? undefined : isDbOk ? 'emerald' : 'red'}
            />
          </div>
        </WidgetErrorBoundary>

        {/* ── Row 2: Audit stats ───────────────────────────────────────────── */}
        {auditStats && (
          <WidgetErrorBoundary>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatPill label="Total Events" value={auditStats.total.toLocaleString()} icon={History} />
              <StatPill label="Successful Ops" value={auditStats.success.toLocaleString()} icon={CheckCircle2} accent="emerald" />
              <StatPill label="Failed Ops" value={auditStats.failed.toLocaleString()} icon={XCircle} accent={auditStats.failed > 0 ? 'red' : undefined} />
            </div>
          </WidgetErrorBoundary>
        )}

        {/* ── Row 3: Quick Actions ────────────────────────────────────────────── */}
        <DashboardCard title="Quick Actions" icon={<Zap size={13} />}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={() => navigate(a.path)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold  tracking-wide transition-all',
                  a.color
                )}
              >
                <a.icon size={14} />
                {a.label}
              </button>
            ))}
          </div>
        </DashboardCard>

        {/* ── Row 4: Collections + Activity ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Collections */}
          <DashboardCard
            title="Collections"
            icon={<Database size={13} />}
            noPadding
            action={
              <Link to="/schema-builder" className={cn('text-sm font-semibold   flex items-center gap-1 transition-colors', theme === 'dark' ? 'text-z-secondary hover:text-z-secondary' : 'text-z-muted hover:text-z-primary')}>
                Manage <ArrowRight size={11} />
              </Link>
            }
          >
            {collections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-4 px-6">
                <Database size={32} className="text-z-primary" strokeWidth={1} />
                <div className="text-center">
                  <p className="text-sm font-bold text-z-muted">No collections yet</p>
                  <p className="text-sm text-z-secondary mt-1">Create your first collection to start managing content.</p>
                </div>
                <Link to="/schema-builder" className="px-5 py-2.5 bg-z-accent hover:brightness-110 text-z-logo-text text-sm font-semibold transition-colors">
                  + Create Collection
                </Link>
              </div>
            ) : (
              <div>
                {collections.slice(0, 8).map((col) => (
                  <Link
                    key={col.name}
                    to={`/collections/${col.name}`}
                    className={cn(
                      'flex items-center justify-between px-5 py-3 group transition-colors border-b last:border-b-0',
                      theme === 'dark' ? 'border-z-border hover:bg-z-hover' : 'border-z-border hover:bg-[var(--z-bg-input)]'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('w-6 h-6 flex items-center justify-center border text-z-secondary', theme === 'dark' ? 'bg-z-hover border-z-border' : 'bg-z-input border-z-border')}>
                        <Layers size={11} />
                      </div>
                      <div>
                        <span className={cn('text-sm font-bold capitalize', theme === 'dark' ? 'text-z-primary' : 'text-z-primary')}>
                          {col.label || col.name}
                        </span>
                        {col.drafts && (
                          <span className="ml-2 text-sm font-semibold text-amber-500 bg-amber-500/10 px-1.5 py-0.5">
                            Drafts
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {col.count != null && (
                        <span className="text-sm font-semibold tabular-nums text-z-secondary">
                          {col.count.toLocaleString()}
                        </span>
                      )}
                      <ArrowRight size={12} className={cn('transition-transform group-hover:translate-x-0.5', theme === 'dark' ? 'text-z-primary' : 'text-z-secondary')} />
                    </div>
                  </Link>
                ))}
                {collections.length > 8 && (
                  <div className={cn('px-5 py-3 border-t', 'border-z-border')}>
                    <Link to="/schema-builder" className="text-sm font-semibold text-z-secondary hover:text-z-active-text transition-colors">
                      +{collections.length - 8} more collections →
                    </Link>
                  </div>
                )}
                <div className={cn('px-5 py-3 border-t', 'border-z-border')}>
                  <Link to="/schema-builder" className="flex items-center gap-1.5 text-sm font-semibold text-z-secondary hover:text-z-active-text transition-colors w-fit">
                    <Plus size={11} /> New Collection
                  </Link>
                </div>
              </div>
            )}
          </DashboardCard>

          {/* Recent Activity */}
          <DashboardCard
            title="Recent Activity"
            icon={<History size={13} />}
            noPadding
            action={
              <Link to="/audit-log" className={cn('text-sm font-semibold   flex items-center gap-1 transition-colors', theme === 'dark' ? 'text-z-secondary hover:text-z-secondary' : 'text-z-muted hover:text-z-primary')}>
                Full Log <ArrowRight size={11} />
              </Link>
            }
          >
            {auditLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-2">
                <History size={28} className="text-z-primary" strokeWidth={1} />
                <p className="text-sm text-z-secondary">No activity recorded yet.</p>
              </div>
            ) : (
              <div>
                {auditLogs.map((log) => {
                  const actor = log.userEmail || log.user?.email || 'System'
                  const initials = actor === 'System' ? 'SY' : actor.slice(0, 2).toUpperCase()
                  const colorIdx = actor.charCodeAt(0) % INITIALS_COLORS.length
                  const collection = (log.collectionName || log.collection || 'system').replace(/-/g, ' ')
                  const isFailed = log.status === 'failed'

                  return (
                    <div
                      key={log._id}
                      onClick={() => navigate('/audit-log')}
                      className={cn(
                        'flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors border-b last:border-b-0',
                        theme === 'dark' ? 'border-z-border hover:bg-z-hover' : 'border-z-border hover:bg-[var(--z-bg-input)]',
                        isFailed && (theme === 'dark' ? 'bg-rose-500/[0.03]' : 'bg-rose-50/50')
                      )}
                    >
                      {/* Avatar */}
                      <div className={cn('w-6 h-6 flex items-center justify-center text-z-primary text-sm font-semibold shrink-0', INITIALS_COLORS[colorIdx])}>
                        {initials}
                      </div>
                      {/* Action badge */}
                      <span className={cn(
                        'inline-flex px-1.5 py-0.5 text-sm font-semibold   shrink-0',
                        isFailed ? 'text-rose-400 bg-rose-500/10' : (ACTION_PALETTE[log.action?.toLowerCase()] || 'text-z-muted bg-z-panel')
                      )}>
                        {log.action}
                      </span>
                      {/* Collection */}
                      <span className={cn('text-sm font-medium flex-1 truncate capitalize', theme === 'dark' ? 'text-z-muted' : 'text-z-secondary')}>
                        {collection}
                      </span>
                      {/* Time */}
                      <span className="text-sm text-z-secondary shrink-0 tabular-nums">{timeAgo(log.timestamp)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </DashboardCard>

        </div>

        {/* ── Row 5: Who's online + API health strip ─────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Who's Online — Google Docs style */}
          <DashboardCard title="Who's Online" icon={<Users size={13} />}>
            {membersOnline.length === 0 ? (
              <div className="flex items-center gap-2.5">
                <div className={cn('w-2 h-2 rounded-full', theme === 'dark' ? 'bg-z-border' : 'bg-[var(--z-border)]')} />
                <p className="text-sm text-z-secondary">No one else is online right now.</p>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center -space-x-2.5">
                  {membersOnline.map((m, i) => {
                    const email = m.email || m.userId || 'Unknown'
                    const name = email.split('@')[0]
                    const initials = name.slice(0, 2).toUpperCase()
                    const collection = m.collection
                      ? m.collection.replace(/-/g, ' ')
                      : null
                    const avatarColor = m.color || INITIALS_COLORS[i % INITIALS_COLORS.length]
                    const isHex = avatarColor.startsWith('#')
                    const statusText = collection ? `Editing ${collection}` : 'Browsing'

                    return (
                      <div 
                        key={m.userId || i} 
                        className="relative group cursor-default"
                        style={{ zIndex: hoveredUser === (m.userId || String(i)) ? 50 : membersOnline.length - i }}
                        onMouseEnter={() => setHoveredUser(m.userId || String(i))}
                        onMouseLeave={() => setHoveredUser(null)}
                      >
                        {/* Avatar circle with user color border */}
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold transition-transform group-hover:-translate-y-1 group-hover:scale-110"
                          style={{
                            backgroundColor: isHex ? avatarColor : undefined,
                            boxShadow: isHex
                              ? `0 0 0 3px ${avatarColor}55, 0 0 0 5px ${theme === 'dark' ? '#18181b' : '#fff'}`
                              : `0 0 0 3px var(--z-accent), 0 0 0 5px ${theme === 'dark' ? '#18181b' : '#fff'}`,
                          }}
                        >
                          <span className={cn(!isHex && avatarColor)}>{initials}</span>
                        </div>
                        {/* Pulsing active dot with user color */}
                        <span 
                          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 animate-pulse"
                          style={{
                            backgroundColor: isHex ? avatarColor : 'var(--z-accent)',
                            borderColor: theme === 'dark' ? '#18181b' : '#fff',
                          }}
                        />
                        {/* Framer Motion tooltip */}
                        <AnimatePresence>
                          {hoveredUser === (m.userId || String(i)) && (
                            <motion.div 
                              initial={{ opacity: 0, y: 5, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 5, scale: 0.95 }}
                              transition={{ duration: 0.12 }}
                              className="absolute top-full mt-3 left-1/2 -translate-x-1/2 z-[999] whitespace-nowrap pointer-events-none"
                            >
                              <div className={cn(
                                "px-3 py-2 rounded-xl shadow-2xl text-xs font-medium flex items-center gap-2",
                                theme === 'dark' ? 'bg-[#18181b] text-z-primary border border-z-border shadow-black/60' : 'bg-white text-z-primary border shadow-lg'
                              )}>
                                <div 
                                  className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse"
                                  style={{ backgroundColor: isHex ? avatarColor : 'var(--z-accent)' }}
                                />
                                <span className="font-semibold">{name}</span>
                                <span className="text-z-muted font-normal border-l border-z-border pl-2">{statusText}</span>
                              </div>
                              {/* Arrow */}
                              <div className={cn(
                                "absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45",
                                theme === 'dark' ? 'bg-[#18181b] border-l border-t border-z-border' : 'bg-white border-l border-t border-gray-200'
                              )} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
                <span className="text-sm text-z-secondary font-medium">
                  {membersOnline.length} {membersOnline.length === 1 ? 'person' : 'people'} online
                </span>
              </div>
            )}
          </DashboardCard>

          {/* API / DB Health strip */}
          <DashboardCard title="System Status" icon={<Globe size={13} />}>
            <div className="space-y-3">
              {[
                {
                  label: 'REST API',
                  ok: isHealthOk,
                  detail: latency != null ? `${latency}ms latency` : 'Checking…',
                },
                {
                  label: 'Database',
                  ok: isDbOk,
                  detail: health?.database || 'Unknown',
                },
                {
                  label: 'Memory',
                  ok: true,
                  detail: health?.memory?.heapUsed
                    ? `${health.memory.heapUsed} / ${health.memory.heapTotal} heap`
                    : '—',
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.ok
                      ? <CheckCircle2 size={13} className="text-z-active-text shrink-0" />
                      : <AlertTriangle size={13} className="text-rose-400 shrink-0" />}
                    <span className={cn('text-sm font-bold', 'text-z-secondary')}>{item.label}</span>
                  </div>
                  <span className="text-sm text-z-secondary">{item.detail}</span>
                </div>
              ))}
              {health?.uptime != null && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-z-secondary shrink-0" />
                    <span className={cn('text-sm font-bold', 'text-z-secondary')}>Uptime</span>
                  </div>
                  <span className="text-sm text-z-secondary">{uptimeStr(health.uptime)}</span>
                </div>
              )}
            </div>
          </DashboardCard>

        </div>

      </div>
    </div>
  )
}
