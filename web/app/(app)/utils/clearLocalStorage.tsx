export function clearLocalStorage() {
  const keysToRemove = [
    "user-store",
    "timer-store",
    "notes_draft",
    "gym_session_draft",
    "setupData",
    "trackStats",
    "numHoles",
    "timer-store",
    "viewingHoleNumber",
    "timer_session_draft",
    "weight_draft",
  ];

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}
