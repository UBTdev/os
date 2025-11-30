// THE OPERATING SYSTEM CORE
const osName = "ArokenOS '98";

// MAIN APP OBJECT
const ArokenOS = {
    windowCounter: 0,
    loadedScripts: {},
    isAudioUnlocked: false,
    openWindows: new Map(), // open window checker

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setOSName();
            this.initWindowManager();
            this.initClock();
            this.initDesktopIcons();
            this.initVolumeAlert();
            this.initPreloader();
            this.welcomeWindow();
        });
    },

    // set OS name in all elements 
    setOSName() {
        document.querySelectorAll('#OS-Name').forEach(el => {
            el.textContent = osName;
        });
    },

    // win manager init
    initWindowManager() {
        this.windowManager = new WindowManager();
    },

    // time refresh
    initClock() {
        function updateClock() {
            const now = new Date();
            const time = now.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const clockElement = document.getElementById('clock');
            if (clockElement) {
                clockElement.textContent = time;
            }
        }

        setInterval(updateClock, 1000);
        updateClock();
    },

    // desktop icons control
    initDesktopIcons() {
        let lastClickTime = 0;
        let lastClickedIcon = null;

        document.querySelectorAll('#desktop-icon').forEach(icon => {
            icon.addEventListener('click', function (e) {
                e.stopPropagation();
                const now = Date.now();
                const DOUBLE_CLICK_DELAY = 400;

                // remove selection from all icons
                document.querySelectorAll('#desktop-icon').forEach(i => i.classList.remove('selected'));

                // current select 
                this.classList.add('selected');
                // this.classList.add('focused');

                // double click check
                if (lastClickedIcon === this && now - lastClickTime < DOUBLE_CLICK_DELAY && !this.classList.contains('music-folder')) {
                    const appName = this.dataset.app;
                    ArokenOS.openApp(appName);

                    lastClickTime = 0;
                    lastClickedIcon = null;
                } else {
                    lastClickTime = now;
                    lastClickedIcon = this;
                }
            });
        });

        // Remove selection when click outside icons
        document.querySelector('.desktop').addEventListener('click', function (e) {
            if (e.target === this) {
                document.querySelectorAll('.desktop-icon.selected').forEach(icon => {
                    icon.classList.remove('selected');
                    // icon.classList.remove('focused');
                });
                lastClickedIcon = null;
            }
        });
    },

    // Notification about volume control
    initVolumeAlert() {
        const volumeHelpAlert = document.querySelector('.master-volume__help-alert');
        const isClosed = localStorage.getItem('volumeHelpAlertClosed');
        console.log(isClosed);
        if (isClosed === 'true' && volumeHelpAlert) {
            volumeHelpAlert.classList.add('master-volume__help-alert--closed');
        }
    },

    // Preloader
    initPreloader() {
        const loader = document.getElementById('win98-bootloader');
        if (!loader) return;

        const fill = document.getElementById('progress-fill');
        let progress = 0;
        const duration = 8000;
        // FAST BOOT FOR DEVELOPERS
        // const interval = 5;
        const interval = 500;

        const timer = setInterval(() => {
            progress += Math.random() * 8 + 2;
            if (progress > 100) progress = 100;
            if (fill) fill.style.width = progress + '%';

            if (progress >= 100) {
                clearInterval(timer);

                loader.innerHTML += `
                    <div class="boot-hint">
                        Нажмите ENTER, или на экран, чтобы войти в ArokenOS
                    </div>
                `;

                const activate = () => {
                    this.unlockAudioAndPlayStartup();
                    loader.style.opacity = '0';
                    loader.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        if (loader.parentNode) {
                            loader.parentNode.removeChild(loader);
                        }
                    }, 600);

                    document.removeEventListener('click', activate);
                    document.removeEventListener('touchstart', activate);
                    document.removeEventListener('keydown', activate);
                };

                document.addEventListener('click', activate, { once: true });
                document.addEventListener('touchstart', activate, { once: true });
                document.addEventListener('keydown', activate, { once: true });
            }
        }, interval);
    },

    // unlock audio and play startup sound
    unlockAudioAndPlayStartup() {
        if (this.isAudioUnlocked) return;

        const systemAudio = document.getElementById('system-audio');
        if (!systemAudio) {
            console.log("System audio element not found");
            return;
        }


        systemAudio.src = './audio/systemSounds/microsoft-windows-98-startup.mp3';
        systemAudio.volume = 0.5;


        const playPromise = systemAudio.play();

        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log("Startup sound played successfully");
                    this.isAudioUnlocked = true;
                })
                .catch(error => {
                    console.log("Audio blocked, waiting for user interaction");


                    this.createAudioUnlockButton();
                });
        }
    },

    createAudioUnlockButton() {
        const unlockBtn = document.createElement('button');
        unlockBtn.innerHTML = '🔊 Разблокировать звук';
        unlockBtn.style.cssText = `
        position: fixed;
        bottom: 60px;
        right: 20px;
        background: #c0c0c0;
        border: 2px outset #dfdfdf;
        padding: 8px 12px;
        font-family: 'MS Sans Serif', Tahoma, sans-serif;
        font-size: 11px;
        cursor: pointer;
        z-index: 10000;
    `;

        unlockBtn.onclick = () => {
            const systemAudio = document.getElementById('system-audio');
            systemAudio.play()
                .then(() => {
                    console.log("Audio unlocked via button");
                    this.isAudioUnlocked = true;
                    unlockBtn.remove();
                })
                .catch(e => {
                    console.log("Still blocked after button click");
                });
        };

        document.body.appendChild(unlockBtn);

        setTimeout(() => {
            if (unlockBtn.parentNode) {
                unlockBtn.remove();
            }
        }, 10000);
    },

    // load scripts
    async loadScript(url) {
        if (this.loadedScripts[url]) {
            return Promise.resolve();
        }

        this.loadedScripts[url] = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => resolve();
            script.onerror = () => {
                delete this.loadedScripts[url];
                reject(new Error(`Не удалось загрузить скрипт: ${url}`));
            };
            document.head.appendChild(script);
        });

        return this.loadedScripts[url];
    },

    // Apps oppened
    async openApp(appName) {
        try {
            document.body.classList.add('loading-cursor');
            const response = await fetch(`apps/${appName}.json`);
            if (!response.ok) throw new Error('Файл не найден');

            const app = await response.json();
            await new Promise(resolve => setTimeout(resolve, 1000));
            document.body.classList.remove('loading-cursor');

            const win = this.createWindow(
                app.title || 'Без названия',
                app.content || 'Пусто...',
                {
                    width: app.width || 500,
                    height: app.height || 400,
                    icon: app.icon
                }
            );

            // IFRAME APPS REGISTRATION!!! AGHTING!!!
            const iframeApps = [
                'doom',
                'freelance-simulator',
                'support',
                'live-on-credit',
                'internet-explorer',
                'minecraft',
                'gallery-folder',
                'recycle-bin',
            ];

            if (iframeApps.includes(appName)) {
                const contentElement = win.querySelector('.window-content');
                if (contentElement) {
                    contentElement.style.padding = '0';
                    contentElement.style.overflow = 'hidden';
                    contentElement.innerHTML = '';

                    const iframe = document.createElement('iframe');
                    iframe.src = `${appName}.html`;
                    iframe.style.width = '100%';
                    iframe.style.height = '100%';
                    iframe.style.border = 'none';

                    contentElement.appendChild(iframe);
                }
            }

        } catch (err) {
            this.createWindow('Ошибка 404', `Приложение "${appName}" не найдено<br><br>Ошибка: ${err.message}`);
        }
    },

    // add window and add to taskbar
    createWindow(title, content, options = {}) {
        this.windowCounter++;
        const id = `win_${Date.now()}_${this.windowCounter}`;

        const width = options.width || 500;
        const height = options.height || 400;
        const icon = options.icon || 'img/icons/computer_explorer_2k-5.png';

        const left = 50 + (this.windowCounter * 40) % 400;
        const top = 50 + (this.windowCounter * 30) % 300;

        const win = document.createElement('div');
        win.className = 'window';
        win.id = id;
        win.style.cssText = `
            width: ${width}px;
            height: ${height}px;
            left: ${left}px;
            top: ${top}px;
            opacity: 0;
            transform: translateY(-20px);
            transition: opacity 0.2s, transform 0.2s;
            min-width: 200px;
            min-height: 150px;
        `;

        // save org params
        win.dataset.origWidth = width;
        win.dataset.origHeight = height;
        win.dataset.origLeft = left;
        win.dataset.origTop = top;

        win.innerHTML = `
            <div class="title-bar">
                <div class="title-icon"><img src="${icon}" width="16" height="16" alt="${title}"></div>
                <div class="title-text">${title}</div>
                <div class="window-controls">
                    <div class="control-btn minimize-btn" onclick="ArokenOS.minimizeWindow('${id}')">_</div>
                    <div class="control-btn maximize-btn" onclick="ArokenOS.toggleMaximize('${id}')">□</div>
                    <div class="control-btn close-btn" onclick="ArokenOS.closeWindow('${id}')">×</div>
                </div>
            </div>
            <div class="window-content">${content}</div>
            <!-- Элементы для изменения размера -->
            <div class="resize-handle resize-n"></div>
            <div class="resize-handle resize-e"></div>
            <div class="resize-handle resize-s"></div>
            <div class="resize-handle resize-w"></div>
            <div class="resize-handle resize-ne"></div>
            <div class="resize-handle resize-se"></div>
            <div class="resize-handle resize-sw"></div>
            <div class="resize-handle resize-nw"></div>
        `;

        document.querySelector('.desktop').appendChild(win);

        // add win in taskbar
        this.addToTaskbar(id, title, icon);

        // Animation show window
        requestAnimationFrame(() => {
            win.style.opacity = '1';
            win.style.transform = 'translateY(0)';
        });

        this.windowManager.bringToFront(win);
        return win;
    },

    // add to taskbar
    addToTaskbar(windowId, title, icon) {
        const taskbarApps = document.getElementById('taskbarApps');
        if (!taskbarApps) return;

        const appElement = document.createElement('div');
        appElement.className = 'taskbar-app taskbar-btn';
        appElement.dataset.windowId = windowId;
        appElement.innerHTML = `
            <img src="${icon}" class="taskbar-app-icon" alt="${title}">
            <span class="taskbar-app-title">${title}</span>
        `;

        // event to taskbar btn
        appElement.addEventListener('click', () => {
            this.focusWindow(windowId);
        });

        taskbarApps.appendChild(appElement);

        // save window info
        this.openWindows.set(windowId, {
            element: appElement,
            windowElement: document.getElementById(windowId),
            title: title,
            icon: icon
        });

        this.updateTaskbar();
    },

    // del window from taskbar
    removeFromTaskbar(windowId) {
        const windowInfo = this.openWindows.get(windowId);
        if (windowInfo && windowInfo.element) {
            windowInfo.element.remove();
        }
        this.openWindows.delete(windowId);
        this.updateTaskbar();
    },

    // refrash taskbar status
    updateTaskbar() {
        const taskbarApps = document.getElementById('taskbarApps');
        if (!taskbarApps) return;

        // refrash active status
        this.openWindows.forEach((info, windowId) => {
            const windowElement = document.getElementById(windowId);
            const isActive = windowElement && windowElement.classList.contains('active');
            const isMinimized = windowElement && windowElement.classList.contains('minimized');

            if (info.element) {
                info.element.classList.toggle('active', isActive && !isMinimized);
            }
        });
    },

    // focus window
    focusWindow(windowId) {
        const windowElement = document.getElementById(windowId);
        if (!windowElement) return;

        const isMinimized = windowElement.classList.contains('minimized');

        if (isMinimized) {
            // restore minimize windoiw
            this.restoreWindow(windowId);
        } else if (windowElement.classList.contains('active')) {
            // if win active - minimize
            this.minimizeWindow(windowId);
        } else {
            // Активируем окно
            this.windowManager.bringToFront(windowElement);
        }

        this.updateTaskbar();
    },

    // Minimize window
    minimizeWindow(windowId) {
        const windowElement = document.getElementById(windowId);
        if (windowElement) {
            windowElement.classList.add('minimized');
            windowElement.style.display = 'none';
            this.updateTaskbar();
        }
    },

    // restore window
    restoreWindow(windowId) {
        const windowElement = document.getElementById(windowId);
        if (windowElement) {
            windowElement.classList.remove('minimized');
            windowElement.style.display = 'block';
            this.windowManager.bringToFront(windowElement);
            this.updateTaskbar();
        }
    },

    // heide \ show window
    toggleMaximize(id) {
        const win = document.getElementById(id);
        if (!win) return;

        if (win.classList.contains('maximized')) {
            // return original size
            win.classList.remove('maximized');
            win.style.width = win.dataset.origWidth + 'px';
            win.style.height = win.dataset.origHeight + 'px';
            win.style.left = win.dataset.origLeft + 'px';
            win.style.top = win.dataset.origTop + 'px';
        } else {
            // save loacl coed
            win.dataset.origLeft = win.offsetLeft;
            win.dataset.origTop = win.offsetTop;
            win.dataset.origWidth = win.offsetWidth;
            win.dataset.origHeight = win.offsetHeight;

            win.classList.add('maximized');
            win.style.width = '100vw';
            win.style.height = 'calc(100vh - 28px)';
            win.style.left = '0';
            win.style.top = '0';
        }
    },

    // close window with close in task panel
    closeWindow(id) {
        const win = document.getElementById(id);
        if (win) {
            win.style.opacity = '0';
            win.style.transform = 'scale(0.9)';
            setTimeout(() => {
                if (win.parentNode) {
                    win.parentNode.removeChild(win);
                }
                this.removeFromTaskbar(id);
            }, 200);
        }
    },

    // Hi window
    welcomeWindow() {
        const content = `
            <div class="window-content text-document hi-info">
                <div class="text-document__inner">
                <p><strong>${osName} v1.0</strong></p>
<p>Вашему вниманию представлен симулятор ОС, сделанный по образу и подобию легендарной Windows 98.</p>
<br>
<p>Это <b title="SPA - Single Page Application"><span class="info-link">SPA</span></b>, полностью масштабируемое и адаптивное. Всё разделено на отдельные компоненты, в любой момент можно добавить новые приложения.</p>
<br>
<p><b>Разработано с использованием:</b></p>
<div class="tech"><div class="tech-icon"><img src="./img/icons/html-icon.png"></div>• HTML5</div>
<div class="tech"><div class="tech-icon"><img src="./img/icons/css-icon.png"></div>• CSS3</div>
<div class="tech"><div class="tech-icon"><img src="./img/icons/JS-icon.png"></div>• Чистый JavaScript</div>
<br>
<p>Перетаскивайте и закрывайте окна, меняйте их размер, проходите <a href="#my-games" class="info-link">сюжетные</a> или обычные игры. Поговорите со <a href="#clippy-about" class="info-link">Скрепкой AI</a>. Слушайте музыку либо свободно рассматривайте всё, что душе угодно. <b>Всё в ваших руках!</b></p>
<br>
<p>Здесь много отсылок к истории Арокен.ру и жизненному пути Максима. Думаю, кому небезразличен этот проект, тому будет интересно.</p>
<br><p><b>Приятного времяпрепровождения!</b></p>
<br>
<br><b>Состав проекта:</b>
<br>
<p>• Сборник фотографий из канала Максима (2020–2025), частично отражающий хронологию этих лет
<br>
• Симулятор Internet Explorer (веб-архив)
<br>
• Классические игры и системные приложения Windows 98
<br>
• Живой AI-ассистент в образе Скрепки из Office 97 — для общения и быстрого запуска программ
<br>
• Полная симуляция интерфейса и поведения Windows 98
<br>
• Все действия сопровождаются небольшой искусственной задержкой — для полного погружения в пользовательский опыт конца 90-х</p>
<br>
<p id="my-games">Полностью рабочее меню «Пуск» <b style="color: red">*Перезапуск системы стирает все данные пользователя!</b></p>
<br>
<br><br><br>
<b>Игры:</b>
<p>
    В данной ОС представлено несколько игр: Live on Credit, Freelance Simulator. Live on Credit — сюжетная новелла.
    <br>
    А также есть поддержка iframe-игр: Minecraft и две части Doom.
</p>
<br>
<br>
<br>
<p id="clippy-about">
    <b>AI-ассистент Скрепка</b>
    <br>
    <span>Системные команды (кроме промптов):</span>
    <br>
    <br>
    • Запусти<b> doom/дум/DOOM</b> - Запустить игру DOOM
<br>
    • Запусти<b> minecraft/майнкрафт/майн</b> - Запустить Minecraft
<br>
    • Открой <b>notepad/блокнот/заметки</b> - Открыть блокнот
<br>
    • Запусти<b> internet/интернет/explorer/браузер</b> - Открыть Internet Explorer
<br>
    • Открой <b>gallery/галерея/галерею/фото/картинки</b> - Открыть галерею
<br>
    • Открой <b>support/поддержка/поддержку автора</b> - Открыть поддержку
<br>
    • Запусти<b> freelance/фриланс/simulator/фриланс симулятор</b> - Запустить Freelance Simulator
<br>
    • Открой <b>credit/новеллу/новелла/live on credit/Жизнь в кредит</b> - Открыть Live on Credit
<br>
    • Открой <b>recycle bin/корзина/корзину</b> - Открыть корзину
<br>
    • Открой <b>help/помощь</b> - Открыть помощь
    <br>
</p>
<br><br><br>
<p>Начал разработку 18.11.2025. В настоящее время работает версия 1.0.</p>
<br>
<p>Спасибо за внимание!</p>
                </div>
            </div>
        `;

        this.createWindow(`${osName} — Добро пожаловать!`, content, {
            width: 440,
            height: 480,
            icon: 'img/icons/msg_information-2.png'
        });
    }
};

