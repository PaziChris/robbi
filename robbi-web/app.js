/* Robbi Sprachtrainer – Web-App
 * Wörter: sprachen.txt + farsi.txt, griechisch.txt ... (dieselben Dateien wie beim PC-Programm)
 * Speicher: Firebase (Anmeldung, Fortschritt, Rangliste, Push) + lokal als Zwischenspeicher.
 */

const FB = 'https://www.gstatic.com/firebasejs/10.12.2/';
const CFG = self.FIREBASE_CONFIG;
const HAS_FIREBASE = !!(CFG && CFG.apiKey && !String(CFG.apiKey).startsWith('DEIN'));

/* ---------- Lokaler Speicher ---------- */
const KEY = 'robbi.v3';
const DEFAULTS = { extra: [], prog: {}, lang: '', dir: 'd', nick: '', xp: 0, streak: 0, lastDay: '', pushLang: 'abwechselnd' };
function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
const store = Object.assign({}, DEFAULTS, lsGet(KEY) || {});
function saveLocal() { clearTimeout(localTimer); lsSet(KEY, store); }
let localTimer = null;
function saveLocalSoon() { clearTimeout(localTimer); localTimer = setTimeout(saveLocal, 600); }

function parse(text, lang) {
  const out = []; let cat = 'Allgemein';
  for (const raw of text.split(/\r?\n/)) {
    const l = raw.trim();
    if (!l || l[0] === '#') continue;
    if (l[0] === '[') { cat = l.slice(1).replace(/\].*$/, '').trim() || cat; continue; }
    const p = l.split(';').map(s => s.trim());
    if (p.length < 2 || !p[0] || !p[1]) continue;
    out.push({ lang, cat, front: p[0], back: p[1], note: p.slice(2).join('; ').trim() });
  }
  return out;
}
const SEP = '\u0001';
const keyOf = c => c.lang + SEP + c.front + SEP + c.back;
const stateOf = c => store.prog[keyOf(c)] || 'n';

/* ---------- Aussprache ---------- */
const PRON = {
  Farsi: {
    intro: 'Alle Wörter stehen so da, wie man sie in Teheran spricht. "Lies etwa" zeigt dir, wie du es als Deutschsprachige(r) lesen musst.',
    re: /kh|sh|zh|ch|ey|j|y|v|z|'/g,
    map: { kh: 'ch', sh: 'sch', zh: 'sch', ch: 'tsch', ey: 'ej', j: 'dsch', y: 'j', v: 'w', z: 's', "'": '' },
    key: [['ā', 'langes, dunkles a – zwischen a und o, wie engl. "ball"'], ['a', 'kurzes, helles a, fast wie ä'], ['e / o', 'kurz, wie in "Bett" / "Sonne"'], ['u / i', 'immer lang, wie in "gut" / "Lied"'],
      ['kh', 'wie ch in "Bach"'], ['gh', 'Rachen-r, wie das französische r'], ['sh', 'sch'], ['ch', 'tsch'], ['j', 'dsch, wie in "Job"'], ['zh', 'wie j in "Journal"'], ['y', 'j, wie in "ja"'], ['z', 'weiches s, wie in "Sonne"'], ['s', 'scharfes s, wie in "Haus"'], ['v', 'w'], ["'", 'kurzer Stopp in der Stimme']]
  },
  Griechisch: {
    intro: 'Alle Wörter stehen so da, wie man sie spricht. Der Akzent zeigt die betonte Silbe – das ist im Griechischen sehr wichtig. In "Lies etwa" ist die betonte Silbe groß.',
    re: /ts|tz|th|dh|gh|ch|v|z/g,
    map: { ts: 'z', tz: 'ds', th: 'th', dh: 'dh', gh: 'gh', ch: 'ch', v: 'w', z: 's' },
    key: [['á é í ó ú', 'diese Silbe betonen'], ['ch', 'wie in "Bach", vor e/i wie in "ich"'], ['gh', 'weiches Rachen-g, fast wie ein gehauchtes r'], ['j', 'wie in "ja"'], ['th', 'wie engl. "think"'], ['dh', 'wie engl. "this"'],
      ['z', 'weiches s, wie in "Sonne"'], ['s', 'scharfes s'], ['ts', 'wie deutsches z'], ['tz', 'wie ds'], ['v', 'w'], ['ne / óchi', 'ne = JA, óchi = NEIN!']]
  }
};
function readAid(text, l) {
  const p = PRON[l]; if (!p) return '';
  let out = text.replace(p.re, m => p.map[m] !== undefined ? p.map[m] : m);
  if (l === 'Griechisch') out = out.replace(/[áéíóú]/g, v => v.toUpperCase());
  return out === text ? '' : out;
}

/* ---------- Zustand ---------- */
const $ = id => document.getElementById(id);
const seal = $('seal'), bubble = $('bubble');
let fileLangs = {};
const texts = {};
let lang = '', cat = '*', mode = 'all', cards = [];
let queue = [], total = 0, done = 0, firstRight = 0, firstSeen = 0, sessionXp = 0, flipped = false;

