import {
  BaseToast,
  BaseToastProps,
  ErrorToast,
} from "react-native-toast-message";
import { JSX } from "react/jsx-runtime";

// Custom Toast Configuration

export const toastConfig = {
  success: (props: JSX.IntrinsicAttributes & BaseToastProps) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: "green" }}
      contentContainerStyle={{
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: "#1C2431",
      }}
      text1Style={{
        fontSize: 18,
        fontWeight: "400",
        color: "#f3f4f6",
      }}
      text2Style={{
        fontSize: 15,
        color: "#f3f4f6",
      }}
    />
  ),

  info: (props: JSX.IntrinsicAttributes & BaseToastProps) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: "#3b82f6" }}
      contentContainerStyle={{
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: "#1C2431",
      }}
      text1Style={{
        fontSize: 18,
        fontWeight: "400",
        color: "#f3f4f6",
      }}
      text2Style={{
        fontSize: 15,
        color: "#f3f4f6",
      }}
    />
  ),

  error: (props: JSX.IntrinsicAttributes & BaseToastProps) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: "#ef4444" }}
      contentContainerStyle={{
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: "#1C2431",
      }}
      text1Style={{
        fontSize: 18,
        fontWeight: "400",
        color: "#ef4444",
      }}
      text2Style={{
        fontSize: 15,
        color: "#f3f4f6",
      }}
    />
  ),
};
