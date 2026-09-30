import { lessons } from './lessons.js';
import { addFieldHelp, addButtonHelp, dismissTooltips } from './tooltips.js';
import { renderMathText, renderFieldLabel, renderModel } from './math.js';
import { guidance, parameterChanges, changeKind } from './guidance.js';
import { journeys, journeyParameters } from './journeys.js';
import { figureDescription } from './figures.js';

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
    history: [], baseline: null, latest: null, journey: [], journeyDrafts: {}, view: journeys[lesson.id].view
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
  $('free-lab').open = true;
}
function setBusy(value) {
  if (value) dismissTooltips();
  busy = value;
  document.body.classList.toggle('busy', value);
  const state = states.get(lesson.id);
  $('run').disabled = value || !ready || !loaded;
  $('run-code').disabled = value || !ready || !loaded || state.mode !== 'code';
  $('resample').disabled = value || !ready || !loaded || state.mode === 'code' || !state.latest || state.latest.mode !== 'settings' || isPending();
  $('run').textContent = value ? '計算中…' : 'この設定で実行';
  $('run-code').textContent = value ? '計算中…' : 'このコードで実行';
  for (const el of document.querySelectorAll('#lesson-select, #fields input, #fields select, #scenario, #reset-settings, #apply-settings, #use-settings, #comparison-view')) el.disabled = value;
  $('edit-generated-code').disabled = value || !loaded;
  $('code').readOnly = value;
  $('restart').textContent = value ? '停止してRを再起動' : 'Rを再起動';
  $('pin-baseline').disabled = value || !state.latest || state.latest.mode !== 'settings' || state.latest === state.baseline;
  $('restore-baseline').disabled = value || !state.baseline;
  for (const button of document.querySelectorAll('.journey-run')) {
    button.disabled = value || !ready || !loaded;
    button.textContent = value ? '計算中…' : Number(button.dataset.step) === 0 ? '最初の調査を実行' : 'この条件で実行';
  }
  for (const input of document.querySelectorAll('.journey-input')) input.disabled = value;
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
  $('scenario-description').textContent = '入力した値を使う。';
}
function setMode(mode) {
  dismissTooltips();
  const state = states.get(lesson.id);
  state.mode = mode;
  if (mode === 'code' && state.draft === null && loaded) state.draft = makeCode();
  $('run').hidden = mode === 'code';
  $('settings-form').hidden = mode === 'code';
  $('code-panel').hidden = mode !== 'code';
  $('generated-code-panel').hidden = mode === 'code';
  if (mode === 'code') $('code-details').open = true;
  document.body.classList.toggle('code-mode', mode === 'code');
  $('code').value = state.draft || '';
  refreshCodePreview();
  $('run-help').textContent = mode === 'code' ? '下のRコードを編集して実行する。' : ''; 
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
  $('result-summary').textContent = '実行後に図を表示する。';
}
function renderLesson() {
  dismissTooltips();
  const state = states.get(lesson.id);
  $('lesson-select').replaceChildren(...lessons.map((item, i) => new Option(`${i + 1}. ${item.short}`, item.id)));
  $('lesson-select').value = lesson.id;
  $('lesson-position').textContent = `${lessons.indexOf(lesson) + 1} / ${lessons.length}`;
  $('free-lab').open = false;

  $('course').textContent = lesson.course;
  $('lesson-title').textContent = lesson.title;
  $('intro').textContent = lesson.intro;
  renderModel($('model'), lesson.model);
  renderMathText($('assumptions'), lesson.assumptions);
  $('scenario').replaceChildren(...(lesson.scenarios || []).map(s => new Option(s.name, s.id)), new Option('自由設定', 'custom'));
  if (state.scenario !== 'custom' && !(lesson.scenarios || []).some(s => s.id === state.scenario)) state.scenario = 'base';
  $('scenario').value = state.scenario;
  renderMathText($('scenario-description'), (lesson.scenarios || []).find(s => s.id === state.scenario)?.description || '入力した値を使う。');
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
  renderJourney();
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
    ? pending ? `変更は未実行 · 表示中の図は実行 ${previous.number} の結果` : `表示中の図：実行 ${previous.number}`
    : valid || state.mode === 'code' ? '実行前の設定' : '設定値を入力中';
  if (!valid && state.mode === 'settings' && previous) $('pending-status').textContent = `設定値を入力中 · 図は実行 ${previous.number} の結果`;
  $('pending-status').classList.toggle('is-pending', pending);
  $('changes-label').textContent = state.mode === 'code' ? '編集欄のRコードを実行する。' : base ? `比較相手（実行 ${base.number}）からの変更` : '';
  fillChanges($('parameter-changes'), state.mode === 'settings' ? base?.params : null, state.params);
  if (base && state.mode === 'settings' && !$('parameter-changes').children.length) $('changes-label').textContent += 'なし';
  for (const field of lesson.fields) {
    const input = $(`param-${field.key}`), hint = $(`param-${field.key}-change`);
    if (!input || !hint) continue;
    const changed = base && state.mode === 'settings' && String(base.params[field.key]) !== String(state.params[field.key]);
    input.closest('.field').classList.toggle('is-changed', Boolean(changed));
    hint.hidden = !changed;
    hint.textContent = changed ? `変更前 ${fieldValue(field, base.params[field.key])} → ${fieldValue(field, state.params[field.key])}` : '';
  }
  setBusy(busy);
}

