/* ============================================================
   Wallpaper picker — swaps the clock-mode background video and
   remembers the choice in localStorage.

   The name list lives here because GitHub Pages can't list a
   directory. To add a new wallpaper: drop the .mp4 in
   assets/video/ and add its filename to WALLPAPERS below.
   ============================================================ */
(function () {
  'use strict';

  const WALLPAPERS = [
    'azure-horizon.1920x1080.mp4',
    'coffee-shop.1920x1080.mp4',
    'device-armoury-swimsuit-girl.1920x1080.mp4',
    'echoes-in-the-hollow-light.1920x1080.mp4',
    'endless-summer-horizon.1920x1080.mp4',
    'hollow-knight-dark-mirror.1920x1080.mp4',
    'hoshimi-miyabi-grace.1920x1080.mp4',
    'itachi-uchiha-crimson-rainfall.1920x1080.mp4',
    'kaoruko-waguri-dreaming-silence.1920x1080.mp4',
    'lol-ahri.1920x1080.mp4',
    'lucy-and-david-cyberpunk-edgerunners.1920x1080.mp4',
    'moran-nikke.1920x1080.mp4',
    'nikke-mekami-shifty.1920x1080.mp4',
    'osaka-memories-toyota-supra-turbo-a80.1920x1080.mp4',
    'rapi-red-hood-nikke.1920x1080.mp4',
    'rayquaza-flying-in-the-dark-sky.1920x1080.mp4',
    'reze-midnight-reflection.1920x1080.mp4',
    'reze-warm-smile.1920x1080.mp4',
    'selena-garden-elegy.1920x1080.mp4',
    'silent-hill-2.1920x1080.mp4',
    'sin-backstreet-dream.1920x1080.mp4',
    'skyrim-lanscape.1920x1080.mp4',
    'stelle-robin-firefly-honkai-star-rail.1920x1080.mp4',
    'sunset-rx-7.1920x1080.mp4',
    'supra-a80-coastal-chill.1920x1080.mp4',
    'tayamayamada.1920x1080.mp4',
    'unyielding-itachis-sharingan.1920x1080.mp4',
    'viper-lethal-temptation.1920x1080.mp4',
    'yor-forger-midnight-assassin.1920x1080.mp4',
  ];

  // Matches the src hardcoded on #bg-video in index.html (first paint).
  const DEFAULT = 'endless-summer-horizon.1920x1080.mp4';
  const STORAGE_KEY = 'wallpaper';

  const video = document.getElementById('bg-video');
  const body = document.body;

  function displayName(file) {
    return file
      .replace(/\.1920x1080\.mp4$/i, '')
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  const getSaved = () => localStorage.getItem(STORAGE_KEY) || DEFAULT;

  function applyWallpaper(file) {
    localStorage.setItem(STORAGE_KEY, file);
    video.src = `assets/video/${file}`; // forward slashes only — backslashes break loading
    video.load();
    if (body.classList.contains('mode-clock')) video.play();
  }

  function renderPicker(container) {
    const current = getSaved();
    WALLPAPERS.forEach((file) => {
      const chip = document.createElement('button');
      chip.className = 'wallpaper-chip';
      chip.textContent = displayName(file);
      chip.classList.toggle('selected', file === current);
      chip.addEventListener('click', () => {
        applyWallpaper(file);
        container.querySelectorAll('.wallpaper-chip')
          .forEach((c) => c.classList.toggle('selected', c === chip));
      });
      container.appendChild(chip);
    });
  }

  // Restore the saved choice on boot (only if it differs from the HTML default,
  // to avoid a needless video reload on every launch).
  const saved = getSaved();
  if (saved !== DEFAULT) applyWallpaper(saved);

  renderPicker(document.getElementById('wallpaper-grid'));
})();
