/**
 * Zenith UI Plugin Registry
 *
 * This is the central hub for all UI plugins. A plugin package registers
 * itself here with its routes, sidebar items, and settings tabs.
 *
 * USAGE (from a plugin's index.ts):
 *
 *   import { pluginRegistry } from '@zenith-open/zenithcms-admin/plugin-registry'
 *   pluginRegistry.register({
 *     id: 'my-plugin',
 *     name: 'My Plugin',
 *     routes: [{ path: '/my-plugin', component: () => import('./MyPage') }],
 *     sidebarItems: [{ label: 'My Feature', path: '/my-plugin', icon: 'Puzzle' }],
 *   })
 *
 * INTERNAL USAGE (in App.tsx):
 *
 *   import { pluginRegistry } from './lib/plugin-registry'
 *   const routes = pluginRegistry.getRoutes()
 *   const sidebarItems = pluginRegistry.getSidebarItems()
 */

export interface ZenithPluginRoute {
  path: string
  /** Lazy-loaded React component, e.g. () => import('./MyPage') */
  component: () => Promise<{ default: React.ComponentType<any> }>
  /** Whether the route requires authentication (default: true) */
  protected?: boolean
}

export interface ZenithPluginSidebarItem {
  label: string
  path: string
  /** lucide-react icon name (string) or React node */
  icon?: string | React.ReactNode
  group?: string
  order?: number
}

export interface ZenithPluginSettingsTab {
  id: string
  label: string
  icon?: React.ReactNode
  component: React.ComponentType<any>
}

export interface ZenithUIPlugin {
  id: string
  name: string
  version?: string
  routes?: ZenithPluginRoute[]
  sidebarItems?: ZenithPluginSidebarItem[]
  settingsTabs?: ZenithPluginSettingsTab[]
}

class PluginRegistry {
  private plugins = new Map<string, ZenithUIPlugin>()

  /**
   * Register a UI plugin. Called by plugin packages at module init time.
   * Safe to call multiple times â€” duplicate IDs are de-duped with a warning.
   */
  register(plugin: ZenithUIPlugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`[ZenithRegistry] Plugin "${plugin.id}" is already registered. Skipping duplicate.`)
      return
    }
    this.plugins.set(plugin.id, plugin)
    if (import.meta.env.DEV) {
      console.log(`[ZenithRegistry] âœ“ Plugin registered: ${plugin.name} (${plugin.id})`)
    }
  }

  /** Unregister a plugin (useful for hot-reload in dev) */
  unregister(pluginId: string): void {
    this.plugins.delete(pluginId)
  }

  /** Get all registered plugins */
  getAll(): ZenithUIPlugin[] {
    return Array.from(this.plugins.values())
  }

  /** Collect all routes from all registered plugins */
  getRoutes(): ZenithPluginRoute[] {
    return this.getAll().flatMap((p) => p.routes ?? [])
  }

  /** Collect all sidebar items from all registered plugins, sorted by order */
  getSidebarItems(): ZenithPluginSidebarItem[] {
    return this.getAll()
      .flatMap((p) => p.sidebarItems ?? [])
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
  }

  /** Collect all settings tabs from all registered plugins */
  getSettingsTabs(): ZenithPluginSettingsTab[] {
    return this.getAll().flatMap((p) => p.settingsTabs ?? [])
  }

  /** Check if a plugin is registered */
  isRegistered(pluginId: string): boolean {
    return this.plugins.has(pluginId)
  }

  /** Get plugin by ID */
  get(pluginId: string): ZenithUIPlugin | undefined {
    return this.plugins.get(pluginId)
  }
}

/** Global singleton registry â€” import this anywhere to register or read plugins */
export const pluginRegistry = new PluginRegistry()

// â”€â”€ Auto-discovery: import known workspace plugins if they are installed â”€â”€â”€â”€â”€â”€â”€â”€
// Each plugin self-registers in its own index.ts. We attempt to import them here.
// If a package is not installed, the dynamic import fails silently.
const WORKSPACE_PLUGINS = [
  '@zenith-open/zenithcms-plugin-workflows-ui',
  '@zenith-open/zenithcms-plugin-ai-architect-ui',
  '@zenith-open/zenithcms-plugin-multiplayer-crdt',
]

for (const pkg of WORKSPACE_PLUGINS) {
  import(pkg).catch(() => {
    // Plugin not installed â€” this is expected and intentional (Zero-Bloat)
    // No noise in production logs
  })
}

