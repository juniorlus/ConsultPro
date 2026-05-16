import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("Aviso: VITE_GEMINI_API_KEY não encontrada no arquivo .env");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");

/**
 * Instância do modelo Gemini-2.0-flash (versão mais recente e veloz)
 */
export const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Função utilitária para gerar texto de forma simplificada
 */
export async function generateContent(prompt: string) {
  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Erro ao gerar conteúdo com Gemini:", error);
    throw error;
  }
}
