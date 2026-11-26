'use strict';
/* ---------- 화면과 상호작용 ---------- */
const FONT = [14, 16, 18, 21, 24];
const FONT_NAME = ['아주 작게', '작게', '보통', '크게', '아주 크게'];
const settings = Object.assign({ font: 2, zoom: 100, voice: 'female', rate: 0.95, input: 'pad' }, store.get('fr.settings', {}));
let progress = store.get('fr.progress', {});
const view = $('#view');
const cur = { player: null, practice: null, modal: null };

Voice.mode = () => settings.voice;
Voice.rate = () => settings.rate;
Voice.init();

function applySettings() {
  document.documentElement.style.fontSize = FONT[settings.font] + 'px';
  $('#app').style.zoom = settings.zoom / 100;
  $('#btnVoice').textContent = { female: '🔊 여자 목소리', male: '🔊 남자 목소리', off: '🔇 소리 끔' }[settings.voice];
  store.set('fr.settings', settings);
}
function cleanup() {
  if (cur.player) { cur.player.destroy(); cur.player = null; }
  cur.practice = null; Voice.stop();
  window.scrollTo(0, 0);
}
const stars = n => `<span class="stars" aria-label="별 ${n}개">${'★'.repeat(n)}<i>${'★'.repeat(3 - n)}</i></span>`;
const party = big => { if (window.confetti) confetti({ particleCount: big ? 160 : 60, spread: big ? 100 : 60, origin: { y: 0.7 }, disableForReducedMotion: true }); };

/* ---------- 첫 화면 ---------- */
function renderHome() {
  cleanup();
  const next = UNITS.find(u => !(progress[u.id] && progress[u.id].stars)) || UNITS[0];
  view.innerHTML = `
    <section class="hero">
      <div>
        <p class="eyebrow">차근차근 분수 교실</p>
        <h1>분수, 눈으로 보고<br>손으로 익혀요</h1>
        <p class="lead">피자와 초콜릿을 나누어 보면서 분수의 뜻부터 덧셈·뺄셈·곱셈·나눗셈까지 한 단계씩 배워요.</p>
        <div class="row">
          <button class="btn pri lg" id="goNext">▶ ${next.id}단계 학습하기</button>
          <button class="btn lg" id="goPrint">🖨 학습지 출력</button>
        </div>
      </div>
      <div class="hero-art"><svg id="heroSvg" aria-hidden="true"></svg></div>
    </section>
    <h2 class="sec">학습 단원</h2>
    <div class="units">
      ${UNITS.map(u => `
        <button class="unit" data-u="${u.id}" style="--uc:${u.color}">
          <span class="uico">${u.icon}</span>
          <span class="ubody"><span class="uno">${u.id}단계</span><span class="utitle">${u.title}</span><span class="udesc">${u.desc}</span></span>
          ${stars((progress[u.id] || {}).stars || 0)}
        </button>`).join('')}
    </div>
    <p class="foot">오픈소스 활용: Fraction.js(분수 계산) · anime.js(애니메이션) · canvas-confetti(축하 효과) · Pretendard(글꼴) · $P Recognizer(손글씨 인식 알고리즘)</p>`;
  const S = new Scene($('#heroSvg'), 420, 300);
  const p = S.pizza({ cx: 150, cy: 150, r: 115, n: 8, fill: 3 });
  const f = S.frac(345, 150, fr(3, 8), { size: 68, fill: C.violet });
  An.pop([...p.slices.map(s => s.el), f]);
  $('#goNext').onclick = () => openUnit(next.id);
  $('#goPrint').onclick = () => openPrint();
  $$('.unit').forEach(b => { b.onclick = () => openUnit(+b.dataset.u); });
}

