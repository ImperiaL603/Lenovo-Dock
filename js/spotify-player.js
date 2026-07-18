/* ============================================================
   Spotify live data — polls the Web API every 4s and renders the
   current track into Spotify mode. Reports playback state to a
   callback so script.js can drive mode switching.

   Requires a connected session (window.SpotifyAuth). Derived data
   (playlist name, queue) is refetched only when its key changes,
   to keep API traffic low on the weak tablet hardware.
   ============================================================ */
(function () {
  'use strict';

  const POLL_MS = 4000;
  const API = 'https://api.spotify.com/v1';

  const modeSection = document.getElementById('spotify-mode');
  const albumArtImg = document.getElementById('album-art-img');
  const spotifyBgImg = document.getElementById('spotify-bg-img');
  const songNameEl = document.getElementById('song-name');
  const artistNamesEl = document.getElementById('artist-names');
  const progressFill = document.getElementById('progress-fill');
  const elapsedEl = document.getElementById('progress-elapsed');
  const totalEl = document.getElementById('progress-total');
  const playlistNameEl = document.getElementById('playlist-name');
  const upNextEl = document.getElementById('up-next');
  const upNextTrackEl = document.getElementById('up-next-track');

  // Local progress animation + change-detection state.
  let progressBaseMs = 0;
  let durationMs = 1;
  let baseTimestamp = 0;
  let playing = false;
  let currentTrackId = null;
  let currentContextUri = null;
  let onPlaybackState = () => {};

  // TEMP debug readout — remove once polling is confirmed working.
  const debugEl = document.createElement('div');
  debugEl.style.cssText =
    'position:fixed;top:8px;left:8px;z-index:99;font:12px monospace;color:#0f0;' +
    'background:rgba(0,0,0,.75);padding:6px 8px;white-space:pre-wrap;max-width:70vw;';
  document.body.appendChild(debugEl);
  const debug = (msg) => { debugEl.textContent = 'SPOTIFY: ' + msg; };

  async function api(path) {
    const token = await SpotifyAuth.getAccessToken();
    if (!token) return null;
    const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 204 || res.status === 202) return null; // nothing playing / not ready
    if (!res.ok) throw new Error(`Spotify API ${res.status} on ${path}`);
    return res.json();
  }

  function setAlbumArt(url) {
    albumArtImg.src = url || '';
    spotifyBgImg.src = url || '';
    modeSection.classList.toggle('has-art', Boolean(url));
  }

  function formatTime(ms) {
    const total = Math.max(0, Math.round(ms / 1000));
    return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, '0')}`;
  }

  function renderTrack(item) {
    songNameEl.textContent = item.name;
    artistNamesEl.textContent = item.artists.map((a) => a.name).join(', ');
    setAlbumArt(item.album?.images?.[0]?.url || '');
    durationMs = item.duration_ms || 1;
    totalEl.textContent = formatTime(durationMs);
  }

  function renderProgress() {
    const elapsed = playing ? progressBaseMs + (Date.now() - baseTimestamp) : progressBaseMs;
    const clamped = Math.min(elapsed, durationMs);
    progressFill.style.width = `${(clamped / durationMs) * 100}%`;
    elapsedEl.textContent = formatTime(clamped);
  }

  function renderPlaylist(name) {
    playlistNameEl.textContent = name || '';
    playlistNameEl.style.visibility = name ? 'visible' : 'hidden';
  }

  function renderUpNext(track) {
    if (!track) { upNextEl.classList.remove('visible'); return; }
    upNextTrackEl.textContent = `${track.name} · ${track.artists.map((a) => a.name).join(', ')}`;
    upNextEl.classList.add('visible');
  }

  async function updatePlaylist(context) {
    if (!context || context.type !== 'playlist') {
      currentContextUri = null;
      renderPlaylist(null);
      return;
    }
    if (context.uri === currentContextUri) return;
    currentContextUri = context.uri;
    const data = await api(`/playlists/${context.uri.split(':').pop()}?fields=name`);
    renderPlaylist(data?.name);
  }

  async function updateQueue() {
    const data = await api('/me/player/queue');
    renderUpNext(data?.queue?.[0] || null);
  }

  async function poll() {
    if (!SpotifyAuth.isConnected()) return debug('not connected');
    let data;
    try {
      data = await api('/me/player');
    } catch (err) {
      return debug('error — ' + err.message);
    }
    const item = data?.item;
    playing = Boolean(data?.is_playing && item);
    debug(data === null
      ? '204 — no active device / nothing playing'
      : `ok · is_playing=${data.is_playing} · track=${item ? item.name : 'none'}`);

    if (item) {
      if (item.id !== currentTrackId) {
        currentTrackId = item.id;
        renderTrack(item);
        updateQueue().catch(() => {});
      }
      progressBaseMs = data.progress_ms || 0;
      baseTimestamp = Date.now();
      updatePlaylist(data.context).catch(() => {});
    }
    onPlaybackState(playing);
  }

  function start(callback) {
    if (callback) onPlaybackState = callback;
    poll();
    setInterval(poll, POLL_MS);
    setInterval(renderProgress, 1000);
  }

  window.SpotifyPlayer = { start };
})();
