import { z } from 'zod';
import { ai } from '@/lib/services/gemini';
import { prisma } from '@/lib/db/prisma';
import { FoodLogData } from '@/types';

/**
 * Zod Schema strictly matching the Food Scanner multimodal output specification
 */
export const foodNutritionSchema = z.object({
  foodName: z.string().min(1, 'Nama makanan wajib diisi'),
  calories: z.number().nonnegative('Kalori tidak boleh bernilai negatif'),
  proteinG: z.number().nonnegative('Protein tidak boleh bernilai negatif'),
  carbsG: z.number().nonnegative('Karbohidrat tidak boleh bernilai negatif'),
  fatG: z.number().nonnegative('Lemak tidak boleh bernilai negatif'),
});

export type FoodNutritionResult = z.infer<typeof foodNutritionSchema>;

/**
 * Fallback heuristic parser for local offline testing, mock environments,
 * or rate-limited Gemini API quotas.
 */
export function estimateFoodNutritionHeuristic(description: string): FoodNutritionResult {
  const text = description.toLowerCase();
  
  let calories = 0;
  let proteinG = 0;
  let carbsG = 0;
  let fatG = 0;
  let matchedItems = 0;

  // Rule 1: Fried rice / Nasi goreng
  if (text.includes('nasi goreng') || text.includes('fried rice')) {
    calories += 520;
    proteinG += 14;
    carbsG += 68;
    fatG += 22;
    matchedItems++;
  } else if (text.includes('nasi merah') || text.includes('brown rice')) {
    calories += 180;
    proteinG += 4;
    carbsG += 38;
    fatG += 1.5;
    matchedItems++;
  } else if (text.includes('nasi putih') || text.includes('nasi') || text.includes('rice')) {
    calories += 210;
    proteinG += 4.2;
    carbsG += 46;
    fatG += 0.5;
    matchedItems++;
  }

  // Rule 2: Eggs
  if (text.includes('telur mata sapi') || text.includes('telur ceplok') || text.includes('telur dadar')) {
    const qty = text.includes('2 ') || text.includes('dua ') ? 2 : 1;
    calories += 95 * qty;
    proteinG += 6.5 * qty;
    carbsG += 0.8 * qty;
    fatG += 7.5 * qty;
    matchedItems++;
  } else if (text.includes('telur rebus') || text.includes('boiled egg') || text.includes('telur')) {
    const qty = text.includes('3 ') || text.includes('tiga ') ? 3 : (text.includes('2 ') || text.includes('dua ') ? 2 : 1);
    calories += 75 * qty;
    proteinG += 6.3 * qty;
    carbsG += 0.6 * qty;
    fatG += 5.2 * qty;
    matchedItems++;
  }

  // Rule 3: Chicken
  if (text.includes('dada ayam') || text.includes('chicken breast')) {
    const gramMatch = text.match(/(\d+)\s*g(?:ram)?/);
    const grams = gramMatch ? parseInt(gramMatch[1], 10) : 150;
    const factor = grams / 100;
    calories += Math.round(165 * factor);
    proteinG += Math.round(31 * factor * 10) / 10;
    carbsG += 0;
    fatG += Math.round(3.6 * factor * 10) / 10;
    matchedItems++;
  } else if (text.includes('ayam goreng') || text.includes('fried chicken')) {
    calories += 280;
    proteinG += 22;
    carbsG += 9;
    fatG += 17;
    matchedItems++;
  } else if (text.includes('ayam bakar') || text.includes('grilled chicken') || text.includes('ayam')) {
    calories += 220;
    proteinG += 27;
    carbsG += 4;
    fatG += 11;
    matchedItems++;
  }

  // Rule 4: Beef / Rendang
  if (text.includes('rendang') || text.includes('daging')) {
    calories += 340;
    proteinG += 26;
    carbsG += 7;
    fatG += 23;
    matchedItems++;
  }

  // Rule 5: Fish / Salmon
  if (text.includes('salmon') || text.includes('tuna') || text.includes('ikan')) {
    calories += 240;
    proteinG += 28;
    carbsG += 0;
    fatG += 13;
    matchedItems++;
  }

  // Rule 6: Oatmeal & Whey
  if (text.includes('oatmeal') || text.includes('oats')) {
    calories += 180;
    proteinG += 6;
    carbsG += 32;
    fatG += 3;
    matchedItems++;
  }
  if (text.includes('whey') || text.includes('protein shake') || text.includes('isolate')) {
    calories += 120;
    proteinG += 24;
    carbsG += 2;
    fatG += 1.5;
    matchedItems++;
  }

  // Rule 7: Fruits & Veggies
  if (text.includes('pisang') || text.includes('banana')) {
    calories += 95;
    proteinG += 1.2;
    carbsG += 24;
    fatG += 0.3;
    matchedItems++;
  }
  if (text.includes('alpukat') || text.includes('avocado')) {
    calories += 160;
    proteinG += 2;
    carbsG += 9;
    fatG += 15;
    matchedItems++;
  }
  if (text.includes('salad') || text.includes('brokoli') || text.includes('sayur')) {
    calories += 50;
    proteinG += 3;
    carbsG += 8;
    fatG += 1;
    matchedItems++;
  }

  // Rule 8: Drinks & Extras
  if (text.includes('es teh manis') || text.includes('teh manis')) {
    calories += 90;
    proteinG += 0;
    carbsG += 22;
    fatG += 0;
    matchedItems++;
  } else if (text.includes('teh tawar') || text.includes('kopi hitam') || text.includes('americano')) {
    calories += 5;
    proteinG += 0.3;
    carbsG += 0.5;
    fatG += 0;
    matchedItems++;
  } else if (text.includes('kopi susu') || text.includes('latte')) {
    calories += 160;
    proteinG += 6;
    carbsG += 18;
    fatG += 7;
    matchedItems++;
  }

  // Fallback defaults if no recognizable patterns were found
  if (matchedItems === 0 || calories === 0) {
    calories = 380;
    proteinG = 20;
    carbsG = 45;
    fatG = 12;
  }

  // Clean food name title
  const cleanTitle = description
    .trim()
    .replace(/^["']|["']$/g, '')
    .slice(0, 60);

  const formattedName = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

  return {
    foodName: formattedName || 'Porsi Makanan Campur',
    calories: Math.round(calories),
    proteinG: Math.round(proteinG * 10) / 10,
    carbsG: Math.round(carbsG * 10) / 10,
    fatG: Math.round(fatG * 10) / 10,
  };
}

/**
 * Parses user text food description using Gemini AI with sports nutrition prompt & Zod schema validation
 */
export async function parseFoodTextWithAI(description: string): Promise<FoodNutritionResult> {
  const trimmed = description.trim();
  if (!trimmed) {
    throw new Error('Deskripsi makanan tidak boleh kosong');
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // Use heuristic fallback if API key is not configured or is placeholder
  if (!apiKey || apiKey === 'your_gemini_api_key' || apiKey === 'mock_gemini_api_key') {
    return estimateFoodNutritionHeuristic(trimmed);
  }

  const prompt = `Analisis teks makanan berikut untuk 1 porsi atau takaran yang disebutkan: "${trimmed}".
  
Estimasikan nilai makronutrisi dan total kalori secara logis, realistis, dan presisi:
1. foodName: Berikan nama hidangan yang ringkas, bersih, dan representatif dalam Bahasa Indonesia.
2. calories: Total energi dalam kkal (harus konsisten dengan formula 4*protein + 4*karbohidrat + 9*lemak ±5%).
3. proteinG: Estimasi kandungan protein dalam gram.
4. carbsG: Estimasi kandungan karbohidrat dalam gram.
5. fatG: Estimasi kandungan lemak dalam gram.`;

  const modelsToTry = [
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-2.0-flash',
  ];

  let lastError: unknown;
  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        config: {
          systemInstruction: `Anda adalah AI Ahli Gizi Olahraga (Certified Sports Nutritionist & Dietitian) profesional.
Tugas Anda adalah menganalisis teks deskripsi makanan bebas dari pengguna dan mengestimasi nilai makronutrisinya secara akurat untuk atlet dan pegiat kebugaran.

KEMBALIKAN HANYA FORMAT JSON STRICT VALID SESUAI SKEMA INI:
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

      const rawText = response.text?.trim();
      if (!rawText) continue;

      const cleanedJson = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsedJson = JSON.parse(cleanedJson);

      // Validate strictly with Zod schema
      const validated = foodNutritionSchema.parse({
        foodName: String(parsedJson.foodName || trimmed),
        calories: Number(parsedJson.calories) || 0,
        proteinG: Number(parsedJson.proteinG) || 0,
        carbsG: Number(parsedJson.carbsG) || 0,
        fatG: Number(parsedJson.fatG) || 0,
      });

      return validated;
    } catch (err) {
      console.warn(`[AI Text Quick-Log] Gagal dengan model ${modelName}:`, err);
      lastError = err;
    }
  }

  console.warn('[AI Text Quick-Log] Seluruh model Gemini gagal/rate-limited, beralih ke heuristic fallback:', lastError);
  return estimateFoodNutritionHeuristic(trimmed);
}

/**
 * Saves parsed food nutrition result into PostgreSQL database FoodLog table
 */
export async function saveFoodLogFromNutrition(
  userId: string,
  nutrition: FoodNutritionResult
): Promise<FoodLogData> {
  const savedLog = await prisma.foodLog.create({
    data: {
      userId,
      foodName: nutrition.foodName,
      calories: Math.round(nutrition.calories),
      proteinG: Math.round(nutrition.proteinG * 10) / 10,
      carbsG: Math.round(nutrition.carbsG * 10) / 10,
      fatG: Math.round(nutrition.fatG * 10) / 10,
      loggedAt: new Date(),
    },
  });

  return {
    id: savedLog.id,
    foodName: savedLog.foodName,
    calories: savedLog.calories,
    proteinG: savedLog.proteinG,
    carbsG: savedLog.carbsG,
    fatG: savedLog.fatG,
    imageUrl: savedLog.imageUrl,
    loggedAt: savedLog.loggedAt,
  };
}
