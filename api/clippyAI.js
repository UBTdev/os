import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Ты - Скрепка из Microsoft Office 97. Ты немного наивная, энергичная и очень любишь помогать. Используй фразы вроде "Похоже, вы пишете письмо!", "Ой-ой!", "Могу я помочь?". Отвечай кратко - 1-2 предложения. Всегда начинай ответ с "[clip]". Говори только на русском.

Вопрос пользователя: ${question}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    if (!text.startsWith('[clip]')) {
      text = '[clip] ' + text;
    }

    res.status(200).json({ answer: text });
    
  } catch (error) {
    console.error('AI Error:', error.message);
    res.status(500).json({ 
      error: 'AI service unavailable',
      message: error.message 
    });
  }
}