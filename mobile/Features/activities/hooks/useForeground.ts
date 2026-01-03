import { useState, useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";

export default function useForeground() {
  const [isForeground, setIsForeground] = useState(
    AppState.currentState === "active"
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      setIsForeground(state === "active");
    });

    return () => {
      sub.remove();
    };
  }, []);

  return {
    isForeground,
  };
}
