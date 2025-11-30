class ClippyAI {
  constructor() {
    this.messages = [
      { 
        role: "system", 
        content: "Ты - Скрепка из Microsoft Office 97. Ты немного наивная, энергичная и очень любишь помогать. Используй фразы вроде 'Похоже, вы пишете письмо!', 'Ой-ой!', 'Могу я помочь?'. Отвечай кратко - 1-2 предложения. Всегда начинай ответ с '[clip]'. Говори только на русском." 
      }
    ];
    
    // Gemini API от Google
    this.apiKey = "AIzaSyDCqFMbThgv79isczGnhFuCuf0aiQ16vfA";
    this.apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    
    // Системные команды
    this.commands = {
      'doom': { 
        keywords: ['дум', 'doom'], 
        action: () => this.launchGame('DOOM', 'https://archive.org/details/msdos_Doom_1993'),
        description: 'Запустить игру DOOM'
      },
      'minecraft': { 
        keywords: ['майнкрафт', 'minecraft'], 
        action: () => this.launchGame('Minecraft', 'https://classic.minecraft.net/'),
        description: 'Запустить Minecraft'
      },
      'notepad': { 
        keywords: ['блокнот', 'notepad', 'заметки'], 
        action: () => this.launchApp('Блокнот', 'notepad'),
        description: 'Открыть блокнот'
      },
      'calculator': { 
        keywords: ['калькулятор', 'calculator', 'посчитай'], 
        action: () => this.launchApp('Калькулятор', 'calc'),
        description: 'Открыть калькулятор'
      },
      'paint': { 
        keywords: ['пейнт', 'paint', 'рисовать'], 
        action: () => this.launchApp('Paint', 'mspaint'),
        description: 'Открыть Paint'
      },
      'youtube': {
        keywords: ['ютуб', 'youtube', 'видео'],
        action: () => this.launchApp('YouTube', 'https://www.youtube.com'),
        description: 'Открыть YouTube'
      },
      'music': {
        keywords: ['музыка', 'music', 'песня'],
        action: () => this.launchApp('Музыка', 'https://music.youtube.com'),
        description: 'Открыть музыку'
      },
      'google': {
        keywords: ['гугл', 'google', 'поиск'],
        action: () => this.launchApp('Google', 'https://www.google.com'),
        description: 'Открыть Google'
      },
      'github': {
        keywords: ['гитхаб', 'github', 'код'],
        action: () => this.launchApp('GitHub', 'https://github.com'),
        description: 'Открыть GitHub'
      }
    };

    // Локальные ответы для fallback
    this.fallbacks = [
      "[clip] Ой-ой! Похоже, вы хотите помощи! Я всегда рад помочь с любыми вопросами!",
      "[clip] Привет! Я - Скрепка. Могу я помочь? Просто спросите!",
      "[clip] Кажется, вы застряли! Хотите, я подскажу?",
      "[clip] Похоже, вы работаете над чем-то интересным! Могу я помочь?"
    ];
  }

  // Распознавание команд по ключевым словам
  parseCommand(userInput) {
    const input = userInput.toLowerCase().trim();
    
    // Проверяем команды запуска
    for (const [commandName, command] of Object.entries(this.commands)) {
      for (const keyword of command.keywords) {
        if (input.includes(keyword.toLowerCase()) && 
            (input.includes('запуск') || input.includes('запусти') || input.includes('открой') || 
             input.includes('open') || input.includes('run') || input.includes('start'))) {
          return command;
        }
      }
    }
    
    // Специальные команды
    if (input.includes('привет') || input.includes('hello') || input.includes('hi')) {
      return { action: () => "[clip] Привет-привет! Рад вас видеть! Чем могу помочь?" };
    }
    
    if (input.includes('пока') || input.includes('bye') || input.includes('exit')) {
      return { action: () => "[clip] До свидания! Возвращайтесь, если понадобится помощь!" };
    }
    
    if (input.includes('спасибо') || input.includes('thanks') || input.includes('thank you')) {
      return { action: () => "[clip] Всегда пожалуйста! Я здесь чтобы помогать!" };
    }

    if (input.includes('помощь') || input.includes('help') || input.includes('команды')) {
      return { action: () => this.getHelp() };
    }
    
    return null;
  }

  // Запуск игр (в новом окне)
  launchGame(gameName, url) {
    setTimeout(() => {
      window.open(url, '_blank', 'width=800,height=600,scrollbars=yes');
    }, 500);
    return `[clip] Ой-ой! Запускаю ${gameName}! Похоже, вы хотите развлечься! 🎮`;
  }

  // Запуск приложений
  launchApp(appName, command) {
    setTimeout(() => {
      if (command.startsWith('http')) {
        // Веб-приложение
        window.open(command, '_blank', 'width=1000,height=700');
      } else {
        // Попытка запуска системного приложения
        try {
          if (navigator.userAgent.includes('Windows')) {
            console.log(`Эмуляция запуска: ${command}`);
          }
        } catch (e) {
          console.log('Браузерная среда - используем веб-версии');
        }
      }
    }, 500);
    
    return `[clip] Запускаю ${appName}! Похоже, вам нужно поработать! 📝`;
  }

  // Основной метод общения с AI
  async ask(question) {
    this.messages.push({ role: "user", content: question });

    // Проверяем команды перед обращением к AI
    const command = this.parseCommand(question);
    if (command) {
      const result = command.action();
      this.messages.push({ role: "assistant", content: result });
      return result;
    }

    // Используем Gemini API
    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Ты - Скрепка из Microsoft Office 97. Ты немного наивная, энергичная и очень любишь помогать. 
                  Используй фразы вроде "Похоже, вы пишете письмо!", "Ой-ой!", "Могу я помочь?". 
                  Отвечай кратко - 1-2 предложения. Всегда начинай ответ с "[clip]". 
                  Говори только на русском.
                  
                  Вопрос пользователя: ${question}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 150,
            topP: 0.8,
            topK: 40
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      
      let answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!answer) {
        throw new Error("Пустой ответ от API");
      }

      // Убедимся, что ответ начинается с [clip]
      if (!answer.startsWith('[clip]')) {
        answer = '[clip] ' + answer;
      }
      
      this.messages.push({ role: "assistant", content: answer });
      return answer;
      
    } catch (error) {
      console.warn("Gemini API ошибка, используем локальный ответ:", error);
      
      // Локальный интеллект на основе ключевых слов
      const localResponse = this.localAI(question);
      return localResponse || this.getFallback();
    }
  }

  // Локальный AI для базовых ответов
  localAI(question) {
    const q = question.toLowerCase();
    
    const responses = [
      { 
        keywords: ['письмо', 'документ', 'word', 'напиши'], 
        response: '[clip] Похоже, вы пишете документ! Нужна помощь с форматированием?' 
      },
      { 
        keywords: ['таблица', 'excel', 'число', 'формул'], 
        response: '[clip] Ой! Работа с таблицами? Я могу помочь с формулами!' 
      },
      { 
        keywords: ['презентация', 'powerpoint', 'слайд'], 
        response: '[clip] Создаёте презентацию? Как насчёт добавить анимацию?' 
      },
      { 
        keywords: ['интернет', 'браузер', 'сайт', 'интернете'], 
        response: '[clip] Путешествуете по интернету? Будьте осторожны там!' 
      },
      { 
        keywords: ['программирование', 'код', 'javascript', 'python', 'html'], 
        response: '[clip] Пишете код? Не забудьте про точку с запятой! ;)' 
      },
      { 
        keywords: ['погода', 'дождь', 'солнце', 'холодно'], 
        response: '[clip] Ой-ой! Я не могу проверить погоду... Но выгляните в окно! 🌤️' 
      },
      { 
        keywords: ['время', 'который час', 'сколько времени'], 
        response: `[clip] Сейчас примерно ${new Date().toLocaleTimeString('ru-RU')}! Время летит!` 
      },
      { 
        keywords: ['как дела', 'как ты', 'настроение'], 
        response: '[clip] У меня всегда отлично! Я же программа! А как ваши дела?' 
      },
      { 
        keywords: ['что делаешь', 'чем занят'], 
        response: '[clip] Жду, когда вы попросите о помощи! Это моя любимая работа!' 
      },
      { 
        keywords: ['кто ты', 'что ты', 'твое имя'], 
        response: '[clip] Я - Скрепка! Ваш помощник из Microsoft Office! Рад познакомиться!' 
      }
    ];
    
    for (const item of responses) {
      for (const keyword of item.keywords) {
        if (q.includes(keyword)) {
          return item.response;
        }
      }
    }
    
    return null;
  }

  getFallback() {
    return this.fallbacks[Math.floor(Math.random() * this.fallbacks.length)];
  }

  // Добавляем справку по командам
  getHelp() {
    let helpText = "[clip] Доступные команды:\n";
    for (const [commandName, command] of Object.entries(this.commands)) {
      helpText += `• 'Запусти ${command.description.toLowerCase()}' \n`;
    }
    helpText += "\nПросто спросите что-нибудь, и я постараюсь помочь!";
    return helpText;
  }
}

