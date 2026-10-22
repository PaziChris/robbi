/* Robbi – Spielen-Bereich
 * Blitzrunde, Memory, Satz-Puzzle, Fangspiel, Sprech-Challenge, Duell,
 * Wort des Tages, Abzeichen und Outfits.
 * Bekommt alles, was es braucht, über das "api"-Objekt von app.js.
 */

export function initGames(api) {
  const { $, store, esc, shuffle, reduceMotion } = api;
  const S = () => (store.stats = store.stats || {});
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const isFarsiTeacher = () => api.lang === 'Farsi';
  let stopFn = null;                       // beendet das laufende Spiel
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
  const clearTimers = () => { timers.forEach(clearTimeout); timers.clear(); };

  /* ---------- Hilfen ---------- */
  function cleanFront(c) { return c.front.split(' – ')[0]; }          // bei Verben nur den Infinitiv
  function quizPool() { return api.cards.filter(c => c.front.length <= 40 && c.back.length <= 40); }
  function makeQ(pool) {
    const c = rnd(pool), rev = Math.random() < .5;
    const val = x => rev ? cleanFront(x) : x.back;
    const answer = val(c);
    const same = pool.filter(x => x.cat === c.cat && val(x) !== answer);
    const other = pool.filter(x => val(x) !== answer);
    const opts = new Set([answer]);
    for (const src of [shuffle(same.slice()), shuffle(other.slice())]) for (const x of src) { if (opts.size >= 4) break; opts.add(val(x)); }
    return { c, rev, prompt: rev ? c.back : cleanFront(c), answer, options: shuffle([...opts]) };
  }
  function gain(n) { if (n > 0) api.gainXp(n); checkBadges(); }
  function bestText(v, unit) { return v ? `Rekord: ${v}${unit || ''}` : 'Noch kein Rekord'; }

  /* ---------- Wort des Tages (gleich wie im Push) ---------- */
  function wotdHash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function wordOfDay() {
    const list = api.baseCards();
    if (!list.length) return null;
    return list[wotdHash(api.today() + '|' + api.lang) % list.length];
  }

  /* ---------- Menü ---------- */
  const GAMES = [
    { id: 'blitz', icon: '⚡', name: 'Blitzrunde', desc: '60 Sekunden, so viele wie möglich', best: () => bestText(S().blitzBest, ' richtig') },
    { id: 'memory', icon: '🧠', name: 'Memory', desc: 'Finde die 6 Paare', best: () => bestText(S().memoryBest, ' s') },
    { id: 'puzzle', icon: '🧩', name: 'Satz-Puzzle', desc: 'Bau den Satz richtig zusammen', best: () => `${S().puzzles || 0} Sätze gebaut` },
    { id: 'catch', icon: '🎣', name: 'Fangspiel', desc: () => isFarsiTeacher() ? 'Arzi fängt Safran' : 'Robbie fängt Fische', best: () => bestText(S().catchBest, ' gefangen') },
    { id: 'speech', icon: '🎤', name: 'Sprech-Challenge', desc: 'Sag das Wort laut', best: () => `${S().speechOk || 0}× richtig gesagt` },
    { id: 'duel', icon: '🥊', name: 'Duell', desc: 'Fordere Freunde heraus', best: () => `${S().duelsWon || 0} Duelle gewonnen` }
  ];
  function render() {
    stop(); checkBadges();
    $('playMenu').hidden = false; $('playGame').hidden = true;
    renderWotd(); renderGrid(); renderBadges(); renderWardrobe(); renderInbox();
  }
  function renderWotd() {
    const w = wordOfDay(), box = $('wotd');
    if (!w) { box.hidden = true; return; }
    box.hidden = false;
    const aid = api.readAid(cleanFront(w), api.lang);
    box.innerHTML = `<p class="label">Wort des Tages · ${esc(api.lang)}</p>
      <div class="wotd-word">${esc(w.front)}</div>
      ${aid ? `<div class="wotd-read">Lies etwa: ${esc(aid)}</div>` : ''}
      <div class="wotd-de">${esc(w.back)}</div>${w.note ? `<p>${esc(w.note)}</p>` : ''}`;
  }
  function renderGrid() {
    const g = $('gameGrid'); g.innerHTML = '';
    GAMES.forEach(gm => {
      const b = el('button', 'game-card');
      b.type = 'button';
      const desc = typeof gm.desc === 'function' ? gm.desc() : gm.desc;
      const off = gm.id === 'speech' && !speechSupport();
      b.innerHTML = `<span class="gc-icon">${gm.icon}</span><b>${gm.name}</b><small>${esc(off ? 'Auf diesem Gerät nicht verfügbar' : desc)}</small><span class="gc-best">${esc(gm.best())}</span>`;
      if (off) b.disabled = true;
      b.onclick = () => start(gm.id);
      g.appendChild(b);
    });
  }
  function start(id, noRun) {
    stop();
    $('playMenu').hidden = true; $('playGame').hidden = false;
    const gm = GAMES.find(g => g.id === id);
    $('gameTitle').textContent = gm.icon + ' ' + gm.name;
    $('gameInfo').textContent = '';
    $('gameArea').innerHTML = '';
    if (!noRun) ({ blitz, memory, puzzle, catch: catchGame, speech, duel })[id]();
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  function stop() { if (stopFn) { const f = stopFn; stopFn = null; f(); } clearTimers(); }
  $('gameBack').onclick = render;
  function endScreen(title, lines, again) {
    const a = $('gameArea'); a.innerHTML = '';
    const box = el('div', 'end');
    box.innerHTML = `<span class="label">${esc(title)}</span>` + lines.map(l => `<span>${l}</span>`).join('');
    const act = el('div', 'actions');
    const b1 = el('button', 'btn quiet', 'Zum Menü'); b1.onclick = render;
    const b2 = el('button', 'btn primary', 'Nochmal'); b2.onclick = again;
    act.append(b1, b2); box.appendChild(act); a.appendChild(box);
    $('gameInfo').textContent = '';
  }
  function needCards(n) {
    if (quizPool().length >= n) return true;
    $('gameArea').innerHTML = '<p class="hint">Für dieses Spiel braucht es mehr Wörter in dieser Sprache.</p>';
    return false;
  }

  /* ---------- 1) Blitzrunde ---------- */
  function blitz() {
    if (!needCards(8)) return;
    const pool = quizPool(); let score = 0, left = 60, q, locked = false;
    const a = $('gameArea');
    a.innerHTML = `<div class="blitz-bar"><i id="bzBar"></i></div><div class="q-card"><span class="lang" id="bzLang"></span><span class="q-word" id="bzWord"></span></div><div class="opts" id="bzOpts"></div>`;
    const tick = setInterval(() => {
      left--; $('bzBar').style.width = (left / 60 * 100) + '%';
      $('gameInfo').textContent = `${score} richtig · ${left} s`;
      if (left <= 0) finish();
    }, 1000);
    stopFn = () => clearInterval(tick);
    function next() {
      q = makeQ(pool); locked = false;
      $('bzLang').textContent = q.rev ? 'Deutsch' : api.lang;
      $('bzWord').textContent = q.prompt;
      const box = $('bzOpts'); box.innerHTML = '';
      q.options.forEach(o => {
        const b = el('button', 'opt'); b.type = 'button'; b.textContent = o;
        b.onclick = () => {
          if (locked) return; locked = true;
          if (o === q.answer) { b.classList.add('ok'); score++; later(next, 250); }
          else { b.classList.add('bad'); [...box.children].find(x => x.textContent === q.answer)?.classList.add('ok'); later(next, 900); }
          $('gameInfo').textContent = `${score} richtig · ${left} s`;
        };
        box.appendChild(b);
      });
    }
    function finish() {
      stop();
      const best = Math.max(S().blitzBest || 0, score), rec = score > (S().blitzBest || 0) && score > 0;
      S().blitzBest = best; gain(score * 2);
      api.setMood(rec ? 'Neuer Blitz-Rekord! ⚡' : api.cheer(), true, 'bounce');
      endScreen('Blitzrunde vorbei', [`<span class="big">${score}</span>`, `richtig in 60 Sekunden · +${score * 2} Punkte`, rec ? '🏆 Neuer Rekord!' : `Rekord: ${best}`], blitz);
    }
    $('gameInfo').textContent = `0 richtig · 60 s`;
    next();
  }

  /* ---------- 2) Memory ---------- */
  function memory() {
    const pool = quizPool().filter(c => cleanFront(c).length <= 18 && c.back.length <= 18);
    if (pool.length < 6) { needCards(999); return; }
    const picked = []; const seenF = new Set(), seenB = new Set();
    for (const c of shuffle(pool.slice())) { const f = cleanFront(c); if (seenF.has(f) || seenB.has(c.back)) continue; seenF.add(f); seenB.add(c.back); picked.push(c); if (picked.length === 6) break; }
    const tiles = shuffle(picked.flatMap((c, i) => [{ pair: i, text: cleanFront(c), foreign: true }, { pair: i, text: c.back, foreign: false }]));
    const a = $('gameArea'); a.innerHTML = '<div class="memory" id="memGrid"></div>';
    let open = [], found = 0, moves = 0; const t0 = Date.now();
    const tick = setInterval(() => { $('gameInfo').textContent = `${moves} Züge · ${Math.round((Date.now() - t0) / 1000)} s`; }, 500);
    stopFn = () => clearInterval(tick);
    tiles.forEach(t => {
      const b = el('button', 'mem'); b.type = 'button';
      b.innerHTML = `<span class="mem-back">?</span><span class="mem-face${t.foreign ? ' foreign' : ''}">${esc(t.text)}</span>`;
      b.onclick = () => {
        if (b.classList.contains('open') || open.length === 2) return;
        b.classList.add('open'); open.push([b, t]);
        if (open.length === 2) {
          moves++;
          const [[b1, t1], [b2, t2]] = open;
          if (t1.pair === t2.pair) { b1.classList.add('done'); b2.classList.add('done'); open = []; found++; if (found === 6) later(finish, 400); }
          else later(() => { b1.classList.remove('open'); b2.classList.remove('open'); open = []; }, 850);
        }
      };
      $('memGrid').appendChild(b);
    });
    function finish() {
      stop();
      const secs = Math.round((Date.now() - t0) / 1000), prev = S().memoryBest, rec = !prev || secs < prev;
      if (rec) S().memoryBest = secs;
      gain(15);
      api.setMood(rec ? 'Neuer Memory-Rekord! 🧠' : api.cheer(), true, 'bounce');
      endScreen('Alle Paare gefunden', [`<span class="big">${secs} s</span>`, `${moves} Züge · +15 Punkte`, rec ? '🏆 Neuer Rekord!' : `Rekord: ${prev} s`], memory);
    }
  }

  /* ---------- 3) Satz-Puzzle ---------- */
  // Sätze kommen aus der Wortliste (ganze Sätze) und zusätzlich aus saetze/<sprache>.txt
  const PZ_LEVELS = [
    { id: 'leicht', name: 'Leicht', icon: '🌱', desc: '3–5 Wörter', min: 3, max: 5, pts: 5 },
    { id: 'mittel', name: 'Mittel', icon: '🔥', desc: '6–8 Wörter', min: 6, max: 8, pts: 8 },
    { id: 'schwer', name: 'Schwer', icon: '🏔️', desc: 'ab 9 Wörtern', min: 9, max: 99, pts: 12 }
  ];
  const extraSentences = {};
  async function loadExtraSentences(lang) {
    if (extraSentences[lang]) return extraSentences[lang];
    try {
      const r = await fetch('saetze/' + lang.toLowerCase() + '.txt?v=23');
      if (!r.ok) throw 0;
      const list = (await r.text()).split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith('[') && l.includes(';'))
        .map(l => { const i = l.indexOf(';'); return { front: l.slice(0, i).trim(), back: l.slice(i + 1).split(';')[0].trim() }; })
        .filter(c => c.front && c.back);
      return (extraSentences[lang] = list);
    } catch (e) { return (extraSentences[lang] = []); }
  }
  const pzWords = c => cleanFront(c).split(/\s+/).filter(Boolean);
  async function puzzle() {
    const a = $('gameArea');
    a.innerHTML = '<p class="hint">Sätze werden geladen …</p>';
    const lang = api.lang, extra = await loadExtraSentences(lang);
    if (api.lang !== lang || $('playGame').hidden || $('gameTitle').textContent.indexOf('Puzzle') < 0) return;
    const seen = new Set(), all = [];
    [...api.cards, ...extra].forEach(c => {
      const key = cleanFront(c);
      if (c.front.includes('...') || seen.has(key)) return;
      seen.add(key); all.push(c);
    });
    const byLevel = lv => all.filter(c => { const n = pzWords(c).length; return n >= lv.min && n <= lv.max; });
    $('gameInfo').textContent = 'Wähle die Schwierigkeit';
    a.innerHTML = '<div class="pz-levels" id="pzLevels"></div>';
    PZ_LEVELS.forEach(lv => {
      const n = byLevel(lv).length, b = el('button', 'pz-level'); b.type = 'button';
      b.innerHTML = `<span class="pz-ic">${lv.icon}</span><b>${lv.name}</b><small>${lv.desc} · ${n} Sätze · +${lv.pts} pro Satz</small>`;
      if (n < 3) { b.disabled = true; b.title = 'Zu wenige Sätze in dieser Sprache'; }
      if (S().pzLevel === lv.id) b.classList.add('last');
      b.onclick = () => { S().pzLevel = lv.id; play(lv, byLevel(lv)); };
      $('pzLevels').appendChild(b);
    });
  }
  function play(lv, pool) {
    const round = shuffle(pool.slice()).slice(0, 5); let i = 0, solved = 0;
    const a = $('gameArea');
    function show() {
      const c = round[i], words = pzWords(c);
      let chosen = [];
      let order = shuffle(words.map((w, k) => ({ w, k })));
      if (order.every((o, k) => o.k === k) && words.length > 1) order = order.reverse();
      $('gameInfo').textContent = `${lv.icon} ${lv.name} · Satz ${i + 1} / ${round.length}`;
      a.innerHTML = `<div class="q-card"><span class="lang">Deutsch</span><span class="q-word small">${esc(c.back)}</span></div>
        <div class="pz-line" id="pzLine"></div><div class="pz-pool" id="pzPool"></div><p class="hint" id="pzMsg">Tippe die Wörter in der richtigen Reihenfolge an. Antippen oben nimmt ein Wort wieder zurück.</p>`;
      const draw = () => {
        const line = $('pzLine'), poolEl = $('pzPool'); line.innerHTML = ''; poolEl.innerHTML = '';
        chosen.forEach((o, idx) => { const b = el('button', 'chip pz'); b.type = 'button'; b.textContent = o.w; b.onclick = () => { chosen.splice(idx, 1); draw(); }; line.appendChild(b); });
        order.filter(o => !chosen.includes(o)).forEach(o => { const b = el('button', 'chip pz'); b.type = 'button'; b.textContent = o.w; b.onclick = () => { chosen.push(o); draw(); if (chosen.length === words.length) check(); }; poolEl.appendChild(b); });
      };
      const check = () => {
        const ok = chosen.map(o => o.w).join(' ') === words.join(' ');
        const msg = $('pzMsg');
        if (ok) {
          solved++; S().puzzles = (S().puzzles || 0) + 1; gain(lv.pts);
          msg.innerHTML = `<b class="ok-text">Richtig! +${lv.pts}</b>`; api.setMood(api.cheer(), true, 'bounce');
          later(() => { i++; i < round.length ? show() : finish(); }, 1100);
        } else {
          $('pzLine').classList.add('shake'); later(() => $('pzLine')?.classList.remove('shake'), 500);
          msg.innerHTML = `Nicht ganz. Richtig ist: <b>${esc(words.join(' '))}</b>`;
          api.setMood('Fast! Schau dir die Reihenfolge an.', false, 'shake');
          later(() => { i++; i < round.length ? show() : finish(); }, 1800 + words.length * 250);
        }
      };
      draw();
    }
    function finish() { endScreen(`Satz-Puzzle · ${lv.name}`, [`<span class="big">${solved} / ${round.length}</span>`, `Sätze richtig · +${solved * lv.pts} Punkte`], () => play(lv, pool)); }
    show();
  }

  /* ---------- 4) Fangspiel ---------- */
  const SAFFRON = '<svg viewBox="0 0 24 24" class="saffron" aria-hidden="true"><path d="M12 22 V13" stroke="#5B8C3A" stroke-width="2" stroke-linecap="round"/><path d="M12 14 C7 13 5 8 7 4 C9 7 11 9 12 14Z M12 14 C17 13 19 8 17 4 C15 7 13 9 12 14Z M12 14 C10 9 10 5 12 2 C14 5 14 9 12 14Z" fill="#8E5BD6"/><path d="M12 12 L10.5 6.5 M12 12 L12 5.5 M12 12 L13.5 6.5" stroke="#D32F2F" stroke-width="1.3" stroke-linecap="round"/></svg>';
  function catchGame() {
    if (!needCards(8)) return;
    const pool = quizPool(), farsi = isFarsiTeacher();
    const icon = farsi ? SAFFRON : '<span class="fish">🐟</span>';
    const a = $('gameArea');
    a.innerHTML = `<div class="q-card slim"><span class="lang">Fang die Übersetzung von</span><span class="q-word small" id="ctWord"></span></div>
      <div class="catch-field" id="ctField"><div class="catcher">${farsi ? '🐒' : '🦭'}</div></div>`;
    const field = $('ctField');
    let q, score = 0, lives = 3, speed = 62, items = [], last = performance.now(), spawnIn = 0, raf = 0, over = false, untilCorrect = 0;
    const H = () => field.clientHeight, W = () => field.clientWidth;
    function newQ() { q = makeQ(pool); q.rev = false; q.prompt = q.c.back; q.answer = cleanFront(q.c); q.options = []; $('ctWord').textContent = q.prompt; untilCorrect = 2 + Math.floor(Math.random() * 4); }
    function info() { $('gameInfo').textContent = `${score} gefangen · ${'❤️'.repeat(lives)}${'🤍'.repeat(3 - lives)}`; }
    function spawn() {
      // Das richtige Wort kommt erst nach 2–5 falschen (zufällig), nie gleich als erstes
      const hasCorrect = items.some(it => it.correct && !it.dead);
      untilCorrect--;
      const correct = !hasCorrect && (untilCorrect <= 0 || (untilCorrect <= 2 && Math.random() < .2));
      let text = q.answer;
      if (!correct) {
        const shown = new Set(items.filter(it => !it.dead).map(it => it.text));
        for (let k = 0; k < 15; k++) { const x = cleanFront(rnd(pool)); if (x !== q.answer && !shown.has(x)) { text = x; break; } }
        if (text === q.answer) return;
      }
      const node = el('button', 'drop'); node.type = 'button';
      node.innerHTML = `${icon}<span>${esc(text)}</span>`;
      field.appendChild(node);
      const w = node.offsetWidth || 100;
      const it = { node, y: -50, x: Math.random() * Math.max(10, W() - w - 10) + 5, correct: text === q.answer, text, dead: false };
      node.style.left = it.x + 'px';
      node.onclick = () => {
        if (it.dead || over) return; it.dead = true;
        if (it.correct) {
          score++; speed = Math.min(165, speed + 6); node.classList.add('caught'); api.setMood(farsi ? 'Safran gefangen! 🌸' : 'Fisch gefangen! 🐟', true);
          items.forEach(o => { if (o !== it && !o.dead) { o.dead = true; o.node.classList.add('fade'); later(() => o.node.remove(), 400); } });
          later(newQ, 50);
        } else { lives--; node.classList.add('wrong'); api.setMood('Falscher Fang!', false, 'shake'); }
        later(() => node.remove(), 450); info();
        if (lives <= 0) finish();
      };
      items.push(it);
    }
    function loop(now) {
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      spawnIn -= dt;
      if (spawnIn <= 0) { spawn(); spawnIn = Math.max(.5, 0.95 - score * .03); }
      const h = H();
      items.forEach(it => {
        if (it.dead) return;
        it.y += speed * dt;
        it.node.style.transform = `translateY(${it.y}px)`;
        if (it.y > h - 70) {
          it.dead = true; it.node.remove();
          if (it.correct) { lives--; api.setMood('Verpasst! Das wäre richtig gewesen: ' + q.answer, false, 'shake'); info(); later(newQ, 50); if (lives <= 0) finish(); }
        }
      });
      items = items.filter(it => !it.dead || it.node.isConnected);
      if (!over) raf = requestAnimationFrame(loop);
    }
    function finish() {
      if (over) return; over = true; stop();
      const best = Math.max(S().catchBest || 0, score), rec = score > (S().catchBest || 0) && score > 0;
      S().catchBest = best; gain(score * 2);
      endScreen('Fangspiel vorbei', [`<span class="big">${score}</span>`, `${farsi ? 'Safranblüten' : 'Fische'} gefangen · +${score * 2} Punkte`, rec ? '🏆 Neuer Rekord!' : `Rekord: ${best}`], catchGame);
    }
    stopFn = () => { over = true; cancelAnimationFrame(raf); };
    newQ(); info(); raf = requestAnimationFrame(t => { last = t; loop(t); });
  }

  /* ---------- 5) Sprech-Challenge ---------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const SR_LANG = { Farsi: 'fa-IR', Griechisch: 'el-GR', Italienisch: 'it-IT', Spanisch: 'es-ES' };
  function speechSupport() { return !!SR && !!SR_LANG[api.lang]; }
  const GR = { 'ου': 'u', 'αι': 'e', 'ει': 'i', 'οι': 'i', 'υι': 'i', 'μπ': 'b', 'ντ': 'd', 'γκ': 'g', 'γγ': 'ng', 'τσ': 'ts', 'τζ': 'tz', 'αυ': 'av', 'ευ': 'ev',
    'α': 'a', 'β': 'v', 'γ': 'gh', 'δ': 'dh', 'ε': 'e', 'ζ': 'z', 'η': 'i', 'θ': 'th', 'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p', 'ρ': 'r', 'σ': 's', 'ς': 's', 'τ': 't', 'υ': 'i', 'φ': 'f', 'χ': 'ch', 'ψ': 'ps', 'ω': 'o' };
  const FA = { 'آ': 'a', 'ا': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's', 'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': '', 'غ': 'gh', 'ف': 'f', 'ق': 'gh', 'ک': 'k', 'ك': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n', 'و': 'v', 'ه': 'h', 'ی': 'y', 'ي': 'y', 'ئ': 'y', 'ء': '' };
  const strip = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  function toLatin(s, l) {
    s = strip(s);
    if (l === 'Griechisch') { s = s.replace(/ου|αι|ει|οι|υι|μπ|ντ|γκ|γγ|τσ|τζ|αυ|ευ|[α-ω]/g, m => GR[m] ?? m); }
    if (l === 'Farsi') { s = [...s].map(ch => FA[ch] ?? ch).join(''); }
    return s.replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function skeleton(s, l) {          // für Farsi: nur das Konsonantengerüst vergleichen (die Schrift hat kaum Vokale)
    s = s.replace(/kh/g, 'x').replace(/sh/g, '$').replace(/ch/g, 'c').replace(/gh/g, 'q').replace(/zh/g, 'j');
    if (l === 'Farsi') s = s.replace(/[aeiouvyh'\s]/g, '');
    return s.replace(/\s/g, '');
  }
  function lev(a, b) { const m = a.length, n = b.length; if (!m) return n; if (!n) return m; let p = Array.from({ length: n + 1 }, (_, j) => j); for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[n]; }
  function similar(heard, target, l) {
    const a = skeleton(toLatin(heard, l), l), b = skeleton(toLatin(target, l), l);
    if (!a || !b) return 0;
    return 1 - lev(a, b) / Math.max(a.length, b.length);
  }
  function speech() {
    if (!speechSupport()) { $('gameArea').innerHTML = '<p class="hint">Dein Gerät kann hier leider keine Sprache erkennen.</p>'; return; }
    const pool = api.cards.filter(c => !c.front.includes('–') && !c.front.includes('...') && cleanFront(c).split(/\s+/).length <= 4);
    if (pool.length < 5) { needCards(999); return; }
    const round = shuffle(pool.slice()).slice(0, 5); let i = 0, ok = 0, rec = null;
    const a = $('gameArea');
    stopFn = () => { try { rec && rec.abort(); } catch (e) {} };
    function show() {
      const c = round[i];
      $('gameInfo').textContent = `Wort ${i + 1} / ${round.length}`;
      a.innerHTML = `<div class="q-card"><span class="lang">Sag auf ${esc(api.lang)}</span><span class="q-word">${esc(c.back)}</span></div>
        <button class="mic" id="micBtn" type="button" aria-label="Sprechen">🎤</button>
        <p class="hint" id="spMsg">Tippe auf das Mikrofon und sag das Wort laut.</p>
        <div class="actions"><button class="btn quiet" id="spShow" type="button">Lösung zeigen</button><button class="btn quiet" id="spNext" type="button">Weiter</button></div>`;
      const msg = $('spMsg');
      $('spShow').onclick = () => { const aid = api.readAid(cleanFront(c), api.lang); msg.innerHTML = `Lösung: <b>${esc(cleanFront(c))}</b>${aid ? ` · lies etwa: ${esc(aid)}` : ''}`; };
      $('spNext').onclick = () => { i++; i < round.length ? show() : finish(); };
      $('micBtn').onclick = () => {
        try { rec && rec.abort(); } catch (e) {}
        rec = new SR(); rec.lang = SR_LANG[api.lang]; rec.interimResults = false; rec.maxAlternatives = 5;
        $('micBtn').classList.add('listening'); msg.textContent = 'Ich höre zu …';
        rec.onresult = ev => {
          const alts = [...ev.results[0]].map(r => r.transcript);
          const best = Math.max(...alts.map(t => similar(t, cleanFront(c), api.lang)));
          if (best >= .6) {
            ok++; S().speechOk = (S().speechOk || 0) + 1; gain(3);
            msg.innerHTML = `<b class="ok-text">Super ausgesprochen! +3</b> (gehört: „${esc(alts[0])}“)`;
            api.setMood(api.cheer(), true, 'bounce');
            later(() => { i++; i < round.length ? show() : finish(); }, 1600);
          } else {
            msg.innerHTML = `Gehört: „${esc(alts[0] || '…')}“. Versuch es nochmal oder schau dir die Lösung an.`;
            api.setMood('Fast! Nochmal probieren?', false, 'shake');
          }
        };
        rec.onerror = ev => {
          const why = ev.error === 'not-allowed' ? 'Bitte erlaube den Zugriff aufs Mikrofon.' : ev.error === 'no-speech' ? 'Ich habe nichts gehört. Nochmal?' : ev.error === 'language-not-supported' ? `Dein Gerät kann ${api.lang} leider nicht erkennen.` : 'Das hat nicht geklappt. Nochmal?';
          msg.textContent = why;
        };
        rec.onend = () => $('micBtn')?.classList.remove('listening');
        try { rec.start(); } catch (e) { msg.textContent = 'Das Mikrofon konnte nicht starten.'; }
      };
    }
    function finish() { endScreen('Sprech-Challenge geschafft', [`<span class="big">${ok} / ${round.length}</span>`, `richtig ausgesprochen · +${ok * 3} Punkte`], speech); }
    show();
  }

  /* ---------- 6) Duell ---------- */
  const cloud = () => api.cloud.ok && api.cloud.fb ? api.cloud.fb : null;
  function duelScore(d, who) { return { s: d[who + 'Score'] || 0, t: d[who + 'Time'] || 0 }; }
  function winnerOf(d) {
    const A = duelScore(d, 'a'), B = duelScore(d, 'b');
    if (A.s !== B.s) return A.s > B.s ? 'a' : 'b';
    if (A.t !== B.t) return A.t < B.t ? 'a' : 'b';
    return 'tie';
  }
  async function myDuels() {
    const fb = cloud(); if (!fb) return [];
    const { F, db } = fb, uid = api.cloud.uid;
    const [x, y] = await Promise.all([
      F.getDocs(F.query(F.collection(db, 'duels'), F.where('a', '==', uid), F.limit(20))),
      F.getDocs(F.query(F.collection(db, 'duels'), F.where('b', '==', uid), F.limit(20)))
    ]);
    const all = [...x.docs, ...y.docs].map(d => Object.assign({ id: d.id }, d.data()));
    return all.sort((p, q) => (q.created || 0) - (p.created || 0));
  }
  function countDuelWins(list) {
    const uid = api.cloud.uid; store.duelsCounted = store.duelsCounted || {};
    let changed = false;
    list.filter(d => d.status === 'done' && !store.duelsCounted[d.id]).forEach(d => {
      store.duelsCounted[d.id] = 1; changed = true;
      const w = winnerOf(d);
      if ((w === 'a' && d.a === uid) || (w === 'b' && d.b === uid)) { S().duelsWon = (S().duelsWon || 0) + 1; gain(20); }
    });
    if (changed) { api.persist(['user']); checkBadges(); }
  }
  async function renderInbox() {
    const box = $('duelInbox'); box.innerHTML = '';
    if (!cloud()) return;
    try {
      const list = await myDuels(); countDuelWins(list);
      const open = list.filter(d => d.status === 'open' && d.b === api.cloud.uid);
      open.forEach(d => {
        const b = el('button', 'invite'); b.type = 'button';
        b.innerHTML = `🥊 <b>${esc(d.aNick || 'Jemand')}</b> fordert dich zum Duell heraus! <span>Annehmen</span>`;
        b.onclick = () => { start('duel', true); playDuel(d); };
        box.appendChild(b);
      });
    } catch (e) { /* Regeln noch nicht eingerichtet – Duell-Bereich erklärt das */ }
  }
  function duel() {
    const a = $('gameArea');
    if (!cloud()) { a.innerHTML = '<p class="hint">Für Duelle musst du angemeldet sein (Tab Rangliste).</p>'; return; }
    a.innerHTML = '<p class="hint">Lade Duelle …</p>';
    myDuels().then(list => {
      countDuelWins(list);
      const uid = api.cloud.uid;
      a.innerHTML = '';
      const open = list.filter(d => d.status === 'open' && d.b === uid);
      if (open.length) {
        a.appendChild(el('p', 'label', 'Herausforderungen an dich'));
        open.forEach(d => { const b = el('button', 'invite'); b.type = 'button'; b.innerHTML = `🥊 <b>${esc(d.aNick || 'Jemand')}</b> fordert dich heraus <span>Annehmen</span>`; b.onclick = () => playDuel(d); a.appendChild(b); });
      }
      const nb = el('button', 'btn primary wide', '🥊 Neues Duell starten'); nb.type = 'button'; nb.onclick = pickOpponent; a.appendChild(nb);
      const past = list.slice(0, 8);
      if (past.length) {
        a.appendChild(el('p', 'label', 'Deine Duelle'));
        const ul = el('ul', 'board');
        past.forEach(d => {
          const meA = d.a === uid, other = meA ? d.bNick : d.aNick, li = el('li', 'duel-row');
          let txt;
          if (d.status === 'open') txt = meA ? `Wartet auf ${esc(other || 'Gegner')} …` : 'Noch nicht gespielt';
          else {
            const w = winnerOf(d), me = meA ? 'a' : 'b', mine = duelScore(d, me), theirs = duelScore(d, me === 'a' ? 'b' : 'a');
            txt = `${w === 'tie' ? '🤝 Unentschieden' : w === me ? '🏆 Gewonnen' : '😅 Verloren'} · ${mine.s}:${theirs.s}`;
          }
          li.innerHTML = `<span class="who"><b>gegen ${esc(other || 'Gegner')}</b><span>${txt}</span></span>`;
          ul.appendChild(li);
        });
        a.appendChild(ul);
      }
    }).catch(() => {
      a.innerHTML = '<p class="hint">Duelle sind noch nicht freigeschaltet. In Firebase müssen dafür die neuen Regeln eingefügt werden (siehe Anleitung).</p>';
    });
  }
  async function pickOpponent() {
    const a = $('gameArea'), fb = cloud(), uid = api.cloud.uid;
    a.innerHTML = '<p class="hint">Lade Spieler …</p>';
    const snap = await fb.F.getDocs(fb.F.query(fb.F.collection(fb.db, 'scores'), fb.F.orderBy('xp', 'desc'), fb.F.limit(50)));
    const people = snap.docs.filter(d => d.id !== uid).map(d => ({ id: d.id, nick: d.data().nick || 'Robbe ohne Namen', lang: d.data().lang || '' }));
    a.innerHTML = '<p class="label">Wen forderst du heraus?</p>';
    if (!people.length) { a.appendChild(el('p', 'hint', 'Noch niemand sonst in der Rangliste. Lade Freunde ein!')); return; }
    const ul = el('ul', 'board');
    people.forEach(p => {
      const li = el('li', 'duel-row pick'); li.tabIndex = 0;
      li.innerHTML = `<span class="who"><b>${esc(p.nick)}</b><span>lernt ${esc(p.lang || '…')}</span></span><span class="go">Herausfordern</span>`;
      li.onclick = () => playDuel(null, p);
      ul.appendChild(li);
    });
    a.appendChild(ul);
    a.appendChild(el('p', 'hint', 'Jeder bekommt 10 Fragen in seiner eigenen Sprache. Wer mehr richtig hat, gewinnt – bei Gleichstand der Schnellere.'));
  }
  function playDuel(existing, opponent) {
    if (!needCards(8)) return;
    const pool = quizPool(), a = $('gameArea'); let n = 0, score = 0, q, locked = false; const t0 = Date.now();
    function next() {
      if (n >= 10) return done();
      q = makeQ(pool); locked = false; n++;
      $('gameInfo').textContent = `Frage ${n} / 10 · ${score} richtig`;
      a.innerHTML = `<div class="q-card"><span class="lang">${q.rev ? 'Deutsch' : esc(api.lang)}</span><span class="q-word">${esc(q.prompt)}</span></div><div class="opts" id="dlOpts"></div>`;
      q.options.forEach(o => {
        const b = el('button', 'opt'); b.type = 'button'; b.textContent = o;
        b.onclick = () => {
          if (locked) return; locked = true;
          if (o === q.answer) { b.classList.add('ok'); score++; later(next, 300); }
          else { b.classList.add('bad'); [...$('dlOpts').children].find(x => x.textContent === q.answer)?.classList.add('ok'); later(next, 900); }
        };
        $('dlOpts').appendChild(b);
      });
    }
    async function done() {
      const secs = Math.round((Date.now() - t0) / 1000), fb = cloud(), { F, db } = fb;
      a.innerHTML = '<p class="hint">Speichere Ergebnis …</p>';
      try {
        if (existing) {
          const d = Object.assign({}, existing, { bLang: api.lang, bScore: score, bTime: secs, status: 'done', finished: Date.now() });
          d.winner = winnerOf(d);
          await F.updateDoc(F.doc(db, 'duels', existing.id), { bLang: d.bLang, bScore: score, bTime: secs, status: 'done', finished: d.finished, winner: d.winner, notified: false });
          const won = d.winner === 'b', tie = d.winner === 'tie';
          store.duelsCounted = store.duelsCounted || {}; store.duelsCounted[existing.id] = 1;
          if (won) S().duelsWon = (S().duelsWon || 0) + 1;
          gain(won ? 20 : 8);
          api.setMood(tie ? 'Unentschieden! 🤝' : won ? 'Duell gewonnen! 🏆' : 'Knapp verloren – Revanche!', true, won ? 'bounce' : 'shake');
          endScreen(tie ? 'Unentschieden' : won ? 'Gewonnen!' : 'Verloren', [`<span class="big">${score} : ${d.aScore}</span>`, `gegen ${esc(d.aNick || 'Gegner')} · du ${secs} s, ${esc(d.aNick || 'Gegner')} ${d.aTime} s`, `+${won ? 20 : 8} Punkte`], () => start('duel'));
        } else {
          await F.addDoc(F.collection(db, 'duels'), { a: api.cloud.uid, b: opponent.id, aNick: store.nick || 'Jemand', bNick: opponent.nick, aLang: api.lang, aScore: score, aTime: secs, status: 'open', created: Date.now(), invited: false });
          gain(8);
          api.setMood(`Duell an ${opponent.nick} geschickt! 🥊`, true, 'bounce');
          endScreen('Herausforderung verschickt', [`<span class="big">${score} / 10</span>`, `in ${secs} s · ${esc(opponent.nick)} bekommt Bescheid`, '+8 Punkte'], () => start('duel'));
        }
        api.persist(['user', 'score']);
      } catch (e) {
        a.innerHTML = '<p class="hint">Das Duell konnte nicht gespeichert werden. In Firebase fehlen vermutlich noch die neuen Regeln (siehe Anleitung).</p>';
      }
    }
    next();
  }

  /* ---------- Abzeichen ---------- */
  const goalDays = () => Object.values(store.days || {}).filter(s => s >= (store.goalMin || 30) * 60).length;
  const langsLearned = () => { const c = {}; for (const k in store.prog) { const l = k.split('\u0001')[0]; c[l] = (c[l] || 0) + 1; } return Object.values(c).filter(n => n >= 10).length; };
  const BADGES = [
    { id: 'serie3', icon: '🔥', name: 'Feuer gefangen', req: '3 Tage Serie', ok: () => api.liveStreak() >= 3 },
    { id: 'serie7', icon: '📅', name: 'Eine Woche dran', req: '7 Tage Serie', ok: () => api.liveStreak() >= 7 },
    { id: 'serie30', icon: '🏆', name: 'Monats-Legende', req: '30 Tage Serie', ok: () => api.liveStreak() >= 30 },
    { id: 'known50', icon: '📗', name: 'Wortsammler', req: '50 Wörter gekonnt', ok: () => api.knownTotal() >= 50 },
    { id: 'known100', icon: '📚', name: 'Bücherwurm', req: '100 Wörter gekonnt', ok: () => api.knownTotal() >= 100 },
    { id: 'known300', icon: '🎓', name: 'Sprachprofi', req: '300 Wörter gekonnt', ok: () => api.knownTotal() >= 300 },
    { id: 'goal1', icon: '⏱️', name: 'Erstes Tagesziel', req: 'Einmal das Tagesziel geschafft', ok: () => goalDays() >= 1 },
    { id: 'goal7', icon: '💪', name: 'Durchhalter', req: 'An 7 Tagen das Tagesziel', ok: () => goalDays() >= 7 },
    { id: 'hours5', icon: '⌛', name: 'Fleißig', req: '5 Stunden gelernt', ok: () => api.totalSecs() >= 5 * 3600 },
    { id: 'blitz10', icon: '⚡', name: 'Blitzschnell', req: 'Blitzrunde: 10 richtig', ok: () => (S().blitzBest || 0) >= 10 },
    { id: 'blitz20', icon: '🌩️', name: 'Donnerwetter', req: 'Blitzrunde: 20 richtig', ok: () => (S().blitzBest || 0) >= 20 },
    { id: 'memory45', icon: '🧠', name: 'Elefantengedächtnis', req: 'Memory unter 45 Sekunden', ok: () => S().memoryBest && S().memoryBest < 45 },
    { id: 'puzzle10', icon: '🧩', name: 'Satzbaumeister', req: '10 Sätze gebaut', ok: () => (S().puzzles || 0) >= 10 },
    { id: 'catch15', icon: '🎣', name: 'Meisterfänger', req: 'Fangspiel: 15 gefangen', ok: () => (S().catchBest || 0) >= 15 },
    { id: 'speech10', icon: '🎤', name: 'Gute Aussprache', req: '10× richtig ausgesprochen', ok: () => (S().speechOk || 0) >= 10 },
    { id: 'duel1', icon: '🥊', name: 'Duellant', req: 'Ein Duell gewonnen', ok: () => (S().duelsWon || 0) >= 1 },
    { id: 'poly', icon: '🌍', name: 'Weltenbummler', req: 'In 2 Sprachen gelernt', ok: () => langsLearned() >= 2 },
    { id: 'xp1000', icon: '💎', name: 'Punkte-König', req: '1000 Punkte', ok: () => (store.xp || 0) >= 1000 }
  ];
  let toastTimer = null;
  function toast(text) {
    const t = $('toast'); t.textContent = text; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3500);
  }
  function checkBadges() {
    store.badges = store.badges || {};
    const fresh = BADGES.filter(b => !store.badges[b.id] && b.ok());
    if (!fresh.length) return;
    fresh.forEach(b => { store.badges[b.id] = api.today(); });
    const b = fresh[0];
    toast(`${b.icon} Neues Abzeichen: ${b.name}${fresh.length > 1 ? ` (+${fresh.length - 1} weitere)` : ''}`);
    api.setMood(`Abzeichen „${b.name}“ verdient! ${b.icon}`, true, 'bounce');
    api.persist(['user', 'score']);
    if (!$('viewPlay').hidden && !$('playMenu').hidden) renderBadges();
    renderWardrobe();
  }
  function badgeCount() { return Object.keys(store.badges || {}).length; }
  function renderBadges() {
    const g = $('badgeGrid'); if (!g) return; g.innerHTML = '';
    $('badgeCount').textContent = `${badgeCount()} / ${BADGES.length}`;
    BADGES.forEach(b => {
      const have = !!(store.badges || {})[b.id];
      const d = el('div', 'badge-item' + (have ? ' have' : ''));
      d.innerHTML = `<span class="bi">${have ? b.icon : '🔒'}</span><b>${esc(b.name)}</b><small>${esc(b.req)}</small>`;
      d.title = b.req;
      g.appendChild(d);
    });
  }

  /* ---------- Outfits ---------- */
  const OUTFITS = [
    { id: 'sunglasses', slot: 'face', icon: '🕶️', name: 'Sonnenbrille', xp: 100 },
    { id: 'orange', slot: 'face', icon: '🟠', name: 'Brille mit orangen Gläsern', xp: 150 },
    { id: 'jeans', slot: 'top', icon: '🧥', name: 'Dunkelblaue Jeansjacke', xp: 200 },
    { id: 'hearts', slot: 'face', icon: '😍', name: 'Herzbrille', xp: 250 },
    { id: 'ny', slot: 'hat', icon: '🧢', name: 'Dunkelbraune NY-Kappe', xp: 300 },
    { id: 'tehran', slot: 'top', icon: '👕', name: 'Tehran-T-Shirt', xp: 350 },
    { id: 'party', slot: 'hat', icon: '🥳', name: 'Partyhut', xp: 400 },
    { id: 'persian', slot: 'top', icon: '👕', name: '„I am Persian“-T-Shirt', xp: 450 },
    { id: 'larissa', slot: 'hat', icon: '🧢', name: '„Apo Larissa“-Kappe', xp: 500 },
    { id: 'ghorme', slot: 'top', icon: '💚', name: '„I ❤ Ghorme Sabzi“-T-Shirt', xp: 600 },
    { id: 'headphones', slot: 'hat', icon: '🎧', name: 'Kopfhörer', xp: 700 },
    { id: 'crown', slot: 'hat', icon: '👑', name: 'Krone', xp: 1200 }
  ];
  const SLOT_NAME = { hat: 'Kopf', face: 'Brille', top: 'Oberteil' };
  function applyOutfit() {
    const o = store.outfit || {};
    [$('seal'), $('monkey')].forEach(svg => {
      OUTFITS.forEach(x => svg.classList.toggle('o-' + x.id, o[x.slot] === x.id && (store.xp || 0) >= x.xp));
      svg.classList.toggle('hat-on', ['party', 'crown', 'ny', 'larissa'].includes(o.hat) && OUTFITS.some(x => x.id === o.hat && (store.xp || 0) >= x.xp));
    });
  }
  function renderWardrobe() {
    const box = $('wardrobe'); if (!box) return; box.innerHTML = '';
    const o = store.outfit = store.outfit || {};
    OUTFITS.forEach(x => {
      const open = (store.xp || 0) >= x.xp, on = o[x.slot] === x.id;
      const b = el('button', 'outfit' + (on ? ' on' : '') + (open ? '' : ' locked')); b.type = 'button';
      b.innerHTML = `<span class="oi">${open ? x.icon : '🔒'}</span><b>${x.name}</b><small>${SLOT_NAME[x.slot]} · ${open ? (on ? 'angezogen ✓' : 'antippen') : `ab ${x.xp} Punkten`}</small>`;
      b.disabled = !open;
      b.onclick = () => { o[x.slot] = on ? '' : x.id; api.persist(['user']); applyOutfit(); renderWardrobe(); api.setMood(on ? 'Wieder ganz normal!' : `${x.name} steht mir! ${x.icon}`, true, 'bounce'); };
      box.appendChild(b);
    });
    const nextUp = OUTFITS.find(x => (store.xp || 0) < x.xp);
    $('wardrobeHint').textContent = nextUp ? `Noch ${nextUp.xp - (store.xp || 0)} Punkte bis ${nextUp.icon} ${nextUp.name}. Arzi und Robbie tragen, was du anziehst.` : 'Alles freigeschaltet! Arzi und Robbie tragen, was du anziehst.';
  }

  applyOutfit();
  return { render, stop, applyOutfit, checkBadges, badgeCount, isPlaying: () => !!stopFn };
}