function renderJourney() {
  const state = states.get(lesson.id), config = journeys[lesson.id];
  const complete = state.journey.length;
  $('journey').replaceChildren();
  for (let index = 0; index <= Math.min(complete, config.steps.length); index++) {
    const step = index === 0 ? {title:config.startTitle, text:config.start, view:config.view} : config.steps[index - 1];
    const record = state.journey[index];
    const reference = index ? state.journey[step.reference] : null;
    const section = document.createElement('section'); section.className = 'notebook-cell journey-cell'; section.id = `journey-${index}`;
    const number = document.createElement('span'); number.className = 'cell-index'; number.textContent = String(index + 1).padStart(2, '0'); number.setAttribute('aria-hidden', 'true');
    const body = document.createElement('div'); body.className = 'cell-body';
    const title = document.createElement('h2'); title.id = `journey-title-${index}`; title.textContent = step.title;
    section.setAttribute('aria-labelledby', title.id);
    const text = document.createElement('p'); renderMathText(text, step.text);
    body.append(title, text); section.append(number, body);
    if (index) {
      const from = document.createElement('p'); from.className = 'help';
      from.textContent = `比較相手：${String(step.reference + 1).padStart(2, '0')}の調査`;
      body.append(from);
    }
    if (record) {
      const output = document.createElement('div'); output.className = 'journey-output'; output.id = `journey-output-${index}`;
      const status = document.createElement('p'); status.className = 'journey-complete'; status.textContent = '実行済み';
      output.append(status);
      if (reference) {
        const changes = document.createElement('ul'); changes.className = 'change-list'; fillChanges(changes, reference.params, record.params); output.append(changes);
      }
      const addView = (viewId, target) => {
        const view = guidance[lesson.id].views.find(v => v.id === viewId);
        const offset = guidance[lesson.id].views.indexOf(view) * 2;
        if (!record.comparison) return;
        const description = describeRunFigure(record, viewId);
        const before = reference ? describeRunFigure(reference, viewId) : null;
        const heading = document.createElement('h3'); heading.textContent = description.title; target.append(heading);
        target.append(figureSummary(description));
        const grid = document.createElement('div'); grid.className = reference ? 'comparison-grid' : 'journey-single';
        if (reference) grid.append(imageFigure(record.comparison.images[offset], `変更前 · ${String(step.reference + 1).padStart(2, '0')}`, `${record.filePrefix}_before_${view.id}.png`, 'comparison-figure', before.summary, false, before.context));
        grid.append(imageFigure(record.comparison.images[offset + 1], reference ? `変更後 · ${String(index + 1).padStart(2, '0')}` : '最初の調査', `${record.filePrefix}_after_${view.id}.png`, reference ? 'comparison-figure is-current' : 'comparison-figure', description.summary, false, description.context));
        target.append(grid, figureKeys(description, before));
        if (reference) {
          const scale = document.createElement('p'); scale.className = 'help';
          scale.textContent = record.comparison.histogramViews.includes(view.id) ? '軸の目盛りとヒストグラムの区間をそろえている。' : '軸の目盛りをそろえている。'; target.append(scale);
        }
      };
      if (record.comparison) addView(step.view, output);
      else {
        const message = document.createElement('p'); message.className = 'error'; message.textContent = '比較図を作成できなかった。実行時の図を表示する。'; output.append(message);
        record.images.forEach((picture, i) => output.append(imageFigure(picture, record.plotTitles[i] || '実行結果', `${record.filePrefix}_figure${i + 1}.png`, 'plot-card', record.plotNotes[i], false)));
      }
      if (record.comparison && step.extraView) {
        const extra = document.createElement('details'), summary = document.createElement('summary');
        summary.textContent = guidance[lesson.id].views.find(v => v.id === step.extraView).title;
        extra.append(summary); addView(step.extraView, extra); output.append(extra);
      }
      const saved = document.createElement('details'), summary = document.createElement('summary'); summary.textContent = '設定・数値・保存'; saved.append(summary);
      saved.append(makeTable(['設定','値'], lesson.fields.map(f => [f.label, fieldValue(f, record.params[f.key])]), [1]));
      saved.append(makeTable(['計算した量','値'], record.metrics.map(m => [m.label, formatNumber(m.value)]), [1]));
      const links = document.createElement('div'); links.className = 'save-links';
      const file = (label, name, data, type) => {
        const a = document.createElement('a'); a.href = '#'; a.textContent = label;
        a.addEventListener('click', event => { event.preventDefault(); download(name, data, type); }); links.append(a);
      };
      file('Rコード', `${record.filePrefix}.R`, record.code, 'text/plain;charset=utf-8');
      for (const [key, label] of [['data','標本のCSV'], ['repetitions','反復結果のCSV'], ['metrics','計算結果のCSV']]) if (record.csv[key]) file(label, `${record.filePrefix}_${key}.csv`, '\uFEFF' + record.csv[key], 'text/csv;charset=utf-8');
      const offset = guidance[lesson.id].views.findIndex(v => v.id === step.view) * 2;
      if (record.comparison) for (const side of reference ? [0, 1] : [1]) {
        const a = document.createElement('a'); a.textContent = side ? '表示中の図のPNG' : '変更前の図のPNG';
        a.href = record.comparison.images[offset + side].url; a.download = `${record.filePrefix}_${side ? 'after' : 'before'}_${step.view}.png`; links.append(a);
      }
      saved.append(links); output.append(saved); body.append(output);
    } else {
      const form = document.createElement('form'); form.className = 'journey-form';
      if (index) {
        const field = lesson.fields.find(f => f.key === step.key);
        const box = document.createElement('div'); box.className = 'field journey-field';
        const label = document.createElement('label'); label.htmlFor = `journey-value-${index}`; label.textContent = field.label;
        const input = document.createElement(field.options ? 'select' : 'input'); input.id = label.htmlFor; input.className = 'journey-input';
        if (field.options) for (const [value, name] of field.options) input.add(new Option(name, value));
        else { input.type = 'number'; input.min = field.min; input.max = field.max; input.step = field.step; input.required = true; }
        input.value = state.journeyDrafts[index] ?? step.value;
        input.addEventListener('input', () => { state.journeyDrafts[index] = input.value; });
        const before = document.createElement('p'); before.className = 'help'; before.id = `journey-before-${index}`; before.textContent = `変更前：${fieldValue(field, reference.params[step.key])}${field.hint && ['年','万円','万円／年'].includes(field.hint) ? ` ${field.hint}` : ''}`;
        input.setAttribute('aria-describedby', before.id);
        box.append(label, input, before); addFieldHelp(label, input, field.help); renderFieldLabel(label, field.label); form.append(box);
      }
      const button = document.createElement('button'); button.type = 'submit'; button.className = 'primary journey-run'; button.dataset.step = index;
      button.textContent = index === 0 ? '最初の調査を実行' : 'この条件で実行';
      const error = document.createElement('p'); error.id = `journey-error-${index}`; error.className = 'error'; error.hidden = true; error.setAttribute('role','alert');
      form.append(button, error);
      form.addEventListener('submit', event => { event.preventDefault(); runJourney(index); });
      body.append(form);
    }
    $('journey').append(section);
  }
  $('journey-next').hidden = complete <= config.steps.length;
  $('journey-next-text').textContent = config.next;
  const next = lessons[lessons.indexOf(lesson) + 1];
  $('next-lesson').hidden = !next;
  if (next) { $('next-lesson').href = `#${next.id}`; $('next-lesson').textContent = `${next.short}へ →`; }
  setBusy(busy);
}

