/* Robbi Sprachtrainer – Web-App
 * Wörter: sprachen.txt + farsi.txt, griechisch.txt ... (dieselben Dateien wie beim PC-Programm)
 * Speicher: Firebase (Anmeldung, Fortschritt, Rangliste, Push) + lokal als Zwischenspeicher.
 */

import { initGames } from './games.js?v=31';

const FB = 'https://www.gstatic.com/firebasejs/10.12.2/';
const CFG = self.FIREBASE_CONFIG;
const HAS_FIREBASE = !!(CFG && CFG.apiKey && !String(CFG.apiKey).startsWith('DEIN'));

/* ---------- Lokaler Speicher ---------- */
const KEY = 'robbi.v3';
const DEFAULTS = { extra: [], prog: {}, lang: '', dir: 'd', nick: '', xp: 0, streak: 0, lastDay: '', pushLang: 'abwechselnd',
  days: {}, goalMin: 30, goalDate: '2026-12-31', doneDay: '', newDay: { d: '', n: 0 },
  stats: {}, badges: {}, outfit: { hat: '', face: '' }, duelsCounted: {}, testLog: [], weeklyTest: true };
function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
const store = Object.assign({}, DEFAULTS, lsGet(KEY) || {});
/* Der Lernstand (prog) liegt pro Sprache in einem eigenen Speicherplatz. So wird beim Speichern
   nur die geänderte Sprache geschrieben – ein großer Speicher-Block auf einmal ließ das iPhone stocken. */
