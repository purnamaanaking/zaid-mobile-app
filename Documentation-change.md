# Documentation Change

File ini mencatat perubahan yang dibuat selama pengembangan proyek.

## 2026-05-19

### Struktur Proyek
- Membuat struktur direktori sesuai `ARCHITECTURE.md`.
- Menambahkan folder `src/` dengan struktur:
  - `components/`
  - `hooks/`
  - `services/`
  - `store/`
  - `types/`
  - `utils/`
  - `constants/`
  - `theme/`
- Menambahkan folder route:
  - `app/(auth)/`
  - `app/(app)/`
  - `app/schedule/`
- Menyalin dokumentasi utama ke folder `docs/`.
- Menambahkan alias import di `tsconfig.json`.

### Auth Flow UI
- Mengganti tampilan awal `app/(tabs)/index.tsx` menjadi flow auth ZAID.
- Menambahkan welcome page dengan logo ZAID di tengah.
- Menambahkan flow login Google.
- Menambahkan flow input nomor HP untuk OTP.
- Menambahkan flow input OTP.
- Menambahkan flow permintaan koneksi Google Calendar dan Google Tasks.
- Menambahkan halaman selesai setelah permission disetujui.
- Menyembunyikan tab bar agar flow auth tampil fullscreen.

### Responsiveness
- Membuat ukuran layout auth lebih responsif untuk Android dan iOS.
- Menggunakan `useWindowDimensions()` untuk menyesuaikan:
  - tinggi quote panel
  - ukuran font quote
  - ukuran logo
  - padding horizontal
  - lebar input OTP
- Menambahkan `ScrollView` pada bottom sheet agar tetap aman di layar kecil.

### Refactor Step Page
- Memisahkan setiap step auth ke file `.tsx` sendiri:
  - `src/features/auth/pages/WelcomePage.tsx`
  - `src/features/auth/pages/AuthPage.tsx`
  - `src/features/auth/pages/PhoneOtpPage.tsx`
  - `src/features/auth/pages/OtpVerificationPage.tsx`
  - `src/features/auth/pages/GoogleConnectPage.tsx`
  - `src/features/auth/pages/AuthDonePage.tsx`
- Menambahkan shared component dan style di:
  - `src/features/auth/components/AuthShared.tsx`
- Menambahkan tipe auth flow di:
  - `src/features/auth/types.ts`
- Menjadikan `app/(tabs)/index.tsx` sebagai pengatur state flow saja.

### Logo
- Mengganti logo teks/gambar manual pada auth flow dengan asset PNG:
  - `src/components/image/logo-zaid.png`
- Memakai logo PNG yang sama untuk welcome page dan brand header auth.

### Tailwind dan shadcn-style UI
- Menambahkan setup NativeWind/Tailwind untuk Expo:
  - `global.css`
  - `metro.config.js`
  - `postcss.config.mjs`
  - `nativewind-env.d.ts`
- Menambahkan dependency styling:
  - `nativewind`
  - `react-native-css`
  - `tailwindcss`
  - `@tailwindcss/postcss`
  - `postcss`
  - `clsx`
  - `tailwind-merge`
- Menambahkan helper `cn` di `src/utils/cn.ts`.
- Menambahkan override `lightningcss` di `package.json` untuk menghindari error deserialisasi CSS saat bundling.
- Mengimpor `global.css` di `app/_layout.tsx`.
- Mengubah style auth flow dari `StyleSheet.create` menjadi Tailwind `className`.
- Mengubah `src/components/ui/Button.tsx` menjadi komponen Button bergaya shadcn dengan variant `default`, `outline`, dan `ghost`.

### Verifikasi
- `npx tsc --noEmit` berhasil.
- `npm run lint` berhasil.
- `npx expo export --platform android --output-dir .expo-test-export` berhasil.

### Dashboard Feature
- Mengganti home tab menjadi dashboard jadwal sesuai referensi visual.
- Memecah dashboard ke micro-directory:
  - `src/features/dashboard/components/`
  - `src/features/dashboard/pages/`
  - `src/features/dashboard/data/`
  - `src/features/dashboard/utils/`
  - `src/features/dashboard/types.ts`
- Menjadikan `app/(tabs)/index.tsx` route tipis yang hanya merender `DashboardPage`.
- Menambahkan dokumentasi feature micro-directory di `docs/ARCHITECTURE.md` dan `docs/AGENT_CONTEXT.md`.

### Calendar Feature
- Mengganti tab kedua dari starter `Explore` menjadi fitur Schedule/Calendar.
- Menambahkan tampilan calendar detail dengan:
  - header bulan dan tahun
  - navigasi bulan sebelumnya/berikutnya
  - grid tanggal selectable
  - marker untuk tanggal yang memiliki schedule
  - filter `Recent`, `Today`, dan `Upcoming`
  - daftar schedule detail di bawah calendar
  - opsi `Edit` dan `Delete` pada setiap schedule
- Memecah calendar ke micro-directory:
  - `src/features/calendar/components/`
  - `src/features/calendar/pages/`
  - `src/features/calendar/utils/`
  - `src/features/calendar/types.ts`
- Menambahkan shared fixture sementara untuk data schedule hasil prompt di:
  - `src/features/schedule/data/promptSchedules.ts`
- Menjadikan `app/(tabs)/explore.tsx` route tipis yang hanya merender `CalendarPage`.

### Shared Schedule Flow
- Menambahkan tipe `PromptSchedule` untuk jadwal hasil prompt AI.
- Menambahkan in-memory store sementara:
  - `src/features/schedule/store/promptScheduleStore.ts`
