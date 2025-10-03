# Security and Performance

## Security Requirements

**Frontend Security:**
- **CSP Headers:** `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; img-src 'self' data: https:;`
- **XSS Prevention:** React auto-escaping, DOMPurify for user content, strict TypeScript
- **Secure Storage:** NextAuth session cookies (httpOnly, secure, sameSite=lax)

**Backend Security:**
- **Input Validation:** Zod schemas on all API routes, type-safe Prisma queries
- **CORS Policy:** `{ origin: 'http://localhost:3000', credentials: true }`
- **SQL Injection Prevention:** Prisma parameterized queries (no raw SQL)
- **File Upload Validation:** File type and size limits on receipt/payment slip uploads

**Authentication Security:**
- **Token Storage:** NextAuth session in httpOnly cookies (not localStorage)
- **Session Management:** 30-day rolling sessions for demo
- **Password Policy:** N/A (LINE OAuth only, no passwords)

**Additional Measures:**
- Environment variables in .env.local (not committed to git)
- Database running in Docker container (isolated)
- File uploads stored locally with path validation
- Demo mode with seeded test data

## Performance Optimization

**Frontend Performance:**
- **Bundle Size Target:** < 200KB initial JS bundle
- **Loading Strategy:**
  - React Server Components for initial render (0 JS)
  - Code splitting per route (automatic with App Router)
  - Lazy loading for OCR worker (Tesseract.js)
- **Caching Strategy:**
  - Static assets: Browser cache for dev
  - API responses: `Cache-Control: no-store` (dynamic data)
  - No ISR needed for hackathon demo

**Backend Performance:**
- **Response Time Target:** < 500ms for API routes (local development)
- **Database Optimization:**
  - Composite indexes on common query patterns
  - `SELECT` only needed fields (Prisma `select`)
  - Batch queries with Prisma transactions
- **Caching Strategy:**
  - Session data in memory (NextAuth default)
  - No caching for bills/tasks (real-time data for demo)

**Monitoring:**
- Next.js dev server console logs
- Browser DevTools for Core Web Vitals
- Prisma query logging in development mode
- Console timing for API route performance

---
