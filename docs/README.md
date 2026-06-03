# ARIA — AI-Powered Schedule Management App

ARIA (Automatic Record & Intelligent Agenda) is a multiplatform mobile application built using Expo (React Native) with Large Language Model (LLM) integration for converting natural language text into structured personal schedules.

This project is part of the Internal Research Program 2025 at Telkom University under the Beginner Lecturer Research Scheme (Penelitian Dosen Pemula).

---

## 📱 Overview

ARIA helps users automatically transform daily conversation text, chat messages, or notes into calendar schedules.

Instead of manually opening calendar applications and filling forms, users only need to paste or type text such as:

```txt
"Besok jam 10 ada rapat koordinasi di ruang B204"
```

ARIA will process the text using AI/LLM and generate:

- Event Title
- Date & Time
- Location
- Reminder
- Schedule Preview

---

## 🎯 Problem Statement

Many students and workers receive important schedule information from:

- WhatsApp Groups
- Email
- Broadcast Messages
- Notes
- Team Communication Platforms

However:

- Important schedules are easily buried in chats
- Manual calendar input is inefficient
- Existing calendar apps still require manual form input

ARIA bridges the gap between:
Natural Language → Structured Schedule Data

---

## 🚀 Main Features

### Core Features

- ✨ Natural Language Schedule Input
- 🤖 AI / LLM-based Schedule Extraction
- 📅 Calendar & Schedule Management
- 📝 Editable Extraction Preview
- 🔔 Reminder Notifications
- 🔐 User Authentication
- 📱 Android & iOS Support (Single Codebase)

### Additional Features (Planned)

- Google Calendar Synchronization
- Microsoft Outlook Integration
- Schedule Conflict Detection
- Productivity Analytics
- Voice-to-Schedule Input

---

## 🏗️ Tech Stack

### Frontend Mobile
- Expo
- React Native
- TypeScript

### Backend API
- Node.js + Express
OR
- Laravel

### AI / LLM
- OpenAI API

### Database
- MySQL
- SQLite (Local Mobile Storage)

### DevOps / Tools
- Docker
- GitHub
- Postman

---

## 📂 Project Structure

```txt
aria-mobile-app/
│
├── mobile-app/       # Expo React Native App
├── backend-api/      # Backend API Service
├── docker/           # Docker Configuration
├── docs/             # Research & Documentation
└── README.md
```

---

# ⚙️ Installation & Setup

## 1. Clone Repository

```bash
git clone https://github.com/your-username/aria-mobile-app.git
cd aria-mobile-app
```

---

## 2. Setup Mobile App (Expo)

```bash
cd mobile-app
npm install
```

Run Expo:

```bash
npx expo start
```

---

## 3. Android Development Setup

### Option A — Recommended (Physical Device)

Install:
- Expo Go App on Android

Enable:
- USB Debugging

Then scan QR code from Expo.

### Option B — Android Emulator

Install:
- Android Studio
- Android SDK
- Platform Tools (adb)

Set Environment Variables:

```txt
ANDROID_HOME=C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk
```

Add to PATH:

```txt
platform-tools
emulator
cmdline-tools
```

Verify adb:

```bash
adb --version
```

---

## 4. Setup Backend API

Example using Node.js:

```bash
cd backend-api
npm install
npm run dev
```

Example using Laravel:

```bash
composer install
php artisan serve
```

---

## 5. Setup Database (Docker)

Run MySQL using Docker:

```bash
docker compose up -d
```

Example `docker-compose.yml`:

```yaml
services:
  mysql:
    image: mysql:8
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: root
```

---

## 6. Setup Environment Variables

Create `.env`

Example:

```env
OPENAI_API_KEY=your_api_key
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=aria
DB_USERNAME=root
DB_PASSWORD=root
```

---

# 🧠 LLM Workflow

```txt
User Input
      ↓
Backend API
      ↓
OpenAI / LLM Processing
      ↓
Structured JSON Result
      ↓
Calendar Schedule
```

Example:

Input:

```txt
"Besok jam 10 meeting dosen di ruang B204"
```

Output:

```json
{
  "title": "Meeting Dosen",
  "date": "2026-05-13",
  "time": "10:00",
  "location": "B204"
}
```

---

# 📊 Research Objectives

- Achieve ≥ 80% schedule extraction accuracy
- SUS (System Usability Scale) ≥ 70
- Support Bahasa Indonesia & English
- Provide cross-platform mobile experience

---

# 👥 Target Users

### Students
- Assignment reminders
- Exam schedules
- Academic planning

### Workers / Professionals
- Meeting management
- Deadline reminders
- Productivity assistance

---

# 🔒 Security

- JWT Authentication
- HTTPS Communication
- Password Hashing
- Secure API Access

---

# 📈 Success Metrics

| Metric | Target |
|---|---|
| LLM Accuracy | ≥ 80% |
| Response Time | ≤ 5 Seconds |
| SUS Score | ≥ 70 |
| Fatal Crash | 0 |

---

# 📄 Documentation

- Proposal Penelitian Internal Universitas Telkom 2025 :contentReference[oaicite:0]{index=0}
- PRD ARIA Mobile App :contentReference[oaicite:1]{index=1}

---

# 📜 License

This project is currently under internal research and development by Universitas Telkom.

---

# ✨ Future Roadmap

- AI Smart Recommendation
- Productivity Insights
- AI Task Prioritization
- SaaS Deployment
- Enterprise Integration
- Voice Assistant Integration