// resize and move windows system
class WindowManager {
    constructor() {
        this.draggedWindow = null;
        this.resizingWindow = null;
        this.resizeDirection = null;
        this.offsetX = 0;
        this.offsetY = 0;
        this.startX = 0;
        this.startY = 0;
        this.startWidth = 0;
        this.startHeight = 0;
        this.startLeft = 0;
        this.startTop = 0;
        this.zIndex = 10;
        this.init();
    }

    init() {
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    handleMouseDown(e) {
        // check size change
        const resizeHandle = e.target.closest('.resize-handle');
        if (resizeHandle) {
            this.startResizing(resizeHandle, e);
            return;
        }

        // check drag window title
        const titleBar = e.target.closest('.title-bar');
        if (!titleBar) return;

        const window = titleBar.closest('.window');
        if (!window) return;

        this.bringToFront(window);
        this.startDragging(window, e);
    }

    handleMouseMove(e) {
        if (this.draggedWindow) {
            this.handleDragging(e);
        } else if (this.resizingWindow) {
            this.handleResizing(e);
        }
    }

    handleMouseUp() {
        if (this.draggedWindow) {
            this.draggedWindow.classList.remove('dragging');
            this.draggedWindow = null;
        }

        if (this.resizingWindow) {
            this.resizingWindow.classList.remove('resizing');
            this.resizingWindow = null;
            this.resizeDirection = null;
            document.body.style.cursor = 'default';
        }
    }

    // window moving
    startDragging(window, e) {
        this.draggedWindow = window;
        this.draggedWindow.classList.add('dragging');

        const rect = window.getBoundingClientRect();
        this.offsetX = e.clientX - rect.left;
        this.offsetY = e.clientY - rect.top;

        e.preventDefault();
    }

    handleDragging(e) {
        const x = e.clientX - this.offsetX;
        const y = e.clientY - this.offsetY;

        const maxX = window.innerWidth - this.draggedWindow.offsetWidth;
        const maxY = window.innerHeight - 100;

        this.draggedWindow.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
        this.draggedWindow.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
    }

    // window size change
    startResizing(handle, e) {
        const window = handle.closest('.window');
        if (!window) return;

        this.resizingWindow = window;
        this.resizeDirection = handle.className.replace('resize-handle ', '');
        this.resizingWindow.classList.add('resizing');

        const rect = window.getBoundingClientRect();
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.startWidth = rect.width;
        this.startHeight = rect.height;
        this.startLeft = rect.left;
        this.startTop = rect.top;

        // install cursor for resize
        document.body.style.cursor = this.getResizeCursor(this.resizeDirection);

        e.preventDefault();
        e.stopPropagation();
    }

    handleResizing(e) {
        if (!this.resizingWindow) return;

        const deltaX = e.clientX - this.startX;
        const deltaY = e.clientY - this.startY;

        let newWidth = this.startWidth;
        let newHeight = this.startHeight;
        let newLeft = this.startLeft;
        let newTop = this.startTop;

        const minWidth = 200;
        const minHeight = 150;

        // handle resize direction
        switch (this.resizeDirection) {
            case 'resize-e':
                newWidth = Math.max(minWidth, this.startWidth + deltaX);
                break;
            case 'resize-w':
                newWidth = Math.max(minWidth, this.startWidth - deltaX);
                newLeft = this.startLeft + deltaX;
                break;
            case 'resize-s':
                newHeight = Math.max(minHeight, this.startHeight + deltaY);
                break;
            case 'resize-n':
                newHeight = Math.max(minHeight, this.startHeight - deltaY);
                newTop = this.startTop + deltaY;
                break;
            case 'resize-se':
                newWidth = Math.max(minWidth, this.startWidth + deltaX);
                newHeight = Math.max(minHeight, this.startHeight + deltaY);
                break;
            case 'resize-sw':
                newWidth = Math.max(minWidth, this.startWidth - deltaX);
                newHeight = Math.max(minHeight, this.startHeight + deltaY);
                newLeft = this.startLeft + deltaX;
                break;
            case 'resize-ne':
                newWidth = Math.max(minWidth, this.startWidth + deltaX);
                newHeight = Math.max(minHeight, this.startHeight - deltaY);
                newTop = this.startTop + deltaY;
                break;
            case 'resize-nw':
                newWidth = Math.max(minWidth, this.startWidth - deltaX);
                newHeight = Math.max(minHeight, this.startHeight - deltaY);
                newLeft = this.startLeft + deltaX;
                newTop = this.startTop + deltaY;
                break;
        }

        // apply resize changes
        this.resizingWindow.style.width = newWidth + 'px';
        this.resizingWindow.style.height = newHeight + 'px';
        this.resizingWindow.style.left = newLeft + 'px';
        this.resizingWindow.style.top = newTop + 'px';

        // refrash original window sizes
        this.resizingWindow.dataset.origWidth = newWidth;
        this.resizingWindow.dataset.origHeight = newHeight;
    }

    getResizeCursor(direction) {
        const cursors = {
            'resize-n': 'n-resize',
            'resize-e': 'e-resize',
            'resize-s': 's-resize',
            'resize-w': 'w-resize',
            'resize-ne': 'ne-resize',
            'resize-se': 'se-resize',
            'resize-sw': 'sw-resize',
            'resize-nw': 'nw-resize'
        };
        return cursors[direction] || 'default';
    }

    bringToFront(window) {
        this.zIndex++;
        window.style.zIndex = this.zIndex;
        window.classList.add('active');

        document.querySelectorAll('.window').forEach(otherWindow => {
            if (otherWindow !== window) {
                otherWindow.classList.remove('active');
            }
        });

        // refresh taskbar
        if (ArokenOS.updateTaskbar) {
            ArokenOS.updateTaskbar();
        }
    }
}

// global func for html attr
function toggleStartMenu() {
    alert('[Start Menu]\nПрограммы\nДокументы\nНастройки\nСправка\nВыполнить...\nЗавершение работы...');
}

function toggleVolumeControl() {
    const masterVolumeBtn = document.getElementById('master-volume');
    if (masterVolumeBtn) {
        masterVolumeBtn.classList.toggle('master-volume--open');
    }
}

function volumeHelpAlertClose() {
    const volumeHelpAlert = document.querySelector('.master-volume__help-alert');
    if (volumeHelpAlert) {
        volumeHelpAlert.classList.add('master-volume__help-alert--closed');
        localStorage.setItem('volumeHelpAlertClosed', 'true');
    }
}

document.addEventListener('click', function (e) {
    e.stopImmediatePropagation
    const desktopIcons = document.querySelectorAll('desktop-icon');
    if (e.target !== desktopIcons) {
        document.querySelectorAll('.desktop-icon.selected').forEach(icon => {
            icon.classList.remove('selected');
        });
        lastClickedIcon = null; // drop last selected icon
    }
});

const originalTitle = osName;
document.title = 'loading...';
setTimeout(() => {
    document.title = '';
    let titleIndex = 0;
    let titleLength = originalTitle.length;
    function animateTitle() {
        if (titleIndex <= titleLength) {
            document.title += originalTitle.charAt(titleIndex);
            titleIndex++;
            setTimeout(animateTitle, 200);
        }
    }
    animateTitle()
}, 8000);



// app init
ArokenOS.init();

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

