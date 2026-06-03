# ARIA — Design System
> Token, komponen, dan panduan visual untuk konsistensi UI seluruh aplikasi.
> Fonts: Poppins (regular, medium, semibold)
> Tema: Clean & Intelligent — Biru profesional dengan aksen hijau modern

---

## 🎨 Color Tokens

```ts
// src/constants/colors.ts
export const Colors = {
  // Brand
  primary:        '#1A6BFF',   // CTA, tab aktif, tombol utama
  primaryLight:   '#E8F0FF',   // Background chip, highlight
  primaryDark:    '#1152CC',   // Pressed state

  // Accent
  secondary:      '#0FD399',   // Sukses, konfirmasi, badge
  secondaryLight: '#E6FBF5',

  // Status
  danger:         '#FF4444',   // Error, konflik jadwal
  dangerLight:    '#FFE8E8',
  warning:        '#FF9500',   // Peringatan
  warningLight:   '#FFF3E0',
  info:           '#1A6BFF',   // Info toast

  // Neutral
  background:     '#F5F7FA',   // App background
  surface:        '#FFFFFF',   // Card, modal, input background
  surfaceHover:   '#F9FAFB',
  border:         '#E5E7EB',   // Divider, input border
  borderFocus:    '#1A6BFF',   // Input focus border

  // Text
  textPrimary:    '#111827',   // Heading, konten utama
  textSecondary:  '#4B5563',   // Sub-label, metadata
  textMuted:      '#9CA3AF',   // Placeholder, disabled
  textInverse:    '#FFFFFF',   // Text di atas background gelap

  // Special
  overlay:        'rgba(0,0,0,0.5)',
  skeleton:       '#E5E7EB',
} as const;
```

---

## 📐 Spacing Scale

```ts
// src/constants/spacing.ts
export const Spacing = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  48,
  xxxl: 64,
} as const;

// Border radius
export const Radius = {
  sm:   6,
  md:   12,
  lg:   16,
  xl:   24,
  full: 9999,
} as const;
```

---

## 🔤 Typography

```ts
// src/constants/typography.ts
// Install: npm install @expo-google-fonts/poppins
// Font: Poppins, max weight 600 / semibold

import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
} from '@expo-google-fonts/poppins';

export const Fonts = {
  displaySemi: 'Poppins_600SemiBold',
  displayRegular: 'Poppins_400Regular',
  bodyMedium: 'Poppins_500Medium',
  bodyRegular: 'Poppins_400Regular',
};

export const TextStyles = {
  h1: { fontFamily: Fonts.displaySemi, fontSize: 28, lineHeight: 36 },
  h2: { fontFamily: Fonts.displaySemi, fontSize: 22, lineHeight: 30 },
  h3: { fontFamily: Fonts.displaySemi, fontSize: 18, lineHeight: 26 },
  h4: { fontFamily: Fonts.displaySemi, fontSize: 15, lineHeight: 22 },
  body: { fontFamily: Fonts.bodyRegular, fontSize: 15, lineHeight: 24 },
  bodyMd: { fontFamily: Fonts.bodyMedium, fontSize: 15, lineHeight: 24 },
  caption: { fontFamily: Fonts.bodyRegular, fontSize: 12, lineHeight: 18 },
  label: { fontFamily: Fonts.displaySemi, fontSize: 13, lineHeight: 20 },
  button: { fontFamily: Fonts.displaySemi, fontSize: 15, lineHeight: 20 },
};
```
---

## 🧩 Component Specifications

### Button

```tsx
// src/components/ui/Button.tsx
// Variants: primary | secondary | outline | ghost | danger
// Sizes: sm | md | lg

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  children: React.ReactNode;
  onPress: () => void;
};

// Visual spec:
// primary:   bg=#1A6BFF, text=white, radius=12
// secondary: bg=#0FD399, text=white, radius=12
// outline:   border=1px #1A6BFF, text=#1A6BFF, bg=transparent
// ghost:     bg=transparent, text=#1A6BFF
// danger:    bg=#FF4444, text=white
//
// sm:  height=36, px=14, fontSize=13
// md:  height=48, px=20, fontSize=15
// lg:  height=56, px=24, fontSize=17
//
// loading: show ActivityIndicator, disable press
// disabled: opacity=0.5
```

---

### Input

```tsx
// src/components/ui/Input.tsx
type InputProps = {
  label?: string;
  placeholder?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  multiline?: boolean;
  numberOfLines?: number;
  // ...TextInputProps
};

// Visual spec:
// Default:  border=1px #E5E7EB, radius=12, bg=white, h=48
// Focus:    border=2px #1A6BFF, bg=white
// Error:    border=1px #FF4444, show error text below (red, caption)
// Label:    above input, fontFamily=displaySemi, size=13, color=#111827
// Multiline: min height=120, max height=240, scrollable
```

---

### ScheduleCard

