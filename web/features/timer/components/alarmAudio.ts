let alarmAudio: HTMLAudioElement | null = null;

export function getAlarmAudio() {
  if (typeof window === "undefined") return null;

  if (!alarmAudio) {
    alarmAudio = new Audio("/timer-audio/mixkit-classic-alarm-995.wav");
    alarmAudio.loop = true;
  }

  return alarmAudio;
}

export function playAlarmAudio() {
  const audio = getAlarmAudio();
  if (audio && audio.paused) {
    audio.play();
  }
}

export function stopAlarmAudio() {
  const audio = getAlarmAudio();
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
}
