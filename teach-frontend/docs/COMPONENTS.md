# TEACH Frontend — Component Reference

Engineering reference for shared UI, layout, and infrastructure components. UX behavior is unchanged; this documents contracts and integration points.

## App shell

| Component | Path | Role |
|-----------|------|------|
| `App` | `src/App.tsx` | Root providers: `ErrorBoundary`, `ToastProvider`, `LearningProgressProvider`, `OfflineBanner`, `AppRouter` |
| `AppRouter` | `src/routes/AppRouter.tsx` | Lazy-loaded routes, nested `ErrorBoundary`, `Suspense`, page analytics |
| `RoleRoute` | `src/routes/RoleRoute.tsx` | Guards routes by role from `authService.getRole()` |
| `ErrorBoundary` | `src/components/ErrorBoundary.tsx` | Catches render errors; shows `ErrorState` with retry |
| `RouteFallback` | `src/components/RouteFallback.tsx` | Suspense loading placeholder |
| `OfflineBanner` | `src/components/OfflineBanner.tsx` | Sticky banner when `useOnlineStatus()` is false |

## Layouts

| Component | Path | Role |
|-----------|------|------|
| `TeacherLayout` | `components/layouts/TeacherLayout.tsx` | Teacher nav shell; `#main-content` outlet; role switch via `clearAuth()` |
| `StudentLayout` | `components/layouts/StudentLayout.tsx` | Student nav shell; same outlet pattern |

## Shared UI (`components/ui/`)

| Component | Props (key) | Notes |
|-----------|-------------|-------|
| `Icon` | `icon`, `size`, `className` | Lucide wrapper; consistent stroke/size |
| `Modal` | `open`, `onClose`, `ariaLabel`, `panelClassName`, `children` | Focus trap, Escape to close, backdrop click |
| `EmptyState` | `icon`, `title`, `description`, `action` | Empty catalog / list states |
| `ErrorState` | `message`, `onRetry?`, `onDismiss?` | API and boundary failures |
| `PageHeader` | `kicker`, `title`, `lede`, `actions?` | Page title block |
| `SkeletonCardGrid` | `count` | Loading placeholder for card grids |

## Classroom

| Component | Path | Role |
|-----------|------|------|
| `ClassroomLayout` | `components/classroom/ClassroomLayout.tsx` | Slide, avatar, quiz, SAGE orchestration |
| `SlideRenderer` | `components/slides/SlideRenderer.tsx` | KaTeX + lazy images; `isSafeAssetUrl()` guard |
| `TeacherAvatar` | `components/avatar/TeacherAvatar.tsx` | Lip-sync + speech via `SpeechController` |
| `PopQuizPanel` | `components/quiz/PopQuizPanel.tsx` | Quiz flow; progressbar ARIA; submit error handling |
| `SageDoubtPanel` | `components/sage/SageDoubtPanel.tsx` | Modal chat; labeled input; `aria-live` for thinking state |

## Delight / gamification (feature-flagged)

Controlled by `VITE_FLAG_DELIGHT_GAMIFICATION` (default `true`). When off, `LearningProgressProvider` serves no-op context.

| Component | Path |
|-----------|------|
| `CelebrationMoment` | `components/delight/CelebrationMoment.tsx` |
| `LearningStatsBar` | `components/delight/LearningStatsBar.tsx` |
| `SessionCompleteScreen` | `components/delight/SessionCompleteScreen.tsx` |

## Services & hooks

| Module | Purpose |
|--------|---------|
| `services/auth/authService.ts` | Role TTL (24h), scoped classroom sessions, student ID |
| `services/api/client.ts` | Axios + retry, cache, `X-Teach-Role` header |
| `services/api/apiError.ts` | `ApiError`, `getUserMessage()` |
| `lib/analytics.ts` | `trackEvent()` — no-op unless `VITE_ANALYTICS_ENABLED=true` |
| `lib/monitoring.ts` | `captureException()` — dispatches `teach:monitoring` event |
| `lib/featureFlags.ts` | Env-driven flags |
| `hooks/useOnlineStatus.ts` | `navigator.onLine` + window events |
| `hooks/usePageAnalytics.ts` | Route-change page views |

## Environment variables

See `teach-frontend/.env.example`:

- `VITE_API_BASE_URL` — API origin (empty = same-origin proxy in dev)
- `VITE_ANALYTICS_ENABLED` — enable analytics events
- `VITE_SENTRY_DSN` — passed to monitoring hook consumers
- `VITE_FLAG_SAGE_STREAMING` — SAGE streaming (future)
- `VITE_FLAG_DELIGHT_GAMIFICATION` — XP/streak/achievements

## Theming

Design tokens live in `src/styles/theme.css`. Component styles: `global.css`, `dashboard.css`, `components.css`, `delight.css`, `motion.css`. Do not introduce new colors outside Midnight / Teal / Amber (celebrations only).
