import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { Linking } from 'react-native';
import { QuickLinksWidget } from '@/features/widgets/QuickLinksWidget';
import { StepsWidget } from '@/features/widgets/StepsWidget';
import {
  getQuickLinksConfig,
  getStepsConfig,
  deleteWidgetConfig,
} from '@/features/widgets/widget-storage';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetInfo = props.widgetInfo;
  const widgetName = widgetInfo.widgetName;

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      if (widgetName === 'QuickLinks') {
        const config = await getQuickLinksConfig(widgetInfo.widgetId);
        props.renderWidget(
          <QuickLinksWidget config={config} widgetInfo={widgetInfo} />,
        );
      } else if (widgetName === 'Steps') {
        const config = await getStepsConfig(widgetInfo.widgetId);
        props.renderWidget(
          <StepsWidget config={config} widgetInfo={widgetInfo} />,
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
        props.renderWidget(
          <StepsWidget config={config} widgetInfo={widgetInfo} />,
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