/* ---------- 단원 화면 ---------- */
function openUnit(id, tab) {
  cleanup();
  const u = UNITS.find(x => x.id === id);
  tab = tab || (u.lesson ? 'learn' : 'quiz');
  cur.unit = u;
  view.innerHTML = `
    <div class="uhead" style="--uc:${u.color}">
      <button class="btn ghost" id="back">← 단원 목록</button>
      <div class="utt"><span class="uico">${u.icon}</span><div><div class="uno">${u.id}단계</div><h1>${u.title}</h1></div></div>
      <div class="tabs">
        ${u.lesson ? `<button class="tab ${tab === 'learn' ? 'on' : ''}" data-t="learn">📖 개념 배우기</button>` : ''}
        <button class="tab ${tab === 'quiz' ? 'on' : ''}" data-t="quiz">✏️ 문제 풀기</button>
      </div>
    </div>
    <div id="ubody"></div>`;
  $('#back').onclick = renderHome;
  $$('.tab').forEach(b => { b.onclick = () => openUnit(id, b.dataset.t); });
  if (tab === 'learn') {
    $('#ubody').innerHTML = '<div class="card lesson"></div>';
    cur.player = new Player($('.lesson'), u.lesson(), { doneLabel: '✏️ 문제 풀러 가기', onDone: () => openUnit(id, 'quiz') });
  } else startPractice(u);
}

/* ---------- 문제 풀기 ---------- */
function startPractice(u) {
  const list = []; for (let i = 0; i < 10; i++) list.push(u.gen(i));
  cur.practice = { u, list, idx: 0, score: 0, results: [] };
  renderProblem();
}
const slotOrder = p => (p.kind === 'int' ? ['v'] : ['n', 'd', 'w'].filter(s => p.slots.includes(s)));

function answerHTML(p) {
  if (p.kind === 'frac') return `<span class="ans">${p.slots.includes('w') ? '<button class="slot sw" data-s="w" aria-label="자연수 칸"></button>' : ''}<span class="ansv"><button class="slot" data-s="n" aria-label="분자 칸"></button><span class="ansbar"></span><button class="slot" data-s="d" aria-label="분모 칸"></button></span></span>`;
  if (p.kind === 'int') return `<span class="ans">${p.expr ? '<span class="bxl"><span class="bx"></span> =</span>' : ''}<button class="slot" data-s="v" aria-label="답 칸"></button></span>`;
  if (p.kind === 'tap') return `<span class="tapinfo">👆 칸을 누르거나 드래그해서 색칠해요 · 색칠한 칸: <b id="tapCount">0</b>칸</span>`;
  return '';
}

function renderProblem() {
  const pr = cur.practice, p = pr.list[pr.idx];
  Object.assign(pr, { tries: 0, done: false, input: { w: '', n: '', d: '', v: '' }, choice: null, taps: new Set() });
  const needPad = p.kind === 'frac' || p.kind === 'int';
  pr.active = needPad ? slotOrder(p)[0] : null;
  $('#ubody').innerHTML = `
    <div class="pbar">${pr.list.map((_, i) => `<i class="${i < pr.idx ? (pr.results[i] ? 'ok' : 'no') : i === pr.idx ? 'now' : ''}"></i>`).join('')}<span>${pr.idx + 1} / ${pr.list.length}</span></div>
    <div class="pgrid ${needPad ? '' : 'nopad'}">
      <section class="card qcard">
        <div class="qhead"><span class="qno">문제 ${pr.idx + 1}</span><button class="btn ghost sm" id="qSpeak">🔊 문제 듣기</button></div>
        <p class="prompt">${fmt(p.prompt)}</p>
        ${p.visual ? '<div class="visual"><svg id="qvis"></svg></div>' : ''}
        <div class="qexpr">${p.expr ? `<span class="expr">${fmt(p.expr)}</span>` : ''}${answerHTML(p)}</div>
        ${p.kind === 'frac' && p.slots.includes('w') ? '<p class="tip">왼쪽 점선 칸(자연수)은 필요할 때만 써요.</p>' : ''}
        ${p.kind === 'choice' ? `<div class="choices">${p.options.map((o, i) => `<button class="choice" data-i="${i}">${esc(o.label)}</button>`).join('')}</div>` : ''}
        <div class="feedback" id="fb"></div>
        ${needPad ? '' : '<div class="qact"><button class="btn pri lg" id="btnCheck">확인</button></div>'}
      </section>
      ${needPad ? `
      <aside class="card ipanel">
        <div class="seg" id="modeSeg"><button data-m="pad">🔢 숫자패드</button><button data-m="draw">✍️ 손글씨</button></div>
        <div id="padBox"></div>
        <button class="btn pri lg" id="btnCheck">확인</button>
      </aside>` : ''}
    </div>`;
  const speak = () => Voice.speak(spk(p.prompt + (p.expr ? ' ' + p.expr.replace(/=\s*$/, '') : '')));
  $('#qSpeak').onclick = speak;
  $('#btnCheck').onclick = onCheck;
  if (p.kind === 'tap') drawTap(p, pr); else if (p.visual) p.visual($('#qvis'));
  $$('.slot').forEach(b => { b.onclick = () => { if (!pr.done) { pr.active = b.dataset.s; refreshSlots(); } }; });
  $$('.choice').forEach(b => { b.onclick = () => {
    if (pr.done) return;
    pr.choice = p.options[+b.dataset.i].value;
    $$('.choice').forEach(x => x.classList.toggle('on', x === b));
    const c = $('.qexpr .circ'); if (c) c.textContent = p.options[+b.dataset.i].label;
  }; });
  if (needPad) {
    $$('#modeSeg button').forEach(b => { b.onclick = () => { settings.input = b.dataset.m; applySettings(); renderPad(); }; });
    renderPad(); refreshSlots();
  }
  speak();
}

