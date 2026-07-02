# @zenith-open/zenithcms-admin

The strictly decoupled React 18 Single Page Application (SPA) that serves as the administrative control plane for the Zenith CMS ecosystem.

## Overview

Unlike traditional monolithic CMS platforms, Zenith's Admin UI is completely headless. It communicates with `@zenith-open/zenithcms-core` exclusively via REST and GraphQL. This allows you to host the Admin UI anywhere (Vercel, Netlify, AWS S3, etc.) independently of your backend infrastructure.

## Installation & Bootstrapping

The Admin UI is bundled as an NPM package, but it is typically initialized within the standard monorepo scaffolding.

### Development Mode
```bash
# Start the Vite development server (usually orchestrated via turborepo at the root)
pnpm dev --filter @zenith-open/zenithcms-admin
```

### Production Build
```bash
# Compiles the React SPA into the dist/ directory for static hosting
pnpm build
```

## Environment Configuration

Because this is a static SPA, all environment variables must be exposed to Vite at build time using the `VITE_` prefix.

| Variable | Description |
|---|---|
| `VITE_API_URL` | The fully qualified URL of the core backend (e.g., `https://api.zenith.dev`) |
| `VITE_TELEMETRY_ENABLED` | Set to `false` to disable anonymous usage telemetry |

## Injecting Custom Components

If you are developing a plugin that requires injecting React components (such as custom Field Types or Dashboard Widgets) into the UI, you must register them in your project's `main.tsx` payload via the `ComponentRegistry`:

```tsx
import { ComponentRegistry } from '@zenith-open/zenithcms-admin'
import { MyCustomField } from './plugins/my-custom-field'

ComponentRegistry.registerField('acme-color-picker', MyCustomField)
```
