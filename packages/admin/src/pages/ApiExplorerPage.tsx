import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Braces, Code, Copy, Check, ExternalLink, RefreshCw, Globe, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { cn } from '../lib/utils'
import { useTheme } from '../context/ThemeContext'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent } from '../components/ui/Card'
import { useTenantStore } from '../lib/tenantStore'
import api from '../lib/api'

const METHOD_COLORS: Record<string, string> = {
  get:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  post:   'bg-sky-500/10 text-sky-400 border-sky-500/20',
  put:    'bg-amber-500/10 text-amber-400 border-amber-500/20',
  patch:  'bg-violet-500/10 text-violet-400 border-violet-500/20',
  delete: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export default function ApiExplorerPage() {
  const [activeTab, setActiveTab] = useState<'graphql' | 'rest'>('graphql')
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const token = useTenantStore((s) => s.token)

  // REST inline spec state
  const [restSpec, setRestSpec] = useState<any>(null)
  const [restLoading, setRestLoading] = useState(false)
  const [restError, setRestError] = useState<string | null>(null)
  const [expandedPath, setExpandedPath] = useState<string | null>(null)

  const graphqlUrl = `${import.meta.env.VITE_API_URL || '/api/v1'}`.replace('/api/v1', '/graphql')
  const restDocsUrl = `${import.meta.env.VITE_API_URL || '/api/v1'}`.replace('/api/v1', '/api/docs')

  const fetchRestSpec = useCallback(async () => {
    setRestLoading(true)
    setRestError(null)
    try {
      const res = await api.get('/system/openapi.json')
      setRestSpec(res.data)
    } catch {
      setRestError('Could not load API schema. Make sure the backend server is running.')
    } finally {
      setRestLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'rest' && !restSpec) fetchRestSpec()
  }, [activeTab, restSpec, fetchRestSpec])

  const handleCopy = (url: string, type: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(type)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  // Securely pass token to the iframe via postMessage after it loads
  const handleIframeLoad = () => {
    if (iframeRef.current?.contentWindow && token) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'ZENITH_AUTH_TOKEN', token },
        '*'
      )
    }
  }

  // Version-pinned CDN resources for security and stability
  const GRAPHIQL_VERSION = '3.7.1'
  const REACT_VERSION = '18.3.1'

  const graphiqlHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>GraphiQL</title>
      <style>
        body { margin: 0; width: 100%; height: 100%; overflow: hidden; }
        #graphiql { height: 100vh; }
      </style>
      <link rel="stylesheet" href="https://unpkg.com/graphiql@${GRAPHIQL_VERSION}/graphiql.min.css" />
    </head>
    <body class="${dark ? 'graphiql-dark' : 'graphiql-light'}">
      <div id="graphiql">Loading...</div>
      <script src="https://unpkg.com/react@${REACT_VERSION}/umd/react.production.min.js" crossorigin></script>
      <script src="https://unpkg.com/react-dom@${REACT_VERSION}/umd/react-dom.production.min.js" crossorigin></script>
      <script src="https://unpkg.com/graphiql@${GRAPHIQL_VERSION}/graphiql.min.js" crossorigin></script>
      <script>
        let authToken = '';

        window.addEventListener('message', function(event) {
          if (event.data && event.data.type === 'ZENITH_AUTH_TOKEN') {
            authToken = event.data.token || '';
            renderGraphiQL();
          }
        });

        function renderGraphiQL() {
          const fetcher = GraphiQL.createFetcher({
            url: '${graphqlUrl}',
            headers: { 'Authorization': 'Bearer ' + authToken }
          });
          const root = ReactDOM.createRoot(document.getElementById('graphiql'));
          root.render(React.createElement(GraphiQL, { fetcher: fetcher }));
        }

        renderGraphiQL();
      </script>
    </body>
    </html>
  `

  return (
    <div className="flex-1 overflow-y-auto bg-z-body text-z-text">
      <PageHeader
        title="API Explorer"
        description="Test and discover GraphQL and REST API endpoints instantly."
        icon={<Terminal size={24} />}
        breadcrumbs={[{ label: 'Development', path: '/api-explorer' }, { label: 'API Explorer' }]}
        actions={
          <div className="flex bg-z-input border border-z-border p-1 rounded-none-none">
            <button
              onClick={() => setActiveTab('graphql')}
              className={cn(
                'flex items-center gap-2 px-4 py-1.5 text-sm font-semibold transition-all',
                activeTab === 'graphql'
                  ? 'bg-z-panel text-z-primary shadow-sm border border-z-border'
                  : 'text-z-secondary hover:text-z-primary border border-transparent'
              )}
            >
              <Braces size={14} /> GraphQL
            </button>
            <button
              onClick={() => setActiveTab('rest')}
              className={cn(
                'flex items-center gap-2 px-4 py-1.5 text-sm font-semibold transition-all',
                activeTab === 'rest'
                  ? 'bg-z-panel text-z-primary shadow-sm border border-z-border'
                  : 'text-z-secondary hover:text-z-primary border border-transparent'
              )}
            >
              <Code size={14} /> REST API
            </button>
          </div>
        }
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <span className={cn('w-2 h-2 rounded-full', activeTab === 'graphql' ? 'bg-pink-500' : 'bg-emerald-500')} />
                {activeTab === 'graphql' ? 'GraphQL Endpoint' : 'REST API Explorer'}
              </h3>
              <p className="text-xs text-z-secondary mt-1">
                {activeTab === 'graphql'
                  ? 'Queries, Mutations, and automatic Schema Introspection via the Neural Schema Orchestrator.'
                  : 'All collection endpoints auto-discovered from your active schema. Click an endpoint to expand.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <code className={cn('px-3 py-1.5 border text-xs font-mono font-medium', dark ? 'bg-app border-z-border text-z-primary' : 'bg-z-body border-z-border text-z-primary')}>
                {activeTab === 'graphql' ? graphqlUrl : restDocsUrl}
              </code>
              <button
                onClick={() => handleCopy(activeTab === 'graphql' ? graphqlUrl : restDocsUrl, activeTab)}
                className="p-1.5 border border-z-border hover:bg-z-hover text-z-secondary hover:text-z-primary transition-colors"
                title="Copy URL"
              >
                {copiedUrl === activeTab ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
              <a
                href={activeTab === 'graphql' ? graphqlUrl : restDocsUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 border border-z-border hover:bg-z-hover text-z-secondary hover:text-z-primary transition-colors"
                title="Open in new tab"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col overflow-hidden" style={{ minHeight: '600px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="flex-1 w-full"
              style={{ minHeight: '600px' }}
            >
              {activeTab === 'graphql' ? (
                <iframe
                  ref={iframeRef}
                  title="GraphQL Playground"
                  srcDoc={graphiqlHTML}
                  className="w-full border-none bg-white"
                  style={{ height: '700px' }}
                  sandbox="allow-scripts allow-same-origin"
                  onLoad={handleIframeLoad}
                />
              ) : (
                /* ── Inline REST endpoint explorer ── */
                <div className="overflow-y-auto p-6 space-y-4" style={{ maxHeight: '700px' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-z-primary">REST Endpoints</h3>
                      <p className="text-xs text-z-secondary mt-0.5">
                        {restSpec ? `${Object.keys(restSpec.paths || {}).length} paths • Click to expand` : 'Fetching from server…'}
                      </p>
                    </div>
                    <button
                      onClick={fetchRestSpec}
                      disabled={restLoading}
                      className="p-2 border border-z-border hover:bg-z-hover text-z-secondary hover:text-z-primary transition-colors"
                      title="Reload schema"
                    >
                      <RefreshCw size={13} className={restLoading ? 'animate-spin' : ''} />
                    </button>
                  </div>

                  {restLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                      <Loader2 size={28} className="animate-spin text-z-secondary" />
                      <p className="text-sm text-z-secondary">Loading API schema…</p>
                    </div>
                  ) : restError ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                      <div className={cn('w-14 h-14 flex items-center justify-center border', dark ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-200')}>
                        <Globe size={24} className="text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-z-primary">Schema unavailable</p>
                        <p className="text-xs text-z-secondary mt-1 max-w-xs">{restError}</p>
                      </div>
                      <button
                        onClick={fetchRestSpec}
                        className="flex items-center gap-2 px-4 py-2 border border-z-border hover:border-z-active-border hover:bg-z-hover text-sm font-semibold text-z-secondary hover:text-z-primary transition-all"
                      >
                        <RefreshCw size={12} /> Retry
                      </button>
                    </div>
                  ) : restSpec ? (
                    <div className="space-y-1.5">
                      {Object.entries(restSpec.paths || {}).map(([path, methods]: [string, any]) => (
                        <div key={path} className={cn('border overflow-hidden', dark ? 'border-z-border' : 'border-z-border')}>
                          <button
                            onClick={() => setExpandedPath(expandedPath === path ? null : path)}
                            className={cn(
                              'w-full flex items-center justify-between px-4 py-3 transition-colors text-left gap-3',
                              dark ? 'hover:bg-z-hover' : 'hover:bg-z-input'
                            )}
                          >
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                              {Object.keys(methods).map(method => (
                                <span
                                  key={method}
                                  className={cn('px-1.5 py-0.5 text-xs font-bold font-mono border uppercase shrink-0', METHOD_COLORS[method] || 'text-z-secondary border-z-border bg-z-hover')}
                                >
                                  {method}
                                </span>
                              ))}
                              <code className="text-xs font-mono text-z-primary truncate">{path}</code>
                            </div>
                            <div className="shrink-0 text-z-secondary">
                              {expandedPath === path ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </div>
                          </button>
                          <AnimatePresence>
                            {expandedPath === path && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="overflow-hidden"
                              >
                                <div className={cn('px-4 pb-4 pt-3 space-y-3 border-t', dark ? 'border-z-border bg-z-hover/20' : 'border-z-border bg-z-input/30')}>
                                  {Object.entries(methods).map(([method, op]: [string, any]) => (
                                    <div key={method} className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className={cn('px-1.5 py-0.5 text-xs font-bold font-mono border uppercase shrink-0', METHOD_COLORS[method] || 'text-z-secondary border-z-border')}>
                                          {method}
                                        </span>
                                        <span className="text-sm font-semibold text-z-primary">{op.summary}</span>
                                      </div>
                                      {op.parameters && op.parameters.length > 0 && (
                                        <div className="ml-14 flex flex-wrap gap-1 text-xs">
                                          <span className="text-z-secondary">Params:</span>
                                          {op.parameters.map((p: any) => (
                                            <code key={p.name} className={cn('px-1.5 py-0.5 border font-mono', dark ? 'bg-z-panel border-z-border text-z-primary' : 'bg-white border-z-border text-z-primary')}>
                                              {p.name}
                                              {p.required && <span className="text-red-400 ml-0.5">*</span>}
                                            </code>
                                          ))}
                                        </div>
                                      )}
                                      {op.responses && (
                                        <div className="ml-14 flex gap-1 text-xs">
                                          <span className="text-z-secondary">Responses:</span>
                                          {Object.keys(op.responses).map(code => (
                                            <span key={code} className={cn('px-1.5 py-0.5 border font-mono font-bold',
                                              code.startsWith('2') ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 'text-amber-400 border-amber-500/20 bg-amber-500/10'
                                            )}>{code}</span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </Card>
      </div>
    </div>
  )
}
