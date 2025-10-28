
import { GoogleGenAI } from "@google/genai";
import { ResultType } from '../types';

if (!process.env.API_KEY) {
  // This is a placeholder for development. In a real environment, the key is set.
  // We add this to prevent the app from crashing if the key is not set during local testing.
  process.env.API_KEY = "YOUR_API_KEY_HERE"; 
  console.warn("API_KEY is not set in environment variables. Using a placeholder.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const parseResponse = (text: string): { winner: ResultType; details: string } => {
  const lines = text.split('\n');
  const winnerLine = lines[0]?.toLowerCase() || '';
  const details = lines.slice(1).join('\n').trim();

  let winner: ResultType;
  if (winnerLine.includes('real madrid')) {
    winner = 'REAL_MADRID';
  } else if (winnerLine.includes('barcelona')) {
    winner = 'BARCELONA';
  } else {
    winner = 'DRAW';
  }

  // If details are empty, use the whole text as details (fallback)
  const finalDetails = details || text;

  return { winner, details: finalDetails };
};

export const fetchMatchResult = async (year: number): Promise<{ winner: ResultType; details: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find the winner, final score, and exact date of the primary El Clásico match between Real Madrid and FC Barcelona that occurred in the year ${year}. Start your response with 'WINNER: ' followed by 'Real Madrid', 'FC Barcelona', or 'Draw'. Then, on a new line, provide a single paragraph with the match details (date, score, summary).`,
      config: {
        systemInstruction: "You are a specialized sports historian focused only on El Clásico. Provide a brief, neutral analysis.",
        tools: [{googleSearch: {}}],
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No text response from API.");
    }

    return parseResponse(text);
  } catch (error) {
    console.error("Error fetching match result:", error);
    // In case of an API error, return a fallback response.
    return {
      winner: 'DRAW',
      details: `Could not retrieve match data for ${year} due to an error. Please try another year.`,
    };
  }
};
