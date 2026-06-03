# ARIA — Frontend Architecture Guide
> Dokumen ini adalah panduan utama untuk agentic AI code generation pada proyek ARIA Mobile App.
> PRD Version: 1.0 | Expo + React Native | Universitas Telkom 2025

---

## 🗂️ Directory Structure

```
aria/
├── app/                          # Expo Router — file-based navigation
│   ├── (auth)/                   # Auth group (unauthenticated routes)
│   │   ├── _layout.tsx           # Auth stack layout
│   │   ├── login.tsx             # Login screen
│   │   └── register.tsx          # Register screen
│   ├── (app)/                    # Main app group (authenticated routes)
│   │   ├── _layout.tsx           # Tab navigator layout
│   │   ├── index.tsx             # Home / Input narasi (default tab)
│   │   ├── calendar.tsx          # Tampilan kalender bulanan/mingguan
│   │   ├── schedules.tsx         # Daftar semua jadwal
│   │   └── settings.tsx          # Pengaturan & profil
│   ├── schedule/
│   │   ├── [id].tsx              # Detail jadwal
│   │   └── edit/[id].tsx         # Edit jadwal
│   ├── _layout.tsx               # Root layout (fonts, providers)
│   └── +not-found.tsx            # 404 screen
│
├── src/
│   ├── components/               # Reusable UI components
│   │   ├── ui/                   # Atom-level components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── index.ts
│   │   ├── schedule/             # Schedule-domain components
│   │   │   ├── ScheduleCard.tsx
│   │   │   ├── SchedulePreview.tsx   # Preview sebelum simpan
│   │   │   ├── ScheduleForm.tsx      # Form edit jadwal
│   │   │   ├── ScheduleList.tsx
│   │   │   └── ConflictWarning.tsx   # Deteksi tumpang tindih
│   │   ├── calendar/
│   │   │   ├── MonthlyCalendar.tsx
│   │   │   ├── WeeklyView.tsx
│   │   │   └── DayDot.tsx            # Indikator hari ada jadwal
│   │   ├── input/
│   │   │   ├── NarasiInput.tsx       # Text area input utama
│   │   │   ├── ProcessButton.tsx
│   │   │   └── InputHistory.tsx      # Riwayat input
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── BottomTab.tsx
│   │       └── SafeArea.tsx
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useScheduleExtract.ts # Hook: kirim teks → terima JSON jadwal
│   │   ├── useSchedules.ts       # CRUD jadwal dari local DB
│   │   ├── useCalendar.ts        # Navigasi kalender (minggu/bulan)
│   │   ├── useNotification.ts    # Push notification setup
│   │   ├── useAuth.ts            # Auth state & actions
│   │   └── useConflictDetect.ts  # Deteksi konflik jadwal
│   │
│   ├── services/                 # API & external integrations
│   │   ├── api/
│   │   │   ├── client.ts         # Axios instance + interceptors
│   │   │   ├── auth.api.ts       # POST /auth/login, /auth/register
│   │   │   ├── schedule.api.ts   # CRUD /schedules
│   │   │   └── extract.api.ts    # POST /extract (LLM processing)
│   │   ├── storage/
│   │   │   ├── db.ts             # SQLite / AsyncStorage setup
│   │   │   ├── schedule.store.ts # Local schedule CRUD
│   │   │   └── auth.store.ts     # Token storage (SecureStore)
│   │   └── notification/
│   │       └── reminder.ts       # Expo Notifications scheduler
│   │
│   ├── store/                    # Global state (Zustand)
│   │   ├── auth.store.ts         # User session state
│   │   ├── schedule.store.ts     # Schedules list + filter state
│   │   ├── extract.store.ts      # LLM extraction result state
│   │   └── ui.store.ts           # UI state (loading, modals, toasts)
│   │
│   ├── types/                    # TypeScript type definitions
│   │   ├── schedule.types.ts
│   │   ├── auth.types.ts
│   │   ├── api.types.ts
│   │   └── extract.types.ts
│   │
│   ├── utils/                    # Pure utility functions
│   │   ├── dateParser.ts         # Parse & format tanggal Indonesia
│   │   ├── scheduleValidator.ts  # Validasi field jadwal
│   │   ├── conflictChecker.ts    # Cek overlap jadwal
│   │   └── formatters.ts         # Format display (jam, tanggal, dll)
│   │
│   ├── constants/
│   │   ├── colors.ts             # Design token warna
│   │   ├── typography.ts         # Font sizes & weights
│   │   ├── spacing.ts            # Spacing scale
│   │   └── config.ts             # App config (API_BASE_URL, dll)
│   │
│   └── theme/
│       ├── theme.ts              # Unified theme object
│       └── ThemeProvider.tsx     # Context provider
│
├── assets/
│   ├── fonts/                    # Custom font files
│   ├── images/
│   └── icons/
│
├── docs/
│   ├── ARCHITECTURE.md           # File ini
│   ├── API_GUIDE.md              # Panduan endpoint backend
│   ├── DESIGN_SYSTEM.md          # Token & komponen desain
│   └── AGENT_CONTEXT.md          # Context untuk AI agent
│
├── app.json                      # Expo config
├── babel.config.js
├── tsconfig.json
├── package.json
└── .env                          # Environment variables
```