const MODES = [['all', 'Alle'], ['new', 'Neu'], ['f', 'Falsch'], ['k', 'Gekonnt']];
const DIRS = [['d', 'Deutsch → ?'], ['f', '? → Deutsch'], ['m', 'Gemischt']];
const CHEERS = {
  Farsi: ['Āfarin! (Bravo!)', 'Kheyli khub! (Sehr gut!)', 'Āli-e! (Super!)', 'Damet garm!'],
  Griechisch: ['Brávo!', 'Polí kalá! (Sehr gut!)', 'Téleia! (Perfekt!)', 'Foveró! (Super!)']
};
const cheer = () => { const l = CHEERS[lang] || ['Super!', 'Toll!', 'Weiter so!']; return l[Math.floor(Math.random() * l.length)]; };

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/* Die Lehrer: Arzi der persische Affe (Farsi) und Robbie Robert Robertson die griechische Robbe */
const ACTORS = {
  Farsi: { el: $('monkey'), btn: $('monkeyBtn'), act: 'sip', actMs: 1600, praise: 'Āfarin! Arzi ist stolz auf dich.',
    pokes: ['Salām! Chāy mikhori?', 'Bezan berim!', 'Arzi injāst!', 'Esmam Arzi-e!', 'Vāy, ghelghelakam nakon!', 'Damet garm!', 'Ye chāy-e dāgh, ye kam farsi?'] },
  Griechisch: { el: $('seal'), btn: $('sealBtn'), act: 'wave', actMs: 900, praise: 'Brávo! Robbie Robert Robertson ist stolz auf dich.',
    pokes: ['Jia su! Ti kánis?', 'Ánde, páme!', 'Ópa!', 'Me léne Robbie Robert Robertson!', 'Mi me gharghalás!', 'Brávo su!', 'Éla, mia jíra akóma!'] }
};
const actor = () => ACTORS[lang] || ACTORS.Griechisch;
let happyTimer = null;
function anim(el, kind) {
  if (reduceMotion || !el.animate) return;
  if (kind === 'bounce') el.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-10px)', offset: .3 }, { transform: 'translateY(0)', offset: .6 }, { transform: 'translateY(-3px)', offset: .8 }, { transform: 'translateY(0)' }], { duration: 500, easing: 'ease-out' });
  if (kind === 'shake') el.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-6deg)', offset: .25 }, { transform: 'rotate(6deg)', offset: .75 }, { transform: 'rotate(0)' }], { duration: 450, easing: 'ease-in-out' });
}
function setMood(text, happy, kind) {
  const el = actor().el;
  bubble.textContent = text;
  Object.values(ACTORS).forEach(x => x.el.classList.remove('is-happy'));
  clearTimeout(happyTimer);
  if (happy) { el.classList.add('is-happy'); happyTimer = setTimeout(() => el.classList.remove('is-happy'), 1800); }
  if (kind) anim(el, kind);
}
function pose(el, c, ms) { el.classList.add(c); setTimeout(() => el.classList.remove(c), ms); }
/* Beide leben: blinzeln, zwinkern; wer dran ist, winkt bzw. trinkt Tee oder schaut sich um */
function lifeLoop(a) {
  setTimeout(() => {
    if (!document.hidden) {
      const el = a.el;
      if (Math.random() < 0.14 && !el.classList.contains('is-happy')) pose(el, 'wink', 400);
      else { pose(el, 'blink', 140); if (Math.random() < 0.25) setTimeout(() => pose(el, 'blink', 140), 280); }
      if (!reduceMotion && a === actor()) { const x = Math.random(); if (x < 0.15) pose(el, a.act, a.actMs); else if (x < 0.27) pose(el, 'look', 1600); }
    }
    lifeLoop(a);
  }, 2200 + Math.random() * 3800);
}
function renderStage() {
  $('stage').dataset.active = lang === 'Farsi' ? 'fa' : lang === 'Griechisch' ? 'gr' : 'none';
  for (const l in ACTORS) { const on = l === lang; ACTORS[l].btn.classList.toggle('on', on); ACTORS[l].btn.setAttribute('aria-pressed', on); }
}
function poke(a) {
  a.el.classList.remove('is-happy'); clearTimeout(happyTimer);
  pose(a.el, 'wink', 450); pose(a.el, a.act, a.actMs); anim(a.el, 'bounce');
  bubble.textContent = a.pokes[Math.floor(Math.random() * a.pokes.length)];
}
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

/* ---------- Datum & Serie ---------- */
const fmt = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const today = () => fmt(new Date());
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return fmt(d); };
function liveStreak(s, last) { return (last === today() || last === yesterday()) ? (s || 0) : 0; }
function touchStreak() {
  const t = today();
  if (store.lastDay === t) return;
  store.streak = store.lastDay === yesterday() ? (store.streak || 0) + 1 : 1;
  store.lastDay = t;
}
function knownTotal() { let n = 0; for (const k in store.prog) if (store.prog[k] === 'k') n++; return n; }

/* ---------- Firebase ---------- */
const cloud = { fb: null, uid: null, email: '', ok: false };
const timers = {}, chains = {};
const lk = l => (l.replace(/[^A-Za-z0-9_-]/g, '_') || 'x');

function setSync(kind) {
  const el = $('sync');
  const t = {
    ok: 'Gespeichert in deinem Konto', local: 'Nicht angemeldet: nur auf diesem Gerät gespeichert',
    nofb: 'Nur auf diesem Gerät gespeichert', err: 'Speichern hakt gerade – ich versuche es weiter', wait: 'Speichere …', offline: 'Offline – wird gespeichert, sobald du online bist'
  }[kind];
  el.textContent = t; el.className = 'sync ' + (kind === 'ok' ? 'ok' : kind === 'wait' ? '' : 'warn');
}
function progBody(l) {
  const out = {}, pre = l + SEP;
  for (const k in store.prog) if (k.startsWith(pre)) out[k.slice(pre.length)] = store.prog[k];
  return { lang: l, json: JSON.stringify(out) };
}
const userBody = () => ({ extraJson: JSON.stringify(store.extra), lang: store.lang, dir: store.dir, nick: store.nick, pushLang: store.pushLang });
const scoreBody = () => ({ nick: store.nick || '', xp: store.xp || 0, streak: store.streak || 0, lastDay: store.lastDay || '', known: knownTotal(), lang: store.lang || '' });