        // System commands for ArokenOS
        this.commands = {
            'doom': {
                keywords: ['дум', 'doom'],
                action: () => this.launchArokenApp('doom'),
                description: 'Запустить игру DOOM'
            },
            'minecraft': {
                keywords: ['майнкрафт', 'minecraft', 'майн'],
                action: () => this.launchArokenApp('minecraft'),
                description: 'Запустить Minecraft'
            },
            'notepad': {
                keywords: ['notepad', 'заметки', 'блокнот'],
                action: () => this.launchArokenApp('notepad'),
                description: 'Открыть блокнот'
            },
            'internet': {
                keywords: ['интернет', 'internet', 'explorer', 'internet explorer', 'браузер'],
                action: () => this.launchArokenApp('internet-explorer'),
                description: 'Открыть Internet Explorer'
            },
            'gallery': {
                keywords: ['галерея', 'фото', 'картинки', 'gallery', 'галерею'],
                action: () => this.launchArokenApp('gallery-folder'),
                description: 'Открыть галерею'
            },
            'support': {
                keywords: ['поддержка', 'support', 'поддержку автора'],
                action: () => this.launchArokenApp('support'),
                description: 'Открыть поддержку'
            },
            'freelance': {
                keywords: ['фриланс', 'freelance', 'freelance simulator', 'simulator', 'фриланс симулятор'],
                action: () => this.launchArokenApp('freelance-simulator'),
                description: 'Запустить Freelance Simulator'
            },
            'credit': {
                keywords: ['новеллу', 'новелла', 'live on credit', 'Жизнь в кредит'],
                action: () => this.launchArokenApp('live-on-credit'),
                description: 'Открыть Live on Credit'
            },
            'recycle': {
                keywords: ['recycle bin', 'корзина', 'корзину'],
                action: () => this.launchArokenApp('recycle-bin'),
                description: 'Открыть корзину'
            },
            // 'help': {
            //     keywords: ['помощь', 'help'],
            //     action: () => this.launchArokenApp('help'),
            //     description: 'Открыть помощь'
            // }
        };

