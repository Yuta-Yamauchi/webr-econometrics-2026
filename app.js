import { lessons } from './lessons.js';
import { addFieldHelp, addButtonHelp, dismissTooltips } from './tooltips.js';
import { renderMathText, renderFieldLabel, renderModel } from './math.js';
import { guidance, parameterChanges, changeKind } from './guidance.js';

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
    history: [], baseline: null, latest: null, view: guidance[lesson.id].actions[0].view
  }];
}));
let lesson = lessons.find(x => x.id === location.hash.slice(1)) || lessons[0];
let engine = null, generation = 0, ready = false, busy = false, lastRun = null, runNumber = 0;
let runtimeVersion = '', rVersion = '';
let loaded = false;
let comparisonTemplate = '';
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
  if (value) dismissTooltips();
  busy = value;
  document.body.classList.toggle('busy', value);
  $('run').disabled = value || !ready || !loaded;
  $('run-code').disabled = value || !ready || !loaded || states.get(lesson.id).mode !== 'code';
  const state = states.get(lesson.id);
  $('resample').disabled = value || !ready || !loaded || state.mode === 'code' || !state.latest || state.latest.mode !== 'settings' || isPending();
  $('run').textContent = value ? 'Rで計算中…' : state.mode === 'code' ? '編集コードを実行' : state.baseline ? '比較して実行' : '基準を作って実行';
  $('run-code').textContent = value ? 'Rで計算中…' : '編集コードを実行';
  for (const el of document.querySelectorAll('#lesson-nav button, #fields input, #fields select, #scenario, #mode-settings, #mode-code, #reset-settings, #apply-settings, #edit-generated-code, #use-settings, #comparison-view, #back-to-settings')) el.disabled = value;
  $('mode-code').disabled = value || !loaded;
  $('edit-generated-code').disabled = value || !loaded;
  $('code').readOnly = value;
  $('restart').textContent = value ? '停止・Rを再起動' : 'Rを再起動';
  $('pin-baseline').disabled = value || !state.latest || state.latest.mode !== 'settings' || state.latest === state.baseline;
  $('restore-baseline').disabled = value || !state.baseline;
  for (const button of document.querySelectorAll('#guide button')) {
    const action = guidance[lesson.id].actions[Number(button.dataset.action)];
    button.disabled = value || !state.baseline || String(state.params[action.key]) === String(action.value);
  }
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
function refreshCodePreview() {
  $('generated-code').textContent = loaded ? makeCode() : '教材の読み込み中';
}
function readSettings(report = true) {
  if (!$('settings-form').checkValidity()) {
    if (report) $('settings-form').reportValidity();
    updateChanges(); return false;
  }
  const state = states.get(lesson.id);
  for (const field of lesson.fields) {
    const el = $(`param-${field.key}`);
    state.params[field.key] = field.options ? el.value : Number(el.value);
  }
  persist();
  refreshCodePreview();
  updateChanges();
  return true;
}
function markCustom() {
  states.get(lesson.id).scenario = 'custom';
  $('scenario').value = 'custom';
  $('scenario-description').textContent = '下の値を使って実行する。';
}
function setMode(mode) {
  dismissTooltips();
  const state = states.get(lesson.id);
  state.mode = mode;
  if (mode === 'code' && state.draft === null && loaded) state.draft = makeCode();
  $('mode-settings').setAttribute('aria-pressed', String(mode === 'settings'));
  $('mode-code').setAttribute('aria-pressed', String(mode === 'code'));
  $('settings-form').hidden = mode === 'code';
  $('code-panel').hidden = mode !== 'code';
  $('generated-code-panel').hidden = mode === 'code';
  if (mode === 'code') $('code-details').open = true;
  document.body.classList.toggle('code-mode', mode === 'code');
  $('code').value = state.draft || '';
  refreshCodePreview();
  $('run-help').textContent = mode === 'code'
    ? '編集コードを実行する。標本を取り直すときはコード内のseedを変更する。'
    : '比較では現在のシードを使う。標本の取り直しではシードだけを変更する。';
  $('guide').hidden = mode === 'code';
  updateChanges();
  setBusy(busy);
  persist();
}
function clearResults() {
  for (const item of downloads.splice(0)) { URL.revokeObjectURL(item.url); item.line.remove(); }
  lastRun = null;
  $('error').hidden = true;
  $('metrics').replaceChildren();
  $('metrics-details').hidden = true;
  $('plots').replaceChildren();
  $('current-plots-details').hidden = true;
  $('baseline-controls').hidden = true;
  $('comparison-panel').hidden = true;
  $('comparison-error').hidden = true;
  $('comparison-plots').replaceChildren();
  $('comparison-metrics').replaceChildren();
  $('output').textContent = '未実行';
  $('output-details').hidden = true;
  $('exports').hidden = true;
  $('settings-details').hidden = true;
  $('result-summary').textContent = '実行すると図がここに表示される。';
}
function renderLesson() {
  dismissTooltips();
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
  renderModel($('model'), lesson.model);
  renderMathText($('assumptions'), lesson.assumptions);
  $('scenario').replaceChildren(...(lesson.scenarios || []).map(s => new Option(s.name, s.id)), new Option('自由設定', 'custom'));
  if (state.scenario !== 'custom' && !(lesson.scenarios || []).some(s => s.id === state.scenario)) state.scenario = 'base';
  $('scenario').value = state.scenario;
  renderMathText($('scenario-description'), (lesson.scenarios || []).find(s => s.id === state.scenario)?.description || '下の値を使って実行する。');
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
    input.addEventListener(field.options ? 'change' : 'input', () => { markCustom(); readSettings(false); });
    box.append(label, input);
    if (field.hint) {
      const hint = document.createElement('span'); hint.className = 'hint'; hint.id = `${input.id}-hint`; renderMathText(hint, field.hint);
      input.setAttribute('aria-describedby', hint.id); box.append(hint);
    }
    addFieldHelp(label, input, field.help);
    renderFieldLabel(label, field.label);
    const change = document.createElement('span'); change.className = 'field-change'; change.id = `${input.id}-change`; change.hidden = true;
    box.append(change);
    input.setAttribute('aria-describedby', `${input.getAttribute('aria-describedby') || ''} ${change.id}`.trim());
    return box;
  }));
  renderGuide();
  renderResults();
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
  for (const name of headers) { const th = document.createElement('th'); th.scope = 'col'; renderMathText(th, name); head.append(th); }
  const tbody = table.createTBody();
  for (const cells of rows) {
    const row = tbody.insertRow();
    cells.forEach((value, i) => {
      const td = row.insertCell();
      if (value instanceof Node) td.append(value);
      else if (numeric.includes(i)) td.textContent = value;
      else renderMathText(td, value);
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

function fieldValue(field, value) {
  return field.options?.find(([key]) => String(key) === String(value))?.[1] ?? String(value);
}
function isPending() {
  const state = states.get(lesson.id), previous = state.latest;
  if (!previous) return false;
  if (state.mode !== previous.mode) return true;
  if (state.mode === 'code') return $('code').value !== previous.code;
  return !$('settings-form').checkValidity() || parameterChanges(lesson.fields, previous.params, state.params).length > 0;
}
function fillChanges(node, before, after) {
  node.replaceChildren(...parameterChanges(lesson.fields, before, after).map(({field, before, after}) => {
    const item = document.createElement('li'), name = document.createElement('span');
    renderMathText(name, field.label);
    item.append(name, `：${fieldValue(field, before)} → ${fieldValue(field, after)}`);
    return item;
  }));
}
function updateChanges() {
  const state = states.get(lesson.id), base = state.baseline, previous = state.latest;
  const pending = isPending(), valid = $('settings-form').checkValidity();
  $('pending-status').textContent = previous
    ? pending ? `未実行の変更あり · 図は実行 ${previous.number} の結果` : `表示中の図：実行 ${previous.number}`
    : valid || state.mode === 'code' ? 'まだ実行していない設定' : '設定値を入力中';
  if (!valid && state.mode === 'settings' && previous) $('pending-status').textContent = `設定値を入力中 · 図は実行 ${previous.number} の結果`;
  $('pending-status').classList.toggle('is-pending', pending);
  $('changes-label').textContent = state.mode === 'code' ? '編集欄のRコードを実行する。' : base ? `基準（実行 ${base.number}）からの変更` : '';
  fillChanges($('parameter-changes'), state.mode === 'settings' ? base?.params : null, state.params);
  if (base && state.mode === 'settings' && !$('parameter-changes').children.length) $('changes-label').textContent += 'なし';
  for (const field of lesson.fields) {
    const input = $(`param-${field.key}`), hint = $(`param-${field.key}-change`);
    if (!input || !hint) continue;
    const changed = base && state.mode === 'settings' && String(base.params[field.key]) !== String(state.params[field.key]);
    input.closest('.field').classList.toggle('is-changed', Boolean(changed));
    hint.hidden = !changed;
    hint.textContent = changed ? `基準 ${fieldValue(field, base.params[field.key])} → ${fieldValue(field, state.params[field.key])}` : '';
  }
  const stage = !base ? 1 : !pending && previous && previous !== base && previous.mode === 'settings' ? 3 : 2;
  for (let n = 1; n <= 3; n++) {
    if (n === stage) $(`guide-step-${n}`).setAttribute('aria-current', 'step');
    else $(`guide-step-${n}`).removeAttribute('aria-current');
  }
  $('guide-instruction').textContent = !base
    ? 'まず現在の設定で実行し，比較の基準を作る。'
    : 'ボタンで1項目を変更し，比較して実行する。基準の結果は残る。';
  setBusy(busy);
}
function renderGuide() {
  const config = guidance[lesson.id];
  renderMathText($('guide-question'), config.question);
  $('guide-primary').replaceChildren(); $('guide-alternatives').replaceChildren();
  config.actions.forEach((action, i) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'secondary';
    button.dataset.action = i; renderMathText(button, action.label);
    button.setAttribute('aria-describedby', 'guide-instruction');
    button.addEventListener('click', () => {
      if (!readSettings()) return;
      const state = states.get(lesson.id);
      state.params[action.key] = action.value; state.view = action.view;
      $(`param-${action.key}`).value = action.value;
      markCustom(); persist(); refreshCodePreview(); updateChanges();
      $('change-summary').scrollIntoView({block:'center', behavior:'smooth'});
    });
    $(i === 0 ? 'guide-primary' : 'guide-alternatives').append(button);
  });
}
function savedImages(images) {
  return images.map(image => {
    try {
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      canvas.getContext('2d').drawImage(image, 0, 0);
      return {url:canvas.toDataURL('image/png'), width:image.width, height:image.height};
    } finally { image.close(); }
  });
}
function imageFigure(picture, title, name, className = 'plot-card', description = title) {
  const figure = document.createElement('figure'); figure.className = className;
  const heading = document.createElement(className.includes('comparison-figure') ? 'h4' : 'h3'); heading.textContent = title;
  const img = document.createElement('img'); img.src = picture.url; img.width = picture.width; img.height = picture.height; img.alt = description || title;
  const caption = document.createElement('figcaption'), button = document.createElement('button');
  button.type = 'button'; button.textContent = '図を保存 PNG';
  button.addEventListener('click', async () => download(name, await (await fetch(picture.url)).blob(), 'image/png'));
  caption.append(button); figure.append(heading, img, caption);
  addButtonHelp(button, '表示中の図をPNG画像として保存する。');
  return figure;
}
function renderComparison() {
  const state = states.get(lesson.id), record = state.latest, base = state.baseline;
  const compared = record?.comparison && record.comparison.referenceNumber === base?.number && base !== record;
  $('comparison-panel').hidden = !compared;
  $('comparison-error').hidden = !record?.comparisonError;
  $('comparison-error').textContent = record?.comparisonError ? `比較図を作成できなかった。今回の図は下で確認できる。\n${record.comparisonError}` : '';
  if (!compared) return;
  const config = guidance[lesson.id];
  $('comparison-kind').textContent = `基準：実行 ${base.number} → 今回：実行 ${record.number} · ${changeKind(lesson.fields, base.params, record.params)}`;
  fillChanges($('comparison-changes'), base.params, record.params);
  const view = config.views.find(v => v.id === state.view) || config.views[0];
  $('comparison-view').value = view.id;
  $('comparison-focus').textContent = view.focus;
  $('comparison-scale').textContent = record.comparison.histogramViews.includes(view.id)
    ? '共通の目盛り・共通のヒストグラム区間' : '横軸・縦軸は共通の目盛り';
  const index = config.views.findIndex(v => v.id === view.id) * 2;
  $('comparison-plots').replaceChildren(
    imageFigure(record.comparison.images[index], `基準 · 実行 ${base.number}`, `${record.filePrefix}_reference_${view.id}.png`, 'comparison-figure', `基準：${view.title}。${view.focus}`),
    imageFigure(record.comparison.images[index + 1], `今回 · 実行 ${record.number}`, `${record.filePrefix}_current_${view.id}.png`, 'comparison-figure is-current', `今回：${view.title}。${view.focus}`)
  );
  const ref = new Map(base.metrics.map(m => [m.key, m]));
  const now = new Map(record.metrics.map(m => [m.key, m]));
  const rows = config.metrics.filter(key => ref.has(key) && now.has(key)).map(key => {
    const a = ref.get(key), b = now.get(key), difference = Number(b.value) - Number(a.value);
    return [b.label, formatNumber(a.value), formatNumber(b.value), Number.isFinite(difference) ? `${difference > 0 ? '+' : ''}${formatNumber(difference)}` : '—'];
  });
  $('comparison-metrics').replaceChildren(makeTable(['計算した量','基準','今回','差'], rows, [1, 2, 3]));
}
function renderResults() {
  clearResults();
  const state = states.get(lesson.id), record = state.latest;
  $('comparison-view').replaceChildren(...guidance[lesson.id].views.map(v => new Option(v.title, v.id)));
  if (!record) return;
  lastRun = record;
  if (record.metrics.length) {
    $('metrics').append(makeTable(['計算した量','Rの計算結果'], record.metrics.map(r => [r.label ?? r.key ?? '', formatNumber(r.value)]), [1]));
    $('metrics-details').hidden = false;
  }
  $('plots').replaceChildren(...record.images.map((picture, i) => imageFigure(picture, `${i + 1}. ${record.plotTitles[i] || 'Rによる図'}`, `${record.filePrefix}_figure${i + 1}.png`, 'plot-card', record.plotNotes[i])));
  $('current-plots-details').hidden = !record.images.length;
  $('current-plots-details').open = !record.comparison || record === state.baseline;
  $('current-plots-title').textContent = `今回の全図 · 実行 ${record.number}`;
  $('output').textContent = record.output || '実行完了。テキスト出力なし。';
  $('output-details').hidden = false;
  $('result-summary').textContent = `実行 ${record.number} · ${record.mode === 'code' ? '編集コード' : record.kind} · ${record.seconds.toFixed(1)}秒`;
  $('executed-settings').textContent = record.settingsText || '設定表なし。実行したコードを参照。';
  $('executed-code').textContent = record.code;
  $('settings-details').hidden = false; $('exports').hidden = false;
  $('download-data').disabled = !record.csv.data;
  $('download-repetitions').disabled = !record.csv.repetitions;
  $('download-metrics').disabled = !record.csv.metrics;
  $('baseline-controls').hidden = !state.baseline;
  $('baseline-status').textContent = state.baseline ? `比較の基準：実行 ${state.baseline.number}` : '';
  renderComparison();
}
async function compareRuns(record, reference, shelter, localEngine, token) {
  const asR = run => 'list(' + ['settings','metrics','data','repetitions','groups'].map(key =>
    `${key}=${run.csv[key] ? `read.csv(text=${JSON.stringify(run.csv[key])},check.names=FALSE,stringsAsFactors=FALSE)` : 'data.frame()'}`).join(',') + ')';
  const env = await shelter.evalR('new.env(parent = globalenv())');
  const code = `${comparisonTemplate}\n.comparison <- econometrics_compare(${JSON.stringify(record.lessonId)},${asR(reference)},${asR(record)})`;
  const capture = await shelter.captureR(code, {env, captureGraphics:{width:720,height:700,pointsize:30,bg:'white'}, captureStreams:true,captureConditions:true,throwJsException:true});
  if (token !== generation) { capture.images.forEach(image => image.close()); return null; }
  const images = savedImages(capture.images);
  if (images.length !== guidance[record.lessonId].views.length * 2) throw new Error('比較図の数が設定と一致しない。');
  const axesCSV = await localEngine.evalRString('paste(capture.output(write.csv(.comparison$axes,row.names=FALSE)),collapse="\\n")', {env});
  const histogramViews = await localEngine.evalRRaw('as.character(names(.comparison$breaks))', 'string[]', {env});
  return {referenceNumber:reference.number, images, axesCSV, histogramViews};
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
  const currentLesson = lesson, mode = state.mode, params = {...state.params};
  $('error').hidden = true; setBusy(true); status('Rで計算中…');
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
      params: mode === 'settings' ? params : null,
      kind: mode === 'settings' ? changeKind(currentLesson.fields, state.latest?.params, params) : '編集コード',
      model:strings.model, time:new Date().toISOString(), runtimeVersion, rVersion,
      output:outputParts.join('\n'), seconds:(performance.now() - started) / 1000,
      filePrefix:`${currentLesson.id}_run${String(number).padStart(2,'0')}`,
      plotTitles:strings.plot_titles, plotNotes:strings.plot_notes, images:savedImages(capture.images), comparison:null
    };
    if (mode === 'settings' && state.baseline) {
      status('基準と今回の図を作成中…');
      try { record.comparison = await compareRuns(record, state.baseline, shelter, localEngine, token); }
      catch (error) { record.comparisonError = String(error.message || error); }
    }
    if (token !== generation) return;
    if (mode === 'settings' && !state.baseline) state.baseline = record;
    state.latest = record;
    // 履歴は数値・設定だけを持ち，図は基準と今回の結果に保持する。
    const {images, comparison, ...historyRecord} = record;
    state.history.push(historyRecord); if (state.history.length > 8) state.history.shift();
    renderResults(); renderHistory(); updateChanges();
    status('実行完了', 'ready');
    $('results-title').scrollIntoView({block:'start', behavior:'smooth'});
  } catch (error) {
    if (token !== generation) return;
    renderResults();
    showError(`Rの実行が完了しなかった。設定またはコードを確認する。\n${error.message || error}`);
    $('output').textContent = String(error.message || error);
    $('output-details').hidden = false;
    $('output-details').open = true;
    $('result-summary').textContent = state.latest ? `実行エラー · 図は実行 ${state.latest.number} の結果` : 'この実行の結果は未生成。';
    status('Rの実行エラー', 'error');
  } finally {
    if (token === generation) {
      if (shelter) { try { await shelter.purge(); } catch { /* Restart releases the worker. */ } }
      setBusy(false);
      updateChanges();
    }
  }
}

