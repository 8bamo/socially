# Socially by mystu

Alle deine Social-Media- und Messenger-Dienste in **einer portablen App** – inspiriert von Franz/Ferdium.
Socially lädt die offiziellen Webversionen (z. B. WhatsApp Web, Telegram Web, Discord, Instagram …) und hält sie sauber voneinander getrennt.

## Download

Die fertige App gibt es auf der [**Releases-Seite**](https://github.com/8bamo/socially/releases/latest):

| System | Datei |
|---|---|
| 🍎 Mac mit Apple Silicon (M1/M2/M3/M4) | `Socially-<version>-mac-arm64.dmg` |
| 🍎 Mac mit Intel-Prozessor | `Socially-<version>-mac-x64.dmg` |
| 🪟 Windows (portabel, keine Installation) | `Socially-Portable-<version>.exe` |

**Welchen Mac habe ich?** Apple-Menü  → „Über diesen Mac“ – steht bei „Chip“ (Apple = arm64) oder „Prozessor“ (Intel = x64).

### Erster Start auf dem Mac

Die App ist nicht über den App Store verifiziert. Beim ersten Öffnen daher:
**Rechtsklick auf die App → „Öffnen“ → im Dialog nochmal „Öffnen“ bestätigen.** Danach startet sie ganz normal per Doppelklick.

### Erster Start auf Windows

Einfach die EXE doppelklicken – keine Installation nötig. Falls der SmartScreen-Hinweis kommt: „Weitere Informationen“ → „Trotzdem ausführen“.

## Features

- ➕ **Beliebig viele Dienste** – 16 vordefinierte Dienste im Katalog + eigene Dienste per URL
- 🧳 **Portabel** – alle Daten liegen im Ordner `SociallyData` neben der App (USB-Stick-tauglich)
- 🎨 **Hell- & Dunkelmodus** – Dunkel, Hell oder automatisch dem System folgen (⚙ Darstellung)
- 🔀 **Schneller Wechsel** – Tabs links in der Seitenleiste oder unten mittig (umschaltbar), Dienste bleiben im Hintergrund geladen
- 🔴 **Ungelesen-Badges** – roter Zähler mit weißer Zahl am Dienst-Icon, sobald neue Nachrichten da sind
- 🎵 **Benachrichtigungston pro App** – Ding, Pop, Glocke, Chime, Trill oder kein Ton, für jeden Dienst einzeln wählbar
- 🔔 **Benachrichtigungen steuerbar** – global an/aus, einzelne Dienste stummschalten (kein Ton, keine Benachrichtigungen) – auch direkt beim Hinzufügen eines Dienstes
- 📞 **Anrufe** – Mikrofon- und Kamerazugriff für Sprach- und Videoanrufe (z. B. Discord, WhatsApp)
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

---

Made with ♥ by **mystu**