function drawTap(p, pr) {
  const S = new Scene($('#qvis'), 800, 200); let cells;
  if (p.shape === 'pizza') cells = S.pizza({ cx: 400, cy: 100, r: 86, n: p.n, fill: 0 }).slices.map(s => ({ el: s.el, paint: s.p, dot: s.dot }));
  else cells = S.bar({ x: 160, y: 65, w: 480, h: 70, n: p.n, fill: 0 }).cells.map(c => ({ el: c.el, paint: c.el }));
  pr.taps = dragBoard($('#qvis'), cells, LOOK[p.shape], cnt => { $('#tapCount').textContent = cnt; }, () => pr.done);
}

function refreshSlots() {
  const pr = cur.practice;
  $$('.slot').forEach(b => {
    const s = b.dataset.s;
    b.textContent = pr.input[s];
    b.classList.toggle('on', s === pr.active && !pr.done);
  });
}
function typeDigit(ch) {
  const pr = cur.practice; if (!pr || pr.done || !pr.active) return;
  const v = pr.input[pr.active];
  if (v.length >= 3) return;
  pr.input[pr.active] = v === '0' ? ch : v + ch; refreshSlots();
}
function delDigit() {
  const pr = cur.practice; if (!pr || pr.done || !pr.active) return;
  pr.input[pr.active] = pr.input[pr.active].slice(0, -1); refreshSlots();
}
function nextSlot() {
  const pr = cur.practice; if (!pr || pr.done || !pr.active) return;
  const o = slotOrder(pr.list[pr.idx]);
  pr.active = o[(o.indexOf(pr.active) + 1) % o.length]; refreshSlots();
}

function renderPad() {
  const box = $('#padBox'); if (!box) return;
  $$('#modeSeg button').forEach(b => b.classList.toggle('on', b.dataset.m === settings.input));
  if (settings.input === 'pad') {
    box.innerHTML = `<div class="numpad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'next'].map(k =>
      `<button class="key ${k.length > 1 ? 'fn' : ''}" data-k="${k}">${k === 'del' ? '⌫' : k === 'next' ? '다음 칸' : k}</button>`).join('')}</div>`;
  } else {
    box.innerHTML = `
      <div class="draw"><canvas aria-label="손글씨 입력 칸"></canvas><span class="dhint">여기에 숫자를 써요</span></div>
      <p class="dres" id="dres">색이 켜진 칸에 들어갈 수를 쓰면 자동으로 읽어요.</p>
      <div class="numpad two"><button class="key fn" data-k="del">⌫ 지우기</button><button class="key fn" data-k="next">다음 칸</button></div>`;
    mountDraw(box);
  }
  $$('.key', box).forEach(b => { b.onclick = () => { const k = b.dataset.k; if (k === 'del') delDigit(); else if (k === 'next') nextSlot(); else typeDigit(k); }; });
}

