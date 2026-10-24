/* Robbi – Spracherkennung
 * 1) Eingebaute Erkennung des Browsers (schnell, braucht keinen Download), wenn das Gerät die Sprache kann.
 * 2) Sonst – vor allem für Farsi auf dem iPhone – Whisper direkt auf dem Handy (transformers.js).
 *    Das Modell wird beim ersten Mal geladen (~80 MB) und danach vom Browser zwischengespeichert.
 */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const SR_LANG = { Farsi: 'fa-IR', Griechisch: 'el-GR', Italienisch: 'it-IT', Spanisch: 'es-ES', 'Französisch': 'fr-FR' };
const WHISPER_LANG = { Farsi: 'persian', Griechisch: 'greek', Italienisch: 'italian', Spanisch: 'spanish', 'Französisch': 'french' };
const TJS = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2';
const MODEL = 'Xenova/whisper-base';
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const canRecord = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
// Sprachen, bei denen die eingebaute Erkennung auf diesem Gerät nicht geklappt hat → ab dann Whisper
const nativeFailed = new Set(JSON.parse((() => { try { return localStorage.getItem('robbi.srFailed') || '[]'; } catch (e) { return '[]'; } })()));
function rememberFail(lang) { nativeFailed.add(lang); try { localStorage.setItem('robbi.srFailed', JSON.stringify([...nativeFailed])); } catch (e) {} }

const info = (code, detail) => { const e = new Error(code); e.detail = detail; return e; };
export const last = { secs: 0, rms: 0, text: '' };
export function engineFor(lang) {
  if (!SR_LANG[lang]) return null;
  const nativeOk = !!SR && !nativeFailed.has(lang) && !(isIOS && lang === 'Farsi');   // iPhone kennt kein Farsi
  if (nativeOk) return 'native';
  return canRecord() ? 'whisper' : null;
}
export const speechSupported = lang => !!engineFor(lang);
export function whisperReady() { return !!asr; }

/* ---------- Whisper laden ---------- */
let asr = null, asrP = null;
function loadWhisper(onProgress) {
  if (asr) return Promise.resolve(asr);
  if (!asrP) {
    const files = {};
    asrP = (async () => {
      const T = await import(/* webpackIgnore: true */ TJS);
      T.env.allowLocalModels = false;
      const p = await T.pipeline('automatic-speech-recognition', MODEL, {
        dtype: 'q8', device: 'wasm',
        progress_callback: ev => {
          if (ev.status === 'progress' && ev.total) {
            files[ev.file] = [ev.loaded || 0, ev.total];
            let l = 0, t = 0; for (const k in files) { l += files[k][0]; t += files[k][1]; }
            onProgress && onProgress(Math.round(l / t * 100), Math.round(t / 1e6));
          }
        }
      });
      asr = p; return p;
    })().catch(e => { asrP = null; throw e; });
  }
  return asrP;
}

/* ---------- Aufnahme → 16 kHz Mono ---------- */
async function toPcm16k(blob) {
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC();
  const buf = await blob.arrayBuffer();
  const ab = await new Promise((res, rej) => { const p = ctx.decodeAudioData(buf, res, rej); if (p && p.then) p.then(res, rej); });
  try { ctx.close(); } catch (e) {}
  const len = Math.max(1, Math.ceil(ab.duration * 16000));
  const off = new OfflineAudioContext(1, len, 16000);
  const src = off.createBufferSource(); src.buffer = ab; src.connect(off.destination); src.start();
  const r = await off.startRendering();
  return r.getChannelData(0);
}

/* ---------- Einheitliche Schnittstelle ----------
 * const l = createListener(lang, { onState(text), onProgress(pct, mb) });
 * l.start() → Promise<string[]> (gehörte Varianten) · l.stop() beendet die Aufnahme · l.abort()
 * onState bekommt: 'listening' | 'loading' | 'thinking'
 */
