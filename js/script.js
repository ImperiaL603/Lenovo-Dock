/* ============================================================
   PHASE 1: static layout only.
   Real Spotify auth, polling, lrclib sync, and alarm/timer logic
   will replace the placeholder bits marked "TODO" below.
   ============================================================ */

// ---------- Clock ----------
const dayEl = document.getElementById('clock-day');
const dateEl = document.getElementById('clock-date');
const hmEl = document.getElementById('clock-hm');
const ampmEl = document.getElementById('clock-ampm');

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

function updateClock() {
  const now = new Date();

  dayEl.textContent = DAYS[now.getDay()];
  dateEl.textContent = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;

  hmEl.textContent = `${hours}:${minutes}`;
  ampmEl.textContent = ampm;
}

updateClock();
setInterval(updateClock, 1000);

// ---------- Alarms / Timers panel toggle ----------
const clockMode = document.getElementById('clock-mode');
const addBtn = document.getElementById('add-btn');

addBtn.addEventListener('click', () => {
  clockMode.classList.toggle('panel-open');
  // TODO: once open, a second tap on this button (now rotated into an "x")
  // should eventually open a small form to create a new alarm/timer.
});

// ---------- Mode switching ----------
const modes = {
  clock: document.getElementById('clock-mode'),
  spotify: document.getElementById('spotify-mode'),
};

const bgVideo = document.getElementById('bg-video');
setMode('clock');

function setMode(name) {
  Object.values(modes).forEach(el => el.classList.remove('active'));
  modes[name].classList.add('active');

  document.body.classList.toggle('mode-clock', name === 'clock');

  if (name === 'clock') {
    bgVideo.play();
  } else {
    bgVideo.pause(); // saves CPU/GPU while hidden behind Spotify mode
  }
}

// TODO: replace with real detection — switch to 'spotify' when the 4s poll
// reports active playback, and back to 'clock' after N seconds of no playback.
let currentMode = 'clock';
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'm') {
    currentMode = currentMode === 'clock' ? 'spotify' : 'clock';
    setMode(currentMode);
  }
});

// ---------- Lyrics line preview animation (placeholder only) ----------
// Just cycles through some dummy lines so we can see/tune the spring motion.
// Will be replaced by real lrclib-synced lines driven by the playback timer.
const dummyLyrics = [
  'Previous line goes here',
  'Lyrics Window',
  'Next line goes here',
  'Another line after that',
  'And one more after this one',
];

const prevEl = document.getElementById('lyric-prev');
const currentEl = document.getElementById('lyric-current');
const nextEl = document.getElementById('lyric-next');

let lyricIndex = 1; // start so "current" = dummyLyrics[1]

function renderLyrics() {
  prevEl.textContent = dummyLyrics[lyricIndex - 1] ?? '';
  currentEl.textContent = dummyLyrics[lyricIndex] ?? '';
  nextEl.textContent = dummyLyrics[lyricIndex + 1] ?? '';
}

renderLyrics();

setInterval(() => {
  lyricIndex = (lyricIndex + 1) % dummyLyrics.length;
  renderLyrics();
}, 3500);

// ---------- Settings panel toggle ----------
const settingsBtn = document.getElementById('settings-btn');

settingsBtn.addEventListener('click', () => {
  document.body.classList.toggle('settings-open');
});