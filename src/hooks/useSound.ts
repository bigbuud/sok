import { useCallback } from 'react';

const playTone = (
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainValue = 0.3
) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(gainValue, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration);
};

export const useSound = () => {

  // 🎉 Super vrolijk fanfare-melodietje
  const playCorrect = useCallback(() => {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    // Oplopende fanfare met harmonie
    playTone(ctx, 659,  now + 0.00, 0.12, 'sine', 0.35);
    playTone(ctx, 784,  now + 0.10, 0.12, 'sine', 0.35);
    playTone(ctx, 880,  now + 0.20, 0.12, 'sine', 0.35);
    playTone(ctx, 1047, now + 0.30, 0.25, 'sine', 0.40);
    playTone(ctx, 1319, now + 0.30, 0.25, 'sine', 0.25);
    playTone(ctx, 1568, now + 0.58, 0.12, 'sine', 0.20);
    playTone(ctx, 2093, now + 0.68, 0.18, 'sine', 0.18);
    playTone(ctx, 523,  now + 0.00, 0.40, 'triangle', 0.10);
    playTone(ctx, 784,  now + 0.20, 0.40, 'triangle', 0.10);
  }, []);

  // 😅 Grappig zacht "oeps" geluidje
  const playWrong = useCallback(() => {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    playTone(ctx, 440, now + 0.00, 0.14, 'sine', 0.28);
    playTone(ctx, 370, now + 0.13, 0.14, 'sine', 0.25);
    playTone(ctx, 311, now + 0.26, 0.22, 'sine', 0.20);
    // boing effect
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.35);
    gain.gain.setValueAtTime(0.20, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.40);
    osc.start(now);
    osc.stop(now + 0.40);
  }, []);

  return { playCorrect, playWrong };
};