function writeDoc(path, body, delay) {
  if (!cloud.ok) return;
  const { F } = cloud.fb;
  clearTimeout(timers[path]);
  timers[path] = setTimeout(() => {
    setSync(navigator.onLine === false ? 'offline' : 'wait');
    chains[path] = (chains[path] || Promise.resolve())
      .then(() => F.setDoc(F.doc(cloud.fb.db, path), body(), { merge: true }))
      .then(() => setSync('ok'))
      .catch(() => setSync('err'));
  }, delay == null ? 1200 : delay);
}
function persist(what, delay) {
  saveLocalSoon();
  if (!cloud.ok) return;
  const u = 'users/' + cloud.uid;
  if (what.includes('user')) writeDoc(u, userBody, delay);
  if (what.includes('prog')) writeDoc(u + '/prog/' + lk(lang), () => progBody(lang), delay);
  if (what.includes('score')) writeDoc('scores/' + cloud.uid, scoreBody, delay);
}

async function initFirebase() {
  if (!HAS_FIREBASE) { setSync('nofb'); renderProfile(); return; }
  try {
    const [appM, authM, fsM] = await Promise.all([import(FB + 'firebase-app.js'), import(FB + 'firebase-auth.js'), import(FB + 'firebase-firestore.js')]);
    const app = appM.initializeApp(CFG);
    // Kein IndexedDB-Cache: Robbi speichert ohnehin selbst lokal und gleicht beim Start ab.
    // Das hält die App auf dem Handy flüssig.
    const db = fsM.getFirestore(app);
    const auth = authM.getAuth(app);
    cloud.fb = { app, db, auth, A: authM, F: fsM };
    authM.onAuthStateChanged(auth, onAuth);
  } catch (e) {
    setSync('nofb'); renderProfile();
  }
}

async function onAuth(user) {
  const { F, db } = cloud.fb;
  if (!user) {
    if (cloud.uid) {                               // gerade abgemeldet: Gerät leeren
      const keepLang = store.lang, keepDir = store.dir;
      Object.keys(store).forEach(k => delete store[k]);
      Object.assign(store, JSON.parse(JSON.stringify(DEFAULTS)), { lang: keepLang, dir: keepDir });
      saveLocal(); rebuildCards(); refresh(); startSession();
    }
    cloud.uid = null; cloud.ok = false; cloud.email = '';
    stopBoard(); setSync('local'); renderProfile(); renderBoard();
    return;
  }
  cloud.uid = user.uid; cloud.email = user.email || '';
  try {
    const [us, sc] = await Promise.all([F.getDoc(F.doc(db, 'users', user.uid)), F.getDoc(F.doc(db, 'scores', user.uid))]);
    if (us.exists()) {
      const d = us.data();
      let ex = []; try { ex = JSON.parse(d.extraJson || '[]'); } catch (e) {}
      const have = new Set(store.extra.map(w => w.lang + SEP + w.front + SEP + w.back));
      ex.forEach(w => { if (!have.has(w.lang + SEP + w.front + SEP + w.back)) store.extra.push(w); });
      if (d.dir) store.dir = d.dir;
      if (d.nick) store.nick = d.nick;
      if (d.lang) store.lang = d.lang;
      if (d.pushLang) store.pushLang = d.pushLang;
    }
    if (sc.exists()) {
      const d = sc.data();
      store.xp = Math.max(store.xp || 0, d.xp || 0);
      if ((d.lastDay || '') >= (store.lastDay || '')) { store.lastDay = d.lastDay || ''; store.streak = d.streak || 0; }
      if (!store.nick && d.nick) store.nick = d.nick;
    }
    const progSnap = await F.getDocs(F.collection(db, 'users', user.uid, 'prog'));
    progSnap.forEach(p => {
      const d = p.data(); if (!d.lang) return;
      let pr = {}; try { pr = JSON.parse(d.json || '{}'); } catch (e) {}
      for (const k in pr) store.prog[d.lang + SEP + k] = pr[k];
    });
    cloud.ok = true;
    saveLocal();
    const langsWithProg = new Set(Object.keys(store.prog).map(k => k.split(SEP)[0]));
    writeDoc('users/' + cloud.uid, userBody, 200);
    langsWithProg.forEach(l => writeDoc('users/' + cloud.uid + '/prog/' + lk(l), () => progBody(l), 300));
    writeDoc('scores/' + cloud.uid, scoreBody, 400);
    setSync('ok');
  } catch (e) {
    setSync('err');
  }
  startBoard();
  setupForegroundPush();
  renderProfile();
  if (store.lang && store.lang !== lang && allLangs().includes(store.lang)) loadLang(store.lang);
  else { rebuildCards(); refresh(); }
}

function authError(e) {
  const c = (e && e.code) || '';
  if (/invalid-credential|wrong-password|user-not-found|invalid-login/.test(c)) return 'E-Mail oder Passwort stimmt nicht.';
  if (c.includes('email-already-in-use')) return 'Diese E-Mail ist schon registriert. Melde dich einfach an.';
  if (c.includes('weak-password')) return 'Das Passwort braucht mindestens 6 Zeichen.';
  if (c.includes('invalid-email')) return 'Bitte gib eine gültige E-Mail-Adresse ein.';
  if (c.includes('too-many-requests')) return 'Zu viele Versuche. Warte kurz und probier es dann nochmal.';
  if (c.includes('network-request-failed')) return 'Keine Internetverbindung. Versuch es gleich nochmal.';
  return 'Das hat nicht geklappt (' + (c || 'unbekannter Fehler') + ').';
}

