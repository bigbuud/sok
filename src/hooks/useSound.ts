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
  const playCorrect = useCallback(() => {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    // Vrolijk oplopend melodietje: C - E - G - C
    playTone(ctx, 523, now + 0.00, 0.15, 'sine', 0.3);
    playTone(ctx, 659, now + 0.12, 0.15, 'sine', 0.3);
    playTone(ctx, 784, now + 0.24, 0.15, 'sine', 0.3);
    playTone(ctx, 1047, now + 0.36, 0.30, 'sine', 0.35);
  }, []);

  const playWrong = useCallback(() => {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    // Zacht dalend geluidje, niet te hard/scherp
    playTone(ctx, 392, now + 0.00, 0.18, 'sine', 0.25);
    playTone(ctx, 330, now + 0.20, 0.25, 'sine', 0.2);
  }, []);

  return { playCorrect, playWrong };
};
