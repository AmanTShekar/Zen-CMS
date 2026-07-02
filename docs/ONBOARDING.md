# Zenith CMS — Editor Onboarding

Welcome to Zenith CMS. This guide provides a high-level overview of the administrative interface and editorial workflows.

---

## 1. The Dashboard

Upon authenticating, you will land on the Dashboard. This view aggregates high-level metrics for your specific tenant (`siteId`), including recent document mutations and active collaboration sessions.

## 2. Navigating Collections

The sidebar dynamically generates navigation links based on the schemas defined by your engineering team. 
Collections represent distinct content types (e.g., "Articles", "Products", "Testimonials").

- **List View**: Displays paginated entries. You can filter, sort, and search across fields.
- **Edit View**: Clicking an entry opens the document editor.

## 3. Real-Time Collaboration

If another editor accesses the same document you are viewing, Zenith will automatically synchronize their presence.
If they initiate an edit, the document will become temporarily read-only for you to prevent race conditions and data loss.

## 4. Media Management

The Media Library allows you to upload and categorize images, PDFs, and videos. 
When uploading an image, the backend engine automatically processes standard variants (thumbnail, medium, large) and strips potentially harmful metadata or executable payloads.

## 5. Webhook Triggers

Depending on your site configuration, saving a document (like publishing a new blog post) might instantly trigger a deployment to your live website (e.g., Vercel, Netlify). Watch for the confirmation toasts in the bottom right corner indicating successful webhook dispatches.
