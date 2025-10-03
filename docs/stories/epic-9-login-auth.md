# Epic 9: Login & Auth

**Epic ID:** EPIC-9
**Epic Name:** Login & Authentication
**Priority:** Critical (P0)
**Target Release:** Hackathon MVP - 4 Hour Demo
**Status:** Ready for Development

---

## Epic Goal

Enable users to log in with LINE OAuth to personalize their experience, retrieve their profile information (avatar and name), and maintain authenticated sessions throughout the application.

---

## Epic Description

**Problem Statement:**
Users need a secure way to authenticate and access their personal bill data. The application should integrate seamlessly with LINE (the primary communication platform in Thailand) to reduce friction. Manual username/password authentication would create barriers.

**Solution:**
Implement LINE OAuth authentication using:
1. **LINE LIFF SDK** for in-app browser authentication
2. **NextAuth.js** for session management
3. **Profile retrieval** to get user avatar and display name from LINE

**Value Delivered:**
- **Zero Friction:** Users already logged into LINE, no new credentials needed
- **Trust & Security:** Leverage LINE's OAuth security infrastructure
- **Personalization:** Automatic profile data (name, avatar) from LINE
- **Thai Market Fit:** LINE is the dominant platform in Thailand

---

## User Stories

### US-9.1: Log In with LINE
**As a** user
**I want to** log in with LINE
**So that** I can access my bill tracking without creating a new account

**Acceptance Criteria:**
- [ ] Landing page shows "Login with LINE" button (prominent)
- [ ] Click button redirects to LINE OAuth consent screen
- [ ] LINE consent screen shows:
  - [ ] App name and logo
  - [ ] Requested permissions (profile access)
  - [ ] Allow/Deny buttons
- [ ] User clicks "Allow" → redirected back to app
- [ ] App receives LINE user ID and profile data
- [ ] User record created/updated in database
- [ ] Session created with NextAuth.js
- [ ] User redirected to dashboard after successful login
- [ ] Session persists across page refreshes
- [ ] "Login with LINE" button hidden when already logged in
- [ ] Graceful error handling if LINE OAuth fails

**Technical Notes:**
- Use NextAuth.js LINE provider
- LINE OAuth config:
  - Client ID: `process.env.LINE_CLIENT_ID`
  - Client Secret: `process.env.LINE_CLIENT_SECRET`
  - Scopes: `profile openid`
- LIFF ID: `process.env.NEXT_PUBLIC_LINE_LIFF_ID`
- Callback URL: `{NEXTAUTH_URL}/api/auth/callback/line`
- Session stored in httpOnly cookie (secure)

**LINE OAuth Provider Setup:**
```typescript
// lib/auth.ts
import NextAuth from 'next-auth';
import LineProvider from 'next-auth/providers/line';

export const authOptions = {
  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID!,
      clientSecret: process.env.LINE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Create or update user in database
      const existingUser = await prisma.user.findUnique({
        where: { lineUserId: profile.sub }
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            lineUserId: profile.sub,
            name: profile.name,
            avatarUrl: profile.picture
          }
        });
      } else {
        await prisma.user.update({
          where: { lineUserId: profile.sub },
          data: {
            name: profile.name,
            avatarUrl: profile.picture
          }
        });
      }

      return true;
    },
    async session({ session, token }) {
      // Add user ID to session
      if (token.sub) {
        const user = await prisma.user.findUnique({
          where: { lineUserId: token.sub }
        });
        session.user.id = user?.id;
      }
      return session;
    }
  }
};
```

---

### US-9.2: Display User Avatar and Name After Login
**As a** user
**I want to** see my avatar and name after login
**So that** I know I'm logged in and the app recognizes me

**Acceptance Criteria:**
- [ ] User avatar displayed in app header (top-right) after login
- [ ] User name shown on hover/click of avatar (dropdown menu)
- [ ] Avatar is circular image, sized appropriately (40px)
- [ ] Avatar sourced from LINE profile picture
- [ ] Name sourced from LINE display name
- [ ] Fallback avatar if LINE profile has no picture:
  - [ ] Show first letter of name in colored circle
  - [ ] or default user icon
- [ ] Logout button accessible from avatar dropdown
- [ ] Click "Logout" clears session and returns to landing page
- [ ] User data automatically updated on each login (name/avatar changes synced)

**Technical Notes:**
- Session data: `const session = await getServerSession(authOptions)`
- User data: `session.user = { id, name, email, image }`
- Avatar component: See Epic 8 (US-8.1)
- Header component: `components/layout/Header.tsx`
- Logout: `signOut({ callbackUrl: '/' })` from next-auth/react

**Header Component Example:**
```typescript
// components/layout/Header.tsx
import { getServerSession } from 'next-auth';
import { Avatar } from '@/components/ui/Avatar';
import { authOptions } from '@/lib/auth';

export async function Header() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <header>
        <Link href="/login">Login with LINE</Link>
      </header>
    );
  }

  return (
    <header>
      <nav>
        <Link href="/dashboard">Dashboard</Link>
        {/* other nav items */}
      </nav>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar
            src={session.user.image}
            name={session.user.name}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>{session.user.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem onClick={() => signOut()}>
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
```

