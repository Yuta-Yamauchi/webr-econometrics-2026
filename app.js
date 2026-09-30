import { lessons } from './lessons.js';

const $ = id => document.getElementById(id);
const STORAGE = 'econometrics-webr-2026-v2';
const WEBR_BASE = 'https://webr.r-wasm.org/v0.6.0/';
const templates = new Map();
let stored = {};
try { stored = JSON.parse(localStorage.getItem(STORAGE) || '{}'); } catch { /* Fresh session. */ }
const states = new Map(lessons.map(lesson => {
  const defaults = Object.fromEntries(lesson.fields.map(f => [f.key, f.value]));
  const saved = stored[lesson.id] || {};
  return [lesson.id, {
    params: {...defaults, ...(saved.params || {})}, draft: typeof saved.draft === 'string' ? saved.draft : null,
    scenario: saved.scenario || 'base', mode: saved.mode === 'code' ? 'code' : 'settings',
    history: []
  }];
}));
let lesson = lessons.find(x => x.id === location.hash.slice(1)) || lessons[0];
let engine = null, generation = 0, ready = false, busy = false, lastRun = null, runNumber = 0;
let runtimeVersion = '', rVersion = '';
let loaded = false;
const downloads = [];

function persist() {
  const data = Object.fromEntries([...states].map(([id, s]) => [id, {
    params:s.params, draft:s.draft, scenario:s.scenario, mode:s.mode
  }]));
  try { localStorage.setItem(STORAGE, JSON.stringify(data)); }
  catch { /* The running experiment also works with storage disabled. */ }
}
function status(message, kind = '') {
  $('status').textContent = message;
  $('status-dot').className = `status-dot ${kind}`;
}
function showError(message) {
  $('error').textContent = message;
  $('error').hidden = false;
}
function setBusy(value) {
  busy = value;
  document.body.classList.toggle('busy', value);
  $('run').disabled = value || !ready || !loaded;
  $('resample').disabled = value || !ready || !loaded || states.get(lesson.id).mode === 'code';
  $('run').textContent = value ? 'Rで計算中…' : '実行';
  for (const el of document.querySelectorAll('#lesson-nav button, #fields input, #fields select, #scenario, #mode-settings, #mode-code, #reset-settings, #apply-settings')) el.disabled = value;
  $('code').readOnly = value;
  $('restart').textContent = value ? '停止・Rを再起動' : 'Rを再起動';
}
function rValue(value, field) {
  if (field.options) return JSON.stringify(String(value));
  return `${Number(value)}${field.integer ? 'L' : ''}`;
}
function makeCode() {
  const state = states.get(lesson.id);
  const settings = lesson.fields.map(f => `${f.key} <- ${rValue(state.params[f.key], f)}  # ${f.label}`).join('\n');
  return templates.get(lesson.id).replace(/# SETTINGS_BEGIN[\s\S]*?# SETTINGS_END/, `# SETTINGS_BEGIN\n${settings}\n# SETTINGS_END`);
}
function readSettings() {
  if (!$('settings-form').reportValidity()) return false;
  const state = states.get(lesson.id);
  for (const field of lesson.fields) {
    const el = $(`param-${field.key}`);
    state.params[field.key] = field.options ? el.value : Number(el.value);
  }
  persist();
  return true;
}
function markCustom() {
  states.get(lesson.id).scenario = 'custom';
  $('scenario').value = 'custom';
  $('scenario-description').textContent = '下の値を使って実行する。';
}
function setMode(mode) {
  const state = states.get(lesson.id);
  state.mode = mode;
  if (mode === 'code' && state.draft === null && loaded) state.draft = makeCode();
  $('mode-settings').setAttribute('aria-pressed', String(mode === 'settings'));
  $('mode-code').setAttribute('aria-pressed', String(mode === 'code'));
  $('settings-form').hidden = mode === 'code';
  $('code-panel').hidden = mode !== 'code';
  document.body.classList.toggle('code-mode', mode === 'code');
  $('code').value = state.draft || '';
  $('run-help').textContent = mode === 'code'
    ? '編集コードを実行する。標本を取り直すときはコード内のseedを変更する。'
    : '設定から生成したRコードを実行する。「乱数を変えて実行」はシードだけを変更する。';
  setBusy(busy);
  persist();
}
function clearResults() {
  for (const item of downloads.splice(0)) { URL.revokeObjectURL(item.url); item.line.remove(); }
  lastRun = null;
  $('error').hidden = true;
  $('metrics').replaceChildren();
  $('plots').replaceChildren();
  $('output').textContent = '未実行';
  $('exports').hidden = true;
  $('settings-details').hidden = true;
  $('result-summary').textContent = '設定を確かめて実行すると，Rの計算結果と図がここに表示される。';
}
function renderLesson() {
  const state = states.get(lesson.id);
  $('lesson-nav').replaceChildren(...lessons.map(item => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = item.short;
    b.setAttribute('aria-current', String(item.id === lesson.id));
    b.addEventListener('click', () => {
      lesson = item; location.hash = item.id; renderLesson();
    });
    return b;
  }));
  $('course').textContent = lesson.course;
  $('lesson-title').textContent = lesson.title;
  $('intro').textContent = lesson.intro;
  $('model').innerHTML = lesson.model; // Trusted local teaching content only.
  $('assumptions').textContent = lesson.assumptions;
  $('scenario').replaceChildren(...(lesson.scenarios || []).map(s => new Option(s.name, s.id)), new Option('自由設定', 'custom'));
  if (state.scenario !== 'custom' && !(lesson.scenarios || []).some(s => s.id === state.scenario)) state.scenario = 'base';
  $('scenario').value = state.scenario;
  $('scenario-description').textContent = (lesson.scenarios || []).find(s => s.id === state.scenario)?.description || '下の値を使って実行する。';
  $('fields').replaceChildren(...lesson.fields.map(field => {
    const box = document.createElement('div'); box.className = 'field';
    const label = document.createElement('label'); label.htmlFor = `param-${field.key}`; label.textContent = field.label;
    const input = document.createElement(field.options ? 'select' : 'input'); input.id = label.htmlFor;
    if (field.options) {
      for (const [value, name] of field.options) { const o = new Option(name, value); input.add(o); }
    } else {
      input.type = 'number'; input.min = field.min; input.max = field.max; input.step = field.step; input.required = true;
    }
    input.value = state.params[field.key];
    input.addEventListener('change', () => { markCustom(); readSettings(); });
    box.append(label, input);
    if (field.hint) {
      const hint = document.createElement('span'); hint.className = 'hint'; hint.id = `${input.id}-hint`; hint.textContent = field.hint;
      input.setAttribute('aria-describedby', hint.id); box.append(hint);
    }
    return box;
  }));
  clearResults();
  setMode(state.mode);
  renderHistory();
}

