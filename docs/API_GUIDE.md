# ARIA — API Integration Guide
> Panduan lengkap endpoint backend untuk developer & AI agent.
> Base URL: `http://43.134.61.160` | Format: REST JSON

---

## ⚠️ Catatan Akses API
URL backend `http://43.134.61.160` adalah private server. Pastikan device/emulator
berada di jaringan yang sama atau gunakan tunneling (ngrok/cloudflare) saat development.

---

## 🔐 Authentication

Semua endpoint selain `/auth/*` membutuhkan JWT Bearer Token.

```
Authorization: Bearer <token>
```

Token diperoleh dari response login dan disimpan di `expo-secure-store`.

---

## 📡 Endpoints

### Auth

#### POST `/auth/register`
Mendaftarkan pengguna baru.

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "string",
      "email": "string"
    },
    "token": "jwt_string"
  }
}
```

---

#### POST `/auth/login`
Login pengguna.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "name": "string", "email": "string" },
    "token": "jwt_string"
  }
}
```

---

### Schedules

#### GET `/schedules`
Ambil semua jadwal milik user yang login.

**Query Params:**
| Param | Type | Keterangan |
|-------|------|-----------|
| `filter` | `day\|week\|month` | Filter rentang waktu |
| `date` | `YYYY-MM-DD` | Tanggal referensi filter |
| `status` | `active\|done` | Filter status jadwal |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Rapat koordinasi",
      "date": "2025-07-15",
      "time": "10:00",
      "location": "Ruang B204",
      "description": "Rapat koordinasi tim penelitian",
      "status": "active",
      "reminder_minutes": 30,
      "created_at": "2025-07-14T08:00:00Z"
    }
  ]
}
```

---

#### POST `/schedules`
Simpan jadwal baru.

**Request Body:**
```json
{
  "title": "string",          // required
  "date": "YYYY-MM-DD",       // required
  "time": "HH:mm",            // required
  "location": "string",       // optional
  "description": "string",    // optional
  "reminder_minutes": 30      // optional, default: 30
}
```

**Response 201:**
```json
{
  "success": true,
  "data": { ...schedule_object }
}
```

---

#### GET `/schedules/:id`
Ambil detail satu jadwal.

**Response 200:**
```json
{
  "success": true,
  "data": { ...schedule_object }
}
```

---

#### PUT `/schedules/:id`
Update jadwal.

**Request Body:** (semua field optional, kirim yang berubah saja)
```json
{
  "title": "string",
  "date": "YYYY-MM-DD",
  "time": "HH:mm",
  "location": "string",
  "description": "string",
  "reminder_minutes": 15,
  "status": "done"
}
```

**Response 200:**
```json
{ "success": true, "data": { ...updated_schedule } }
```

---

#### DELETE `/schedules/:id`
Hapus jadwal.

**Response 200:**
```json
{ "success": true, "message": "Schedule deleted" }
```

---

### LLM Extraction

#### POST `/extract`
Endpoint utama — kirim teks narasi, terima data jadwal terstruktur.

**Request Body:**
```json
{
  "text": "Rapat koordinasi besok jam 10 pagi di ruang B204"
}
```

**Response 200 — jadwal terdeteksi:**
```json
{
  "success": true,
  "data": {
    "detected": true,
    "schedules": [
      {
        "title": "Rapat koordinasi",
        "date": "2025-07-15",
        "time": "10:00",
        "location": "Ruang B204",
        "description": "Rapat koordinasi tim",
        "confidence": 0.95
      }
    ],
    "raw_text": "Rapat koordinasi besok jam 10 pagi di ruang B204"
  }
}
```

**Response 200 — tidak ada jadwal:**
```json
{
  "success": true,
  "data": {
    "detected": false,
    "schedules": [],
    "message": "Tidak ada jadwal yang terdeteksi dalam teks ini."
  }
}
```

---

## 🔴 Error Responses

Semua error menggunakan format standar:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

| HTTP Code | Error Code | Keterangan |
|-----------|-----------|-----------|
| 400 | `VALIDATION_ERROR` | Input tidak valid |
| 401 | `UNAUTHORIZED` | Token tidak ada / expired |
| 403 | `FORBIDDEN` | Akses ditolak |
| 404 | `NOT_FOUND` | Resource tidak ditemukan |
| 422 | `EXTRACTION_FAILED` | LLM gagal memproses teks |
| 500 | `SERVER_ERROR` | Internal server error |

---

## 🛠️ API Client Setup

```ts
// src/services/api/client.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://43.134.61.160';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach token
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — handle 401
apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      // redirect to login — gunakan router.replace('/(auth)/login')
    }
    return Promise.reject(err);
  }
);
```

---

## 🔄 React Query Integration

```ts
// src/hooks/useScheduleExtract.ts
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { useExtractStore } from '@/store/extract.store';

export function useScheduleExtract() {
  const setResult = useExtractStore((s) => s.setResult);

  return useMutation({
    mutationFn: async (text: string) => {
      const { data } = await apiClient.post('/extract', { text });
      return data.data;
    },
    onSuccess: (data) => {
      setResult(data);
    },
  });
}
```

```ts
// src/hooks/useSchedules.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';

export function useSchedules(filter?: string) {
  return useQuery({
    queryKey: ['schedules', filter],
    queryFn: async () => {
      const { data } = await apiClient.get('/schedules', {
        params: filter ? { filter } : undefined,
      });
      return data.data;
    },
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSchedulePayload) =>
      apiClient.post('/schedules', payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedules'] }),
  });
}
```
