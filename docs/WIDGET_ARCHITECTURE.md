# ZAID Mobile Widget Architecture

Dokumen ini menjelaskan skema awal fitur widget untuk aplikasi ZAID. Fokus widget adalah memperkuat use case utama aplikasi: manajemen jadwal dan task harian yang cepat diakses tanpa membuka aplikasi penuh.

## 1. Tujuan Widget

Widget ZAID dibuat untuk membantu user melihat jadwal penting secara cepat dari home screen HP.

Target utama:
- Menampilkan jadwal hari ini.
- Menampilkan task terdekat yang perlu dikerjakan.
- Memberi shortcut cepat ke Calendar atau AI Schedule Assistant.
- Membuat app lebih daily-use, bukan hanya aplikasi yang dibuka saat ingin membuat jadwal.

Widget bukan pengganti penuh halaman Calendar. Widget hanya menampilkan ringkasan yang paling actionable.

## 2. Widget MVP

Untuk MVP, widget yang paling realistis adalah:

### Today Schedule Widget

Isi widget:
- Tanggal hari ini.
- Maksimal 3 jadwal/task hari ini.
- Jam mulai.
- Judul task.
- Status kosong jika tidak ada jadwal.

Empty state:
```txt
No schedule today
Tap to plan your day
```

Tap behavior:
- Tap widget utama membuka app ke Calendar.
- Tap empty state membuka app ke AI Assistant atau Calendar.

Prioritas:
1. Android widget ukuran medium.
2. iOS WidgetKit ukuran small/medium.
3. Quick action widget setelah MVP stabil.

## 3. Candidate Widget Variants

### 3.1 Today Widget

Use case:
- User ingin melihat jadwal hari ini tanpa membuka app.

Data:
- Task dengan `date <= today <= endDate`.
- Diurutkan berdasarkan `time`.
- Maksimal 3 item.

Ukuran:
- Android: 2x2 atau 4x2.
- iOS: small dan medium.

### 3.2 Upcoming Widget

Use case:
- User ingin melihat jadwal berikutnya dari hari ini ke depan.

Data:
- Task upcoming dengan `scheduleEnd >= today`.
- Diurutkan berdasarkan tanggal lalu jam.
- Maksimal 3-5 item.

Ukuran:
- Android: 4x2.
- iOS: medium.

### 3.3 Quick Add Widget

Use case:
- User ingin cepat membuat task.

Behavior:
- Tap membuka app ke AI Assistant.
- Alternatif tap membuka manual add task di Calendar.

Catatan:
- Quick add lebih cocok sebagai fase lanjutan setelah deep link app stabil.
- Android lebih fleksibel untuk action.
- iOS widget interaksi dibatasi oleh versi iOS dan WidgetKit.

## 4. Platform Constraint

Project saat ini berbasis Expo/React Native. Widget tidak bisa berjalan di Expo Go karena widget memerlukan native code.

Pilihan implementasi:

### Option A: Expo Managed + EAS Build + Config Plugin

Rekomendasi utama.

Kelebihan:
- Tetap mempertahankan workflow Expo.
- Native widget bisa ditambahkan melalui custom config plugin.
- Cocok untuk EAS Build.

Konsekuensi:
- Perlu membuat native files Android/iOS.
- Perlu menjaga config plugin agar native files tetap ter-generate saat prebuild.

### Option B: Expo Prebuild dan Maintain Native Folder

Kelebihan:
- Lebih langsung untuk menulis Android/iOS native code.
- Cocok jika native customization semakin banyak.

Konsekuensi:
- Maintenance lebih berat.
- Folder `android/` dan `ios/` menjadi bagian aktif dari source code.

### Option C: Third-Party Widget Library

Kelebihan:
- Bisa mempercepat setup awal.

Konsekuensi:
- Tetap butuh native build.
- Perlu audit kompatibilitas dengan Expo SDK.
- Risiko maintenance library.

## 5. Data Architecture

Widget tidak bisa bergantung pada React state saat app tertutup. Karena itu, app harus menulis snapshot data widget ke storage yang bisa dibaca native widget.

### 5.1 Widget Snapshot

Format data minimal:

```json
{
  "version": 1,
  "updated_at": "2026-06-30T10:00:00.000Z",
  "today_key": "2026-06-30",
  "today": [
    {
      "id": "task-1",
      "title": "Meeting client",
      "time": "10:00",
      "end_time": "11:00",
      "date": "2026-06-30",
      "end_date": null,
      "status": "active"
    }
  ],
  "upcoming": [
    {
      "id": "task-2",
      "title": "Submit proposal",
      "time": "09:00",
      "date": "2026-07-01",
      "status": "active"
    }
  ]
}
```

### 5.2 Snapshot Source

Snapshot dibuat dari schedule store/app data:
- Setelah `fetchPromptSchedules()` berhasil.
- Setelah `addPromptSchedule()`.
- Setelah `updatePromptSchedule()`.
- Setelah `deletePromptSchedule()`.
- Saat app dibuka kembali.

### 5.3 Snapshot Filtering

Today task:
```txt
schedule.date <= today && (schedule.endDate || schedule.date) >= today
```

Upcoming task:
```txt
(schedule.endDate || schedule.date) >= today
```

Sorting:
```txt
date ascending
time ascending
createdAt descending as fallback
```

Limit:
- Today widget: 3 items.
- Upcoming widget: 5 items.

## 6. Native Storage Strategy

### Android

Recommended:
- SharedPreferences for compact JSON snapshot.

Native reader:
- `AppWidgetProvider` reads SharedPreferences.
- Render widget layout with RemoteViews.

