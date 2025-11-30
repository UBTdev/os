// api/clippy.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
export default async function handler(req, res) {
  console.log('=== CLIPPY API CALLED ===');
  
  // Разрешаем CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question } = req.body;
    console.log('Received question:', question);
    
    if (!question) {
      console.log('No question provided');
      return res.status(400).json({ error: 'Question is required' });
    }

    // Проверяем API ключ
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API Key exists:', !!apiKey);
    
    if (!apiKey) {
      console.log('API key missing in environment');
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('Making request to Gemini API...');
    
    // ПРАВИЛЬНЫЙ URL и модель
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Ты - Скрепка из Microsoft Office 97. Ты немного наивная, энергичная и очень любишь помогать. 
                     Используй фразы вроде "Похоже, вы пишете письмо!", "Ой-ой!", "Могу я помочь?". 
                     Отвечай кратко - 1-2 предложения. Всегда начинай ответ с "[clip]". 
                     Говори только на русском.
                     
                     Вопрос пользователя: ${question}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 150,
            topP: 0.8,
            topK: 40
          }
        })
      }
    );

    console.log('Gemini API status:', geminiResponse.status);
    
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API returned ${geminiResponse.status}: ${errorText}`);
    }

    const data = await geminiResponse.json();
    console.log('Gemini response received');
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid response format:', data);
      throw new Error('Invalid response from Gemini API');
    }

    let text = data.candidates[0].content.parts[0].text;
    console.log('Original response:', text);

    // Убедимся, что ответ начинается с [clip]
    if (!text.startsWith('[clip]')) {
      text = '[clip] ' + text;
    }

    console.log('Final answer:', text);
    return res.status(200).json({ answer: text });
    
  } catch (error) {
    console.error('CLIPPY API ERROR:', error.message);
    
    return res.status(500).json({ 
      error: 'AI service unavailable',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
