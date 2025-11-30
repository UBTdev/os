// Управление меню Пуск
let startMenuOpen = false;

function toggleStartMenu() {
  const startMenu = document.getElementById('startMenu');
  const startBtn = document.querySelector('.start-btn');

  if (startMenuOpen) {
    startMenu.classList.remove('active');
    startBtn.classList.remove('active');
    startMenuOpen = false;
  } else {
    startMenu.classList.add('active');
    startBtn.classList.add('active');
    startMenuOpen = true;
  }
}

// Закрытие меню при клике вне его
document.addEventListener('click', function (event) {

  const startMenu = document.getElementById('startMenu');
  const startBtn = document.querySelector('.start-btn');
  if (startMenuOpen &&
    !startMenu.contains(event.target) &&
    !startBtn.contains(event.target)) {
    startMenu.classList.remove('active');
    startBtn.classList.remove('active');
    startMenuOpen = false;
  }
});

const rebootBtn = document.getElementById('reboot-btn');
rebootBtn.addEventListener('click', function () {
  document.body.classList.add('loading-cursor');
  setTimeout(() => {
    localStorage.clear();
    window.location.reload(true);
  }, 5000);
})

const shutdownBtn = document.getElementById('shutdown-btn');
shutdownBtn.addEventListener('click', function () {
  document.body.classList.add('loading-cursor');
  setTimeout(() => {
    window.location.href = 'shutdown.html';
  }, 5000);
})
