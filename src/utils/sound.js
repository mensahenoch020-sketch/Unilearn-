export const playNotif = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Pleasant two-tone chime: 880Hz → 1100Hz
    [[880, 0, 0.18], [1100, 0.16, 0.38]].forEach(([freq, start, end]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, ctx.currentTime + start);
      g.gain.linearRampToValueAtTime(0.18, ctx.currentTime + start + 0.025);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + end);
      o.start(ctx.currentTime + start);
      o.stop(ctx.currentTime + end + 0.05);
    });
  } catch (_) {}
};
