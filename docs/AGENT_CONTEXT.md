# ARIA — Agent Context
> File ini adalah sumber kebenaran tunggal (single source of truth) untuk AI coding agent.
> Baca file ini SEBELUM menulis kode apapun untuk proyek ARIA.
> Update file ini setiap kali ada perubahan arsitektur signifikan.

---

## 🤖 Untuk AI Agent: Cara Menggunakan Dokumen Ini

Kamu adalah AI coding agent yang bekerja pada proyek **ARIA** — aplikasi mobile
manajemen jadwal berbasis Expo + React Native. Sebelum menulis kode apapun:

1. **Baca `ARCHITECTURE.md`** — pahami struktur direktori dan dependencies
2. **Baca `DESIGN_SYSTEM.md`** — pahami token warna, typography, dan spesifikasi komponen
3. **Baca `API_GUIDE.md`** — pahami endpoint backend dan cara integrasi
4. **Baca bagian yang relevan di dokumen ini** — pahami konteks bisnis dan aturan kode

---

## 📋 Project Context

**Nama Produk:** ARIA (Automatic Record & Intelligent Agenda)  
**Platform:** Android (≥8.0) & iOS (≥13) via Expo ~52.x  
**Framework:** Expo Router v4 (file-based navigation)  
**Bahasa:** TypeScript strict mode  
**State:** Zustand (global) + React Query (server state)  
**Backend:** REST API di `http://43.134.61.160` (private server)  
**Tujuan Utama:** Ekstrak jadwal dari teks narasi bebas (Bahasa Indonesia/Inggris) via LLM  

---

## 🧠 Domain Model

### Schedule
```ts
interface Schedule {
  id: string;                  // UUID
  userId: string;
  title: string;               // Judul kegiatan — required
  date: string;                // "YYYY-MM-DD" — required
  time: string;                // "HH:mm" — required
  location?: string;           // Lokasi — optional
  description?: string;        // Deskripsi singkat — optional
  reminderMinutes: number;     // Default: 30
  status: 'active' | 'done';
  createdAt: string;           // ISO timestamp
  updatedAt: string;
}
```

### ExtractedSchedule (hasil LLM, sebelum disimpan)
```ts
interface ExtractedSchedule {
  title: string;
  date: string;          // "YYYY-MM-DD", perlu resolve dari "besok", "minggu depan", dll
  time: string;          // "HH:mm"
  location?: string;
  description?: string;
  confidence: number;    // 0-1, akurasi prediksi LLM
}
```

### User
```ts
interface User {
  id: string;
  name: string;
  email: string;
}
```

---

## 📁 Conventions & Rules

### File Naming
- **Components:** `PascalCase.tsx` (e.g., `ScheduleCard.tsx`)
- **Hooks:** `camelCase.ts` dengan prefix `use` (e.g., `useSchedules.ts`)
- **Stores:** `camelCase.store.ts` (e.g., `schedule.store.ts`)
- **Services:** `camelCase.api.ts` atau `camelCase.service.ts`
- **Types:** `camelCase.types.ts`
- **Utils:** `camelCase.ts`
- **Constants:** `camelCase.ts`, export named constants

### Import Aliases (tsconfig.json)
```json
{
  "paths": {
    "@/*": ["./src/*"],
    "@components/*": ["./src/components/*"],
    "@hooks/*": ["./src/hooks/*"],
    "@store/*": ["./src/store/*"],
    "@services/*": ["./src/services/*"],
    "@types/*": ["./src/types/*"],
    "@utils/*": ["./src/utils/*"],
    "@constants/*": ["./src/constants/*"]
  }
}
```

Selalu gunakan alias, JANGAN gunakan relative import `../../../`.

### Kode Style
```ts
// ✅ DO: Functional component + TypeScript
export function ScheduleCard({ title, date, onPress }: ScheduleCardProps) { ... }

// ✅ DO: Named export untuk components
export function Button(...) { ... }

// ✅ DO: Destructure props
function MyComp({ value, onChange }: Props) { ... }

// ✅ DO: Gunakan Colors/Spacing constants, BUKAN hardcode
import { Colors, Spacing, Radius } from '@constants/colors';
style={{ backgroundColor: Colors.primary, padding: Spacing.md }}

// ❌ DON'T: Hardcode warna/spacing
style={{ backgroundColor: '#1A6BFF', padding: 16 }}

// ✅ DO: Error handling di setiap API call
const { data, isLoading, error } = useSchedules();
if (error) return <ErrorState message={error.message} />;
if (isLoading) return <SkeletonList />;

// ✅ DO: Pisahkan logic dari UI
// Logic → hook, UI → component
```

### Zustand Store Pattern
```ts
// src/store/schedule.store.ts
import { create } from 'zustand';

interface ScheduleState {
  schedules: Schedule[];
  activeFilter: 'day' | 'week' | 'month';
  setSchedules: (s: Schedule[]) => void;
  setFilter: (f: 'day' | 'week' | 'month') => void;
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  schedules: [],
  activeFilter: 'week',
  setSchedules: (schedules) => set({ schedules }),
  setFilter: (activeFilter) => set({ activeFilter }),
}));
```

### React Query Pattern
```ts
// Query keys harus konsisten:
const QUERY_KEYS = {
  schedules: (filter?: string) => ['schedules', filter] as const,
  schedule: (id: string) => ['schedule', id] as const,
};

// Selalu invalidate query setelah mutation
onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.schedules() })
```

---

## 🔑 Environment Variables

```bash
# .env (di root project)
EXPO_PUBLIC_API_URL=http://43.134.61.160
EXPO_PUBLIC_APP_NAME=ARIA
```

