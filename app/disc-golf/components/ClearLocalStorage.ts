export const clearLocalStorage = () => {
  const keysToRemove = [
    "activeSession",
    "holes",
    "setupData",
    "startTime",
    "trackStats",
    "numHoles",
    "timer:disc-golf",
    "activeSession",
    "viewingHoleNumber",
    "currentHole",
  ];

  keysToRemove.forEach((key) => {
    localStorage.removeItem(key);
  });
};
