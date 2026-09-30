// Short, contextual help. The R execution path is independent of this module.
import { renderMathText, renderFieldLabel } from './math.js';
let nextId = 0;
let active = null;
let hideTimer = null;

export function dismissTooltips() {
  clearTimeout(hideTimer);
  if (!active) return;
  active.tip.hidden = true;
  active.pinned = false;
  active = null;
}

function positionTip(record) {
  if (!record.anchor.isConnected) { dismissTooltips(); return; }
  const rect = record.anchor.getBoundingClientRect();
  const view = window.visualViewport;
  const leftEdge = (view?.offsetLeft || 0) + 10;
  const topEdge = (view?.offsetTop || 0) + 10;
  const rightEdge = leftEdge + (view?.width || window.innerWidth) - 20;
  const bottomEdge = topEdge + (view?.height || window.innerHeight) - 20;
  if (rect.bottom < topEdge || rect.top > bottomEdge) { dismissTooltips(); return; }
  record.tip.style.maxWidth = `${Math.max(1, rightEdge - leftEdge)}px`;
  record.tip.style.maxHeight = `${Math.max(1, bottomEdge - topEdge)}px`;
  const size = record.tip.getBoundingClientRect();
  const below = bottomEdge - rect.bottom;
  const above = rect.top - topEdge;
  const top = above >= size.height + 8 || above >= below ? rect.top - size.height - 8 : rect.bottom + 8;
  record.tip.style.left = `${Math.max(leftEdge, Math.min(rect.left, rightEdge - size.width))}px`;
  record.tip.style.top = `${Math.max(topEdge, Math.min(top, bottomEdge - size.height))}px`;
}

function show(record) {
  clearTimeout(hideTimer);
  if (active !== record) dismissTooltips();
  active = record;
  record.tip.hidden = false;
  positionTip(record);
}

function scheduleHide(record) {
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    if (active !== record) return;
    const focused = record.triggers.includes(document.activeElement);
    if (!record.hovered.size && !record.pinned && !focused) dismissTooltips();
  }, 160);
}

function connect(triggers, text, { owner, anchor, title, toggle }) {
  const tip = document.createElement('div');
  tip.className = 'context-tooltip'; tip.id = `context-help-${++nextId}`;
  tip.setAttribute('role', 'tooltip'); tip.hidden = true;
  const heading = document.createElement('strong'); renderFieldLabel(heading, title);
  const body = document.createElement('p'); renderMathText(body, text);
  tip.append(heading, body); owner.append(tip);
  const record = {tip, anchor, triggers, hovered:new Set(), pinned:false};
  for (const target of triggers) {
    const ids = new Set((target.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
    ids.add(tip.id); target.setAttribute('aria-describedby', [...ids].join(' '));
    target.addEventListener('pointerenter', event => {
      if (event.pointerType === 'touch') return;
      record.hovered.add(target); show(record);
    });
    target.addEventListener('pointerleave', () => { record.hovered.delete(target); scheduleHide(record); });
    target.addEventListener('focus', () => show(record));
    target.addEventListener('input', dismissTooltips);
    target.addEventListener('blur', () => {
      record.pinned = false;
      scheduleHide(record);
    });
  }
  tip.addEventListener('pointerenter', () => { record.hovered.add(tip); clearTimeout(hideTimer); });
  tip.addEventListener('pointerleave', () => { record.hovered.delete(tip); scheduleHide(record); });
  if (toggle) toggle.addEventListener('click', () => {
    if (active === record && record.pinned) dismissTooltips();
    else { show(record); record.pinned = true; }
  });
}

export function addFieldHelp(label, input, text) {
  if (!text) return;
  const title = label.textContent;
  const heading = document.createElement('div'); heading.className = 'field-heading';
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'help-trigger'; button.textContent = '?';
  button.setAttribute('aria-label', `${title}の説明`);
  label.replaceWith(heading); heading.append(label, button);
  connect([label, input, button], text, {owner:heading, anchor:input, title, toggle:button});
}

export function addButtonHelp(button, text) {
  connect([button], text, {owner:button.parentElement, anchor:button, title:button.textContent});
}

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && active) { dismissTooltips(); event.stopPropagation(); }
});
document.addEventListener('pointerdown', event => {
  if (active && !active.tip.contains(event.target) && !active.triggers.some(t => t.contains(event.target))) dismissTooltips();
});
const reposition = () => { if (active) positionTip(active); };
window.addEventListener('resize', reposition);
document.addEventListener('scroll', reposition, true);
window.visualViewport?.addEventListener('resize', reposition);
window.visualViewport?.addEventListener('scroll', reposition);