export function createListener(lang, cb = {}) {
  const kind = engineFor(lang);
  let rec = null, media = null, stream = null, timer = null, aborted = false;
  const cleanup = () => { clearTimeout(timer); if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; };
  return {
    kind,
    start() {
      aborted = false;
      if (kind === 'native') return new Promise((resolve, reject) => {
        rec = new SR(); rec.lang = SR_LANG[lang]; rec.interimResults = false; rec.maxAlternatives = 5;
        let done = false;
        rec.onresult = ev => { done = true; resolve([...ev.results[0]].map(r => r.transcript)); };
        rec.onerror = ev => {
          done = true;
          if (ev.error === 'language-not-supported' || ev.error === 'service-not-allowed') { rememberFail(lang); reject(new Error('fallback')); }
          else reject(new Error(ev.error || 'error'));
        };
        rec.onend = () => { if (!done) reject(new Error('no-speech')); };
        cb.onState && cb.onState('listening');
        try { rec.start(); } catch (e) { reject(new Error('start')); }
      });
      // Whisper: Modell (falls nötig) laden, dann bis zu 6 s aufnehmen (zweites Tippen beendet früher)
      return (async () => {
        if (!asr) { cb.onState && cb.onState('loading'); await loadWhisper(cb.onProgress).catch(() => { throw new Error('load'); }); }
        if (aborted) throw new Error('aborted');
        try { stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } }); }
        catch (e) { throw new Error('not-allowed'); }
        const chunks = [];
        media = new MediaRecorder(stream);
        const stopped = new Promise(r => { media.onstop = r; });
        media.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
        media.start();
        cb.onState && cb.onState('listening');
        timer = setTimeout(() => { if (media && media.state === 'recording') media.stop(); }, 6000);
        await stopped; cleanup();
        if (aborted) throw new Error('aborted');
        cb.onState && cb.onState('thinking');
        const blob = new Blob(chunks, { type: chunks[0] ? chunks[0].type : 'audio/mp4' });
        if (!blob.size) throw info('empty', 'Die Aufnahme ist leer (0 Byte).');
        let pcm;
        try { pcm = await toPcm16k(blob); } catch (e) { throw info('decode', `Die Aufnahme ließ sich nicht lesen (${blob.type || 'unbekanntes Format'}).`); }
        const secs = pcm.length / 16000;
        let sum = 0; for (let k = 0; k < pcm.length; k++) sum += pcm[k] * pcm[k];
        const rms = Math.sqrt(sum / Math.max(1, pcm.length));
        last.secs = secs; last.rms = rms;
        if (secs < 0.4) throw info('short', `Die Aufnahme war nur ${secs.toFixed(1)} s lang.`);
        if (rms < 0.002) throw info('silent', `Die Aufnahme war stumm (${secs.toFixed(1)} s, Pegel ${rms.toFixed(4)}).`);
        // leise Aufnahmen etwas lauter machen – hilft der Erkennung
        let peak = 0; for (let k = 0; k < pcm.length; k++) peak = Math.max(peak, Math.abs(pcm[k]));
        if (peak > 0 && peak < .5) { const g = Math.min(8, .9 / peak); for (let k = 0; k < pcm.length; k++) pcm[k] *= g; }
        const out = await asr(pcm, { language: WHISPER_LANG[lang], task: 'transcribe' });
        const text = (Array.isArray(out) ? out[0].text : out.text || '').replace(/\[[^\]]*\]|\([^)]*\)/g, '').trim();
        last.text = text;
        if (!text) throw info('nothing', `Die KI hat in ${secs.toFixed(1)} s Aufnahme nichts verstanden.`);
        return [text];
      })().catch(e => { cleanup(); throw e; });
    },
    stop() { if (kind === 'native') { try { rec && rec.stop(); } catch (e) {} } else if (media && media.state === 'recording') media.stop(); },
    abort() { aborted = true; try { rec && rec.abort(); } catch (e) {} try { if (media && media.state === 'recording') media.stop(); } catch (e) {} cleanup(); },
    isRecording() { return kind === 'whisper' ? !!(media && media.state === 'recording') : false; }
  };
}
