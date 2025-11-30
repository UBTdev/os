// ======================== Глобальные переменные ========================
let state = {
  hp: 100,
  maxHp: 100,
  energy: 100,
  maxEnergy: 100,
  score: 0,
  debt: 300000,
  time: 0,
  currentNode: "start",
  debuffs: [],
  visited: {}
};

let timerInterval = null;
let typeInterval = null;

// ======================== Система диалогов ========================
const story = {
  // ======================== НАЧАЛО ========================
  start: {
    bg: "images/bg/apartment_dark.png",
    char: "images/chars/max_sad.png",
    speaker: "Введение",
    text: "Тебя зовут — Максим. В попытке обеспечить свою семью, но за неимением хорошего дохода в Тинькофф банке, ты набрал долгов в 300 000 ₽. Коллекторы достают каждый день. Зарплаты в Тинькофф банке не хватает и отношения на грани. Однако знаю, что по знакомству предлагают работу, может там будет лучше?",
    choices: [{ text: "Пора что-то менять…", next: "warehouse_job" }]
  },

  warehouse_job: {
    bg: "images/bg/warehouse.png",
    char: "images/chars/boss.png",
    speaker: "Босс",
    text: "Максим, добро пожаловать! Зарплата 20к, но у нас тут и склад, и офис. Будешь помогать с товаром, и на работать с сайтами. По рукам?",
    choices: [{ text: "По рукам", next: "first_week_warehouse" }]
  },

  first_week_warehouse: {
    bg: "images/bg/warehouse.png",
    char: "images/chars/max_tired.png",
    speaker: "Максим (мысли)",
    text: "Утро — делали инвентаризацию. День — правил верстку в админке Битрикса. Вечер — изучаю компоненты и инфоблоки. Платят копейки, но я реально учусь.",
    onEnter: () => addDebuff("Складской разработчик", 999),
    choices: [{ text: "Прошёл первый месяц…", next: "warehouse_month_later", energy: -25 }]
  },

  warehouse_month_later: {
    bg: "images/bg/warehouse.png",
    char: "images/chars/max_bitrix.png",
    speaker: "Максим",
    text: "Я уже уверенно закрываю некоторые потребности бизнеса. Понимаю PHP, компоненты. Но зарплата всё те же 23к, так ещё и с задержками… Беспокоюсь, что так мы никогда не выберемся из долгов. Однако посоветывался с Дашей и она сочла смену работы - хорошим шагом вперёд",
    choices: [
      { text: "Бояться перемен, терпеть и ждать повышения", next: "eternal_warehouse", score: 260000, energy: -100, hp: -50 },
      { text: "Рискнуть: начать брать заказы на стороне и уйти во фриланс", next: "first_kwork", energy: -15 }
    ]
  },

  // ======================== ПЛОХАЯ ВЕТКА: ОСТАТЬСЯ НА СКЛАДЕ ========================
  eternal_warehouse: {
    bg: "images/bg/warehouse.png",
    char: "images/chars/max_old.png",
    speaker: "Рассказчик",
    text: "Ты стал «главным кладовщиком» на складе, с опциями веб-мастера. Зарплата выросла до 30к. Долг частично погашен… хотя прошло 3 года. Жизнь прошла мимо и без особых прекрас.  Нейтральная концовка: «Вечный складской чародей»",
    choices: [{ text: "Начать заново", action: () => resetGame() }]
  },

  // ======================== ОСНОВНОЙ ПУТЬ: ФРИЛАНС ========================
  first_kwork: {
    bg: "images/bg/room_night.png",
    char: "images/chars/max_hope.png",
    speaker: "Максим",
    text: "Зарегистрировался на Kwork. Первый заказ: «поправить верстку на сайте» — 2700 рублей. Сделал за час. Деньги пришли мгновенно. Ты позвонил Даше и удивил её тем, что заработал первые деньги в интернете.",
    onEnter: () => state.score += 2700,
    choices: [{ text: "Это работает!", next: "dasha_reaction" }]
  },

  dasha_reaction: {
    char: "images/chars/dasha_surprised.png",
    speaker: "Даша",
    text: "Ты за час заработал больше, чем за день на прошлой работе?! Неужели это начало чего-то большего?",
    choices: [{ text: "Продолжить", next: "quit_warehouse" }]
  },

  quit_warehouse: {
    bg: "images/bg/warehouse.png",
    char: "images/chars/boss_angry.png",
    speaker: "kwork",
    text: "Покупатель оставил отзыв о работе. Вот его текст: 'Всё супер! Будем работать на постоянку'",
    choices: [{ text: "Мотивация так и прёт!", next: "full_freelance", energy: +25 }]
  },

  full_freelance: {
    bg: "images/bg/room_brighter.png",
    char: "images/chars/max_confident.png",
    speaker: "Первый месяц",
    text: "Прошёл месяц фриланса. 28 000 ₽. Потом 45 000 ₽. Ты ушёл с головой в заказы и самообучение.",
    onEnter: () => state.score += 45000,
    choices: [{ text: "Работать дальше", next: "burnout_trap", energy: -50 }]
  },

  // ======================== ЛОВУШКА ВЫГОРАНИЯ ========================
  burnout_trap: {
    bg: "images/bg/room_mess.png",
    char: "images/chars/max_csgo.png",
    speaker: "*Мысли*",
    text: "Вроде всё нормально, есть доход. А это значит, что можно и расслабиться! Ещё одну катку в CS… \n\nЗаказчик подождёт…",
    choices: [
      { text: "Продолжать играть", next: "bad_end_csgo", energy: -40 },
      { text: "Стоп. Я скатываюсь. Нужно взять себя в руки", next: "reboot_path", energy: -20 }
    ]
  },

  bad_end_csgo: {
    bg: "images/bg/apartment_empty.png",
    char: "images/chars/max_lonely.png",
    speaker: "Рассказчик",
    text: "Клиенты ушли. Долг вырос до 400к. Отношения на гране. Ты снова в колл-центре, вечерами в CS:GO.\n\nПлохая концовка: «Game Over»",
    choices: [{ text: "Начать заново", action: () => resetGame() }]
  },

  // ======================== ПЕРЕЗАГРУЗКА И РОСТ ========================
  reboot_path: {
    bg: "images/bg/dasha_mom_house.png",
    char: "images/chars/max_serious.png",
    speaker: "Максим",
    text: "Переезжаю к тёще. Даша пусть ведёт бюджет. Мой план — 5000 ₽ в день. Никаких игр, пока план не выполнен.",
    onEnter: () => { state.maxEnergy += 40; addDebuff("Режим зверя", 999); },
    choices: [{ text: "Вперёд", next: "scaling" }]
  },

  scaling: {
    bg: "images/bg/room_professional.png",
    char: "images/chars/max_pro.png",
    text: "80… 120… 180 тысяч в месяц. Ты стал настоящим профи. Старые клиенты приносят деньги даже когда ты отдыхаешь.",
    onEnter: () => state.score += 180000,
    choices: [{ text: "Дальше", next: "misha_offer" }]
  },

  misha_offer: {
    char: "images/chars/misha.png",
    speaker: "Миша Кодаф (Zoom)",
    text: "Бери меня в команду, Макс! У тебя фронт и верстка — огонь, у меня бэк. Вместе порвём рынок!",
    choices: [
      { text: "Остаться одиночкой — деньги не делю", next: "lone_wolf_end" },
      { text: "Создаём агентство вместе!", next: "true_ending", score: 300000 }
    ]
  },

  // ======================== КОНЦОВКИ ========================
  lone_wolf_end: {
    bg: "images/bg/room_burnout.png",
    char: "images/chars/max_tired_pro.png",
    speaker: "Рассказчик",
    text: "Долги закрыты, но ты работаешь по 16 часов. Нет времени на жизнь и на Дашу.\nНейтральная концовка: «Одинокий волк»",
    choices: [{ text: "Начать заново", action: () => resetGame() }]
  },

  true_ending: {
    bg: "images/bg/thailand_beach.png",
    char: "images/chars/max_dasha_happy.png",
    speaker: "Максим и Даша",
    text: "Долги закрыты за два года.\nАгентство работает. Онлайн-школа запущена.\nМы живём в Питере и зимуем в Таиланде.\n\nТот склад с коробками стал лучшим, что со мной случалось.\n\nМы смогли.",
    onEnter: () => state.score = 999999,
    choices: [{ text: "Начать заново", action: () => resetGame() }]
  },

  // Стандартная победа (если вдруг кто-то наберёт 300к другим путём)
  victory: {
    bg: "images/bg/thailand_beach.png",
    char: "images/chars/max_dasha_happy.png",
    text: "Поздравляю! Ты выбрался из кредитов и стал настоящим веб-чародеем!\n\nПосвящается Максиму — с огромной благодарностью за его путь.",
    choices: [{ text: "Играть заново", action: () => resetGame() }]
  }
};
// ======================== Основные функции ========================
function loadGame() {
  const saved = localStorage.getItem("codeAndCredit_save");
  if (saved) {
    Object.assign(state, JSON.parse(saved));
    goTo(state.currentNode);
    startTimer();
    document.getElementById("guiContainer").style.display = "block";
    document.getElementById("menu").style.display = "none";
  }
}

