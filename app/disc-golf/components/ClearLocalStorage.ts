export const clearLocalStorage = () => {
  const keysToRemove = [
    "holes",
    "setupData",
    "startTime",
    "trackStats",
    "numHoles",
    "timer:disc-golf",
    "activeSession",
    "viewingHoleNumber",
  ];

  keysToRemove.forEach((key) => {
    localStorage.removeItem(key);
  });
};
