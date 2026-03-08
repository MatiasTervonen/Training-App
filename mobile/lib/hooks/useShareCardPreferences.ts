import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ShareCardThemeId, ShareCardSize } from "@/lib/share/themes";

const STORAGE_KEY = "share_card_preferences";

type Preferences = {
  theme: ShareCardThemeId;
  size: ShareCardSize;
};

const DEFAULTS: Preferences = {
  theme: "classic",
  size: "square",
};

export default function useShareCardPreferences() {
  const [theme, setThemeState] = useState<ShareCardThemeId>(DEFAULTS.theme);
  const [size, setSizeState] = useState<ShareCardSize>(DEFAULTS.size);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Preferences;
          if (parsed.theme) setThemeState(parsed.theme);
          if (parsed.size) setSizeState(parsed.size);
        } catch {
          // ignore parse errors
        }
      }
      setIsLoaded(true);
    });
  }, []);

  const persist = useCallback((next: Preferences) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const setTheme = useCallback(
    (t: ShareCardThemeId) => {
      setThemeState(t);
      setSizeState((s) => {
        persist({ theme: t, size: s });
        return s;
      });
    },
    [persist],
  );

  const setSize = useCallback(
    (s: ShareCardSize) => {
      setSizeState(s);
      setThemeState((t) => {
        persist({ theme: t, size: s });
        return t;
      });
    },
    [persist],
  );

  return { theme, size, setTheme, setSize, isLoaded };
}
