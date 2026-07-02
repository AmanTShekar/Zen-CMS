# Security Policy & Compliance (SECURITY.md)

Zenith CMS enforces a zero-trust architecture, prioritizing absolute data security, programmatic sanitization, and strict multi-tenant isolation. This policy documents our security release lifecycles and vulnerability disclosure protocols.

---

## 1. Supported Release Lifecycles

The core maintainers monitor, patch, and release security updates according to the following schedule:

| Version | Status | Patch Release Frequency |
|---|---|---|
| **v0.2.x** (Active Develop) | Supported | Continuous (Immediate hotfixes for verified CVEs) |
| **v0.1.x** (Early Alpha) | Maintenance | Critical vulnerabilities only |
| **< v1.0.0-beta** (Deprecated) | Unsupported | None (Upgrade to current stable release required) |

---

## 2. Platform Security Constraints

Zenith CMS implements the following security postures natively:

- **Ahead-of-Time (AOT) Schema Validation**: Incoming HTTP requests are validated against strict Zod parsing schemas prior to reaching controller execution, neutralizing parameter bypass attempts and NoSQL injection vectors.
- **Role-Based Access Control (RBAC)**: Field-level and collection-level execution constraints provide granular read, create, update, and delete restrictions.
- **Multi-Tenant Data Isolation**: Data leakage between sites is prevented at the database adapter level. Every query automatically inherits a `{ siteId }` filter based on the `X-Zenith-Site-Id` HTTP header.
- **Cryptographic Webhook Signatures**: Outbound event notifications are cryptographically signed via HMAC-SHA256 using high-entropy secrets to prevent payload forgery.
- **Contextual Sanitization**: The core API strips sensitive metadata (passwords, internal access logs, tenant secrets) dynamically during serialization based on the requester's scope.

---

## 3. Session & Traffic Management

- **HttpOnly Cookies**: For the Admin UI, session tokens are stored in `HttpOnly` and `SameSite=Strict` cookies. This makes them completely inaccessible to client-side JavaScript, neutralizing Cross-Site Scripting (XSS) token theft.
- **Brute-Force Lockouts**: The core `AuthService` tracks failed login attempts. After **5 failed attempts**, the account is soft-locked for **15 minutes**.
- **Distributed Rate Limiting**: The Express server mounts standard rate limiters (100 req/min for general API, 10 req/15min for auth). If Redis is configured, these limits are enforced accurately across horizontally scaled clusters.

---

## 4. File Upload Safety (Magic Bytes)

To prevent attackers from uploading executable code masquerading as media (e.g., uploading a `.php` or `.js` web-shell renamed to `image.png`), Zenith performs deep file inspection.

- **Magic Bytes Verification**: The server inspects the first few hexadecimal bytes (the file signature) of every uploaded file. For example, a valid JPEG must start with `FF D8 FF E0`.
- **Rejection**: If the MIME type or extension claims the file is an image, but the magic bytes indicate an executable, the upload is immediately rejected and deleted from the temporary buffer.
- **SVG Sanitization**: SVG files are notorious vectors for Stored XSS. Zenith sanitizes all uploaded SVGs to strip `<script>` tags and inline JavaScript event handlers (`onload`, `onerror`).

---

## 5. Vulnerability Disclosure Protocol

**If you discover a security vulnerability or potential exploit within Zenith CMS, do NOT file a public GitHub issue.** Public disclosure exposes operational systems before an upstream mitigation is available.

Please coordinate responsible disclosure privately via our security response team:

- **Email Contact**: security@zenithcms.com

### Required Report Contents

To expedite triage, please include:
- **Environment State**: Node.js version, database engine (MongoDB/PostgreSQL), and the specific `@zenith-open/zenithcms-core` package version.
- **Exploit Mechanics**: A deterministic, step-by-step reproduction sequence or a proof-of-concept (PoC) payload.
- **Impact Assessment**: Specify whether the vulnerability permits unauthorized read, write, arbitrary code execution, or denial-of-service.

### Response Service Level Agreements (SLA)

- **Triage**: Within 24 hours of report receipt.
- **Mitigation Draft**: Within 48 hours for verified high-severity vectors.
- **Public Disclosure**: We will coordinate with the reporter to publish an official GitHub Security Advisory and assign a CVE (with appropriate researcher credit) upon the deployment of the patch.
