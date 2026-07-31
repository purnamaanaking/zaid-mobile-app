# FLOW V2 — Navigation & UI Plan

Dokumen ini menetapkan flow baru aplikasi (V2) berdasarkan dokumentasi di `docs/` dan halaman yang sudah ada di `app/(tabs)`.

## Tujuan

- Menambahkan onboarding 2 halaman setelah splash native untuk menjelaskan aplikasi.
- Flow auth tetap sama, namun setelah login/registrasi pengguna diarahkan langsung ke AI Assistant (bukan Dashboard/Home).
- Pada layar AI Assistant, menambahkan header dengan:
  - Tombol hamburger kiri yang membuka menu samping (Calendar di bagian atas daftar; Profile/Settings di bagian bawah).
  - Logo di tengah sesuai brand saat ini.
  - Ikon notifikasi di kanan yang menampilkan panel dropdown “slide down” daftar notifikasi saat ditekan.

## Kondisi Saat Ini (ringkas)

- Expo Router dengan grup:
  - `(auth)` untuk login/register.
  - `(tabs)` untuk layar app terautentikasi. Bottom tab disembunyikan (`tabBarStyle: { display: 'none' }`).
- Rute yang sudah ada di `(tabs)`: `index` (Dashboard), `explore` (Schedule/Calendar), `notification`, `profile`, `ai` (AiPromptPage).
- Root `app/_layout.tsx` mengatur splash/fon dan redirect: user terautentikasi → `/(tabs)`; tidak terautentikasi → `/(auth)/login`.
- Fitur dan pola di docs: state via Zustand + React Query, notifications via `expo-notifications`, design system Poppins, Colors/Spacing.

## Flow V2 (end-to-end)

1. Splash (native, sudah diatur via Expo SplashScreen di `app/_layout.tsx`).
2. Onboarding 2 halaman (pager) yang menjelaskan aplikasi.
   - Tampil hanya sekali pada first-run (flag di AsyncStorage, mis. `onboarding_completed=true`).
3. Auth (login/register) seperti sebelumnya di grup `(auth)`.
4. Setelah login sukses:
   - Redirect langsung ke `/(tabs)/ai` (AI Assistant) sebagai landing utama.
5. Layar AI Assistant:
   - Header: [Hamburger] — [Logo] — [Bell/Notification].
   - Hamburger membuka Drawer kiri yang menampilkan:
     - Daftar menu dengan “Calendar” paling atas (navigasi ke `/(tabs)/explore`).
     - Pemisah.
     - Item paling bawah “Profile & Settings” (navigasi ke `/(tabs)/profile`).
   - Ikon notifikasi membuka dropdown “slide down” (panel di bawah header) berisi daftar notifikasi terbaru; item membuka `/(tabs)/notification` (halaman lengkap) atau detail terkait bila tersedia.
6. Dari menu/ikon, user dapat berpindah ke Calendar, Notification full page, atau Profile/Settings, lalu kembali ke AI kapan pun.

## Perubahan Navigasi

- Tambah grup `(onboarding)` untuk 2 halaman intro. Guard di Root:
  - Jika `!isAuthenticated && !onboardingCompleted` → `/(onboarding)`.
  - Jika `!isAuthenticated && onboardingCompleted` → `/(auth)/login`.
- Ubah redirect pasca-auth di `app/_layout.tsx`:
  - Dari: `Redirect href="/(tabs)"`
  - Menjadi: `Redirect href="/(tabs)/ai"` sehingga default post-login ke AI Assistant.
- Pertahankan grup `(tabs)` beserta rute yang sudah ada. Bottom tab tetap tersembunyi (navigasi utama via header/drawer).
- Pastikan deep link untuk AI aktif sesuai `WIDGET_ARCHITECTURE.md`: `zaidmobileapp://ai` → `/(tabs)/ai` (mapping sudah selaras dengan struktur sekarang).

## Desain UI Komponen Baru

1. Onboarding (2 halaman):
   - Struktur: `app/(onboarding)/_layout.tsx`, `page-1.tsx`, `page-2.tsx`.
   - Navigasi: tombol Next/Skip, indikator dot, konsisten dengan `DESIGN_SYSTEM.md` (Poppins, Colors/Spacing/Radius).
   - Aksi selesai: set `onboarding_completed` ke storage lalu `router.replace('/(auth)/login')`.