const PKEY = KEY + '.p.';
const progSaved = {};
(function loadProg() {
  store.prog = Object.assign({}, store.prog || {});
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i); if (!k || !k.startsWith(PKEY)) continue;
      const l = k.slice(PKEY.length), raw = localStorage.getItem(k), part = JSON.parse(raw) || {};
      for (const s in part) store.prog[l + '\u0001' + s] = part[s];
      progSaved[l] = raw;
    }
  } catch (e) {}
})();
function saveLocal() {
  mark('Speichern im Handy');
  clearTimeout(localTimer); localTimer = null; firstPending = 0;
  const byLang = {};
  for (const k in store.prog) { const i = k.indexOf('\u0001'), l = k.slice(0, i); (byLang[l] = byLang[l] || {})[k.slice(i + 1)] = store.prog[k]; }
  try {
    for (const l in byLang) { const raw = JSON.stringify(byLang[l]); if (progSaved[l] !== raw) { localStorage.setItem(PKEY + l, raw); progSaved[l] = raw; } }
    for (const l in progSaved) if (!byLang[l]) { localStorage.removeItem(PKEY + l); delete progSaved[l]; }
  } catch (e) {}
  const rest = Object.assign({}, store); delete rest.prog;
  lsSet(KEY, rest);
}
let localTimer = null, firstPending = 0;
// Gespeichert wird in einer kleinen Pause (2,5 s ohne Antippen), spätestens nach 20 s – und immer beim Verlassen der App
function saveLocalSoon() {
  const now = Date.now(); if (!firstPending) firstPending = now;
  clearTimeout(localTimer);
  localTimer = setTimeout(saveLocal, now - firstPending > 20000 ? 0 : 2500);
}

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
const keyOf = c => c._k || (c._k = c.lang + SEP + c.front + SEP + c.back);   // einmal pro Karte berechnet
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
  },
  Italienisch: {
    intro: 'Italienisch spricht man fast so, wie man es schreibt. "Lies etwa" zeigt, wie du es als Deutschsprachige(r) lesen musst.',
    fn: s => s.toLowerCase().replace(/sch|sci(?=[aou])|sc(?=[eiéèì])|cci(?=[aou])|cc(?=[eiéèì])|ci(?=[aou])|c(?=[eiéèì])|ch|ggi(?=[aou])|gg(?=[eiéèì])|gli(?=[aeouàèòù])|gli|gn|gi(?=[aou])|g(?=[eiéèì])|gh|qu|c|zz|z|v|h/g, m => ({
      sch: 'sk', sci: 'sch', sc: 'sch', cci: 'ttsch', cc: 'ttsch', ci: 'tsch', c: 'k', ch: 'k', ggi: 'ddsch', gg: 'ddsch',
      gli: m.length === 3 ? 'lj' : 'lji', gn: 'nj', gi: 'dsch', g: 'dsch', gh: 'g', qu: 'kw', zz: 'ts', z: 'ts', v: 'w', h: '' }[m])),
    key: [['c vor e/i', 'tsch – ciao = tschao, cena = tschena'], ['c sonst, ch', 'k – casa, che = ke'], ['g vor e/i', 'dsch – gelato = dschelato'], ['gh', 'g – spaghetti'],
      ['gn', 'nj – bagno = banjo'], ['gli', 'lj – famiglia = familja'], ['sc vor e/i', 'sch – pesce = pesche'], ['sch', 'sk – schiena'], ['z', 'ts oder ds – pizza, zero'],
      ['v', 'w – vino = wino'], ['h', 'stumm – ho = o'], ['qu', 'kw – quanto'], ['Doppelte', 'länger sprechen – pala ≠ palla'], ['à è ì ò ù', 'hier betonen – città, perché']]
  },
  Spanisch: {
    intro: 'Spanisch spricht man fast so, wie man es schreibt. "Lies etwa" zeigt, wie du es als Deutschsprachige(r) lesen musst. In Spanien klingt "c" vor e/i und "z" wie engl. "th", in Lateinamerika wie "s".',
    fn: s => s.toLowerCase().replace(/ch|ll|ñ|qu|gu(?=[eiéí])|gü|g(?=[eiéí])|c(?=[eiéí])|c|z|j|h|v|y/g, (m, i, str) => {
      if (m === 'y') return /[aeiouáéíóú]/.test(str[i + 1] || '') ? 'j' : 'i';
      return { ch: 'tsch', ll: 'j', 'ñ': 'nj', qu: 'k', gu: 'g', 'gü': 'gw', g: 'ch', c: m === 'c' && /[eiéí]/.test(str[i + 1] || '') ? 's' : 'k', z: 's', j: 'ch', h: '', v: 'b' }[m];
    }),
    key: [['c vor e/i, z', 'wie engl. "th" (Spanien) bzw. s (Lateinamerika) – gracias'], ['c sonst', 'k – casa'], ['ch', 'tsch – chico'], ['j, g vor e/i', 'ch wie in "Bach" – jamón, gente'],
      ['gue / gui', 'ge / gi, das u ist stumm – guitarra'], ['ll', 'j wie in "ja" – calle = kaje'], ['ñ', 'nj – mañana = manjana'], ['qu', 'k – queso'], ['h', 'stumm – hola = ola'],
      ['v', 'fast wie b – vino'], ['y', 'j – yo; allein "y" = i'], ['r / rr', 'kurz / lang gerollt – pero ≠ perro'], ['á é í ó ú', 'diese Silbe betonen']]
  },
  Französisch: {
    intro: 'Französisch spricht man anders, als man es schreibt – die meisten Endungen sind stumm. "Lies etwa" zeigt ungefähr, wie es klingt. "ang", "ong" und "äng" sind Nasenlaute: das g hört man kaum.',
    fn: s => s.toLowerCase().split(/([^a-zàâäçéèêëîïôöûùüÿœæ]+)/).map(frWord).join(''),
    key: [['Endungen', 'meist stumm: -e, -s, -t, -d, -x – petit = peti'], ['-er / -ez / -é', 'e – parler = parle, chez = sche'], ['-et, ai, è, ê', 'ä – mais = mä'],
      ['ou', 'u – vous = wu'], ['u', 'ü – tu = tü'], ['oi', 'oa – moi = moa'], ['au / eau', 'o – beau = bo'], ['eu', 'ö – deux = dö'],
      ['an / en', 'Nasenlaut "ang" – enfant'], ['on', 'Nasenlaut "ong" – bonjour'], ['in / ain / un', 'Nasenlaut "äng" – pain, vin'],
      ['ch', 'sch – chat = scha'], ['j, g vor e/i', 'weiches sch wie in "Journal" – je, rouge'], ['gn', 'nj – montagne'], ['qu', 'k – que = ke'],
      ['ç, c vor e/i', 's – ça, merci'], ['h', 'stumm – hôtel = otel'], ['ille', 'ij – fille = fij'], ['v / z', 'w / weiches s – vin, zéro']]
  }
};
/* Französisch: grobe Lese-Hilfe Wort für Wort */
const FR_WORDS = { les: 'le', des: 'de', mes: 'me', tes: 'te', ses: 'se', ces: 'se', est: 'ä', et: 'e', un: 'äng', une: 'ün', je: 'sche', le: 'le', de: 'de', ne: 'ne', que: 'ke',
  te: 'te', me: 'me', se: 'se', ce: 'se', oui: 'ui', vous: 'wu', nous: 'nu', tu: 'tü', il: 'il', ils: 'il', elle: 'äl', au: 'o', aux: 'o', eux: 'ö', y: 'i', a: 'a', 'à': 'a',
  en: 'ang', on: 'ong', bien: 'bjäng', 'très': 'trä', plus: 'plü', pas: 'pa', mais: 'mä', avec: 'awäk', pour: 'pur', sur: 'sür', dans: 'dang', chez: 'sche', fils: 'fis',
  monsieur: 'mösjö', femme: 'famm', six: 'sis', dix: 'dis', sept: 'sätt', huit: 'üit', neuf: 'nöf', cinq: 'sängk', vingt: 'wäng', vingts: 'wäng', soixante: 'soasangt', cent: 'sang', mille: 'mil', ville: 'wil',
  tranquille: 'trangkil', c: 's', j: 'sch', qu: 'k', l: 'l', d: 'd', m: 'm', t: 't', s: 's', n: 'n', hier: 'jär', mer: 'mär', cher: 'schär', fer: 'fär', hiver: 'iwär',
  ouais: 'uä', bus: 'büs', sens: 'sangs', fac: 'fak', sac: 'sak', lac: 'lak', avion: 'awjong', quoi: 'koa', pourquoi: 'purkoa', ok: 'okä', cool: 'kul', week: 'uik', wifi: 'uifi' };
