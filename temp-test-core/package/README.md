# @zenith-open/zenithcms-core

The headless engine and dynamic router of the Zenith CMS ecosystem.

## Overview

The Core package translates strictly typed configuration files (`cms.config.ts`) into highly optimized Express REST APIs, GraphQL nodes, and Database schemas. It handles security validation, real-time collaboration via WebSockets, webhook dispatching, and dynamic media processing.

## Installation

```bash
pnpm add @zenith-open/zenithcms-core
```

## Initializing the Engine

You can initialize Zenith within any standard Express application. This allows you to mount the CMS engine onto a specific route, leaving you free to write custom Express handlers alongside it.

```typescript
import express from 'express'
import { ZenithEngine } from '@zenith-open/zenithcms-core'
import config from './cms.config'

const app = express()

const engine = new ZenithEngine({
  config,
  port: 3000,
  cors: { origins: ['http://localhost:5173'] }
})

// The engine orchestrates the database connection and injects the dynamic routes
engine.start().then(() => {
  // Zenith dynamically binds its middleware to engine.app
  app.use('/api/v1', engine.app)
  
  app.listen(3000, () => {
    console.log('Zenith Engine is online at port 3000')
  })
})
```

## Features
- **Ahead-of-Time (AOT) Routing**: Synthesizes routes based on your declarative schema config.
- **Role-Based Access Control**: Granular access down to the field level.
- **Local API**: A high-performance internal API bypass (`engine.local.find()`) that skips HTTP serialization overhead for custom middleware.
