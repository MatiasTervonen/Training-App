import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  QuickLinksConfig,
  StepsConfig,
  DEFAULT_QUICK_LINKS_CONFIG,
  DEFAULT_STEPS_CONFIG,
} from "@/features/widgets/widget-constants";

const QUICK_LINKS_KEY = (widgetId: number) => `widget_quicklinks_${widgetId}`;
const STEPS_KEY = (widgetId: number) => `widget_steps_${widgetId}`;

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
