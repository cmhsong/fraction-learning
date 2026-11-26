'use strict';
/* ---------- 음성 안내 (Web Speech API) : 여자 / 남자 / 끄기 ---------- */
const Voice = {
  voices: [], token: 0, timer: null,
  mode: () => 'female', rate: () => 1,          // app.js 에서 설정값으로 연결
  ok: 'speechSynthesis' in window,
  init() {
    if (!this.ok) return;
    const load = () => { this.voices = speechSynthesis.getVoices().filter(v => /^ko/i.test(v.lang)); };
    load();
    speechSynthesis.addEventListener('voiceschanged', load);
  },
  /* 기기에 설치된 한국어 목소리 중 성별에 맞는 것을 찾고, 없으면 음높이로 조절 */
  choose(gender) {
    const M = /injoon|hyunsu|bongjin|gookmin|minho|남성|남자|\bmale\b/i;
    const F = /sunhi|heami|jimin|seohyeon|soonbok|yujin|yuna|여성|여자|female|google/i;
    const want = gender === 'male' ? M : F, other = gender === 'male' ? F : M;
    const exact = this.voices.find(v => want.test(v.name) && !(gender === 'male' && /female/i.test(v.name)));
    if (exact) return { voice: exact, pitch: 1, exact: true };
    const any = this.voices.find(v => !other.test(v.name)) || this.voices[0] || null;
    return { voice: any, pitch: gender === 'male' ? 0.55 : 1.2, exact: false };
  },
  stop() {
    this.token++;
    clearTimeout(this.timer);
    if (this.ok) speechSynthesis.cancel();
  },
  speak(text, cb) {
    this.stop();
    const id = this.token;
    const done = () => { if (id === this.token && cb) { const f = cb; cb = null; f(); } };
    const mode = this.mode();
    if (!this.ok || mode === 'off') { this.timer = setTimeout(done, 1400 + text.length * 95); return; }
    const u = new SpeechSynthesisUtterance(text);
    const c = this.choose(mode);
    if (c.voice) u.voice = c.voice;
    u.lang = 'ko-KR'; u.pitch = c.pitch; u.rate = this.rate();
    u.onend = done; u.onerror = done;
    this._keep = u;                                // 일부 브라우저의 조기 GC 방지
    speechSynthesis.speak(u);
  }
};
