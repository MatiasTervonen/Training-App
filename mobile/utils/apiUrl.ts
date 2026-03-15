export const API_URL = __DEV__
  ? process.env.EXPO_PUBLIC_API_URL_DEV
  : process.env.EXPO_PUBLIC_API_URL_PROD;
