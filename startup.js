// The loading display starts before the lesson modules and KaTeX are imported.
const panel = document.getElementById('startup');
const title = document.getElementById('startup-title');
const message = document.getElementById('startup-message');
const elapsed = document.getElementById('startup-elapsed');
const steps = document.getElementById('startup-steps');
const slow = document.getElementById('startup-slow');
const retry = document.getElementById('startup-retry');
const detail = document.getElementById('startup-detail');
const SLOW_AFTER_MS = 20000;
let phase = 'materials', started = 0, stopped = null, timer = null;
let dismissed = false, onRetry = () => location.reload();

function duration(ms, finished = false) {
  if (finished && ms < 1000) return '1秒未満';
  const seconds = finished ? Math.round(ms / 1000) : Math.floor(ms / 1000);
  return seconds < 60 ? `${seconds}秒` : `${Math.floor(seconds / 60)}分${String(seconds % 60).padStart(2, '0')}秒`;
}
function tick() {
  const pending = phase === 'materials' || phase === 'runtime';
  const ms = (stopped ?? performance.now()) - started;
  elapsed.textContent = `${phase === 'ready' ? '所要' : '経過'} ${duration(ms, !pending)}`;
  const waiting = pending && ms >= SLOW_AFTER_MS;
  slow.hidden = !waiting;
  retry.hidden = !(waiting || phase === 'error');
  for (const copy of document.querySelectorAll('[data-startup-copy]')) {
    copy.hidden = phase === 'ready';
    copy.textContent = `${title.textContent}・${elapsed.textContent}`;
  }
}
function render() {
  panel.dataset.phase = phase;
  panel.hidden = dismissed && phase === 'ready';
  const index = ['materials', 'runtime', 'ready'].indexOf(phase);
  for (const [i, step] of [...steps.children].entries()) {
    step.classList.toggle('complete', index > i);
    step.classList.toggle('current', index === i);
    if (index === i) step.setAttribute('aria-current', 'step');
    else step.removeAttribute('aria-current');
    step.querySelector('span').textContent = index > i ? '✓' : String(i + 1);
  }
  steps.hidden = phase === 'ready' || phase === 'error';
  message.hidden = phase === 'ready';
  const labels = {
    materials: ['教材を読み込み中', '準備が終わると，下のボタンで実行できる。'],
    runtime: ['Rを準備中', '計算に使うRを読み込み，起動する。初回は時間がかかる。'],
    ready: ['準備完了・実行できる', ''],
    error: ['準備を完了できなかった', '接続を確認して，準備をやり直す。']
  };
  [title.textContent, message.textContent] = labels[phase];
  document.getElementById('status').textContent = labels[phase][0];
  document.getElementById('status-dot').className = `status-dot ${phase === 'ready' ? 'ready' : phase === 'error' ? 'error' : 'loading'}`;
  tick();
}

retry.addEventListener('click', () => {
  onRetry();
  title.focus({preventScroll: true});
});

export const preparation = {
  get failed() { return phase === 'error'; },
  begin(next = 'materials', {preserveElapsed = false, fromNavigation = false} = {}) {
    clearInterval(timer);
    if (!preserveElapsed) started = fromNavigation ? 0 : performance.now();
    stopped = null;
    phase = next;
    dismissed = false;
    detail.hidden = true;
    detail.open = false;
    render();
    timer = setInterval(tick, 1000);
  },
  stage(next) { phase = next; render(); },
  finish() {
    stopped = performance.now();
    clearInterval(timer);
    phase = 'ready';
    render();
  },
  fail(error) {
    stopped = performance.now();
    clearInterval(timer);
    phase = 'error';
    document.getElementById('startup-error').textContent = String(error?.message || error);
    detail.hidden = false;
    render();
  },
  setRetry(handler) { onRetry = handler; },
  mount(button = document.querySelector('.journey-run')) {
    if (button) button.before(panel);
    else document.getElementById('startup-home').append(panel);
  },
  dismiss() { dismissed = true; panel.hidden = phase === 'ready'; }
};