$('run').addEventListener('click', run);
$('run-code').addEventListener('click', run);
$('resample').addEventListener('click', () => {
  if (!readSettings()) return;
  const random = new Uint32Array(1); crypto.getRandomValues(random);
  const state = states.get(lesson.id); state.params.seed = random[0] % 2147483647;
  $('param-seed').value = state.params.seed; markCustom(); persist(); run();
});
$('restart').addEventListener('click', () => {
  if (busy) { renderResults(); $('result-summary').textContent = states.get(lesson.id).latest ? `実行を停止 · 図は実行 ${states.get(lesson.id).latest.number} の結果` : '実行を停止した。'; }
  startEngine();
});
$('comparison-view').addEventListener('change', () => {
  states.get(lesson.id).view = $('comparison-view').value; renderComparison();
});
$('pin-baseline').addEventListener('click', () => {
  const state = states.get(lesson.id);
  if (state.latest?.mode !== 'settings') return;
  state.baseline = state.latest; state.latest.comparison = null; state.latest.comparisonError = null;
  renderResults(); updateChanges();
});
$('restore-baseline').addEventListener('click', () => {
  const state = states.get(lesson.id);
  if (!state.baseline) return;
  state.params = {...state.baseline.params};
  for (const field of lesson.fields) $(`param-${field.key}`).value = state.params[field.key];
  markCustom(); setMode('settings'); persist(); refreshCodePreview(); updateChanges();
  $('change-summary').scrollIntoView({block:'center', behavior:'smooth'});
});
$('back-to-settings').addEventListener('click', () => {
  setMode('settings'); $('guide').scrollIntoView({block:'start', behavior:'smooth'});
});
$('mode-settings').addEventListener('click', () => setMode('settings'));
function editCode() {
  if (!loaded || !readSettings()) return;
  setMode('code');
  $('code-cell').scrollIntoView({block:'start'});
  $('code').focus({preventScroll:true});
}
$('mode-code').addEventListener('click', editCode);
$('edit-generated-code').addEventListener('click', editCode);
$('use-settings').addEventListener('click', () => {
  setMode('settings');
  $('setup-title').scrollIntoView({block:'start'});
  $('mode-settings').focus({preventScroll:true});
});
$('apply-settings').addEventListener('click', () => {
  if (!loaded) return;
  states.get(lesson.id).draft = makeCode(); $('code').value = states.get(lesson.id).draft; persist();
  updateChanges();
});
$('reset-settings').addEventListener('click', () => {
  const state = states.get(lesson.id);
  state.params = Object.fromEntries(lesson.fields.map(f => [f.key, f.value]));
  for (const f of lesson.fields) $(`param-${f.key}`).value = f.value;
  state.scenario = 'base'; $('scenario').value = 'base';
  renderMathText($('scenario-description'), lesson.scenarios?.find(s=>s.id==='base')?.description || '');
  refreshCodePreview();
  updateChanges();
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
  renderMathText($('scenario-description'), selected.description);
  setMode('settings'); persist();
});
$('code').addEventListener('input', () => { states.get(lesson.id).draft = $('code').value; persist(); updateChanges(); });
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

