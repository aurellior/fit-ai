# FitPulse AI — Monolith Sports & Fitness Dashboard

Aplikasi web kebugaran terpadu (*monolith architecture*) berbasis **Next.js (App Router)**, **PostgreSQL**, **Tailwind CSS**, **Strava API**, dan **Google Gemini AI**.

---

## 🚀 Fitur Utama

1. **Monolith Fullstack Next.js (App Router)**:
   - Frontend modern dengan Tailwind CSS & React Server Components.
   - Backend terintegrasi: Route Handlers (`/app/api/*`) dan Server Actions (`actions/*`).
2. **PostgreSQL & Prisma ORM**:
   - Skema terpusat: `User`, `StravaToken`, `Activity`, `WeightLog`, `FoodLog`, dan `AiInsight`.
   - Dukungan aktivitas lari, sepeda, renang, dan latihan beban (gym sets & reps).
3. **Integrasi Strava API (OAuth 2.0 & Auto-Refresh)**:
   - Alur otorisasi lengkap (`/api/auth/strava` & `/api/auth/strava/callback`).
   - Mekanisme otomatis refresh access token sebelum kedaluwarsa saat memanggil API Strava.
   - Sinkronisasi aktivitas atlet secara berkala atau manual (`/api/strava/sync`).
4. **Input Data Manual (Lari & Gym)**:
   - Form dinamis untuk lari (durasi, jarak, pace otomatis) dan gym (latihan beban, set, repetisi, kg).
   - Validasi data ketat menggunakan Zod dan Server Actions.
5. **Kecerdasan Buatan Google Gemini AI (`@google/genai`)**:
   - **Gemini AI Sports Scientist**: Analisis performa mingguan otomatis berdasarkan data gabungan (Strava + Gym + Berat Badan).
   - **Multimodal AI Food Scanner**: Unggah foto hidangan makanan, AI mengekstrak taksiran kalori, protein, karbohidrat, dan lemak secara terstruktur (JSON mode).

---

## 🛠️ Panduan Memulai

### 1. Salin Environment Variables
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

Sesuaikan nilai di dalam `.env`:
- `DATABASE_URL`: URL PostgreSQL (misal: Supabase, Neon, atau Docker PostgreSQL).
- `STRAVA_CLIENT_ID` & `STRAVA_CLIENT_SECRET`: Diperoleh dari [Strava API Settings](https://www.strava.com/settings/api).
  - Atur **Authorization Callback Domain** di Strava ke `localhost:3000` (atau domain produksi Anda).
- `GEMINI_API_KEY`: Diperoleh gratis dari [Google AI Studio](https://aistudio.google.com/).

### 2. Migrasi Database PostgreSQL
Jalankan migrasi Prisma untuk membuat tabel di PostgreSQL:
```bash
npx prisma migrate dev --name init
```

Atau push skema langsung:
```bash
npx prisma db push
```

### 3. Jalankan Server Development
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

### 4. Build Produksi
```bash
npm run build
npm run start
```
