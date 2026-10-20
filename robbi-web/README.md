# Robbi Sprachtrainer 🦭

Karteikarten zum **Sprechen lernen** – Farsi (Teheraner Umgangssprache) und Griechisch (gesprochenes Neugriechisch), alles in lateinischer Umschrift, so wie man es ausspricht.

- rund 800 Karten pro Sprache in vielen Themen, mit „Lies etwa“-Aussprachehilfe
- Wiederholen von falschen und gekonnten Karten
- Anmeldung, Fortschritt im Konto, Rangliste
- täglicher Motivationsspruch als Push-Nachricht
- funktioniert offline und lässt sich auf dem Handy wie eine App installieren

**Einrichten:** siehe [ANLEITUNG.md](ANLEITUNG.md).

## Dateien
| Datei | Zweck |
|---|---|
| `index.html`, `style.css`, `app.js` | die App |
| `firebase-config.js` | deine Firebase-Daten (hier eintragen) |
| `sprachen.txt`, `farsi.txt`, `griechisch.txt` | Wortlisten (`fremd ; deutsch ; Notiz`) |
| `sprueche/` | Sprüche für die tägliche Push-Nachricht |
| `scripts/send-push.mjs`, `.github/workflows/` | verschickt täglich die Push-Nachrichten |
| `firestore.rules` | Sicherheitsregeln für die Datenbank |
| `manifest.webmanifest`, `sw.js`, `icons/` | App-Installation, Offline, Push |
| `pc-programm/` | Konsolenversion in C für Visual Studio |
