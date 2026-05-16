import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patientData } = req.body;

  if (!patientData) {
    return res.status(400).json({ error: 'Patient data is required' });
  }

  // A chave de API deve estar configurada nas variáveis de ambiente da Vercel
  // ou no arquivo .env local para o vercel dev
  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API Key not configured' });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
Você é um nutricionista profissional.

Gere um plano alimentar semanal com base nos dados abaixo.

⚠️ Regras:
- Responda APENAS em JSON válido
- Não use markdown
- Não escreva explicações
- Respeite restrições e alergias

Dados do paciente:
${JSON.stringify(patientData, null, 2)}

Formato obrigatório:

{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["", "", "", "", ""],
        "lanche_manha": ["", "", "", "", ""],
        "almoco": ["", "", "", "", ""],
        "lanche_tarde": ["", "", "", "", ""],
        "jantar": ["", "", "", "", ""]
      }
    }
  ]
}

Regras:
- gerar 7 dias
- 5 opções por refeição
- evitar repetição
- usar alimentos comuns no Brasil
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Limpar markdown se a IA ignorar a regra
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const dietPlan = JSON.parse(jsonString);

    return res.status(200).json(dietPlan);
  } catch (error) {
    console.error('Erro na API do Gemini:', error);
    return res.status(500).json({ error: 'Erro ao gerar plano alimentar', details: error.message });
  }
}
