/*
 * Schickt jedem Robbi-Nutzer, der Benachrichtigungen eingeschaltet hat,
 * einen Spruch in seiner gewählten Sprache. Läuft täglich über GitHub Actions.
 *
 * Braucht:  FIREBASE_SERVICE_ACCOUNT  (GitHub-Secret, Inhalt der JSON-Schlüsseldatei)
 *           APP_URL                   (GitHub-Variable, z. B. https://deinname.github.io/robbi/)
 * Testen ohne Versand:  DRY_RUN=1 node send-push.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DRY = process.env.DRY_RUN === '1';
const APP_URL = (process.env.APP_URL || '').replace(/\/?$/, '/');

/* ---- Sprüche laden:  Spruch ; deutsche Übersetzung ---- */
function loadPhrases(file) {
  return fs.readFileSync(path.join(here, '..', 'sprueche', file), 'utf8')
    .split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#') && l.includes(';'))
    .map(l => { const i = l.indexOf(';'); return { say: l.slice(0, i).trim(), de: l.slice(i + 1).trim() }; });
}
const PHRASES = { farsi: loadPhrases('farsi.txt'), griechisch: loadPhrases('griechisch.txt') };

/* ---- Datum in Österreich ---- */
function viennaDate(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Vienna', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
const TODAY = viennaDate(0), YESTERDAY = viennaDate(-1);
const DAY = Math.floor(Date.parse(TODAY + 'T12:00:00Z') / 86400000);

function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
function chooseLang(setting) {
  if (setting === 'farsi' || setting === 'griechisch') return setting;
  return DAY % 2 === 0 ? 'farsi' : 'griechisch';            // abwechselnd
}
function pickPhrase(lang, uid) {
  const list = PHRASES[lang];
  return list[(DAY + hash(uid)) % list.length];               // jeden Tag ein anderer, pro Person verschieden
}
function streakLine(score) {
  if (!score) return 'Robbi wartet auf dich – eine Runde?';
  const s = score.streak || 0;
  if (score.lastDay === TODAY) return s > 1 ? `Heute schon gelernt – ${s} Tage Serie!` : 'Heute schon gelernt – stark!';
  if (score.lastDay === YESTERDAY && s > 0) return `Halte deine Serie: ${s} ${s === 1 ? 'Tag' : 'Tage'}!`;
  return 'Robbi vermisst dich – fünf Minuten?';
}
export function buildMessage(setting, uid, score) {
  const lang = chooseLang(setting);
  const p = pickPhrase(lang, uid);
  return { title: lang === 'farsi' ? 'Robbi · Farsi' : 'Robbi · Griechisch', body: `${p.say} (${p.de})\n${streakLine(score)}` };
}

/* ---- Versand ---- */
async function main() {
  if (DRY && !process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Probelauf ohne Firebase: zeigt nur, wie heutige Nachrichten aussehen würden
    for (const s of ['farsi', 'griechisch', 'abwechselnd']) console.log(s.padEnd(12), JSON.stringify(buildMessage(s, 'demo-user', { streak: 3, lastDay: YESTERDAY })));
    return;
  }
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) throw new Error('FIREBASE_SERVICE_ACCOUNT fehlt (GitHub → Settings → Secrets).');
  const { initializeApp, cert } = await import('firebase-admin/app');
  const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
  const { getMessaging } = await import('firebase-admin/messaging');
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  const db = getFirestore(), messaging = getMessaging();

  const users = await db.collection('users').get();
  let sent = 0, skipped = 0, removed = 0;
  for (const doc of users.docs) {
    const u = doc.data();
    const tokens = Array.isArray(u.fcmTokens) ? u.fcmTokens.filter(Boolean) : [];
    if (!tokens.length || u.pushLang === 'aus') { skipped++; continue; }
    const scoreDoc = await db.collection('scores').doc(doc.id).get();
    const msg = buildMessage(u.pushLang || 'abwechselnd', doc.id, scoreDoc.exists ? scoreDoc.data() : null);
    if (DRY) { console.log(doc.id, msg); continue; }
    const res = await messaging.sendEachForMulticast({
      tokens,
      notification: { title: msg.title, body: msg.body },
      webpush: {
        notification: { icon: APP_URL + 'icons/icon-192.png', badge: APP_URL + 'icons/icon-192.png' },
        fcmOptions: APP_URL.startsWith('https://') ? { link: APP_URL } : undefined
      }
    });
    sent += res.successCount;
    const dead = [];
    res.responses.forEach((r, i) => {
      const code = r.error && r.error.code;
      if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token' || code === 'messaging/invalid-argument') dead.push(tokens[i]);
    });
    if (dead.length) { await doc.ref.update({ fcmTokens: FieldValue.arrayRemove(...dead) }); removed += dead.length; }
  }
  console.log(`Fertig: ${sent} Nachrichten verschickt, ${skipped} Nutzer ohne Push, ${removed} alte Geräte entfernt.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch(e => { console.error(e); process.exit(1); });
}
