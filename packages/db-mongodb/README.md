# @zenith-open/zenithcms-db-mongodb

The officially supported MongoDB persistence adapter for Zenith CMS.

## Overview

Zenith CMS decouples business logic from database interactions via the `DatabaseAdapter` interface. This package implements that interface using Mongoose, dynamically translating your `cms.config.ts` into native Mongoose Schemas.

## Installation

```bash
pnpm add @zenith-open/zenithcms-db-mongodb
```

## Usage

When booting the `ZenithEngine`, pass an instance of the `MongooseAdapter`.

```typescript
import { ZenithEngine } from '@zenith-open/zenithcms-core'
import { MongooseAdapter } from '@zenith-open/zenithcms-db-mongodb'
import config from './cms.config'

const engine = new ZenithEngine({
  config,
  adapter: new MongooseAdapter({ uri: process.env.MONGODB_URI }),
  port: 3000
})

engine.start()
```
