import React, { useState, useEffect, useCallback } from 'react'
import {
  HardDrive, Layers, Activity, Trash2, RefreshCw, Scan, Loader2,
  Database, Archive, Clock, TrendingUp, AlertTriangle, CheckCircle2,
  Download, Server, Zap, BarChart3, Cpu, Network, FileCode, Terminal
} from 'lucide-react'
import { cn } from '../../lib/utils'
import api from '../../lib/api'
import { useTenantStore } from '../../lib/tenantStore'
import toast from 'react-hot-toast'

interface DBStats {
  size?: number
  storageSize?: number
  freeStorageSize?: number
  documents?: number
  indexes?: number
  avgObjSize?: number
  collections?: number | string
  dbName?: string
  dbVersion?: string
  connections?: number
  adapterType?: string
  collectionDetails?: Array<{ name: string; count: number; sizeMB: string; avgDocSizeB: number; indexes: number }>
  platform?: string
  nodeVersion?: string
  pid?: number
  [key: string]: any
}

interface Backup {
  id: string
  filename: string
  size: number
  createdAt: string
  status: 'ready' | 'processing' | 'failed'
}

interface SettingsDatabaseProps {
  dbStats: DBStats | null
  theme: 'light' | 'dark'
}

const SettingsDatabase: React.FC<SettingsDatabaseProps> = ({ dbStats, theme }) => {
  const dark = theme === 'dark'
  const [sweeping, setSweeping] = useState(false)
  const [testing, setTesting] = useState(false)
  const [creatingBackup, setCreatingBackup] = useState(false)
  const [dbUri, setDbUri] = useState('')
  const [dbDialect, setDbDialect] = useState<'postgres' | 'mongodb'>('mongodb')
  const [backups, setBackups] = useState<Backup[]>([])
  const [backupsLoading, setBackupsLoading] = useState(false)
  const [showBackups, setShowBackups] = useState(false)
  const [slowQueries, setSlowQueries] = useState<any[]>([])
  const [slowQueriesLoading, setSlowQueriesLoading] = useState(false)

  const fetchBackups = useCallback(async () => {
    setBackupsLoading(true)
    try {
      const res = await api.get('/system/backup/list')
      setBackups(res.data?.data || [])
    } catch {
      setBackups([])
    } finally {
      setBackupsLoading(false)
    }
  }, [])

  const fetchSlowQueries = useCallback(async () => {
    setSlowQueriesLoading(true)
    try {
      const res = await api.get('/system/db/slow-queries')
      setSlowQueries(res.data?.data || [])
    } catch {
      setSlowQueries([])
    } finally {
      setSlowQueriesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (showBackups) fetchBackups()
  }, [showBackups, fetchBackups])

  const handleMediaSweep = async () => {
    setSweeping(true)
    try {
      const res = await api.post<any>('/system/media/sweep', { pruneUnreferencedMedia: true })
      const result = res.data.data
      toast.success(`Swept ${result.removed || 0} orphans · ${result.retained || 0} retained`)
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Sweep failed')
    } finally {
      setSweeping(false)
    }
  }

  const handleFlushCache = async () => {
    setSweeping(true)
    try {
      await api.post('/system/cache/flush')
      toast.success('Cache flushed')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to flush cache')
    } finally {
      setSweeping(false)
    }
  }

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dbUri.trim()) return
    setTesting(true)
    try {
      await api.post('/system/db/test-connection', { uri: dbUri, dialect: dbDialect })
      toast.success('Connection verified')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Connection failed')
    } finally {
      setTesting(false)
    }
  }

  const handleCreateBackup = async () => {
    setCreatingBackup(true)
    try {
      await api.post('/system/backup/create')
      toast.success('Backup created')
      fetchBackups()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Backup failed')
    } finally {
      setCreatingBackup(false)
    }
  }

  const handleDownloadBackup = async (backup: Backup) => {
    try {
      // Use fetch directly for blob download since api instance does not support responseType
      const token = useTenantStore.getState().token || ''
      const siteId = useTenantStore.getState().activeSiteId || ''
      const apiBase = (import.meta.env.VITE_API_URL || '').replace('/api/v1', '')
      const res = await fetch(`${apiBase}/api/v1/system/backup/download/${backup.id}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(siteId ? { 'x-zenith-site-id': siteId } : {}),
        }
      })
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = backup.filename
      a.click()
    } catch {
      toast.error('Download failed')
    }
  }

  const sizeMB = dbStats?.size ? (dbStats.size / 1024 / 1024).toFixed(2) : '0.00'
  const storageMB = dbStats?.storageSize ? (dbStats.storageSize / 1024 / 1024).toFixed(2) : '0.00'
  const freeMB = dbStats?.freeStorageSize ? (dbStats.freeStorageSize / 1024 / 1024).toFixed(2) : null
  const collections = dbStats?.collections || '0'
  const documents = dbStats?.documents || 0
  const indexes = dbStats?.indexes || 0
  const avgObjSize = dbStats?.avgObjSize || 0
  const collDetails = dbStats?.collectionDetails || []

  const topStats = [
    { label: 'Data Size',     value: `${sizeMB} MB`,                    icon: HardDrive,    color: 'text-z-active-text', bg: 'bg-z-active-bg',      border: 'border-z-active-border' },
    { label: 'Storage Used',  value: `${storageMB} MB`,                  icon: HardDrive,    color: 'text-pink-400',      bg: 'bg-pink-500/10',     border: 'border-pink-500/20' },
    { label: 'Collections',   value: String(collections),                 icon: Layers,       color: 'text-z-active-text', bg: 'bg-z-accent/10',     border: 'border-z-accent/20' },
    { label: 'Documents',     value: Number(documents).toLocaleString(), icon: Database,     color: 'text-sky-400',       bg: 'bg-sky-500/10',      border: 'border-sky-500/20' },
    { label: 'Total Indexes', value: String(indexes),                    icon: BarChart3,    color: 'text-amber-400',     bg: 'bg-amber-500/10',    border: 'border-amber-500/20' },
    { label: 'Avg Doc Size',  value: avgObjSize ? `${avgObjSize} B` : '—', icon: Zap,        color: 'text-violet-400',    bg: 'bg-violet-500/10',   border: 'border-violet-500/20' },
  ]

  const card = cn(
    'border rounded-none transition-all',
    dark ? 'bg-z-panel backdrop-blur-md border-z-border shadow-sm' : 'bg-z-input border-z-border shadow-sm'
  )

  const inp = cn(
    'border rounded-none py-3 px-4 text-sm font-mono transition-all outline-none focus:ring-1 focus:ring-z-active-border focus:border-z-accent',
    dark ? 'bg-app/80 border-z-border text-z-primary placeholder:text-z-primary' : 'bg-z-panel border-z-border'
  )

  return (
    <div className="space-y-6">

      {/* ── Technical Identity ─────────────────────────────────── */}
      <div className={cn(card, 'p-5')}>
        <p className="text-sm font-semibold text-z-secondary mb-4 flex items-center gap-2">
          <Server size={13} /> Database Identity
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3">
          {[
            { label: 'Adapter',      value: dbStats?.adapterType || '—' },
            { label: 'Database',     value: dbStats?.dbName || '—' },
            { label: 'Server Ver.',  value: dbStats?.dbVersion || '—' },
            { label: 'Connections',  value: dbStats?.connections != null ? String(dbStats.connections) : '—' },
            { label: 'Free Storage', value: freeMB ? `${freeMB} MB` : '—' },
            { label: 'Platform',     value: dbStats?.platform || '—' },
            { label: 'Node.js',      value: dbStats?.nodeVersion || '—' },
            { label: 'Process PID',  value: dbStats?.pid ? String(dbStats.pid) : '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-semibold text-z-secondary uppercase tracking-wide">{label}</p>
              <p className="text-sm font-mono font-semibold text-z-primary mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {topStats.map((stat, i) => (
          <div key={i} className={cn(card, 'p-5 flex flex-col gap-3')}>
            <div className="flex items-center justify-between">
              <div className={cn('w-9 h-9 flex items-center justify-center border', stat.bg, stat.border)}>
                <stat.icon size={16} className={stat.color} />
              </div>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                Live
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-z-secondary uppercase tracking-wide">{stat.label}</p>
              <p className="text-xl font-semibold mt-1 text-z-primary tabular-nums">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Per-Collection Breakdown ───────────────────────────── */}
      {collDetails.length > 0 && (
        <div className={cn(card, 'overflow-hidden')}>
          <div className="flex items-center gap-2 p-4 border-b" style={{ borderColor: 'var(--z-border)' }}>
            <Terminal size={13} className="text-z-secondary" />
            <p className="text-sm font-semibold text-z-primary">Collection Breakdown</p>
            <span className="ml-auto text-xs text-z-secondary">{collDetails.length} collections</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={cn('border-b', dark ? 'bg-z-hover border-z-border' : 'bg-z-input border-z-border')}>
                  {['Collection', 'Docs', 'Size (MB)', 'Avg Doc', 'Indexes'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 font-semibold text-z-secondary uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--z-border)' }}>
                {collDetails.map((c) => (
                  <tr key={c.name} className={cn('transition-colors', dark ? 'hover:bg-z-hover/40' : 'hover:bg-z-input/60')}>
                    <td className="px-4 py-2.5 font-mono font-semibold text-z-primary">
                      {c.name.startsWith('z_') ? (
                        <span className="text-z-secondary">{c.name}</span>
                      ) : c.name}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-z-primary">{c.count.toLocaleString()}</td>
                    <td className="px-4 py-2.5 tabular-nums text-z-primary">{c.sizeMB}</td>
                    <td className="px-4 py-2.5 tabular-nums text-z-secondary">{c.avgDocSizeB > 0 ? `${c.avgDocSizeB} B` : '—'}</td>
                    <td className="px-4 py-2.5 tabular-nums">
                      <span className={cn('px-1.5 py-0.5 border font-mono', 'text-amber-400 border-amber-500/20 bg-amber-500/10')}>{c.indexes}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Test Connection */}
      <div className={cn(card, 'p-6 space-y-4')}>
        <p className="text-sm font-semibold text-z-secondary">Test New Connection</p>
        <form onSubmit={handleTestConnection} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px] space-y-1">
            <label className="text-sm font-semibold text-z-secondary">Connection URI</label>
            <input
              type="text"
              value={dbUri}
              onChange={e => setDbUri(e.target.value)}
              placeholder="postgres://user:pass@host:5432/db or mongodb://..."
              className={cn(inp, 'w-full')}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-z-secondary">Dialect</label>
            <div className="flex gap-2">
              {(['postgres', 'mongodb'] as const).map(d => (
                <button key={d} type="button" onClick={() => setDbDialect(d)}
                  className={cn('px-4 py-3 text-sm font-semibold  border transition-all',
                    dbDialect === d ? dark ? 'border-z-accent/50 bg-z-accent/20 text-z-active-text' : 'border-z-active-border bg-z-active-bg text-z-accent' : dark ? 'border-z-border text-z-secondary' : 'border-z-border text-z-muted')}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={testing || !dbUri.trim()}
            className={cn('px-6 py-3 text-sm font-semibold   border transition-all disabled:opacity-40 flex items-center gap-2',
              dark ? 'bg-z-accent border-transparent text-z-primary hover:opacity-90 shadow-sm' : 'bg-z-accent border-transparent text-z-primary hover:brightness-110')}>
            {testing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Validate
          </button>
        </form>
      </div>

      {/* Backup Manager */}
      <div className={cn(card, 'overflow-hidden')}>
        <div className="flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <Archive size={16} className="text-z-secondary" />
            <div>
              <p className={cn('text-sm font-semibold  ', dark ? 'text-z-primary' : 'text-z-primary')}>Database Backups</p>
              <p className="text-sm text-z-secondary">Create and restore database snapshots</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setShowBackups(!showBackups) }}
              className={cn('text-sm font-semibold   px-3 py-2 border transition-all', dark ? 'border-z-border text-z-muted hover:text-z-primary' : 'border-z-border text-z-secondary')}>
              {showBackups ? 'Hide' : 'View'} Backups
            </button>
            <button onClick={handleCreateBackup} disabled={creatingBackup}
              className={cn('flex items-center gap-2 px-4 py-2 text-sm font-semibold   border transition-all disabled:opacity-40',
                dark ? 'bg-z-active-bg border-z-active-border text-z-active-text hover:bg-z-active-bg' : 'bg-z-active-bg border-z-active-border text-z-accent')}>
              {creatingBackup ? <Loader2 size={11} className="animate-spin" /> : <Archive size={11} />}
              Create Backup
            </button>
          </div>
        </div>
        {showBackups && (
          <div className="border-t" style={{ borderColor: 'var(--z-border)' }}>
            {backupsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="text-z-active-text animate-spin" />
              </div>
            ) : backups.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-z-secondary">No backups yet — create one above</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--z-border)' }}>
                {backups.map(b => (
                  <div key={b.id} className="flex items-center gap-4 px-5 py-3">
                    <Archive size={14} className="text-z-secondary shrink-0" />
                    <div className="flex-1">
                      <p className={cn('text-sm font-semibold', dark ? 'text-z-primary' : 'text-z-primary')}>{b.filename}</p>
                      <p className="text-sm text-z-secondary">{new Date(b.createdAt).toLocaleString()} · {(b.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <span className={cn('text-sm font-semibold   px-2 py-0.5 border', b.status === 'ready' ? 'text-z-active-text border-z-active-border bg-z-active-bg' : b.status === 'processing' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10')}>
                      {b.status}
                    </span>
                    {b.status === 'ready' && (
                      <button onClick={() => handleDownloadBackup(b)} className={cn('p-2 transition-colors', dark ? 'text-z-secondary hover:text-z-active-text' : 'text-z-muted hover:text-z-accent')}>
                        <Download size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Maintenance Actions */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-z-secondary px-1">Maintenance Actions</p>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleFlushCache} disabled={sweeping}
            className={cn('flex items-center gap-2 px-6 py-3.5 border text-sm font-semibold   transition-all active:scale-95 disabled:opacity-40',
              dark ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100')}>
            {sweeping ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            Flush Cache
          </button>
          <button onClick={handleMediaSweep} disabled={sweeping}
            className={cn('flex items-center gap-2 px-6 py-3.5 border text-sm font-semibold   transition-all active:scale-95 disabled:opacity-40',
              dark ? 'bg-z-active-bg text-z-active-text border-z-active-border hover:bg-z-active-bg' : 'bg-[var(--z-bg-hover)] text-z-primary border-z-border hover:bg-[var(--z-border)]')}>
            {sweeping ? <Loader2 size={13} className="animate-spin" /> : <Scan size={13} />}
            Sweep Orphan Media
          </button>
          <button onClick={fetchSlowQueries} disabled={slowQueriesLoading}
            className={cn('flex items-center gap-2 px-6 py-3.5 border text-sm font-semibold   transition-all active:scale-95 disabled:opacity-40',
              dark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100')}>
            {slowQueriesLoading ? <Loader2 size={13} className="animate-spin" /> : <TrendingUp size={13} />}
            Analyze Slow Queries
          </button>
        </div>
      </div>

      {/* Slow Queries */}
      {slowQueries.length > 0 && (
        <div className={cn(card, 'overflow-hidden')}>
          <div className="p-4 border-b" style={{ borderColor: 'var(--z-border)' }}>
            <p className="text-sm font-semibold text-amber-400">Slow Query Analysis</p>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--z-border)' }}>
            {slowQueries.slice(0, 5).map((q, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3">
                <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-mono truncate', 'text-z-secondary')}>{q.query || q.command || 'Unknown query'}</p>
                  <p className="text-sm text-z-secondary">{q.collection || q.table}</p>
                </div>
                <span className="text-sm font-semibold text-amber-400 shrink-0">{q.millis || q.duration}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsDatabase
