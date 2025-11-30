class MusicPlayer {
    static init() {
        this.audio = new Audio();
        this.playlist = [];
        this.currentTrackIndex = 0;
        this.isPlaying = false;

        // Инициализация плейлиста из иконок на рабочем столе
        this.initPlaylist();

        // Обработчики событий для аудио
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.next());

        // Связываем с master volume
        this.syncWithMasterVolume();

        // Сделаем плеер перетаскиваемым
        this.makeDraggable();

        console.log('Music Player initialized with', this.playlist.length, 'tracks');
    }

    static initPlaylist() {
        const musicIcons = document.querySelectorAll('.desktop-icon.music-folder');
        this.playlist = [];

        musicIcons.forEach((icon, index) => {
            const title = icon.querySelector('.icon-title').textContent;
            const audioSrc = `./audio/${title}`;

            this.playlist.push({
                title: title,
                src: audioSrc,
                element: icon
            });

            // Обработчик двойного клика - основной способ запуска
            icon.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                console.log('Двойной клик на трек:', title);
                this.playTrack(index);
                this.show();
                this.highlightIcon(icon);
            });

            // Обработчик одинарного клика для выделения
            icon.addEventListener('click', (e) => {
                if (e.detail === 1) { // Только одинарный клик
                    e.stopPropagation();
                    this.highlightIcon(icon);
                }
            });
        });

        // Снимаем выделение при клике на рабочий стол
        document.querySelector('.desktop').addEventListener('click', (e) => {
            if (e.target.classList.contains('desktop')) {
                this.clearHighlights();
            }
        });
    }

    // Подсветка выбранной иконки
    static highlightIcon(icon) {
        this.clearHighlights();
        // icon.classList.add('selected')
        // icon.style.backgroundColor = 'rgba(0, 0, 255, 0.3)';
        // icon.style.border = '1px dotted navy';
    }

    // Снятие подсветки со всех иконок
    static clearHighlights() {
        document.querySelectorAll('.desktop-icon.music-folder').forEach(icon => {
            icon.style.backgroundColor = '';
            icon.style.border = '';
        });
    }

    static playTrack(index) {
        if (index < 0 || index >= this.playlist.length) {
            console.error('Invalid track index:', index);
            return;
        }

        this.currentTrackIndex = index;
        const track = this.playlist[index];

        console.log('Playing track:', track.title);

        // Останавливаем текущее воспроизведение
        this.audio.pause();

        // Устанавливаем новый трек
        this.audio.src = track.src;
        this.audio.load();

        // Обновляем интерфейс
        document.getElementById('current-track').textContent = track.title.replace('.mp3', '');

        // Применяем текущую громкость из master volume
        const masterVolume = document.getElementById('masterVolume');
        if (masterVolume) {
            this.audio.volume = masterVolume.value;
        }

        // Подсвечиваем выбранную иконку
        this.highlightIcon(track.element);

        // Запускаем воспроизведение
        this.play().then(() => {
            console.log('Track started successfully');
        }).catch(error => {
            console.error('Error playing track:', error);
            // Показываем сообщение об ошибке
            document.getElementById('current-track').textContent = 'Ошибка загрузки: ' + track.title.replace('.mp3', '');
        });
    }

    static play() {
        return this.audio.play().then(() => {
            this.isPlaying = true;
            this.updatePlayButton();
            return true;
        }).catch(error => {
            console.error('Play failed:', error);
            this.isPlaying = false;
            this.updatePlayButton();
            return false;
        });
    }

    // Остальные методы без изменений...
    static syncWithMasterVolume() {
        const masterVolume = document.getElementById('masterVolume');
        if (masterVolume) {
            this.setVolume(masterVolume.value);

            masterVolume.addEventListener('input', (e) => {
                this.setVolume(e.target.value);
            });
        }

        this.addToGlobalVolumeControl();
    }

    static addToGlobalVolumeControl() {
        const updatePlayerVolume = () => {
            const masterVolume = document.getElementById('masterVolume');
            if (masterVolume && this.audio) {
                this.audio.volume = masterVolume.value;
            }
        };

        const masterVolume = document.getElementById('masterVolume');
        if (masterVolume) {
            masterVolume.addEventListener('input', updatePlayerVolume);
        }

        if (masterVolume) {
            masterVolume.addEventListener('input', (e) => {
                const volumeSlider = document.getElementById('volume-slider');
                if (volumeSlider) {
                    volumeSlider.value = e.target.value;
                }
            });
        }
    }

    static setVolume(volume) {
        if (this.audio) {
            this.audio.volume = volume / 100;
        }

        const masterVolume = document.getElementById('masterVolume');
        if (masterVolume && masterVolume.value !== volume) {
            masterVolume.value = volume;
            masterVolume.dispatchEvent(new Event('input'));
            localStorage.setItem('masterVolume', volume);
        }

        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider && volumeSlider.value !== volume) {
            volumeSlider.value = volume;
        }
    }

    static pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updatePlayButton();
    }

    static playPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    static next() {
        let nextIndex = this.currentTrackIndex + 1;
        if (nextIndex >= this.playlist.length) {
            nextIndex = 0;
        }
        this.playTrack(nextIndex);
    }

    static previous() {
        let prevIndex = this.currentTrackIndex - 1;
        if (prevIndex < 0) {
            prevIndex = this.playlist.length - 1;
        }
        this.playTrack(prevIndex);
    }

    static seek(progress) {
        const duration = this.audio.duration;
        if (duration) {
            this.audio.currentTime = (progress / 100) * duration;
        }
    }

    static updateProgress() {
        const progressBar = document.getElementById('progress-bar');
        const timeDisplay = document.getElementById('track-time');

        if (this.audio.duration) {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            progressBar.value = progress;

            const currentTime = this.formatTime(this.audio.currentTime);
            const duration = this.formatTime(this.audio.duration);
            timeDisplay.textContent = `${currentTime} / ${duration}`;
        }
    }

    static updateDuration() {
        const progressBar = document.getElementById('progress-bar');
        progressBar.value = 0;
    }

    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    static updatePlayButton() {
        // Можно добавить смену иконки play/pause если нужно
        const playBtn = document.querySelector('.music-player__btn:nth-child(2)');
        if (playBtn) {
            playBtn.innerHTML = this.isPlaying ? '<div class="play-icon pause"></div>' : '<div class="play-icon play"></div>';
        }
    }

    static show() {
        const player = document.getElementById('music-player');
        player.classList.add('show');

        // Позиционируем плеер рядом с иконкой если возможно
        this.positionNearCurrentTrack();
    }

    // Позиционирование плеера рядом с текущей иконкой
    static positionNearCurrentTrack() {
        if (this.currentTrackIndex >= 0 && this.currentTrackIndex < this.playlist.length) {
            const currentIcon = this.playlist[this.currentTrackIndex].element;
            const iconRect = currentIcon.getBoundingClientRect();
            const player = document.getElementById('music-player');

            // Позиционируем плеер справа от иконки
            player.style.left = (iconRect.right + 10) + 'px';
            player.style.top = (iconRect.top) + 'px';
            player.style.right = 'auto';
            player.style.bottom = 'auto';
        }
    }

    static close() {
        this.pause();
        document.getElementById('music-player').classList.remove('show');
        this.clearHighlights();
    }

    static makeDraggable() {
        const player = document.getElementById('music-player');
        const header = player.querySelector('.music-player__header');

        let isDragging = false;
        let startX, startY, startLeft, startTop;

        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = player.offsetLeft;
            startTop = player.offsetTop;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        const onMouseMove = (e) => {
            if (!isDragging) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            const maxX = window.innerWidth - player.offsetWidth;
            const maxY = window.innerHeight - player.offsetHeight;

            player.style.left = Math.max(0, Math.min(startLeft + deltaX, maxX)) + 'px';
            player.style.top = Math.max(0, Math.min(startTop + deltaY, maxY)) + 'px';
            player.style.right = 'auto';
            player.style.bottom = 'auto';
        };

        const onMouseUp = () => {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }
}

// Инициализация плеера после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    MusicPlayer.init();
});

// Также можно добавить глобальную функцию для ручного запуска трека
window.playMusicTrack = function (trackName) {
    const musicIcons = document.querySelectorAll('.desktop-icon.music-folder');
    musicIcons.forEach((icon, index) => {
        const title = icon.querySelector('.icon-title').textContent;
        if (title.includes(trackName)) {
            MusicPlayer.playTrack(index);
            MusicPlayer.show();
            return;
        }
    });
};