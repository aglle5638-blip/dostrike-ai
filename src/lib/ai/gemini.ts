import { GoogleGenAI } from '@google/genai';

// Initialize the Google Gen AI SDK
// The SDK automatically picks up GEMINI_API_KEY from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? '' });

export async function analyzeFaceSimilarity(avatarBase64: string, sampleBase64: string): Promise<number> {
  const prompt = `
    You are an expert AI vision assistant for the FaceLogic platform.
    I have provided two images: an avatar image and a video sample image.
    Analyze the facial features, expressions, and overall visual persona of the person/avatar in both images.
    Calculate a similarity score between 0 and 100 based on how closely they match.
    Return ONLY a JSON object with the following structure:
    { "score": <number>, "reasoning": "<brief explanation>" }
  `;

  // Strip data:image/... prefix if present
  const cleanAvatar = avatarBase64.replace(/^data:image\/[a-z]+;base64,/, "");
  const cleanSample = sampleBase64.replace(/^data:image\/[a-z]+;base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { data: cleanAvatar, mimeType: 'image/jpeg' } },
            { inlineData: { data: cleanSample, mimeType: 'image/jpeg' } }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = String(response.candidates?.[0]?.content?.parts?.[0]?.text ?? "0");
    const result = JSON.parse(text);
    return result.score || 0;
  } catch (error) {
    console.error("Failed to parse Gemini response", error);
    return 0;
  }
}
