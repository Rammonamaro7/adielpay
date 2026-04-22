import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateFinancialInsights(
  transactions: any[],
  budgets: any[],
  currentBalance: number
): Promise<string> {
  const prompt = `
Você é um consultor financeiro especialista em fintechs.
Analise os seguintes dados financeiros do usuário e forneça 3 a 4 insights curtos, personalizados e acionáveis.
Seja direto, profissional e encorajador. Formate a resposta em Markdown (use listas, negrito, etc).

Dados do usuário:
- Saldo atual: R$ ${currentBalance.toFixed(2)}
- Orçamentos: ${JSON.stringify(budgets)}
- Últimas transações: ${JSON.stringify(transactions.slice(0, 20))}

Gere insights sobre:
1. Padrões de gastos (ex: onde está gastando mais).
2. Alertas sobre orçamentos próximos do limite.
3. Uma dica prática para economizar ou investir melhor.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Não foi possível gerar insights no momento.";
  } catch (error) {
    console.error("Erro ao gerar insights:", error);
    return "Ocorreu um erro ao analisar seus dados. Tente novamente mais tarde.";
  }
}
