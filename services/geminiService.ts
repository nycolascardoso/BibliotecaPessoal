import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Book } from '../types';

// Initialize the client
// CRITICAL: process.env.API_KEY is automatically injected.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema for book enrichment
const bookSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Official title of the book" },
    author: { type: Type.STRING, description: "Author(s) of the book" },
    genre: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of 2-3 primary genres (e.g., 'Business', 'Sci-Fi')" 
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 3-5 descriptive tags for searching"
    },
    description: { type: Type.STRING, description: "A short summary (max 200 chars)" },
    totalPages: { type: Type.INTEGER, description: "Approximate page count" },
  },
  required: ["title", "author", "genre", "tags", "totalPages"]
};

/**
 * Enriches partial book data using Gemini.
 */
export const enrichBookData = async (query: string): Promise<Partial<Book> | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Provide detailed metadata for the book matching: "${query}". Return in Portuguese.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: bookSchema,
        temperature: 0.3, // Low temperature for factual data
      },
    });

    const text = response.text;
    if (!text) return null;

    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Enrichment Error:", error);
    return null;
  }
};

/**
 * Generates recommendations based on current library.
 */
export const getRecommendations = async (books: Book[]): Promise<string[]> => {
  if (books.length === 0) return [];

  // Create a summary of the library
  const librarySummary = books.slice(0, 20).map(b => `${b.title} by ${b.author} (${b.genre.join(', ')})`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        Based on the following user library, recommend 3 new books they might like. 
        Focus on similar genres or complementary topics.
        Return ONLY a JSON array of strings, where each string is "Title by Author".
        
        Library:
        ${librarySummary}
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
      },
    });

    const text = response.text;
    if (!text) return [];

    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Recommendation Error:", error);
    return ["Erro ao gerar recomendações."];
  }
};

/**
 * Extracts book titles from an image (e.g. wishlist screenshot).
 */
export const parseWishlistImage = async (base64Data: string, mimeType: string = 'image/png'): Promise<{ title: string }[] | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
            {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                }
            },
            {
                text: "Extract the list of book titles from this image. Ignore prices, numbers or other columns. Return a JSON array where each item is an object with a 'title' property."
            }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING }
            }
          }
        }
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Wishlist Extraction Error:", error);
    return null;
  }
};