// RFC 4180-style CSV reader: R may quote labels and escape embedded quotes.
export function parseCSV(text) {
  if (!text) return [];
  const rows = []; let row = [], cell = '', quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell.length || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  return rows;
}
function csvObjects(text) {
  const [header, ...rows] = parseCSV(text);
  return header ? rows.map(row => Object.fromEntries(header.map((h, i) => [h, row[i] ?? '']))) : [];
}
function formatNumber(value) {
  const number = Number(value);
  if (value === '' || !Number.isFinite(number)) return String(value);
  if (number !== 0 && Math.abs(number) < .0001) return number.toExponential(3);
  return number.toLocaleString('ja-JP', {maximumFractionDigits:5});
}
function makeTable(headers, rows, numeric = []) {
  const table = document.createElement('table');
  const thead = table.createTHead(), head = thead.insertRow();
  for (const name of headers) { const th = document.createElement('th'); th.scope = 'col'; th.textContent = name; head.append(th); }
  const tbody = table.createTBody();
  for (const cells of rows) {
    const row = tbody.insertRow();
    cells.forEach((value, i) => {
      const td = row.insertCell();
      if (value instanceof Node) td.append(value); else td.textContent = value;
      if (numeric.includes(i)) td.classList.add('number');
    });
  }
  return table;
}
function download(name, body, type = 'text/plain;charset=utf-8') {
  const blob = body instanceof Blob ? body : new Blob([body], {type});
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; a.textContent = `${name} を保存`;
  const line = document.createElement('p'); line.append(a); $('download-list').prepend(line);
  downloads.push({url, line});
  if (downloads.length > 5) { const previous = downloads.shift(); URL.revokeObjectURL(previous.url); previous.line.remove(); }
  a.click();
}
function downloadCSV(key) {
  if (lastRun?.csv[key]) download(`${lastRun.filePrefix}_${key}.csv`, '\uFEFF' + lastRun.csv[key], 'text/csv;charset=utf-8');
}
function renderHistory() {
  const history = states.get(lesson.id).history;
  $('history-count').textContent = `${history.length}件`;
  $('history').replaceChildren();
  if (!history.length) return;
  const rows = [...history].reverse().map(run => {
    const details = document.createElement('details'), summary = document.createElement('summary'), pre = document.createElement('pre');
    summary.textContent = `実行 ${run.number} · ${run.mode === 'code' ? '編集コード' : '設定'}`;
    pre.textContent = run.settingsText || run.code;
    details.append(summary, pre);
    const values = Object.fromEntries(run.metrics.map(m => [m.key, m.value]));
    return [details, ...lesson.comparisons.map(key => values[key] === undefined ? '—' : formatNumber(values[key]))];
  });
  $('history').append(makeTable(['実行・設定', ...lesson.comparisonLabels], rows, lesson.comparisons.map((_,i)=>i+1)));
}

