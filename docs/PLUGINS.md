# Zenith CMS — Plugin Architecture

Zenith CMS features a powerful, lifecycle-based Plugin API. Plugins allow developers to modify schemas, register custom endpoints, inject React components into the Admin UI, and hook into database operations—all without modifying the core codebase.

---

## 1. The Anatomy of a Plugin

A plugin is a TypeScript object that implements the `ZenithPlugin` interface defined in `@zenith-open/zenithcms-types`.

```typescript
import type { ZenithPlugin, CMSConfig, PluginContext } from '@zenith-open/zenithcms-types'

export const myCustomPlugin: ZenithPlugin = {
  id: 'acme-custom-plugin',
  name: 'Acme Enhancements',
  version: '1.0.0',
  
  // 1. Schema Mutation Phase
  apply: (config: CMSConfig) => {
    // Modify and return the CMS config (add collections, globals, fields)
    return {
      ...config,
      collections: [
        ...config.collections,
        {
          name: 'Acme Logs',
          slug: 'acme-logs',
          fields: [{ name: 'message', type: 'text' }]
        }
      ]
    }
  },

  // 2. Lifecycle Phase: Initialization
  onInit: async (ctx: PluginContext) => {
    ctx.logger.info('Acme Plugin initializing...')
    
    // Register custom Express routes
    const app = ctx.app as any; 
    app.get('/api/acme/status', (req, res) => res.json({ ok: true }))
  },

  // 3. Lifecycle Phase: Ready
  onReady: async (ctx: PluginContext) => {
    ctx.logger.info('Engine is listening. Acme plugin active.')
  }
}
```

---

## 2. Installing & Registering Plugins

Zenith plugins are distributed as standard NPM packages. You can find official plugins on the NPM registry under the `@zenith-open` scope, or community plugins via standard NPM search. 

Alternatively, you can create local monorepo plugins by placing them in the `packages/` directory and utilizing `pnpm` workspace linking.

### Step 1: Installation
To install a remote plugin from NPM (e.g., `@zenith-open/plugin-email`), install it into the root of your monorepo workspace using `pnpm`:

```bash
pnpm add @zenith-open/plugin-email -w
```

### Step 2: Engine Registration
Plugins must be registered in your root `cms.config.ts` file so they are injected into the core engine during boot.

```typescript
import { CMSConfig } from '@zenith-open/zenithcms-types'
import { EmailPlugin } from '@zenith-open/plugin-email'

const config: CMSConfig = {
  collections: [],
  plugins: [
    EmailPlugin({
      provider: 'resend',
      defaultFrom: 'noreply@zenith.dev'
    })
  ]
}

export default config
```

### Step 3: Admin UI Activation
Once registered in code, the plugin will automatically appear in the Admin Dashboard under **Settings > Plugins**.
- Navigate to the **Plugins** tab in the Admin UI.
- Toggle the plugin to **Enabled**.
- Configure any required secrets (like API keys) directly in the UI. The core engine will automatically hot-reload the plugin's internal state.

---

## 3. The `PluginContext`

During the `onInit`, `onReady`, and `onDestroy` lifecycle methods, your plugin is provided with a `PluginContext` object.

| Property | Type | Description |
|---|---|---|
| `app` | `Express` | The underlying Express.js application. Use this to mount custom REST endpoints or middleware. |
| `adapter` | `DatabaseAdapter` | The active database adapter (Mongoose or Drizzle). Allows direct database queries circumventing the standard API. |
| `config` | `CMSConfig` | The finalized CMS configuration after all plugins have run their `apply` methods. |
| `logger` | `Logger` | Zenith's internal Pino logger. Use this instead of `console.log` for consistent formatting. |

---

## 4. Admin UI Injection (Advanced)

While the Core API handles data, Plugins often need to inject UI into the React Admin application.

Because Zenith is a headless system where the Core and Admin run as separate Vite/Express processes, UI injection is handled via **Component Overrides** in the Admin package's entry point, rather than the backend Plugin API.

If you are developing a plugin that requires UI changes (e.g., adding a custom field type):
1. Build your backend logic using the `ZenithPlugin` interface.
2. Provide instructions for developers to register your React components in their Admin UI's `main.tsx` or field registry.

