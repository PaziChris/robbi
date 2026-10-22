# Robbi online stellen – Schritt für Schritt

Am Ende hast du:
- eine eigene App unter `https://DEINNAME.github.io/robbi/`, die auf jedem Handy und PC läuft
- Anmeldung mit E-Mail und Passwort, Fortschritt im Konto, Rangliste mit Freunden
- jeden Tag einen frechen Spruch auf Farsi oder Griechisch als Push-Nachricht

Alles ist **kostenlos** (GitHub + Firebase-Gratistarif „Spark“). Dauer: etwa 30 Minuten.

> Tipp: Mach die Schritte am PC. Die Handy-Schritte kommen ganz am Ende.

---

## Schritt 1 – Dateien auf GitHub hochladen

1. Konto anlegen auf **github.com** (falls du noch keins hast).
2. Oben rechts auf **+** → **New repository**.
   - Repository name: `robbi`
   - **Public** auswählen (GitHub Pages ist nur für öffentliche Repositories gratis)
   - **Create repository**
3. Auf der neuen Seite: **uploading an existing file** anklicken.
4. Entpacke die ZIP-Datei und ziehe **alle Dateien und Ordner** aus dem Ordner `robbi-web` in das Fenster (index.html, app.js, style.css, sw.js, firebase-config.js, manifest.webmanifest, die .txt-Dateien und die Ordner icons, sprueche, scripts, pc-programm).
5. Unten auf **Commit changes**.

### Der versteckte Ordner `.github`
Windows und Mac zeigen Ordner mit Punkt am Anfang oft nicht an, darum fehlt er beim Hochladen gern. So legst du ihn direkt auf GitHub an:
1. Im Repository: **Add file** → **Create new file**
2. Als Dateiname genau eintippen: `.github/workflows/taeglicher-spruch.yml`
3. Den Inhalt der Datei `workflow-kopie/taeglicher-spruch.yml` aus der ZIP hineinkopieren (mit einem Texteditor öffnen) – das ist eine sichtbare Kopie genau dafür
4. **Commit changes**

## Schritt 2 – Die App einschalten (GitHub Pages)

1. Im Repository: **Settings** → links **Pages**
2. Bei *Source*: **Deploy from a branch**, Branch **main**, Ordner **/ (root)** → **Save**
3. Nach 1–2 Minuten steht oben dein Link: `https://DEINNAME.github.io/robbi/`

Öffne ihn – Robbi läuft schon! Noch speichert er nur auf dem Gerät. Jetzt kommt die Anmeldung.

## Schritt 3 – Firebase-Projekt anlegen

1. Gehe auf **console.firebase.google.com** und melde dich mit einem Google-Konto an.
2. **Projekt erstellen** → Name z. B. `robbi` → Google Analytics kannst du **ausschalten** → **Projekt erstellen**.
3. Auf der Projektseite das Symbol **`</>`** (Web) klicken.
   - App-Spitzname: `robbi`
   - Firebase Hosting **nicht** ankreuzen
   - **App registrieren**
4. Es erscheint ein Code-Block mit `const firebaseConfig = { apiKey: "...", ... }`. Lass die Seite offen.
5. Auf GitHub die Datei **firebase-config.js** öffnen → Stift-Symbol (Bearbeiten).
6. Ersetze die Werte `DEIN_API_KEY`, `DEIN_PROJEKT` usw. durch die Werte aus Firebase (nur den Text zwischen den Anführungszeichen). **Commit changes**.

> Keine Sorge: Diese Werte dürfen öffentlich sein. Geschützt werden deine Daten durch die Regeln aus Schritt 5.

## Schritt 4 – Anmeldung mit E-Mail einschalten

1. In Firebase links: **Erstellen → Authentication** → **Jetzt starten**
2. Reiter **Anmeldemethode** → **E-Mail/Passwort** → den ersten Schalter **aktivieren** → **Speichern**
3. Reiter **Einstellungen** → **Autorisierte Domains** → **Domain hinzufügen** → `DEINNAME.github.io` eintragen → **Hinzufügen**

## Schritt 5 – Datenbank anlegen

1. Links: **Erstellen → Firestore Database** → **Datenbank erstellen**
2. Standort: **eur3 (Europe)** oder **europe-west3 (Frankfurt)** → **Weiter**
3. **Im Produktionsmodus starten** → **Erstellen**
4. Reiter **Regeln**: alles löschen und den kompletten Inhalt der Datei **firestore.rules** hineinkopieren → **Veröffentlichen**

Jetzt kannst du dich in der App unter **Rangliste** registrieren. Dein Fortschritt wird ab dann im Konto gespeichert.

## Schritt 6 – Push-Schlüssel für die App

1. In Firebase oben links auf das **Zahnrad** → **Projekteinstellungen** → Reiter **Cloud Messaging**
2. Ganz unten bei **Web-Konfiguration → Web-Push-Zertifikate**: **Schlüsselpaar generieren**
3. Den langen Schlüssel kopieren.
4. Auf GitHub **firebase-config.js** bearbeiten und bei `self.FIREBASE_VAPID_KEY = "..."` einfügen. **Commit changes**.

