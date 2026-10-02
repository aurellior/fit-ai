# Mandatory Post-Task Completion Workflow

Setiap kali menyelesaikan sebuah fitur, perbaikan bug, atau tugas pengkodean pada proyek FitAI ini, asisten AI **WAJIB** menjalankan urutan langkah berikut secara berurutan tanpa terkecuali:

1. **Validasi Build Lokal (`npm run build`)**
   - Jalankan `npm run build` (atau `npx tsc --noEmit && npm run build`).
   - Pastikan kompilasi TypeScript, linting, dan static/dynamic page generation berhasil dengan exit code 0 (`0 errors`).
   - Jika ada error atau peringatan kegagalan build, perbaiki seketika sebelum lanjut ke langkah berikutnya.

2. **Git Add & Commit**
   - Stage berkas yang relevan (`git add <files>`).
   - Buat commit dengan pesan yang jelas, deskriptif, dan mengikuti konvensi (contoh: `feat(coach): ...`, `fix(auth): ...`).

3. **Git Push**
   - Push commit ke remote branch utama:
     `git push origin main`

4. **Verifikasi Build & Deployment di Vercel**
   - Periksa status deployment di Vercel menggunakan CLI:
     `npx vercel ls fit-ai`
   - Pastikan deployment terbaru berhasil dan berstatus `● Ready`.
   - Jika status menunjukkan `● Error`, periksa log deployment menggunakan `npx vercel inspect <deployment-url> --logs` dan segera perbaiki hingga deployment berstatus `● Ready`.
