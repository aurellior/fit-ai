# ⚡ FitPulse AI — Monolithic Athletic Performance & Nutrition OS

> **FitPulse AI** adalah sistem operasi kebugaran terpadu (*monolithic sports & fitness intelligence system*) yang dirancang khusus untuk pelari, atlet endurance, dan fitness enthusiast. Menggabungkan sinkronisasi aktivitas **Strava API**, pelacakan latihan beban manual, analisis nutrisi harian berbasis fisiologi olahraga, serta **Google Gemini AI** untuk *adaptive running coaching* dan *multimodal food scanning*.

---

## 📑 Daftar Isi

- [Arsitektur & Tech Stack](#-arsitektur--tech-stack)
- [Fitur Utama](#-fitur-utama)
  - [1. Today's AI Coach Directive Top Banner](#1-todays-ai-coach-directive-top-banner)
  - [2. AI Adaptive Running Coach & Sports Scientist Rescheduler](#2-ai-adaptive-running-coach--sports-scientist-rescheduler)
  - [3. Daily Sports Nutrition Audit & Anti-Double Counting](#3-daily-sports-nutrition-audit--anti-double-counting)
  - [4. Multimodal AI Food Scanner & AI Quick-Log](#4-multimodal-ai-food-scanner--ai-quick-log)
  - [5. Strava API Sync & ACSM Calorie Estimator](#5-strava-api-sync--acsm-calorie-estimator)
  - [6. Manual Activity & Gym Tracker](#6-manual-activity--gym-tracker)
  - [7. Visual Analytics, Mobile Safe Area & Body Metrics](#7-visual-analytics-mobile-safe-area--body-metrics)
- [Diagram Arsitektur Sistem](#-diagram-arsitektur-sistem)
- [Struktur Direktori Proyek](#-struktur-direktori-proyek)
- [Skema Database (Prisma ORM)](#-skema-database-prisma-orm)
- [API Endpoints & Server Actions](#-api-endpoints--server-actions)
- [Panduan Instalasi & Konfigurasi](#-panduan-instalasi--konfigurasi)
  - [1. Prasyarat Sistem](#1-prasyarat-sistem)
  - [2. Kloning & Instalasi Dependensi](#2-kloning--instalasi-dependensi)
  - [3. Konfigurasi Environment Variables](#3-konfigurasi-environment-variables)
  - [4. Migrasi Database PostgreSQL](#4-migrasi-database-postgresql)
  - [5. Menjalankan Aplikasi](#5-menjalankan-aplikasi)
- [Integrasi Strava API (Lokal & Produksi)](#-integrasi-strava-api-lokal--produksi)
- [Integrasi Google Gemini AI](#-integrasi-google-gemini-ai)
- [Fallback & Offline Resilience Engine](#-fallback--offline-resilience-engine)
- [Lisensi](#-lisensi)

---

## 🛠 Arsitektur & Tech Stack

Aplikasi ini dibangun menggunakan arsitektur monolit modern yang mengoptimalkan performa, kesederhanaan deployment, dan konsistensi data:

| Kategori | Teknologi | Deskripsi / Peran |
| :--- | :--- | :--- |
| **Framework Utama** | **[Next.js 16](https://nextjs.org/) (App Router)** | Server Components (RSC), Client Components, Server Actions, Route Handlers |
| **Bahasa Pemrograman** | **[TypeScript 5](https://www.typescriptlang.org/)** | Strict type-safety end-to-end dari database hingga antarmuka pengguna |
| **UI Engine** | **[React 19](https://react.dev/)** | Konkurensi modern, dynamic rendering, dan transitions |
| **Styling & Desain** | **[Tailwind CSS v4](https://tailwindcss.com/)** | Styling modern terinspirasi oleh palet atletik Strava & Linear |
| **Manajemen Tema** | **[next-themes](https://github.com/pacocoursey/next-themes)** | Dukungan Dark Mode dan Light Mode yang mulus tanpa *flash-of-unstyled-content* |
| **Database & ORM** | **[PostgreSQL](https://www.postgresql.org/) + [Prisma ORM 6](https://www.prisma.io/)** | Manajemen skema data relasional, migrasi otomatis, dan *type-safe queries* |
| **AI Intelligence** | **[Google Gemini AI (@google/genai)](https://aistudio.google.com/)** | Model vision multimodal & reasoning (`gemini-3.8-flash`, `gemini-3.5-flash-lite`) |
| **Data Visualizer** | **[Recharts 3](https://recharts.org/)** | Grafik responsif untuk tren jarak, pace, volume latihan, dan kalori |
| **Validasi Skema** | **[Zod](https://zod.dev/)** | Validasi payload input pengguna dan response skema AI |
| **Icon Pack** | **[Lucide React](https://lucide.dev/)** | Set icon modern, ringan, dan konsisten |

---

## ✨ Fitur Utama

### 1. Today's AI Coach Directive Top Banner
- **Penempatan & Prioritas Visual Teratas**:
  - Ditempatkan di puncak halaman Dashboard (`/`) dan halaman AI Coach (`/ai-coach`) sebagai direktori taktis harian atlet.
  - Secara otomatis mendeteksi jadwal latihan hari ini berdasarkan waktu lokal (WIB / GMT+7): **Senin** (Tempo / Speed Run), **Kamis** (Interval / VO2Max), **Sabtu** (Progressive Long Run), atau **Rest / Cross-Training** di hari lainnya.
- **Informasi Taktis Komprehensif**:
  - Menampilkan nama hari, menu spesifik, target *pace* atau metrik durasi, serta catatan penyesuaian otomatis dari AI jika sesi sebelumnya terlewat (*skipped*) atau dialihkan (*rescheduled*).
- **Tombol Aksi Cepat (Quick Actions)**:
  - *"Mulai Latihan / Log"*: Membuka modal pencatatan lari/gym langsung dengan data target yang sudah terisi otomatis (*pre-filled*).
  - *"Kendala Hari Ini? (AI Reschedule)"*: Membuka modal dialog adaptasi taktis untuk memodifikasi sesi atau memindahkan jadwal.

### 2. AI Adaptive Running Coach & Sports Scientist Rescheduler
- **Jadwal Lari Kunci 3 Hari**:
  - **Senin**: *Tempo / Speed Run* (Peningkatan batas ambang laktat).
  - **Kamis**: *Interval VO2Max / Mid-Week Endurance* (Peningkatan kapasitas kardiovaskular aerobik).
  - **Sabtu**: *Safe Progressive Long Run* (Ketahanan aerobik Zona 2).
- **Mesin Adaptasi Cerdas (Smart Skip Handling)**:
  - Mengaudit riwayat lari atlet secara otomatis terhadap jadwal minggu berjalan.
  - **Jika sesi Senin terlewat**: Menu Kamis otomatis diubah menjadi *Aerobic Interval & Cruise Tempo* untuk menyerap stimulasi yang hilang tanpa menimbulkan stres berlebih.
  - **Jika sesi Kamis terlewat**: Menu Sabtu diadaptasi menjadi *Progressive Long Run (Zone 2 + Tempo Finish)*.
  - **Jika dua sesi terlewat**: AI mengaktifkan protokol perlindungan cedera (*Injury Prevention Guard*) — melarang penumpukan jarak ekstrem dan menginstruksikan lari *Reset & Recovery* santai di Zona 2.
- **Sports Scientist & AI Workout Rescheduler (Database Persistence)**:
  - Atlet dapat melaporkan kendala (Hujan Lebat, Kelelahan / DOMS, Waktu Terbatas, Nyeri Sendi / Otot) via modal interaktif.
  - **Gemini 2.5 Flash Engine (`@google/genai`)**: Menggunakan `responseSchema` validasi bertipe JSON murni:
    - `adjustedAction`: Ringkasan tindakan taktis (misal: *Alihkan ke Treadmill Indoor* atau *Geser Long Run ke Hari Minggu*).
    - `newScheduleDateOffset`: Integer penambahan hari (0 untuk hari ini, 1 untuk besok, dst).
    - `coachAdvice`: Saran taktis mendalam pencegahan cedera pelari endurance, protokol istirahat, dan nutrisi pemulihan.
    - `safeToTrain`: Boolean kelayakan latihan.
  - **Penyimpanan Persisten PostgreSQL**: Tersimpan ke tabel `workout_reschedules` via `db.workoutReschedule.upsert` dengan constraint unik per pengguna per tanggal (`@@unique([userId, originalDate])`).
  - **Preservasi Status Reschedule Mutlak**: Saat atlet menekan *"Perbarui Arahan AI Coach"*, sistem audit mempertahankan jadwal yang telah dialihkan dan mengintegrasikannya ke arahan AI baru, sehingga jadwal tidak ter-reset ke menu awal.
- **Rekomendasi Pemulihan Komprehensif**: Panduan nutrisi pre/post workout, hidrasi elektrolit, jendela asupan protein, dan peringatan jeda latihan beban kaki (*leg day*) sebelum *long run*.

### 3. Daily Sports Nutrition Audit & Anti-Double Counting
- **Kalkulasi Keseimbangan Energi Riil**:
  - Menghitung **Calories In** (dari log makanan harian) vs **Calories Out** (BMR Katch-McArdle/Harris-Benedict + total pembakaran aktivitas fisik + NEAT murni).
  - Klasifikasi status energi: **Surplus**, **Defisit**, atau **Balanced**.
- **Anti-Double Counting Engine (Strava vs Daily Steps NEAT)**:
  - **Pencegahan Perhitungan Ganda Kalori**: Mengisolasi porsi langkah yang sudah terserap di dalam sesi latihan Strava (terutama jadwal lari: Senin Tempo, Kamis Interval, Sabtu Long Run: ~1.250 langkah/km) agar tidak dihitung ulang oleh pedometer jam/HP.
  - **Kalkulasi NEAT Murni**: Langkah di luar jam latihan diisolasi secara matematis ($S_{\text{neat}} = \max(0, S_{\text{total}} - S_{\text{workout}})$) dengan koefisien pengeluaran energi ambulatori presisi ($\sim 0.00057 \times \text{kg berat badan}$ per langkah).
  - **Reasoning Gemini AI Bebas Distorsi**: System prompt AI mengevaluasi apakah lonjakan langkah berasal dari sesi lari Strava atau murni aktivitas harian sehingga rekomendasi defisit glikogen dan protein recovery tidak terdistorsi.
  - **UI/UX Transparan Ala Strava**: Komponen dekomposisi 3 pilar (*BMR*, *Latihan Strava*, *NEAT Murni*), badge proteksi anti-double counting, serta kartu *Daily Steps Check-in* ringkas di Dashboard & halaman Nutrisi.
- **Analisis Makronutrisi Presisi**:
  - Target protein khusus atlet kebugaran (**1.6g - 2.0g per kg berat badan**).
  - Evaluasi pemenuhan protein harian, rasio karbohidrat untuk cadangan glikogen, serta asupan lemak sehat.
- **AI Sports Nutritionist Insight**:
  - Menilai apakah defisit kalori aman atau berisiko memicu katabolisme otot.
  - Menyediakan *Actionable Tips* harian yang dapat diterapkan segera.

### 4. Multimodal AI Food Scanner & AI Quick-Log
- **Multimodal AI Vision Scanner**:
  - Pengguna mengambil foto makanan dari kamera ponsel atau mengunggah file gambar.
  - Memanfaatkan Gemini Vision API dengan keluaran JSON terstruktur (*structured JSON mode*).
  - Mengekstrak: **Nama Hidangan**, **Total Kalori (kkal)**, **Protein (g)**, **Karbohidrat (g)**, dan **Lemak (g)**.
- **AI Text Quick-Log (Pencatatan Cepat Berbasis Teks)**:
  - Tab alternatif *"Ketik Manual (AI Quick-Log)"* berdampingan langsung dengan Vision Scanner pada modal pencatatan makanan.
  - Input teks bebas (*textarea*) yang fleksibel (contoh: *"Nasi goreng spesial 1 porsi ditambah telur mata sapi dan 1 gelas es teh manis"*).
  - Dilengkapi *Quick Recommendation Chips* untuk mempercepat pencatatan makanan atletik populer.
  - Prompt khusus bertindak sebagai *Sports Nutritionist* untuk mengestimasi makronutrisi secara realistis berdasarkan takaran porsi dan metode pengolahan.
  - Output dipaksa menggunakan skema validasi Zod ketat (`foodNutritionSchema`).
- **Otomatis Tersimpan ke PostgreSQL**: Data langsung masuk ke riwayat `FoodLog` dan memperbarui kalkulasi nutrisi hari tersebut secara instan.

### 5. Strava API Sync & ACSM Calorie Estimator
- **Alur OAuth 2.0 Lengkap**: Otorisasi pengguna langsung ke server Strava dengan scope `read,activity:read_all`.
- **Auto-Refresh Token Lifecycle**: Sistem mengecek masa berlaku token dan memperbarui secara otomatis jika tersisa kurang dari 5 menit sebelum request ke Strava API dikirim.
- **ACSM / METs Calorie Estimator**:
  - Jika data kalori dari Strava tidak tersedia atau bernilai 0 (sering terjadi pada sync jam tangan tanpa heart rate monitor), sistem mengalkulasi estimasi kalori ilmiah menggunakan standar **METs (Metabolic Equivalent of Task)** berdasarkan kecepatan rata-rata, jenis olahraga, dan estimasi berat badan atlet.

### 6. Manual Activity & Gym Tracker
- **Lari / Kardio Manual**: Input jarak, durasi, dan sistem menghitung rata-rata *pace* (menit/km) secara otomatis.
- **Gym & Resistance Training**: Pencatatan latihan beban terstruktur per gerakan, set, repetisi, dan beban (kg) yang disimpan dalam format JSON relasional PostgreSQL.
- **Penghapusan & Sinkronisasi Real-Time**: Terintegrasi penuh dengan Server Actions dan revalidasi cache instan.

### 7. Visual Analytics, Mobile Safe Area & Body Metrics
- **Interactive Recharts Dashboard**:
  - Visualisasi grafik jarak mingguan per aktivitas.
  - Grafik tren pembakaran kalori harian.
  - Analisis pace lari per kilometer.
- **Weight Tracker**: Pencatatan riwayat timbangan berat badan harian beserta catatan kondisi untuk memantau tren massa tubuh.
- **Mobile-First UX & iOS Safe Area**:
  - *Bottom Navigation Bar* ergonomis dengan padding `pb-safe` (`env(safe-area-inset-bottom)`) agar tidak tertutup *Home Indicator* iPhone 15.
  - *Floating Action Button (FAB)* dengan Bottom Sheet menu cepat yang aman dari *Dynamic Island* dan *Notch*.
  - Seluruh modal menggunakan tinggi fleksibel `max-h-[85vh]` dengan area konten yang bisa di-scroll (`overflow-y-auto`).

---

## 🏛 Diagram Arsitektur Sistem

```mermaid
flowchart TD
    subgraph Client["Frontend Client (Next.js 16 + React 19)"]
        UI["Web Dashboard & Mobile View"]
        Nav["Thumb-friendly BottomNav & FAB"]
        Scanner["Camera / Food Scanner Modal"]
    end

    subgraph Server["Next.js Monolith Backend"]
        SA["Server Actions (/actions/*)"]
        API["Route Handlers (/app/api/*)"]
        CoachSvc["Performance Insights Service"]
        NutriSvc["Nutrition Audit Service"]
        StravaSvc["Strava Token & Sync Service"]
    end

    subgraph External["Layanan Pihak Ketiga"]
        Strava["Strava API v3 (OAuth 2.0)"]
        Gemini["Google Gemini AI (Multimodal 3.8 Flash)"]
    end

    subgraph Storage["Database Layer"]
        Prisma["Prisma ORM Client"]
        Postgres[(PostgreSQL Database)]
    end

    UI --> SA
    UI --> API
    Scanner --> API

    API --> StravaSvc
    API --> CoachSvc
    API --> NutriSvc

    StravaSvc <--> Strava
    CoachSvc <--> Gemini
    NutriSvc <--> Gemini

    SA --> Prisma
    API --> Prisma
    Prisma <--> Postgres
```

---

## 📁 Struktur Direktori Proyek

```
fit-ai/
├── actions/                         # Next.js Server Actions (Mutasi Data)
│   ├── activity.ts                 # Tambah & hapus aktivitas lari/gym manual
│   ├── nutrition.ts                # Tambah & hapus log makanan
│   ├── steps.ts                    # Simpan langkah harian & hitung anti-double counting
│   ├── weight.ts                   # Tambah & hapus log berat badan
│   ├── workout.ts                  # Server action reschedule adaptif & sync AiInsight
│   └── workout-reschedule.ts       # Sports Scientist AI engine & persistensi PostgreSQL
├── app/                            # Next.js App Router (Rute & API)
│   ├── (routes)/
│   │   ├── page.tsx                # Dashboard Utama (Overview atletik)
│   │   ├── activities/             # Daftar & filter riwayat aktivitas
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx       # Detail aktivitas spesifik
│   │   ├── ai-coach/               # Halaman AI Adaptive Running Coach
│   │   │   └── page.tsx
│   │   ├── coach/page.tsx          # Alias / Redirect ke ai-coach
│   │   ├── dashboard/page.tsx      # Alias / Redirect ke root dashboard
│   │   ├── nutrition/              # Halaman Audit Nutrisi & Food Scanner
│   │   │   └── page.tsx
│   │   ├── layout.tsx              # Root Layout (Navbar, ThemeProvider, BottomNav)
│   │   ├── loading.tsx             # Global Skeleton Loading State
│   │   └── globals.css             # Tailwind v4 configuration & tokens
│   └── api/                        # Route Handlers
│       ├── ai/
│       │   ├── food-scanner/       # Endpoint POST scan foto makanan via Gemini
│       │   ├── insights/           # Endpoint regenerasi analisis coach mingguan
│       │   └── nutrition-audit/    # Endpoint kalkulasi audit energi harian
│       ├── auth/strava/            # Inisiasi alur OAuth 2.0 Strava
│       │   └── callback/           # Callback penukaran authorization code Strava
│       └── strava/sync/            # Sinkronisasi aktivitas atlet dari Strava
├── components/                     # Komponen Antarmuka Pengguna
│   ├── activities/                 # View daftar aktivitas & tombol aksi
│   ├── coach/                      # Kartu jadwal lari adaptif & status skip
│   ├── dashboard/                  # Top Directive Banner, Today Workout, Steps, grafik Recharts
│   ├── forms/                      # Modal input manual lari/gym, scanner, dan berat
│   ├── navigation/                 # Mobile BottomNav & Action Sheet Portal
│   ├── nutrition/                  # Kartu audit nutrisi harian, anti-double counting, riwayat makro
│   ├── ui/                         # Primitif modal, pagination, dan skeleton
│   ├── Navbar.tsx                  # Header navigasi desktop
│   └── ThemeToggle.tsx             # Pengalih tema gelap/terang
├── lib/                            # Modul Utilitas & Layanan Inti
│   ├── auth.ts                     # Mock auth & identitas atlet aktif
│   ├── db/prisma.ts                # Singleton instance PrismaClient
│   ├── hooks/useBodyScrollLock.ts  # Hook pengunci scroll saat modal/sheet aktif
│   ├── mockData.ts                 # Data simulasi cadangan (Offline Resilience)
│   ├── services/
│   │   ├── gemini.ts               # Inisialisasi client @google/genai
│   │   ├── performance-insights.ts # Logika Smart Skip & Coach reasoning
│   │   ├── nutrition-audit.ts      # Logika kalkulasi kalori in/out & BMR
│   │   └── strava.ts               # Client Strava API, token refresh, & METs
│   └── utils.ts                    # Formatter pace, jarak, tanggal, dan classname
├── prisma/
│   └── schema.prisma               # Definisi skema database PostgreSQL
├── public/                         # Aset statis & logo
├── types/                          # Definisi TypeScript global
│   └── index.ts
├── .env.example                    # Template konfigurasi environment
├── next.config.ts                  # Konfigurasi Next.js
├── package.json                    # Dependensi dan skrip proyek
└── tsconfig.json                   # Konfigurasi TypeScript
```

---

## 🗄 Skema Database (Prisma ORM)

Skema relasional lengkap yang didefinisikan dalam [`prisma/schema.prisma`](file:///c:/Users/Aurellio/Documents/Dhio/Mini%20Project/fit-ai/prisma/schema.prisma):

```prisma
enum ActivitySource {
  STRAVA
  MANUAL
}

enum ActivityType {
  RUN
  RIDE
  SWIM
  WEIGHT_TRAINING
  WALK
  HIKE
  OTHER
}

model User {
  id             String         @id @default(cuid())
  email          String         @unique
  name           String?
  avatarUrl      String?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  stravaToken    StravaToken?
  activities     Activity[]
  weightLogs     WeightLog[]
  foodLogs       FoodLog[]
  aiInsights     AiInsight[]
  stepLogs       StepLog[]
  workoutReschedules WorkoutReschedule[]

  @@map("users")
}

model StravaToken {
  id           String   @id @default(cuid())
  userId       String   @unique
  athleteId    String   @unique
  accessToken  String
  refreshToken String
  expiresAt    DateTime
  scope        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("strava_tokens")
}

model Activity {
  id               String          @id @default(cuid())
  userId           String
  source           ActivitySource  @default(MANUAL)
  type             ActivityType
  title            String
  startTime        DateTime

  durationSec      Int             // Durasi total (detik)
  distanceMeters   Float?          // Jarak lari/bersepeda (meter)
  avgPaceSecPerKm  Float?          // Rata-rata pace (detik per km)
  elevationGainM   Float?          // Kenaikan elevasi (meter)
  calories         Int?            // Kalori terbakar (dari Strava atau kalkulasi METs)

  stravaActivityId BigInt?         @unique
  summaryPolyline  String?         @db.Text

  notes            String?         @db.Text
  gymSets          Json?           // Array JSON: [{ exercise, sets, reps, weightKg }]

  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt

  user             User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, startTime])
  @@map("activities")
}

model WeightLog {
  id        String   @id @default(cuid())
  userId    String
  weightKg  Float
  loggedAt  DateTime @default(now())
  notes     String?

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, loggedAt])
  @@map("weight_logs")
}

model FoodLog {
  id          String   @id @default(cuid())
  userId      String
  foodName    String
  calories    Float
  proteinG    Float
  carbsG      Float
  fatG        Float
  imageUrl    String?  @db.Text
  loggedAt    DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, loggedAt])
  @@map("food_logs")
}

model AiInsight {
  id              String   @id @default(cuid())
  userId          String
  periodStart     DateTime
  periodEnd       DateTime
  summary         String   @db.Text
  strengths       String   @db.Text
  recommendations String   @db.Text // Menyimpan JSON serialized CoachPlanData
  createdAt       DateTime @default(now())

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
  @@map("ai_insights")
}

model StepLog {
  id              String   @id @default(cuid())
  userId          String
  dateStr         String   // 'YYYY-MM-DD'
  stepCount       Int      // Jumlah langkah pedometer
  loggedAt        DateTime @default(now())
  source          String   @default("MANUAL") // MANUAL, APPLE_HEALTH, GARMIN, GOOGLE_FIT
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, dateStr])
  @@index([userId, dateStr])
  @@map("step_logs")
}

model WorkoutReschedule {
  id               String   @id @default(cuid())
  userId           String
  originalDate     DateTime // Tanggal awal jadwal (YYYY-MM-DD)
  rescheduledDate  DateTime // Tanggal baru hasil penyesuaian
  activityType     String   // Contoh: 'TEMPO', 'INTERVAL', 'LONG_RUN'
  reason           String?  // Alasan reschedule dari user
  aiRecommendation String?  @db.Text // Saran taktis dari Gemini AI
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, originalDate])
  @@index([userId, originalDate])
  @@map("workout_reschedules")
}
```

---

## 📡 API Endpoints & Server Actions

### Route Handlers (`app/api/*`)

| Metode | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/auth/strava` | Mengarahkan browser pengguna ke halaman otorisasi OAuth 2.0 Strava |
| `GET` | `/api/auth/strava/callback` | Menerima kode otorisasi dari Strava, menukarnya dengan token, dan menyimpan ke DB |
| `POST` | `/api/strava/sync` | Mengambil 30 aktivitas terbaru dari Strava, menghitung kalori, dan melakukan upsert |
| `POST` | `/api/ai/food-scanner` | Menerima `multipart/form-data` foto hidangan, menganalisis via Gemini Vision, dan menyimpan ke `FoodLog` |
| `POST` | `/api/ai/food-text-log` | Menerima teks deskripsi menu, mengekstrak makronutrisi via Gemini AI, dan menyimpan ke `FoodLog` |
| `POST` | `/api/ai/workout-rescheduler` | Menganalisis kendala sesi hari ini dan memberikan rekomendasi jadwal adaptif via Gemini AI |
| `POST` | `/api/ai/insights` | Memproses riwayat 14 hari latihan & berat badan untuk menghasilkan analisis *Coach* dan *Adaptive Schedule* baru |
| `GET`, `POST` | `/api/ai/nutrition-audit` | Mengambil / mengevaluasi audit nutrisi harian (Calories In vs Out, Strava vs NEAT de-duplication, Protein) |
| `GET`, `POST` | `/api/steps` | Mengambil atau menyimpan riwayat jumlah langkah harian per tanggal |

### Server Actions (`actions/*`)

| Fungsi Server Action | File Sumber | Kegunaan |
| :--- | :--- | :--- |
| `createManualActivity(formData)` | [`actions/activity.ts`](file:///c:/Users/Aurellio/Documents/Dhio/Mini%20Project/fit-ai/actions/activity.ts) | Memvalidasi dan menyimpan sesi lari atau latihan beban gym ke PostgreSQL |
| `deleteActivity(activityId)` | [`actions/activity.ts`](file:///c:/Users/Aurellio/Documents/Dhio/Mini%20Project/fit-ai/actions/activity.ts) | Menghapus catatan aktivitas dan merevalidasi cache halaman |
| `processAndSaveWorkoutReschedule(input)` | [`actions/workout-reschedule.ts`](file:///c:/Users/Aurellio/Documents/Dhio/Mini%20Project/fit-ai/actions/workout-reschedule.ts) | Menjalankan Sports Scientist AI reasoning dan menyimpan reschedule ke PostgreSQL |
| `rescheduleWorkoutAction(data)` | [`actions/workout.ts`](file:///c:/Users/Aurellio/Documents/Dhio/Mini%20Project/fit-ai/actions/workout.ts) | Menganalisis kendala atlet, menyimpan ke tabel reschedule, dan memperbarui `AiInsight` aktif |
| `logFoodFromTextAction(desc)` | [`actions/nutrition.ts`](file:///c:/Users/Aurellio/Documents/Dhio/Mini%20Project/fit-ai/actions/nutrition.ts) | Mengekstrak gizi dari teks bebas via Gemini dan menyimpan ke `FoodLog` |
| `createFoodLog(formData)` | [`actions/nutrition.ts`](file:///c:/Users/Aurellio/Documents/Dhio/Mini%20Project/fit-ai/actions/nutrition.ts) | Menyimpan log makanan manual beserta rincian makronutrisinya |
| `logDailyStepsAction(data)` | [`actions/steps.ts`](file:///c:/Users/Aurellio/Documents/Dhio/Mini%20Project/fit-ai/actions/steps.ts) | Menyimpan langkah harian dan merevalidasi kalkulasi anti-double counting |
| `deleteFoodLog(foodId)` | [`actions/nutrition.ts`](file:///c:/Users/Aurellio/Documents/Dhio/Mini%20Project/fit-ai/actions/nutrition.ts) | Menghapus log makanan dan memperbarui audit nutrisi harian |
| `createWeightLog(formData)` | [`actions/weight.ts`](file:///c:/Users/Aurellio/Documents/Dhio/Mini%20Project/fit-ai/actions/weight.ts) | Mencatat timbangan berat badan harian pengguna |
| `deleteWeightLog(logId)` | [`actions/weight.ts`](file:///c:/Users/Aurellio/Documents/Dhio/Mini%20Project/fit-ai/actions/weight.ts) | Menghapus riwayat catatan berat badan |

---

## 🚀 Panduan Instalasi & Konfigurasi

### 1. Prasyarat Sistem
- **Node.js**: Versi `20.x` atau lebih baru
- **NPM** atau **PNPM** atau **Yarn**
- **PostgreSQL**: Instance lokal (misal: Docker, Postgres.app) atau Cloud (Supabase / Neon / Aiven)

### 2. Kloning & Instalasi Dependensi
```bash
# Masuk ke direktori proyek
cd "fit-ai"

# Instal seluruh dependensi
npm install
```

### 3. Konfigurasi Environment Variables
Salin berkas `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

Buka `.env` dan konfigurasikan parameter berikut:

```env
# 1. URL Koneksi Database PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fitness_monolith?schema=public"

# 2. Domain Utama Aplikasi (Gunakan domain ngrok jika menguji callback Strava di perangkat mobile)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# 3. Kredensial Strava API (https://www.strava.com/settings/api)
STRAVA_CLIENT_ID="your_strava_client_id"
STRAVA_CLIENT_SECRET="your_strava_client_secret"

# 4. API Key Google Gemini (https://aistudio.google.com/)
GEMINI_API_KEY="your_gemini_api_key"
```

### 4. Migrasi Database PostgreSQL
Jalankan migrasi Prisma untuk membuat tabel secara otomatis:
```bash
# Push skema langsung ke database
npx prisma db push

# Atau generate client jika skema diperbarui
npx prisma generate
```

### 5. Menjalankan Aplikasi
```bash
# Jalankan mode development
npm run dev
```
Buka browser di alamat [http://localhost:3000](http://localhost:3000).

Untuk kompilasi produksi:
```bash
npm run build
npm run start
```

---

## 🚴 Integrasi Strava API (Lokal & Produksi)

1. Buka [Strava API Application Portal](https://www.strava.com/settings/api) dan buat aplikasi baru.
2. Atur **Authorization Callback Domain**:
   - Untuk pengembangan lokal: `localhost:3000`
   - Untuk testing mobile via tunneling: Masukkan domain tunnel Anda, contoh `your-domain.ngrok-free.app` (tanpa `http://` atau `https://`).
3. Salin **Client ID** dan **Client Secret** ke file `.env`.
4. Di aplikasi FitAI, klik tombol **"Hubungkan Strava"** di Dashboard. Setelah disetujui, token akan tersimpan dan aktivitas otomatis tersinkronisasi.

---

## 🧠 Integrasi Google Gemini AI

FitAI memanfaatkan SDK resmi `@google/genai` dengan model tercanggih:
- **`gemini-3.8-flash`**: Digunakan untuk reasoning tingkat tinggi pada analisis performa lari (*Sports Scientist AI*) dan deteksi visual cepat pada *Food Scanner*.
- **`gemini-3.5-flash-lite`** & **`gemini-flash-lite-latest`**: Disediakan sebagai mekanisme *fallback otomatis* bertingkat untuk menjamin kecepatan respon dan ketahanan jika model utama mengalami lonjakan antrean.
- **Output JSON Terstruktur**: Menggunakan parameter `responseMimeType: 'application/json'` dan instruksi skema Zod ketat untuk memastikan hasil reasoning AI dapat langsung dikonsumsi oleh komponen frontend tanpa risiko *parsing error*.

---

## 🛡️ Fallback & Offline Resilience Engine

Salah satu keunggulan utama arsitektur FitPulse AI adalah **ketahanan sistem tingkat tinggi (*high resilience*)**:
1. **Database Offline Graceful Degradation**: Jika server database PostgreSQL sedang non-aktif atau belum terkonfigurasi, aplikasi **tidak akan crash**. Sistem secara otomatis mengaktifkan mode simulasi cerdas (*Mock Athlete Profile*) sehingga antarmuka, grafik, dan seluruh komponen visual tetap dapat diuji.
2. **Session Persistence via Cookies**: Status koneksi Strava tetap dapat dipertahankan sementara menggunakan cookies terenkripsi bahkan saat database sedang dalam pemeliharaan.
3. **Deterministic Heuristic Fallbacks**: Jika kuota Gemini API habis atau koneksi internet terputus, evaluator heuristik internal akan mengambil alih perhitungan kalori, BMR, dan audit jadwal secara matematis tanpa menghentikan pengalaman pengguna.

---

## 📄 Lisensi

Proyek ini dirilis di bawah lisensi [MIT](LICENSE). Bebas digunakan dan dikembangkan untuk keperluan riset kebugaran, portofolio, maupun pengembangan aplikasi produksi.
