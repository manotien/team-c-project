# Epic 8: Profile & Icons

**Epic ID:** EPIC-8
**Epic Name:** Profile & Icons
**Priority:** Low (P3)
**Target Release:** Hackathon Full MVP - 48 Hours (Polish)
**Status:** Ready for Development

---

## Epic Goal

Display user profile images throughout the application and show contextual bill type icons (⚡Electric, 💧Water, 🌐Internet, 🚗Car, 🏠Home) to improve visual recognition and user experience.

---

## Epic Description

**Problem Statement:**
The application lacks visual personalization and bill categorization cues. Users need quick visual identification of bill types without reading text. Profile images add personalization and confirm identity.

**Solution:**
Implement two visual enhancement features:
1. **User profile images** displayed in navigation, summaries, and task views
2. **Bill type icons** consistently displayed across all bill/task lists and cards

**Value Delivered:**
- **Visual Recognition:** Icons enable instant bill type identification
- **Personalization:** Profile avatars make the app feel personal
- **Improved UX:** Reduce cognitive load with visual cues
- **Brand Consistency:** Establish visual language for bill types

---

## User Stories

### US-8.1: Display Profile Images Throughout App
**As a** user
**I want to** see profile images (my avatar) next to my tasks and in my profile
**So that** the app feels personalized and I can quickly identify my content

**Acceptance Criteria:**
- [ ] User avatar displayed in:
  - [ ] App header/navigation (top-right corner)
  - [ ] Monthly summary card (Epic 6)
  - [ ] User profile/settings page (if implemented)
  - [ ] Task detail page (task owner indication)
- [ ] Avatar sourced from LINE profile (`user.avatarUrl`)
- [ ] Avatar displayed as circular image (standard size: 40px)
- [ ] Fallback avatar if no image available:
  - [ ] Show first letter of user's name in colored circle
  - [ ] or use default user icon (👤)
- [ ] Click avatar in header opens dropdown menu:
  - [ ] User name
  - [ ] "Settings" link (future)
  - [ ] "Logout" button
- [ ] Avatar loads efficiently (Next.js Image optimization)
- [ ] Avatar alt text includes user name for accessibility

**Technical Notes:**
- Component: `components/ui/Avatar.tsx` (shadcn/ui)
- User data: `const { user } = await getServerSession(authOptions)`
- Fallback: Use user.name.charAt(0).toUpperCase() or default icon
- Header component: `components/layout/Header.tsx`
- Use Next.js Image component: `<Image src={user.avatarUrl} width={40} height={40} className="rounded-full" />`

---

### US-8.2: Display Bill Type Icons Across All Lists
**As a** user
**I want to** see contextual icons for each bill type (⚡Electric, 💧Water, 🌐Internet, 🚗Car, 🏠Home)
**So that** I can quickly identify bill categories visually

**Acceptance Criteria:**
- [ ] Bill type icons mapped correctly:
  - [ ] ELECTRIC → ⚡ (lightning bolt)
  - [ ] WATER → 💧 (water droplet)
  - [ ] INTERNET → 🌐 (globe with meridians)
  - [ ] CAR → 🚗 (automobile)
  - [ ] HOME → 🏠 (house)
  - [ ] OTHER → 📄 (page/document)
- [ ] Icons displayed in:
  - [ ] Task cards on dashboard
  - [ ] Bill detail pages
  - [ ] Task history list
  - [ ] Monthly summary breakdowns
  - [ ] Add Bill form (type selector)
- [ ] Icon size consistent across app (24px or 1.5rem)
- [ ] Icon positioned consistently (typically left of vendor name)
- [ ] Icon has accessible label (aria-label or title attribute)
- [ ] Icons visible in all screen sizes (responsive)
- [ ] Icon color matches bill type theme (optional: color coding)

**Technical Notes:**
- Create utility function:
  ```typescript
  // lib/utils/billIcons.ts
  export function getBillTypeIcon(billType: BillType): string {
    const icons = {
      ELECTRIC: '⚡',
      WATER: '💧',
      INTERNET: '🌐',
      CAR: '🚗',
      HOME: '🏠',
      OTHER: '📄'
    };
    return icons[billType] || icons.OTHER;
  }
  ```
- Component: `components/bills/BillTypeIcon.tsx`
- Usage: `<BillTypeIcon type={bill.billType} />`
- Consider using emoji or SVG icons (emoji simpler for MVP)

