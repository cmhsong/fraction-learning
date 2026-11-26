'use strict';
/* ---------- 단원과 문제 만들기 ---------- */
const fracP = o => Object.assign({ kind: 'frac', mode: 'value', slots: ['w', 'n', 'd'] }, o);
const coprime = (lo, hi) => { let n, d; do { d = rnd(lo, hi); n = rnd(1, d - 1); } while (gcd(n, d) !== 1); return [n, d]; };
const cnum = d => { let n; do { n = rnd(1, d - 1); } while (gcd(n, d) !== 1); return n; };
const PAIRS = [[2, 3], [2, 4], [2, 5], [2, 6], [3, 4], [3, 6], [4, 6], [2, 8], [4, 8], [3, 9], [5, 10], [2, 10], [4, 5], [3, 5], [6, 9], [3, 12], [4, 12], [6, 8]];
const SIGNS = [{ label: '>', value: '>' }, { label: '=', value: '=' }, { label: '<', value: '<' }];
const KINDS = [{ label: '진분수', value: 'p' }, { label: '가분수', value: 'i' }, { label: '대분수', value: 'm' }];

const G = {};

G[1] = i => {
  const n = rnd(2, 8), k = rnd(1, n - 1), shape = pick(['pizza', 'bar']);
  const vis = kk => svg => { const S = new Scene(svg, 800, 200); if (shape === 'pizza') S.pizza({ cx: 400, cy: 100, r: 86, n, fill: kk }); else S.bar({ x: 160, y: 65, w: 480, h: 70, n, fill: kk }); };
  const demo = () => L.meaning(n, k);
  const why = `전체를 똑같이 ${n}${ro(n)} 나눈 것 중의 ${k}${ira(k)}서 {${k}/${n}}${ye(k)}.`;
  if (i < 4) return fracP({ prompt: '색칠한 부분은 전체의 얼마인지 분수로 나타내세요.', visual: vis(k), slots: ['n', 'd'], mode: 'exact', ans: fr(k, n), explain: why, demo });
  if (i < 7) return { kind: 'tap', shape, n, ans: k, prompt: `{${k}/${n}}만큼 색칠하세요.`, visual: vis(0), explain: `분모 ${n}${eun(n)} 전체 칸의 수, 분자 ${k}${eun(k)} 색칠할 칸의 수예요.`, demo };
  return fracP({ prompt: `전체를 똑같이 ${n}${ro(n)} 나눈 것 중의 ${k}${eun(k)} 얼마인지 분수로 쓰세요.`, slots: ['n', 'd'], mode: 'exact', ans: fr(k, n), explain: why, demo });
};

G[2] = i => {
  let A, B, why;
  if (i < 4) { const d = rnd(3, 9), a = rnd(1, d - 1); let b; do { b = rnd(1, d - 1); } while (b === a); A = fr(a, d); B = fr(b, d); why = '분모가 같으면 분자가 큰 분수가 더 커요.'; }
  else if (i < 7) { const a = rnd(2, 9); let b; do { b = rnd(2, 9); } while (b === a); A = fr(1, a); B = fr(1, b); why = '단위분수는 분모가 작을수록 더 커요.'; }
  else if (i < 9) { const n = rnd(2, 4), a = rnd(n + 1, 9); let b; do { b = rnd(n + 1, 9); } while (b === a); A = fr(n, a); B = fr(n, b); why = '분자가 같으면 분모가 작은 분수가 더 커요.'; }
  else { const d = rnd(2, 4), n = rnd(1, d - 1), k = rnd(2, 3); A = fr(n, d); B = fr(n * k, d * k); if (rnd(0, 1)) [A, B] = [B, A]; why = '분모와 분자에 같은 수를 곱한 분수는 크기가 같아요.'; }
  const va = tot(A) * B.d, vb = tot(B) * A.d, sign = va > vb ? '>' : va < vb ? '<' : '=';
  return { kind: 'choice', prompt: '두 분수의 크기를 비교하여 ○ 안에 알맞은 기호를 고르세요.', expr: `${mk(A)} ○ ${mk(B)}`, options: SIGNS, ans: sign, explain: `${why} ${mk(A)} ${sign} ${mk(B)}`, demo: () => L.compare(A, B) };
};

