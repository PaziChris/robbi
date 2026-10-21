/*
 * Schickt EINMALIG eine eigene Push-Nachricht an eine Person aus der Rangliste.
 * Gestartet über GitHub → Actions → "Nachricht an jemanden senden" → Run workflow.
 *
 * Braucht:  FIREBASE_SERVICE_ACCOUNT (Secret), APP_URL (Variable)
 *           NICK      Spitzname aus der Rangliste (Groß-/Kleinschreibung egal)
 *           MESSAGE   der Text der Nachricht
 *           TITLE     optional, Überschrift (Standard: "Robbi")
 */
const NICK = (process.env.NICK || '').trim();
const MESSAGE = (process.env.MESSAGE || '').trim();
const TITLE = (process.env.TITLE || '').trim() || 'Robbi';
const APP_URL = (process.env.APP_URL || '').replace(/\/?$/, '/');

if (!NICK || !MESSAGE) { console.error('Bitte Spitzname und Nachricht angeben.'); process.exit(1); }
if (!process.env.FIREBASE_SERVICE_ACCOUNT) { console.error('FIREBASE_SERVICE_ACCOUNT fehlt (GitHub → Settings → Secrets).'); process.exit(1); }

const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
const { getMessaging } = await import('firebase-admin/messaging');
initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = getFirestore(), messaging = getMessaging();

// Person über den Spitznamen in der Rangliste finden
const scores = await db.collection('scores').get();
const wanted = NICK.toLowerCase();
const hits = scores.docs.filter(d => String(d.data().nick || '').trim().toLowerCase() === wanted);
if (hits.length === 0) {
  const names = scores.docs.map(d => d.data().nick).filter(Boolean);
  console.error(`Niemand mit dem Spitznamen "${NICK}" gefunden. In der Rangliste stehen: ${names.join(', ') || '(niemand)'}`);
  process.exit(1);
}
if (hits.length > 1) {
  console.error(`Mehrere Personen heißen "${NICK}". Zur Sicherheit wurde nichts verschickt.`);
  process.exit(1);
}

const uid = hits[0].id;
const userDoc = await db.collection('users').doc(uid).get();
const tokens = userDoc.exists && Array.isArray(userDoc.data().fcmTokens) ? userDoc.data().fcmTokens.filter(Boolean) : [];
if (!tokens.length) {
  console.error(`"${NICK}" hat die Benachrichtigungen in Robbi noch nicht eingeschaltet (Rangliste → Benachrichtigungen einschalten).`);
  process.exit(1);
}

const res = await messaging.sendEachForMulticast({
  tokens,
  notification: { title: TITLE, body: MESSAGE },
  webpush: {
    notification: { icon: APP_URL + 'icons/icon-192.png', badge: APP_URL + 'icons/icon-192.png' },
    fcmOptions: APP_URL.startsWith('https://') ? { link: APP_URL } : undefined
  }
});
const dead = [];
res.responses.forEach((r, i) => {
  const code = r.error && r.error.code;
  if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') dead.push(tokens[i]);
});
if (dead.length) await userDoc.ref.update({ fcmTokens: FieldValue.arrayRemove(...dead) });

if (res.successCount > 0) console.log(`Verschickt an "${NICK}" (${res.successCount} Gerät${res.successCount === 1 ? '' : 'e'}).`);
else { console.error(`Konnte nicht zugestellt werden. "${NICK}" sollte Robbi einmal öffnen und die Benachrichtigungen neu einschalten.`); process.exit(1); }