- Dashboard, Calendar, Notifications, dan AI Prompt membaca/menulis data schedule dari store yang sama selama sesi app berjalan.

### Notifications Feature
- Menambahkan route tipis:
  - `app/(tabs)/notification.tsx`
- Menambahkan micro-directory:
  - `src/features/notifications/components/`
  - `src/features/notifications/pages/`
  - `src/features/notifications/types.ts`
- Menambahkan daftar reminder dari schedule yang telah dibuat.
- Menambahkan filter notification:
  - `All`
  - `Today`
  - `Upcoming`
- Menambahkan setting reminder:
  - `1 day before`
  - `1 hour before`
  - `30 minutes before`
  - `10 minutes before`

### Profile Feature
- Menambahkan route tipis:
  - `app/(tabs)/profile.tsx`
- Menambahkan micro-directory:
  - `src/features/profile/components/`
  - `src/features/profile/pages/`
  - `src/features/profile/types.ts`
- Menambahkan placeholder informasi akun Google sync.
- Menambahkan placeholder setting profile sesuai referensi:
  - My Account
  - Saved Beneficiary
  - Face ID / Touch ID
  - Two-Factor Authentication
  - Log out
  - Help & Support
  - About App

### AI Prompt Feature
- Menambahkan route tipis:
  - `app/(tabs)/ai.tsx`
- Menambahkan micro-directory:
  - `src/features/ai/components/`
  - `src/features/ai/pages/`
  - `src/features/ai/types.ts`
- Menambahkan prompt composer untuk input:
  - teks
  - voice placeholder
  - image attachment placeholder
- Menambahkan loading state saat prompt diproses.
- Menambahkan overlay preview schedule hasil konversi AI.
- Preview dapat diedit sebelum disimpan.
- Menambahkan pilihan recurring:
  - No Repeat
  - Daily
  - Weekly
  - Monthly
- Saat disimpan, schedule masuk ke shared store dan tampil di Dashboard, Calendar, dan Notifications.

### Navigation
- Menambahkan shared bottom dock:
  - `src/features/navigation/components/AppBottomDock.tsx`
- Bottom dock kini mendukung navigasi:
  - Home
  - Schedule
  - Notification
  - Profile
  - AI Prompt melalui tombol tengah

### Typography
- Mengganti font utama aplikasi menjadi Poppins.
- Menambahkan dependency:
  - `@expo-google-fonts/poppins`
- Meload font Poppins di `app/_layout.tsx`.
- Mengubah token typography ke:
  - `Poppins_400Regular`
  - `Poppins_500Medium`
  - `Poppins_600SemiBold`
- Menurunkan semua font weight tebal (`700`, `800`, `900`, `bold`) menjadi maksimal `600` / semibold.

## 2026-05-25

### UI Layout & Overlap Fixes
- **Welcome Logo Shadow on Web**: Disabled rectangular box-shadow on Web for the Welcome logo. Replaced it with a native-compatible SVG `drop-shadow` filter on the Image element itself for transparent PNG contour mapping.
- **Auth Card Spacing**: Shifted the card downward by setting a positive `marginTop` (from -44/-68 to 8/16), and reduced padding top (from 46/82 to 24/48) and Socrates name margin-top (from 22 to 12) inside `AuthShell` to prevent quote text from being clipped or distorted, creating a spacious and separate layout below the Socrates name.
- **Auth Shell Background Color Bleed**: Wrapped `AuthShell` in a root container `View` with `backgroundColor: '#F8F8FF'` to prevent the system's pitch-black stack background from showing through the margin-top gap between the quote panel and card.
- **Poppins TextInput Clipping on Android**: Added `includeFontPadding: false` and `textAlignVertical: 'center'` on the phone number and OTP digit inputs to prevent Poppins text from clipping at the top.
- **Calendar Date Card Redesign & Animation**: Replaced the solid purple date block on `CalendarScheduleCard.tsx` with a modern light lilac background (`#F5F4FF`) and right border divider. For range-spanning events, dates are stacked vertically as `[Start Date] to [End Date]` to avoid text wrapping, while single dates show as a large centered number. Added a smooth 350ms slide-up & fade-in mounting micro-animation to all cards.

### Date Range Schedules Integration
- **Schedule Schema**: Added optional `endDate?: string;` property to `Schedule` type in `src/types/schedule.types.ts`.
- **Dummy Data Ranges**: Configured mock schedules in `promptSchedules.ts` with date ranges (e.g. multi-day coordination meetings and a multi-day AI Training workshop).
- **Date Utilities**: Updated `formatReadableDate` in dashboard date utils to support date range formatting ("Monday, May 25 - May 28").
- **Dashboard & Notification Pages**: Updated schedules filter logic to support ranges so events appear on all days they span.
- **Calendar Page**: Removed "Your Schedules" title and updated filtering/marked dates to display and mark ranges correctly on the grid.
- **AI Prompt NLP Parser**: Added `parseEndDate` to parse range phrases like "sampai [tanggal]" or "to [tanggal]" in the smart NLP parser.
- **AI Preview Modal**: Redesigned inputs layout to support editing both `Start Date`, `End Date`, `Start Time`, and `End Time`.

### Bottom Navbar Redesign
- **Navbar Size & Floating Height**: Widened navbar (left/right margins 16), increased height to 74, and raised position (bottom 24).
- **AI Icon Upgrade**: Replaced sparkle icon on the FAB button with dual-layered `FontAwesome` `bolt` icons (size 30 black outline behind size 24 white fill) to create a lightning bolt with a black outline.

