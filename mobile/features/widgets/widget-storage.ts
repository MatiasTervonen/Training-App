import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  QuickLinksConfig,
  StepsConfig,
  DEFAULT_QUICK_LINKS_CONFIG,
  DEFAULT_STEPS_CONFIG,
} from "@/features/widgets/widget-constants";

const QUICK_LINKS_KEY = (widgetId: number) => `widget_quicklinks_${widgetId}`;
const STEPS_KEY = (widgetId: number) => `widget_steps_${widgetId}`;

const GLOBAL_QUICK_LINKS_KEY = "widget_quicklinks_global";
const GLOBAL_STEPS_KEY = "widget_steps_global";

export async function getQuickLinksConfig(
  widgetId: number,
): Promise<QuickLinksConfig> {
  const raw = await AsyncStorage.getItem(QUICK_LINKS_KEY(widgetId));

  if (!raw) {
    return DEFAULT_QUICK_LINKS_CONFIG;
  }

  return JSON.parse(raw) as QuickLinksConfig;
}

export async function saveQuickLinksConfig(
  widgetId: number,
  config: QuickLinksConfig,
): Promise<void> {
  await AsyncStorage.setItem(QUICK_LINKS_KEY(widgetId), JSON.stringify(config));
}

export async function getStepsConfig(widgetId: number): Promise<StepsConfig> {
  const raw = await AsyncStorage.getItem(STEPS_KEY(widgetId));

  if (!raw) {
    return DEFAULT_STEPS_CONFIG;
  }

  return JSON.parse(raw) as StepsConfig;
}

export async function saveStepsConfig(
  widgetId: number,
  config: StepsConfig,
): Promise<void> {
  await AsyncStorage.setItem(STEPS_KEY(widgetId), JSON.stringify(config));
}

export async function deleteWidgetConfig(widgetId: number): Promise<void> {
  await AsyncStorage.multiRemove([
    QUICK_LINKS_KEY(widgetId),
    STEPS_KEY(widgetId),
  ]);
}

// ── Global config (shared across all widget instances) ──

export async function getGlobalQuickLinksConfig(): Promise<QuickLinksConfig> {
  const raw = await AsyncStorage.getItem(GLOBAL_QUICK_LINKS_KEY);
  if (!raw) return DEFAULT_QUICK_LINKS_CONFIG;
  return JSON.parse(raw) as QuickLinksConfig;
}

export async function saveGlobalQuickLinksConfig(
  config: QuickLinksConfig,
): Promise<void> {
  await AsyncStorage.setItem(GLOBAL_QUICK_LINKS_KEY, JSON.stringify(config));
}

export async function getGlobalStepsConfig(): Promise<StepsConfig> {
  const raw = await AsyncStorage.getItem(GLOBAL_STEPS_KEY);
  if (!raw) return DEFAULT_STEPS_CONFIG;
  return JSON.parse(raw) as StepsConfig;
}

export async function saveGlobalStepsConfig(
  config: StepsConfig,
): Promise<void> {
  await AsyncStorage.setItem(GLOBAL_STEPS_KEY, JSON.stringify(config));
}