        // local fallback 
        this.fallbacks = [
            "[clip] Ой-ой! Похоже, вы хотите помощи! Я всегда рад помочь с любыми вопросами!",
            "[clip] Привет! Я - Скрепка. Могу я помочь? Просто спросите!",
            "[clip] Кажется, вы застряли! Хотите, я подскажу?",
            "[clip] Похоже, вы работаете над чем-то интересным! Могу я помочь?"
        ];
    }

    // start app from ArokenOS
    async launchArokenApp(appName) {
        // check main object
        if (window.ArokenOS && typeof window.ArokenOS.openApp === 'function') {
            console.log(`Скрепка: запускаю приложение ${appName} через ArokenOS`);

            // lounch app from ArokenOS
            try {
                await window.ArokenOS.openApp(appName);
                return `[clip] Запускаю ${this.getAppName(appName)} через ArokenOS! 📀`;
            } catch (error) {
                console.error('Ошибка при запуске приложения через ArokenOS:', error);
                // if get error - return fallback
                return await this.launchAppFallback(appName);
            }
        } else {
            // if main app is not available - return fallback
            console.log('ArokenOS не доступен, использую fallback');
            return await this.launchAppFallback(appName);
        }
    }

    // Fallback for success launch app
    async launchAppFallback(appName) {
        try {
            // load app json
            const response = await fetch(`apps/${appName}.json`);
            if (!response.ok) throw new Error('JSON конфигурация не найдена');

            const appConfig = await response.json();

            // create app window 
            this.createAppWindow(
                appConfig.title || this.getAppName(appName),
                appName,
                {
                    width: appConfig.width || 500,
                    height: appConfig.height || 400,
                    icon: appConfig.icon || './img/icons/computer_explorer_2k-5.png'
                }
            );

            return `[clip] Запускаю ${this.getAppName(appName)} в окне ArokenOS! 🪟`;

        } catch (error) {
            console.error('Ошибка при загрузке конфигурации приложения:', error);

            // if JSON is not defined - try open app html file
            return this.launchAppDirectly(appName);
        }
    }

    // create app window 
    createAppWindow(title, appName, options = {}) {
        const windowId = `clippy_${appName}_${Date.now()}`;
        const width = options.width || 500;
        const height = options.height || 400;
        const icon = options.icon || './img/icons/computer_explorer_2k-5.png';

        const left = 100 + (Math.random() * 200);
        const top = 100 + (Math.random() * 200);

        const win = document.createElement('div');
        win.className = 'window';
        win.id = windowId;
        win.style.cssText = `
      width: ${width}px;
      height: ${height}px;
      left: ${left}px;
      top: ${top}px;
      opacity: 0;
      transform: translateY(-20px);
      transition: opacity 0.2s, transform 0.2s;
      min-width: 200px;
      min-height: 150px;
      z-index: 1000;
    `;

        // iframe open check
        const iframeApps = [
            'doom',
            'freelance-simulator',
            'support',
            'live-on-credit',
            'internet-explorer',
            'minecraft',
            'gallery-folder',
            'recycle-bin',
        ];

        let contentHtml = '';
        if (iframeApps.includes(appName)) {
            contentHtml = `
        <div class="window-content" style="padding: 0; overflow: hidden;">
          <iframe src="${appName}.html" style="width: 100%; height: 100%; border: none;"></iframe>
        </div>
      `;
        } else {
            contentHtml = `
        <div class="window-content">
          ${options.content || `Приложение "${title}" запущено через Скрепку`}
        </div>
      `;
        }

        win.innerHTML = `
      <div class="title-bar">
        <div class="title-icon"><img src="${icon}" width="16" height="16" alt="${title}"></div>
        <div class="title-text">${title}</div>
        <div class="window-controls">
          <div class="control-btn minimize-btn" onclick="this.closest('.window').style.display = 'none'">_</div>
          <div class="control-btn maximize-btn" onclick="this.toggleMaximize('${windowId}')">□</div>
          <div class="control-btn close-btn" onclick="this.closest('.window').remove()">×</div>
        </div>
      </div>
      ${contentHtml}
    `;

        document.querySelector('.desktop').appendChild(win);

        // open window animation
        requestAnimationFrame(() => {
            win.style.opacity = '1';
            win.style.transform = 'translateY(0)';
        });

        // create window draggable
        this.makeWindowDraggable(windowId);

        return win;
    }

    // launch app directly if json is not defined
    launchAppDirectly(appName) {
        const externalUrls = {
            'doom': 'https://archive.org/details/msdos_Doom_1993',
            'minecraft': 'https://classic.minecraft.net/',
            'youtube': 'https://www.youtube.com',
            'music': 'https://music.youtube.com',
            'google': 'https://www.google.com',
            'github': 'https://github.com'
        };

        if (externalUrls[appName]) {
            window.open(externalUrls[appName], '_blank');
            return `[clip] Открываю ${this.getAppName(appName)} в новой вкладке! 🌐`;
        } else {
            // try open app html file if json is not defined
            try {
                window.open(`${appName}.html`, '_blank');
                return `[clip] Запускаю ${this.getAppName(appName)} в новом окне! 📁`;
            } catch (e) {
                return `[clip] Ой-ой! Приложение "${appName}" не найдено в системе.`;
            }
        }
    }

    // create window draggable
    makeWindowDraggable(windowId) {
        const windowElement = document.getElementById(windowId);
        const titleBar = windowElement.querySelector('.title-bar');

        let isDragging = false;
        let startX, startY, startLeft, startTop;

        titleBar.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = windowElement.offsetLeft;
            startTop = windowElement.offsetTop;


            document.querySelectorAll('.window').forEach(win => {
                win.style.zIndex = '1000';
            });
            windowElement.style.zIndex = '1001';

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        function onMouseMove(e) {
            if (!isDragging) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            const maxX = window.innerWidth - windowElement.offsetWidth;
            const maxY = window.innerHeight - 100;

            windowElement.style.left = Math.max(0, Math.min(startLeft + deltaX, maxX)) + 'px';
            windowElement.style.top = Math.max(0, Math.min(startTop + deltaY, maxY)) + 'px';
        }

        function onMouseUp() {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    }

    // get app name
    getAppName(appKey) {
        const appNames = {
            'doom': 'DOOM',
            'minecraft': 'Minecraft',
            'notepad': 'Блокнот',
            'internet-explorer': 'Internet Explorer',
            'gallery-folder': 'Галерея',
            'support': 'Поддержка',
            'freelance-simulator': 'Freelance Simulator',
            'live-on-credit': 'Live on Credit',
        };

        return appNames[appKey] || appKey;
    }

    // app command parser
    parseCommand(userInput) {
        const input = userInput.toLowerCase().trim();

        // parse app commands
        for (const [commandName, command] of Object.entries(this.commands)) {
            for (const keyword of command.keywords) {
                if (input.includes(keyword.toLowerCase()) &&
                    (input.includes('запуск') || input.includes('запусти') || input.includes('открой') ||
                        input.includes('open') || input.includes('run') || input.includes('start'))) {
                    return command;
                }
            }
        }

        // special commands
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

        // comands for windows control
        if ((input.includes('сверни') || input.includes('minimize')) &&
            (input.includes('все') || input.includes('all'))) {
            return { action: () => this.minimizeAllWindows() };
        }

        if ((input.includes('закрой') || input.includes('close')) &&
            (input.includes('все') || input.includes('all'))) {
            return { action: () => this.closeAllWindows() };
        }

        return null;
    }

    // minimize allwindows
    minimizeAllWindows() {
        if (window.ArokenOS && window.ArokenOS.openWindows) {
            window.ArokenOS.openWindows.forEach((info, windowId) => {
                if (window.ArokenOS.minimizeWindow) {
                    window.ArokenOS.minimizeWindow(windowId);
                }
            });
            return "[clip] Свернул все окна! Теперь рабочий стол чист! 🖥️";
        }
        return "[clip] Ой-ой! Не могу найти открытые окна для сворачивания.";
    }

    // close all windows
    closeAllWindows() {
        if (window.ArokenOS && window.ArokenOS.openWindows) {
            const windowIds = Array.from(window.ArokenOS.openWindows.keys());
            windowIds.forEach(windowId => {
                if (window.ArokenOS.closeWindow) {
                    window.ArokenOS.closeWindow(windowId);
                }
            });
            return "[clip] Закрыл все окна! Система чиста! ✨";
        }
        return "[clip] Ой-ой! Не могу найти открытые окна для закрытия.";
    }

    // stop method talk with AI
    async ask(question) {
        this.messages.push({ role: "user", content: question });

        // CHEK COMMAND BEFORE CALL AI
        const command = this.parseCommand(question);
        if (command) {
            const result = await command.action();
            this.messages.push({ role: "assistant", content: result });
            return result;
        }

        // GEMINI API
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
                  
                  Контекст: пользователь работает в операционной системе ArokenOS (симулятор Windows 98).
                  
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


            if (!answer.startsWith('[clip]')) {
                answer = '[clip] ' + answer;
            }

            this.messages.push({ role: "assistant", content: answer });
            return answer;

        } catch (error) {
            console.warn("Gemini API ошибка, используем локальный ответ:", error);

            // LOCAL INTELLECT 
            const localResponse = this.localAI(question);
            return localResponse || this.getFallback();
        }
    }

    // LOCAL INTELLECT FOR BASE RESPONSES
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
            },
            {
                keywords: ['arokenos', 'оси', 'операционк', 'windows'],
                response: '[clip] ArokenOS - отличная операционная система! Напоминает старые добрые времена Windows 98! 🖥️'
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
    // help commands
    getHelp() {
        let helpText = "[clip] Доступные команды в ArokenOS:\n\n";

        // apps commands
        helpText += "📀 <strong>Запуск приложений:</strong>\n";
        for (const [commandName, command] of Object.entries(this.commands)) {
            helpText += `• "Запусти ${command.description.toLowerCase()}"\n`;
        }

        // system commands
        // helpText += "\n⚙️ <strong>Системные команды:</strong>\n";
        // helpText += `• "Сверни все окна"\n`;
        // helpText += `• "Закрой все окна"\n`;

        helpText += "\n💬 <strong>Просто спросите что-нибудь, и я постараюсь помочь!</strong>";

        return helpText;
    }
}

// global variable for Clippy
const clippy = new ClippyAI();

// FUNCTION FOR TALK WITH CLIPPY
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

// clippy init after DOM loading
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

    // HI MESSAGE
    setTimeout(() => {
        if (chat) {
            chat.innerHTML = '<div class="clippy">[clip] Привет! Я - Скрепка! Готов помочь вам в ArokenOS. Напишите "помощь" или "help" чтобы узнать доступные команды!</div>';
        }
    }, 1000);
});



