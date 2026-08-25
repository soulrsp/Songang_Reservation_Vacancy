/**
 * Web Audio API를 이용한 브라우저 내장 사이렌 경보음 발생기
 * (별도 mp3/wav 파일 다운로드 없이 100% 브라우저에서 즉시 사운드 재생)
 */
export function playEmergencySiren() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();

    const playBeep = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    // 삐-뽀-삐-뽀 4연타 사이렌 효과
    playBeep(880, 0, 0.15);     // A5
    playBeep(1174.66, 0.18, 0.2); // D6
    playBeep(880, 0.4, 0.15);     // A5
    playBeep(1174.66, 0.58, 0.3); // D6
  } catch (e) {
    // Silent fail if audio is blocked by user interaction policy
  }
}
