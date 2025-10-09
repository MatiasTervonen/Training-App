import * as Sentry from "@sentry/react-native";

export function handleError(
  error: unknown,
  context?: {
    message?: string;
    route?: string;
    method?: string;
  }
) {
  Sentry.withScope((scope) => {
    if (context?.message) {
      scope.setContext("details", { message: context.message });
    }
    if (context?.route) {
      scope.setTag("route", context.route);
    }
    if (context?.method) {
      scope.setTag("method", context.method);
    }
    Sentry.captureException(error);
  });
}
