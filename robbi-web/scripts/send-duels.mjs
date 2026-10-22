/*
 * Duell-Benachrichtigungen: läuft regelmäßig über GitHub Actions.
 *  - Neue Herausforderung  -> Push an den Herausgeforderten
 *  - Duell fertig          -> Push an Gewinner (Glückwunsch) und Verlierer (frecher Spruch)
 * Braucht: FIREBASE_SERVICE_ACCOUNT (Secret), APP_URL (Variable)
 */
const APP_URL = (process.env.APP_URL || '').replace(/\/?$/, '/');
if (!process.env.FIREBASE_SERVICE_ACCOUNT) { console.error('FIREBASE_SERVICE_ACCOUNT fehlt.'); process.exit(1); }

const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
const { getMessaging } = await import('firebase-admin/messaging');
initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = getFirestore(), messaging = getMessaging();

const rnd = a => a[Math.floor(Math.random() * a.length)];
const LOSER = [
  n => `Autsch! ${n} hat dich im Duell abgezogen. Revanche? 😏`,
  n => `${n} hat gewonnen. Arzi und Robbie schauen enttäuscht… Zeit für eine Revanche! 🥊`,
  n => `Haha, ${n} war schneller! Robbie hat vor Schreck sein Komboloi fallen lassen. 📿`,
  n => `${n} schlägt dich im Duell! Arzi hat ihren Tee verschüttet. ☕ Revanche?`,
  n => `Verloren gegen ${n}! Ein paar Karten mehr und du holst dir den Sieg zurück. 💪`
];
const WINNER = [
  n => `Sieg! Du hast ${n} im Duell geschlagen! 🏆`,
  n => `Ópa! Du hast ${n} besiegt! 🏆`,
  n => `Āfarin! ${n} hatte keine Chance. 🏆`
];

function winnerOf(d) {
  const as = d.aScore || 0, bs = d.bScore || 0;
  if (as !== bs) return as > bs ? 'a' : 'b';
  if ((d.aTime || 0) !== (d.bTime || 0)) return (d.aTime || 0) < (d.bTime || 0) ? 'a' : 'b';
  return 'tie';
}
async function pushTo(uid, title, body) {
  const ref = db.collection('users').doc(uid), doc = await ref.get();
  const tokens = doc.exists && Array.isArray(doc.data().fcmTokens) ? doc.data().fcmTokens.filter(Boolean) : [];
  if (!tokens.length) return 0;
  const res = await messaging.sendEachForMulticast({
    tokens, notification: { title, body },
    webpush: { notification: { icon: APP_URL + 'icons/icon-192.png' }, fcmOptions: APP_URL.startsWith('https://') ? { link: APP_URL } : undefined }
  });
  const dead = [];
  res.responses.forEach((r, i) => { const c = r.error && r.error.code; if (c === 'messaging/registration-token-not-registered' || c === 'messaging/invalid-registration-token') dead.push(tokens[i]); });
  if (dead.length) await ref.update({ fcmTokens: FieldValue.arrayRemove(...dead) });
  return res.successCount;
}

let sent = 0;
// Neue Herausforderungen
const open = await db.collection('duels').where('status', '==', 'open').get();
for (const d of open.docs) {
  const x = d.data();
  if (x.invited) continue;
  sent += await pushTo(x.b, 'Robbi · Duell 🥊', `${x.aNick || 'Jemand'} fordert dich zum Duell heraus! ${x.aScore}/10 – schaffst du mehr?`);
  await d.ref.update({ invited: true });
}
// Fertige Duelle
const done = await db.collection('duels').where('status', '==', 'done').get();
for (const d of done.docs) {
  const x = d.data();
  if (x.notified) continue;
  const w = winnerOf(x), score = `${x.aScore}:${x.bScore}`;
  if (w === 'tie') {
    sent += await pushTo(x.a, 'Robbi · Duell 🤝', `Unentschieden gegen ${x.bNick || 'deinen Gegner'} (${score})! Nochmal?`);
    sent += await pushTo(x.b, 'Robbi · Duell 🤝', `Unentschieden gegen ${x.aNick || 'deinen Gegner'} (${score})! Nochmal?`);
  } else {
    const win = w === 'a' ? x.a : x.b, lose = w === 'a' ? x.b : x.a;
    const winNick = w === 'a' ? x.aNick : x.bNick, loseNick = w === 'a' ? x.bNick : x.aNick;
    sent += await pushTo(lose, 'Robbi · Duell verloren 😅', `${rnd(LOSER)(winNick || 'Dein Gegner')} (${score})`);
    sent += await pushTo(win, 'Robbi · Duell gewonnen 🏆', `${rnd(WINNER)(loseNick || 'deinen Gegner')} (${score})`);
  }
  await d.ref.update({ notified: true });
}
console.log(`Fertig: ${sent} Duell-Nachrichten verschickt.`);