G[3] = i => {
  if (i < 3) {
    const d = rnd(3, 8), t = pick(['p', 'i', 'm']);
    const f = t === 'p' ? fr(rnd(1, d - 1), d) : t === 'i' ? fr(rnd(d, 2 * d + 1), d) : fr(rnd(1, d - 1), d, rnd(1, 4));
    const why = { p: '분자가 분모보다 작으므로 진분수예요.', i: '분자가 분모와 같거나 분모보다 크므로 가분수예요.', m: '자연수와 진분수로 이루어져 있으므로 대분수예요.' }[t];
    return { kind: 'choice', prompt: '어떤 분수인지 고르세요.', expr: mk(f), options: KINDS, ans: t, explain: why };
  }
  const d = rnd(2, 6), w = rnd(1, 3), r = rnd(1, d - 1), n = w * d + r;
  if (i < 7) return fracP({ prompt: '가분수를 대분수로 나타내세요.', expr: `{${n}/${d}} =`, mode: 'mixed', ans: fr(r, d, w), explain: `${n} ÷ ${d} = ${w} … ${r} 이므로 {${n}/${d}} = {${w} ${r}/${d}}${ye(r)}.`, demo: () => L.toMixed(n, d) });
  return fracP({ prompt: '대분수를 가분수로 나타내세요.', expr: `{${w} ${r}/${d}} =`, slots: ['n', 'd'], mode: 'exact', ans: fr(n, d), explain: `${w} × ${d} + ${r} = ${n} 이므로 {${w} ${r}/${d}} = {${n}/${d}}${ye(n)}.`, demo: () => L.toImproper(w, r, d) });
};

G[4] = i => {
  if (i < 4) {
    const [n, d] = coprime(2, 6), k = rnd(2, 5), top = rnd(0, 1);
    return { kind: 'int', prompt: '□ 안에 알맞은 수를 쓰세요.',
      expr: top ? `{${n}/${d}} = {□/${d * k}}` : `{${n}/${d}} = {${n * k}/□}`, ans: top ? n * k : d * k,
      explain: top ? `분모에 ${k}${eul(k)} 곱했으므로 분자에도 ${k}${eul(k)} 곱해요. ${n} × ${k} = ${n * k}` : `분자에 ${k}${eul(k)} 곱했으므로 분모에도 ${k}${eul(k)} 곱해요. ${d} × ${k} = ${d * k}`,
      demo: d * k <= 24 ? () => L.equiv(n, d, k) : null };
  }
  if (i < 8) {
    const [n, d] = coprime(2, 9), k = rnd(2, 6);
    return fracP({ prompt: '기약분수로 나타내세요.', expr: `{${n * k}/${d * k}} =`, slots: ['n', 'd'], mode: 'simplest', ans: fr(n, d),
      explain: `분모와 분자를 최대공약수 ${k}${ro(k)} 나누면 {${n}/${d}}${ye(n)}.`, demo: d * k <= 24 ? () => L.reduce(n * k, d * k) : null });
  }
  const [b, d] = pick(PAIRS), a = rnd(1, b - 1), c = rnd(1, d - 1), l = lcm(b, d);
  return { kind: 'int', prompt: `{${a}/${b}}${gwa(a)} {${c}/${d}}${eul(c)} 통분하려고 해요. 가장 작은 공통분모를 쓰세요.`, ans: l,
    explain: `${b}${gwa(b)} ${d}의 최소공배수는 ${l}${ye(l)}. 두 분모의 최소공배수를 공통분모로 하면 가장 간단해요.` };
};

G[5] = i => {
  let A, B, d = rnd(3, 9);
  if (i < 4) { const a = rnd(1, d - 2); A = fr(a, d); B = fr(rnd(1, d - 1 - a), d); }
  else if (i < 7) { const a = rnd(2, d - 1); A = fr(a, d); B = fr(rnd(d - a, d - 1), d); }
  else { d = rnd(3, 6); A = fr(rnd(1, d - 1), d, rnd(1, 2)); B = fr(rnd(1, d - 1), d, rnd(0, 1)); }
  const s = tot(A) + tot(B), R = canon(new Fraction(s, d));
  const mixed = A.w || B.w;
  return fracP({ prompt: '계산해 보세요.', expr: `${mk(A)} + ${mk(B)} =`, ans: R,
    explain: (mixed ? '대분수를 가분수로 바꾸어, ' : '') + '분모는 그대로 두고 분자끼리 더해요. ' +
      chain([`${mk(A)} + ${mk(B)}`, `{${tot(A)}+${tot(B)}/${d}}`, `{${s}/${d}}`, mk(R)]),
    demo: () => L.addSame(A, B) });
};

