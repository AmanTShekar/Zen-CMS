# @zenith-open/zenithcms-types

The single source of truth for the Zenith CMS ecosystem architecture.

## Overview

This package exposes the underlying Zod interfaces and TypeScript contracts utilized by both the backend engine (`core`), the Database Adapters (`db-mongodb`, `db-postgres`), and the frontend SPA (`admin`). 

By isolating all core typings into a standalone package, Zenith guarantees absolute parity between schema declaration (the backend contract) and schema consumption (the frontend UI).

## Installation

```bash
pnpm add -D @zenith-open/zenithcms-types
```

## Usage

When developing plugins or creating custom endpoints, always rely on the strongly typed interfaces exported by this package.

```typescript
import type { CMSConfig, CollectionSchema, Field, ZenithPlugin, PluginContext } from '@zenith-open/zenithcms-types'

const myPlugin: ZenithPlugin = {
  id: 'my-custom-plugin',
  name: 'Enhancements',
  version: '1.0.0',
  apply: (config: CMSConfig) => {
    return config;
  }
}
```