const clippy = new ClippyAI();

// Остальной код без изменений...
function talkToClippy() {
  const input = document.getElementById("clippy-input");
  const chat = document.getElementById("clippy-chat");
  const q = input.value.trim();
  
  if (!q) return;

  chat.innerHTML += '<div class="user">Ты: ' + q + '</div>';
  input.value = "";

  const typing = document.createElement("div");
  typing.className = "clippy";
  typing.textContent = "[clip] Скрепка печатает...";
  chat.appendChild(typing);
  chat.scrollTop = chat.scrollHeight;

  clippy.ask(q).then(ans => {
    typing.remove();
    const formattedAnswer = ans.replace(/\n/g, '<br>');
    chat.innerHTML += '<div class="clippy">' + formattedAnswer + '</div>';
    chat.scrollTop = chat.scrollHeight;
  }).catch(err => {
    typing.remove();
    chat.innerHTML += '<div class="clippy">[clip] Ой-ой! Что-то пошло не так. Попробуйте ещё раз!</div>';
    chat.scrollTop = chat.scrollHeight;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const agent = document.getElementById("clippy-agent");
  const window = document.getElementById("clippy-window");
  const chat = document.getElementById("clippy-chat");
  
  if (agent && window) {
    agent.addEventListener("click", () => {
      window.classList.toggle("show");
      if (window.classList.contains('show')) {
        setTimeout(() => {
          const input = document.getElementById("clippy-input");
          if (input) input.focus();
        }, 100);
      }
    });
  }

  const input = document.getElementById("clippy-input");
  if (input) {
    input.addEventListener("keypress", e => {
      if (e.key === "Enter") talkToClippy();
    });
  }

  // Приветственное сообщение
  setTimeout(() => {
    if (chat) {
      chat.innerHTML = '<div class="clippy">[clip] Привет! Я - Скрепка! Готов помочь вам. Напишите "помощь" чтобы узнать доступные команды!</div>';
    }
  }, 1000);
});