Possible storage key:
```txt
zaid_widget_snapshot
```

### iOS

Recommended:
- App Group UserDefaults.

Native reader:
- WidgetKit TimelineProvider reads App Group UserDefaults.

Possible app group:
```txt
group.com.zaidmobileapp.widget
```

Possible storage key:
```txt
zaid_widget_snapshot
```

## 7. React Native Bridge Requirement

App perlu native bridge/helper untuk menulis snapshot ke storage native.

High-level API di React Native:

```ts
export async function updateWidgetSnapshot(schedules: PromptSchedule[]): Promise<void>;
export async function clearWidgetSnapshot(): Promise<void>;
```

Caller:
- `promptScheduleStore.ts`
- auth logout flow
- app bootstrap setelah fetch data

Behavior:
- Build JSON snapshot.
- Tulis ke native shared storage.
- Trigger widget refresh jika platform mendukung.

## 8. Deep Link Strategy

Widget harus membuka app ke halaman yang relevan.

Recommended deep links:

```txt
zaidmobileapp://calendar
zaidmobileapp://ai
zaidmobileapp://schedule/:id
```

Mapping app route:
- `zaidmobileapp://calendar` -> `/(tabs)/explore`
- `zaidmobileapp://ai` -> `/(tabs)/ai`
- `zaidmobileapp://schedule/:id` -> detail schedule jika route detail sudah siap

Catatan:
- Scheme di `app.json` saat ini adalah `zaidmobileapp`.
- Semua callback/deep link internal harus mengikuti scheme ini agar konsisten.

## 9. Android Implementation Sketch

Native components:
- `ZaidTodayWidgetProvider.kt`
- `res/xml/zaid_today_widget_info.xml`
- `res/layout/widget_today_schedule.xml`
- `res/drawable` untuk background rounded.

Flow:
1. App menulis snapshot ke SharedPreferences.
2. `ZaidTodayWidgetProvider.onUpdate()` membaca snapshot.
3. Provider memilih data `today`.
4. RemoteViews mengisi maksimal 3 row task.
5. Jika tidak ada data, tampilkan empty state.
6. PendingIntent membuka deep link `zaidmobileapp://calendar`.

## 10. iOS Implementation Sketch

Native components:
- Widget extension target: `ZaidWidgetExtension`
- `TodayScheduleWidget.swift`
- `TimelineProvider`
- App Group entitlement.

Flow:
1. App menulis snapshot ke App Group UserDefaults.
2. Widget TimelineProvider membaca snapshot.
3. Provider membuat entry dari data today/upcoming.
4. SwiftUI widget render list task.
5. Tap widget membuka URL `zaidmobileapp://calendar`.

## 11. Refresh Strategy

Widget refresh tidak boleh diasumsikan real-time.

Recommended behavior:
- Refresh saat app menyimpan task.
- Refresh saat app selesai fetch schedule.
- Refresh saat app foreground.
- iOS Timeline refresh berkala sesuai kebijakan sistem.

User expectation:
- Widget menampilkan ringkasan terbaru setelah app dibuka atau task berubah.
- Tidak menjanjikan update per detik.

## 12. UI Direction

Widget visual harus konsisten dengan ZAID:
- Background putih atau sangat light.
- Accent purple `#665CFF`.
- Typography Poppins jika platform memungkinkan.
- Title ringkas.
- Task row padat, mudah discan.

Small widget:
```txt
Today
10:00 Meeting client
13:30 Review sprint
```

Medium widget:
```txt
Today, 30 Jun

10:00  Meeting client
13:30  Review sprint
16:00  Submit report
```

Empty:
```txt
No schedule today
Tap to plan your day
```

## 13. MVP Acceptance Criteria

MVP widget dianggap selesai jika:
- Widget bisa dipasang di Android atau iOS build native.
- Widget menampilkan maksimal 3 task hari ini.
- Widget menampilkan empty state saat tidak ada task.
- Widget bisa membuka app ke Calendar saat ditekan.
- Data widget berubah setelah task ditambah/diedit/dihapus dan app memicu refresh.
- Build EAS berhasil.

## 14. Implementation Phases

### Phase 1: Product and Data Readiness
- Finalisasi format `WidgetSnapshot`.
- Tambahkan helper builder snapshot di TypeScript.
- Pastikan schedule store memanggil update snapshot setelah perubahan data.
- Tambahkan deep link route mapping.

### Phase 2: Android Widget MVP
- Tambahkan native Android widget provider.
- Tambahkan layout XML widget.
- Tambahkan SharedPreferences bridge.
- Test di emulator/device Android.

### Phase 3: iOS Widget MVP
- Tambahkan WidgetKit extension.
- Tambahkan App Group.
- Tambahkan UserDefaults bridge.
- Test di simulator/device iOS.

### Phase 4: UX Polish
- Tambahkan upcoming widget.
- Tambahkan quick add deep link.
- Tambahkan desain empty/loading/error state yang lebih matang.

## 15. Risks

- Widget membutuhkan native code, tidak bisa dites di Expo Go.
- iOS membatasi refresh widget.
- Data local-only perlu strategi sync agar widget tidak stale.
- Android widget layout XML lebih terbatas dibanding React Native UI.
- Deep link routing harus stabil sebelum quick action dibuat.

## 16. Recommendation

Untuk target MVP aplikasi, mulai dari Android Today Schedule Widget terlebih dahulu.

Urutan yang disarankan:
1. Stabilkan schedule store dan backend sync.
2. Tambahkan snapshot builder.
3. Tambahkan deep link Calendar.
4. Implement Android Today Widget.
5. Setelah UX stabil, lanjut iOS WidgetKit.

