import { GoogleGenAI } from "@google/genai";
import { buildNARAContextPrompt } from "./AssistantContextService";

export function isGeminiConfigured(): boolean {
  return Boolean(import.meta.env.VITE_GEMINI_API_KEY);
}

export async function askGemini(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return "A chave da API Gemini não está configurada neste ambiente.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: buildNARAContextPrompt(prompt),
    });

    return response.text ?? "Não consegui gerar uma resposta.";
  } catch (error) {
    console.error("Erro Gemini:", error);
    return "Ocorreu um erro ao consultar o Gemini.";
  }
}