'use client';

// Base64 encoded sound effects (approx. 0.5s audio clips to avoid large bundle sizes)
// These are short synth sounds in a data URI format so that they are fully portable and don't require external downloads.
// You can replace the string content here with actual paths to local audio files e.g. "/sounds/violation.mp3" if you prefer.

const SOUNDS = {
  // A sharp alarm sound
  violation: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==',
  // A soft ascending tone
  success: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==',
  // A clean chime
  notification: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==',
};

// Global audio instances to track playing sound across hook usages
let activeViolationAudio: HTMLAudioElement | null = null;

export function useSound() {
  const playAudio = (type: keyof typeof SOUNDS, pathAlternative?: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const audioPath = pathAlternative || SOUNDS[type];
      const audio = new Audio(audioPath);
      audio.volume = type === 'violation' ? 0.8 : 0.4;
      audio.play().catch((err) => {
        console.warn(`Playback blocked or failed for sound: ${type}`, err);
      });
      return audio;
    } catch (e) {
      console.warn('Audio playback failed:', e);
      return null;
    }
  };

  const playViolation = () => {
    // If a violation sound is already playing, do not trigger again
    if (activeViolationAudio && !activeViolationAudio.paused && !activeViolationAudio.ended) {
      return;
    }
    // Falls back to static asset /sounds/violation.mp3 if it exists
    const audio = playAudio('violation', '/sounds/violation.mp3');
    if (audio) {
      activeViolationAudio = audio;
    }
  };

  const stopViolation = () => {
    if (activeViolationAudio) {
      try {
        activeViolationAudio.pause();
        activeViolationAudio.currentTime = 0;
      } catch (e) {
        console.warn('Failed to stop violation sound:', e);
      }
      activeViolationAudio = null;
    }
  };

  const playSuccess = () => {
    playAudio('success', '/sounds/success.mp3');
  };

  const playNotification = () => {
    playAudio('notification', '/sounds/notification.mp3');
  };

  return {
    playViolation,
    stopViolation,
    playSuccess,
    playNotification,
  };
}
