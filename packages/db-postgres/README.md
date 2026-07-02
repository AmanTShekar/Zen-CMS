# @zenith-open/zenithcms-db-postgres

The officially supported PostgreSQL persistence adapter for Zenith CMS, utilizing the Drizzle ORM layer.

## Overview

Zenith CMS decouples business logic from database interactions via the `DatabaseAdapter` interface. This package implements that interface using Drizzle ORM, automatically mapping your `cms.config.ts` into strongly typed, highly optimized PostgreSQL tables.

## Installation

```bash
pnpm add @zenith-open/zenithcms-db-postgres
```

## Usage

When booting the `ZenithEngine`, pass an instance of the `PostgresAdapter`.

```typescript
import { ZenithEngine } from '@zenith-open/zenithcms-core'
import { PostgresAdapter } from '@zenith-open/zenithcms-db-postgres'
import config from './cms.config'

const engine = new ZenithEngine({
  config,
  adapter: new PostgresAdapter({ uri: process.env.POSTGRES_URI }),
  port: 3000
})

engine.start()
```
