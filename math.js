import katex from './vendor/katex/katex.mjs';

// Display only. The original labels and R code keep their plain-text notation.
const expressions = new Map([
  ['m(s)=100+20s+κ(s−12)²', String.raw`m(s)=100+20s+\kappa(s-12)^2`],
  ['x₂ = 5 + 1.5(ρv + √(1 − ρ²)w)', String.raw`x_2=5+1.5\bigl(\rho v+\sqrt{1-\rho^2}\,w\bigr)`],
  ['x₁ = 20 + 6v', String.raw`x_1=20+6v`],
  ['y=100+βd+γa+u', String.raw`y=100+\beta d+\gamma a+u`],
  ['d=12+δa+v', String.raw`d=12+\delta a+v`],
  ['u = σ(e − 1)', String.raw`u=\sigma(e-1)`],
  ['u=σ(e−1)', String.raw`u=\sigma(e-1)`],
  ['u = σe', String.raw`u=\sigma e`],
  ['u=σe', String.raw`u=\sigma e`],
  ['y=μ+σz', String.raw`y=\mu+\sigma z`],
  ['ε ∼ N(0, σ²)', String.raw`\varepsilon\sim N(0,\sigma^2)`],
  ['u ∼ N(0, σ²)', String.raw`u\sim N(0,\sigma^2)`],
  ['v ∼ N(0, σᵥ²)', String.raw`v\sim N(0,\sigma_v^2)`],
  ['u ∼ N(0, σᵤ²)', String.raw`u\sim N(0,\sigma_u^2)`],
  ['e ∼ Exp(1)', String.raw`e\sim\operatorname{Exp}(1)`],
  ['z ∼ U(−√3, √3)', String.raw`z\sim U(-\sqrt{3},\sqrt{3})`],
  ['z ∼ N(0, 1)', String.raw`z\sim N(0,1)`],
  ['z = e − 1', String.raw`z=e-1`],
  ['(1 − p)/2', String.raw`\frac{1-p}{2}`],
  ['(1−p)/2', String.raw`\frac{1-p}{2}`],
  ['p/2', String.raw`\frac{p}{2}`],
  ['RSS/(N−3)', String.raw`\frac{\mathrm{RSS}}{N-3}`],
  ['β₂ > 0', String.raw`\beta_2>0`],
  ['γ=120', String.raw`\gamma=120`],
  ['δ=2', String.raw`\delta=2`],
  ['κ=0', String.raw`\kappa=0`],
  ['κ = 3', String.raw`\kappa=3`],
  ['ρ = 0.3', String.raw`\rho=0.3`],
  ['ρ = 0.95', String.raw`\rho=0.95`],
  ['N = 100', 'N=100'], ['N=100', 'N=100'],
  ['m(s)', 'm(s)'], ['beta', String.raw`\beta`],
  ['β̂', String.raw`\hat{\beta}`], ['β₁', String.raw`\beta_1`], ['β₂', String.raw`\beta_2`],
  ['σᵥ²', String.raw`\sigma_v^2`], ['σᵤ²', String.raw`\sigma_u^2`], ['σ²', String.raw`\sigma^2`],
  ['σᵥ', String.raw`\sigma_v`], ['σᵤ', String.raw`\sigma_u`], ['μ₀', String.raw`\mu_0`],
  ['r₀', 'r_0'], ['r₁', 'r_1'], ['x₁', 'x_1'], ['x₂', 'x_2'],
  ['μ', String.raw`\mu`], ['σ', String.raw`\sigma`], ['κ', String.raw`\kappa`],
  ['ε', String.raw`\varepsilon`], ['δ', String.raw`\delta`], ['β', String.raw`\beta`],
  ['γ', String.raw`\gamma`], ['ρ', String.raw`\rho`],
  ['4N', '4N'], ['N', 'N'], ['X', String.raw`\mathbf{X}`], ['a', 'a'], ['d', 'd'], ['e', 'e'],
  ['p', 'p'], ['s', 's'], ['u', 'u'], ['v', 'v'], ['w', 'w'], ['y', 'y'], ['z', 'z']
]);
const escapePattern = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pattern = new RegExp([...expressions.keys()].sort((a,b)=>b.length-a.length).map(escapePattern).join('|'), 'gu');
const options = {throwOnError:true, trust:false, strict:'error', output:'htmlAndMathml'};

export function mathParts(text) {
  text = String(text);
  const parts = [];
  let from = 0;
  for (const match of text.matchAll(pattern)) {
    const plain = match[0], index = match.index;
    // Keep Latin words such as "population", "seed", and "OLS" intact.
    if ((/^[A-Za-z0-9]/.test(plain) && /[A-Za-z0-9_]/.test(text[index-1] || '')) ||
        (/[A-Za-z0-9]$/.test(plain) && /[A-Za-z0-9_]/.test(text[index+plain.length] || ''))) continue;
    if (index > from) parts.push({text:text.slice(from,index)});
    parts.push({text:plain, tex:expressions.get(plain)});
    from = index + plain.length;
  }
  if (from < text.length) parts.push({text:text.slice(from)});
  return parts;
}

export function mathHTML(tex, display = false) {
  return katex.renderToString(display ? String.raw`\displaystyle ${tex}` : tex, options);
}

export function renderMathText(element, text) {
  const nodes = mathParts(text).map(part => {
    if (!part.tex) return document.createTextNode(part.text);
    const span = document.createElement('span'); span.className = 'math-inline';
    try { span.innerHTML = mathHTML(part.tex); }
    catch { span.textContent = part.text; }
    return span;
  });
  element.replaceChildren(...nodes);
}

export function renderFieldLabel(label, plain) {
  renderMathText(label, plain);
  // B denotes a replication count only here; region B remains ordinary text.
  if (plain.endsWith(' B')) {
    renderMathText(label, plain.slice(0,-1));
    const span = document.createElement('span'); span.className = 'math-inline';
    span.innerHTML = mathHTML('B'); label.append(span);
  }
}

export function renderModel(element, formulas) {
  element.replaceChildren(...formulas.map(tex => {
    const line = document.createElement('div'); line.className = 'math-equation';
    try { line.innerHTML = mathHTML(tex, true); }
    catch { line.textContent = tex; }
    return line;
  }));
}