G[6] = i => {
  let A, B, d = rnd(3, 9), tip = '분모는 그대로 두고 분자끼리 빼요. ';
  if (i < 4) { const a = rnd(2, d - 1); A = fr(a, d); B = fr(rnd(1, a - 1), d); }
  else if (i < 6) { A = fr(0, d, 1); B = fr(rnd(1, d - 1), d); tip = `1을 {${d}/${d}}${ro(d)} 바꾸어 계산해요. `; }
  else if (i < 8) { d = rnd(3, 7); const a = rnd(2, d - 1); A = fr(a, d, rnd(1, 2)); B = fr(rnd(1, a - 1), d); tip = '자연수는 그대로 두고 분수끼리 빼도 되고, 가분수로 바꾸어 빼도 돼요. '; }
  else { d = rnd(3, 7); const a = rnd(1, d - 2); A = fr(a, d, rnd(1, 2)); B = fr(rnd(a + 1, d - 1), d); tip = '분수끼리 뺄 수 없으면 대분수를 가분수로 바꾸어 계산해요. '; }
  const r = tot(A) - tot(B), R = canon(new Fraction(r, d));
  return fracP({ prompt: '계산해 보세요.', expr: `${mk(A)} − ${mk(B)} =`, ans: R,
    explain: tip + chain([`${mk(A)} − ${mk(B)}`, `{${tot(A)}−${tot(B)}/${d}}`, `{${r}/${d}}`, mk(R)]),
    demo: () => L.subSame(A, B) });
};

G[7] = i => {
  const pr = pick(PAIRS), sw = rnd(0, 1), b = pr[sw], d = pr[1 - sw];
  let A = fr(cnum(b), b), B = fr(cnum(d), d);
  const op = i < 5 ? '+' : '−';
  if (op === '−' && A.n * B.d < B.n * A.d) [A, B] = [B, A];
  const l = lcm(A.d, B.d), a2 = A.n * l / A.d, b2 = B.n * l / B.d, r = op === '+' ? a2 + b2 : a2 - b2, R = canon(new Fraction(r, l));
  return fracP({ prompt: '계산해 보세요.', expr: `${mk(A)} ${op} ${mk(B)} =`, ans: R,
    explain: `분모 ${A.d}${gwa(A.d)} ${B.d}의 최소공배수 ${l}${ro(l)} 통분해요. ` + chain([`${mk(A)} ${op} ${mk(B)}`, `{${a2}/${l}} ${op} {${b2}/${l}}`, `{${r}/${l}}`, mk(R)]),
    demo: () => L.diff(A, B, op) });
};

G[8] = i => {
  if (i < 4) {
    const [n, d] = coprime(2, 7), m = rnd(2, 5), A = fr(n, d), R = canon(new Fraction(n * m, d));
    return fracP({ prompt: '계산해 보세요.', expr: `${mk(A)} × ${m} =`, ans: R,
      explain: '분모는 그대로 두고 분자에 자연수를 곱해요. ' + chain([`${mk(A)} × ${m}`, `{${n}×${m}/${d}}`, `{${n * m}/${d}}`, mk(R)]), demo: () => L.mulInt(A, m) });
  }
  const [c, d] = coprime(2, 6);
  if (i < 8) {
    const [a, b] = coprime(2, 6), A = fr(a, b), B = fr(c, d), R = canon(new Fraction(a * c, b * d));
    return fracP({ prompt: '계산해 보세요.', expr: `${mk(A)} × ${mk(B)} =`, ans: R,
      explain: '분자는 분자끼리, 분모는 분모끼리 곱해요. ' + chain([`${mk(A)} × ${mk(B)}`, `{${a}×${c}/${b}×${d}}`, `{${a * c}/${b * d}}`, mk(R)]), demo: () => L.mulFrac(A, B) });
  }
  const b = rnd(2, 5), A = fr(rnd(1, b - 1), b, 1), B = fr(c, d), t = tot(A), R = canon(new Fraction(t * c, b * d));
  return fracP({ prompt: '계산해 보세요.', expr: `${mk(A)} × ${mk(B)} =`, ans: R,
    explain: '대분수를 가분수로 바꾸어 곱해요. ' + chain([`${mk(A)} × ${mk(B)}`, `{${t}/${b}} × ${mk(B)}`, `{${t}×${c}/${b}×${d}}`, `{${t * c}/${b * d}}`, mk(R)]) });
};