function mountDraw(box) {
  const cv = $('canvas', box), ctx = cv.getContext('2d'), hint = $('.dhint', box);
  const dpr = window.devicePixelRatio || 1;
  cv.width = Math.max(50, Math.round(cv.clientWidth * dpr)); cv.height = Math.max(50, Math.round(cv.clientHeight * dpr));
  let strokes = [], s = null, timer = null;
  const pos = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; };
  const finish = () => {
    const txt = HW.read(strokes).slice(0, 3);
    strokes = []; ctx.clearRect(0, 0, cv.width, cv.height); hint.hidden = false;
    const pr = cur.practice, res = $('#dres');
    if (!pr || pr.done || !res) return;
    if (!txt) { res.textContent = '잘 못 읽었어요. 조금 더 크게 써 볼까요?'; return; }
    pr.input[pr.active] = String(+txt);
    res.innerHTML = `읽은 숫자: <b>${+txt}</b> · 다르면 다시 쓰면 고쳐져요.`;
    const o = slotOrder(pr.list[pr.idx]), nx = o[o.indexOf(pr.active) + 1];
    if (nx && nx !== 'w' && pr.input[nx] === '') pr.active = nx;
    refreshSlots();
  };
  cv.addEventListener('pointerdown', e => {
    if (!cur.practice || cur.practice.done) return;
    e.preventDefault(); cv.setPointerCapture(e.pointerId); clearTimeout(timer);
    hint.hidden = true; s = [pos(e)]; strokes.push(s);
  });
  cv.addEventListener('pointermove', e => {
    if (!s) return;
    const p = pos(e), q = s[s.length - 1];
    ctx.lineWidth = Math.max(4, cv.height / 28); ctx.lineCap = 'round'; ctx.strokeStyle = '#1F2A44';
    ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    s.push(p);
  });
  const up = () => { if (!s) return; s = null; clearTimeout(timer); timer = setTimeout(finish, 900); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
}

function onCheck() {
  const pr = cur.practice; if (!pr) return;
  if (pr.done) { nextProblem(); return; }
  const p = pr.list[pr.idx], fb = $('#fb');
  const r = checkAnswer(p, p.kind === 'choice' ? pr.choice : p.kind === 'tap' ? pr.taps.size : pr.input);
  const demoBtn = p.demo ? '<button class="btn sm" id="fbDemo">🎬 그림으로 보기</button>' : '';
  if (r.incomplete) { fb.className = 'feedback warn show'; fb.innerHTML = esc(r.msg); return; }
  if (r.ok) {
    pr.done = true; pr.results[pr.idx] = true; pr.score++;
    fb.className = 'feedback ok show';
    fb.innerHTML = `<b>🎉 정답이에요!</b> ${r.note ? fmt(r.note) : ''}<p>${fmt(p.explain)}</p>${demoBtn}`;
    party(false); Voice.speak(pick(['정답이에요!', '잘했어요!', '훌륭해요!']));
  } else if (++pr.tries >= 2) {
    pr.done = true; pr.results[pr.idx] = false;
    fb.className = 'feedback no show';
    fb.innerHTML = `<b>정답: ${fmt(ansText(p))}</b><p>${fmt(p.explain)}</p>${demoBtn}`;
    Voice.speak('풀이를 함께 확인해 봐요.');
  } else {
    fb.className = 'feedback warn show';
    fb.innerHTML = `<b>🤔 다시 한번 생각해 봐요.</b> ${r.msg ? fmt(r.msg) : '한 번 더 도전할 수 있어요.'}`;
    Voice.speak('다시 한번 생각해 봐요.');
  }
  if (pr.done) {
    $('#btnCheck').textContent = pr.idx < pr.list.length - 1 ? '다음 문제 ▶' : '결과 보기 ▶';
    refreshSlots();
    const d = $('#fbDemo'); if (d) d.onclick = () => openDemo(p);
  }
}
function nextProblem() {
  const pr = cur.practice;
  if (pr.idx < pr.list.length - 1) { pr.idx++; Voice.stop(); renderProblem(); window.scrollTo(0, 0); }
  else showResults();
}
function showResults() {
  const pr = cur.practice, s = pr.score, st = s >= 9 ? 3 : s >= 7 ? 2 : s >= 4 ? 1 : 0, u = pr.u;
  const prev = progress[u.id] || {};
  progress[u.id] = { stars: Math.max(prev.stars || 0, st), best: Math.max(prev.best || 0, s) };
  store.set('fr.progress', progress);
  const msg = ['괜찮아요! 개념을 다시 보고 한 번 더 도전해요.', '좋아요! 조금만 더 연습하면 돼요.', '잘했어요! 거의 다 익혔어요.', '완벽해요! 다음 단계로 가 볼까요?'][st];
  const nextU = UNITS.find(x => x.id === u.id + 1);
  $('#ubody').innerHTML = `
    <div class="card result">
      <div class="bigstars">${stars(st)}</div>
      <h2>10문제 중 <em>${s}</em>문제 정답</h2>
      <p>${msg}</p>
      <div class="row center">
        <button class="btn lg" id="rAgain">↺ 다시 풀기</button>
        ${u.lesson ? '<button class="btn lg" id="rLearn">📖 개념 다시 보기</button>' : ''}
        ${nextU ? '<button class="btn pri lg" id="rNext">다음 단계 ▶</button>' : '<button class="btn pri lg" id="rHome">단원 목록</button>'}
      </div>
    </div>`;
  cur.practice = null;
  $('#rAgain').onclick = () => openUnit(u.id, 'quiz');
  if ($('#rLearn')) $('#rLearn').onclick = () => openUnit(u.id, 'learn');
  if ($('#rNext')) $('#rNext').onclick = () => openUnit(nextU.id);
  if ($('#rHome')) $('#rHome').onclick = renderHome;
  if (st >= 2) party(true);
  Voice.speak(`10문제 중 ${s}문제를 맞혔어요. ${msg}`);
}

