#!/usr/bin/env node
import { Command } from "commander"
import chalk from "chalk"
import path from "path"
import fs from "fs"
import { execSync } from "child_process"
import readline from "readline"

const program = new Command()

const question = (query: string): Promise<string> => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => rl.question(query, (ans) => { rl.close(); resolve(ans.trim()) }))
}

program
  .name("create-zenithcms-app")
  .description("Bootstrap a new Zenith CMS project")
  .argument("[directory]", "Target directory")
  .option("-y, --yes", "Skip all prompts")
  .option("--install", "Auto-install deps")
  .action(async (directoryArg, options) => {
    let targetDir = directoryArg
    if (!targetDir) {
      targetDir = options.yes ? "my-zenith-cms" : await question("? Project name (my-zenith-cms): ")
      if (!targetDir) targetDir = "my-zenith-cms"
    }
    const projectPath = path.resolve(process.cwd(), targetDir)
    if (fs.existsSync(projectPath)) { console.error("Directory exists"); process.exit(1) }
    
    let adminEmail = "admin@example.com"
    let adminPassword = "password123"
    let templateType = '1'
    if (!options.yes) {
      const e = await question("? Admin email: "); if (e) adminEmail = e
      const p = await question("? Admin password: "); if (p) adminPassword = p
      const t = await question("? Choose template (1) Blank, (2) Blog, (3) E-Commerce [1]: ")
      if (t === '2' || t === '3') templateType = t
    }
    
    fs.mkdirSync(path.join(projectPath, "src/collections"), { recursive: true })
    
    const pkg = { 
      name: path.basename(projectPath), 
      version: "0.1.0", 
      private: true, 
      type: "module", 
      scripts: { dev: "tsx src/server.ts", build: "tsc", start: "node dist/server.js" }, 
      dependencies: { 
        "@zenith-open/zenithcms-core": "^1.0.0-beta.1", 
        "@zenith-open/zenithcms-admin": "^1.0.0-beta.1", 
        "@zenith-open/zenithcms-types": "^1.0.0-beta.1", 
        "@zenith-open/zenithcms-db-mongodb": "^1.0.0-beta.1", 
        tsx: "^4.19.0", 
        typescript: "^5.4.5" 
      } 
    }

    // Start loading animation
    const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
    let i = 0
    const spinner = setInterval(() => {
      process.stdout.write(`\r${chalk.cyan(frames[i])} Scaffold Zenith CMS architecture...`)
      i = (i + 1) % frames.length
    }, 80)

    // Simulate a slight delay so the user can enjoy the premium loading effect
    await new Promise(r => setTimeout(r, 1500))

    fs.writeFileSync(path.join(projectPath, "package.json"), JSON.stringify(pkg, null, 2))
    
    const serverTs = `import { Zenith } from '@zenith-open/zenithcms-core'
import { MongooseAdapter } from '@zenith-open/zenithcms-db-mongodb'
import config from './zenith.config.js'

async function start() {
  const cms = new Zenith({
    config,
    database: new MongooseAdapter(process.env.DATABASE_URL!)
  })
  await cms.start(parseInt(process.env.PORT || '3000'))
}
start().catch(console.error)
`
    fs.writeFileSync(path.join(projectPath, "src/server.ts"), serverTs)

    const usersCollection = `import type { CollectionConfig } from '@zenith-open/zenithcms-types'

export const Users: CollectionConfig = {
  name: 'User',
  slug: 'users',
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'role', type: 'select', options: ['admin', 'editor', 'user'], required: true, defaultValue: 'user' }
  ]
}
`
    fs.writeFileSync(path.join(projectPath, "src/collections/Users.ts"), usersCollection)

    let collectionsImports = `import { Users } from './collections/Users.js'`
    let collectionsArray = `Users`

    if (templateType === '2') {
      const postsCollection = `import type { CollectionConfig } from '@zenith-open/zenithcms-types'

export const Posts: CollectionConfig = {
  name: 'Post',
  slug: 'posts',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'content', type: 'richtext', required: true },
    { name: 'publishedAt', type: 'date' },
    { name: 'authors', type: 'relation', relationTo: 'users', hasMany: true },
    { name: 'categories', type: 'relation', relationTo: 'categories', hasMany: true },
    { name: 'status', type: 'select', options: ['draft', 'published'], defaultValue: 'draft' }
  ]
}
`
      fs.writeFileSync(path.join(projectPath, "src/collections/Posts.ts"), postsCollection)
      
      const catsCollection = `import type { CollectionConfig } from '@zenith-open/zenithcms-types'

export const Categories: CollectionConfig = {
  name: 'Category',
  slug: 'categories',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea' }
  ]
}
`
      fs.writeFileSync(path.join(projectPath, "src/collections/Categories.ts"), catsCollection)

      const mediaCollection = `import type { CollectionConfig } from '@zenith-open/zenithcms-types'

export const Media: CollectionConfig = {
  name: 'Media',
  slug: 'media',
  fields: [
    { name: 'alt', type: 'text', required: true },
    { name: 'url', type: 'text', required: true }
  ]
}
`
      fs.writeFileSync(path.join(projectPath, "src/collections/Media.ts"), mediaCollection)

      collectionsImports += `\nimport { Posts } from './collections/Posts.js'\nimport { Categories } from './collections/Categories.js'\nimport { Media } from './collections/Media.js'`
      collectionsArray += `,\n    Posts,\n    Categories,\n    Media`
    }

    if (templateType === '3') {
      const productsCollection = `import type { CollectionConfig } from '@zenith-open/zenithcms-types'

export const Products: CollectionConfig = {
  name: 'Product',
  slug: 'products',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'description', type: 'richtext' },
    { name: 'price', type: 'number', required: true },
    { name: 'inventory', type: 'number', defaultValue: 0 },
    { name: 'categories', type: 'relation', relationTo: 'categories', hasMany: true },
    { name: 'images', type: 'relation', relationTo: 'media', hasMany: true },
    { name: 'status', type: 'select', options: ['active', 'archived', 'draft'], defaultValue: 'draft' }
  ]
}
`
      fs.writeFileSync(path.join(projectPath, "src/collections/Products.ts"), productsCollection)

      const ordersCollection = `import type { CollectionConfig } from '@zenith-open/zenithcms-types'

export const Orders: CollectionConfig = {
  name: 'Order',
  slug: 'orders',
  fields: [
    { name: 'orderNumber', type: 'text', required: true },
    { name: 'total', type: 'number', required: true },
    { name: 'items', type: 'relation', relationTo: 'products', hasMany: true },
    { name: 'customer', type: 'relation', relationTo: 'users' },
    { name: 'status', type: 'select', options: ['pending', 'shipped', 'delivered', 'cancelled'], defaultValue: 'pending' }
  ]
}
`
      fs.writeFileSync(path.join(projectPath, "src/collections/Orders.ts"), ordersCollection)

      const catsCollection = `import type { CollectionConfig } from '@zenith-open/zenithcms-types'

export const Categories: CollectionConfig = {
  name: 'Category',
  slug: 'categories',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea' }
  ]
}
`
      fs.writeFileSync(path.join(projectPath, "src/collections/Categories.ts"), catsCollection)

      const mediaCollection = `import type { CollectionConfig } from '@zenith-open/zenithcms-types'

export const Media: CollectionConfig = {
  name: 'Media',
  slug: 'media',
  fields: [
    { name: 'alt', type: 'text', required: true },
    { name: 'url', type: 'text', required: true }
  ]
}
`
      fs.writeFileSync(path.join(projectPath, "src/collections/Media.ts"), mediaCollection)

      collectionsImports += `\nimport { Products } from './collections/Products.js'\nimport { Orders } from './collections/Orders.js'\nimport { Categories } from './collections/Categories.js'\nimport { Media } from './collections/Media.js'`
      collectionsArray += `,\n    Products,\n    Orders,\n    Categories,\n    Media`
    }

    const configTs = `import { buildConfig } from '@zenith-open/zenithcms-core'
${collectionsImports}

const config = buildConfig({
  admin: {
    user: 'users'
  },
  collections: [
    ${collectionsArray}
  ]
})

export default config
`
    fs.writeFileSync(path.join(projectPath, "src/zenith.config.ts"), configTs)
    
    const tsconfig = { 
      compilerOptions: { target: "ES2022", module: "NodeNext", moduleResolution: "NodeNext", esModuleInterop: true, strict: true, skipLibCheck: true, outDir: "./dist", rootDir: "./src" }, 
      include: ["src/**/*"] 
    }
    fs.writeFileSync(path.join(projectPath, "tsconfig.json"), JSON.stringify(tsconfig, null, 2))
    
    const rand = () => Math.random().toString(36).substring(2,14)
    fs.writeFileSync(path.join(projectPath, ".env"), ["PORT=3000","JWT_SECRET=z_"+rand(),"COOKIE_SECRET=z_"+rand(),"INITIAL_ADMIN_EMAIL="+adminEmail,"INITIAL_ADMIN_PASSWORD="+adminPassword,"DATABASE_URL=mongodb://localhost:27017/zenith","DATABASE_TYPE=mongodb"].join("\n"))
    
    fs.writeFileSync(path.join(projectPath, ".gitignore"), "node_modules\ndist\n.env\n*.log\n")
    fs.writeFileSync(path.join(projectPath, "README.md"), "# "+path.basename(projectPath)+"\n\nnpm run dev\n\nAdmin: http://localhost:3000/admin\n")
    
    clearInterval(spinner)
    process.stdout.write(`\r${chalk.green("✔")} Scaffold Zenith CMS architecture...\n\n`)

    const installSpinner = setInterval(() => {
      process.stdout.write(`\r${chalk.cyan(frames[i])} Installing dependencies (this may take a minute)...`)
      i = (i + 1) % frames.length
    }, 80)

    try {
      execSync("npm install --no-audit --no-fund --loglevel=error --silent", { stdio: "ignore", cwd: projectPath })
      clearInterval(installSpinner)
      process.stdout.write(`\r${chalk.green("✔")} Dependencies installed successfully!                   \n`)
    } catch (e) {
      clearInterval(installSpinner)
      process.stdout.write(`\r${chalk.red("✖")} Failed to install dependencies automatically.          \n`)
      console.log(chalk.red("You can run 'npm install' manually inside the folder."))
    }

    console.log("\n" + chalk.bold.green("✨ Project created successfully in " + chalk.cyan(targetDir) + "!\n"))
    console.log("Next steps:")
    console.log(chalk.cyan(`  cd ${targetDir}`))
    console.log(chalk.cyan(`  npm run dev`))
    console.log("")
  })

program.parse()