async function startEngine() {
  const token = ++generation;
  const old = engine; engine = null; ready = false;
  if (old) { try { old.close(); } catch { /* A previously closed worker. */ } }
  setBusy(false);
  status('Rの準備中… 初回は読み込みに時間がかかる');
  $('restart').disabled = true;
  try {
    const { WebR } = await import(`${WEBR_BASE}webr.mjs`);
    if (token !== generation) return;
    const next = new WebR({baseUrl: WEBR_BASE, interactive:false});
    engine = next;
    await next.init();
    if (token !== generation) return;
    runtimeVersion = String(next.version || '0.6.0');
    rVersion = await next.evalRString('R.version.string');
    ready = true;
    $('versions').textContent = `WebR ${runtimeVersion} · ${rVersion}`;
    status('Rの準備完了', 'ready');
    $('error').hidden = true;
  } catch (error) {
    if (token !== generation) return;
    status('Rの読み込みに失敗', 'error');
    showError(`Rを読み込めなかった。インターネット接続を確認して「Rを再起動」を押す。\n${error.message || error}`);
  } finally {
    if (token === generation) { $('restart').disabled = false; setBusy(false); }
  }
}

async function run() {
  if (!ready || busy || !loaded) return;
  const state = states.get(lesson.id);
  if (state.mode === 'settings' && !readSettings()) return;
  const code = state.mode === 'code' ? $('code').value : makeCode();
  if (!code.trim()) { showError('実行するRコードを入力する。'); return; }
  if (state.mode === 'code') { state.draft = code; persist(); }
  const localEngine = engine, token = generation, started = performance.now();
  const currentLesson = lesson, mode = state.mode;
  clearResults(); setBusy(true); status('Rで計算中…');
  $('result-summary').textContent = 'Rで標本の生成・推定・描画を実行中。';
  let shelter;
  try {
    shelter = await new localEngine.Shelter();
    const env = await shelter.evalR('new.env(parent = globalenv())');
    const capture = await shelter.captureR(code, {
      env, captureGraphics:{width:960, height:540, pointsize:20, bg:'white'},
      captureStreams:true, captureConditions:true, withAutoprint:true, throwJsException:true
    });
    if (token !== generation) { capture.images.forEach(image => image.close()); return; }
    const csv = {};
    for (const key of ['settings','metrics','data','repetitions','groups']) {
      csv[key] = await localEngine.evalRString(`if (exists("result", inherits = FALSE) && is.list(result) && is.data.frame(result[["${key}"]])) paste(capture.output(write.csv(result[["${key}"]], row.names = FALSE, na = "NA")), collapse = "\\n") else ""`, {env});
    }
    const strings = {};
    for (const key of ['model','plot_titles','plot_notes']) {
      strings[key] = await localEngine.evalRRaw(`if (exists("result", inherits = FALSE) && is.list(result) && is.character(result[["${key}"]])) result[["${key}"]] else character(0)`, 'string[]', {env});
    }
    if (token !== generation) { capture.images.forEach(image => image.close()); return; }
    const outputParts = [];
    for (const part of capture.output) {
      const data = part.data;
      if (typeof data === 'string') outputParts.push(data);
      else if (data && typeof data.message === 'string') outputParts.push(`${part.type}: ${data.message}`);
      else if (data?.toJs) outputParts.push(`${part.type}: ${JSON.stringify(await data.toJs())}`);
      else outputParts.push(`${part.type}: ${JSON.stringify(data)}`);
    }
    const number = ++runNumber;
    const metrics = csvObjects(csv.metrics);
    const settingsText = csvObjects(csv.settings).map(r => `${r.setting} = ${r.value}`).join('\n');
    const record = {
      number, lessonId:currentLesson.id, lessonTitle:currentLesson.title, mode, code, csv, metrics, settingsText,
      model:strings.model, time:new Date().toISOString(), runtimeVersion, rVersion,
      output:outputParts.join('\n'), seconds:(performance.now() - started) / 1000,
      filePrefix:`${currentLesson.id}_run${String(number).padStart(2,'0')}`
    };
    lastRun = record;
    if (metrics.length) $('metrics').append(makeTable(['計算した量','Rの計算結果'], metrics.map(r => [r.label ?? r.key ?? '', formatNumber(r.value)]), [1]));
    capture.images.forEach((image, i) => {
      const figure = document.createElement('figure'); figure.className = 'plot-card';
      const heading = document.createElement('h3'); heading.textContent = `${i + 1}. ${strings.plot_titles[i] || 'Rによる図'}`;
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      canvas.setAttribute('role','img'); canvas.setAttribute('aria-label', strings.plot_notes[i] || heading.textContent);
      canvas.getContext('2d').drawImage(image,0,0); image.close();
      const caption = document.createElement('figcaption');
      if (strings.plot_notes[i]) { const p = document.createElement('p'); p.textContent = strings.plot_notes[i]; caption.append(p); }
      const button = document.createElement('button'); button.type = 'button'; button.textContent = `図${i + 1}を保存 PNG`;
      button.addEventListener('click', () => canvas.toBlob(blob => { if (blob) download(`${record.filePrefix}_figure${i + 1}.png`, blob); }, 'image/png'));
      caption.append(button); figure.append(heading, canvas, caption); $('plots').append(figure);
    });
    $('output').textContent = record.output || '実行完了。テキスト出力なし。';
    $('result-summary').textContent = `実行 ${number} · ${mode === 'code' ? '編集コード' : '設定から生成したコード'} · ${record.seconds.toFixed(1)}秒 · 図${capture.images.length}点。以下はこの実行の結果である。`;
    $('executed-settings').textContent = settingsText || '設定表なし。実行したコードを参照。';
    $('executed-code').textContent = code;
    $('settings-details').hidden = false; $('exports').hidden = false;
    $('download-data').disabled = !csv.data;
    $('download-repetitions').disabled = !csv.repetitions;
    $('download-metrics').disabled = !csv.metrics;
    state.history.push(record); if (state.history.length > 8) state.history.shift();
    renderHistory();
    status('実行完了', 'ready');
  } catch (error) {
    if (token !== generation) return;
    clearResults();
    showError(`Rの実行が完了しなかった。設定またはコードを確認する。\n${error.message || error}`);
    $('output').textContent = String(error.message || error);
    $('output-details').open = true;
    $('result-summary').textContent = 'この実行の結果は未生成。';
    status('Rの実行エラー', 'error');
  } finally {
    if (token === generation) {
      if (shelter) { try { await shelter.purge(); } catch { /* Restart releases the worker. */ } }
      setBusy(false);
    }
  }
}