/* ---------- 모달 ---------- */
function openModal(title, cls) {
  closeModal();
  const root = $('#modalRoot');
  root.innerHTML = `<div class="mback"><div class="modal ${cls || ''}" role="dialog" aria-modal="true"><div class="mhead"><h2>${title}</h2><button class="btn ghost" id="mClose" aria-label="닫기">✕</button></div><div class="mbody"></div></div></div>`;
  $('#mClose').onclick = closeModal;
  $('.mback').addEventListener('pointerdown', e => { if (e.target.classList.contains('mback')) closeModal(); });
  cur.modal = {};
  return $('.mbody', root);
}
function closeModal() {
  if (!cur.modal) return;
  if (cur.modal.player) cur.modal.player.destroy();
  cur.modal = null; $('#modalRoot').innerHTML = '';
}
function openDemo(p) {
  const body = openModal('그림으로 보기', 'wide');
  cur.modal.player = new Player(body, p.demo(), { doneLabel: '닫기', onDone: closeModal });
}

function openSettings() {
  const body = openModal('설정');
  const draw = () => {
    body.innerHTML = `
      <div class="set"><h3>글자 크기</h3>
        <div class="seg" id="sFont">${FONT_NAME.map((n, i) => `<button data-v="${i}" class="${settings.font === i ? 'on' : ''}" style="font-size:${0.75 + i * 0.12}rem">${n}</button>`).join('')}</div></div>
      <div class="set"><h3>화면 크기 <span class="val">${settings.zoom}%</span></h3>
        <div class="row"><button class="btn" id="zDown">−</button><input type="range" id="sZoom" min="70" max="150" step="10" value="${settings.zoom}" aria-label="화면 크기"><button class="btn" id="zUp">+</button><button class="btn" id="sFull">⛶ 전체 화면</button></div></div>
      <div class="set"><h3>목소리</h3>
        <div class="seg" id="sVoice">${[['female', '👩 여자'], ['male', '👨 남자'], ['off', '🔇 끄기']].map(([v, n]) => `<button data-v="${v}" class="${settings.voice === v ? 'on' : ''}">${n}</button>`).join('')}</div>
        <div class="row"><label for="sRate">말하는 빠르기</label><input type="range" id="sRate" min="0.6" max="1.3" step="0.05" value="${settings.rate}"><button class="btn" id="sTest">▶ 미리 듣기</button></div>
        <p class="tip" id="vNote"></p></div>
      <div class="set"><h3>답 입력 방법</h3>
        <div class="seg" id="sInput">${[['pad', '🔢 숫자패드'], ['draw', '✍️ 손글씨(터치패드)']].map(([v, n]) => `<button data-v="${v}" class="${settings.input === v ? 'on' : ''}">${n}</button>`).join('')}</div>
        <p class="tip">키보드 숫자 키, ⌫, Enter(확인), Tab(다음 칸)도 쓸 수 있어요.</p></div>
      <div class="set"><h3>학습 기록</h3><button class="btn" id="sReset">별 기록 지우기</button></div>`;
    const set = (k, v) => { settings[k] = v; applySettings(); draw(); if (k === 'input') renderPad(); };
    $$('#sFont button').forEach(b => { b.onclick = () => set('font', +b.dataset.v); });
    $$('#sVoice button').forEach(b => { b.onclick = () => { set('voice', b.dataset.v); test(); }; });
    $$('#sInput button').forEach(b => { b.onclick = () => set('input', b.dataset.v); });
    $('#sZoom').onchange = e => set('zoom', +e.target.value);
    $('#zDown').onclick = () => set('zoom', clamp(settings.zoom - 10, 70, 150));
    $('#zUp').onclick = () => set('zoom', clamp(settings.zoom + 10, 70, 150));
    $('#sRate').onchange = e => { settings.rate = +e.target.value; applySettings(); test(); };
    $('#sFull').onclick = toggleFull;
    $('#sTest').onclick = test;
    $('#sReset').onclick = () => { if (confirm('모은 별 기록을 모두 지울까요?')) { progress = {}; store.set('fr.progress', progress); if (!cur.unit || !$('#ubody')) renderHome(); closeModal(); } };
    const note = $('#vNote');
    if (!Voice.ok) note.textContent = '이 브라우저는 음성 안내를 지원하지 않아요.';
    else if (settings.voice !== 'off') {
      const c = Voice.choose(settings.voice);
      note.textContent = !c.voice ? '기기에 한국어 목소리가 없으면 소리가 나지 않을 수 있어요.' : c.exact ? `사용 중인 목소리: ${c.voice.name}` : `이 기기에는 ${settings.voice === 'male' ? '남자' : '여자'} 목소리가 따로 없어, 음높이를 조절해 들려줘요. (${c.voice.name})`;
    }
  };
  const test = () => Voice.speak('안녕하세요? 4분의 3은, 전체를 똑같이 4로 나눈 것 중의 3이에요.');
  draw();
}
function toggleFull() {
  if (document.fullscreenElement) document.exitFullscreen();
  else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
}

