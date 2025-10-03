# Introduction

This document outlines the complete fullstack architecture for **Household Tasks & Bills**, a streamlined single-user application for capturing bills/receipts, converting them into tasks, and receiving notifications via LINE. This architecture is optimized for rapid hackathon development (4hr demo, 48hr MVP) while maintaining a clean, scalable foundation.

## Starter Template or Existing Project

**Selected Approach:** Greenfield Next.js 14+ App Router project

**Key Decisions:**
- **Next.js 14+** with App Router for unified frontend/backend in a single codebase
- **Prisma ORM** for type-safe database access with auto-generated TypeScript types
- **PostgreSQL** (local) for relational data (users, bills, tasks with clear relationships)
- **Tailwind CSS** for rapid UI development
- **LINE LIFF SDK** for LINE integration (authentication + in-app browser)
- **Local development only** - no deployment needed for hackathon demo

**Rationale:**
- **Simplified data model:** Single-user architecture, no groups/members/assignments
- **Monolithic Next.js:** Faster than separate frontend/backend for hackathon timeline
- **PostgreSQL + Prisma:** Type safety prevents bugs, migrations are straightforward
- **LINE LIFF:** Native LINE integration for Thai users, seamless auth flow
- **Local demo:** Runs on localhost, no deployment overhead for hackathon
- **Google Cloud Document AI:** High accuracy OCR (95%+) for Thai receipts

## Architecture Principles for Hackathon MVP

1. **Simplicity First:** Single-user model, automatic task creation, no assignment workflow
2. **Type Safety:** Shared TypeScript types between frontend/backend prevent runtime errors
3. **Rapid Iteration:** Hot reload, automatic API routes, zero config
4. **Mobile-First:** Optimized for LINE LIFF browser on mobile devices
5. **Cloud OCR:** Google Document AI for reliable receipt parsing

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-10-03 | 3.0 | Single-user architecture - removed assignments, members, groups. Updated to Google Document AI. Removed Docker setup. | Winston (Architect) |
| 2025-10-03 | 2.0 | Simplified architecture - removed groups and escalation | Winston (Architect) |
| 2025-10-03 | 1.0 | Initial architecture document | Winston (Architect) |

---
