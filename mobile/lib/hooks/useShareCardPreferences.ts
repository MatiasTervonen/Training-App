import { useCallback, useSyncExternalStore } from "react";
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

type StoreState = Preferences & { isLoaded: boolean };

let store: StoreState = { ...DEFAULTS, isLoaded: false };
const listeners = new Set<() => void>();

function getSnapshot(): StoreState {
  return store;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function emit() {
  listeners.forEach((cb) => cb());
}

function update(next: Preferences) {
  store = { ...next, isLoaded: true };
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emit();
}

// Load persisted preferences once at module init
AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
  let prefs = DEFAULTS;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<Preferences>;
      prefs = { ...DEFAULTS, ...parsed };
    } catch {
      // ignore parse errors
    }
  }
  store = { ...prefs, isLoaded: true };
  emit();
});

export default function useShareCardPreferences() {
  const { theme, size, isLoaded } = useSyncExternalStore(subscribe, getSnapshot);

  const setTheme = useCallback((t: ShareCardThemeId) => {
    update({ theme: t, size: store.size });
  }, []);

  const setSize = useCallback((s: ShareCardSize) => {
    update({ theme: store.theme, size: s });
  }, []);

  return { theme, size, setTheme, setSize, isLoaded };
}