async function runJourney(index) {
  if (!ready || !loaded || busy) return;
  const state = states.get(lesson.id);
  if (index !== state.journey.length) return;
  const step = index ? journeys[lesson.id].steps[index - 1] : null;
  const input = index ? $(`journey-value-${index}`) : null;
  if (input && !input.reportValidity()) return;
  const field = step ? lesson.fields.find(f => f.key === step.key) : null;
  const value = input ? field.options ? input.value : Number(input.value) : undefined;
  state.params = journeyParameters(lesson, index, state.journey, value);
  state.view = step?.view || journeys[lesson.id].view;
  for (const f of lesson.fields) $(`param-${f.key}`).value = state.params[f.key];
  markCustom(); setMode('settings');
  $(`journey-error-${index}`).hidden = true;
  await run({journeyIndex:index});
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
function describeRunFigure(record, view) {
  const settings = Object.fromEntries(csvObjects(record.csv.settings).map(row => [row.setting, row.value]));
  const metrics = Object.fromEntries(record.metrics.map(row => [row.key, row.value]));
  return figureDescription(record.lessonId, view, settings, metrics);
}
function figureSummary(description) {
  const node = document.createElement('div'); node.className = 'figure-summary';
  const text = document.createElement('p'); renderMathText(text, description.summary); node.append(text);
  if (description.density) {
    const density = document.createElement('p'); density.className = 'density-description'; density.textContent = description.density; node.append(density);
  }
  return node;
}
function figureKeys(description, before = null) {
  const list = document.createElement('dl'); list.className = 'figure-keys'; list.setAttribute('aria-label', '点・棒・線の意味');
  for (const [i, key] of description.keys.entries()) {
    const row = document.createElement('div'), term = document.createElement('dt'), text = document.createElement('dd');
    const swatch = document.createElement('span'); swatch.className = `figure-mark ${key.mark}`; swatch.setAttribute('aria-hidden', 'true');
    term.append(swatch, key.label);
    const previous = before?.keys[i];
    renderMathText(text, previous && previous.text !== key.text ? `変更前：${previous.text}変更後：${key.text}` : key.text);
    row.append(term, text); list.append(row);
  }
  return list;
}
function imageFigure(picture, title, name, className = 'plot-card', description = title, showSave = true, context = '') {
  const figure = document.createElement('figure'); figure.className = className;
  const heading = document.createElement(className.includes('comparison-figure') ? 'h4' : 'h3'); heading.textContent = title;
  const img = document.createElement('img'); img.src = picture.url; img.width = picture.width; img.height = picture.height; img.alt = `${context ? context + '。' : ''}${description || title}`;
  const caption = document.createElement('figcaption'), button = document.createElement('button');
  button.type = 'button'; button.textContent = '図を保存 PNG';
  button.addEventListener('click', async () => download(name, await (await fetch(picture.url)).blob(), 'image/png'));
  figure.append(heading);
  if (context) { const unit = document.createElement('p'); unit.className = 'figure-context'; renderMathText(unit, context); figure.append(unit); }
  figure.append(img);
  if (!className.includes('comparison-figure') && description && description !== title) {
    const note = document.createElement('p'); note.className = 'plot-description'; renderMathText(note, description); caption.append(note);
  }
  if (showSave) {
    caption.append(button);
    addButtonHelp(button, '表示中の図をPNGで保存する。');
  }
  if (caption.childNodes.length) figure.append(caption);
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
  $('comparison-kind').textContent = `変更前：実行 ${base.number} → 変更後：実行 ${record.number} · ${changeKind(lesson.fields, base.params, record.params)}`;
  fillChanges($('comparison-changes'), base.params, record.params);
  const view = config.views.find(v => v.id === state.view) || config.views[0];
  $('comparison-view').value = view.id;
  const description = describeRunFigure(record, view.id), before = describeRunFigure(base, view.id);
  $('comparison-focus').replaceChildren(figureSummary(description));
  $('comparison-keys').replaceChildren(figureKeys(description, before));
  $('comparison-scale').textContent = record.comparison.histogramViews.includes(view.id)
    ? '共通の目盛り・共通のヒストグラム区間' : '横軸・縦軸は共通の目盛り';
  const index = config.views.findIndex(v => v.id === view.id) * 2;
  $('comparison-plots').replaceChildren(
    imageFigure(record.comparison.images[index], `変更前 · 実行 ${base.number}`, `${record.filePrefix}_reference_${view.id}.png`, 'comparison-figure', before.summary, true, before.context),
    imageFigure(record.comparison.images[index + 1], `変更後 · 実行 ${record.number}`, `${record.filePrefix}_current_${view.id}.png`, 'comparison-figure is-current', description.summary, true, description.context)
  );
  const ref = new Map(base.metrics.map(m => [m.key, m]));
  const now = new Map(record.metrics.map(m => [m.key, m]));
  const rows = config.metrics.filter(key => ref.has(key) && now.has(key)).map(key => {
    const a = ref.get(key), b = now.get(key), difference = Number(b.value) - Number(a.value);
    return [b.label, formatNumber(a.value), formatNumber(b.value), Number.isFinite(difference) ? `${difference > 0 ? '+' : ''}${formatNumber(difference)}` : '—'];
  });
  $('comparison-metrics').replaceChildren(makeTable(['計算した量','変更前','変更後','差'], rows, [1, 2, 3]));
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
  $('current-plots-title').textContent = `今回のすべての図 · 実行 ${record.number}`;
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
  $('baseline-status').textContent = state.baseline ? `比較相手：実行 ${state.baseline.number}` : '';
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
  status('Rを準備中…');
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

async function run(options = {}) {
  if (!ready || busy || !loaded) return;
  const state = states.get(lesson.id);
  const guided = Number.isInteger(options.journeyIndex);
  const reference = guided ? options.journeyIndex ? state.journey[journeys[lesson.id].steps[options.journeyIndex - 1].reference] : null : state.baseline;
  if (state.mode === 'settings' && !readSettings()) return;
  const code = state.mode === 'code' ? $('code').value : makeCode();
  if (!code.trim()) { showError('実行するRコードを入力する。'); return; }
  if (state.mode === 'code') { state.draft = code; persist(); }
  const localEngine = engine, token = generation, started = performance.now();
  const currentLesson = lesson, mode = state.mode, params = {...state.params};
  $('error').hidden = true; setBusy(true); status('Rで計算中…');
  $('result-summary').textContent = 'データを生成して計算中…';
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
      kind: mode === 'settings' ? changeKind(currentLesson.fields, reference?.params, params) : '編集コード',
      model:strings.model, time:new Date().toISOString(), runtimeVersion, rVersion,
      output:outputParts.join('\n'), seconds:(performance.now() - started) / 1000,
      filePrefix:`${currentLesson.id}_run${String(number).padStart(2,'0')}`,
      plotTitles:strings.plot_titles, plotNotes:strings.plot_notes, images:savedImages(capture.images), comparison:null
    };
    if (mode === 'settings' && (reference || guided)) {
      status('図を作成中…');
      try { record.comparison = await compareRuns(record, reference || record, shelter, localEngine, token); }
      catch (error) { record.comparisonError = String(error.message || error); }
    }
    if (token !== generation) return;
    if (guided) { state.baseline = reference || record; state.journey.push(record); }
    else if (mode === 'settings' && !state.baseline) state.baseline = record;
    state.latest = record;
    // 履歴は数値・設定だけを持ち，図は基準と今回の結果に保持する。
    const {images, comparison, ...historyRecord} = record;
    state.history.push(historyRecord); if (state.history.length > 8) state.history.shift();
    renderResults(); renderHistory(); updateChanges();
    if (guided) renderJourney();
    status('実行完了', 'ready');
    const resultTarget = guided ? $(`journey-output-${options.journeyIndex}`) : $('results-title');
    resultTarget.tabIndex = -1;
    resultTarget.focus({preventScroll:true});
    resultTarget.scrollIntoView({block:'start', behavior:'smooth'});
  } catch (error) {
    if (token !== generation) return;
    renderResults();
    const message = `実行できなかった。\n${error.message || error}`;
    if (guided) { const node = $(`journey-error-${options.journeyIndex}`); node.textContent = message; node.hidden = false; }
    else showError(message);
    $('output').textContent = String(error.message || error);
    $('output-details').hidden = false;
    $('output-details').open = true;
    $('result-summary').textContent = state.latest ? `実行エラー · 図は実行 ${state.latest.number} の結果` : 'まだ結果はない。';
    status('Rの実行エラー', 'error');
  } finally {
    if (token === generation) {
      if (shelter) { try { await shelter.purge(); } catch { /* Restart releases the worker. */ } }
      setBusy(false);
      updateChanges();
    }
  }
}