---

## 📦 Tech Stack & Libraries

### Core
| Library | Versi | Kegunaan |
|---------|-------|---------|
| `expo` | ~52.x | Framework multiplatform |
| `expo-router` | ~4.x | File-based navigation |
| `react-native` | 0.76.x | UI primitives |
| `typescript` | ^5.x | Type safety |

### State Management
| Library | Kegunaan |
|---------|---------|
| `zustand` | Global state (ringan, no boilerplate) |
| `@tanstack/react-query` | Server state, caching, refetch |

### Networking
| Library | Kegunaan |
|---------|---------|
| `axios` | HTTP client + interceptors |

### Storage
| Library | Kegunaan |
|---------|---------|
| `expo-sqlite` | Local database jadwal |
| `expo-secure-store` | Simpan JWT token |
| `@react-native-async-storage/async-storage` | Preferensi pengguna |

### UI & Styling
| Library | Kegunaan |
|---------|---------|
| `nativewind` v4 | Tailwind CSS untuk React Native |
| `react-native-reanimated` | Animasi performa tinggi |
| `react-native-gesture-handler` | Swipe & gesture |
| `@gorhom/bottom-sheet` | Bottom sheet modal |
| `react-native-calendars` | Komponen kalender |

### Notifications
| Library | Kegunaan |
|---------|---------|
| `expo-notifications` | Push & local notifications |
| `expo-task-manager` | Background task |

### Auth
| Library | Kegunaan |
|---------|---------|
| `expo-auth-session` | OAuth Google |

### Dev Tools
| Library | Kegunaan |
|---------|---------|
| `eslint` + `prettier` | Code quality |
| `jest` + `@testing-library/react-native` | Unit testing |

---

## 🔁 Data Flow

```
User Input (NarasiInput)
       │
       ▼
[useScheduleExtract hook]
       │  POST /extract {text}
       ▼
[Backend → LLM API]
       │  JSON: {title, date, time, location, description}
       ▼
[extract.store] ← hasil ekstraksi disimpan ke global state
       │
       ▼
[SchedulePreview] ← user review & edit
       │  confirm / dismiss
       ▼
[useSchedules hook]
       │  POST /schedules (simpan ke server)
       │  schedule.store.ts (simpan ke SQLite lokal)
       ▼
[ScheduleList / Calendar] ← tampil di UI
       │
       ▼
[reminder.ts] ← jadwalkan push notification
```

---

## 🎨 Design System Overview

Lihat `DESIGN_SYSTEM.md` untuk detail lengkap.

### Color Tokens
```ts
// src/constants/colors.ts
export const Colors = {
  primary: '#1A6BFF',      // Biru utama — action & CTA
  primaryLight: '#E8F0FF', // Background highlight
  secondary: '#0FD399',    // Hijau aksen — sukses / konfirmasi
  danger: '#FF4444',       // Merah — error / konflik
  warning: '#FFA500',      // Oranye — peringatan
  surface: '#FFFFFF',      // Card background
  background: '#F5F7FA',   // App background
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
}
```

### Spacing Scale
```ts
// src/constants/spacing.ts
export const Spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48
}
```

### Typography
```ts
// src/constants/typography.ts
// Font: "Plus Jakarta Sans" (display) + "DM Sans" (body)
export const Typography = {
  h1: { fontSize: 28, fontWeight: '600', lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '600', lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: '600', lineHeight: 26 },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 24 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '600', lineHeight: 20 },
}
```

---

## Feature Micro-Directory

Route files in `app/` should stay thin. They should import and render a feature page, for example:

```tsx
// app/(tabs)/index.tsx
import { DashboardPage } from '@/src/features/dashboard/pages/DashboardPage';

export default function HomeScreen() {
  return <DashboardPage />;
}
```

Use this structure when a feature has screen-level composition and local components:

```txt
src/features/<feature>/
|-- components/   # UI pieces used only by this feature
|-- pages/        # Screen composition rendered by app routes
|-- data/         # Temporary local data, fixtures, or feature constants
|-- utils/        # Feature-specific pure helpers
`-- types.ts      # Feature-only types
```

Current feature modules:

```txt
src/features/auth/
|-- components/
|-- pages/
`-- types.ts

src/features/dashboard/
|-- components/
|-- data/
|-- pages/
|-- utils/
`-- types.ts

src/features/calendar/
|-- components/
|-- pages/
|-- utils/
`-- types.ts

src/features/notifications/
|-- components/
|-- pages/
`-- types.ts

src/features/profile/
|-- components/
|-- pages/
`-- types.ts

src/features/ai/
|-- components/
|-- pages/
`-- types.ts

src/features/navigation/
`-- components/   # Shared bottom dock/navigation surface

src/features/schedule/
|-- data/         # Shared prompt-derived schedule fixtures until API/store integration
`-- store/        # Temporary in-memory prompt schedule store
```

Promote code to `src/components`, `src/hooks`, or `src/utils` only when it is reused across features.
