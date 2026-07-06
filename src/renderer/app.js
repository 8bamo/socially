/* global CATALOG */
'use strict';

const serviceList = document.getElementById('service-list');
const viewsEl = document.getElementById('views');
const welcomeEl = document.getElementById('welcome');
const addDialog = document.getElementById('add-dialog');
const catalogGrid = document.getElementById('catalog-grid');
const ctxMenu = document.getElementById('ctx-menu');
const settingsOverlay = document.getElementById('settings-overlay');
const lockScreen = document.getElementById('lock-screen');

const DEFAULT_SETTINGS = {
  theme: 'dark',            // dark | light | system
  navPosition: 'left',      // left | bottom
  notifications: true,
  autostart: false,
  privacy: { enabled: false, salt: '', hash: '' }
};

// Benachrichtigungstöne (per Web Audio erzeugt, keine Dateien nötig)
const SOUNDS = [
  ['ding', '🔔 Ding'],
  ['pop', '💬 Pop'],
  ['glocke', '🛎 Glocke'],
  ['chime', '🎐 Chime'],
  ['trill', '🎵 Trill'],
  ['none', '🔇 Kein Ton']
];

let config = { services: [], settings: structuredClone(DEFAULT_SETTINGS) };
let userAgent = navigator.userAgent;
let activeId = null;
let ctxTargetId = null;
const unread = {}; // serviceId -> Anzahl ungelesener Nachrichten

// ------------------------------ Hilfsfunktionen -----------------------------

const uid = () => 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const partitionOf = (service) => `persist:socially-${service.id}`;
const svcById = (id) => config.services.find((s) => s.id === id);

function colorFor(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `hsl(${h}, 62%, 48%)`;
}

async function persist() {
  await window.socially.saveConfig(config);
}

// Original-Markenlogo als weißes SVG auf der farbigen Kachel;
// Fallback auf den Anfangsbuchstaben, wenn kein Logo gebündelt ist.
/* global ICONS */
function iconNode(iconSlug, letter) {
  const d = typeof ICONS !== 'undefined' ? ICONS[iconSlug] : null;
  if (!d) return document.createTextNode(letter || '?');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.classList.add('brand-icon');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', '#fff');
  svg.appendChild(path);
  return svg;
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const randomSalt = () =>
  [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('');

// --------------------------- Benachrichtigungstöne --------------------------

let audioCtx;
function playSound(preset) {
  if (!preset || preset === 'none') return;
  audioCtx = audioCtx || new AudioContext();
  const t = audioCtx.currentTime;
  const note = (freq, start, dur, type = 'sine', vol = 0.22) => {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t + start);
    g.gain.linearRampToValueAtTime(vol, t + start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + start + dur);
    o.connect(g).connect(audioCtx.destination);
    o.start(t + start);
    o.stop(t + start + dur + 0.05);
  };
  switch (preset) {
    case 'ding':   note(880, 0, 0.4); break;
    case 'pop':    note(520, 0, 0.09, 'square', 0.12); note(380, 0.07, 0.1, 'square', 0.1); break;
    case 'glocke': note(660, 0, 0.6, 'triangle'); note(1320, 0, 0.45, 'sine', 0.1); break;
    case 'chime':  note(659, 0, 0.28); note(880, 0.16, 0.4); break;
    case 'trill':  note(740, 0, 0.09); note(932, 0.1, 0.09); note(1175, 0.2, 0.24); break;
  }
}

function notifyIncoming(svc) {
  if (config.settings.notifications === false) return;
  if (svc.muted) return;
  playSound(svc.sound || 'ding');
}

// -------------------------- Ungelesen-Badges --------------------------------

// Generische Erkennung: Web-Apps schreiben ungelesene Nachrichten in den
// Seitentitel, z. B. "(3) WhatsApp". Daraus speisen sich die Badges.
function updateUnreadFromTitle(svc, title) {
  const m = /\((\d+)\)/.exec(title || '');
  const count = m ? parseInt(m[1], 10) : 0;
  const prev = unread[svc.id] || 0;
  unread[svc.id] = count;
  if (count > prev) notifyIncoming(svc);
  if (count !== prev) renderBadges();
}

function renderBadges() {
  for (const btn of serviceList.querySelectorAll('.service-btn')) {
    const count = unread[btn.dataset.id] || 0;
    let badge = btn.querySelector('.badge');
    if (count > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'badge';
        btn.appendChild(badge);
      }
      badge.textContent = count > 99 ? '99+' : String(count);
    } else {
      badge?.remove();
    }
  }
}