function saveGame() {
  localStorage.setItem("codeAndCredit_save", JSON.stringify(state));
}

function resetGame() {
  localStorage.removeItem("codeAndCredit_save");
  location.reload();
}

function startGame() {
  document.getElementById("menu").style.display = "none";
  document.getElementById("guiContainer").style.display = "block";
  loadGame() || goTo("start");
  startTimer();
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    state.time++;
    const m = String(Math.floor(state.time / 60)).padStart(2, '0');
    const s = String(state.time % 60).padStart(2, '0');
    document.getElementById("gameTime").textContent = `Время: ${m}:${s}`;
  }, 1000);
}

function goTo(nodeId) {
  if (!story[nodeId]) { console.error("Нет ноды", nodeId); return; }

  state.currentNode = nodeId;
  saveGame();

  const node = story[nodeId];

  // фон и персонаж
  document.getElementById("bg").src = node.bg || "images/bg/default.png";
  document.getElementById("character").src = node.char || "";

  // спикер
  document.getElementById("speaker").textContent = node.speaker || "";

  // текст с анимацией
  const textEl = document.getElementById("text");
  textEl.textContent = "";
  clearInterval(typeInterval);
  let i = 0;
  const txt = node.text || "";
  typeInterval = setInterval(() => {
    if (i < txt.length) {
      textEl.textContent += txt[i];
      playSound("type");
      i++;
    } else clearInterval(typeInterval);
  }, 30);

  // выборы
  const choicesDiv = document.getElementById("choices");
  choicesDiv.innerHTML = "";

  (node.choices || []).forEach(ch => {
    const div = document.createElement("div");
    div.className = "choice gui";
    div.textContent = ch.text;
    div.onclick = () => {
      playSound("choice");

      // эффекты
      if (ch.hp) state.hp = Math.max(0, state.hp + ch.hp);
      if (ch.energy) state.energy = Math.max(0, state.energy + ch.energy);
      if (ch.score) state.score += ch.score;

      updateStats();

      if (ch.action) ch.action();
      else goTo(ch.next || "start");

      // проверки смерти
      if (state.hp <= 0 || state.energy <= 0) goTo("gameOver");
      if (state.score >= state.debt) goTo("victory");
    };
    choicesDiv.appendChild(div);
  });

  // onEnter хуки
  if (node.onEnter) node.onEnter();
}

