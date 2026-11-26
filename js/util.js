'use strict';
/* ---------- 공통 도우미 ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[rnd(0, arr.length - 1)];
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const lcm = (a, b) => (a / gcd(a, b)) * b;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const store = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 저장 불가 환경 */ } }
};

/* ---------- 조사(은/는, 이/가 …) : 숫자의 받침에 맞춤 ---------- */
const _b = n => [1, 1, 0, 1, 0, 0, 1, 1, 1, 0][Math.abs(n) % 10];
const eun = n => (_b(n) ? '은' : '는');
const iga = n => (_b(n) ? '이' : '가');
const eul = n => (_b(n) ? '을' : '를');
const gwa = n => (_b(n) ? '과' : '와');
const ira = n => (_b(n) ? '이라' : '라');
const ye = n => (_b(n) ? '이에요' : '예요');
const ro = n => (_b(n) && ![1, 7, 8].includes(Math.abs(n) % 10) ? '으로' : '로');

/* ---------- 분수 객체 {w:자연수, n:분자, d:분모} ---------- */
const fr = (n, d, w = 0) => ({ w, n, d });
const tot = f => f.w * f.d + f.n;                       // 가분수로 바꾼 분자
const val = f => new Fraction(tot(f), f.d);             // Fraction.js 값
const canon = F => {                                    // 기약분수·대분수 꼴
  const n = Number(F.n), d = Number(F.d);
  return { w: Math.floor(n / d), n: n % d, d };
};
const mk = f => (f.n === 0 && (f.w || f.d === 1) ? String(f.w) : f.w ? `{${f.w} ${f.n}/${f.d}}` : `{${f.n}/${f.d}}`);
const jf = f => (f.n === 0 ? f.w : f.n);                 // 읽을 때 마지막에 오는 수
const chain = parts => parts.filter((p, i) => i === 0 || p !== parts[i - 1]).join(' = ');

/* ---------- 마크업: {3/4}, {1 3/4} → 화면용 HTML / 읽기용 문장 ---------- */
const FR = /\{(?:([^\s\/}]+) )?([^\s\/}]+)\/([^\s}]+)\}/g;
const fracHTML = (w, n, d) =>
  `<span class="fr">${w ? `<span class="fw">${w}</span>` : ''}<span class="fv"><span class="fn">${n}</span><span class="fd">${d}</span></span></span>`;
function fmt(t) {
  return esc(t)
    .replace(FR, (m, w, n, d) => fracHTML(w, n, d))
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/□/g, '<span class="bx"></span>')
    .replace(/○/g, '<span class="circ"></span>')
    .replace(/\n/g, '<br>');
}
function spk(t) {
  return t
    .replace(FR, (m, w, n, d) => (w ? `${w}${gwa(+w)} ` : '') + `${d}분의 ${n}`)
    .replace(/\*\*/g, '')
    .replace(/□/g, '네모').replace(/○/g, '동그라미')
    .replace(/\+/g, ' 더하기 ').replace(/−/g, ' 빼기 ').replace(/×/g, ' 곱하기 ').replace(/÷/g, ' 나누기 ')
    .replace(/…/g, ' 나머지 ').replace(/=/g, ' 는 ')
    .replace(/>/g, ' 이 더 크다 ').replace(/</g, ' 이 더 작다 ');
}