// ------------------------------- Rendering ---------------------------------

function render() {
  serviceList.innerHTML = '';
  for (const svc of config.services) {
    const btn = document.createElement('button');
    btn.className = 'service-btn'
      + (svc.id === activeId ? ' active' : '')
      + (svc.muted ? ' muted' : '');
    btn.dataset.id = svc.id;
    btn.style.background = svc.color;
    btn.appendChild(iconNode(svc.icon, svc.letter));
    btn.title = svc.name + (svc.muted ? ' (stumm)' : '');
    if (svc.muted) {
      const mb = document.createElement('span');
      mb.className = 'mute-badge';
      mb.textContent = '🔕';
      btn.appendChild(mb);
    }
    btn.addEventListener('click', () => activate(svc.id));
    btn.addEventListener('contextmenu', (e) => openCtxMenu(e, svc.id));
    serviceList.appendChild(btn);
  }
  renderBadges();

  const hasActive = activeId !== null;
  welcomeEl.style.display = hasActive ? 'none' : 'flex';
  viewsEl.classList.toggle('visible', hasActive);

  document.getElementById('svc-count').textContent = config.services.length || '';
  renderServiceCards();
}

function ensureWebview(svc) {
  let wv = document.getElementById('wv-' + svc.id);
  if (wv) return wv;

  wv = document.createElement('webview');
  wv.id = 'wv-' + svc.id;
  // Datenschutz-Kern: eigene persistente Partition pro Dienst –
  // Cookies, LocalStorage & Cache sind strikt voneinander getrennt.
  wv.setAttribute('partition', partitionOf(svc));
  wv.setAttribute('useragent', userAgent);
  // Nötig, damit window.open/target=_blank den setWindowOpenHandler im
  // Hauptprozess erreicht – dort wird es abgefangen und im Browser geöffnet.
  wv.setAttribute('allowpopups', '');
  wv.setAttribute('src', svc.url);
  wv.addEventListener('dom-ready', () => wv.setAudioMuted(!!svc.muted));
  wv.addEventListener('page-title-updated', (e) => updateUnreadFromTitle(svc, e.title));
  viewsEl.appendChild(wv);
  return wv;
}

function activate(id) {
  const svc = svcById(id);
  if (!svc) return;
  activeId = id;
  ensureWebview(svc);
  for (const wv of viewsEl.querySelectorAll('webview')) {
    wv.classList.toggle('active', wv.id === 'wv-' + id);
  }
  render();
}

// --------------------------- Dienst hinzufügen -----------------------------

function addService({ name, url, color, letter, icon }) {
  const svc = {
    id: uid(),
    name,
    url,
    color: color || colorFor(name),
    letter: letter || name.trim().charAt(0).toUpperCase() || '?',
    icon: icon || null,
    muted: document.getElementById('add-muted').checked,
    sound: 'ding'
  };
  config.services.push(svc);
  persist();
  activate(svc.id);
  addDialog.close();
}

function buildCatalog() {
  catalogGrid.innerHTML = '';
  for (const item of CATALOG) {
    const btn = document.createElement('button');
    btn.className = 'catalog-item';
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.background = item.color;
    dot.appendChild(iconNode(item.icon, item.letter));
    const label = document.createElement('span');
    label.textContent = item.name;
    btn.append(dot, label);
    btn.addEventListener('click', () => addService(item));
    catalogGrid.appendChild(btn);
  }
}

function openAddDialog() {
  document.getElementById('add-muted').checked = false;
  addDialog.showModal();
}

document.getElementById('add-btn').addEventListener('click', openAddDialog);
document.getElementById('settings-add-btn').addEventListener('click', openAddDialog);
document.getElementById('add-cancel').addEventListener('click', () => addDialog.close());

