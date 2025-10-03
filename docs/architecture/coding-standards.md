# Coding Standards

## Critical Fullstack Rules

- **Type Sharing:** Always define shared types in `lib/types` and import from there. Never duplicate type definitions between frontend and backend.

- **API Calls:** Never make direct `fetch()` calls from components. Use service layer methods from `lib/services` that handle errors and type safety.

- **Environment Variables:** Access only through typed config objects in `lib/config.ts`, never `process.env` directly. Use `NEXT_PUBLIC_` prefix for client-side vars.

- **Error Handling:** All API routes must use the standard error handler from `lib/utils/api-response.ts`. Consistent error format across all endpoints.

- **State Updates:** Never mutate Prisma results or React state directly. Use Prisma's immutable updates and React setState patterns.

- **Database Queries:** Always use Prisma Client, never raw SQL. Use `select` to fetch only needed fields. Use transactions for multi-step operations.

- **File Uploads:** Always upload to Vercel Blob first, then store URL in database. Never store binary data in PostgreSQL.

- **Notifications:** Use NotificationService for all notifications. Never call LINE Notify API directly from components.

- **Authentication:** Always check session with NextAuth middleware. Never trust client-side auth state alone.

- **Validation:** Use Zod schemas defined in `lib/validations` for both client and server validation. Share the same schema.

## Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `BillCard.tsx`, `TaskList.tsx` |
| Hooks | camelCase with 'use' prefix | - | `useTaskList.ts`, `useAuth.ts` |
| API Routes | kebab-case folder, route.ts | - | `api/bills/route.ts` |
| Database Tables | snake_case | - | `users`, `bills`, `tasks` |
| Prisma Models | PascalCase | - | `User`, `Bill`, `Task` |
| Services | PascalCase with 'Service' suffix | - | `BillService`, `TaskService` |
| Utilities | camelCase | - | `formatCurrency`, `parseDate` |
| Types/Interfaces | PascalCase | - | `Bill`, `Task`, `ApiResponse<T>` |

---