G[9] = i => {
  if (i < 4) {
    const [n, d] = coprime(2, 6), m = rnd(2, 5), A = fr(n, d), R = canon(new Fraction(n, d * m));
    return fracP({ prompt: '계산해 보세요.', expr: `${mk(A)} ÷ ${m} =`, ans: R,
      explain: `÷ ${m}${eun(m)} × {1/${m}}${gwa(1)} 같아요. ` + chain([`${mk(A)} ÷ ${m}`, `${mk(A)} × {1/${m}}`, `{${n}/${d}×${m}}`, `{${n}/${d * m}}`, mk(R)]), demo: () => L.divInt(A, m) });
  }
  if (i < 8) {
    const pr = rnd(0, 3) ? pick(PAIRS) : (x => [x, x])(rnd(3, 9)), sw = rnd(0, 1);
    const A = fr(cnum(pr[sw]), pr[sw]), B = fr(cnum(pr[1 - sw]), pr[1 - sw]), R = canon(new Fraction(A.n * B.d, A.d * B.n));
    return fracP({ prompt: '계산해 보세요.', expr: `${mk(A)} ÷ ${mk(B)} =`, ans: R,
      explain: '나누는 분수의 분모와 분자를 바꾸어 곱해요. ' + chain([`${mk(A)} ÷ ${mk(B)}`, `${mk(A)} × {${B.d}/${B.n}}`, `{${A.n}×${B.d}/${A.d}×${B.n}}`, `{${A.n * B.d}/${A.d * B.n}}`, mk(R)]), demo: () => L.divFrac(A, B) });
  }
  const m = rnd(2, 5), [c, d] = coprime(2, 6), B = fr(c, d), R = canon(new Fraction(m * d, c));
  return fracP({ prompt: '계산해 보세요.', expr: `${m} ÷ ${mk(B)} =`, ans: R,
    explain: '나누는 분수의 분모와 분자를 바꾸어 곱해요. ' + chain([`${m} ÷ ${mk(B)}`, `${m} × {${d}/${c}}`, `{${m}×${d}/${c}}`, `{${m * d}/${c}}`, mk(R)]) });
};

G[10] = () => G[rnd(1, 9)](rnd(0, 9));