addFieldHelp(document.querySelector('label[for="scenario"]'), $('scenario'),
  'あらかじめ用意した設定の組合せを選ぶ。選択すると，この実験の全項目がその組合せの値に切り替わる。選んだ後に各数値を変更することもできる。');
const actionHelp = {
  'mode-settings':'数値欄で指定した設定からRコードを生成する。実行ボタンを押すと，そのコードを使う。',
  'mode-code':'生成式・推定式・描画を含むRコード全体を編集する。このモードでは，編集欄の内容を実行する。',
  'edit-generated-code':'Rコードの編集欄を開く。以前に編集した内容がある場合は，その内容を表示する。',
  'use-settings':'設定欄の数値を使うモードへ戻る。編集したRコードは保持する。',
  'reset-settings':'この実験の設定値を初期値へ戻す。実行済みの結果と編集コードはそのまま残る。',
  'apply-settings':'編集欄全体を，現在の設定値から生成したRコードで置き換える。編集欄に加えた変更も置き換わる。',
  'run':'設定モードでは最初の実行を基準にする。次の実行では基準と今回の結果を同じ目盛りで比較する。編集モードではコード欄を実行する。',
  'run-code':'Rコードの編集欄にあるコード全体を実行する。',
  'resample':'表示中の結果と同じ設定で，乱数シードだけを変更して実行する。未実行の設定変更がある間は使わない。係数の精度では説明変数も生成し直し，新しい説明変数を各反復で固定する。',
  'pin-baseline':'現在の実行結果を新しい基準にする。次の実行から，この結果との比較を表示する。',
  'restore-baseline':'入力欄の全項目と乱数シードを基準の設定に戻す。図は次に実行するまで変わらない。',
  'back-to-settings':'操作ヒントと設定欄へ戻る。比較の基準は保持する。',
  'restart':'Rの実行環境を作り直す。計算中に押すと実行を停止する。設定値と編集コードは保持する。',
  'download-r':'直前に成功した実行のRコードを保存する。保存したファイルは通常のRでも実行できる。',
  'download-data':'直前に成功した実行の，表示用の一つの標本をCSVで保存する。',
  'download-repetitions':'直前に成功した実行の反復結果をCSVで保存する。1行が1回の反復に対応する。',
  'download-metrics':'結果の表に表示した計算値をCSVで保存する。'
};
for (const [id, text] of Object.entries(actionHelp)) addButtonHelp($(id), text);
renderLesson();
try {
  if (location.protocol === 'file:') throw new Error('serve.pyを起動し，http://127.0.0.1:8765/ から開く。起動手順はREADME.mdを参照。');
  await Promise.all([...lessons.map(async item => {
    const response = await fetch(item.file);
    if (!response.ok) throw new Error(`${item.file}: HTTP ${response.status}`);
    templates.set(item.id, await response.text());
  }), (async () => {
    const response = await fetch('r/compare_runs.R');
    if (!response.ok) throw new Error(`r/compare_runs.R: HTTP ${response.status}`);
    comparisonTemplate = await response.text();
  })()]);
  loaded = true; setMode(states.get(lesson.id).mode);
  await startEngine();
} catch (error) {
  status('教材の読み込みに失敗', 'error');
  showError(String(error.message || error));
}