```tsx
// src/components/schedule/ScheduleCard.tsx
// Tampilan card jadwal di list

type ScheduleCardProps = {
  id: string;
  title: string;
  date: string;        // formatted: "Senin, 15 Juli 2025"
  time: string;        // formatted: "10:00"
  location?: string;
  status: 'active' | 'done';
  onPress: () => void;
  onDelete: () => void;
};

// Visual spec:
// Card: bg=white, radius=16, shadow (elevation 2), mx=16, mb=12
// Left accent bar: width=4, height=full, radius=4, bg=primary (active) / border (done)
// Title: h4 style, textPrimary
// Time chip: bg=primaryLight, text=primary, label style, px=8, radius=full
// Location: caption, textSecondary, icon=MapPin (lucide)
// Done state: title color=textMuted, strikethrough
// Swipe-to-delete: gesture handler, bg=danger, icon=Trash2
```

---

### SchedulePreview

```tsx
// src/components/schedule/SchedulePreview.tsx
// Modal bottom sheet yang muncul setelah LLM extract berhasil

type SchedulePreviewProps = {
  schedule: ExtractedSchedule;
  onConfirm: (edited: ExtractedSchedule) => void;
  onDismiss: () => void;
};

// Visual spec:
// Wrapper: @gorhom/bottom-sheet, snapPoints=['75%']
// Header: "Jadwal Terdeteksi 🎯", h3, + confidence badge (hijau/kuning)
// Fields: editable inline — tap to edit (TextInput pop up)
//   - Judul (h4, primary)
//   - Tanggal (kalender icon, body)
//   - Waktu (clock icon, body)
//   - Lokasi (map icon, body, optional)
//   - Deskripsi (note icon, caption, optional)
// Footer: [Batalkan (ghost)] [Simpan Jadwal (primary, full width)]
// Animation: slide up + fade in
```

---

### NarasiInput

```tsx
// src/components/input/NarasiInput.tsx
// Input utama di home screen

type NarasiInputProps = {
  value: string;
  onChange: (v: string) => void;
  onProcess: () => void;
  isLoading: boolean;
};

// Visual spec:
// Container: bg=white, radius=20, shadow, mx=16
// Placeholder text (multiline):
//   "Tempel pesan WhatsApp, email, atau ketik jadwal kamu di sini..."
// Character counter: bottom-right, caption, textMuted (show saat >100 char)
// Toolbar row below input:
//   - [Paste dari clipboard] icon button (kiri)
//   - [Proses →] primary button (kanan, disabled saat kosong)
// Loading state: skeleton overlay + "AI sedang membaca jadwal..."
// Min height: 140, max height: 280
```

---

### ConflictWarning

```tsx
// src/components/schedule/ConflictWarning.tsx
// Warning banner jika jadwal baru overlap dengan yang sudah ada

type ConflictWarningProps = {
  conflictingSchedule: Schedule;
  onViewConflict: () => void;
};

// Visual spec:
// Banner: bg=dangerLight, border=1px danger, radius=12, p=12
// Icon: AlertTriangle (lucide, danger color)
// Text: "Tumpang tindih dengan: [title]" — body, danger
// Link: "Lihat jadwal" — label, primary, underline
```

---

## 📱 Screen Layouts

### Home Screen (Input Narasi)
```
┌─────────────────────────┐
│ Header: "ARIA"  [Avatar]│
├─────────────────────────┤
│ Greeting: "Selamat pagi,│
│ [name]! Ada jadwal      │
│ hari ini?"              │
├─────────────────────────┤
│ ┌───────────────────┐   │
│ │  NarasiInput      │   │
│ │  (text area)      │   │
│ │  [Paste] [Proses→]│   │
│ └───────────────────┘   │
├─────────────────────────┤
│ Jadwal Hari Ini         │
│ ┌─────────────────────┐ │
│ │ ScheduleCard        │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ ScheduleCard        │ │
│ └─────────────────────┘ │
└─────────────────────────┘
   [Home] [Kalender] [List] [Profil]
```

### Calendar Screen
```
┌─────────────────────────┐
│ Header: "Kalender"      │
│         [Minggu|Bulan]  │
├─────────────────────────┤
│  MonthlyCalendar        │
│  (dot indicator per hari│
│  ada jadwal)            │
├─────────────────────────┤
│ Jadwal — [Tgl terpilih] │
│ ScheduleCard x n        │
└─────────────────────────┘
```

---

## 🌀 Animation Guidelines

```ts
// Gunakan react-native-reanimated

// 1. Screen mount — fade in + slide up
entering: FadeInDown.duration(300).delay(100)

// 2. Card list — stagger
// Setiap card delay 50ms dari card sebelumnya

// 3. Bottom sheet SchedulePreview
// @gorhom/bottom-sheet built-in animation

// 4. Loading skeleton
// Pulse animation: opacity 1 → 0.4 → 1, loop, 1s

// 5. Tombol Proses — loading state
// ActivityIndicator ganti teks, scale down sedikit
```

---

## ♿ Accessibility

- Semua tombol interaktif punya `accessibilityLabel` dan `accessibilityRole`
- Warna memenuhi WCAG AA contrast ratio (4.5:1 untuk text)
- Font size minimum 12sp, tidak boleh di-scale di bawah 12
- Loading state diumumkan via `accessibilityLiveRegion="polite"`
- Focus management diatur saat modal/bottom-sheet buka
