/* ============================================================
   Spotify auth — Authorization Code with PKCE.
   No client secret, no server: the refresh token lives ONLY in
   this device's localStorage. Client ID is public and safe to commit.

   Public surface (window.SpotifyAuth):
     beginLogin()      -> redirect to Spotify login
     handleCallback()  -> exchange the returned code for tokens (callback.html)
     getAccessToken()  -> a valid access token, refreshing if needed (or null)
     isConnected()     -> has a stored refresh token
     disconnect()      -> forget all tokens
   ============================================================ */
(function () {
  'use strict';

  const CLIENT_ID = 'e453adc9658d47ba9b2f6b142488ca93';
  const REDIRECT_URI = 'https://imperial603.github.io/Lenovo-Dock/callback.html';
  const SCOPES = 'user-read-currently-playing user-read-playback-state';
  const AUTH_URL = 'https://accounts.spotify.com/authorize';
  const TOKEN_URL = 'https://accounts.spotify.com/api/token';

  const KEYS = {
    access: 'sp_access_token',
    refresh: 'sp_refresh_token',
    expires: 'sp_expires_at',
    verifier: 'sp_code_verifier',
  };

  // ---- single persistence primitive: every token field flows through here ----
  const store = {
    get: (k) => localStorage.getItem(k),
    set: (k, v) => localStorage.setItem(k, v),
    remove: (k) => localStorage.removeItem(k),
  };

  // ---- PKCE crypto helpers ----
  function randomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(bytes, (b) => chars[b % chars.length]).join('');
  }

  async function sha256(plain) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain));
  }

  function base64url(buffer) {
    let str = '';
    for (const b of new Uint8Array(buffer)) str += String.fromCharCode(b);
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  // ---- token lifecycle ----
  async function beginLogin() {
    const verifier = randomString(64);
    store.set(KEYS.verifier, verifier);
    const challenge = base64url(await sha256(verifier));
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      code_challenge_method: 'S256',
      code_challenge: challenge,
    });
    window.location.href = `${AUTH_URL}?${params}`;
  }

  async function requestTokens(body) {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body),
    });
    if (!res.ok) throw new Error(`Spotify token request failed (${res.status})`);
    return res.json();
  }

  function saveTokens(data) {
    store.set(KEYS.access, data.access_token);
    store.set(KEYS.expires, String(Date.now() + data.expires_in * 1000));
    // Spotify only returns a new refresh_token sometimes; keep the old one otherwise.
    if (data.refresh_token) store.set(KEYS.refresh, data.refresh_token);
  }

  async function handleCallback() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) throw new Error(params.get('error'));
    const code = params.get('code');
    const verifier = store.get(KEYS.verifier);
    if (!code || !verifier) throw new Error('Missing authorization code or verifier');
    saveTokens(await requestTokens({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      code_verifier: verifier,
    }));
    store.remove(KEYS.verifier);
  }

  async function refreshAccessToken() {
    const data = await requestTokens({
      grant_type: 'refresh_token',
      refresh_token: store.get(KEYS.refresh),
      client_id: CLIENT_ID,
    });
    saveTokens(data);
    return data.access_token;
  }

  async function getAccessToken() {
    if (!store.get(KEYS.refresh)) return null;
    const token = store.get(KEYS.access);
    const expiresAt = Number(store.get(KEYS.expires) || 0);
    if (token && Date.now() < expiresAt - 60000) return token;
    return refreshAccessToken();
  }

  const isConnected = () => Boolean(store.get(KEYS.refresh));
  const disconnect = () => Object.values(KEYS).forEach(store.remove);

  window.SpotifyAuth = { beginLogin, handleCallback, getAccessToken, isConnected, disconnect };
})();
