# TEACH UI Component Library

Production primitives for assembling pages from the design system. Import from `components/ui` or `components/ui/index.ts`.

Design tokens live in `src/styles/tokens.css`. Component styles in `src/styles/components/`.

---

## Layout & page shell

### `AppPage`

**Purpose:** Standard `<main>` page container with layout width and role-specific modifiers.

**Props**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'student' \| 'teacher-wide' \| 'teacher-form' \| 'teacher-detail'` | `'default'` | Page shell class map |
| `className` | `string` | — | Additional classes |
| `children` | `ReactNode` | required | Page content |

**When to use:** Every top-level page view.

**When NOT to use:** Inside classroom immersive canvas (uses custom shell).

```tsx
<AppPage variant="student">
  <HubHero>...</HubHero>
  <PageSection label="Class catalog">...</PageSection>
</AppPage>
```

---

### `HubHero`

**Purpose:** Dashboard hero band wrapping `PageHeader` and optional stats.

**Props:** `children`, `className?`

**When to use:** Student/teacher hub pages above catalog content.

---

### `PageSection`

**Purpose:** Semantic `<section>` with `aria-label` and catalog styling.

**Props**

| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Accessible section name |
| `catalog?` | `boolean` | Adds `catalog-section` modifier (student catalog) |
| `className?` | `string` | Extra classes |
| `children` | `ReactNode` | Section content |

---

### `PageAlert`

**Purpose:** Top-of-page alert slot for errors and confirmations.

**Props:** `children`, `className?`

**When to use:** Wrap `ErrorState` at the top of hub pages.

---

### `PageHeader`

**Purpose:** Page title block — kicker, title, lede, optional action and back link.

**Props:** `kicker?`, `title`, `lede?`, `action?`, `back?`, `variant?: 'default' | 'hub'`

---

### `SectionTitle`

**Purpose:** Section heading within panels and detail views.

**Props:** `children`, `as?: 'h2' | 'h3'`, `className?`, `id?`

---

### `GlassPanel`

**Purpose:** Frosted hub surface (`.hub-glass-panel`).

**Props:** `as?: 'section' | 'div' | 'form' | 'article'`, `className?`, native element attrs

```tsx
<GlassPanel className="teacher-class-detail-body" aria-label="Class plan details">
  ...
</GlassPanel>
```

---

## Catalog & cards

### `CardGrid`

**Purpose:** Responsive class catalog grid.

**Props:** `children`, `loading?: boolean`, `className?`

---

### `CatalogToolbar`

**Purpose:** List summary bar above catalog grids.

**Props:** `count`, `singularLabel`, `pluralLabel`

```tsx
<CatalogToolbar
  count={5}
  singularLabel=" class ready to attend"
  pluralLabel=" classes ready to attend"
/>
```

---

### `ClassCardMeta`

**Purpose:** Shared subject / grade / chapter / duration meta list for class cards.

**Props:** `subject`, `grade`, `chapterName`, `durationMinutes`

---

### `ClassCardSkeleton`

**Purpose:** Loading placeholder grid for catalog pages.

**Props:** `count?: number` (default 6), `variant?: 'student' | 'teacher'`

---

### `StatusBadge`

**Purpose:** Hub plan status or catalog “ready to join” pill.

**Props**

| Prop | Type | Description |
|------|------|-------------|
| `variant` | `'hub' \| 'catalog'` | Badge style family |
| `status?` | `PlanStatus \| 'ready'` | Hub status key |
| `label?` | `string` | Override label text |

---

## Actions

### `Button`

**Purpose:** Primary interactive control — wraps design-system `.btn` variants.

**Props**

| Prop | Type | Default |
|------|------|---------|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'highlight' \| 'sage' \| 'danger' \| 'success'` | `'primary'` |
| `pill?` | `boolean` | `false` |
| `loading?` | `boolean` | `false` |
| `icon?` | `LucideIcon` | — |
| `withIcon?` | `boolean` | `false` |
| `iconSize?` | `number` | `16` |
| `className?` | `string` | — |
| + native `button` attrs | | |

**Accessibility:** `aria-busy` when loading; disabled when loading.

```tsx
<Button variant="primary" pill loading={isSaving} onClick={save}>
  {isSaving ? 'Saving…' : 'Save'}
</Button>
```

---

### `ButtonLink`

**Purpose:** Router `Link` styled as a button. Same variant props as `Button`.

---

### `IconButton`

**Purpose:** Icon-only control with required `aria-label`.

**Props:** `icon`, `label` (aria-label), `remove?`, `loading?`, + button attrs

---

### `ActionGroup`

**Purpose:** Horizontal action row for headers and detail toolbars.

**Props:** `children`, `className?`

---

## Feedback & data

### `EmptyState` / `StatusPanel`

**Purpose:** Loading, empty, success, and error content blocks.

`StatusPanel` is a thin wrapper over `EmptyState` with `tone` prop.

---

### `ErrorState`

**Purpose:** Inline dismissible error alert. Use inside `PageAlert` on hub pages.

**Props:** `message`, `onDismiss?`

---

### `LoadingSpinner`

**Purpose:** Standalone spinner (`role="status"`). Used in empty states and available for inline loading.

**Props:** `size?`, `className?`, `label?`

---

### `ProgressBar`

**Purpose:** Token-backed progress track.

**Props**

| Prop | Type | Description |
|------|------|-------------|
| `value` | `number` | 0–100 |
| `variant?` | `'goal' \| 'journey'` | CSS track family |
| `milestone?` | `boolean` | Adds milestone class at 100% |
| `aria-label?` | `string` | Required for meaningful progress |

---

## Domain components (outside `ui/`)

These compose UI primitives for specific flows:

| Component | Path | Uses |
|-----------|------|------|
| `ClassCatalogCard` | `catalog/ClassCatalogCard.tsx` | `StatusBadge`, `ClassCardMeta`, `Button` |
| `TeacherClassCard` | `admin/TeacherClassCard.tsx` | `StatusBadge`, `ClassCardMeta` |
| `MentorCard` | `mentor/MentorCard.tsx` | Mentor selection |
| `OnboardingPanel` | `onboarding/OnboardingPanel.tsx` | `Button` |
| `LearningStatsBar` | `delight/LearningStatsBar.tsx` | `ProgressBar` |

---

## Import pattern

```tsx
import {
  AppPage,
  Button,
  ButtonLink,
  CardGrid,
  CatalogToolbar,
  ErrorState,
  GlassPanel,
  HubHero,
  PageAlert,
  PageHeader,
  PageSection,
  StatusBadge,
} from '../../components/ui'
```

---

## Remaining extraction candidates

| Pattern | Status | Notes |
|---------|--------|-------|
| `FormField` | Not extracted | Repeated label + input + error in forms |
| `MetricCard` / stat pill | Partial | `LearningStatsBar` only |
| `DialogFooter` | Not extracted | Sage / voice doubt footers |
| `SearchBar` / `FilterRow` | N/A | Not implemented yet |
| Classroom buttons | CSS-only | `classroom-action-btn`, `mentor-panel-btn` |
| Toast unification | Partial | `ToastContext` + celebration toasts |
| `WelcomePage` CTAs | Raw buttons | Candidate for `Button` |
| Subtitle / speech bubbles | Domain | Classroom-specific |

---

## Conventions

1. **No hardcoded colors** in components — use CSS classes backed by tokens.
2. **Prefer composition** — `AppPage` + `HubHero` + `PageSection` + `CardGrid`.
3. **Memoized** primitives (`memo`) to limit re-renders in list pages.
4. **Semantic HTML** — `main`, `section`, `header`, `role="alert"`, `role="progressbar"`.
