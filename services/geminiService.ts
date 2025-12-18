import { GoogleGenAI } from "@google/genai";
import { BackgroundColor, ClothingOption } from "../types";

const MAX_RETRIES = 3;
const INITIAL_DELAY = 2000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const processBackground = async (
  imageBase64: string,
  color: BackgroundColor,
  clothing: ClothingOption,
  retryCount = 0
): Promise<string> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined" || apiKey === "null" || apiKey === "") {
    throw new Error("API Key is missing. Please ensure 'API_KEY' is added to Vercel Environment Variables and trigger a fresh Redeploy.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-2.5-flash-image";

  // Clean base64 string
  const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  const colorName = color === BackgroundColor.WHITE ? "pure white" : "light blue";
  
  let clothingPrompt = "";
  if (clothing !== ClothingOption.NONE) {
      let outfitDesc = "";
      switch (clothing) {
          case ClothingOption.MALE_BLAZER:
              outfitDesc = "a professional black suit jacket with a white dress shirt and tie";
              break;
          case ClothingOption.FEMALE_BLAZER:
              outfitDesc = "a professional black formal blazer over a simple top";
              break;
          case ClothingOption.MALE_SHIRT:
              outfitDesc = "a crisp white formal button-down dress shirt";
              break;
          case ClothingOption.FEMALE_SHIRT:
              outfitDesc = "a professional white formal business shirt";
              break;
      }
      clothingPrompt = `3. CHANGE THE OUTFIT: Replace the person's current clothing with ${outfitDesc}. Ensure the fit is realistic, the neck connection is natural, and it looks like a high-quality professional headshot.`;
  } else {
      clothingPrompt = "3. KEEP THE PERSON'S CLOTHING EXACTLY AS IS. Do not alter their clothes.";
  }

  const prompt = `
    Task: Create a professional passport photo from this portrait.
    Instructions:
    1. Identify the person in the foreground.
    2. KEEP THE PERSON'S FACE AND HAIR EXACTLY AS IS. Do not alter facial features or identity.
    ${clothingPrompt}
    4. Replace the entire background with a solid ${colorName} color (Hex color code: ${color}).
    5. Ensure a clean, professional edge cutout.
    6. CRITICAL: DO NOT WRITE THE HEX CODE OR ANY TEXT ON THE IMAGE. The image must be text-free.
    7. Output only the modified image.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: cleanBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("The AI returned a response but no image was found. Try a clearer photo.");
  } catch (error: any) {
    console.error(`Gemini API Error (Attempt ${retryCount + 1}):`, error);
    
    // Check for Rate Limit Error (429)
    if (error.message?.includes("429") && retryCount < MAX_RETRIES) {
      const delay = INITIAL_DELAY * Math.pow(2, retryCount); // 2s, 4s, 8s
      await sleep(delay);
      return processBackground(imageBase64, color, clothing, retryCount + 1);
    }

    if (error.message?.includes("403") || error.message?.includes("API_KEY_INVALID")) {
        throw new Error("Invalid API Key. Please verify your key in Google AI Studio.");
    }
    
    if (error.message?.includes("429")) {
        throw new Error("Maximum rate limit reached. Please wait a few minutes before trying again.");
    }
    
    throw new Error(error.message || "An unexpected error occurred during AI processing.");
  }
};

export { processBackground };
