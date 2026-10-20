/*
 * HIER deine Firebase-Daten eintragen (siehe ANLEITUNG.md, Schritt 2).
 * Solange hier "DEIN_..." steht, läuft Robbi nur lokal auf dem Gerät
 * (ohne Anmeldung, Rangliste und Push).
 */
self.FIREBASE_CONFIG = {
  apiKey: "DEIN_API_KEY",
  authDomain: "DEIN_PROJEKT.firebaseapp.com",
  projectId: "DEIN_PROJEKT",
  storageBucket: "DEIN_PROJEKT.appspot.com",
  messagingSenderId: "DEINE_SENDER_ID",
  appId: "DEINE_APP_ID"
};

/* Web-Push-Schlüssel (Firebase → Projekteinstellungen → Cloud Messaging → Web-Push-Zertifikate) */
self.FIREBASE_VAPID_KEY = "DEIN_VAPID_KEY";
