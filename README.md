# Socially by mystu

Alle deine Social-Media- und Messenger-Dienste in **einer portablen App** – inspiriert von Franz/Ferdium.
Socially lädt die offiziellen Webversionen (z. B. WhatsApp Web, Telegram Web, Discord, Instagram …) und hält sie sauber voneinander getrennt.

## Features

- ➕ **Beliebig viele Dienste** – 16 vordefinierte Dienste im Katalog + eigene Dienste per URL
- 🧳 **Portabel** – eine einzelne EXE, alle Daten liegen im Ordner `SociallyData` daneben (USB-Stick-tauglich, nichts in `%APPDATA%` oder der Registry)
- 🎨 **Hell- & Dunkelmodus** – Dunkel, Hell oder automatisch dem System folgen (⚙ Darstellung)
- 🔀 **Schneller Wechsel** – Tabs links in der Seitenleiste oder unten mittig (umschaltbar), Dienste bleiben im Hintergrund geladen
- 🔴 **Ungelesen-Badges** – roter Zähler mit weißer Zahl am Dienst-Icon, sobald neue Nachrichten da sind
- 🎵 **Benachrichtigungston pro App** – Ding, Pop, Glocke, Chime, Trill oder kein Ton, für jeden Dienst einzeln wählbar
- 🔔 **Benachrichtigungen steuerbar** – global an/aus, einzelne Dienste stummschalten (kein Ton, keine Benachrichtigungen)
- 🔒 **Privacy Mode** – optionaler Passwortschutz, der die ganze App sperrt (beim Start, per 🔒-Button oder Strg+L; Passwort als SHA-256-Hash mit Salt gespeichert)
- 🚀 **Autostart** – optional automatisch beim Hochfahren starten
- 🖱 **Rechtsklick auf einen Dienst**: neu laden, stummschalten, Daten löschen, Dienst entfernen

## Datenschutz

- 🔒 **Isolierte Sessions:** Jeder Dienst läuft in einer eigenen Partition – Cookies und Tracker können nicht dienstübergreifend lesen.
- 💾 **100 % lokal:** Logins, Cookies und Einstellungen bleiben ausschließlich im `SociallyData`-Ordner. Keine Cloud, kein Konto, keine Telemetrie.
- 🚫 **Restriktive Berechtigungen:** Dienste erhalten nur Benachrichtigungen, Mikrofon/Kamera (für Anrufe) und Vollbild.
- 🌐 **Externe Links** öffnen im Standardbrowser, nie in der App.
- 🧹 **Volle Kontrolle:** Daten pro Dienst jederzeit löschbar; beim Entfernen eines Dienstes werden seine Daten mitgelöscht.
- 🕵️ **Neutrale Browser-Kennung:** Die App meldet sich als normaler Chrome, ohne Electron-/App-Kennung.

## Entwicklung

```bash
npm install     # Abhängigkeiten installieren
npm start       # App im Entwicklungsmodus starten
```

Im Entwicklungsmodus liegen die Daten in `./SociallyData` im Projektordner.

## Builds

### Windows (portable EXE)

```bash
npm run dist:win
```

Ergebnis: `release/Socially-Portable-1.0.0.exe` – eine einzelne Datei, die ohne Installation läuft.
Beim ersten Start legt sie neben sich den Ordner `SociallyData` an. EXE + Ordner zusammen kopieren = App inklusive aller Logins umziehen.

### macOS (DMG, Apple Silicon + Intel)

macOS-Builds können **nur auf einem Mac** erstellt werden (Vorgabe von Apple/electron-builder). Zwei Wege:

1. **Auf einem Mac:** Projektordner rüberkopieren, dann `npm install && npm run dist:mac` → `release/Socially-1.0.0-mac-arm64.dmg` (Apple Silicon) und `…-x64.dmg` (Intel).
2. **Ohne Mac – GitHub Actions:** Projekt in ein GitHub-Repo pushen → Tab „Actions" → Workflow „Build Socially" → „Run workflow". GitHub baut dann Mac **und** Windows in der Cloud; die fertigen Dateien hängen als Artefakte am Lauf. (Workflow liegt in `.github/workflows/build.yml`.)

Hinweis: Die DMGs sind unsigniert – beim ersten Öffnen auf dem Mac Rechtsklick → „Öffnen" wählen.

## Technik

- Electron (Chromium) mit `<webview>`-Tags, eine persistente Partition pro Dienst
- UI: reines HTML/CSS/JS, keine externen Laufzeit-Abhängigkeiten
- `contextIsolation` an, `nodeIntegration` aus, schmale IPC-Brücke via Preload

---

Made with ♥ by **mystu**
