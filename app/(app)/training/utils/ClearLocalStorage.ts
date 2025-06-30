export const ClearLocalStorage = () => {
  const keysToRemove = [
    "timer:gym",
    "startTime",
    "activeSession",
    "gym_session_draft",
  ];

  keysToRemove.forEach((key) => {
    localStorage.removeItem(key);
  });
};