$('run').addEventListener('click', run);
$('resample').addEventListener('click', () => {
  if (!readSettings()) return;
  const random = new Uint32Array(1); crypto.getRandomValues(random);
  const state = states.get(lesson.id); state.params.seed = random[0] % 2147483647;
  $('param-seed').value = state.params.seed; markCustom(); persist(); run();
});
$('restart').addEventListener('click', () => {
  if (busy) { clearResults(); $('result-summary').textContent = '実行を停止した。コードを確認し，再実行できる。'; }
  startEngine();
});
$('mode-settings').addEventListener('click', () => setMode('settings'));
$('mode-code').addEventListener('click', () => { if (readSettings()) setMode('code'); });
$('apply-settings').addEventListener('click', () => {
  if (!loaded) return;
  states.get(lesson.id).draft = makeCode(); $('code').value = states.get(lesson.id).draft; persist();
});
$('reset-settings').addEventListener('click', () => {
  const state = states.get(lesson.id);
  state.params = Object.fromEntries(lesson.fields.map(f => [f.key, f.value]));
  for (const f of lesson.fields) $(`param-${f.key}`).value = f.value;
  state.scenario = 'base'; $('scenario').value = 'base';
  $('scenario-description').textContent = lesson.scenarios?.find(s=>s.id==='base')?.description || '';
  persist();
});
$('scenario').addEventListener('change', () => {
  if ($('scenario').value === 'custom') { markCustom(); persist(); return; }
  const selected = lesson.scenarios?.find(s=>s.id===$('scenario').value);
  if (!selected) return;
  const state=states.get(lesson.id);
  state.scenario=selected.id;
  state.params={...Object.fromEntries(lesson.fields.map(f=>[f.key,f.value])),...selected.params};
  for (const f of lesson.fields) $(`param-${f.key}`).value=state.params[f.key];
  $('scenario-description').textContent=selected.description;
  setMode('settings'); persist();
});
$('code').addEventListener('input', () => { states.get(lesson.id).draft = $('code').value; persist(); });
$('code').addEventListener('keydown', event => {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); run(); }
  if (event.key === 'Tab') {
    event.preventDefault();
    const el = $('code'), start = el.selectionStart, end = el.selectionEnd;
    el.setRangeText('  ',start,end,'end'); el.dispatchEvent(new Event('input'));
  }
});
$('download-r').addEventListener('click', () => { if (lastRun) download(`${lastRun.filePrefix}.R`, lastRun.code); });
$('download-data').addEventListener('click', () => downloadCSV('data'));
$('download-repetitions').addEventListener('click', () => downloadCSV('repetitions'));
$('download-metrics').addEventListener('click', () => downloadCSV('metrics'));
window.addEventListener('hashchange', () => {
  const target = lessons.find(x => x.id === location.hash.slice(1));
  if (target && target.id !== lesson.id && !busy) { lesson = target; renderLesson(); }
});

renderLesson();
try {
  if (location.protocol === 'file:') throw new Error('serve.pyを起動し，http://127.0.0.1:8765/ から開く。起動手順はREADME.mdを参照。');
  await Promise.all(lessons.map(async item => {
    const response = await fetch(item.file);
    if (!response.ok) throw new Error(`${item.file}: HTTP ${response.status}`);
    templates.set(item.id, await response.text());
  }));
  loaded = true; setMode(states.get(lesson.id).mode);
  await startEngine();
} catch (error) {
  status('教材の読み込みに失敗', 'error');
  showError(String(error.message || error));
}
