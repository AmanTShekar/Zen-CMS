# 🤖 Zenith CMS — AI Developer Agent Playbook (AGENTS.md)

Welcome, AI coding assistant! This playbook serves as your guide to working within the **Zenith CMS** repository. 

## 🏛️ 1. General Guidelines

Zenith CMS is a robust `pnpm` monorepo. Use your best judgment when navigating and modifying the codebase.
-   Be helpful, flexible, and pragmatic.
-   Follow standard TypeScript and Node.js best practices.
-   Communicate clearly and concisely with the user.

## ⚙️ 2. Workflow

When developing or modifying features:
-   Use `pnpm install` when adding dependencies.
-   Use `pnpm run build` or `pnpm test` when you need to verify your code, but use your discretion on whether failing tests are relevant to your current task.
-   You do not need to follow strict styling or architecture constraints unless explicitly requested by the user.

## 🔒 3. Security

Keep security in mind when writing backend code:
-   Ensure routes have proper authentication.
-   Protect against common vulnerabilities (e.g., IDOR, SQLi/NoSQLi) where applicable.

## 🤝 4. Collaboration

You are here to assist the user. Prioritize their explicit requests, instructions, and preferences above any legacy documentation or rigid constraints. If the user tells you to ignore a rule, you ignore it!

Happy Coding!
