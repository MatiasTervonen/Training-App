import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { Linking } from 'react-native';
import { QuickLinksWidget } from '@/features/widgets/QuickLinksWidget';
import { StepsWidget } from '@/features/widgets/StepsWidget';
import {
  getQuickLinksConfig,
  getStepsConfig,
  getGlobalQuickLinksConfig,
  getGlobalStepsConfig,
  saveQuickLinksConfig,
  saveStepsConfig,
  deleteWidgetConfig,
} from '@/features/widgets/widget-storage';
import { getTodaySteps } from '@/native/android/NativeStepCounter';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetInfo = props.widgetInfo;
  const widgetName = widgetInfo.widgetName;

  switch (props.widgetAction) {
    case 'WIDGET_ADDED': {
      // Use global config for new widgets and save as per-instance config
      if (widgetName === 'QuickLinks') {
        const config = await getGlobalQuickLinksConfig();
        await saveQuickLinksConfig(widgetInfo.widgetId, config);
        props.renderWidget(
          <QuickLinksWidget config={config} widgetInfo={widgetInfo} />,
        );
      } else if (widgetName === 'Steps') {
        const config = await getGlobalStepsConfig();
        await saveStepsConfig(widgetInfo.widgetId, config);
        const steps = await getTodaySteps();
        props.renderWidget(
          <StepsWidget config={config} steps={steps} />,
        );
      }
      break;
    }
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      // Always read global config (the settings UI writes there) and sync to per-instance
      if (widgetName === 'QuickLinks') {
        const config = await getGlobalQuickLinksConfig();
        await saveQuickLinksConfig(widgetInfo.widgetId, config);
        props.renderWidget(
          <QuickLinksWidget config={config} widgetInfo={widgetInfo} />,
        );
      } else if (widgetName === 'Steps') {
        const config = await getGlobalStepsConfig();
        await saveStepsConfig(widgetInfo.widgetId, config);
        const steps = await getTodaySteps();
        props.renderWidget(
          <StepsWidget config={config} steps={steps} />,
        );
      }
      break;
    }
    case 'WIDGET_DELETED': {
      await deleteWidgetConfig(widgetInfo.widgetId);
      break;
    }
    case 'WIDGET_CLICK': {
      // Re-render Steps widget with fresh data before navigating
      if (widgetName === 'Steps') {
        const config = await getStepsConfig(widgetInfo.widgetId);
        const steps = await getTodaySteps();
        props.renderWidget(
          <StepsWidget config={config} steps={steps} />,
        );
      }
      // Deep-link to the target route
      const route =
        props.clickActionData?.route ?? props.clickAction;
      if (route) {
        Linking.openURL(`mytrack://${route}`);
      }
      break;
    }
  }
}