Akses di kode: `process.env.EXPO_PUBLIC_API_URL`  
Prefix `EXPO_PUBLIC_` wajib agar ter-expose ke client.

---

## 🗺️ Navigation Structure

```
Root (_layout.tsx)
├── (auth)/                ← Unauthenticated group
│   ├── login
│   └── register
│
└── (app)/                 ← Authenticated group (Tab Navigator)
    ├── index              [Tab: Home/Input]
    ├── calendar           [Tab: Kalender]
    ├── schedules          [Tab: Daftar Jadwal]
    └── settings           [Tab: Profil]
    
    # Modal routes (di luar tab):
    schedule/[id]          → Detail jadwal
    schedule/edit/[id]     → Edit jadwal
```

**Root layout** harus cek auth state:
- Jika ada token → redirect ke `/(app)/`
- Jika tidak ada token → redirect ke `/(auth)/login`

---

## 🔔 Notification Flow

```ts
// 1. Request permission saat pertama buka app
// 2. Simpan expo push token ke backend (PUT /users/push-token)
// 3. Saat jadwal disimpan, schedule local notification:

import * as Notifications from 'expo-notifications';

async function scheduleReminder(schedule: Schedule) {
  const triggerDate = new Date(`${schedule.date}T${schedule.time}`);
  triggerDate.setMinutes(triggerDate.getMinutes() - schedule.reminderMinutes);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `⏰ ${schedule.title}`,
      body: `Dimulai dalam ${schedule.reminderMinutes} menit${
        schedule.location ? ` di ${schedule.location}` : ''
      }`,
    },
    trigger: { date: triggerDate },
  });
}
```

---

## 🌐 Offline Support

- Jadwal disimpan ke SQLite lokal (`expo-sqlite`) setelah dikonfirmasi
- Saat offline, tampilkan data dari SQLite; sync ke server saat online
- Gunakan `@tanstack/react-query` dengan `staleTime` dan `gcTime` yang sesuai

---

## ❗ Common Pitfalls to Avoid

1. **Jangan gunakan `StyleSheet.create` dengan hardcode value** — selalu pakai token dari constants
2. **Jangan lupa handle loading dan error state** di setiap screen yang fetch data
3. **Date handling**: selalu gunakan `date-fns` dengan locale `id` (Indonesia) untuk display
4. **Keyboard avoiding**: gunakan `KeyboardAvoidingView` di semua screen dengan input
5. **Safe area**: gunakan `SafeAreaView` atau `useSafeAreaInsets` di semua screen
6. **Android back button**: handle dengan `useBackHandler` di screen yang punya modal
7. **Token expiry**: interceptor axios di `client.ts` sudah handle 401, jangan handle lagi di komponen
8. **LLM date resolution**: "besok", "minggu depan" harus di-resolve relatif terhadap `new Date()` — lakukan di `dateParser.ts`

---

## 📊 LLM Extraction — Edge Cases

Backend mengirim teks ke LLM. AI agent yang membuat komponen frontend harus
mempertimbangkan edge case berikut dari response `/extract`:

| Kasus | Response | Handling UI |
|-------|----------|-------------|
| Teks kosong | 400 VALIDATION_ERROR | Disable tombol Proses |
| Tidak ada jadwal | detected: false | Tampilkan "Tidak ada jadwal ditemukan" |
| Confidence rendah (<0.6) | schedules[].confidence < 0.6 | Tampilkan badge "Perlu verifikasi" |
| Multiple jadwal | schedules.length > 1 | Tampilkan list preview, user pilih mana yang disimpan |
| Date ambigu (tanpa tahun) | date = current year | Asumsikan tahun berjalan |
| Timeout LLM | 408/504 | "Proses terlalu lama, coba lagi" + retry button |

---

## ✅ Definition of Done (per Fitur)

Sebuah fitur dianggap selesai jika:
- [ ] Komponen ter-render tanpa error di Android & iOS
- [ ] Loading state ditampilkan selama async operation
- [ ] Error state ditampilkan dengan pesan yang informatif
- [ ] Empty state ditampilkan jika data kosong
- [ ] Semua interaktif item punya `accessibilityLabel`
- [ ] Warna/spacing menggunakan token dari constants
- [ ] TypeScript tidak ada `any` kecuali justified dengan komentar
- [ ] Hook memisahkan logic dari UI component

---

## Feature Micro-Directory Rule

Untuk screen kompleks, gunakan pola feature-first seperti `src/features/auth`,
`src/features/dashboard`, dan `src/features/calendar`.

```txt
src/features/<feature>/
|-- components/   # Komponen kecil khusus feature
|-- pages/        # Komposisi screen yang dirender route app
|-- data/         # Fixture/mock/constants lokal feature
|-- utils/        # Helper murni khusus feature
`-- types.ts      # Type lokal feature
```

Route di `app/` harus tipis. Contoh: `app/(tabs)/index.tsx` cukup merender
`DashboardPage` dari `src/features/dashboard/pages/DashboardPage.tsx`.

Untuk data jadwal hasil prompt yang dipakai lintas dashboard dan calendar, gunakan shared
schedule fixture sementara di `src/features/schedule/data/promptSchedules.ts` sampai
integrasi store/API selesai.

Flow UI sementara untuk jadwal hasil AI:

```txt
AI Prompt Page
  -> preview/edit schedule overlay
  -> save via src/features/schedule/store/promptScheduleStore.ts
  -> Dashboard, Calendar, dan Notifications membaca store yang sama
```

Saat backend/local DB siap, ganti store sementara ini dengan `useSchedules`, API `/schedules`,
dan storage lokal sesuai `API_GUIDE.md`.
