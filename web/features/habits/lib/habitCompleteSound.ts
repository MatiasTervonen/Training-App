let audioContext: AudioContext | null = null;

function getContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

/**
 * Play a short success chime (two rising tones) when a habit is completed.
 */
export function playHabitCompleteSound() {
  try {
    const ctx = getContext();
    const now = ctx.currentTime;

    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

    // First tone
    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523, now); // C5
    osc1.connect(gain);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Second tone (higher)
    const gain2 = ctx.createGain();
    gain2.connect(ctx.destination);
    gain2.gain.setValueAtTime(0.3, now + 0.3);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 1.0);

    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(784, now + 0.3); // G5
    osc2.connect(gain2);
    osc2.start(now + 0.3);
    osc2.stop(now + 0.7);
  } catch {
    // Audio not supported
  }
}
