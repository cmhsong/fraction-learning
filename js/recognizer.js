'use strict';
/* ---------- 손글씨 숫자 인식 ----------
   $P Point-Cloud Recognizer (Vatavu, Anthony, Wobbrock · New BSD License) 알고리즘을
   숫자 0~9 본보기에 맞추어 구현했습니다. 인터넷 연결 없이 동작합니다. */
const HW = (() => {
  const N = 32;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function resample(strokes, n) {
    let len = 0;
    strokes.forEach(s => { for (let i = 1; i < s.length; i++) len += dist(s[i - 1], s[i]); });
    if (len < 1e-6) return null;
    const I = len / (n - 1); let D = 0; const out = [];
    strokes.forEach(s => {
      const pts = s.map(p => ({ x: p.x, y: p.y }));
      if (!out.length) out.push({ ...pts[0] });
      for (let i = 1; i < pts.length; i++) {
        const d = dist(pts[i - 1], pts[i]);
        if (d > 0 && D + d >= I) {
          const t = (I - D) / d;
          const q = { x: pts[i - 1].x + t * (pts[i].x - pts[i - 1].x), y: pts[i - 1].y + t * (pts[i].y - pts[i - 1].y) };
          out.push(q); pts.splice(i, 0, q); D = 0;
        } else D += d;
      }
    });
    const last = strokes[strokes.length - 1]; const lp = last[last.length - 1];
    while (out.length < n) out.push({ x: lp.x, y: lp.y });
    return out.slice(0, n);
  }
  function normalize(strokes) {
    const pts = resample(strokes, N); if (!pts) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    pts.forEach(p => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); });
    const s = Math.max(maxX - minX, maxY - minY) || 1;
    let cx = 0, cy = 0;
    pts.forEach(p => { p.x = (p.x - minX) / s; p.y = (p.y - minY) / s; cx += p.x; cy += p.y; });
    cx /= N; cy /= N;
    pts.forEach(p => { p.x -= cx; p.y -= cy; });
    return pts;
  }
  function cloudDist(a, b, start) {
    const used = new Array(N).fill(false); let sum = 0, i = start;
    do {
      let min = Infinity, idx = -1;
      for (let j = 0; j < N; j++) if (!used[j]) { const d = dist(a[i], b[j]); if (d < min) { min = d; idx = j; } }
      used[idx] = true;
      sum += (1 - ((i - start + N) % N) / N) * min;
      i = (i + 1) % N;
    } while (i !== start);
    return sum;
  }
  function match(a, b) {
    const step = Math.floor(Math.sqrt(N)); let min = Infinity;
    for (let i = 0; i < N; i += step) min = Math.min(min, cloudDist(a, b, i), cloudDist(b, a, i));
    return min;
  }

  /* 숫자 본보기 (가로 100 × 세로 140 좌표) */
  const P = arr => arr.map(([x, y]) => ({ x, y }));
  const ell = (cx, cy, rx, ry) => { const a = []; for (let i = 0; i <= 20; i++) { const t = -Math.PI / 2 + i * Math.PI / 10; a.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]); } return a; };
  const eight = () => { const a = []; for (let i = 0; i <= 28; i++) { const t = i * Math.PI / 14; a.push([50 + 28 * Math.sin(2 * t), 70 - 58 * Math.cos(t)]); } return a; };
  const RAW = {
    0: [[ell(50, 70, 32, 56)], [ell(50, 70, 44, 54)]],
    1: [[[[50, 10], [50, 130]]], [[[28, 38], [52, 10], [52, 130]]], [[[30, 36], [52, 10], [52, 130]], [[25, 130], [80, 130]]]],
    2: [[[[18, 40], [25, 20], [50, 10], [75, 22], [78, 45], [60, 75], [18, 130], [85, 130]]],
        [[[20, 30], [45, 10], [72, 20], [72, 48], [20, 128], [50, 118], [85, 130]]]],
    3: [[[[20, 22], [50, 10], [78, 25], [75, 50], [45, 65], [78, 82], [80, 110], [50, 130], [18, 115]]],
        [[[18, 12], [80, 12], [48, 55], [78, 75], [78, 108], [50, 130], [18, 116]]]],
    4: [[[[60, 10], [15, 90], [90, 90]], [[65, 10], [65, 130]]],
        [[[20, 10], [20, 72], [85, 72]], [[68, 10], [68, 130]]],
        [[[70, 130], [70, 10], [15, 90], [92, 90]]]],
    5: [[[[75, 10], [25, 10], [22, 60], [50, 52], [78, 68], [80, 100], [55, 128], [20, 118]]],
        [[[28, 10], [24, 58], [52, 50], [80, 70], [78, 105], [50, 128], [20, 116]], [[28, 10], [80, 10]]]],
    6: [[[[70, 10], [40, 40], [22, 85], [30, 120], [55, 130], [78, 110], [72, 82], [48, 72], [25, 90]]],
        [[[60, 10], [30, 50], [22, 95], [38, 126], [62, 126], [76, 100], [60, 78], [30, 88]]]],
    7: [[[[15, 12], [85, 12], [45, 130]]], [[[15, 32], [15, 12], [85, 12], [50, 130]]],
        [[[15, 12], [85, 12], [45, 130]], [[35, 72], [78, 72]]]],
    8: [[eight()], [[...ell(50, 38, 24, 28)], [...ell(50, 98, 30, 32)]]],
    9: [[[[75, 40], [55, 12], [28, 22], [25, 50], [48, 62], [75, 45], [76, 15], [74, 80], [60, 130]]],
        [[[76, 38], [55, 12], [28, 24], [28, 52], [52, 60], [76, 40], [76, 14], [76, 95], [55, 128], [25, 118]]]]
  };
  const T = [];
  Object.keys(RAW).forEach(k => RAW[k].forEach(st => T.push({ name: k, pts: normalize(st.map(P)) })));

  function box(strokes) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    strokes.forEach(s => s.forEach(p => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); }));
    return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
  }
  function recognize(strokes) {
    const b = box(strokes);
    if (strokes.length === 1 && b.h > 0 && b.w / b.h < 0.2) return '1';   // 가느다란 세로선
    const pts = normalize(strokes); if (!pts) return '';
    let best = Infinity, name = '';
    T.forEach(t => { const d = match(pts, t.pts); if (d < best) { best = d; name = t.name; } });
    return name;
  }
  /* 여러 자리 수: 가로로 겹치지 않는 획 묶음을 한 글자로 봄 */
  function read(strokes) {
    strokes = strokes.filter(s => s.length > 1);
    if (!strokes.length) return '';
    const all = box(strokes); const size = Math.max(all.h, 1);
    const items = strokes.map(s => ({ s, b: box([s]) })).sort((a, b) => a.b.minX - b.b.minX);
    const groups = [];
    items.forEach(it => {
      const g = groups[groups.length - 1];
      if (g && it.b.minX <= g.maxX + size * 0.03) { g.list.push(it.s); g.maxX = Math.max(g.maxX, it.b.maxX); }
      else groups.push({ list: [it.s], maxX: it.b.maxX });
    });
    return groups.map(g => {
      const b = box(g.list);
      if (Math.max(b.w, b.h) < size * 0.15) return '';                     // 실수로 찍힌 점
      return recognize(g.list);
    }).join('');
  }
  return { read, recognize, _raw: RAW };
})();
if (typeof module !== 'undefined') module.exports = HW;
