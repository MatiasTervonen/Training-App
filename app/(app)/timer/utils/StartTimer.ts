export const startTimer = (title: string, notes: string, duration: number) => {
  if (duration <= 0) {
    alert("Please enter a valid timer duration.");
    return;
  }

  localStorage.removeItem("timer:isRunning");
  localStorage.removeItem("timer:timer");

  localStorage.setItem(
    "activeSession",
    JSON.stringify({
      type: "timer",
      title,
      notes,
      startedAt: new Date().toISOString(),
      path: "/timer/empty-timer",
    })
  );

  const now = Date.now();

  const timerData = {
    startTime: now,
    elapsedBeforePause: 0,
    isRunning: true,
  };
  localStorage.setItem(`timer:timer`, JSON.stringify(timerData));
  localStorage.setItem("timer:isRunning", "true");
};