/* ---------- Rangliste ---------- */
let board = [], boardUnsub = null;
function startBoard() {
  if (boardUnsub || !cloud.fb || !cloud.uid) return;
  const { F, db } = cloud.fb;
  boardUnsub = F.onSnapshot(F.query(F.collection(db, 'scores'), F.orderBy('xp', 'desc'), F.limit(50)),
    snap => { board = snap.docs.map(d => Object.assign({ id: d.id }, d.data())); if (!$('viewBoard').hidden) renderBoard(); },
    () => { $('board').innerHTML = '<li class="empty">Die Rangliste ist gerade nicht erreichbar.</li>'; });
}
function stopBoard() { if (boardUnsub) boardUnsub(); boardUnsub = null; board = []; }
function renderBoard() {
  const ul = $('board');
  if (!HAS_FIREBASE) { ul.innerHTML = '<li class="empty">Die Rangliste gibt es, sobald Firebase eingerichtet ist.</li>'; return; }
  if (!cloud.uid) { ul.innerHTML = '<li class="empty">Melde dich an, um die Rangliste zu sehen.</li>'; return; }
  const rows = board.map(r => r.id === cloud.uid ? Object.assign({}, r, scoreBody()) : r);
  if (!rows.some(r => r.id === cloud.uid)) rows.push(Object.assign({ id: cloud.uid }, scoreBody()));
  rows.sort((a, b) => (b.xp || 0) - (a.xp || 0));
  ul.innerHTML = '';
  rows.forEach((r, i) => {
    const li = document.createElement('li'); if (r.id === cloud.uid) li.className = 'mine';
    const rank = document.createElement('span'); rank.className = 'rank'; rank.textContent = i + 1;
    const av = document.createElement('span'); av.className = 'avatar sm initial'; av.textContent = (r.nick || '?').trim().charAt(0).toUpperCase() || '?';
    const who = document.createElement('div'); who.className = 'who';
    const nm = document.createElement('b'); nm.textContent = (r.nick || 'Robbe ohne Namen') + (r.id === cloud.uid ? ' (du)' : '');
    const sub = document.createElement('span'); sub.textContent = `${liveStreak(r.streak, r.lastDay)} Tage Serie · ${r.known || 0} gekonnt${r.lang ? ' · ' + r.lang : ''}`;
    who.append(nm, sub);
    const pts = document.createElement('div'); pts.className = 'pts'; pts.innerHTML = `${r.xp || 0}<small>Punkte</small>`;
    li.append(rank, av, who, pts); ul.appendChild(li);
  });
}

/* ---------- Profil ---------- */
function renderProfile() {
  const signedIn = !!cloud.uid;
  $('noCloud').hidden = HAS_FIREBASE;
  $('authForm').hidden = !HAS_FIREBASE || signedIn;
  $('signedIn').hidden = !signedIn;
  $('pushPanel').hidden = !signedIn;
  if (!signedIn) return;
  $('meName').textContent = store.nick || cloud.email || 'Robbe ohne Namen';
  $('meHint').textContent = store.nick ? `Angemeldet als ${cloud.email}` : 'Wähle einen Spitznamen für die Rangliste.';
  if (document.activeElement !== $('nickInput')) $('nickInput').value = store.nick || '';
  $('meStats').innerHTML = `<span class="x"><b>${store.xp || 0}</b>Punkte</span><span class="f"><b>${liveStreak(store.streak, store.lastDay)}</b>Tage Serie</span><span class="k"><b>${knownTotal()}</b>gekonnt</span>`;
  $('pushMode').value = store.pushLang || 'abwechselnd';
  renderPushState();
}