---

## Technical Implementation Notes

**Tech Stack:**
- **UI Components:** shadcn/ui Avatar component
- **Icons:** Unicode emoji or Lucide React icons
- **Images:** Next.js Image component for avatars

**Integration Points:**
- User data from auth session (Epic 9)
- Bill/task cards across all epics
- Header/navigation component
- Monthly summary cards (Epic 6)

**Avatar Component Example:**
```typescript
// components/ui/Avatar.tsx
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number;
}

export function Avatar({ src, name, size = 40 }: AvatarProps) {
  if (src) {
    return (
      <Image
        src={src}
        alt={`${name}'s avatar`}
        width={size}
        height={size}
        className="rounded-full"
      />
    );
  }

  // Fallback: First letter of name
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className="rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      {initial}
    </div>
  );
}
```

**Bill Type Icon Component:**
```typescript
// components/bills/BillTypeIcon.tsx
import { BillType } from '@prisma/client';

const BILL_ICONS = {
  ELECTRIC: '⚡',
  WATER: '💧',
  INTERNET: '🌐',
  CAR: '🚗',
  HOME: '🏠',
  OTHER: '📄'
} as const;

interface BillTypeIconProps {
  type: BillType;
  size?: 'sm' | 'md' | 'lg';
}

export function BillTypeIcon({ type, size = 'md' }: BillTypeIconProps) {
  const sizeClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <span
      className={sizeClasses[size]}
      role="img"
      aria-label={`${type.toLowerCase()} bill`}
    >
      {BILL_ICONS[type]}
    </span>
  );
}
```

---

## Dependencies

**Upstream Dependencies:**
- **Epic 9 (Login & Auth):** User profile data (avatar, name) from LINE
- **Epic 1 (Bill Capture):** Bill type field populated

**Downstream Dependencies:**
- Used across all epics that display bills/tasks

---

## Definition of Done

- [ ] Both user stories implemented with acceptance criteria met
- [ ] US-8.1: Profile avatars displayed throughout app
- [ ] US-8.2: Bill type icons visible in all lists/cards
- [ ] Avatar component with fallback working
- [ ] Bill type icon utility function created
- [ ] Icons displayed consistently across all views:
  - [ ] Dashboard task cards
  - [ ] Task detail pages
  - [ ] History list
  - [ ] Monthly summary
  - [ ] Add Bill form
- [ ] Avatar dropdown menu functional (name, logout)
- [ ] Responsive design (icons/avatars scale appropriately)
- [ ] Accessibility labels present
- [ ] Next.js Image optimization applied
- [ ] No console errors or layout shifts
- [ ] Unit tests for icon utility function
- [ ] Visual regression test (optional)

---

## Success Metrics

**Target Metrics:**
- Avatar load time: <200ms
- Icon rendering: instant (no loading delay)
- User recognition: 90% of users can identify bill types by icon alone
- Accessibility: 100% WCAG AA compliance (alt text, labels)

---

## Risk Assessment

**Primary Risk:** Avatar images fail to load from LINE CDN
**Mitigation:**
- Implement fallback to first initial
- Handle image errors gracefully (onError handler)
- Cache avatars locally (future enhancement)

**Secondary Risk:** Emoji icons inconsistent across devices/browsers
**Mitigation:**
- Test on iOS, Android, Windows, macOS
- Consider using SVG icons instead (Lucide React library)
- Document known emoji rendering differences

**Tertiary Risk:** Layout shift when avatars load
**Mitigation:**
- Reserve space with width/height on Image component
- Use Next.js Image with placeholder (blur or color)
- CSS: `aspect-ratio: 1/1` on avatar container

---

## Notes

- **Priority P3:** Nice-to-have polish feature, not critical for MVP
- **Low complexity:** Mostly presentational changes, minimal logic
- **Quick wins:** Both user stories can be implemented in 1-2 hours
- **Consider implementation order:**
  1. Bill type icons (easier, more visible impact)
  2. Profile avatars (depends on auth integration)
- **Future enhancements:**
  - Custom user avatars (upload own image)
  - Animated icons on hover
  - Color-coded bill types (not just icons)
  - Icon legend/help tooltip
  - Category analytics (spending by bill type)
- **Design consistency:** Ensure icons match overall app design language
- **Alternative to emoji:** Lucide React icons library provides consistent SVG icons
- **Accessibility:** Ensure sufficient color contrast if adding colored icons