/* ---------- 학습지 출력 ---------- */
function openPrint() {
  const body = openModal('학습지 출력');
  const pre = cur.unit && $('#ubody') ? [cur.unit.id] : [];
  body.innerHTML = `
    <div class="set"><h3>단원 고르기</h3>
      <div class="checks">${UNITS.filter(u => u.id < 10).map(u => `<label><input type="checkbox" value="${u.id}" ${!pre.length || pre.includes(u.id) ? 'checked' : ''}> ${u.id}. ${u.title}</label>`).join('')}</div>
      <div class="row"><button class="btn sm" id="pAll">모두 선택</button><button class="btn sm" id="pNone">모두 해제</button></div></div>
    <div class="set"><h3>문제 수</h3><div class="seg" id="pCount">${[10, 20, 30].map(n => `<button data-v="${n}" class="${n === 20 ? 'on' : ''}">${n}문제</button>`).join('')}</div></div>
    <div class="set"><label class="chk"><input type="checkbox" id="pAns" checked> 정답과 풀이를 마지막 쪽에 함께 출력</label></div>
    <div class="row end"><button class="btn pri lg" id="pGo">🖨 출력하기</button></div>
    <p class="tip">인쇄 창에서 ‘PDF로 저장’을 고르면 파일로도 받을 수 있어요.</p>`;
  let count = 20;
  $$('#pCount button').forEach(b => { b.onclick = () => { count = +b.dataset.v; $$('#pCount button').forEach(x => x.classList.toggle('on', x === b)); }; });
  $('#pAll').onclick = () => $$('.checks input', body).forEach(c => { c.checked = true; });
  $('#pNone').onclick = () => $$('.checks input', body).forEach(c => { c.checked = false; });
  $('#pGo').onclick = () => {
    const ids = $$('.checks input:checked', body).map(c => +c.value);
    if (!ids.length) { alert('단원을 하나 이상 골라 주세요.'); return; }
    buildSheet(ids, count, $('#pAns').checked);
    Voice.stop();
    setTimeout(() => window.print(), 80);
  };
}
function buildSheet(ids, count, withAns) {
  const per = Math.ceil(count / ids.length), probs = [];
  ids.forEach(id => { const u = UNITS.find(x => x.id === id); for (let j = 0; j < per && probs.length < count; j++) probs.push(u.gen(Math.min(9, Math.floor(j / per * 10)))); });
  const blank = p => p.kind === 'frac' ? `<span class="ans pr">${p.slots.includes('w') && p.ans.w ? '<span class="slot sw"></span>' : ''}${p.ans.n === 0 ? '<span class="slot"></span>' : '<span class="ansv"><span class="slot"></span><span class="ansbar"></span><span class="slot"></span></span>'}</span>`
    : p.kind === 'int' ? (p.expr ? '' : '<span class="ans pr"><span class="slot"></span></span>')
    : p.kind === 'choice' && p.options === KINDS ? '<span class="popt">( 진분수 · 가분수 · 대분수 )</span>' : '';
  const names = ids.map(id => UNITS.find(u => u.id === id).title).join(' · ');
  $('#printSheet').innerHTML = `
    <div class="sheet">
      <header class="sh"><h1>분수 익히기 학습지</h1><p>${names}</p>
        <div class="shinfo"><span>이름: <u></u></span><span>날짜: <u></u></span><span>점수: <u class="short"></u> / ${probs.length}</span></div></header>
      <ol class="plist">${probs.map((p, i) => `<li><div class="pp">${fmt(p.prompt)}</div>${p.visual ? `<svg class="pv" data-i="${i}"></svg>` : ''}<div class="pe">${p.expr ? fmt(p.expr) : ''} ${blank(p)}</div></li>`).join('')}</ol>
    </div>
    ${withAns ? `<div class="sheet anskey"><header class="sh"><h1>정답과 풀이</h1></header><ol class="alist">${probs.map(p => `<li><b>${fmt(ansText(p))}</b><span>${fmt(p.explain)}</span></li>`).join('')}</ol></div>` : ''}`;
  $$('#printSheet .pv').forEach(svg => probs[+svg.dataset.i].visual(svg));
}