document.getElementById('custom-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('custom-name').value.trim();
  const url = document.getElementById('custom-url').value.trim();
  if (!name || !url) return;
  addService({ name, url });
  e.target.reset();
});

// --------------------------- Dienst-Aktionen -------------------------------

async function toggleMute(svc) {
  svc.muted = !svc.muted;
  const wv = document.getElementById('wv-' + svc.id);
  try { wv?.setAudioMuted(svc.muted); } catch { /* Webview evtl. noch nicht bereit */ }
  await persist(); // Hauptprozess wertet muted für Benachrichtigungen aus
  render();
}

async function clearService(svc) {
  if (!confirm(`Alle lokalen Daten von "${svc.name}" löschen? Du wirst dort abgemeldet.`)) return;
  await window.socially.clearServiceData(partitionOf(svc));
  document.getElementById('wv-' + svc.id)?.reload();
}

async function removeService(svc) {
  if (!confirm(`"${svc.name}" entfernen? Alle zugehörigen Daten werden gelöscht.`)) return;
  await window.socially.clearServiceData(partitionOf(svc));
  document.getElementById('wv-' + svc.id)?.remove();
  config.services = config.services.filter((s) => s.id !== svc.id);
  delete unread[svc.id];
  if (activeId === svc.id) activeId = config.services[0]?.id ?? null;
  if (activeId) activate(activeId);
  await persist();
  render();
}

// ------------------------------ Kontextmenü --------------------------------

function openCtxMenu(e, id) {
  e.preventDefault();
  ctxTargetId = id;
  const svc = svcById(id);
  document.getElementById('ctx-mute').textContent =
    svc?.muted ? '🔔 Stummschaltung aufheben' : '🔕 Stummschalten';
  ctxMenu.hidden = false;
  const { innerWidth: w, innerHeight: h } = window;
  ctxMenu.style.left = Math.min(e.clientX, w - ctxMenu.offsetWidth - 8) + 'px';
  ctxMenu.style.top = Math.min(e.clientY, h - ctxMenu.offsetHeight - 8) + 'px';
}

document.addEventListener('click', () => { ctxMenu.hidden = true; });

ctxMenu.addEventListener('click', async (e) => {
  const action = e.target.dataset?.action;
  const svc = svcById(ctxTargetId);
  ctxMenu.hidden = true;
  if (!action || !svc) return;
  if (action === 'reload') document.getElementById('wv-' + svc.id)?.reload();
  if (action === 'mute') await toggleMute(svc);
  if (action === 'clear') await clearService(svc);
  if (action === 'remove') await removeService(svc);
});

// ---------------------- Einstellungen: Dienste-Karten ----------------------

function renderServiceCards() {
  const wrap = document.getElementById('service-cards');
  wrap.innerHTML = '';
  if (config.services.length === 0) {
    wrap.innerHTML = '<p class="setting-hint">Noch keine Dienste – füge oben deinen ersten hinzu.</p>';
    return;
  }
  for (const svc of config.services) {
    const card = document.createElement('div');
    card.className = 'svc-card';

    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.background = svc.color;
    dot.appendChild(iconNode(svc.icon, svc.letter));

    const info = document.createElement('div');
    info.className = 'info';
    info.innerHTML = `<div class="name"></div><div class="url"></div>`;
    info.querySelector('.name').textContent = svc.name;
    info.querySelector('.url').textContent = svc.url;

    const sound = document.createElement('select');
    sound.title = 'Benachrichtigungston';
    for (const [value, label] of SOUNDS) {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = label;
      opt.selected = (svc.sound || 'ding') === value;
      sound.appendChild(opt);
    }
    sound.addEventListener('change', async () => {
      svc.sound = sound.value;
      playSound(sound.value); // Vorschau
      await persist();
    });

    const muteBtn = document.createElement('button');
    muteBtn.className = 'icon-btn';
    muteBtn.textContent = svc.muted ? '🔕' : '🔔';
    muteBtn.title = svc.muted ? 'Stummschaltung aufheben' : 'Stummschalten';
    muteBtn.addEventListener('click', () => toggleMute(svc));

    const clearBtn = document.createElement('button');
    clearBtn.className = 'icon-btn';
    clearBtn.textContent = '🧹';
    clearBtn.title = 'Daten löschen';
    clearBtn.addEventListener('click', () => clearService(svc));

    const removeBtn = document.createElement('button');
    removeBtn.className = 'icon-btn danger';
    removeBtn.textContent = '🗑';
    removeBtn.title = 'Dienst entfernen';
    removeBtn.addEventListener('click', () => removeService(svc));

    card.append(dot, info, sound, muteBtn, clearBtn, removeBtn);
    wrap.appendChild(card);
  }
}

