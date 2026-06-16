'use client';

export function useSound() {
  const playTone = (frequency: number, type: OscillatorType, duration: number, volume: number = 0.1) => {
    if (typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = type;
      oscillator.frequency.value = frequency;
      
      gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('AudioContext playback blocked or failed:', e);
    }
  };

  const playViolation = () => {
    // Double beep with a sawtooth waveform (sharp alarm)
    playTone(880, 'sawtooth', 0.15, 0.04);
    setTimeout(() => playTone(880, 'sawtooth', 0.3, 0.04), 180);
  };

  const playSuccess = () => {
    // Soft ascending sine chime (success)
    playTone(523.25, 'sine', 0.1, 0.06); // C5
    setTimeout(() => playTone(659.25, 'sine', 0.1, 0.06), 80); // E5
    setTimeout(() => playTone(783.99, 'sine', 0.25, 0.06), 160); // G5
  };

  const playNotification = () => {
    // Triangle chime (clean notify beep)
    playTone(587.33, 'triangle', 0.12, 0.06); // D5
    setTimeout(() => playTone(880, 'triangle', 0.2, 0.06), 100); // A5
  };

  return {
    playViolation,
    playSuccess,
    playNotification,
  };
}