2. Header AI Assistant:
   - Lokasi: dalam `AiPromptPage` (`src/features/ai/pages/AiPromptPage.tsx`), komponen `AiHeader` di `src/features/ai/components/AiHeader.tsx`.
   - Kiri: tombol hamburger.
   - Tengah: logo ZAID (pakai `assets/brand/zaid-white.svg`/`zaid-black.svg` sesuai tema).
   - Kanan: ikon bell. Tekan → toggle panel dropdown.
   - Gunakan Reanimated untuk animasi `slide down` + `fade` sesuai pedoman animasi.

3. Drawer Samping (Hamburger → kiri):
   - Implementasi drawer ringan berbasis overlay/animated panel (bukan mengganti struktur navigator) agar minimal invasive.
   - Isi menu:
     - “Calendar” (paling atas) → `router.push('/(tabs)/explore')`.
     - Spacer/Divider.
     - “Profile & Settings” (paling bawah) → `router.push('/(tabs)/profile')`.

4. Dropdown Notifikasi (kanan header):
   - Panel muncul dari header ke bawah (max-height ~60% screen, scrollable, rounded corners, shadow).
   - Sumber data: hook notifikasi yang ada (`useNotification.ts` sesuai `ARCHITECTURE.md`) atau rute `/(tabs)/notification` sebagai fallback penuh.
   - Item notifikasi: judul, waktu relatif, ikon. Tekan item → buka `/(tabs)/notification` untuk detail lebih lanjut.

## Data & State

- Onboarding flag: `AsyncStorage` key `onboarding_completed`.
- Auth state: tetap pakai `useAuthStore` dan mekanisme `checkAuth()` yang sudah ada di Root Layout.
- Notifications: manfaatkan hook/store yang telah direferensikan di docs (`useNotification.ts`) dan listener di Root layout sudah mengarah ke rute terkait.

## Tugas Implementasi (urut eksekusi)

1. Onboarding
   - Buat grup `app/(onboarding)` dengan 2 screen dan pager/dots + Skip.
   - Tambah guard di Root untuk mengarahkan user ke onboarding jika pertama kali.
   - Simpan flag selesai onboarding ke storage.

2. Redirect Pasca-Auth ke AI
   - Ubah logic di `app/_layout.tsx`: ketika `isAuthenticated && inAuthGroup`, arahkan ke `/(tabs)/ai`.

3. Header AI + Drawer + Dropdown Notifikasi
   - Tambah `AiHeader` di feature AI, render di atas konten chat.
   - Implement drawer kiri (overlay + slide) dengan dua entri menu: Calendar (atas) dan Profile & Settings (bawah).
   - Implement dropdown notifikasi (slide down). Ambil data dari hook/store yang ada; fallback tombol “Lihat semua” → `/(tabs)/notification`.

4. Deep Link Konsistensi (opsional, jika belum)
   - Pastikan `zaidmobileapp://ai` memetakan ke `/(tabs)/ai` sesuai `app.json` schema dan Expo Router.

5. Polish & A11y
   - Ikuti token `DESIGN_SYSTEM.md` (Colors, Spacing, Radius, TextStyles).
   - Tambah `accessibilityLabel` untuk tombol hamburger, logo, dan bell.
   - Animasi sesuai pedoman (entering `FadeInDown`, dll.).

## Risiko & Catatan

- Guard onboarding perlu sinkron dengan guard auth agar tidak terjadi loop redirect. Uji kombinasi: first-run + logged out, first-run + login cepat, returning user tanpa flag, returning user dengan flag.
- Drawer custom harus non-interfering dengan gesture back Android dan tidak menutup dropdown notifikasi secara tak terduga (kelola z-index/overlay).
- Panel notifikasi jangan meng-block input area AI secara permanen; auto-close saat navigasi.

## Validasi

- First run membuka onboarding 2 halaman, selesai → login.
- Login sukses mendarat di `/(tabs)/ai`.
- Hamburger menampilkan menu, Calendar berada di bagian atas list dan dapat dinavigasi. Item paling bawah mengarah ke Profile/Settings.
- Ikon bell menampilkan dropdown notifikasi dengan animasi turun; “Lihat semua” mengarah ke `/(tabs)/notification`.
- Deep link `zaidmobileapp://ai` membuka AI Assistant.
- Semua tampilan konsisten dengan design system dan berfungsi di Android & iOS.

## Status Keputusan & Pertanyaan Terbuka

- Konten teks onboarding (2 halaman) belum dispesifikkan. Rekomendasi: halaman 1 “Apa itu ZAID/ARIA?”, halaman 2 “Cara cepat menambahkan jadwal lewat AI”. Jika tidak ada preferensi khusus, gunakan copy ringkas sesuai brand saat ini.