/* ---------- Push ---------- */
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
function renderPushState() {
  const hint = $('pushHint'), btn = $('pushBtn');
  const active = lsGet('robbi.pushToken') && 'Notification' in window && Notification.permission === 'granted';
  btn.hidden = !!active;
  if (active) hint.textContent = 'Auf diesem Gerät eingeschaltet. Die Sprache kannst du oben jederzeit ändern.';
  else if (isIOS && !isStandalone()) hint.textContent = 'iPhone: Lege Robbi zuerst auf den Home-Bildschirm (Safari → Teilen → „Zum Home-Bildschirm“) und öffne ihn von dort. Erst dann darf er dir Nachrichten schicken.';
  else if ('Notification' in window && Notification.permission === 'denied') hint.textContent = 'Benachrichtigungen sind für Robbi blockiert. Erlaube sie in den Einstellungen deines Browsers oder Handys.';
  else hint.textContent = 'Tippe auf den Knopf und erlaube die Benachrichtigungen.';
}
async function enablePush() {
  const msg = $('pushMsg');
  if (!('Notification' in window) || !('serviceWorker' in navigator)) { msg.textContent = 'Dieser Browser kann keine Push-Nachrichten empfangen.'; return; }
  if (isIOS && !isStandalone()) { renderPushState(); msg.textContent = 'Zuerst auf den Home-Bildschirm legen (siehe oben).'; return; }
  if (!self.FIREBASE_VAPID_KEY || String(self.FIREBASE_VAPID_KEY).startsWith('DEIN')) { msg.textContent = 'Der Web-Push-Schlüssel fehlt noch in firebase-config.js (siehe Anleitung).'; return; }
  msg.textContent = 'Einen Moment …';
  try {
    const M = await import(FB + 'firebase-messaging.js');
    if (!(await M.isSupported())) { msg.textContent = 'Dieser Browser kann keine Push-Nachrichten empfangen.'; return; }
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { msg.textContent = 'Ohne Erlaubnis kann Robbi dir nichts schicken.'; renderPushState(); return; }
    const reg = await navigator.serviceWorker.ready;
    const token = await M.getToken(M.getMessaging(cloud.fb.app), { vapidKey: self.FIREBASE_VAPID_KEY, serviceWorkerRegistration: reg });
    const { F, db } = cloud.fb;
    await F.setDoc(F.doc(db, 'users', cloud.uid), { fcmTokens: F.arrayUnion(token), pushLang: store.pushLang }, { merge: true });
    lsSet('robbi.pushToken', token);
    msg.textContent = 'Eingeschaltet! Ab heute Abend schickt dir Robbi einen Spruch.';
    setupForegroundPush();
  } catch (e) {
    msg.textContent = 'Das hat nicht geklappt: ' + ((e && e.message) || e);
  }
  renderPushState();
}
let fgPush = false;
async function setupForegroundPush() {
  if (fgPush || !cloud.fb || !('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const M = await import(FB + 'firebase-messaging.js');
    if (!(await M.isSupported())) return;
    fgPush = true;
    M.onMessage(M.getMessaging(cloud.fb.app), p => { if (p.notification) setMood(p.notification.body, true, 'bounce'); });
  } catch (e) {}
}

/* ---------- Laden ---------- */
function allLangs() {
  const s = new Set(Object.keys(fileLangs));
  store.extra.forEach(w => s.add(w.lang));
  return [...s];
}
async function fetchText(path) {
  const r = await fetch(path, { cache: 'no-cache' });
  if (!r.ok) throw new Error(path);
  return r.text();
}
function rebuildCards() {
  cards = parse(texts[lang] || '', lang).concat(store.extra.filter(w => w.lang === lang).map(w => Object.assign({ mine: true }, w)));
}
async function loadLang(l) {
  lang = l; store.lang = l; persist('user');
  if (fileLangs[l] && texts[l] === undefined) {
    try { texts[l] = await fetchText(fileLangs[l]); } catch (e) { texts[l] = ''; }
  }
  rebuildCards();
  cat = '*'; if (mode !== 'all' && !countMode(mode)) mode = 'all';
  refresh(); startSession();
}
async function init() {
  try {
    for (const line of (await fetchText('sprachen.txt')).split(/\r?\n/)) {
      const l = line.trim(); if (!l || l[0] === '#') continue;
      const [n, f] = l.split(';').map(s => s.trim()); if (n && f) fileLangs[n] = f;
    }
  } catch (e) { fileLangs = {}; }
  const langs = allLangs();
  if (!langs.length) { $('fWord').textContent = 'Keine Wortlisten gefunden'; setMood('Hier fehlen die Wortlisten.', false); }
  else await loadLang(langs.includes(store.lang) ? store.lang : langs[0]);
  initFirebase();
}

/* ---------- Zählen ---------- */
function inMode(c, m) { const s = stateOf(c); return m === 'all' || (m === 'new' ? s === 'n' : s === m); }
function pool(m, ct) { return cards.filter(c => (ct === '*' || c.cat === ct) && inMode(c, m)); }
function countMode(m, ct = '*') { return pool(m, ct).length; }
function catsOf(list) { return [...new Set(list.map(c => c.cat))]; }

/* ---------- Oberfläche ---------- */
function renderLangSelect() {
  const sel = $('langSelect'); sel.innerHTML = '';
  allLangs().forEach(l => { const o = document.createElement('option'); o.value = o.textContent = l; sel.appendChild(o); });
  sel.value = lang;
}
function chip(box, text, n, pressed, cls, onclick) {
  const b = document.createElement('button'); b.className = 'chip' + (cls ? ' ' + cls : '');
  b.setAttribute('aria-pressed', pressed);
  b.innerHTML = esc(text) + (n === null ? '' : `<span class="n">${n}</span>`);
  b.onclick = onclick; box.appendChild(b);
}
function updateBadge() { const w = countMode('f'); $('wrongBadge').hidden = !w; $('wrongBadge').textContent = w; }
function renderChips() {
  const cats = catsOf(cards);
  if (cat !== '*' && !cats.includes(cat)) cat = '*';
  const cb = $('catChips'); cb.innerHTML = '';
  chip(cb, 'Alles', countMode(mode), cat === '*', '', () => { cat = '*'; renderChips(); startSession(); });
  cats.forEach(c => chip(cb, c, countMode(mode, c), cat === c, '', () => { cat = c; renderChips(); startSession(); }));
  const mb = $('modeChips'); mb.innerHTML = '';
  MODES.forEach(([v, t]) => chip(mb, t, countMode(v, cat), mode === v, v === 'f' ? 'wrong' : v === 'k' ? 'known' : '',
    () => { mode = v; renderChips(); startSession(); }));
  const db = $('dirChips'); db.innerHTML = '';
  DIRS.forEach(([v, t]) => chip(db, t.replace('?', lang), null, store.dir === v, '', () => { store.dir = v; persist('user'); renderChips(); startSession(); }));
  updateBadge();
}
function renderKey() {
  const p = PRON[lang];
  $('keyPanel').hidden = !p;
  if (!p) return;
  $('keyIntro').textContent = p.intro;
  const t = $('keyTable'); t.innerHTML = '';
  p.key.forEach(([a, b]) => { const x = document.createElement('b'); x.textContent = a; const y = document.createElement('span'); y.textContent = b; t.append(x, y); });
}
function refresh() {
  renderLangSelect(); renderChips(); renderKey(); renderStage();
  if (!$('viewRepeat').hidden) renderRepeat();
  if (!$('viewWords').hidden) renderWords();
  if (!$('viewBoard').hidden) { renderProfile(); renderBoard(); }
}

/* ---------- Lernen ---------- */
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function startSession() {
  const list = pool(mode, cat);
  queue = shuffle(list.map(c => ({ c, rev: store.dir === 'd' || (store.dir === 'm' && Math.random() < .5), seen: false })));
  total = queue.length; done = 0; firstRight = 0; firstSeen = 0; sessionXp = 0;
  $('session').hidden = false; $('endView').hidden = true;
  showCard();
}
let lockUntil = 0;
function showCard(animate) {
  const card = $('card');
  card.classList.add('instant');                  // ohne Rück-Drehung auf die neue Karte
  card.classList.remove('flipped'); flipped = false;
  requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove('instant')));
  if (animate && !reduceMotion && $('scene').animate) $('scene').animate([{ transform: 'translateX(18px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 200, easing: 'ease-out' });
  $('flipActions').hidden = false; $('rateActions').hidden = true;
  $('count').textContent = `${done} / ${total}`;
  $('barFill').style.width = total ? (done / total * 100) + '%' : '0';
  $('score').textContent = sessionXp ? `+${sessionXp} Punkte` : '';
  if (!queue.length) { total ? endSession() : emptyState(); return; }
  const { c, rev } = queue[0];
  const q = rev ? c.back : c.front, a = rev ? c.front : c.back;
  $('bCat').textContent = c.cat; $('bLang').textContent = rev ? lang : 'Deutsch';
  $('bWord').textContent = a; $('bWord').classList.toggle('long', a.length > 26);
  const ra = rev ? readAid(a, lang) : ''; $('bRead').textContent = ra ? 'Lies etwa: ' + ra : '';
  $('bNote').textContent = c.note ? 'Tipp: ' + c.note : '';
  $('fCat').textContent = c.cat; $('fLang').textContent = rev ? 'Deutsch' : lang;
  $('fWord').textContent = q; $('fWord').classList.toggle('long', q.length > 26);
  const rq = rev ? '' : readAid(q, lang); $('fRead').textContent = rq ? 'Lies etwa: ' + rq : '';
  const s = stateOf(c);
  $('fState').className = 'state ' + s;
  $('fState').textContent = s === 'f' ? 'war falsch' : s === 'k' ? 'gekonnt' : 'neu';
  card.setAttribute('aria-label', `Karte: ${q}. Tippen zum Umdrehen.`);
}
function emptyState() {
  $('fCat').textContent = ''; $('fLang').textContent = ''; $('fState').className = 'state'; $('fState').textContent = '';
  $('fWord').classList.remove('long'); $('fRead').textContent = '';
  $('fWord').textContent = mode === 'f' ? 'Keine falschen Karten. Super!' : mode === 'k' ? 'Noch nichts gekonnt. Lern erst ein paar Karten!' : mode === 'new' ? 'Alle Karten schon gelernt!' : 'Noch keine Wörter hier';
  $('flipActions').hidden = true;
}
function flip() {
  if (!queue.length || performance.now() < lockUntil) return;   // Doppeltipp nach "Gewusst" ignorieren
  flipped = !flipped;
  $('card').classList.toggle('flipped', flipped);
  if (flipped) { $('flipActions').hidden = true; $('rateActions').hidden = false; }
}
function answer(ok) {
  if (!flipped || !queue.length) return;
  const item = queue.shift();
  const first = !item.seen;
  if (first) {
    item.seen = true; firstSeen++; if (ok) firstRight++;
    store.prog[keyOf(item.c)] = ok ? 'k' : 'f';
  }
  const gain = ok ? (first ? 10 : 3) : 1;
  store.xp = (store.xp || 0) + gain; sessionXp += gain;
  touchStreak();
  persist(first ? ['prog', 'score'] : ['score']);
  if (ok) { done++; setMood(cheer(), true, 'bounce'); }
  else {
    queue.splice(Math.min(queue.length, 3), 0, item);   // kommt in 3 Karten wieder
    setMood('Kein Problem, die kommt gleich nochmal.', false, 'shake');
  }
  updateBadge();
  lockUntil = performance.now() + 350;
  showCard(true);
}
function endSession() {
  $('session').hidden = true; $('endView').hidden = false;
  const pct = firstSeen ? Math.round(firstRight / firstSeen * 100) : 0;
  $('endPct').textContent = pct + '%';
  $('endText').textContent = `${firstRight} von ${firstSeen} Karten auf Anhieb, +${sessionXp} Punkte. Serie: ${liveStreak(store.streak, store.lastDay)} Tage.`;
  const w = countMode('f');
  $('endWrongBtn').disabled = !w; $('endWrongBtn').textContent = w ? `Falsche üben (${w})` : 'Keine Fehler offen';
  renderChips();
  setMood(pct >= 80 ? actor().praise : 'Wiederholen macht den Meister!', true, 'bounce');
}
function practice(m, ct) { mode = m; cat = ct || '*'; showTab('learn'); renderChips(); startSession(); }

/* ---------- Wiederholen ---------- */
function stackHtml(ct) {
  const t = countMode('all', ct) || 1;
  return `<span class="k" style="width:${countMode('k', ct) / t * 100}%"></span><span class="f" style="width:${countMode('f', ct) / t * 100}%"></span>`;
}
function renderRepeat() {
  const k = countMode('k'), f = countMode('f'), n = countMode('new');
  $('repTitle').textContent = `Dein Fortschritt in ${lang}`;
  $('repStack').innerHTML = stackHtml('*');
  $('repLegend').innerHTML = `<span class="k"><b>${k}</b>gekonnt</span><span class="f"><b>${f}</b>falsch</span><span class="n"><b>${n}</b>neu</span>`;
  $('repWrongBtn').disabled = !f; $('repWrongBtn').textContent = `Falsche üben (${f})`;
  $('repKnownBtn').disabled = !k; $('repKnownBtn').textContent = `Gekonnte wiederholen (${k})`;
  const ul = $('repRows'); ul.innerHTML = '';
  catsOf(cards).forEach(ct => {
    const kc = countMode('k', ct), fc = countMode('f', ct), all = countMode('all', ct);
    const li = document.createElement('li');
    li.innerHTML = `<span class="name">${esc(ct)}</span><span class="nums">${kc} ✓ · ${fc} ✗ · ${all}</span><div class="stack thin">${stackHtml(ct)}</div><div class="btns"></div>`;
    const btns = li.querySelector('.btns');
    const b1 = document.createElement('button'); b1.className = 'btn again small'; b1.textContent = `Falsche (${fc})`; b1.disabled = !fc; b1.onclick = () => practice('f', ct);
    const b2 = document.createElement('button'); b2.className = 'btn good small'; b2.textContent = `Gekonnte (${kc})`; b2.disabled = !kc; b2.onclick = () => practice('k', ct);
    const b3 = document.createElement('button'); b3.className = 'btn quiet small'; b3.textContent = 'Alle'; b3.onclick = () => practice('all', ct);
    btns.append(b1, b2, b3); ul.appendChild(li);
  });
  const r = $('resetBtn'); delete r.dataset.armed; r.textContent = `Fortschritt in ${lang} zurücksetzen`;
}

/* ---------- Wörter ---------- */
function renderWords() {
  const q = $('search').value.trim().toLowerCase();
  const box = $('wordList'); box.innerHTML = '';
  const list = cards.filter(c => !q || (c.front + ' ' + c.back + ' ' + c.note).toLowerCase().includes(q));
  if (!list.length) box.innerHTML = '<p class="hint">Nichts gefunden.</p>';
  const frag = document.createDocumentFragment();
  catsOf(list).forEach(ct => {
    const g = document.createElement('div'); g.className = 'group';
    g.innerHTML = `<h3>${esc(ct)}</h3>`;
    const ul = document.createElement('ul'); ul.className = 'list';
    list.filter(c => c.cat === ct).forEach(c => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="dot ${stateOf(c)}"></span><span class="f">${esc(c.front)}</span><span class="d">${esc(c.back)}${c.mine ? ' <span class="mine">· von dir</span>' : ''}</span>`;
      if (c.mine) {
        const d = document.createElement('button'); d.className = 'del'; d.type = 'button'; d.textContent = 'Löschen';
        d.onclick = () => {
          if (!d.dataset.armed) { d.dataset.armed = 1; d.textContent = 'Wirklich?'; return; }
          const i = store.extra.findIndex(w => w.lang === c.lang && w.cat === c.cat && w.front === c.front && w.back === c.back);
          if (i > -1) store.extra.splice(i, 1); persist('user'); rebuildCards(); refresh();
        };
        li.appendChild(d);
      }
      ul.appendChild(li);
    });
    g.appendChild(ul); frag.appendChild(g);
  });
  box.appendChild(frag);
  const sel = $('addCat'), prev = sel.value; sel.innerHTML = '';
  catsOf(cards).concat(['+ Neues Thema']).forEach(ct => { const o = document.createElement('option'); o.value = o.textContent = ct; sel.appendChild(o); });
  if ([...sel.options].some(o => o.value === prev)) sel.value = prev;
  $('newCatWrap').hidden = sel.value !== '+ Neues Thema';
  $('addFrontLabel').textContent = `${lang} (lateinisch)`;
  if (!$('impLang').value) $('impLang').value = lang;
  $('expText').value = exportText();
}
function exportText() {
  let out = '', last = null;
  store.extra.filter(w => w.lang === lang).forEach(w => {
    if (w.cat !== last) { out += `\n[${w.cat}]\n`; last = w.cat; }
    out += `${w.front} ; ${w.back}${w.note ? ' ; ' + w.note : ''}\n`;
  });
  return out.trim() ? out.trim() + '\n' : '';
}
const clean = s => s.replace(/;/g, ',').trim();

/* ---------- Tabs & Ereignisse ---------- */
function showTab(t) {
  [['learn', 'tabLearn', 'viewLearn'], ['repeat', 'tabRepeat', 'viewRepeat'], ['board', 'tabBoard', 'viewBoard'], ['words', 'tabWords', 'viewWords']].forEach(([n, tab, view]) => {
    $(tab).setAttribute('aria-selected', n === t); $(view).hidden = n !== t;
  });
  if (t === 'repeat') renderRepeat();
  if (t === 'words') renderWords();
  if (t === 'board') { renderProfile(); renderBoard(); }
  if (t === 'learn') renderChips();
}
$('tabLearn').onclick = () => showTab('learn');
$('tabRepeat').onclick = () => showTab('repeat');
$('tabBoard').onclick = () => showTab('board');
$('tabWords').onclick = () => showTab('words');
$('sync').onclick = () => showTab('board');
$('langSelect').onchange = e => { $('impLang').value = e.target.value; loadLang(e.target.value).then(() => setMood(`Wir lernen ${lang}!`, true, 'bounce')); };
$('card').onclick = flip; $('flipBtn').onclick = flip;
$('againBtn').onclick = () => answer(false); $('knewBtn').onclick = () => answer(true);
$('restartBtn').onclick = () => startSession();
$('endWrongBtn').onclick = () => practice('f', '*');
$('repWrongBtn').onclick = () => practice('f', '*');
$('repKnownBtn').onclick = () => practice('k', '*');
$('resetBtn').onclick = () => {
  const r = $('resetBtn');
  if (!r.dataset.armed) { r.dataset.armed = 1; r.textContent = 'Wirklich alles vergessen? Nochmal tippen.'; return; }
  cards.forEach(c => delete store.prog[keyOf(c)]); persist(['prog', 'score'], 0);
  renderRepeat(); renderChips(); setMood('Alles auf Anfang. Los geht\'s!', true, 'bounce');
};

/* Anmeldung */
$('authForm').onsubmit = async e => {
  e.preventDefault();
  $('authMsg').textContent = 'Melde an …';
  try { await cloud.fb.A.signInWithEmailAndPassword(cloud.fb.auth, $('authEmail').value.trim(), $('authPass').value); $('authMsg').textContent = ''; }
  catch (err) { $('authMsg').textContent = authError(err); }
};
$('registerBtn').onclick = async () => {
  const email = $('authEmail').value.trim(), pw = $('authPass').value;
  if (!email || pw.length < 6) { $('authMsg').textContent = 'Gib eine E-Mail und ein Passwort mit mindestens 6 Zeichen ein.'; return; }
  $('authMsg').textContent = 'Lege dein Konto an …';
  try { await cloud.fb.A.createUserWithEmailAndPassword(cloud.fb.auth, email, pw); $('authMsg').textContent = ''; setMood('Willkommen! Wähl dir einen Spitznamen.', true, 'bounce'); }
  catch (err) { $('authMsg').textContent = authError(err); }
};
$('resetPwBtn').onclick = async () => {
  const email = $('authEmail').value.trim();
  if (!email) { $('authMsg').textContent = 'Gib oben deine E-Mail ein, dann schicke ich dir einen Link.'; return; }
  try { await cloud.fb.A.sendPasswordResetEmail(cloud.fb.auth, email); $('authMsg').textContent = 'Link zum Zurücksetzen ist unterwegs. Schau in dein Postfach (auch im Spam).'; }
  catch (err) { $('authMsg').textContent = authError(err); }
};
$('logoutBtn').onclick = () => cloud.fb.A.signOut(cloud.fb.auth);
$('nickForm').onsubmit = e => {
  e.preventDefault();
  const n = $('nickInput').value.replace(/\s+/g, ' ').trim().slice(0, 24);
  if (!n) return;
  store.nick = n; persist(['user', 'score'], 0);
  renderProfile(); renderBoard(); setMood(`Hallo ${n}!`, true, 'bounce');
};
$('pushMode').onchange = () => {
  store.pushLang = $('pushMode').value; persist('user', 0);
  $('pushMsg').textContent = store.pushLang === 'aus' ? 'Keine Sprüche mehr. Du kannst es jederzeit wieder einschalten.' : 'Gespeichert.';
};
$('pushBtn').onclick = enablePush;

/* Tastatur */
document.addEventListener('keydown', e => {
  if ($('viewLearn').hidden || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
  else if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowRight') answer(true);
  else if (e.key === 'n' || e.key === 'N' || e.key === 'ArrowLeft') answer(false);
});

/* Wörter */
$('search').oninput = renderWords;
$('addCat').onchange = () => { $('newCatWrap').hidden = $('addCat').value !== '+ Neues Thema'; };
$('addForm').onsubmit = e => {
  e.preventDefault();
  const ct = $('addCat').value === '+ Neues Thema' ? clean($('addNewCat').value) : $('addCat').value;
  const front = clean($('addFront').value), back = clean($('addBack').value), note = clean($('addNote').value);
  if (!ct) { $('addMsg').textContent = 'Gib dem neuen Thema einen Namen.'; return; }
  if (!front || !back) { $('addMsg').textContent = 'Beide Seiten brauchen Text.'; return; }
  store.extra.push({ lang, cat: ct, front, back, note }); persist('user', 0);
  $('addFront').value = $('addBack').value = $('addNote').value = $('addNewCat').value = '';
  $('addMsg').textContent = `Gespeichert: ${front} = ${back}`;
  rebuildCards(); refresh(); $('addCat').value = ct; $('newCatWrap').hidden = true; $('addFront').focus();
  setMood('Ein neues Wort für mich!', true, 'bounce');
};
$('impBtn').onclick = () => {
  const l = $('impLang').value.trim() || lang;
  const words = parse($('impText').value, l);
  if (!words.length) { $('impMsg').textContent = 'Keine Wörter erkannt. Jede Zeile braucht ein Semikolon: fremd ; deutsch'; return; }
  store.extra.push(...words); persist('user', 0);
  $('impText').value = '';
  $('impMsg').textContent = `${words.length} Wörter für ${l} gespeichert.`;
  loadLang(l);
};
$('copyBtn').onclick = () => {
  const t = $('expText');
  if (!t.value) { $('copyMsg').textContent = 'Du hast noch keine eigenen Wörter.'; return; }
  const fallback = () => { t.select(); $('copyMsg').textContent = 'Text markiert. Jetzt kopieren.'; };
  try { navigator.clipboard.writeText(t.value).then(() => { $('copyMsg').textContent = 'Kopiert.'; }, fallback); } catch (e) { fallback(); }
};

/* Installieren als App */
let installEvt = null;
function showInstall() {
  if (isStandalone() || lsGet('robbi.installDismissed')) return;
  if (installEvt) { $('installText').textContent = 'Robbi als App auf den Startbildschirm legen?'; $('installBtn').hidden = false; $('installBar').hidden = false; }
  else if (isIOS) { $('installText').textContent = 'Als App nutzen: Tippe in Safari auf Teilen und dann „Zum Home-Bildschirm“.'; $('installBtn').hidden = true; $('installBar').hidden = false; }
}
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; showInstall(); });
$('installBtn').onclick = async () => { if (!installEvt) return; installEvt.prompt(); await installEvt.userChoice; installEvt = null; $('installBar').hidden = true; };
$('installClose').onclick = () => { lsSet('robbi.installDismissed', true); $('installBar').hidden = true; };
window.addEventListener('pagehide', saveLocal);
document.addEventListener('visibilitychange', () => { if (document.hidden) saveLocal(); });
for (const l in ACTORS) ACTORS[l].btn.onclick = () => {
  if (lang === l) return poke(ACTORS[l]);                 // angetippt: zwinkern, winken/Tee, Spruch
  if (!allLangs().includes(l)) return;
  $('impLang').value = l;
  loadLang(l).then(() => poke(ACTORS[l]));               // den anderen antippen: Sprache wechseln
};
window.addEventListener('online', () => { if (cloud.ok) setSync('ok'); });

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
showInstall();
Object.values(ACTORS).forEach(lifeLoop);
init();
