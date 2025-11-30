// api/clippy.js - ТЕСТОВАЯ ВЕРСИЯ
export default async function handler(req, res) {
  console.log('=== TEST CLIPPY API ===');
  
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
    
    // ПРОСТОЙ ОТВЕТ ДЛЯ ТЕСТА
    const testAnswer = `[clip] Тестовый ответ! Ваш вопрос: "${question}". API работает!`;
    
    console.log('Returning test answer');
    return res.status(200).json({ answer: testAnswer });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Test error',
      message: error.message
    });
  }
}
