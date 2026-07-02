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
    if (!options.yes) {
      const e = await question("? Admin email: "); if (e) adminEmail = e
      const p = await question("? Admin password: "); if (p) adminPassword = p
    }
    
    fs.mkdirSync(projectPath, { recursive: true })
    
    const pkg = { 
      name: path.basename(projectPath), 
      version: "0.1.0", 
      private: true, 
      type: "module", 
      scripts: { dev: "tsx server.ts", build: "tsc", start: "node dist/server.js" }, 
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
import config from './zenith.config.js'

const app = new Zenith({ config, port: Number(process.env.PORT) || 3000 })
await app.start()
`
    fs.writeFileSync(path.join(projectPath, "server.ts"), serverTs)
    
    const configTs = `import type { CMSConfig } from '@zenith-open/zenithcms-types'

const config: CMSConfig = {
  collections: [
    {
      name: 'Post',
      slug: 'posts',
      fields: [
        { name: 'title', type: 'text', required: true }
      ]
    }
  ]
}

export default config
`
    fs.writeFileSync(path.join(projectPath, "zenith.config.ts"), configTs)
    
    const tsconfig = { 
      compilerOptions: { target: "ES2022", module: "NodeNext", moduleResolution: "NodeNext", esModuleInterop: true, strict: true, skipLibCheck: true, outDir: "./dist" }, 
      include: ["**/*.ts"] 
    }
    fs.writeFileSync(path.join(projectPath, "tsconfig.json"), JSON.stringify(tsconfig, null, 2))
    
    const rand = () => Math.random().toString(36).substring(2,14)
    fs.writeFileSync(path.join(projectPath, ".env"), ["PORT=3000","JWT_SECRET=z_"+rand(),"COOKIE_SECRET=z_"+rand(),"INITIAL_ADMIN_EMAIL="+adminEmail,"INITIAL_ADMIN_PASSWORD="+adminPassword,"DATABASE_URL=mongodb://localhost:27017/zenith","DATABASE_TYPE=mongodb"].join("\n"))
    
    fs.writeFileSync(path.join(projectPath, ".gitignore"), "node_modules\ndist\n.env\n*.log\n")
    fs.writeFileSync(path.join(projectPath, "README.md"), "# "+path.basename(projectPath)+"\n\npnpm install && pnpm dev\n\nAdmin: http://localhost:3000/admin\n")
    
    clearInterval(spinner)
    process.stdout.write(`\r${chalk.green("✔")} Scaffold Zenith CMS architecture...\n\n`)

    console.log(chalk.cyan("📦 Installing dependencies... This may take a minute."))
    try {
      execSync("npm install", { stdio: "inherit", cwd: projectPath })
    } catch (e) {
      console.log(chalk.red("Failed to install dependencies automatically. You can run 'npm install' manually."))
    }

    console.log("\n" + chalk.bold.green("✨ Project created successfully in " + chalk.cyan(targetDir) + "!\n"))
    console.log("Next steps:")
    console.log(chalk.cyan(`  cd ${targetDir}`))
    console.log(chalk.cyan(`  npm run dev`))
    console.log("")
  })

program.parse()