const UNITS = [
  { id: 1, icon: '🍕', color: '#F59E0B', title: '분수의 뜻', desc: '전체와 부분, 분모와 분자', lesson: () => { const n = rnd(5, 8), k = rnd(2, n - 1); return [...L.meaning(4, 3), ...L.make('bar', 2, 5), ...L.make('pizza', k, n)]; } },
  { id: 2, icon: '⚖️', color: '#EF6C4D', title: '분수의 크기 비교', desc: '어느 쪽이 더 클까요?', lesson: () => [...L.compare(fr(2, 5), fr(4, 5)), ...L.compare(fr(1, 3), fr(1, 6))] },
  { id: 3, icon: '🧩', color: '#D9488F', title: '진분수 · 가분수 · 대분수', desc: '여러 가지 분수와 바꾸어 쓰기', lesson: () => [...L.kinds(), ...L.make('pizza', 5, 4), ...L.make('bar', 7, 3)] },
  { id: 4, icon: '🔍', color: '#8B5CF6', title: '크기가 같은 분수', desc: '약분과 통분', lesson: () => [...L.equiv(1, 2, 3), ...L.reduce(4, 6)] },
  { id: 5, icon: '➕', color: '#5B5BD6', title: '분수의 덧셈', desc: '분모가 같은 분수 더하기', lesson: () => [...L.addSame(fr(1, 4), fr(2, 4)), ...L.addSame(fr(3, 5), fr(4, 5))] },
  { id: 6, icon: '➖', color: '#3B82F6', title: '분수의 뺄셈', desc: '분모가 같은 분수 빼기', lesson: () => [...L.subSame(fr(4, 5), fr(1, 5)), ...L.subSame(fr(1, 4, 1), fr(3, 4))] },
  { id: 7, icon: '🔀', color: '#0EA5A4', title: '분모가 다른 덧셈과 뺄셈', desc: '통분하여 계산하기', lesson: () => [...L.diff(fr(1, 2), fr(1, 3), '+'), ...L.diff(fr(3, 4), fr(1, 2), '−')] },
  { id: 8, icon: '✖️', color: '#22A565', title: '분수의 곱셈', desc: '(분수)×(자연수), (분수)×(분수)', lesson: () => [...L.mulInt(fr(2, 3), 2), ...L.mulFrac(fr(2, 3), fr(3, 4))] },
  { id: 9, icon: '➗', color: '#65A30D', title: '분수의 나눗셈', desc: '(분수)÷(자연수), (분수)÷(분수)', lesson: () => [...L.divInt(fr(2, 3), 2), ...L.divFrac(fr(3, 4), fr(1, 8))] },
  { id: 10, icon: '🏆', color: '#C2410C', title: '종합 평가', desc: '배운 내용을 골고루 풀어요', lesson: null }
];
UNITS.forEach(u => { u.gen = G[u.id]; });

/* ---------- 채점 ---------- */
function ansText(p) {
  if (p.kind === 'frac') return mk(p.ans);
  if (p.kind === 'int') return String(p.ans);
  if (p.kind === 'choice') return p.options.find(o => o.value === p.ans).label;
  return `${p.n}칸 중 ${p.ans}칸 색칠`;
}
function checkAnswer(p, input) {
  if (p.kind === 'choice') return input == null ? { incomplete: true, msg: '보기에서 하나를 골라 주세요.' } : { ok: input === p.ans };
  if (p.kind === 'tap') return input === 0 ? { incomplete: true, msg: '칸을 누르거나 드래그해서 색칠해 주세요.' } : { ok: input === p.ans, msg: input !== p.ans ? `지금 ${input}칸을 색칠했어요. 분자를 다시 확인해 봐요.` : '' };
  if (p.kind === 'int') return input.v === '' ? { incomplete: true, msg: '답을 입력해 주세요.' } : { ok: +input.v === p.ans };
  const hasW = p.slots.includes('w');
  const W = hasW && input.w !== '' ? +input.w : 0;
  let n, d;
  if (input.n === '' && input.d === '') {
    if (!hasW || input.w === '') return { incomplete: true, msg: '답을 입력해 주세요.' };
    n = 0; d = 1;
  } else if (input.n === '' || input.d === '') return { incomplete: true, msg: '분자와 분모를 모두 써 주세요.' };
  else { n = +input.n; d = +input.d; }
  if (d === 0) return { incomplete: true, msg: '분모는 0이 될 수 없어요.' };
  const same = new Fraction(W * d + n, d).equals(val(p.ans));
  if (p.mode === 'exact') { const ok = W === p.ans.w && n === p.ans.n && d === p.ans.d; return { ok, msg: !ok && same ? '크기는 같지만, 문제에서 묻는 모양으로 써 주세요.' : '' }; }
  if (p.mode === 'simplest') { const ok = same && gcd(n, d) === 1; return { ok, msg: !ok && same ? '크기는 같지만 더 약분할 수 있어요!' : '' }; }
  if (p.mode === 'mixed') { const ok = same && W >= 1 && n < d; return { ok, msg: !ok && same ? '자연수와 진분수로 이루어진 대분수로 써 주세요.' : '' }; }
  const neat = n === 0 || (n < d && gcd(n, d) === 1);
  return { ok: same, note: same && !neat ? `간단히 나타내면 ${mk(p.ans)}${ye(jf(p.ans))}.` : '' };
}