/* ---------- 공통 버튼 · 키보드 ---------- */
$('#btnHome').onclick = () => { closeModal(); cur.unit = null; renderHome(); };
$('#fsDown').onclick = () => { settings.font = clamp(settings.font - 1, 0, 4); applySettings(); };
$('#fsUp').onclick = () => { settings.font = clamp(settings.font + 1, 0, 4); applySettings(); };
$('#zmDown').onclick = () => { settings.zoom = clamp(settings.zoom - 10, 70, 150); applySettings(); };
$('#zmUp').onclick = () => { settings.zoom = clamp(settings.zoom + 10, 70, 150); applySettings(); };
$('#btnVoice').onclick = () => {
  settings.voice = { female: 'male', male: 'off', off: 'female' }[settings.voice]; applySettings();
  if (settings.voice === 'off') Voice.stop(); else Voice.speak(settings.voice === 'male' ? '남자 목소리로 안내할게요.' : '여자 목소리로 안내할게요.');
};
$('#btnPrint').onclick = openPrint;
$('#btnSettings').onclick = openSettings;

document.addEventListener('keydown', e => {
  if (cur.modal) { if (e.key === 'Escape') closeModal(); return; }
  const pr = cur.practice; if (!pr || !$('#btnCheck') || e.ctrlKey || e.metaKey || e.altKey) return;
  if (/^[0-9]$/.test(e.key)) typeDigit(e.key);
  else if (e.key === 'Backspace') { e.preventDefault(); delDigit(); }
  else if (e.key === 'Enter') { e.preventDefault(); onCheck(); }
  else if ((e.key === 'Tab' || e.key === 'ArrowRight' || e.key === 'ArrowDown') && pr.active && !pr.done) { e.preventDefault(); nextSlot(); }
});

applySettings();
/* 주소 끝에 #5 (5단계 개념) 또는 #5q (5단계 문제) 를 붙이면 바로 그 단원이 열림 */
(() => {
  const m = /^#(\d+)(q?)$/.exec(location.hash), u = m && UNITS.find(x => x.id === +m[1]);
  if (u) openUnit(u.id, m[2] ? 'quiz' : null); else renderHome();
})();