## Schritt 7 – Den täglichen Spruch einrichten

Damit GitHub die Sprüche verschicken darf, braucht es einen geheimen Schlüssel von Firebase.

1. Firebase: **Zahnrad → Projekteinstellungen → Dienstkonten** → **Neuen privaten Schlüssel generieren** → **Schlüssel generieren**. Eine `.json`-Datei wird heruntergeladen.

> **WICHTIG:** Diese JSON-Datei ist wie ein Generalschlüssel. **Niemals** ins Repository hochladen oder weitergeben – nur in GitHub-Secrets einfügen, wie unten beschrieben.

2. GitHub-Repository: **Settings → Secrets and variables → Actions**
3. Reiter **Secrets** → **New repository secret**
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Secret: den **kompletten Inhalt** der JSON-Datei (mit Texteditor öffnen, alles markieren, kopieren)
   - **Add secret**
4. Reiter **Variables** → **New repository variable**
   - Name: `APP_URL`
   - Value: `https://DEINNAME.github.io/robbi/`
   - **Add variable**
5. Danach kannst du die JSON-Datei auf deinem PC löschen.

**Testen:** Reiter **Actions** → falls gefragt, Workflows aktivieren → links **Täglicher Robbi-Spruch** → **Run workflow**. Nach etwa einer Minute erscheint ein grüner Haken. (Ein Spruch kommt natürlich erst an, wenn du auf dem Handy die Benachrichtigungen eingeschaltet hast – siehe unten.)

Ab jetzt läuft das automatisch jeden Tag um **16 Uhr** (Sommer- und Winterzeit stellt das Skript selbst um).

---

## Auf dem Handy

### iPhone (iOS 16.4 oder neuer)
1. Den Link in **Safari** öffnen (nicht in Chrome!)
2. Unten auf **Teilen** (Viereck mit Pfeil) → **Zum Home-Bildschirm** → **Hinzufügen**
3. Robbi **über das neue Icon** auf dem Home-Bildschirm öffnen
4. **Rangliste** → registrieren oder anmelden → Spitzname wählen
5. Weiter unten **Benachrichtigungen einschalten** → **Erlauben**

### Android
1. Den Link in **Chrome** öffnen
2. Oben erscheint „Robbi als App auf den Startbildschirm legen?“ → **Installieren** (oder Menü ⋮ → **App installieren**)
3. **Rangliste** → registrieren oder anmelden → **Benachrichtigungen einschalten** → **Zulassen**

Freunde machen dasselbe mit deinem Link – sie registrieren sich selbst und landen sofort in der Rangliste.

---

---

## Duelle freischalten (einmalig, 1 Minute)

Für die Duelle braucht Firebase neue Regeln:
1. Firebase → **Firestore Database** → Reiter **Regeln**
2. Alles löschen und den kompletten Inhalt von **firestore.rules** (im Ordner robbi-web) einfügen
3. **Veröffentlichen**

Die Duell-Nachrichten (Herausforderung, Sieg, Niederlage) verschickt der Ablauf **„Duell-Nachrichten“** automatisch etwa alle 15 Minuten.

## Später: Dinge ändern

| Was | Wie |
|---|---|
| Neue Wörter für alle | Auf GitHub `farsi.txt` oder `griechisch.txt` öffnen → Stift → Zeilen ergänzen → Commit. Die App lädt sie beim nächsten Öffnen. |
| Neue Sprache | Neue Datei, z. B. `tuerkisch.txt`, hochladen und in `sprachen.txt` die Zeile `Türkisch ; tuerkisch.txt` ergänzen. |
| Mehr Sprüche | `sprueche/farsi.txt` oder `sprueche/griechisch.txt` ergänzen (Format: `Spruch ; Übersetzung`). |
| Uhrzeit des Spruchs | In `robbi-web/scripts/send-push.mjs` den Wert `SEND_HOUR` ändern (Wiener Zeit) und in `.github/workflows/taeglicher-spruch.yml` die beiden `cron`-Zeilen auf diese Stunde minus 2 und minus 1 (UTC) setzen. |
| PC-Programm | Liegt im Ordner `pc-programm` (für Visual Studio, speichert nur auf dem PC). |

## Wenn etwas nicht klappt

- **„Das hat nicht geklappt (auth/unauthorized-domain)“** → Schritt 4, Punkt 3 vergessen (Domain eintragen).
- **Anmelden geht, aber nichts wird gespeichert** → Schritt 5, Punkt 4: Regeln richtig eingefügt und veröffentlicht?
- **iPhone zeigt keinen Knopf für Benachrichtigungen** → Robbi muss vom Home-Bildschirm-Icon aus geöffnet sein, nicht aus Safari.
- **Actions-Lauf ist rot** → Auf den Lauf klicken und die Fehlermeldung lesen. Meist ist das Secret `FIREBASE_SERVICE_ACCOUNT` nicht der komplette JSON-Inhalt.
- **Änderungen erscheinen nicht** → App einmal ganz schließen und neu öffnen (sie speichert sich für offline zwischen).