// --------------------------- Einstellungen-Overlay -------------------------

function openSettings() {
  settingsOverlay.hidden = false;
  renderServiceCards();
}
function closeSettings() { settingsOverlay.hidden = true; }

document.getElementById('settings-btn').addEventListener('click', openSettings);
document.getElementById('settings-close').addEventListener('click', closeSettings);
settingsOverlay.addEventListener('click', (e) => {
  if (e.target === settingsOverlay) closeSettings();
});

for (const item of document.querySelectorAll('#settings-nav .nav-item')) {
  item.addEventListener('click', () => {
    document.querySelectorAll('#settings-nav .nav-item').forEach((n) => n.classList.remove('active'));
    document.querySelectorAll('#settings-content section').forEach((s) => s.classList.remove('active'));
    item.classList.add('active');
    document.querySelector(`#settings-content section[data-section="${item.dataset.section}"]`).classList.add('active');
  });
}

// ------------------------------ Darstellung --------------------------------

const systemDark = matchMedia('(prefers-color-scheme: dark)');

function applyAppearance() {
  const s = config.settings;
  const dark = s.theme === 'dark' || (s.theme === 'system' && systemDark.matches);
  document.body.classList.toggle('light', !dark);
  document.body.classList.toggle('nav-bottom', s.navPosition === 'bottom');
  for (const r of document.querySelectorAll('input[name="theme"]')) r.checked = r.value === s.theme;
  for (const r of document.querySelectorAll('input[name="nav-pos"]')) r.checked = r.value === s.navPosition;
  document.getElementById('set-notifications').checked = s.notifications !== false;
  document.getElementById('set-autostart').checked = !!s.autostart;
}

systemDark.addEventListener('change', () => {
  if (config.settings.theme === 'system') applyAppearance();
});

for (const radio of document.querySelectorAll('input[name="theme"]')) {
  radio.addEventListener('change', async () => {
    config.settings.theme = radio.value;
    applyAppearance();
    await persist();
  });
}

for (const radio of document.querySelectorAll('input[name="nav-pos"]')) {
  radio.addEventListener('change', async () => {
    config.settings.navPosition = radio.value;
    applyAppearance();
    await persist();
  });
}

document.getElementById('set-notifications').addEventListener('change', async (e) => {
  config.settings.notifications = e.target.checked;
  await persist(); // Hauptprozess blockiert Benachrichtigungs-Berechtigungen sofort
});

document.getElementById('set-autostart').addEventListener('change', async (e) => {
  config.settings.autostart = e.target.checked;
  const applied = await window.socially.setAutostart(e.target.checked);
  e.target.checked = applied;
  config.settings.autostart = applied;
  await persist();
});

// --------------------------- Privacy Mode (Sperre) --------------------------

const privacyToggle = document.getElementById('set-privacy');
const privacySetup = document.getElementById('privacy-setup');
const privacyDisable = document.getElementById('privacy-disable');
const privacyActive = document.getElementById('privacy-active');
const pwError = document.getElementById('pw-error');

function refreshPrivacyUI() {
  const p = config.settings.privacy;
  privacyToggle.checked = !!p.enabled;
  privacySetup.hidden = true;
  privacyDisable.hidden = true;
  privacyActive.hidden = !p.enabled;
  pwError.hidden = true;
  document.getElementById('lock-btn').hidden = !p.enabled;
}

