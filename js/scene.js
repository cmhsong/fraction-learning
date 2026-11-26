'use strict';
/* ---------- 구체물(피자·초콜릿·색종이) 그리기와 애니메이션 ---------- */
const NS = 'http://www.w3.org/2000/svg';
const C = {
  ink: '#1F2A44', empty: '#F6F0E4', emptyLine: '#D9CDB8',
  choco: '#8A5433', pizza: '#F8C04A', pizzaLine: '#C97F1E', pep: '#D8452F',
  blue: '#5B8DEF', blueL: '#CFE0FF', green: '#22B07D', coral: '#FF7A59',
  violet: '#5B5BD6', yellow: '#FFD166', yellowL: '#FFEDB5', gone: '#FFB8A6'
};
function sv(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

class Scene {
  constructor(svg, W = 800, H = 340) {
    this.svg = svg; svg.innerHTML = '';
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.onpointerdown = svg.onpointermove = svg.onpointerup = svg.onpointercancel = svg.onpointerleave = null;
    svg.style.touchAction = '';
  }
  text(x, y, str, o = {}) {
    const t = sv('text', { x, y, 'text-anchor': o.anchor || 'middle', 'dominant-baseline': 'central', 'font-size': o.size || 22, 'font-weight': o.weight || 800, fill: o.fill || C.ink }, this.svg);
    t.textContent = str; return t;
  }
  /* 분수(대분수 포함)를 (x,y) 가운데에 그림 */
  frac(x, y, f, o = {}) {
    const s = o.size || 30, fill = o.fill || C.ink, g = sv('g', {}, this.svg);
    const hasF = !(f.n === 0 && f.w);
    const ws = f.w ? String(f.w) : '';
    const ww = ws ? ws.length * s * 0.8 + 6 : 0;
    const nw = hasF ? Math.max(String(f.n).length, String(f.d).length) * s * 0.62 + 10 : 0;
    const x0 = x - (ww + nw) / 2;
    const T = (tx, ty, str, size) => { const t = sv('text', { x: tx, y: ty, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': size, 'font-weight': 800, fill }, g); t.textContent = str; };
    if (ws) T(x0 + ww / 2, y, ws, s * 1.3);
    if (hasF) {
      const fx = x0 + ww + nw / 2;
      T(fx, y - s * 0.62, f.n, s); T(fx, y + s * 0.68, f.d, s);
      sv('line', { x1: fx - nw / 2, x2: fx + nw / 2, y1: y, y2: y, stroke: fill, 'stroke-width': Math.max(2.5, s / 11), 'stroke-linecap': 'round' }, g);
    }
    return g;
  }
  /* 초콜릿(띠) : n칸 중 fill칸 색칠 */
  bar(o) {
    const { x, y, w, n } = o, h = o.h || 56, color = o.color || C.choco, cw = w / n;
    const g = sv('g', {}, this.svg), cells = [];
    const pad = cw > 14 ? 1.5 : 0.6;
    for (let i = 0; i < n; i++) {
      const f = i < (o.fill || 0);
      const r = sv('rect', { x: x + i * cw + pad, y, width: Math.max(1, cw - pad * 2), height: h, rx: Math.min(7, cw / 4), fill: f ? color : C.empty, stroke: f ? 'rgba(0,0,0,.28)' : C.emptyLine, 'stroke-width': 1.5 }, g);
      cells.push({ el: r, x: x + i * cw, y, w: cw, h, filled: f });
    }
    return { g, cells };
  }
  /* 분자가 분모보다 클 수도 있는 양: 초콜릿 여러 개로 */
  qty(o) {
    const U = o.units || Math.max(1, Math.ceil(o.num / o.d)), gap = U > 1 ? 14 : 0, bw = (o.w - gap * (U - 1)) / U;
    let cells = [];
    for (let u = 0; u < U; u++) {
      const b = this.bar({ x: o.x + u * (bw + gap), y: o.y, w: bw, h: o.h, n: o.d, fill: clamp(o.num - u * o.d, 0, o.d), color: o.color });
      cells = cells.concat(b.cells);
    }
    return { cells, filled: cells.filter(c => c.filled) };
  }
  pizza(o) {
    const { cx, cy, r, n } = o, k = o.fill || 0, g = sv('g', {}, this.svg), slices = [];
    sv('circle', { cx, cy, r: r + 7, fill: '#fff', stroke: '#E7DFD0', 'stroke-width': 2 }, g);
    for (let i = 0; i < n; i++) {
      const f = i < k, sg = sv('g', {}, g);
      const style = { fill: f ? C.pizza : C.empty, stroke: f ? C.pizzaLine : C.emptyLine, 'stroke-width': 2.5, 'stroke-linejoin': 'round' };
      const a0 = -Math.PI / 2 + i * 2 * Math.PI / n, a1 = a0 + 2 * Math.PI / n, am = (a0 + a1) / 2;
      let p;
      if (n === 1) p = sv('circle', { cx, cy, r, ...style }, sg);
      else p = sv('path', { d: `M${cx} ${cy}L${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)}A${r} ${r} 0 0 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}Z`, ...style }, sg);
      let dot = null;
      if (n === 1) [0, 1, 2, 3, 4].forEach(j => sv('circle', { cx: cx + r * 0.55 * Math.cos(j * 1.257), cy: cy + r * 0.55 * Math.sin(j * 1.257), r: r * 0.11, fill: C.pep, opacity: f ? 1 : 0 }, sg));
      else dot = sv('circle', { cx: cx + r * 0.62 * Math.cos(am), cy: cy + r * 0.62 * Math.sin(am), r: Math.min(r * 0.13, r * Math.sin(Math.PI / n) * 0.36), fill: C.pep, opacity: f ? 1 : 0 }, sg);
      slices.push({ el: sg, p, dot, filled: f });
    }
    return { g, slices };
  }
  /* 색종이(넓이 모형) */
  grid(o) {
    const g = sv('g', {}, this.svg), cw = o.w / o.cols, ch = o.h / o.rows, cells = [];
    for (let r = 0; r < o.rows; r++) for (let c = 0; c < o.cols; c++) {
      const col = o.color(r, c);
      const el = sv('rect', { x: o.x + c * cw + 1, y: o.y + r * ch + 1, width: cw - 2, height: ch - 2, rx: 4, fill: col || C.empty, stroke: col ? 'rgba(0,0,0,.2)' : C.emptyLine, 'stroke-width': 1.5 }, g);
      cells.push({ el, r, c, on: !!col });
    }
    return { g, cells };
  }
}

/* 칸을 누르거나 드래그해서 색칠하는 판. cells: [{el, paint, dot?}] */
function dragBoard(svg, cells, look, onChange, isLocked) {
  const on = new Set(); let mode = null;
  svg.style.touchAction = 'none';
  cells.forEach((c, i) => { c.el.setAttribute('data-ci', i); c.el.classList.add('tapcell'); });
  const set = (i, v) => {
    if (on.has(i) === v) return;
    if (v) on.add(i); else on.delete(i);
    const c = cells[i];
    c.paint.setAttribute('fill', v ? look.fill : C.empty);
    c.paint.setAttribute('stroke', v ? look.stroke : C.emptyLine);
    if (c.dot) c.dot.setAttribute('opacity', v ? 1 : 0);
    if (v) An.pulse([c.el]);
    onChange(on.size);
  };
  const hit = e => {
    const t = document.elementFromPoint(e.clientX, e.clientY), g = t && t.closest && t.closest('[data-ci]');
    return g && svg.contains(g) ? +g.getAttribute('data-ci') : -1;
  };
  svg.onpointerdown = e => {
    if (isLocked && isLocked()) return;
    const i = hit(e); if (i < 0) return;
    e.preventDefault(); mode = !on.has(i); set(i, mode);
  };
  svg.onpointermove = e => { if (mode === null) return; const i = hit(e); if (i >= 0) set(i, mode); };
  svg.onpointerup = svg.onpointercancel = svg.onpointerleave = () => { mode = null; };
  return on;
}
const LOOK = { pizza: { fill: C.pizza, stroke: C.pizzaLine }, bar: { fill: C.choco, stroke: 'rgba(0,0,0,.28)' } };

/* anime.js 로 움직임 주기 (라이브러리가 없으면 완성된 그림만 보여 줌) */
const An = {
  ok: () => !!window.anime,
  pop(els, start = 0) {
    if (!An.ok() || !els.length) return;
    anime({ targets: els, opacity: [0, 1], scale: [0.5, 1], duration: 480, delay: anime.stagger(Math.min(90, 900 / els.length), { start }), easing: 'easeOutBack' });
  },
  pulse(els) {
    if (!An.ok() || !els.length) return;
    anime({ targets: els, scale: [1, 1.1, 1], duration: 700, delay: anime.stagger(Math.min(140, 900 / els.length)), easing: 'easeInOutSine' });
  },
  fly(pairs, start = 200) {
    if (!An.ok()) return;
    pairs.forEach((p, i) => anime({ targets: p.el, translateX: [p.from.x - p.to.x, 0], translateY: [p.from.y - p.to.y, 0], duration: 800, delay: start + i * Math.min(150, 1500 / pairs.length), easing: 'easeInOutQuad' }));
  },
  out(els, start = 200) {
    if (!An.ok() || !els.length) return;
    anime({ targets: els, opacity: [1, 0.3], translateY: [0, -16], duration: 600, delay: anime.stagger(110, { start }), easing: 'easeOutQuad' });
  }
};

/* ---------- 단계별 재생기 ---------- */
class Player {
  constructor(root, steps, o = {}) {
    this.root = root; this.steps = steps; this.o = o; this.i = 0; this.auto = false;
    root.innerHTML = `
      <div class="stage"><svg xmlns="${NS}" role="img" aria-label="분수 그림"></svg></div>
      <div class="cap" aria-live="polite"></div>
      <div class="pctl">
        <button class="btn" data-a="prev">◀ 이전</button>
        <button class="btn" data-a="replay">↻ 다시 보기</button>
        <span class="dots"></span>
        <button class="btn" data-a="auto">▶ 자동 재생</button>
        <button class="btn pri" data-a="next">다음 ▶</button>
      </div>`;
    $('.pctl', root).addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const a = b.dataset.a;
      if (a === 'prev') this.show(this.i - 1);
      else if (a === 'replay') this.show(this.i);
      else if (a === 'auto') this.setAuto(!this.auto);
      else this.next();
    });
    this.show(0);
  }
  show(i) {
    clearTimeout(this.t);
    this.i = i = clamp(i, 0, this.steps.length - 1);
    const st = this.steps[i], svg = $('svg', this.root), last = i === this.steps.length - 1;
    if (window.anime) anime.remove(svg.querySelectorAll('*'));
    if (st.interactive && this.auto) { this.auto = false; $('[data-a=auto]', this.root).textContent = '▶ 자동 재생'; }
    st.draw(new Scene(svg), this);
    $('.cap', this.root).innerHTML = fmt(st.cap);
    $('.dots', this.root).innerHTML = this.steps.map((_, j) => `<i class="${j === i ? 'on' : j < i ? 'past' : ''}"></i>`).join('');
    $('[data-a=prev]', this.root).disabled = i === 0;
    $('[data-a=next]', this.root).textContent = last ? (this.o.doneLabel || '↺ 처음부터') : '다음 ▶';
    Voice.speak(spk(st.cap), () => {
      if (!this.auto) return;
      if (this.i < this.steps.length - 1) this.t = setTimeout(() => this.show(this.i + 1), 700);
      else this.setAuto(false, true);
    });
  }
  say(cap) { $('.cap', this.root).innerHTML = fmt(cap); Voice.speak(spk(cap)); }
  next() {
    if (this.i < this.steps.length - 1) this.show(this.i + 1);
    else if (this.o.onDone) this.o.onDone();
    else this.show(0);
  }
  setAuto(v, quiet) {
    this.auto = v;
    $('[data-a=auto]', this.root).textContent = v ? '⏸ 멈춤' : '▶ 자동 재생';
    if (v) this.show(this.i === this.steps.length - 1 ? 0 : this.i);
    else if (!quiet) { clearTimeout(this.t); }
  }
  destroy() { clearTimeout(this.t); this.auto = false; Voice.stop(); }
}

/* ---------- 개념 설명 장면 (문제 해설에도 그대로 사용) ---------- */
const L = {};
const els = arr => arr.map(c => c.el);

function pizzas(S, num, d, o = {}) {
  const U = o.units || Math.max(1, Math.ceil(num / d));
  const r = Math.min(110, (o.w || 460) / (U * 2) - 12);
  const cx0 = (o.cx || 260) - (U - 1) * (r + 12), out = [];
  for (let u = 0; u < U; u++) out.push(S.pizza({ cx: cx0 + u * (2 * r + 24), cy: o.cy || 165, r, n: d, fill: clamp(num - u * d, 0, d) }));
  return out;
}

L.meaning = (n = 4, k = 3) => [
  { cap: `피자 한 판이 있어요. 이 한 판이 **전체**예요.`,
    draw(S) { const p = S.pizza({ cx: 400, cy: 165, r: 125, n: 1, fill: 1 }); An.pop([p.g]); } },
  { cap: `피자를 **똑같이** ${n}조각으로 나누어요.`,
    draw(S) { const p = S.pizza({ cx: 400, cy: 165, r: 125, n, fill: n }); An.pop(p.slices.map(s => s.el)); } },
  { cap: `그중에서 ${k}조각을 골라요. 고르지 않은 조각은 흐리게 보여요.`,
    draw(S) { const p = S.pizza({ cx: 400, cy: 165, r: 125, n, fill: k }); An.pulse(p.slices.filter(s => s.filled).map(s => s.el)); } },
  { cap: `전체를 똑같이 ${n}${ro(n)} 나눈 것 중의 ${k}${eul(k)} {${k}/${n}}${ira(k)}고 쓰고, **${n}분의 ${k}**${ira(k)}고 읽어요.`,
    draw(S) { S.pizza({ cx: 250, cy: 165, r: 120, n, fill: k }); An.pop([S.frac(570, 165, fr(k, n), { size: 72 })]); } },
  { cap: `가로선 아래의 ${n}${eun(n)} **분모**(똑같이 나눈 수), 위의 ${k}${eun(k)} **분자**(고른 조각의 수)예요.`,
    draw(S) {
      S.pizza({ cx: 250, cy: 165, r: 120, n, fill: k }); S.frac(540, 165, fr(k, n), { size: 72 });
      An.pop([S.text(665, 120, '← 분자', { size: 26, fill: C.coral }), S.text(665, 214, '← 분모', { size: 26, fill: C.blue })], 200);
    } }
];

/* 거꾸로 해 보기: 제시된 분수만큼 칸을 드래그해서 직접 만들기 */
L.make = (shape, k, n) => {
  const T = fr(k, n), U = Math.max(1, Math.ceil(k / n));
  return [{
    interactive: true,
    cap: `이번에는 거꾸로 해 봐요! 칸을 누르거나 **드래그**해서 ${mk(T)}만큼 색칠해 보세요.`,
    draw(S, pl) {
      let cells;
      if (shape === 'pizza') cells = pizzas(S, 0, n, { cx: 255, w: 470, units: U }).flatMap(p => p.slices.map(s => ({ el: s.el, paint: s.p, dot: s.dot })));
      else cells = S.qty({ x: 40, y: 125, w: 450, h: 90, num: 0, d: n, units: U }).cells.map(c => ({ el: c.el, paint: c.el }));
      S.text(640, 40, '만들 분수', { size: 18, fill: '#667085', weight: 700 });
      S.frac(640, 105, T, { size: 42 });
      S.text(640, 200, '지금 색칠한 양', { size: 18, fill: '#667085', weight: 700 });
      let live = S.frac(640, 268, fr(0, n), { size: 42, fill: C.coral }), done = false;
      const hint = S.text(640, 326, `${k}칸을 색칠해요`, { size: 16, fill: '#667085', weight: 700 });
      An.pop(cells.map(c => c.el));
      dragBoard(S.svg, cells, LOOK[shape], cnt => {
        live.remove();
        live = S.frac(640, 268, fr(cnt, n), { size: 42, fill: cnt === k ? C.green : C.coral });
        hint.textContent = cnt === k ? '딱 맞아요! 👍' : cnt < k ? `${k - cnt}칸 더 색칠해요` : `${cnt - k}칸 많아요 · 색칠한 칸을 다시 누르면 지워져요`;
        hint.setAttribute('fill', cnt === k ? C.green : '#667085');
        if (cnt === k && !done) {
          done = true;
          if (typeof party === 'function') party(false);
          if (pl) pl.say(U > 1 ? `잘했어요! {1/${n}}${iga(1)} ${k}개이면 ${mk(T)}${ye(k)}. 1보다 큰 분수도 만들 수 있어요.` : `잘했어요! 똑같이 나눈 ${n}칸 중 ${k}칸을 색칠하면 ${mk(T)}${ye(k)}.`);
        }
      });
    }
  }];
};

L.compare = (A, B) => {
  const va = tot(A) * B.d, vb = tot(B) * A.d, sign = va > vb ? '>' : va < vb ? '<' : '=';
  const rule = sign === '=' ? '색칠한 길이가 똑같아요. 두 분수는 **크기가 같은 분수**예요.'
    : A.d === B.d ? '분모가 같으면 한 칸의 크기가 같아요. 그래서 **분자가 큰 쪽**이 더 커요.'
    : tot(A) === tot(B) ? (tot(A) === 1 ? '많이 나눌수록 한 칸은 작아져요. 단위분수는 **분모가 작을수록** 더 커요.' : '분자가 같으면 한 칸이 큰 쪽, 곧 **분모가 작은 쪽**이 더 커요.')
    : '색칠한 길이를 비교하면 알 수 있어요.';
  const draw = (S, show) => {
    const U = Math.max(1, Math.ceil(tot(A) / A.d), Math.ceil(tot(B) / B.d));
    S.frac(105, 95, A, { size: 30 }); S.frac(105, 240, B, { size: 30 });
    const qa = S.qty({ x: 190, y: 65, w: 540, h: 60, num: tot(A), d: A.d, units: U });
    const qb = S.qty({ x: 190, y: 210, w: 540, h: 60, num: tot(B), d: B.d, units: U, color: C.coral });
    if (!show) { An.pop(els(qa.filled)); An.pop(els(qb.filled), 350); }
    else An.pop([S.text(105, 168, sign === '>' ? '∨' : sign === '<' ? '∧' : '∥', { size: 34, fill: C.violet })]);
  };
  return [
    { cap: `${mk(A)}${gwa(jf(A))} ${mk(B)} 중 어느 쪽이 더 클까요? 초콜릿으로 알아봐요.`, draw: S => draw(S, false) },
    { cap: `${rule} ${mk(A)} ${sign} ${mk(B)}`, draw: S => draw(S, true) }
  ];
};

L.toMixed = (n, d) => {
  const q = Math.floor(n / d), r = n % d, R = fr(r, d, q);
  return [
    { cap: `{${n}/${d}}${eun(n)} {1/${d}} 조각이 ${n}개예요. 피자로 나타내 봐요.`,
      draw(S) { const ps = pizzas(S, n, d); S.frac(640, 165, fr(n, d), { size: 60 }); An.pop(ps.flatMap(p => p.slices.filter(s => s.filled).map(s => s.el))); } },
    { cap: `${d}조각이 모이면 1판이 돼요. ${n} ÷ ${d} = ${q} … ${r} 이니까 ${q}판과 ${r}조각이에요.`,
      draw(S) { const ps = pizzas(S, n, d); S.frac(640, 165, fr(n, d), { size: 60 }); An.pulse(ps.slice(0, q).map(p => p.g)); } },
    { cap: `그래서 {${n}/${d}} = ${mk(R)}${ye(jf(R))}. 가분수를 대분수로 바꾸었어요!`,
      draw(S) { pizzas(S, n, d); S.frac(560, 165, fr(n, d), { size: 46 }); S.text(628, 165, '=', { size: 40 }); An.pop([S.frac(708, 165, R, { size: 46, fill: C.violet })]); } }
  ];
};
L.toImproper = (w, n, d) => {
  const M = fr(n, d, w), t = w * d + n;
  return [
    { cap: `${mk(M)}${eun(n)} 피자 ${w}판과 {${n}/${d}}판이에요.`,
      draw(S) { const ps = pizzas(S, t, d); S.frac(640, 165, M, { size: 54 }); An.pop(ps.map(p => p.g)); } },
    { cap: `1판은 {${d}/${d}}${ye(d)}. 그래서 ${w}판은 {1/${d}} 조각이 ${w} × ${d} = ${w * d}개예요.`,
      draw(S) { const ps = pizzas(S, t, d); S.frac(640, 165, M, { size: 54 }); An.pulse(ps.slice(0, w).flatMap(p => p.slices.map(s => s.el))); } },
    { cap: `여기에 ${n}조각을 더하면 모두 ${t}조각! ${mk(M)} = {${t}/${d}}`,
      draw(S) { pizzas(S, t, d); S.frac(555, 165, M, { size: 44 }); S.text(630, 165, '=', { size: 40 }); An.pop([S.frac(708, 165, fr(t, d), { size: 46, fill: C.violet })]); } }
  ];
};
L.kinds = () => [
  { cap: `{3/4}처럼 분자가 분모보다 작은 분수를 **진분수**라고 해요. 진분수는 1보다 작아요.`,
    draw(S) { const ps = pizzas(S, 3, 4); S.frac(640, 165, fr(3, 4), { size: 64 }); An.pop(ps.map(p => p.g)); } },
  { cap: `{4/4}, {5/4}처럼 분자가 분모와 같거나 분모보다 큰 분수를 **가분수**라고 해요.`,
    draw(S) { const ps = pizzas(S, 5, 4); S.frac(640, 165, fr(5, 4), { size: 64 }); An.pop(ps.map(p => p.g)); } },
  { cap: `피자 1판과 {1/4}판은 {1 1/4}이라고도 써요. 자연수와 진분수로 이루어진 분수를 **대분수**라고 해요.`,
    draw(S) { pizzas(S, 5, 4); An.pop([S.frac(640, 165, fr(1, 4, 1), { size: 60, fill: C.violet })]); } },
  ...L.toMixed(7, 3)
];

const twoBars = (S, A, B) => {
  S.frac(105, 92, A, { size: 30 }); S.frac(105, 242, B, { size: 30 });
  return [S.bar({ x: 190, y: 62, w: 540, h: 60, n: A.d, fill: A.n }), S.bar({ x: 190, y: 212, w: 540, h: 60, n: B.d, fill: B.n, color: C.coral })];
};
L.equiv = (n, d, k) => {
  const A = fr(n, d), B = fr(n * k, d * k);
  return [
    { cap: `초콜릿을 똑같이 ${d}칸으로 나누고 ${n}칸을 색칠했어요. {${n}/${d}}${ye(n)}.`,
      draw(S) { S.frac(105, 92, A, { size: 30 }); const b = S.bar({ x: 190, y: 62, w: 540, h: 60, n: d, fill: n }); An.pop(els(b.cells.filter(c => c.filled))); } },
    { cap: `한 칸을 다시 ${k}칸씩 똑같이 나누어요. 색칠한 양은 변하지 않아요.`,
      draw(S) { const b = twoBars(S, A, B); An.pop(els(b[1].cells)); } },
    { cap: `분모와 분자에 **같은 수** ${k}${eul(k)} 곱하면 크기가 같은 분수가 돼요. {${n}/${d}} = {${n}×${k}/${d}×${k}} = {${n * k}/${d * k}}`,
      draw(S) { twoBars(S, A, B); An.pop([S.text(105, 167, '∥', { size: 30, fill: C.violet })]); } }
  ];
};
L.reduce = (n, d) => {
  const g = gcd(n, d), A = fr(n, d), B = fr(n / g, d / g);
  return [
    { cap: `{${n}/${d}}${eul(n)} 더 간단한 분수로 나타내 봐요.`,
      draw(S) { S.frac(105, 92, A, { size: 30 }); const b = S.bar({ x: 190, y: 62, w: 540, h: 60, n: d, fill: n }); An.pop(els(b.cells.filter(c => c.filled))); } },
    { cap: `분모 ${d}${gwa(d)} 분자 ${n}${eul(n)} 똑같이 나눌 수 있는 수 ${g}${ro(g)} 나누어요. ${g}칸씩 묶는 것과 같아요.`,
      draw(S) { const b = twoBars(S, A, B); An.pop(els(b[1].cells)); } },
    { cap: `{${n}/${d}} = {${n}÷${g}/${d}÷${g}} = {${n / g}/${d / g}}. 이것을 **약분**이라 하고, 더 약분할 수 없는 분수를 **기약분수**라고 해요.`,
      draw(S) { twoBars(S, A, B); An.pop([S.text(105, 167, '∥', { size: 30, fill: C.violet })]); } }
  ];
};

/* 위쪽: 두 양을 나란히, 아래쪽: 모으는 판 */
const pairRow = (S, A, B, op, ghost) => {
  S.frac(205, 36, A, { size: 22 }); S.text(400, 99, op, { size: 40, fill: C.violet }); S.frac(595, 36, B, { size: 22 });
  const qa = S.qty({ x: 50, y: 72, w: 310, h: 54, num: ghost ? 0 : tot(A), d: A.d, units: Math.max(1, Math.ceil(tot(A) / A.d)) });
  const qb = S.qty({ x: 440, y: 72, w: 310, h: 54, num: ghost ? 0 : tot(B), d: B.d, units: Math.max(1, Math.ceil(tot(B) / B.d)), color: C.coral });
  return { qa, qb };
};
const wideRow = (S, num, d, units, y, h) => S.qty({ x: units > 2 ? 50 : 140, y, w: units > 2 ? 700 : 520, h: h || 60, num, d, units });

L.addSame = (A, B) => {
  const d = A.d, a = tot(A), b = tot(B), s = a + b, R = canon(new Fraction(s, d)), U = Math.max(1, Math.ceil(s / d));
  const sum = `{${s}/${d}}`;
  const steps = [
    { cap: `${mk(A)} + ${mk(B)}${eul(jf(B))} 초콜릿으로 알아봐요. 두 초콜릿 모두 한 칸이 {1/${d}}${ye(1)}.`,
      draw(S) { const r = pairRow(S, A, B, '+'); An.pop(els(r.qa.filled)); An.pop(els(r.qb.filled), 350); } },
    { cap: `한 칸의 크기가 같으니까 그대로 한데 모을 수 있어요. 아래 빈 판으로 옮겨 볼까요?`,
      draw(S) { pairRow(S, A, B, '+'); An.pop(els(wideRow(S, 0, d, U, 215).cells)); } },
    { cap: `{1/${d}}${iga(1)} ${a}개와 ${b}개, 모두 ${s}개! 분모는 그대로 두고 **분자끼리** 더해요. ${mk(A)} + ${mk(B)} = ${sum}`,
      draw(S) {
        const r = pairRow(S, A, B, '+', true), res = wideRow(S, s, d, U, 215);
        res.cells.slice(a, s).forEach(c => c.el.setAttribute('fill', C.coral));
        const src = [...r.qa.cells.slice(0, a), ...r.qb.cells.slice(0, b)];
        An.fly(res.filled.map((c, i) => ({ el: c.el, from: src[i], to: c })));
      } }
  ];
  if (mk(R) !== sum) steps.push({
    cap: `${sum}${eun(s)} ${mk(R)}${gwa(jf(R))} 같아요. ${mk(A)} + ${mk(B)} = ${mk(R)}`,
    draw(S) { const res = wideRow(S, s, d, U, 90, 70); S.frac(400, 250, R, { size: 44, fill: C.violet }); An.pulse(els(res.filled)); }
  });
  return steps;
};

L.subSame = (A, B) => {
  const d = A.d, a = tot(A), b = tot(B), r = a - b, R = canon(new Fraction(r, d)), U = Math.max(1, Math.ceil(a / d));
  const head = S => { S.frac(330, 48, A, { size: 26 }); S.text(400, 48, '−', { size: 36, fill: C.violet }); S.frac(470, 48, B, { size: 26 }); };
  const row = (S, cut) => {
    const q = wideRow(S, a, d, U, 130, 70);
    const gone = q.cells.slice(r, a);
    if (cut) gone.forEach(c => { c.el.setAttribute('fill', C.gone); c.el.setAttribute('opacity', 0.3); });
    return { q, gone };
  };
  return [
    { cap: `${mk(A)} − ${mk(B)}: 먼저 초콜릿 ${mk(A)}만큼을 준비해요. {1/${d}}${iga(1)} ${a}개예요.`,
      draw(S) { head(S); An.pop(els(row(S).q.filled)); } },
    { cap: `여기에서 ${mk(B)}, 곧 {1/${d}} ${b}개를 덜어 내요.`,
      draw(S) { head(S); An.out(els(row(S, true).gone)); } },
    { cap: `남은 것은 {1/${d}}${iga(1)} ${r}개! 분모는 그대로 두고 **분자끼리** 빼요. ` + chain([`${mk(A)} − ${mk(B)}`, `{${r}/${d}}`, mk(R)]),
      draw(S) { head(S); row(S, true); An.pop([S.frac(400, 270, R, { size: 40, fill: C.violet })]); } }
  ];
};

L.diff = (A, B, op) => {
  const l = lcm(A.d, B.d), A2 = fr(tot(A) * l / A.d, l), B2 = fr(tot(B) * l / B.d, l);
  const rest = (op === '+' ? L.addSame(A2, B2) : L.subSame(A2, B2)).slice(1);
  return [
    { cap: `${mk(A)} ${op} ${mk(B)}: 두 초콜릿은 한 칸의 크기가 달라서 바로 ${op === '+' ? '더할' : '뺄'} 수 없어요.`,
      draw(S) { const r = pairRow(S, A, B, op); An.pop(els(r.qa.filled)); An.pop(els(r.qb.filled), 350); } },
    { cap: `분모 ${A.d}${gwa(A.d)} ${B.d}의 최소공배수 ${l}${eul(l)} 공통분모로 **통분**해요. ${mk(A)} = ${mk(A2)}, ${mk(B)} = ${mk(B2)}`,
      draw(S) { const r = pairRow(S, A2, B2, op); An.pop(els([...r.qa.cells, ...r.qb.cells])); } },
    ...rest
  ];
};

L.mulInt = (A, m) => {
  const a = tot(A), d = A.d, s = a * m, R = canon(new Fraction(s, d)), U = Math.max(1, Math.ceil(s / d));
  const bw = (700 - 14 * (m - 1)) / m;
  const top = (S, ghost) => { const q = []; for (let j = 0; j < m; j++) q.push(S.bar({ x: 50 + j * (bw + 14), y: 55, w: bw, h: 50, n: d, fill: ghost ? 0 : a, color: j % 2 ? C.coral : C.choco })); return q; };
  return [
    { cap: `${mk(A)} × ${m}${eun(m)} ${mk(A)}${eul(jf(A))} ${m}번 더하는 것과 같아요.`,
      draw(S) { An.pop(top(S).flatMap(b => els(b.cells.filter(c => c.filled)))); } },
    { cap: `모두 모으면 {1/${d}}${iga(1)} ${a} × ${m} = ${s}개! 분모는 그대로 두고 **분자에 자연수를** 곱해요.`,
      draw(S) {
        const q = top(S, true), res = wideRow(S, s, d, U, 205);
        const src = q.flatMap(b => b.cells.slice(0, a));
        res.filled.forEach((c, i) => { if (Math.floor(i / a) % 2) c.el.setAttribute('fill', C.coral); });
        An.fly(res.filled.map((c, i) => ({ el: c.el, from: src[i], to: c })));
      } },
    { cap: chain([`${mk(A)} × ${m}`, `{${a}×${m}/${d}}`, `{${s}/${d}}`, mk(R)]),
      draw(S) { const res = wideRow(S, s, d, U, 90, 70); S.frac(400, 250, R, { size: 44, fill: C.violet }); An.pulse(els(res.filled)); } }
  ];
};

L.mulFrac = (A, B) => {
  const a = A.n, b = A.d, c = B.n, d = B.d, R = canon(new Fraction(a * c, b * d));
  const G = (S, st) => {
    S.frac(400, 30, A, { size: 20, fill: C.blue });
    if (st) S.frac(232, 180, B, { size: 20, fill: '#B7791F' });
    return S.grid({ x: 270, y: 62, w: 260, h: 240, cols: b, rows: st ? d : 1, color: (r, cc) => {
      if (!st) return cc < a ? C.blue : null;
      const inA = cc < a, inB = r < c;
      return inA && inB ? C.green : inA ? C.blueL : inB ? C.yellowL : null;
    } });
  };
  return [
    { cap: `${mk(A)} × ${mk(B)}${eun(jf(B))} ${mk(A)}의 ${mk(B)}${ye(jf(B))}. 먼저 색종이를 세로로 ${b}칸으로 나누고 ${a}칸을 칠해요.`,
      draw(S) { An.pop(els(G(S, 0).cells.filter(x => x.on))); } },
    { cap: `이번에는 가로로 ${d}줄로 나누고 ${c}줄을 골라요. 겹쳐진 초록색 부분이 ${mk(A)}의 ${mk(B)}${ye(jf(B))}.`,
      draw(S) { An.pop(els(G(S, 1).cells.filter(x => x.r < c && x.c < a))); } },
    { cap: `전체는 ${b} × ${d} = ${b * d}칸, 초록색은 ${a} × ${c} = ${a * c}칸이에요. **분자는 분자끼리, 분모는 분모끼리** 곱해요. ` + chain([`${mk(A)} × ${mk(B)}`, `{${a}×${c}/${b}×${d}}`, `{${a * c}/${b * d}}`, mk(R)]),
      draw(S) { An.pulse(els(G(S, 1).cells.filter(x => x.r < c && x.c < a))); S.frac(660, 180, R, { size: 46, fill: C.green }); } }
  ];
};

L.divInt = (A, m) => {
  const a = A.n, b = A.d, R = canon(new Fraction(a, b * m));
  const G = (S, st) => {
    S.frac(400, 30, A, { size: 20, fill: C.blue });
    return S.grid({ x: 270, y: 62, w: 260, h: 240, cols: b, rows: st ? m : 1, color: (r, c) => (c >= a ? null : st === 2 ? (r === 0 ? C.green : C.blueL) : st === 1 ? C.blueL : C.blue) });
  };
  return [
    { cap: `${mk(A)} ÷ ${m}: 색종이의 ${mk(A)}${eul(jf(A))} ${m}명이 똑같이 나누어 가져요.`,
      draw(S) { An.pop(els(G(S, 0).cells.filter(x => x.on))); } },
    { cap: `가로로 ${m}줄로 똑같이 나누면, 전체는 ${b} × ${m} = ${b * m}칸이 돼요.`,
      draw(S) { An.pop(els(G(S, 1).cells)); } },
    { cap: `한 명의 몫은 한 줄, 곧 ${a}칸이에요. ` + chain([`${mk(A)} ÷ ${m}`, `{${a}/${b}×${m}}`, `{${a}/${b * m}}`, mk(R)]),
      draw(S) { An.pulse(els(G(S, 2).cells.filter(x => x.r === 0 && x.c < a))); S.frac(660, 180, R, { size: 46, fill: C.green }); } },
    { cap: `÷ ${m}${eun(m)} × {1/${m}}${gwa(1)} 같아요. ${mk(A)} ÷ ${m} = ${mk(A)} × {1/${m}}`,
      draw(S) { G(S, 2); S.frac(660, 180, R, { size: 46, fill: C.green }); } }
  ];
};

L.divFrac = (A, B) => {
  const a = A.n, b = A.d, c = B.n, d = B.d, l = lcm(b, d), a2 = a * l / b, c2 = c * l / d, R = canon(new Fraction(a * d, b * c));
  const pal = [C.choco, C.blue, C.yellow, C.green];
  const draw = (S, st) => {
    const X = st ? fr(a2, l) : A, Y = st ? fr(c2, l) : B;
    S.frac(105, 92, X, { size: 30 }); S.frac(105, 242, Y, { size: 30 });
    const t = S.bar({ x: 190, y: 62, w: 540, h: 60, n: X.d, fill: X.n });
    const u = S.bar({ x: 190, y: 212, w: 540, h: 60, n: Y.d, fill: Y.n, color: C.coral });
    if (st === 2) t.cells.slice(0, a2).forEach((cl, i) => cl.el.setAttribute('fill', pal[Math.floor(i / c2) % pal.length]));
    return [t, u];
  };
  const steps = [
    { cap: `${mk(A)} ÷ ${mk(B)}${eun(jf(B))} ${mk(A)} 안에 ${mk(B)}${iga(jf(B))} 몇 번 들어가는지 알아보는 거예요.`,
      draw(S) { const r = draw(S, 0); An.pop(els(r[0].cells.filter(x => x.filled))); An.pop(els(r[1].cells.filter(x => x.filled)), 350); } }
  ];
  if (b !== d) steps.push({ cap: `한 칸의 크기를 맞추려고 통분해요. ${mk(A)} = {${a2}/${l}}, ${mk(B)} = {${c2}/${l}}`,
    draw(S) { const r = draw(S, 1); An.pop(els([...r[0].cells, ...r[1].cells])); } });
  steps.push(
    { cap: `${a2}칸을 ${c2}칸씩 묶어요. ${a2} ÷ ${c2} = ${mk(R)}. 분모가 같으면 **분자끼리** 나누면 돼요.`,
      draw(S) { const r = draw(S, 2); An.pulse(els(r[0].cells.slice(0, a2))); } },
    { cap: `나누는 분수의 **분모와 분자를 바꾸어 곱해도** 같아요. ` + chain([`${mk(A)} ÷ ${mk(B)}`, `${mk(A)} × {${d}/${c}}`, `{${a}×${d}/${b}×${c}}`, `{${a * d}/${b * c}}`, mk(R)]),
      draw(S) { draw(S, 2); } }
  );
  return steps;
};