*(Note: Dynamic remote module federation for Admin UI plugins is on the roadmap for a future release).*
`

## Official Plugins Directory

Zenith CMS provides a robust suite of officially maintained plugins. To install any of these plugins, use the `pnpm add <package-name> -w` command at the root of your workspace.

### 1. Artificial Intelligence

#### `@zenith-open/zenithcms-plugin-ai-anthropic`
**Anthropic AI SDK Integration**
* **Features**: Seamless integration with Claude 3 Opus and Sonnet models, context-aware text generation, and deep integration with the rich text editor for content suggestions.
* **Installation**: 
  ```bash
  pnpm add @zenith-open/zenithcms-plugin-ai-anthropic -w
  ```

#### `@zenith-open/zenithcms-plugin-ai-architect`
**AI Architect Core Engine**
* **Features**: The core LLM orchestration layer. Manages prompt templates, context window injection, and handles rate limiting and token optimization across AI models.
* **Installation**: 
  ```bash
  pnpm add @zenith-open/zenithcms-plugin-ai-architect -w
  ```

#### `@zenithcms/plugin-ai-architect-ui`
**AI Copilot and SEO Architect UI**
* **Features**: Injects React components into the Admin UI to provide a persistent AI Copilot sidebar. Includes one-click SEO metadata generation and content tone adjustment tools.
* **Installation**: 
  ```bash
  pnpm add @zenithcms/plugin-ai-architect-ui -w
  ```

### 2. Search & Indexing

#### `@zenith-open/zenithcms-plugin-algolia`
**Algolia Search Engine Integration**
* **Features**: Automatic real-time synchronization of Zenith documents to Algolia indices. Supports field mapping, facet generation, and instant search API endpoints for frontend clients.
* **Installation**: 
  ```bash
  pnpm add @zenith-open/zenithcms-plugin-algolia -w
  ```

### 3. Authentication & SSO

#### `@zenith-open/zenithcms-plugin-auth-github`
**GitHub OAuth Strategy**
* **Features**: Single Sign-On (SSO) integration via GitHub. Enables automatic user provisioning and maps GitHub organizations to Zenith roles.
* **Installation**: 
  ```bash
  pnpm add @zenith-open/zenithcms-plugin-auth-github -w
  ```

#### `@zenith-open/zenithcms-plugin-auth-google`
**Google OAuth Strategy**
* **Features**: Secure SSO with Google Workspace. Supports strict domain restrictions to ensure only authorized corporate accounts can access the CMS.
* **Installation**: 
  ```bash
  pnpm add @zenith-open/zenithcms-plugin-auth-google -w
  ```

#### `@zenith-open/zenithcms-plugin-auth-saml`
**Enterprise SAML 2.0 Integration**
* **Features**: Enterprise-grade identity federation. Seamlessly integrates with Active Directory, Okta, and Auth0. Supports Just-In-Time (JIT) provisioning and strict security enforcement.
* **Installation**: 
  ```bash
  pnpm add @zenith-open/zenithcms-plugin-auth-saml -w
  ```

### 4. Storage & Media

#### `@zenith-open/zenithcms-plugin-cloudinary`
**Cloudinary Media Adapter**
* **Features**: Direct-to-Cloudinary image and video uploads. Supports automatic transformations (resizing, cropping), WebP optimization, and global CDN delivery.
* **Installation**: 
  ```bash
  pnpm add @zenith-open/zenithcms-plugin-cloudinary -w
  ```

#### `@zenith-open/zenithcms-plugin-storage-azure`
**Azure Blob Storage Adapter**
* **Features**: Secure asset storage in Microsoft Azure. Supports direct uploads, secure SAS token generation, and geo-redundant storage configurations.
* **Installation**: 
  ```bash
  pnpm add @zenith-open/zenithcms-plugin-storage-azure -w
  ```

#### `@zenith-open/zenithcms-plugin-storage-gcs`
**Google Cloud Storage Adapter**
* **Features**: High-throughput media serving via GCP. Includes signed URL generation for private assets and strict IAM role integration.
* **Installation**: 
  ```bash
  pnpm add @zenith-open/zenithcms-plugin-storage-gcs -w
  ```

#### `@zenith-open/zenithcms-plugin-storage-s3`
**AWS S3 & Cloudflare R2 Adapter**
* **Features**: S3-compatible API support. Enables multipart uploads for massive files and integrates seamlessly with edge caching solutions like Cloudflare.
* **Installation**: 
  ```bash
  pnpm add @zenith-open/zenithcms-plugin-storage-s3 -w
  ```

### 5. Email & Communication

#### `@zenith-open/zenithcms-plugin-email`
**Core Email Engine**
* **Features**: A unified email transmission API supporting standard SMTP connections. Includes a built-in template renderer for transactional emails (e.g., password resets).
* **Installation**: 
  ```bash
  pnpm add @zenith-open/zenithcms-plugin-email -w
  ```

#### `@zenith-open/zenithcms-plugin-email-resend`
**Resend API Integration**
* **Features**: High-deliverability transactional email via the Resend API. Supports webhook bounce tracking and detailed delivery analytics.
* **Installation**: 
  ```bash
  pnpm add @zenith-open/zenithcms-plugin-email-resend -w
  ```

### 6. Collaboration & Workflows

#### `@zenithcms/plugin-multiplayer-crdt`
**Yjs CRDT Real-time Multiplayer**
* **Features**: Enables Google Docs-style collaborative editing within Zenith. Provides live presence cursors, offline sync resolution, and conflict-free rich text editing.
* **Installation**: 
  ```bash
  pnpm add @zenithcms/plugin-multiplayer-crdt -w
  ```

#### `@zenithcms/plugin-workflows-ui`
**Visual Workflow Automation**
* **Features**: A drag-and-drop node-based workflow builder. Allows admins to map triggers to actions, define state transitions, and automate content publication pipelines.
* **Installation**: 
  ```bash
  pnpm add @zenithcms/plugin-workflows-ui -w
  ```

### 7. Commerce

#### `@zenith-open/zenithcms-plugin-payments-stripe`
**Stripe Payments Integration**
* **Features**: Handles subscription webhooks, one-time checkouts, and customer synchronization directly within the CMS data layer.
* **Installation**: 
  ```bash
  pnpm add @zenith-open/zenithcms-plugin-payments-stripe -w
  ```
