let interval = null;

self.onmessage = function (e) {
  const { type, startTimestamp, totalDuration, mode } = e.data;

  if (type === "start") {
    if (interval) clearInterval(interval);

    interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
      self.postMessage({ type: "tick", elapsed });

      if (mode === "countdown" && totalDuration > 0 && elapsed >= totalDuration) {
        clearInterval(interval);
        interval = null;
        self.postMessage({ type: "alarm" });
      }
    }, 1000);
  } else if (type === "stop") {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }
};
