# ZAID — User Flow Documentation
> Dokumentasi end-to-end user journey untuk ZAID Mobile App.
> Berdasarkan kode production per Juli 2026.

---

## Table of Contents

1. [App Overview](#app-overview)
2. [Cold Start & Initialization](#cold-start--initialization)
3. [Routing Gate Logic](#routing-gate-logic)
4. [Onboarding Flow](#onboarding-flow)
5. [Authentication Flow](#authentication-flow)
6. [AI Assistant (Landing Page)](#ai-assistant-landing-page)
7. [Dashboard / Home](#dashboard--home)
8. [Calendar](#calendar)
9. [Notifications / Reminders](#notifications--reminders)
10. [Profile & Settings](#profile--settings)
11. [Deep Linking from Push Notifications](#deep-linking-from-push-notifications)
12. [Logout](#logout)
13. [Developer Mode](#developer-mode)
14. [Dual Mode: Backend vs Local UI](#dual-mode-backend-vs-local-ui)
15. [Flow Diagram](#flow-diagram)

---

## App Overview

**ZAID** adalah AI schedule assistant yang mengubah chat, email, dokumen, atau catatan menjadi jadwal terstruktur. Dibangun dengan Expo Router + React Native, backend Laravel Sanctum JWT di `zaidassistant.id/api`.

**Fitur utama:**
- Google Sign-In + WhatsApp OTP verification
- AI prompt → auto-extract schedule (judul, tanggal, jam, recurrence, reminder)
- Upload gambar untuk OCR/extract schedule
- Calendar view dengan Google Calendar integration
- Reminder via WhatsApp atau native push notification
- Offline mode dengan local seeded data

---

## Cold Start & Initialization

**File:** `app/_layout.tsx`

```
App Launch
  │
  ├─ Load font Poppins (400, 500, 600)
  ├─ Init auth store (useSyncExternalStore)
  │   └─ checkAuth():
  │       ├─ useLocalUiData? → developer session
  │       ├─ developer session exists? → developer user
  │       ├─ Token exists? → GET /v1/me → isAuthenticated = phone_verified === true
  │       │   (jika fetch gagal → clear token, isAuthenticated = false)
  │       └─ No token → isAuthenticated = false
  │
  ├─ configureNativeNotifications(false)
  │   └─ Set Android channel "reminders"
  │       (HIGH importance, vibrationPattern: [0,250,250,250], lightColor: '#A855F7')
  │
  ├─ fetchReminders() → GET /v1/reminders
  │
  ├─ Read AsyncStorage 'onboarding_completed' flag
  │
  ├─ Register AppState listener
  │   └─ App foregrounded → re-fetch reminders
  │
  ├─ Register notification tap listener
  │   └─ Deep link: taskId → /schedule/{id}, calendarEventId → /explore
  │
  └─ Register 401 unauthorized listener
      └─ Auto logout
```

Splash screen hides hanya setelah `fontsLoaded && isInitialized`. Sebelumnya返回 `null`.

---

## Routing Gate Logic

**File:** `app/_layout.tsx:101-107`

```
NOT authenticated
  ├─ onboarding NOT completed → Redirect /(onboarding)
  └─ onboarding completed    → Redirect /(auth)/login

Authenticated + in auth/onboarding group → Redirect /(tabs)/ai
```

**Stack Navigator (root):**
| Screen | Presentation | Notes |
|--------|-------------|-------|
| `(onboarding)` | default | Onboarding pages |
| `(auth)` | default | Auth flow (Google, phone, OTP) |
| `(tabs)` | default | Main app tabs |
| `(app)` | default | Legacy app group (placeholder) |
| `schedule/[id]` | modal | Schedule detail |
| `modal` | modal | Generic modal |

---

## Onboarding Flow

**Files:** `app/(onboarding)/`

**Trigger:** First-time user (flag `onboarding_completed` di AsyncStorage !== 'true').

```
index → Redirect to page-1

page-1: "Selamat datang di ZAID"
  Logo + judul + subtitle:
  "Asisten AI untuk mengubah chat, email, dan catatan
   menjadi jadwal terstruktur."
  │
  [Lanjut]
  │
  ▼
page-2: "Tambah Jadwal Sekali Ketik"
  Logo + judul + subtitle:
  "Tempel chat WhatsApp atau ketik singkat. ZAID akan
   mendeteksi judul, tanggal, dan jam secara otomatis."
  │
  [Mulai]
  │ → AsyncStorage.setItem('onboarding_completed', 'true')
  │ → router.replace('/(auth)/login')
  ▼
Login Page
```

**Catatan:**
- Onboarding hanya tampil sekali per install
- Flag disimpan di AsyncStorage (bukan SecureStore)
- Tidak ada skip button, harus melalui 2 halaman
- Gradient background: page-1 (`#EEF2FF → #FFFFFF`), page-2 (`#FFFFFF → #F5F7FA`)

---

## Authentication Flow

**Files:** `app/(auth)/AuthFlowPage.tsx` → `src/features/auth/pages/AuthFlowPage.tsx`

### State Machine

```
AuthStep: 'welcome' | 'google' | 'phone' | 'otp' | 'connect' | 'done' | 'loading'

AuthFlowPage hanya menggunakan 4 step secara runtime: 'google', 'phone', 'otp', 'loading'.
```

### Step 1: Google Sign-In (Default)

```
[Sign in with Google]
  │ → expo-auth-session → Google OAuth
  │ → Dapat idToken
  │ → POST /v1/auth/google { id_token, device: { device_name, platform } }
  │
  ▼
Backend Response:
  { access_token, user, onboarding: { next_step } }
  │
  ├─ next_step === 'dashboard' → Step 'loading' → login() → DashboardPage
  ├─ next_step === 'phone_input' → Step 'phone'
  └─ next_step === 'verify_otp' → Step 'otp'
```

### Step 2: Phone Input

```
Input nomor WhatsApp (+62xxx)
  │
  [Kirim OTP]
  │ → Validasi: minimal 8 digit
  │ → POST /v1/onboarding/phone { phone_number, country_code: 'ID' }
  │
  ├─ Success: dapat verification_id → Step 'otp'
  └─ Error "already linked":
      "Nomor WhatsApp ini sudah dipakai di akun lain.
       Gunakan nomor lain atau login dengan akun Google
       pemilik nomor tersebut."
```

### Step 3: OTP Verification

```
6-digit OTP input
  - Auto-advance ke input berikutnya saat digit diisi
  - Backspace hapus digit sebelumnya

[Verifikasi]
  │ → POST /v1/onboarding/phone/verify { verification_id, otp_code }
  │
  ├─ Success:
  │   → POST /v1/me (getProfile)
  │   → login(accessToken, profile) → isAuthenticated = true
  │   → Loading spinner 900ms → DashboardPage
  │
  └─ Error → "OTP is invalid or expired. Please try again."

[Resend OTP]
  │ → POST /v1/onboarding/phone/resend-otp { phone_number }
  │ → dapat verification_id baru
```

### Step 4: Loading

```
AuthLoadingContent (spinner/animation)
  → 900ms delay → redirect ke DashboardPage
```

### Auth Store

**File:** `src/store/auth.store.ts`

Global in-memory state via `useSyncExternalStore` (bukan Zustand/Redux).

**Token storage:** `expo-secure-store` (native) / `window.localStorage` (web fallback).

| State | Type | Description |
|-------|------|-------------|
| `isAuthenticated` | boolean | Status login |
| `user` | UserProfile \| null | Data user |
| `isInitialized` | boolean | Auth check selesai |

**UserProfile:**
```typescript
{
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  phone_number?: string;
  phone_verified?: boolean;
  status?: string;
}
```

---

## AI Assistant (Landing Page)

**File:** `src/features/ai/pages/AiPromptPage.tsx`

User masuk ke halaman ini setelah login. Ini adalah landing page utama.

### UI Layout

```
┌─────────────────────────────────────────┐
│ [≡]            ZAID              [🔔]  │
│          Schedule assistant              │
├─────────────────────────────────────────┤
│ ✨ Fast like chat, structured for your calendar.│
│                                         │
│ [Bot avatar] Hi, I can help turn your  │
│              messages into schedules...│
│                                         │
│                    [User bubble]        │
│                    Meeting client besok │
│                    jam 3 sore           │
│                                         │
│ [Bot avatar] 🔄 (thinking dots)        │
│              Reading your message...   │
│                                         │
│ [Bot avatar] ✅ I found a schedule:    │
│              Meeting client on         │
│              2026-07-31 at 15:00.      │
│                                         │
│         ┌──────────────────────┐       │
│         │ ✅ Schedule detected │       │
│         └──────────────────────┘       │
├─────────────────────────────────────────┤
│ 🟢 Attach a document/image or type a schedule message │
├─────────────────────────────────────────┤
│ [📎] [Type a message...        ] [↑]  │
└─────────────────────────────────────────┘
```

### Input Options

1. **Teks:** Ketik natural language
   - "Meeting client besok jam 3 sore"
   - "Submit tugas kuliah hari Jumat jam 9 pagi, ingatkan 1 jam sebelum"
   - "Rapat mingguan setiap Senin jam 10"

2. **Upload gambar:** JPG/PNG/WEBP
   - POST /v1/upload → dapat URL
   - URL dikirim ke POST /v1/prompts sebagai attachment
   - Backend OCR/analyze image

3. **Paste teks chat:** Tempel dari WhatsApp, email, dll
   - Backend extract meeting/schedule details

### Processing Flow

```
User Submit
  │
  ├─ Kirim user message ke chat UI
  ├─ Kirim thinking message (dots animation)
  │
  ├─ Config.useLocalUiData?
  │   ├─ YES → parseLocalSchedule(text)
  │   │         Regex parsing: parseLocalTime, parseLocalDate,
  │   │         parseTitle, parseLocalReminderMinutes
  │   │
  │   └─ NO → POST /v1/prompts { text, attachments }
  │            │
  │            ├─ parse_status === 'parsed'
  │            │   → result.task entities → schedule
  │            │
  │            ├─ requires_confirmation
  │            │   → show confirmation entities
  │            │   → POST /v1/prompts/{id}/confirm { confirmed: true }
  │            │
  │            └─ unsupported/failed
  │                → error message
  │
  ▼
SchedulePreviewModal
  │ → User review & edit: title, date, time, reminder, channel
  │
  [Save to Calendar]
  │ → POST /v1/tasks (createTask)
  │ → POST /v1/reminders (if reminderEnabled)
  │ → fetchPromptSchedules() (refresh list)
  │
  ▼
Chat: Saved "{title}" to Dashboard and Calendar.
```

### Drawer Menu (tombol ≡)

```
┌────────────────┐
│ Menu           │
│ [📅] Calendar  │ → push /(tabs)/explore
│                │
│                │
│                │
│ [👤] Profile & Settings │ → push /(tabs)/profile
└────────────────┘
```

### Notification Dropdown (tombol 🔔)

```
┌────────────────────────────┐
│ Notifikasi       Lihat semua│
│────────────────────────────│
│ (EmptyOrSampleNotifications)│
└────────────────────────────┘
→ Link ke /(tabs)/notification
```

---

## Dashboard / Home

**File:** `src/features/dashboard/pages/DashboardPage.tsx`

### Layout

```
Good Day 👋  (wave animation)
Nama User

[Search bar]

[Date strip: horizontal 5 hari]
  Jul 28  29  [30]  31  Aug 1

Task Cards:
  ┌───────────────────────────┐
  │ 🟣 Meeting Client         │
  │ 📅 2026-07-30  19:00      │
  │ 🔔 WhatsApp, 30 min       │
  └───────────────────────────┘

(DashboardBottomDock navigation)
```

### Behavior

- Fetch: `GET /v1/tasks` via `fetchPromptSchedules()`
- Date strip: horizontal calendar 5 hari dari tanggal hari ini
- Search: filter by `title`, `description`, `sourcePrompt`
- Filter: tampilkan schedules dengan `endDate >= selectedDate`
- Empty state: `EmptyScheduleState` component
- Error state: tap untuk retry

---

## Calendar

**File:** `src/features/calendar/pages/CalendarPage.tsx`

### Layout

```
┌───────────────────────────────┐
│  ◀  Juli 2026  ▶    [Today]  │
│  Mo Tu We Th Fr Sa Su        │
│     1  2  3  4  5  6  7      │
│  8  9 10 11 12 13 14         │
│ 15 16 17 18 19 20 21         │
│ 22 23 24 25 26 27 28         │
│ 29 [30] 31                    │
├───────────────────────────────┤
│  July 30 - 30          (sticky)│
│  [Today] [Recent] [Upcoming] │
├───────────────────────────────┤
│  Schedule cards list          │
│  + Event cards (Google Cal)   │
└───────────────────────────────┘
```

### Behavior

- **Calendar grid:** Full month view dengan range selection (start + end date)
- **Marked dates:** Tanggal dengan schedule ditandai dot
- **Sticky bar:** Label bulan + filter bar, menempel saat scroll
- **Filters:**
  - `today` — schedules hari ini
  - `recent` — semua schedules dalam range
  - `upcoming` — schedules yang belum lewat
- **Range selection:** Tap tanggal → tap tanggal lain untuk range
- **Fetch data:**
  - `GET /v1/tasks` (schedules)
  - `GET /v1/events?from=...&to=...` (Google Calendar events)
- **CalendarTaskSheet:** Bottom sheet untuk add/edit manual schedule
- **EventCard:** Menampilkan events dari Google Calendar

---

## Notifications / Reminders

**File:** `src/features/notifications/pages/NotificationsPage.tsx`

### Layout

```
Reminder
Sinkron dari backend ZAID. WhatsApp menjadi channel default.

[All] [Today] [Upcoming]

┌─────────────────────────────┐
│ ReminderCard                │
│ Meeting Client              │
│ ⏰ 18:30 (30 min before)   │
│ 📱 Channel: WhatsApp        │
│ Status: pending             │
│ [Delete]                    │
└─────────────────────────────┘

(pull-to-refresh)
```

### Behavior

- Fetch: `GET /v1/reminders` via `fetchReminders()`
- Filter: `all`, `today`, `upcoming` (pending + date > now)
- Pull-to-refresh untuk manual refresh
- Delete reminder: `DELETE /v1/reminders/{id}`
- Auto-sync: setiap reminders berubah → `syncAppReminderNotifications()`

### Reminder Channels

| Channel | Behavior |
|---------|----------|
| `app` | Native push notification via expo-notifications |
| `whatsapp` | Handled by backend (tidak schedule di device) |

### Native Notification Sync

**File:** `src/services/notifications/nativeNotifications.ts`

```
syncAppReminderNotifications(reminders):
  1. Filter: status === 'pending' && channel !== 'whatsapp'
  2. Cancel stale scheduled notifications (id tidak valid lagi)
  3. Schedule new notifications:
     - Title: "Reminder ZAID"
     - Body: "{task_title || calendar_event_title || 'Jadwal kamu'} sebentar lagi dimulai."
     - Trigger: date-based (remind_at)
     - Channel: "reminders" (Android)
```

---

## Profile & Settings

**File:** `src/features/profile/pages/ProfilePage.tsx`

### Layout

```
Profile

┌─────────────────────────┐
│ [Avatar]  Nama User     │
│           email@google   │
└─────────────────────────┘

Account Settings
  ├─ My Account (Synced from your connected Google profile)
  ├─ Face ID / Touch ID (toggle, placeholder)
  └─ Two-Factor Authentication (placeholder)

Support
  ├─ Help & Support
  └─ About App

[🔴 Log Out]
```

### Behavior

- Profile data dari auth store (user object dari Google login)
- Settings items adalah placeholder UI
- Logout: `POST /v1/auth/logout` → clear token → redirect ke Login

---

## Deep Linking from Push Notifications

**File:** `app/_layout.tsx:69-72`

```
User tap notifikasi native:
  │
  ├─ data.taskId exists → router.push('/schedule/{taskId}')
  └─ data.calendarEventId exists → router.push('/explore')
```

**Deep link targets:**
- `/schedule/[id]` — Modal detail jadwal (placeholder)
- `/(tabs)/explore` — Calendar page

---

## Logout

**File:** `src/store/auth.store.ts`

```
Profile → [Log Out]
  │
  ├─ Config.useLocalUiData?
  │   └─ YES → Keep developer session, stay authenticated
  │
  ├─ Token exists?
  │   └─ POST /v1/auth/logout (server-side invalidate)
  │
  ├─ deleteAuthToken() (SecureStore)
  ├─ deleteDeveloperAuthSession() (SecureStore)
  │
  ├─ user = null
  ├─ isAuthenticated = false
  │
  └─ Routing gate → Redirect /(auth)/login
```

---

## Developer Mode

**Trigger:** `EXPO_PUBLIC_ENABLE_DEV_SIGN_IN=true`

```
Login Page
  └─ Tombol "Developer Sign-In" muncul
      │
      [Developer Sign-In]
      │ → loginAsDeveloper()
      │ → deleteAuthToken()
      │ → setDeveloperAuthSession()
      │ → user = hardcoded developerUser:
      │     {
      │       id: 'developer-user',
      │       email: 'developer@zaid.local',
      │       full_name: 'Developer Preview',
      │       phone_number: '+620000000000',
      │       phone_verified: true,
      │       status: 'active'
      │     }
      │ → isAuthenticated = true
      ▼
  Dashboard (dengan local seeded data)
```

**Efek ke semua fitur:**
- Semua API store punya branch `Config.useLocalUiData`
- Schedules: `buildPromptSchedules()` (hardcoded)
- Reminders: `seedLocalReminders()` (hardcoded)
- AI prompt: `parseLocalSchedule()` (regex-based, no backend)
- Logout: skip server-side call, keep developer session

---

## Dual Mode: Backend vs Local UI

**File:** `src/constants/config.ts`

```
Config.useLocalUiData = process.env.EXPO_PUBLIC_USE_LOCAL_UI_DATA === 'true'
Config.apiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'https://zaidassistant.id/api'
Config.appName = process.env.EXPO_PUBLIC_APP_NAME ?? 'ZAID'
```

| Feature | Backend Mode | Local UI Mode |
|---------|-------------|---------------|
| Auth | Google OAuth + Sanctum JWT | Developer session (bypass) |
| Schedules | GET/POST /v1/tasks | Hardcoded seeded data |
| Reminders | GET/POST/PATCH/DELETE /v1/reminders | Hardcoded seeded data |
| Events | GET /v1/events (Google Calendar) | Empty array |
| AI Prompt | POST /v1/prompts (LLM backend) | Local regex parsing |
| File Upload | POST /v1/upload (multipart) | Local URI reference |
| Profile | GET /v1/me | Hardcoded developer user |
| Logout | POST /v1/auth/logout | Skip server call |

---

## Flow Diagram

```
┌───────────────┐
│   App Start   │
└───────┬───────┘
        ▼
┌───────────────────┐
│ Font + Auth Init  │
│ + Notifications   │
│ + Reminders       │
│ + Onboarding Flag │
└───────┬───────────┘
        ▼
┌───────────────────┐     no      ┌─────────────┐
│ Onboarding done?  │────────────▶│  Onboarding  │
└───────┬───────────┘             │  Page 1 → 2  │
        │ yes                      └──────┬──────┘
        │                                 │
        │         ┌───────────────────────┘
        │         ▼
        │   ┌─────────────┐
        │   │    Login     │
        │   │  (Google)    │
        │   └──────┬──────┘
        │          │
        │    ┌─────┴──────┐
        │    │ Need phone? │
        │    ├─ yes ──────▶ Phone Input → OTP → ✅
        │    └─ no ───────▶ ✅
        │         │
        ▼         ▼
┌─────────────────────────────────────┐
│         AI Assistant                │
│    (landing page after login)       │
│                                     │
│  Input: teks / gambar / paste chat  │
│         │                           │
│         ▼                           │
│  Backend AI parse                   │
│  POST /v1/prompts                   │
│         │                           │
│         ▼                           │
│  SchedulePreviewModal               │
│         │                           │
│  [Save] ▼                           │
│  POST /v1/tasks                     │
│  POST /v1/reminders                 │
└──────────┬──────────────────────────┘
           │
    ┌──────┼──────┬──────────┬──────────┐
    ▼      ▼      ▼          ▼          ▼
┌───────┐┌──────┐┌───────┐┌───────┐┌───────┐
│ Home  ││Calen-││ Notif ││Profile││  AI   │
│(list) ││ dar  ││(remind)││ (set) ││Asst.  │
└───────┘└──────┘└───────┘└───────┘└───────┘
```

---

## Navigation Structure

### Root Stack (`app/_layout.tsx`)

```
Stack
  ├─ (onboarding) — headerShown: false
  │   ├─ index → Redirect to page-1
  │   ├─ page-1
  │   └─ page-2
  │
  ├─ (auth) — headerShown: false
  │   └─ [login, register, phone, otp] → AuthFlowPage
  │
  ├─ (tabs) — headerShown: false
  │   ├─ index → DashboardPage (Home)
  │   ├─ ai → AiPromptPage (AI Assistant)
  │   ├─ explore → CalendarPage
  │   ├─ notification → NotificationsPage
  │   └─ profile → ProfilePage
  │
  ├─ (app) — headerShown: false (legacy, placeholder, Tabs navigator)
  │   ├─ schedules
  │   ├─ calendar
  │   └─ settings
  │
  ├─ schedule/[id] — modal, headerShown: false
  └─ modal — presentation: modal
```

**Catatan:** File `app/schedule/edit/[id].tsx` ada di codebase tapi **tidak diregistrasi** sebagai `Stack.Screen` di root layout. Screen ini orphaned dan tidak dapat diakses melalui navigasi normal.

### Tab Bar (hidden, navigated via custom bottom dock)

Tab bar di-hide (`tabBarStyle: { display: 'none' }`). Navigasi pakai `DashboardBottomDock`, `CalendarBottomDock`, atau `AppBottomDock` components.

| Tab | Route | Icon | Page |
|-----|-------|------|------|
| Home | `/(tabs)/index` | house.fill | DashboardPage |
| Schedule | `/(tabs)/explore` | calendar | CalendarPage |
| Notification | `/(tabs)/notification` | bell.fill | NotificationsPage |
| Profile | `/(tabs)/profile` | person.fill | ProfilePage |
| AI Assistant | `/(tabs)/ai` | robot-happy | AiPromptPage |

---

## API Endpoints Summary

| Endpoint | Method | Purpose | Used In |
|----------|--------|---------|---------|
| `/v1/auth/google` | POST | Google OAuth login | AuthFlowPage |
| `/v1/auth/logout` | POST | Server-side logout | Profile, auto-logout |
| `/v1/me` | GET | User profile | checkAuth, auth flow |
| `/v1/me` | PATCH | Update profile | Profile |
| `/v1/onboarding/phone` | POST | Submit phone for OTP | AuthFlowPage |
| `/v1/onboarding/phone/verify` | POST | Verify OTP | AuthFlowPage |
| `/v1/onboarding/phone/resend-otp` | POST | Resend OTP | AuthFlowPage |
| `/v1/onboarding/status` | GET | Check onboarding status | (available) |
| `/v1/prompts` | POST | AI prompt processing | AiPromptPage |
| `/v1/prompts/{id}/confirm` | POST | Confirm AI suggestion | AiPromptPage |
| `/v1/upload` | POST | File upload (multipart) | AiPromptPage |
| `/v1/tasks` | GET | List schedules | Dashboard, Calendar |
| `/v1/tasks` | POST | Create schedule | Calendar, AI save |
| `/v1/tasks/{id}` | GET | Get schedule by ID | Schedule detail |
| `/v1/tasks/{id}` | PUT | Update schedule | Calendar edit |
| `/v1/tasks/{id}` | DELETE | Delete schedule | Calendar |
| `/v1/tasks/{id}/complete` | POST | Mark schedule done | Calendar |
| `/v1/tasks/{id}/restore` | POST | Restore completed schedule | Calendar |
| `/v1/calendar/month` | GET | Monthly calendar data | Calendar |
| `/v1/agenda/day` | GET | Daily agenda data | Calendar |
| `/v1/reminders` | GET | List reminders | Notifications |
| `/v1/reminders` | POST | Create reminder | Schedule save |
| `/v1/reminders/{id}` | PATCH | Update reminder | Edit schedule |
| `/v1/reminders/{id}` | DELETE | Delete reminder | Notifications |
| `/v1/events` | GET | Google Calendar events | Calendar |
| `/v1/events` | POST | Create event | Calendar |
| `/v1/events/{id}` | PATCH | Update event | Calendar |
| `/v1/events/{id}` | DELETE | Delete event | Calendar |
| `/v1/integrations/google-calendar/connect` | GET | Connect Google Calendar | (available) |
| `/v1/integrations/google-calendar/status` | GET | Calendar connection status | (available) |
| `/v1/integrations/google-calendar` | DELETE | Disconnect Google Calendar | (available) |
| `/v1/settings` | GET | User settings | (available) |
| `/v1/settings` | PATCH | Update settings | (available) |

---

## State Management

| Store | Pattern | File | Persistence |
|-------|---------|------|-------------|
| `auth.store` | `useSyncExternalStore` | `src/store/auth.store.ts` | SecureStore (token) |
| `promptScheduleStore` | `useSyncExternalStore` | `src/features/schedule/store/promptScheduleStore.ts` | None (refetch on mount) |
| `reminderStore` | `useSyncExternalStore` | `src/features/reminders/store/reminderStore.ts` | None (refetch on mount) |
| `eventStore` | `useSyncExternalStore` | `src/features/events/store/eventStore.ts` | None (refetch on mount) |

Semua store menggunakan vanilla `useSyncExternalStore` dengan manual `emit()`/`subscribe()`. Tidak ada Redux atau Zustand.