function frWord(w) {
  if (!w || !/[a-zà-ÿœæ]/.test(w)) return w;
  if (FR_WORDS[w] !== undefined) return FR_WORDS[w];
  if (w.length > 2) {
    if (/er$/.test(w) && w.length >= 4) w = w.slice(0, -2) + 'é';
    else if (/ez$/.test(w)) w = w.slice(0, -2) + 'é';
    else if (/et$/.test(w)) w = w.slice(0, -2) + 'è';
    else {
      w = w.replace(/[sxzdtp]+$/, '');
      if (w.length > 2) w = w.replace(/ge$/, 'j').replace(/ce$/, 'ç').replace(/([nm])e$/, '$1\u0001').replace(/e$/, '');
    }
  }
  const NV = '(?![aeiouyàâéèêëîïôûùœnm\u0001])';
  return w.replace(new RegExp(['eaux?', 'au', 'ien' + NV, 'oin' + NV, 'oi', 'oy', 'o[uùû]', 'aill', 'eill', 'ail$', 'eil$', '[ae]in' + NV, 'aim' + NV, 'a[iî]', 'e[iî]', 'œu', 'eu', 'œ',
    '(?<=[aeiouéèê])ill', 'ill', 'tion', 'gn', 'ch', 'ph', 'th', 'qu', 'gu(?=[eiéèêy])', 'g(?=[eiéèêy])', 'ç', 'c', 'j', 'h', 'v', 'z', 'y',
    '[ae][nm]' + NV, 'o[nm]' + NV, '[iu][nm]' + NV, 'u', 'é', '[èêë]', '[àâ]', '[îï]', 'ô', '[ûù]'].join('|'), 'g'), (m, off, str) => {
    if (/^ill$/.test(m)) return 'ij';
    if (m === 'aill' || m === 'ail') return 'aj';
    if (m === 'eill' || m === 'eil') return 'äj';
    if (/^o[uùû]$/.test(m)) return 'u';
    if (/^a[iî]$/.test(m) || /^e[iî]$/.test(m)) return 'ä';
    if (m === 'c') return /[eiéèêy]/.test(str[off + 1] || '') ? 's' : 'k';
    const M = { eau: 'o', eaux: 'o', au: 'o', oi: 'oa', oy: 'oaj', ou: 'u', ai: 'ä', ei: 'ä', 'œu': 'ö', eu: 'ö', 'œ': 'ö', tion: 'sjong', gn: 'nj', ch: 'sch', ph: 'f', th: 't',
      qu: 'k', gu: 'g', g: 'sch', 'ç': 's', j: 'sch', h: '', v: 'w', z: 's', y: 'i', u: 'ü', 'é': 'e', 'è': 'ä', 'ê': 'ä', 'ë': 'ä', 'â': 'a', 'à': 'a', 'î': 'i', 'ï': 'i', 'ô': 'o', 'û': 'ü', 'ù': 'ü' };
    if (M[m] !== undefined) return M[m];
    if (/^ien/.test(m)) return 'jäng';
    if (/^oin/.test(m)) return 'oäng';
    if (/^(ain|ein|aim)$/.test(m)) return 'äng';
    if (/^[ae][nm]$/.test(m)) return 'ang';
    if (/^o[nm]$/.test(m)) return 'ong';
    if (/^[iu][nm]$/.test(m)) return 'äng';
    return m;
  }).replace(/\u0001/g, '');
}
function readAid(text, l) {
  const p = PRON[l]; if (!p) return '';
  if (p.fn) { const o = p.fn(text); return o === text.toLowerCase() ? '' : o; }
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
const ROUND = 20;
/* ---------- Technik-Info: merkt sich Hänger (Bild stand länger als 0,3 s) und was gerade lief ---------- */
var diag = { marks: [], stalls: [] };
function mark(what) { diag.marks.push([performance.now(), what]); if (diag.marks.length > 40) diag.marks.shift(); }
(function watchFrames() {
  let last = performance.now();
  const frame = t => {
    const gap = t - last;
    if (gap > 300 && gap < 15000 && !document.hidden) {
      const what = [...new Set(diag.marks.filter(m => m[0] >= last - 50).map(m => m[1]))].join(', ') || 'unbekannt';
      diag.stalls.push(`${new Date().toLocaleTimeString('de-AT')} · ${Math.round(gap)} ms · ${what}`);
      if (diag.stalls.length > 12) diag.stalls.shift();
      if (diagOpen()) renderDiag();
    }
    last = t; requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => { last = performance.now(); });
})();
const diagOpen = () => { const p = document.getElementById('diagPanel'); return p && p.open && !document.getElementById('viewBoard').hidden; };
function renderDiag() {
  const ol = $('diagList'); if (!ol) return;
  ol.innerHTML = diag.stalls.length ? diag.stalls.slice().reverse().map(s => `<li>${esc(s)}</li>`).join('') : '<li>Kein Hänger aufgezeichnet 🎉</li>';
}
let queue = [], total = 0, done = 0, firstRight = 0, firstSeen = 0, sessionXp = 0, flipped = false;

const MODES = [['all', 'Alle'], ['new', 'Neu'], ['f', 'Falsch'], ['k', 'Gekonnt']];
const DIRS = [['d', 'Deutsch → ?'], ['f', '? → Deutsch'], ['m', 'Gemischt']];
const CHEERS = {
  Farsi: ['Āfarin! (Bravo!)', 'Kheyli khub! (Sehr gut!)', 'Āli-e! (Super!)', 'Damet garm!'],
  Griechisch: ['Brávo!', 'Polí kalá! (Sehr gut!)', 'Téleia! (Perfekt!)', 'Foveró! (Super!)'],
  Italienisch: ['Bravo!', 'Benissimo! (Sehr gut!)', 'Perfetto! (Perfekt!)', 'Fantastico!'],
  Spanisch: ['¡Muy bien! (Sehr gut!)', '¡Perfecto!', '¡Genial!', '¡Olé!'],
  Französisch: ['Bravo !', 'Très bien ! (Sehr gut!)', 'Parfait ! (Perfekt!)', 'Génial !']
};
const cheer = () => { const l = CHEERS[lang] || ['Super!', 'Toll!', 'Weiter so!']; return l[Math.floor(Math.random() * l.length)]; };

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/* Die Lehrer: Arzi, die persische Äffin (Farsi), und Robbie Robert Robertson die griechische Robbe */
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
// Beim Üben (Karten, Wiederholen, Spiele) bleiben die Figuren ruhig – nur die Sprechblase ändert sich
const practicing = () => !$('viewLearn').hidden || !$('viewRepeat').hidden || !$('viewPlay').hidden;
function setMood(text, happy, kind, force) {
  const el = actor().el;
  if (bubble.textContent !== text) bubble.textContent = text;
  if (practicing() && !force) return;
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
      pose(el, 'blink', 140);
      if (!practicing() && !reduceMotion && a === actor() && Math.random() < 0.15) pose(el, Math.random() < .5 ? 'look' : a.act, Math.random() < .5 ? 1600 : a.actMs);
    }
    lifeLoop(a);
  }, 9000 + Math.random() * 9000);
}
function renderStage() {
  $('stage').dataset.active = lang === 'Farsi' ? 'fa' : lang === 'Griechisch' ? 'gr' : 'none';
  $('stage').dataset.bg = { Farsi: 'teheran', Griechisch: 'aegaeis', Italienisch: 'rom', Spanisch: 'sevilla', 'Französisch': 'paris' }[lang] || '';
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

/* ---------- Lernzeit ---------- */
let lastAct = Date.now(), tickN = 0;
const secsToday = () => store.days[today()] || 0;
function trimDays(d) { const o = {}; Object.keys(d).sort().slice(-120).forEach(k => { o[k] = d[k]; }); return o; }
function totalSecs() { let s = 0; for (const k in store.days) s += store.days[k] || 0; return s; }
function weekSecs() { let s = 0; const d = new Date(); for (let i = 0; i < 7; i++) { s += store.days[fmt(d)] || 0; d.setDate(d.getDate() - 1); } return s; }
function fmtClock(s) { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), r = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(r).padStart(2, '0'); }
function fmtDate(iso, withYear) { const [y, m, d] = iso.split('-'); return `${+d}.${+m}.${withYear ? y : ''}`; }
// Kalendertage bis zum Ziel-Datum (heute nicht mitgezählt); gelernt wird an dl + 1 Tagen inklusive heute
function daysLeft() { const t = new Date(store.goalDate + 'T00:00:00'); return isNaN(t) ? null : Math.round((t - new Date(today() + 'T00:00:00')) / 86400000); }
function fmtDuration(s) { const m = Math.round(s / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`; }
function isLearning() { return !document.hidden && (!$('viewLearn').hidden || !$('viewPlay').hidden) && Date.now() - lastAct < 60000; }
function tick() {
  const running = isLearning();
  if (running) {
    const t = today();
    store.days[t] = (store.days[t] || 0) + 1; tickN++;
    if (store.days[t] >= store.goalMin * 60 && store.doneDay !== t) { store.doneDay = t; tickN = 0; persist(['user', 'score'], 0); celebrate(); }
    else if (tickN >= 60) { tickN = 0; persist(['user', 'score']); }
    else if (tickN % 10 === 0) saveLocalSoon();
  }
  renderGoal(running);
}
let progVer = 0, newCache = { key: '', n: 0 };
function newCount() {                                 // neue Karten zählen – nur wenn sich etwas geändert hat
  const key = lang + '|' + cards.length + '|' + progVer;
  if (newCache.key !== key) newCache = { key, n: countMode('new') };
  return newCache.n;
}
const setText = (el, t) => { if (el.textContent !== t) el.textContent = t; };
function renderGoal(running) {
  const s = secsToday(), goal = store.goalMin * 60, done = s >= goal;
  const box = $('gbTimer');
  box.classList.toggle('done', done); box.classList.toggle('running', running && !done);
  $('gbRing').style.strokeDashoffset = (94.25 * (1 - Math.min(1, s / goal))).toFixed(2);
  setText($('gbTime'), done ? 'Heute perfekt!' : fmtClock(goal - s));
  setText($('gbTimeSub'), done ? (s - goal >= 1 ? `+${fmtClock(s - goal)} extra` : 'Ziel erreicht') : running ? `läuft · Ziel ${store.goalMin} min` : `Ziel ${store.goalMin} min · Pause`);
  const dl = daysLeft(), cnt = $('gbCount');
  if (dl === null) { setText($('gbDays'), '–'); setText($('gbDaysLabel'), 'Kein Ziel-Datum'); setText($('gbDaysSub'), 'Tippen zum Einstellen'); return; }
  if (dl < 0) { setText($('gbDays'), '✓'); setText($('gbDaysLabel'), 'Ziel-Datum vorbei'); setText($('gbDaysSub'), 'Neues Datum setzen'); cnt.classList.remove('urgent'); return; }
  const nw = newCount(), per = Math.ceil(nw / (dl + 1)), todayNew = store.newDay.d === today() ? store.newDay.n : 0;
  setText($('gbDays'), String(dl));
  setText($('gbDaysLabel'), dl === 0 ? 'Heute ist der Tag!' : `${dl === 1 ? 'Tag' : 'Tage'} bis ${fmtDate(store.goalDate)}`);
  setText($('gbDaysSub'), nw ? `Ziel: ${per} neue/Tag · heute ${todayNew}` : 'Alle Karten gelernt!');
  cnt.classList.toggle('urgent', dl <= 14);
}
function renderGoalPanel() {
  $('goalMin').value = String(store.goalMin);
  $('goalDate').value = store.goalDate;
  const dl = daysLeft(), nw = countMode('new');
  if (dl === null || dl < 0) $('goalPlan').textContent = 'Wähle ein Ziel-Datum in der Zukunft.';
  else {
    const hours = Math.round((dl + 1) * store.goalMin / 60);
    $('goalPlan').textContent = `Bis ${fmtDate(store.goalDate, true)} sind es noch ${dl} ${dl === 1 ? 'Tag' : 'Tage'}. Mit ${store.goalMin} Minuten am Tag kommst du auf rund ${hours} Stunden ${lang}. `
      + (nw ? `Für alle ${nw} neuen Karten brauchst du etwa ${Math.ceil(nw / (dl + 1))} neue pro Tag – dazu Wiederholen.` : 'Alle Karten sind schon gelernt – jetzt heißt es wiederholen und sprechen!');
  }
  $('goalStats').innerHTML = `<span class="x"><b>${Math.floor(secsToday() / 60)}</b>min heute</span><span class="k"><b>${fmtDuration(weekSecs())}</b>diese Woche</span><span class="n"><b>${fmtDuration(totalSecs())}</b>insgesamt</span>`;
}
function celebrate() {
  setMood((lang === 'Farsi' ? 'Āfarin! ' : lang === 'Griechisch' ? 'Brávo! ' : lang === 'Italienisch' ? 'Bravissimo! ' : lang === 'Spanisch' ? '¡Fenomenal! ' : lang === 'Französisch' ? 'Magnifique ! ' : '') + 'Gut gemacht – heutige Session perfekt!', true, 'bounce', true);
  if (reduceMotion) return;
  const colors = ['#1A7A87', '#D2563A', '#E0A526', '#2F8A5B', '#1D5FB4', '#159A93'];
  for (let i = 0; i < 40; i++) {
    const c = document.createElement('i');
    c.className = 'confetti';
    c.style.left = (Math.random() * 100) + 'vw';
    c.style.background = colors[i % colors.length];
    c.style.animationDelay = (Math.random() * .5).toFixed(2) + 's';
    c.style.setProperty('--dx', (Math.random() * 140 - 70).toFixed(0) + 'px');
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3400);
  }
}

/* ---------- Firebase ---------- */
const cloud = { fb: null, uid: null, email: '', ok: false };
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
const userBody = () => ({ extraJson: JSON.stringify(store.extra), lang: store.lang, dir: store.dir, nick: store.nick, pushLang: store.pushLang,
  daysJson: JSON.stringify(trimDays(store.days)), goalMin: store.goalMin, goalDate: store.goalDate, doneDay: store.doneDay, newDayJson: JSON.stringify(store.newDay),
  statsJson: JSON.stringify(store.stats || {}), badgesJson: JSON.stringify(store.badges || {}), outfitJson: JSON.stringify(store.outfit || {}), duelsJson: JSON.stringify(store.duelsCounted || {}),
  testsJson: JSON.stringify((store.testLog || []).slice(-30)), weeklyTest: store.weeklyTest !== false });
const scoreBody = () => ({ nick: store.nick || '', xp: store.xp || 0, streak: store.streak || 0, lastDay: store.lastDay || '', known: knownTotal(), lang: store.lang || '',
  todaySec: secsToday(), day: today(), totalSec: totalSecs(),
  badges: Object.keys(store.badges || {}).length, blitz: (store.stats || {}).blitzBest || 0 });

/* Sammel-Speichern: Änderungen werden nur vorgemerkt und höchstens alle 20 Sekunden
   gemeinsam in EINER Anfrage ins Konto geschrieben – bei wichtigen Aktionen und beim
   Verlassen der App sofort. Unveränderte Daten werden gar nicht erst verschickt.
   So bleibt die App flüssig, auch wenn viele gleichzeitig lernen. */
const dirty = new Map();            // Pfad -> Funktion, die den aktuellen Inhalt liefert
const lastSent = {};                // Pfad -> zuletzt erfolgreich gesendeter Inhalt
let flushTimer = null, flushAt = 0;
function writeDoc(path, body, delay) {
  if (!cloud.ok) return;
  dirty.set(path, body);
  scheduleFlush(delay == null ? 45000 : delay);
}
function scheduleFlush(ms) {
  const at = Date.now() + ms;
  if (flushTimer && flushAt <= at) return;          // es ist schon früher etwas geplant
  clearTimeout(flushTimer);
  flushAt = at; flushTimer = setTimeout(flush, ms);
}
function flush() {
  clearTimeout(flushTimer); flushTimer = null; flushAt = 0;
  if (!cloud.ok || !dirty.size) return;
  const { F, db } = cloud.fb;
  const items = [];
  for (const [path, body] of dirty) {
    const data = body(), json = JSON.stringify(data);
    if (lastSent[path] !== json) items.push({ path, body, data, json });
  }
  dirty.clear();
  if (!items.length) return;
  setSync(navigator.onLine === false ? 'offline' : 'wait');
  mark('Cloud-Speichern (' + items.length + ')');
  const batch = F.writeBatch(db);
  items.forEach(it => batch.set(F.doc(db, it.path), it.data, { merge: true }));
  batch.commit()
    .then(() => { mark('Cloud fertig'); items.forEach(it => { lastSent[it.path] = it.json; }); if (!dirty.size) setSync('ok'); })
    .catch(() => { items.forEach(it => { if (!dirty.has(it.path)) dirty.set(it.path, it.body); }); setSync('err'); scheduleFlush(15000); });
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
      if (d.weeklyTest === false) store.weeklyTest = false;
      try {                                                  // Test-Verlauf: beide zusammenführen
        const seen = new Set(), merged = [];
        (JSON.parse(d.testsJson || '[]')).concat(store.testLog || []).forEach(t => { const k = t.d + t.l + t.p + t.n; if (!seen.has(k)) { seen.add(k); merged.push(t); } });
        store.testLog = merged.sort((a, b) => a.d < b.d ? -1 : a.d > b.d ? 1 : 0).slice(-30);
      } catch (e) {}
      let cd = {}; try { cd = JSON.parse(d.daysJson || '{}'); } catch (e) {}
      for (const k in cd) store.days[k] = Math.max(store.days[k] || 0, cd[k] || 0);   // Lernzeit: pro Tag das Maximum
      if (d.goalMin) store.goalMin = d.goalMin;
      if (d.goalDate) store.goalDate = d.goalDate;
      if ((d.doneDay || '') > (store.doneDay || '')) store.doneDay = d.doneDay;
      try {                                                  // Spielstand: jeweils der bessere Wert
        const cs = JSON.parse(d.statsJson || '{}'), ls = store.stats = store.stats || {};
        for (const k in cs) ls[k] = k === 'memoryBest' ? (ls[k] ? Math.min(ls[k], cs[k]) : cs[k]) : Math.max(ls[k] || 0, cs[k] || 0);
        Object.assign(store.badges = store.badges || {}, JSON.parse(d.badgesJson || '{}'));
        Object.assign(store.duelsCounted = store.duelsCounted || {}, JSON.parse(d.duelsJson || '{}'));
        const co = JSON.parse(d.outfitJson || 'null'); if (co && Object.values(co).some(Boolean)) store.outfit = co;
      } catch (e) {}
      try { const nd = JSON.parse(d.newDayJson || 'null'); if (nd && nd.d === today() && (store.newDay.d !== nd.d || nd.n > store.newDay.n)) store.newDay = nd; } catch (e) {}
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
    cloud.ok = true; progVer++;
    saveLocal();
    const langsWithProg = new Set(Object.keys(store.prog).map(k => k.split(SEP)[0]));
    writeDoc('users/' + cloud.uid, userBody, 200);
    langsWithProg.forEach(l => writeDoc('users/' + cloud.uid + '/prog/' + lk(l), () => progBody(l), 300));
    writeDoc('scores/' + cloud.uid, scoreBody, 400);
    setSync('ok');
  } catch (e) {
    setSync('err');
  }
  if (!$('viewBoard').hidden && !document.hidden) startBoard();
  setupForegroundPush();
  games.applyOutfit(); games.checkBadges();
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
    snap => { mark('Rangliste-Update'); board = snap.docs.map(d => Object.assign({ id: d.id }, d.data())); if (!$('viewBoard').hidden) renderBoard(); },
    () => { $('board').innerHTML = '<li class="empty">Die Rangliste ist gerade nicht erreichbar.</li>'; });
}
function stopBoard(keep) { if (boardUnsub) boardUnsub(); boardUnsub = null; if (!keep) board = []; }
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
    const sub = document.createElement('span'); sub.textContent = `${liveStreak(r.streak, r.lastDay)} Tage Serie · ${r.day === today() ? Math.floor((r.todaySec || 0) / 60) : 0} min heute · ${r.known || 0} gekonnt${r.badges ? ' · 🏅' + r.badges : ''}${r.lang ? ' · ' + r.lang : ''}`;
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
  $('weeklyTest').checked = store.weeklyTest !== false;
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
  if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.robbi === 'test') { showTab('play'); games.start('test'); } });
  if (/[?&]test=1/.test(location.search)) {                  // aus der Wochentest-Nachricht geöffnet
    history.replaceState(null, '', location.pathname);
    setTimeout(() => { showTab('play'); games.start('test'); }, 300);
  }
  initFirebase();
}

/* ---------- Zählen ---------- */
function inMode(c, m) { const s = stateOf(c); return m === 'all' || (m === 'new' ? s === 'n' : s === m); }
function pool(m, ct) { return cards.filter(c => (ct === '*' || c.cat === ct) && inMode(c, m)); }
/* Zählen in einem einzigen Durchlauf, zwischengespeichert bis sich Karten oder Lernstand ändern
   (vorher wurden für die Übersicht über 100-mal alle Karten durchgezählt – das dauerte auf dem iPhone) */
let countCache = { cards: null, ver: -1, data: null };
function counts() {
  if (countCache.cards === cards && countCache.ver === progVer) return countCache.data;
  const data = { '*': { all: 0, new: 0, f: 0, k: 0 } };
  for (const c of cards) {
    const s = stateOf(c), m = s === 'n' ? 'new' : s;
    const g = data[c.cat] || (data[c.cat] = { all: 0, new: 0, f: 0, k: 0 });
    g.all++; data['*'].all++;
    if (m in g) { g[m]++; data['*'][m]++; }
  }
  countCache = { cards, ver: progVer, data };
  return data;
}
function countMode(m, ct = '*') { const g = counts()[ct]; return g ? (g[m] || 0) : 0; }
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
  renderLangSelect(); renderChips(); renderKey(); renderStage(); renderGoal(false);
  if (!$('viewBoard').hidden) renderGoalPanel();
  if (!$('viewRepeat').hidden) renderRepeat();
  if (!$('viewWords').hidden) renderWords();
  if (!$('viewBoard').hidden) { renderProfile(); renderBoard(); }
}

/* ---------- Lernen ---------- */
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function startSession() {
  const list = pool(mode, cat);
  queue = shuffle(list.map(c => ({ c, rev: store.dir === 'd' || (store.dir === 'm' && Math.random() < .5), seen: false })));
  if (mode === 'f' || mode === 'k') queue = queue.slice(0, ROUND);    // Falsche und Gekonnte in kleinen Runden
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
  $('flipActions').hidden = true; $('rateActions').hidden = false;
  $('count').textContent = `${done} / ${total}`;
  $('barFill').style.transform = `scaleX(${total ? done / total : 0})`;
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
  $('flipActions').hidden = true; $('rateActions').hidden = true;
}
function flip(fromCard) {
  mark('Umdrehen');
  if (!queue.length) return;
  flipped = !flipped;
  $('card').classList.toggle('flipped', flipped);
}
function answer(ok) {
  mark(ok ? 'Gewusst' : 'Nicht gewusst');
  if (!queue.length || performance.now() < lockUntil) return;   // Doppeltipp auf denselben Knopf zählt nur einmal
  const item = queue.shift();
  const first = !item.seen;
  if (first) {
    item.seen = true; firstSeen++; if (ok) firstRight++;
    if (stateOf(item.c) === 'n') { if (store.newDay.d !== today()) store.newDay = { d: today(), n: 0 }; store.newDay.n++; }
    store.prog[keyOf(item.c)] = ok ? 'k' : 'f'; progVer++;
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
  updateBadge(); games.checkBadges();
  lockUntil = performance.now() + 250;
  showCard(true);
}
function endSession() {
  $('session').hidden = true; $('endView').hidden = false;
  const pct = firstSeen ? Math.round(firstRight / firstSeen * 100) : 0;
  $('endPct').textContent = pct + '%';
  $('endText').textContent = `${firstRight} von ${firstSeen} Karten auf Anhieb, +${sessionXp} Punkte. Serie: ${liveStreak(store.streak, store.lastDay)} Tage.`;
  const w = countMode('f'), more = mode === 'k' ? countMode('k') : 0;
  $('endWrongBtn').disabled = !w; $('endWrongBtn').textContent = w ? (w > ROUND ? `Nächste ${ROUND} Falsche (${w} offen)` : `Falsche üben (${w})`) : 'Keine Fehler offen';
  $('restartBtn').textContent = mode === 'k' && more > ROUND ? `Nächste ${ROUND} Gekonnte` : mode === 'f' ? 'Andere Runde' : 'Nochmal';
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
  $('repWrongBtn').disabled = !f; $('repWrongBtn').textContent = f > ROUND ? `${ROUND} Falsche üben (von ${f})` : `Falsche üben (${f})`;
  $('repKnownBtn').disabled = !k; $('repKnownBtn').textContent = k > ROUND ? `${ROUND} Gekonnte wiederholen (von ${k})` : `Gekonnte wiederholen (${k})`;
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
  [['learn', 'tabLearn', 'viewLearn'], ['repeat', 'tabRepeat', 'viewRepeat'], ['play', 'tabPlay', 'viewPlay'], ['board', 'tabBoard', 'viewBoard'], ['words', 'tabWords', 'viewWords']].forEach(([n, tab, view]) => {
    $(tab).setAttribute('aria-selected', n === t); $(view).hidden = n !== t;
  });
  if (t === 'repeat') renderRepeat();
  if (t === 'words') renderWords();
  if (t === 'board') { renderProfile(); renderBoard(); renderGoalPanel(); renderDiag(); startBoard(); } else stopBoard(true);   // Rangliste nur live, solange sie offen ist
  if (t === 'learn') { renderChips(); lastAct = Date.now(); }
  if (t === 'play') { games.render(); lastAct = Date.now(); } else games.stop();
}
$('tabPlay').onclick = () => showTab('play');
$('diagPanel').addEventListener('toggle', renderDiag);
$('tabLearn').onclick = () => showTab('learn');
$('tabRepeat').onclick = () => showTab('repeat');
$('tabBoard').onclick = () => showTab('board');
$('tabWords').onclick = () => showTab('words');
$('sync').onclick = () => showTab('board');
$('langSelect').onchange = e => { $('impLang').value = e.target.value; loadLang(e.target.value).then(() => setMood(`Wir lernen ${lang}!`, true, 'bounce')); };
$('card').onclick = () => flip(true); $('flipBtn').onclick = () => flip(false);
$('againBtn').onclick = () => answer(false); $('knewBtn').onclick = () => answer(true);
$('restartBtn').onclick = () => startSession();
$('endWrongBtn').onclick = () => practice('f', '*');
$('repWrongBtn').onclick = () => practice('f', '*');
$('repKnownBtn').onclick = () => practice('k', '*');
$('repTestBtn').onclick = () => { showTab('play'); games.start('test'); };
$('weeklyTest').onchange = () => { store.weeklyTest = $('weeklyTest').checked; persist(['user'], 0); $('pushMsg').textContent = store.weeklyTest ? 'Sonntags kommt jetzt dein Wochentest.' : 'Kein Wochentest per Push – testen kannst du dich trotzdem jederzeit.'; };
$('resetBtn').onclick = () => {
  const r = $('resetBtn');
  if (!r.dataset.armed) { r.dataset.armed = 1; r.textContent = 'Wirklich alles vergessen? Nochmal tippen.'; return; }
  cards.forEach(c => delete store.prog[keyOf(c)]); progVer++; persist(['prog', 'score'], 0);
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
window.addEventListener('pagehide', () => { saveLocal(); flush(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { saveLocal(); flush(); stopBoard(true); }
  else if (!$('viewBoard').hidden) startBoard();
});
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
function gainXp(n) { store.xp = (store.xp || 0) + n; touchStreak(); persist(['score', 'user']); }
const games = initGames({
  $, store, esc, shuffle, reduceMotion, readAid, today, persist, setMood, cheer, gainXp, cloud,
  get lang() { return lang; }, get cards() { return cards; },
  baseCards: () => parse(texts[lang] || '', lang),
  stateOf,
  markWrong: c => { store.prog[keyOf(c)] = 'f'; progVer++; updateBadge(); },
  liveStreak: () => liveStreak(store.streak, store.lastDay), knownTotal, totalSecs
});

/* ---------- Tagesziel-Timer & Countdown ---------- */
['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, () => { lastAct = Date.now(); }, { passive: true }));
const toGoal = () => { showTab('board'); setTimeout(() => $('goalPanel').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }), 50); };
$('gbTimer').onclick = toGoal; $('gbCount').onclick = toGoal;
$('goalMin').onchange = () => { store.goalMin = +$('goalMin').value || 30; persist(['user'], 0); renderGoal(false); renderGoalPanel(); };
$('goalDate').onchange = () => { if ($('goalDate').value) { store.goalDate = $('goalDate').value; persist(['user'], 0); renderGoal(false); renderGoalPanel(); } };
setInterval(tick, 1000);
init();