// ======================== Вспомогательные ========================
function updateStats() {
  document.getElementById("hpBar").textContent = `HP ${state.hp}/${state.maxHp}`;
  document.getElementById("energyBar").textContent = `Энергия ${state.energy}/${state.maxEnergy}`;
  document.getElementById("score").textContent = `Долг погашен: ${state.score} ₽ / 300000 ₽`;
}

function addDebuff(name, turns) {
  state.debuffs.push({ name, turns });
  renderDebuffs();
}
function renderDebuffs() {
  const container = document.getElementById("debuffs");
  container.innerHTML = "";
  state.debuffs.forEach(d => {
    const el = document.createElement("div");
    el.className = "debuff";
    el.textContent = d.name;
    container.appendChild(el);
  });
}

function playSound(type) {
  const sounds = {
    type: document.getElementById("typeSound"),
    choice: document.getElementById("choiceSound"),
    error: document.getElementById("errorSound")
  };
  if (sounds[type]) sounds[type].play().catch(() => { });
}

// ======================== Настройки и README ========================
// === НОВЫЕ функции для модалок ===
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

function openModal(id) {
  document.getElementById(id).classList.add('active');
}

// README
function showReadme() {
  openModal('modalReadme');
}

// Настройки
function openSettings() {
  openModal('modalSettings');
}

function toggleGui() {
  const gui = document.getElementById('guiContainer');
  const hidden = gui.style.opacity === '0';
  document.querySelectorAll('.gui').forEach(el => {
    el.style.opacity = hidden ? '1' : '0';
    el.style.pointerEvents = hidden ? 'all' : 'none';
  });
  closeModal('modalSettings');
}

function showClearConfirm() {
  openModal('modalClearConfirm');
}

// Автозагрузка с красивым вопросом
window.onload = () => {
  if (localStorage.getItem("codeAndCredit_save")) {
    openModal('modalContinue');
  }
};

// Переопределяем resetGame, чтобы закрывались модалки
function resetGame() {
  localStorage.removeItem("codeAndCredit_save");
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
  location.reload();
}