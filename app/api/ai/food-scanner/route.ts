import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/lib/services/gemini';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Foto makanan tidak ditemukan' }, { status: 400 });
    }

    const user = await getCurrentUser();
    const apiKey = process.env.GEMINI_API_KEY;

    // Check if API key is real or placeholder
    if (!apiKey || apiKey === 'your_gemini_api_key' || apiKey === 'mock_gemini_api_key') {
      // Mock result for local development without active Gemini API Key
      const mockResult = await prisma.foodLog.create({
        data: {
          userId: user.id,
          foodName: 'Grilled Chicken & Quinoa Salad (Mock AI)',
          calories: 450,
          proteinG: 38,
          carbsG: 42,
          fatG: 14,
          loggedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        data: mockResult,
        warning: 'Menggunakan mock data. Masukkan GEMINI_API_KEY valid di .env untuk live AI scanning.',
      });
    }

    // 1. Konversi File ke ArrayBuffer lalu Base64
    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString('base64');
    const mimeType = file.type || 'image/jpeg';

    // 2. Kirim ke Gemini Multimodal Vision API dengan instruksi JSON terstruktur
    const prompt = `Analisis foto makanan ini secara akurat. Kenali nama hidangannya dan estimasikan nilai nutrisi untuk 1 porsi yang terlihat:
    1. foodName: nama makanan
    2. calories: total kalori dalam kkal (angka saja)
    3. proteinG: estimasi protein dalam gram (angka saja)
    4. carbsG: estimasi karbohidrat dalam gram (angka saja)
    5. fatG: estimasi lemak dalam gram (angka saja)`;

    // Coba model terbaru gemini-3.8-flash dengan fallback ke gemini-1.5-flash
    const modelsToTry = ['gemini-3.8-flash', 'gemini-1.5-flash'];
    let responseText: string | undefined;
    let lastError: unknown;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    data: base64Data,
                    mimeType,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          config: {
            systemInstruction: `Anda adalah AI Ahli Nutrisi profesional. Kembalikan estimasi nilai gizi HANYA dalam format JSON strictly valid dengan skema:
            {
              "foodName": "string",
              "calories": number,
              "proteinG": number,
              "carbsG": number,
              "fatG": number
            }`,
            responseMimeType: 'application/json',
          },
        });

        responseText = response.text?.trim();
        if (responseText) break;
      } catch (err) {
        console.warn(`Model ${modelName} gagal dipanggil di food-scanner:`, err);
        lastError = err;
      }
    }

    if (!responseText) {
      throw lastError || new Error('Tidak ada respon teks yang diterima dari Gemini');
    }

    const nutrition = JSON.parse(responseText);

    // 3. Simpan ke database PostgreSQL
    const savedLog = await prisma.foodLog.create({
      data: {
        userId: user.id,
        foodName: nutrition.foodName || 'Makanan Terdeteksi',
        calories: Number(nutrition.calories) || 0,
        proteinG: Number(nutrition.proteinG) || 0,
        carbsG: Number(nutrition.carbsG) || 0,
        fatG: Number(nutrition.fatG) || 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: savedLog,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Gagal memproses gambar makanan dengan Gemini AI';
    console.error('Food scanner error:', error);
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
