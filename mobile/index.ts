import 'expo-router/entry';
import '@/features/habits/lib/stepGoalTask';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from '@/features/widgets/widget-task-handler';

registerWidgetTaskHandler(widgetTaskHandler);