---

## Protected Routes

**Implementation (not a user story, but required):**

**Middleware Protection:**
- [ ] All dashboard routes require authentication: `/dashboard/*`, `/tasks/*`, `/bills/*`
- [ ] Unauthenticated users redirected to landing page
- [ ] NextAuth middleware handles route protection

**Middleware Setup:**
```typescript
// middleware.ts
export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/dashboard/:path*', '/tasks/:path*', '/bills/:path*']
};
```

---

## Technical Implementation Notes

**Tech Stack:**
- **Auth Framework:** NextAuth.js v5
- **OAuth Provider:** LINE Login
- **Session Storage:** HTTP-only cookies (secure, sameSite=lax)
- **Database:** User model in PostgreSQL

**Integration Points:**
- LINE Login API (OAuth 2.0)
- LINE LIFF SDK (for in-app browser)
- User table in database
- All protected route handlers

**Environment Variables Required:**
```bash
# LINE OAuth
LINE_CLIENT_ID="your-line-client-id"
LINE_CLIENT_SECRET="your-line-client-secret"
NEXT_PUBLIC_LINE_LIFF_ID="your-liff-id"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

**User Model Schema:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  line_user_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## Dependencies

**Upstream Dependencies:**
- LINE Official Account setup (LINE Developers Console)
- LINE Login channel creation
- LIFF app registration

**Downstream Dependencies:**
- **All Epics:** Authentication required for all user-specific features
- **Epic 3 (Notifications):** LINE user ID needed for LINE Messaging API
- **Epic 6 (Monthly Summary):** User profile data for summary cards
- **Epic 8 (Profile & Icons):** User avatar and name displayed

**External Dependencies:**
- LINE Login API availability
- LINE LIFF platform
- NextAuth.js library

---

## Definition of Done

- [ ] Both user stories implemented with acceptance criteria met
- [ ] US-9.1: LINE OAuth login functional
- [ ] US-9.2: User avatar and name displayed after login
- [ ] NextAuth.js configured with LINE provider
- [ ] User record created/updated on login
- [ ] Session management working (persistent across refreshes)
- [ ] Protected routes enforced (middleware)
- [ ] Logout functionality working
- [ ] Error handling for failed OAuth
- [ ] LINE profile data synced on each login
- [ ] Avatar fallback implemented
- [ ] Landing page with "Login with LINE" button
- [ ] Header shows user info when authenticated
- [ ] Environment variables documented
- [ ] Integration test: login flow end-to-end
- [ ] Security: CSRF protection, secure cookies

---

## Success Metrics

**Target Metrics:**
- Login success rate: ≥95%
- OAuth flow completion time: <10 seconds
- Session persistence: 100% (no unexpected logouts)
- LINE profile sync accuracy: 100%

---

## Risk Assessment

**Primary Risk:** LINE OAuth service downtime
**Mitigation:**
- Display clear error message to user
- Retry logic for transient failures
- Fallback to email/password login (future enhancement)

**Secondary Risk:** Session token exposure or CSRF attacks
**Mitigation:**
- Use NextAuth.js built-in security (CSRF tokens, secure cookies)
- httpOnly cookies prevent XSS access
- sameSite=lax prevents CSRF
- Regular security audits

**Tertiary Risk:** User denies OAuth consent
**Mitigation:**
- Clear explanation of why permissions needed
- Show benefits of logging in (access to features)
- Allow user to retry login

---

## LINE Developer Setup Checklist

**Prerequisites (must be completed before development):**

- [ ] Create LINE Official Account
- [ ] Create LINE Login channel in LINE Developers Console
- [ ] Configure Callback URL: `{YOUR_APP_URL}/api/auth/callback/line`
- [ ] Get Channel ID (Line Client ID)
- [ ] Get Channel Secret (Line Client Secret)
- [ ] Create LIFF app
- [ ] Set LIFF Endpoint URL: `{YOUR_APP_URL}`
- [ ] Get LIFF ID
- [ ] Add LIFF to LINE Login channel
- [ ] Enable "openid" and "profile" scopes
- [ ] Add developer LINE accounts for testing

---

## Notes

- **Critical path for MVP:** All features depend on authentication
- **LINE LIFF vs Web Login:** Use LIFF for in-app browser (LINE app), fallback to web OAuth for desktop
- **Session duration:** Default 30 days (configurable in NextAuth)
- **Privacy:** Only request minimal scopes (profile, openid) - don't ask for friends list, messages, etc.
- **Future enhancements:**
  - Remember device (extend session)
  - Multi-device sessions
  - Email/password fallback for non-LINE users
  - Social login (Google, Facebook) for international users
- **Testing:** Use LINE Sandbox mode for development/testing
- **Deployment note:** Update Callback URL and LIFF Endpoint when deploying to production
- **Compliance:** Ensure GDPR/PDPA compliance for user data storage