$('run').addEventListener('click', () => run());
$('run-code').addEventListener('click', () => run());
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
  state.latest = {...state.latest, comparison:null, comparisonError:null};
  state.baseline = state.latest;
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

function editCode() {
  if (!loaded || !readSettings()) return;
  setMode('code');
  $('code-cell').scrollIntoView({block:'start'});
  $('code').focus({preventScroll:true});
}
$('edit-generated-code').addEventListener('click', editCode);
$('use-settings').addEventListener('click', () => {
  setMode('settings');
  $('setup-title').scrollIntoView({block:'start'});
  $('scenario').focus({preventScroll:true});
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
  if (target && target.id !== lesson.id && !busy) { lesson = target; renderLesson(); $('lesson-title').scrollIntoView({block:'start'}); }
});

$('lesson-select').addEventListener('change', () => {
  const target = lessons.find(x => x.id === $('lesson-select').value);
  if (target && !busy) { lesson = target; location.hash = target.id; renderLesson(); }
});

addFieldHelp(document.querySelector('label[for="scenario"]'), $('scenario'),
  '設定例を選ぶと，全項目がその例の値に切り替わる。選択後に数値を編集できる。');
const actionHelp = {
  'edit-generated-code':'Rコードを編集する。保存した編集コードがあれば，それを開く。',
  'use-settings':'入力欄の数値を使って実行する。編集コードは保存される。',
  'reset-settings':'設定値を初期値に戻す。',
  'apply-settings':'現在の設定からRコードを作り，編集欄を置き換える。',
  'run':'入力した設定で実行し，保存済みの結果と比較する。',
  'run-code':'Rコードの編集欄にあるコード全体を実行する。',
  'resample':'乱数シードを変えて再実行する。係数の精度では説明変数も生成し直し，新しい値を各反復で固定する。',
  'pin-baseline':'次の実行を，今回の結果と比較する。',
  'restore-baseline':'入力値と乱数シードを，比較相手の設定に戻す。',
  'restart':'Rを起動し直す。計算中の場合は停止する。',
  'download-r':'直前の実行コードを保存する。通常のRでも実行できる。',
  'download-data':'図に使った一つの標本をCSVで保存する。',
  'download-repetitions':'反復結果をCSVで保存する。1行が1回の反復に当たる。',
  'download-metrics':'結果の表に表示した計算値をCSVで保存する。'
};
for (const [id, text] of Object.entries(actionHelp)) addButtonHelp($(id), text);
renderLesson();
try {
  if (location.protocol === 'file:') throw new Error('serve.pyを起動し，http://127.0.0.1:8765/ から開く。起動手順はREADME.mdを参照。');
  await Promise.all([...lessons.map(async item => {
    const response = await fetch(item.file);
    if (!response.ok) throw new Error(`${item.file}: HTTP ${response.status}`);
    templates.set(item.id, (await response.text()).replace(/\r\n?/g, '\n'));
  }), (async () => {
    const response = await fetch('r/compare_runs.R');
    if (!response.ok) throw new Error(`r/compare_runs.R: HTTP ${response.status}`);
    comparisonTemplate = (await response.text()).replace(/\r\n?/g, '\n');
  })()]);
  loaded = true; setMode(states.get(lesson.id).mode);
  await startEngine();
} catch (error) {
  status('教材の読み込みに失敗', 'error');
  showError(String(error.message || error));
}