privacyToggle.addEventListener('change', () => {
  const p = config.settings.privacy;
  if (privacyToggle.checked && !p.enabled) {
    // Aktivieren: Passwort-Formular zeigen (erst nach Speichern aktiv)
    privacySetup.hidden = false;
    privacyDisable.hidden = true;
    privacyActive.hidden = true;
  } else if (!privacyToggle.checked && p.enabled) {
    // Deaktivieren nur mit korrektem Passwort – bis dahin bleibt der Haken an
    privacyToggle.checked = true;
    privacyDisable.hidden = false;
    document.getElementById('pw-disable').focus();
  } else {
    refreshPrivacyUI();
  }
});

document.getElementById('pw-disable-btn').addEventListener('click', async () => {
  const p = config.settings.privacy;
  const input = document.getElementById('pw-disable');
  if ((await sha256Hex(p.salt + ':' + input.value)) === p.hash) {
    config.settings.privacy = { enabled: false, salt: '', hash: '' };
    await persist();
    input.value = '';
    refreshPrivacyUI();
  } else {
    document.getElementById('pw-disable-error').hidden = false;
    input.select();
  }
});

document.getElementById('pw-save').addEventListener('click', async () => {
  const pw = document.getElementById('pw-new').value;
  const confirmPw = document.getElementById('pw-confirm').value;
  if (pw.length < 4) {
    pwError.textContent = 'Das Passwort muss mindestens 4 Zeichen haben.';
    pwError.hidden = false;
    return;
  }
  if (pw !== confirmPw) {
    pwError.textContent = 'Die Passwörter stimmen nicht überein.';
    pwError.hidden = false;
    return;
  }
  const salt = randomSalt();
  config.settings.privacy = { enabled: true, salt, hash: await sha256Hex(salt + ':' + pw) };
  await persist();
  document.getElementById('pw-new').value = '';
  document.getElementById('pw-confirm').value = '';
  refreshPrivacyUI();
});

function lockApp() {
  if (!config.settings.privacy.enabled) return;
  closeSettings();
  lockScreen.hidden = false;
  document.getElementById('pw-unlock').focus();
}

document.getElementById('lock-now').addEventListener('click', lockApp);
document.getElementById('lock-btn').addEventListener('click', lockApp);

document.getElementById('unlock-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const p = config.settings.privacy;
  const input = document.getElementById('pw-unlock');
  const box = document.querySelector('.lock-box');
  if ((await sha256Hex(p.salt + ':' + input.value)) === p.hash) {
    lockScreen.hidden = true;
    input.value = '';
    document.getElementById('unlock-error').hidden = true;
  } else {
    document.getElementById('unlock-error').hidden = false;
    box.classList.remove('shake');
    void box.offsetWidth; // Animation neu starten
    box.classList.add('shake');
    input.select();
  }
});

// Strg+L sperrt die App, Escape schließt die Einstellungen
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === 'l') lockApp();
  if (e.key === 'Escape' && !settingsOverlay.hidden) closeSettings();
});

// --------------------------------- Start -----------------------------------

(async function init() {
  userAgent = await window.socially.getUserAgent();
  config = await window.socially.loadConfig();
  if (!Array.isArray(config.services)) config.services = [];
  config.settings = {
    ...structuredClone(DEFAULT_SETTINGS),
    ...config.settings,
    privacy: { ...DEFAULT_SETTINGS.privacy, ...config.settings?.privacy }
  };

  // Bestandsdienste aus älteren Versionen: Markenlogo + Farbe nachrüsten
  let backfilled = false;
  for (const svc of config.services) {
    if (svc.icon) continue;
    const cat = CATALOG.find((c) => c.url === svc.url || c.name === svc.name);
    if (cat?.icon) {
      svc.icon = cat.icon;
      svc.color = cat.color;
      backfilled = true;
    }
  }
  if (backfilled) await persist();
  document.getElementById('data-dir').textContent = await window.socially.getDataDir();

  applyAppearance();
  refreshPrivacyUI();
  buildCatalog();

  // Privacy Mode: App startet gesperrt
  if (config.settings.privacy.enabled) lockApp();

  if (config.services.length > 0) {
    activate(config.services[0].id);
  } else {
    render();
  }
})();
